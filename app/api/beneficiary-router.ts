import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { beneficiaries } from "@db/schema";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";

export const beneficiaryRouter = createRouter({
  // Get all beneficiaries
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.userId, ctx.user.id))
      .orderBy(desc(beneficiaries.isFavorite), desc(beneficiaries.createdAt));
  }),

  // Get favorites only
  getFavorites: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(beneficiaries)
      .where(and(eq(beneficiaries.userId, ctx.user.id), eq(beneficiaries.isFavorite, true)))
      .orderBy(desc(beneficiaries.createdAt));
  }),

  // Add new beneficiary
  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        phone: z.string().min(10).max(20),
        upiId: z.string().max(255).optional(),
        bankAccountNumber: z.string().max(50).optional(),
        bankIfsc: z.string().max(20).optional(),
        bankName: z.string().max(100).optional(),
        isFavorite: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Check if already exists
      const existing = await db.query.beneficiaries.findFirst({
        where: and(
          eq(beneficiaries.userId, ctx.user.id),
          eq(beneficiaries.phone, input.phone)
        ),
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Beneficiary already exists" });
      }

      const [result] = await db.insert(beneficiaries).values({
        userId: ctx.user.id,
        ...input,
      });

      return { success: true, id: result.insertId };
    }),

  // Update beneficiary
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        phone: z.string().min(10).max(20).optional(),
        upiId: z.string().max(255).optional(),
        bankAccountNumber: z.string().max(50).optional(),
        bankIfsc: z.string().max(20).optional(),
        bankName: z.string().max(100).optional(),
        isFavorite: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const beneficiary = await db.query.beneficiaries.findFirst({
        where: eq(beneficiaries.id, id),
      });

      if (!beneficiary || beneficiary.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Beneficiary not found" });
      }

      await db
        .update(beneficiaries)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(beneficiaries.id, id));

      return { success: true };
    }),

  // Delete beneficiary
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const beneficiary = await db.query.beneficiaries.findFirst({
        where: eq(beneficiaries.id, input.id),
      });

      if (!beneficiary || beneficiary.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Beneficiary not found" });
      }

      await db.delete(beneficiaries).where(eq(beneficiaries.id, input.id));

      return { success: true };
    }),

  // Search beneficiaries
  search: authedQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const allBeneficiaries = await db
        .select()
        .from(beneficiaries)
        .where(eq(beneficiaries.userId, ctx.user.id));

      const filtered = allBeneficiaries.filter(
        (b) =>
          b.name.toLowerCase().includes(input.query.toLowerCase()) ||
          b.phone.includes(input.query) ||
          (b.upiId && b.upiId.toLowerCase().includes(input.query.toLowerCase()))
      );

      return filtered;
    }),
});
