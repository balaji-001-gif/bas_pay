import { z } from "zod";
import { eq, and, sql, gte } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { wallets, transactions, notifications } from "@db/schema";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "./lib/password";
import { randomBytes } from "crypto";

function generateTransactionId(): string {
  return "TXN" + Date.now().toString(36).toUpperCase() + randomBytes(4).toString("hex").toUpperCase();
}

export const walletRouter = createRouter({
  // Get current user's wallet
  getWallet: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, ctx.user.id),
    });

    if (!wallet) {
      // Auto-create wallet for new user
      const [newWallet] = await db.insert(wallets).values({
        userId: ctx.user.id,
        balance: "1000.00", // Welcome bonus
      });
      return { ...newWallet, balance: "1000.00" };
    }

    return wallet;
  }),

  // Add money to wallet
  addMoney: authedQuery
    .input(
      z.object({
        amount: z.number().positive().max(100000),
        paymentMethod: z.enum(["upi", "card", "netbanking"]).default("upi"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, ctx.user.id),
      });

      if (!wallet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });
      }

      // Create transaction record
      const txnId = generateTransactionId();
      await db.insert(transactions).values({
        transactionId: txnId,
        senderId: ctx.user.id,
        type: "add_money",
        status: "completed",
        amount: input.amount.toFixed(2),
        paymentMethod: input.paymentMethod,
        description: `Added ₹${input.amount} via ${input.paymentMethod}`,
        completedAt: new Date(),
      });

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance) + input.amount;
      await db
        .update(wallets)
        .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id));

      // Create notification
      await db.insert(notifications).values({
        userId: ctx.user.id,
        title: "Money Added",
        message: `₹${input.amount} added to your wallet successfully`,
        type: "transaction",
      });

      return {
        success: true,
        transactionId: txnId,
        newBalance: newBalance.toFixed(2),
      };
    }),

  // Set/Update wallet PIN
  setPin: authedQuery
    .input(z.object({ pin: z.string().length(4).regex(/^\d+$/) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, ctx.user.id),
      });

      if (!wallet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });
      }

      const pinHash = await hashPassword(input.pin);

      await db
        .update(wallets)
        .set({ pinHash, updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id));

      return { success: true };
    }),

  // Verify PIN
  verifyPin: authedQuery
    .input(z.object({ pin: z.string().length(4) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, ctx.user.id),
      });

      if (!wallet || !wallet.pinHash) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PIN not set" });
      }

      const valid = await verifyPassword(input.pin, wallet.pinHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid PIN" });
      }

      return { success: true };
    }),

  // Get wallet stats
  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, ctx.user.id),
    });

    if (!wallet) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Daily spent
    const dailyTxn = await db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.senderId, ctx.user.id),
          gte(transactions.createdAt, today),
          eq(transactions.status, "completed")
        )
      );

    const dailySpent = parseFloat(dailyTxn[0]?.total || "0");

    return {
      balance: wallet.balance,
      dailySpent: dailySpent.toFixed(2),
      dailyLimit: wallet.dailyLimit,
      monthlyLimit: wallet.monthlyLimit,
      remainingDaily: (parseFloat(wallet.dailyLimit) - dailySpent).toFixed(2),
    };
  }),
});
