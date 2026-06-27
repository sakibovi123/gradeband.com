import { prisma } from "../lib/db.js";
import { env } from "../lib/env.js";

/**
 * Model tiering for the pay-as-you-go funnel.
 *
 * A brand-new user gets welcome credits and silently runs every billable
 * generation/grading call on a free OpenRouter model (`env.FREE_MODEL`). The
 * moment their first top-up is verified, those same calls flip to the paid
 * model (`env.PAID_MODEL`) — automatically, with no UI, no setting, and no
 * awareness required from the user.
 *
 * The tier is *derived* from the wallet ledger: a `purchase` CreditTransaction
 * is only ever written when a top-up is verified (see services/wallet.ts +
 * routes/payments.ts), so it is the source of truth. Deriving it means no extra
 * column or migration, and the signal can never drift out of sync with the
 * actual payment history.
 */

/** True once the user has ever completed a paid top-up. */
export async function hasPurchased(userId: string): Promise<boolean> {
  const purchase = await prisma.creditTransaction.findFirst({
    where: { userId, type: "purchase" },
    select: { id: true },
  });
  return purchase !== null;
}

/**
 * The OpenRouter model to use for this user's billable actions: the paid model
 * once they've purchased, otherwise the free model. Pricing is unaffected —
 * free-tier actions still cost their calibrated credit price (the trial budget).
 */
export async function resolveModelForUser(userId: string): Promise<string> {
  return (await hasPurchased(userId)) ? env.PAID_MODEL : env.FREE_MODEL;
}
