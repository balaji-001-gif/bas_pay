import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { notifications } from "@db/schema";
import { createRouter, authedQuery } from "./middleware";

export const notificationRouter = createRouter({
  // Get all notifications
  list: authedQuery
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          unreadOnly: z.boolean().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(notifications.userId, ctx.user.id)];

      if (input?.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      return db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input?.limit || 20)
        .offset(input?.offset || 0);
    }),

  // Get unread count
  unreadCount: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));

    return result[0]?.count || 0;
  }),

  // Mark as read
  markAsRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));

      return { success: true };
    }),

  // Mark all as read
  markAllAsRead: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));

    return { success: true };
  }),

  // Delete notification
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(notifications)
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));

      return { success: true };
    }),
});
