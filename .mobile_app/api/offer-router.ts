import { z } from "zod";
import { eq, and, gte } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { offers } from "@db/schema";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";

export const offerRouter = createRouter({
  // List active offers
  list: authedQuery
    .input(
      z
        .object({
          category: z.enum(["food", "shopping", "travel", "entertainment", "bills", "recharge", "transfer", "all"]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();

      let query = db
        .select()
        .from(offers)
        .where(and(eq(offers.isActive, true), gte(offers.endDate, now)));

      if (input?.category && input.category !== "all") {
        // Filter by category (would need proper SQL, doing in-memory for now)
        const all = await query;
        return all.filter((o) => o.category === input.category || o.category === "all");
      }

      return query;
    }),

  // Get offer by ID
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const offer = await db.query.offers.findFirst({
        where: eq(offers.id, input.id),
      });

      if (!offer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      }

      return offer;
    }),

  // Validate and apply offer (returns discount amount)
  apply: authedQuery
    .input(
      z.object({
        code: z.string(),
        transactionAmount: z.number().positive(),
        category: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const now = new Date();

      const offer = await db.query.offers.findFirst({
        where: and(eq(offers.code, input.code), eq(offers.isActive, true), gte(offers.endDate, now)),
      });

      if (!offer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired promo code" });
      }

      const minTransaction = offer.minTransaction ?? "0";
      const maxDiscount = offer.maxDiscount ?? null;
      const discountValue = offer.discountValue ?? "0";
      const usageLimit = offer.usageLimit ?? 0;
      const usageCount = offer.usageCount ?? 0;
      const discountType = offer.discountType ?? "cashback";

      // Check minimum transaction
      if (parseFloat(minTransaction) > input.transactionAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Minimum transaction amount of ₹${minTransaction} required`,
        });
      }

      // Check usage limit
      if (usageLimit > 0 && usageCount >= usageLimit) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Promo code usage limit reached" });
      }

      // Calculate discount
      let discount = 0;
      if (discountType === "percentage") {
        discount = (input.transactionAmount * parseFloat(discountValue)) / 100;
        if (maxDiscount) {
          discount = Math.min(discount, parseFloat(maxDiscount));
        }
      } else if (discountType === "fixed_amount" || discountType === "cashback") {
        discount = parseFloat(discountValue);
        if (maxDiscount) {
          discount = Math.min(discount, parseFloat(maxDiscount));
        }
      }

      // Increment usage count
      await db
        .update(offers)
        .set({ usageCount: usageCount + 1 })
        .where(eq(offers.id, offer.id));

      return {
        success: true,
        discount: discount.toFixed(2),
        finalAmount: (input.transactionAmount - discount).toFixed(2),
        type: discountType,
      };
    }),
});
