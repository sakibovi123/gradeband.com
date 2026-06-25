import { Router } from "express";
import { prisma } from "../lib/db.js";
import { env } from "../lib/env.js";
import { asyncHandler, badRequest, unauthorized } from "../lib/http.js";
import { logger } from "../lib/logger.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { createChargeSchema, verifyPaymentSchema } from "../schemas/api.js";
import { CREDIT_PACKAGES, findPackage } from "../lib/pricing.js";
import { createCharge, verifyPayment, isValidWebhookKey } from "../lib/uddoktapay.js";
import { grant } from "../services/wallet.js";

export const paymentsRouter = Router();

/** Strip trailing slashes so we can append paths cleanly. */
const trimSlash = (u: string) => u.replace(/\/+$/, "");
// User-facing return targets live on the web app; the webhook hits this API.
const REDIRECT_URL = `${trimSlash(env.NEXT_PUBLIC_APP_URL)}/wallet/return`;
const CANCEL_URL = `${trimSlash(env.NEXT_PUBLIC_APP_URL)}/wallet`;
const WEBHOOK_URL = `${trimSlash(env.NEXT_PUBLIC_API_URL)}/api/payments/webhook`;

/** GET /api/payments/packages — the buyable credit packages. */
paymentsRouter.get(
  "/packages",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({ packages: CREDIT_PACKAGES });
  }),
);

/**
 * POST /api/payments/create-charge { packageId }
 * Starts a UddoktaPay hosted checkout for a credit top-up. Returns the
 * payment_url to redirect the user to. Everything needed to finalize (user id,
 * credits to grant) is stashed in metadata, which round-trips back via the
 * webhook and the verify call.
 */
paymentsRouter.post(
  "/create-charge",
  requireAuth,
  rateLimit({ windowMs: 60 * 1000, max: 10, key: "create-charge" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { packageId } = createChargeSchema.parse(req.body ?? {});
    const pkg = findPackage(packageId);
    if (!pkg) throw badRequest("Unknown package.");

    const profile = await prisma.profile.findUnique({ where: { id: req.user.id } });

    const { paymentUrl } = await createCharge({
      fullName: profile?.name || "IELTS Kit User",
      email: profile?.email || req.user.email || "user@example.com",
      amount: String(pkg.amountBdt),
      metadata: {
        userId: req.user.id,
        packageId: pkg.id,
        credits: String(pkg.credits),
      },
      redirectUrl: REDIRECT_URL,
      cancelUrl: CANCEL_URL,
      webhookUrl: WEBHOOK_URL,
    });

    res.json({ paymentUrl });
  }),
);

/**
 * Confirm an invoice against UddoktaPay (the source of truth) and, if completed,
 * credit the wallet exactly once. Idempotent: the wallet grant and the Payment
 * row are both keyed on the invoice id, so a webhook + a redirect for the same
 * payment can't double-credit. Returns the resolved status (and new balance on
 * completion). `expectedUserId`, when given, must match the invoice's metadata.
 */
async function finalizeInvoice(
  invoiceId: string,
  expectedUserId?: string,
): Promise<{ status: string; credits?: number; balance?: number }> {
  const payment = await verifyPayment(invoiceId);
  const userId = payment.metadata?.userId;
  const packageId = payment.metadata?.packageId;

  if (!userId || !packageId) {
    logger.warn("Payment missing required metadata", { invoiceId });
    throw badRequest("This payment is missing required information.");
  }
  if (expectedUserId && expectedUserId !== userId) {
    throw unauthorized("This payment does not belong to you.");
  }

  const amountBdt = Number(payment.charged_amount ?? payment.amount ?? 0);
  const common = {
    paymentMethod: payment.payment_method,
    senderNumber: payment.sender_number,
    transactionId: payment.transaction_id,
    raw: payment as object,
  };

  if (payment.status === "COMPLETED") {
    // Reconcile against the package: the credits granted come from the package
    // definition (server-side truth), never from the round-tripped metadata, and
    // only if the amount actually paid covers the package price. This enforces
    // the paid-amount ↔ credits invariant even if a COMPLETED invoice comes back
    // under-paid or with tampered/stale metadata.
    const pkg = findPackage(packageId);
    if (!pkg || amountBdt < pkg.amountBdt) {
      logger.error("Payment amount/package mismatch — not crediting", {
        invoiceId,
        packageId,
        amountBdt,
        expected: pkg?.amountBdt,
      });
      await prisma.payment.upsert({
        where: { invoiceId },
        create: { userId, invoiceId, amountBdt, credits: pkg?.credits ?? 0, status: "ERROR", ...common },
        update: { status: "ERROR", ...common },
      });
      return { status: "ERROR" };
    }
    const balance = await grant(userId, pkg.credits, {
      reason: "topup",
      idempotencyKey: invoiceId,
      type: "purchase",
      metadata: { invoiceId, amountBdt, packageId },
    });
    await prisma.payment.upsert({
      where: { invoiceId },
      create: { userId, invoiceId, amountBdt, credits: pkg.credits, status: "COMPLETED", ...common },
      update: { status: "COMPLETED", ...common },
    });
    return { status: "COMPLETED", credits: pkg.credits, balance };
  }

  // PENDING / ERROR — record it, but don't credit.
  await prisma.payment.upsert({
    where: { invoiceId },
    create: {
      userId,
      invoiceId,
      amountBdt,
      credits: findPackage(packageId)?.credits ?? 0,
      status: payment.status ?? "PENDING",
      ...common,
    },
    update: { status: payment.status ?? "PENDING", ...common },
  });
  return { status: payment.status ?? "PENDING" };
}

/**
 * POST /api/payments/webhook
 * Server-to-server notification from UddoktaPay. NOT behind requireAuth — it's
 * the gateway calling, authenticated by the RT-UDDOKTAPAY-API-KEY header. We
 * re-verify against the API rather than trusting the body.
 */
paymentsRouter.post(
  "/webhook",
  // Bound unauthenticated load even though the key check rejects forgeries cheaply.
  rateLimit({ windowMs: 60 * 1000, max: 60, key: "payment-webhook" }),
  asyncHandler(async (req, res) => {
    if (!isValidWebhookKey(req.header("RT-UDDOKTAPAY-API-KEY") ?? undefined)) {
      logger.warn("Rejected webhook with bad API key");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const invoiceId =
      (req.body?.invoice_id as string | undefined) ?? (req.body?.invoiceId as string | undefined);
    if (!invoiceId) return res.status(400).json({ error: "Missing invoice_id" });

    try {
      const result = await finalizeInvoice(invoiceId);
      logger.info("Webhook processed", { invoiceId, status: result.status });
    } catch (err) {
      logger.error("Webhook finalize failed", { invoiceId, message: (err as Error)?.message });
      // Acknowledge anyway so UddoktaPay doesn't hammer retries; verify-on-return
      // is the backstop.
    }
    res.json({ ok: true });
  }),
);

/**
 * POST /api/payments/verify { invoiceId }
 * Called by the frontend return page after the user comes back from checkout.
 * Confirms and finalizes the payment for the authenticated user.
 */
paymentsRouter.post(
  "/verify",
  requireAuth,
  rateLimit({ windowMs: 60 * 1000, max: 30, key: "verify-payment" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { invoiceId } = verifyPaymentSchema.parse(req.body ?? {});
    const result = await finalizeInvoice(invoiceId, req.user.id);
    res.json(result);
  }),
);
