import { z } from "zod";
import { eq, and, gte } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { qrCodes, wallets, transactions, notifications } from "@db/schema";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { verifyPassword } from "./lib/password";
import { randomBytes } from "crypto";

function generateTransactionId(): string {
  return "TXN" + Date.now().toString(36).toUpperCase() + randomBytes(4).toString("hex").toUpperCase();
}

export const qrRouter = createRouter({
  // Generate QR code for receiving payment
  generate: authedQuery
    .input(
      z
        .object({
          amount: z.number().positive().optional(),
          note: z.string().max(255).optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Get user's UPI ID (simplified - use user ID based)
      const upiId = `${ctx.user.phone || userId}@payease`;

      // Generate QR data
      const qrData = JSON.stringify({
        upiId,
        name: ctx.user.name || "PayEase User",
        amount: input?.amount,
        note: input?.note,
        timestamp: Date.now(),
      });

      const [result] = await db.insert(qrCodes).values({
        userId,
        qrData,
        amount: input?.amount ? input.amount.toFixed(2) : null,
        isDynamic: !!input?.amount,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return {
        success: true,
        qrId: result.insertId,
        qrData,
        upiId,
      };
    }),

  // Get my QR codes
  myQrs: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const now = new Date();

    return db
      .select()
      .from(qrCodes)
      .where(and(eq(qrCodes.userId, ctx.user.id), eq(qrCodes.isActive, true), gte(qrCodes.expiresAt, now)))
      .orderBy(gte(qrCodes.createdAt, new Date(0)));
  }),

  // Scan and pay via QR
  scanPay: authedQuery
    .input(
      z.object({
        qrData: z.string(),
        amount: z.number().positive(),
        pin: z.string().length(4),
        note: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Parse QR data
      let qrPayload: any;
      try {
        qrPayload = JSON.parse(input.qrData);
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid QR code" });
      }

      const receiverUpiId = qrPayload.upiId;
      const receiverName = qrPayload.name;
      const receiverUserId = qrPayload.userId;

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

      // Deduct from sender
      const newBalance = parseFloat(senderWallet.balance) - input.amount;
      await db
        .update(wallets)
        .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
        .where(eq(wallets.id, senderWallet.id));

      const txnId = generateTransactionId();

      // Create transaction
      await db.insert(transactions).values({
        transactionId: txnId,
        senderId: userId,
        receiverId: receiverUserId || null,
        receiverName: receiverName,
        receiverUpiId: receiverUpiId,
        type: "qr_payment",
        status: "completed",
        amount: input.amount.toFixed(2),
        description: `QR Payment to ${receiverName}`,
        remark: input.note || "",
        category: "shopping",
        paymentMethod: "wallet",
        completedAt: new Date(),
      });

      // Try to add to receiver if exists
      if (receiverUserId) {
        const receiverWallet = await db.query.wallets.findFirst({
          where: eq(wallets.userId, receiverUserId),
        });
        if (receiverWallet) {
          const receiverNewBalance = parseFloat(receiverWallet.balance) + input.amount;
          await db
            .update(wallets)
            .set({ balance: receiverNewBalance.toFixed(2), updatedAt: new Date() })
            .where(eq(wallets.id, receiverWallet.id));
        }
      }

      // Notifications
      await db.insert(notifications).values({
        userId,
        title: "QR Payment Successful",
        message: `₹${input.amount} paid to ${receiverName}`,
        type: "transaction",
      });

      return {
        success: true,
        transactionId: txnId,
        newBalance: newBalance.toFixed(2),
        receiverName,
      };
    }),
});
