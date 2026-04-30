import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  bigint,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ============ USERS (existing from auth) ============
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 20 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  sentTransactions: many(transactions, {
    relationName: "sender",
  }),
  receivedTransactions: many(transactions, {
    relationName: "receiver",
  }),
  beneficiaries: many(beneficiaries),
  notifications: many(notifications),
}));

// ============ WALLETS ============
export const wallets = mysqlTable("wallets", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  dailyLimit: decimal("dailyLimit", { precision: 15, scale: 2 }).default("50000.00").notNull(),
  monthlyLimit: decimal("monthlyLimit", { precision: 15, scale: 2 }).default("500000.00").notNull(),
  pinHash: varchar("pinHash", { length: 255 }), // 4-digit PIN hashed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

// ============ TRANSACTIONS ============
export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transactionId", { length: 32 }).notNull().unique(),
  senderId: bigint("senderId", { mode: "number", unsigned: true }).notNull(),
  receiverId: bigint("receiverId", { mode: "number", unsigned: true }), // null for bank transfers, bill payments
  receiverPhone: varchar("receiverPhone", { length: 20 }),
  receiverName: varchar("receiverName", { length: 255 }),
  receiverUpiId: varchar("receiverUpiId", { length: 255 }),
  type: mysqlEnum("type", [
    "send_money",
    "receive_money",
    "add_money",
    "withdraw",
    "pay_bill",
    "recharge",
    "qr_payment",
    "refund",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled", "refunded"])
    .default("pending")
    .notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  description: text("description"),
  remark: varchar("remark", { length: 255 }),
  category: mysqlEnum("category", [
    "food",
    "shopping",
    "travel",
    "entertainment",
    "bills",
    "recharge",
    "transfer",
    "other",
  ]).default("other"),
  paymentMethod: mysqlEnum("paymentMethod", [
    "wallet",
    "upi",
    "card",
    "netbanking",
    "cash",
  ]).default("wallet"),
  metadata: text("metadata"), // JSON for additional data
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  sender: one(users, {
    fields: [transactions.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [transactions.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
  wallet: one(wallets, {
    fields: [transactions.senderId],
    references: [wallets.userId],
  }),
}));

// ============ BENEFICIARIES ============
export const beneficiaries = mysqlTable("beneficiaries", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  upiId: varchar("upiId", { length: 255 }),
  bankAccountNumber: varchar("bankAccountNumber", { length: 50 }),
  bankIfsc: varchar("bankIfsc", { length: 20 }),
  bankName: varchar("bankName", { length: 100 }),
  avatar: text("avatar"),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const beneficiariesRelations = relations(beneficiaries, ({ one }) => ({
  user: one(users, {
    fields: [beneficiaries.userId],
    references: [users.id],
  }),
}));

// ============ NOTIFICATIONS ============
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", [
    "transaction",
    "promo",
    "security",
    "system",
    "payment_reminder",
  ]).default("system").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ============ MERCHANTS (for QR payments, bill payments) ============
export const merchants = mysqlTable("merchants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "food",
    "shopping",
    "travel",
    "entertainment",
    "bills",
    "recharge",
    "groceries",
    "health",
    "other",
  ]).default("other"),
  logo: text("logo"),
  upiId: varchar("upiId", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============ BILL PAYMENTS ============
export const billPayments = mysqlTable("billPayments", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  billerId: varchar("billerId", { length: 100 }).notNull(),
  billerName: varchar("billerName", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
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
  ]).notNull(),
  consumerNumber: varchar("consumerNumber", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 32 }),
  billDate: timestamp("billDate"),
  dueDate: timestamp("dueDate"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  user: one(users, {
    fields: [billPayments.userId],
    references: [users.id],
  }),
}));

// ============ OFFERS / PROMO CODES ============
export const offers = mysqlTable("offers", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 50 }).unique(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed_amount", "cashback"]).default("cashback"),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscount: decimal("maxDiscount", { precision: 10, scale: 2 }),
  minTransaction: decimal("minTransaction", { precision: 10, scale: 2 }).default("0.00"),
  category: mysqlEnum("category", [
    "food",
    "shopping",
    "travel",
    "entertainment",
    "bills",
    "recharge",
    "transfer",
    "all",
  ]).default("all"),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate").notNull(),
  usageLimit: int("usageLimit").default(0), // 0 = unlimited
  usageCount: int("usageCount").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============ QR CODES ============
export const qrCodes = mysqlTable("qrCodes", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  merchantId: bigint("merchantId", { mode: "number", unsigned: true }),
  qrData: text("qrData").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  isDynamic: boolean("isDynamic").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============ UPI IDs ============
export const upiIds = mysqlTable("upiIds", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  upiId: varchar("upiId", { length: 255 }).notNull().unique(),
  isPrimary: boolean("isPrimary").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const upiIdsRelations = relations(upiIds, ({ one }) => ({
  user: one(users, {
    fields: [upiIds.userId],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = typeof beneficiaries.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Merchant = typeof merchants.$inferSelect;
export type BillPayment = typeof billPayments.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;
export type UpiId = typeof upiIds.$inferSelect;
