import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { billPayments, transactions, wallets, notifications } from "@db/schema";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { verifyPassword } from "./lib/password";
import { randomBytes } from "crypto";

function generateTransactionId(): string {
  return "TXN" + Date.now().toString(36).toUpperCase() + randomBytes(4).toString("hex").toUpperCase();
}

export const billRouter = createRouter({
  // Get all bill payments for user
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(billPayments)
      .where(eq(billPayments.userId, ctx.user.id))
      .orderBy(desc(billPayments.createdAt));
  }),

  // Get bill by ID
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const bill = await db.query.billPayments.findFirst({
        where: eq(billPayments.id, input.id),
      });

      if (!bill || bill.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bill not found" });
      }

      return bill;
    }),

  // Pay bill
  payBill: authedQuery
    .input(
      z.object({
        billerId: z.string(),
        billerName: z.string(),
        category: z.enum([
          "electricity",
          "water",
          "gas",
          "broadband",
          "mobile",
          "dth",
          "insurance",
          "credit_card",
          "loan",
          "tax",
          "other",
        ]),
        consumerNumber: z.string(),
        amount: z.number().positive(),
        pin: z.string().length(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Get wallet
      const wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, userId),
      });

      if (!wallet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });
      }

      // Verify PIN
      if (!wallet.pinHash) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Please set your wallet PIN first" });
      }

      const validPin = await verifyPassword(input.pin, wallet.pinHash);
      if (!validPin) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid PIN" });
      }

      // Check balance
      if (parseFloat(wallet.balance) < input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      const txnId = generateTransactionId();

      // Deduct balance
      const newBalance = parseFloat(wallet.balance) - input.amount;
      await db
        .update(wallets)
        .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id));

      // Create transaction
      await db.insert(transactions).values({
        transactionId: txnId,
        senderId: userId,
        type: "pay_bill",
        status: "completed",
        amount: input.amount.toFixed(2),
        description: `Paid ${input.billerName} bill - ${input.consumerNumber}`,
        category: input.category === "mobile" || input.category === "dth" ? "recharge" : "bills",
        paymentMethod: "wallet",
        completedAt: new Date(),
      });

      // Create bill payment record
      const [billResult] = await db.insert(billPayments).values({
        userId,
        billerId: input.billerId,
        billerName: input.billerName,
        category: input.category,
        consumerNumber: input.consumerNumber,
        amount: input.amount.toFixed(2),
        status: "completed",
        transactionId: txnId,
      });

      // Notification
      await db.insert(notifications).values({
        userId,
        title: "Bill Paid",
        message: `${input.billerName} bill of ₹${input.amount} paid successfully`,
        type: "transaction",
      });

      return {
        success: true,
        transactionId: txnId,
        billId: billResult.insertId,
        newBalance: newBalance.toFixed(2),
      };
    }),

  // Fetch bill details (mock - in real app, integrate with biller APIs)
  fetchBill: authedQuery
    .input(
      z.object({
        billerId: z.string(),
        consumerNumber: z.string(),
      })
    )
    .query(async ({ input }) => {
      // Mock bill fetch - in production, integrate with actual biller APIs
      const mockBills = [
        {
          billerId: "ELEC_DISCOM_01",
          billerName: "State Electricity Board",
          category: "electricity",
          amount: 2450.0,
          billDate: "2026-04-15",
          dueDate: "2026-04-30",
        },
        {
          billerId: "WATER_MUNI_01",
          billerName: "Municipal Water Supply",
          category: "water",
          amount: 320.0,
          billDate: "2026-04-10",
          dueDate: "2026-04-25",
        },
        {
          billerId: "GAS_BHARAT_01",
          billerName: "Bharat Gas",
          category: "gas",
          amount: 850.0,
          billDate: "2026-04-20",
          dueDate: "2026-05-05",
        },
        {
          billerId: "BB_JIO_01",
          billerName: "Jio Fiber",
          category: "broadband",
          amount: 999.0,
          billDate: "2026-04-01",
          dueDate: "2026-04-30",
        },
      ];

      const bill = mockBills.find((b) => b.billerId === input.billerId);
      if (!bill) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bill not found for this consumer number" });
      }

      return { ...bill, consumerNumber: input.consumerNumber };
    }),
});
