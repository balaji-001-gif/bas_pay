import { authRouter } from "./auth-router";
import { walletRouter } from "./wallet-router";
import { transactionRouter } from "./transaction-router";
import { beneficiaryRouter } from "./beneficiary-router";
import { notificationRouter } from "./notification-router";
import { offerRouter } from "./offer-router";
import { billRouter } from "./bill-router";
import { qrRouter } from "./qr-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  wallet: walletRouter,
  transaction: transactionRouter,
  beneficiary: beneficiaryRouter,
  notification: notificationRouter,
  offer: offerRouter,
  bill: billRouter,
  qr: qrRouter,
});

export type AppRouter = typeof appRouter;
