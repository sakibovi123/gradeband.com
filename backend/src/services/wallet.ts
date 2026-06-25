import { prisma } from "../lib/db.js";
import { env } from "../lib/env.js";
import { paymentRequired } from "../lib/http.js";
import { logger } from "../lib/logger.js";

/**
 * Wallet service: the only place that mutates a user's credit balance.
 *
 * `Profile.credits` is the fast-read balance; `CreditTransaction` is the ledger.
 * Every mutation writes both inside a single DB transaction so they can never
 * diverge. Spends use a conditional decrement (atomic, race-safe). Top-ups are
 * idempotent on a key (the UddoktaPay invoice id), so a webhook + redirect for
 * the same payment can't double-credit.
 */

export interface SpendOpts {
  /** Stable reason, e.g. "practice:writing" | "mock" | "learn:grade". */
  reason: string;
  attemptId?: string;
  metadata?: Record<string, unknown>;
}

export interface GrantOpts {
  reason: string;
  /** Idempotency key — a repeated grant with the same key is a no-op. */
  idempotencyKey?: string;
  attemptId?: string;
  metadata?: Record<string, unknown>;
}

/** Read the balance, granting one-time welcome credits to a fresh wallet. */
export async function getBalance(userId: string): Promise<number> {
  await grantWelcomeIfNew(userId);
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return profile?.credits ?? 0;
}

/** Grant welcome credits exactly once per user (idempotent on a per-user key). */
export async function grantWelcomeIfNew(userId: string): Promise<void> {
  if (env.WELCOME_CREDITS <= 0) return;
  await grant(userId, env.WELCOME_CREDITS, {
    reason: "welcome",
    idempotencyKey: `welcome:${userId}`,
  }).catch((err) => {
    // A duplicate-key race just means it was already granted — fine.
    logger.debug("Welcome grant skipped", { message: (err as Error)?.message });
  });
}

/**
 * Spend `amount` credits atomically. Throws a 402 if the balance is insufficient.
 * The conditional decrement guarantees two concurrent spends can't overdraw.
 */
export async function charge(userId: string, amount: number, opts: SpendOpts): Promise<number> {
  if (amount <= 0) throw new Error("charge amount must be positive");
  await grantWelcomeIfNew(userId);

  return prisma.$transaction(async (tx) => {
    const res = await tx.profile.updateMany({
      where: { id: userId, credits: { gte: amount } },
      data: { credits: { decrement: amount } },
    });
    if (res.count === 0) {
      const profile = await tx.profile.findUnique({
        where: { id: userId },
        select: { credits: true },
      });
      throw paymentRequired("Not enough credits. Please top up your wallet.", {
        required: amount,
        balance: profile?.credits ?? 0,
      });
    }
    const profile = await tx.profile.findUniqueOrThrow({
      where: { id: userId },
      select: { credits: true },
    });
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        balanceAfter: profile.credits,
        type: "spend",
        reason: opts.reason,
        attemptId: opts.attemptId,
        metadata: opts.metadata as object | undefined,
      },
    });
    return profile.credits;
  });
}

/**
 * Add `amount` credits. Used for top-ups (type "purchase"), refunds, and the
 * welcome grant. Idempotent when `idempotencyKey` is set: a second call with the
 * same key returns the current balance without crediting again.
 */
export async function grant(
  userId: string,
  amount: number,
  opts: GrantOpts & { type?: "purchase" | "refund" | "welcome" | "adjustment" },
): Promise<number> {
  if (amount <= 0) throw new Error("grant amount must be positive");

  return prisma.$transaction(async (tx) => {
    if (opts.idempotencyKey) {
      const existing = await tx.creditTransaction.findUnique({
        where: { invoiceId: opts.idempotencyKey },
        select: { balanceAfter: true },
      });
      if (existing) return existing.balanceAfter;
    }
    const profile = await tx.profile.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { credits: true },
    });
    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        balanceAfter: profile.credits,
        type: opts.type ?? "purchase",
        reason: opts.reason,
        invoiceId: opts.idempotencyKey,
        attemptId: opts.attemptId,
        metadata: opts.metadata as object | undefined,
      },
    });
    return profile.credits;
  });
}

/** Refund a previously-charged amount (e.g. when generation fails after charging). */
export async function refund(userId: string, amount: number, opts: SpendOpts): Promise<number> {
  return grant(userId, amount, { ...opts, type: "refund" });
}
