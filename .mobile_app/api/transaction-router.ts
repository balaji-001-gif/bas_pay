import { z } from "zod";
import { eq, and, or, desc, sql, gte, lte } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { wallets, transactions, users, notifications } from "@db/schema";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { verifyPassword } from "./lib/password";
import { randomBytes } from "crypto";

function generateTransactionId(): string {
  return "TXN" + Date.now().toString(36).toUpperCase() + randomBytes(4).toString("hex").toUpperCase();
}

export const transactionRouter = createRouter({
  // Send money to another user by phone/UPI
  sendMoney: authedQuery
    .input(
      z.object({
        receiverPhone: z.string().optional(),
        receiverUpiId: z.string().optional(),
        amount: z.number().positive().max(100000),
        remark: z.string().max(255).optional(),
        pin: z.string().length(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      if (!input.receiverPhone && !input.receiverUpiId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Receiver phone or UPI ID required" });
      }

      // Get sender wallet
      const senderWallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, userId),
      });

      if (!senderWallet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });
      }

      // Verify PIN
      if (!senderWallet.pinHash) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Please set your wallet PIN first" });
      }

      const validPin = await verifyPassword(input.pin, senderWallet.pinHash);
      if (!validPin) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid PIN" });
      }

      // Check balance
      if (parseFloat(senderWallet.balance) < input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      // Find receiver
      let receiver: typeof users.$inferSelect | undefined;
      let receiverWallet: typeof wallets.$inferSelect | undefined;

      if (input.receiverUpiId) {
        // Search by UPI ID through users (simplified - in real app, check upiIds table)
        const allUsers = await db.select().from(users);
        // For demo, match any user as receiver or create a virtual receiver
        receiver = allUsers.find((u) => u.id !== userId);
      } else if (input.receiverPhone) {
        receiver = await db.query.users.findFirst({
          where: eq(users.phone, input.receiverPhone),
        });
      }

      if (!receiver) {
        // In a real app, handle external transfers; here we'll simulate
        // by treating it as a transfer to a "virtual" account
        // For demo purposes, let's just throw an error or allow demo transfers
        receiver = {
          id: 999999,
          name: input.receiverPhone || input.receiverUpiId || "Unknown",
          phone: input.receiverPhone || null,
          unionId: "virtual",
          email: null,
          avatar: null,
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignInAt: new Date(),
        } as typeof users.$inferSelect;
      }

      if (receiver.id === userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot send money to yourself" });
      }

      receiverWallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, receiver.id),
      });

      // Generate transaction ID
      const txnId = generateTransactionId();

      // Deduct from sender
      const senderNewBalance = parseFloat(senderWallet.balance) - input.amount;
      await db
        .update(wallets)
        .set({ balance: senderNewBalance.toFixed(2), updatedAt: new Date() })
        .where(eq(wallets.id, senderWallet.id));

      // Add to receiver if they have a wallet
      if (receiverWallet) {
        const receiverNewBalance = parseFloat(receiverWallet.balance) + input.amount;
        await db
          .update(wallets)
          .set({ balance: receiverNewBalance.toFixed(2), updatedAt: new Date() })
          .where(eq(wallets.id, receiverWallet.id));
      }

      // Create transaction record
      await db.insert(transactions).values({
        transactionId: txnId,
        senderId: userId,
        receiverId: receiver.id > 1000000 ? null : receiver.id,
        receiverPhone: input.receiverPhone || receiver.phone,
        receiverName: receiver.name || input.receiverUpiId,
        receiverUpiId: input.receiverUpiId,
        type: "send_money",
        status: "completed",
        amount: input.amount.toFixed(2),
        description: `Sent ₹${input.amount} to ${receiver.name || input.receiverPhone || input.receiverUpiId}`,
        remark: input.remark || "",
        category: "transfer",
        paymentMethod: "wallet",
        completedAt: new Date(),
      });

      // Create reverse transaction for receiver
      if (receiverWallet) {
        await db.insert(transactions).values({
          transactionId: "RCV" + txnId.slice(3),
          senderId: receiver.id,
          receiverId: userId,
          receiverPhone: ctx.user.phone,
          receiverName: ctx.user.name,
          type: "receive_money",
          status: "completed",
          amount: input.amount.toFixed(2),
          description: `Received ₹${input.amount} from ${ctx.user.name}`,
          remark: input.remark || "",
          category: "transfer",
          paymentMethod: "wallet",
          completedAt: new Date(),
        });

        // Notification for receiver
        await db.insert(notifications).values({
          userId: receiver.id,
          title: "Money Received",
          message: `You received ₹${input.amount} from ${ctx.user.name || "Someone"}`,
          type: "transaction",
        });
      }

      // Notification for sender
      await db.insert(notifications).values({
        userId: userId,
        title: "Money Sent",
        message: `₹${input.amount} sent successfully to ${receiver.name || input.receiverPhone || input.receiverUpiId}`,
        type: "transaction",
      });

      return {
        success: true,
        transactionId: txnId,
        amount: input.amount,
        newBalance: senderNewBalance.toFixed(2),
        receiverName: receiver.name,
      };
    }),

  // Get transaction history
  getHistory: authedQuery
    .input(
      z
        .object({
          type: z.enum(["send_money", "receive_money", "add_money", "withdraw", "pay_bill", "recharge", "qr_payment", "refund", "all"]).optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [or(eq(transactions.senderId, ctx.user.id), eq(transactions.receiverId, ctx.user.id))];

      if (input?.type && input.type !== "all") {
        conditions.push(eq(transactions.type, input.type));
      }

      if (input?.startDate) {
        conditions.push(gte(transactions.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        conditions.push(lte(transactions.createdAt, new Date(input.endDate)));
      }

      const txns = await db
        .select({
          id: transactions.id,
          transactionId: transactions.transactionId,
          type: transactions.type,
          status: transactions.status,
          amount: transactions.amount,
          currency: transactions.currency,
          description: transactions.description,
          remark: transactions.remark,
          category: transactions.category,
          paymentMethod: transactions.paymentMethod,
          receiverName: transactions.receiverName,
          receiverPhone: transactions.receiverPhone,
          receiverUpiId: transactions.receiverUpiId,
          completedAt: transactions.completedAt,
          createdAt: transactions.createdAt,
          senderId: transactions.senderId,
          receiverId: transactions.receiverId,
        })
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt))
        .limit(input?.limit || 20)
        .offset(input?.offset || 0);

      // Enrich with user info
      const enriched = await Promise.all(
        txns.map(async (txn) => {
          const isSender = txn.senderId === ctx.user.id;
          let otherParty = null;

          if (txn.receiverId && txn.receiverId !== ctx.user.id) {
            const user = await db.query.users.findFirst({
              where: eq(users.id, txn.receiverId),
              columns: { name: true, phone: true, avatar: true },
            });
            if (user) otherParty = user;
          } else if (txn.senderId && txn.senderId !== ctx.user.id) {
            const user = await db.query.users.findFirst({
              where: eq(users.id, txn.senderId),
              columns: { name: true, phone: true, avatar: true },
            });
            if (user) otherParty = user;
          }

          return {
            ...txn,
            direction: isSender ? "outgoing" : "incoming",
            otherParty,
          };
        })
      );

      return enriched;
    }),

  // Get transaction by ID
  getById: authedQuery
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const txn = await db.query.transactions.findFirst({
        where: eq(transactions.transactionId, input.transactionId),
      });

      if (!txn) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
      }

      // Verify ownership
      if (txn.senderId !== ctx.user.id && txn.receiverId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return txn;
    }),

  // Get transaction summary/stats
  getStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = await db
      .select({
        totalSent: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.senderId} = ${ctx.user.id} AND ${transactions.status} = 'completed' THEN ${transactions.amount} ELSE 0 END), 0)`,
        totalReceived: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.receiverId} = ${ctx.user.id} AND ${transactions.status} = 'completed' THEN ${transactions.amount} ELSE 0 END), 0)`,
        totalTransactions: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          or(eq(transactions.senderId, ctx.user.id), eq(transactions.receiverId, ctx.user.id)),
          gte(transactions.createdAt, startOfMonth)
        )
      );

    return stats[0];
  }),
});
