import { timingSafeEqual } from "node:crypto";
import { env, requireEnv } from "./env.js";
import { logger } from "./logger.js";
import { ApiError } from "./http.js";

/**
 * Minimal UddoktaPay client.
 *
 * UddoktaPay is a self-hosted hosted-checkout gateway. We never touch payment
 * credentials: we create a charge (getting back a hosted `payment_url`), redirect
 * the user there, and confirm the result server-side via verify-payment. All
 * requests authenticate with the `RT-UDDOKTAPAY-API-KEY` header.
 *
 * Docs: https://uddoktapay.readme.io/reference/overview
 */

const AUTH_HEADER = "RT-UDDOKTAPAY-API-KEY";

function headers() {
  return {
    [AUTH_HEADER]: requireEnv.uddoktapayKey(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export interface CreateChargeInput {
  fullName: string;
  email: string;
  /** Amount in BDT, as a string per the API. */
  amount: string;
  /** Round-trips back in verify + webhook — we stash the user id + invoice here. */
  metadata: Record<string, string>;
  redirectUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
}

export interface CreateChargeResult {
  /** The hosted checkout URL to redirect the user to. */
  paymentUrl: string;
}

/** UddoktaPay's verify/webhook payload shape (fields we rely on). */
export interface UddoktaPayment {
  full_name?: string;
  email?: string;
  amount?: string;
  fee?: string;
  charged_amount?: string;
  invoice_id?: string;
  metadata?: Record<string, string>;
  payment_method?: string;
  sender_number?: string;
  transaction_id?: string;
  date?: string;
  status?: "COMPLETED" | "PENDING" | "ERROR" | string;
  message?: string;
}

/**
 * Origin of the gateway, without a trailing slash or `/api` segment — endpoints
 * are always `/api/...`. Tolerant of the base URL being configured either way
 * (e.g. "https://x.io" or "https://x.io/api"), so a stray `/api` doesn't produce
 * a doubled `/api/api/...` path.
 */
function origin(): string {
  return env.UDDOKTAPAY_BASE_URL.replace(/\/+$/, "").replace(/\/api$/i, "");
}

async function call(path: string, body: unknown): Promise<unknown> {
  const url = `${origin()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
  } catch (err) {
    logger.error("UddoktaPay request failed (network)", { path, message: (err as Error)?.message });
    throw new ApiError(502, "The payment service is temporarily unavailable. Please try again.", {
      expose: true,
    });
  }

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    logger.error("UddoktaPay request failed", { path, status: res.status });
    throw new ApiError(502, "The payment service returned an error. Please try again.", {
      expose: true,
      details: env.NODE_ENV === "development" ? text.slice(0, 500) : undefined,
    });
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(502, "The payment service returned an unexpected response.", {
      expose: true,
    });
  }
}

/** Initiate a charge; returns the hosted checkout URL. */
export async function createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
  const data = (await call("/api/checkout-v2", {
    full_name: input.fullName,
    email: input.email,
    amount: input.amount,
    metadata: input.metadata,
    redirect_url: input.redirectUrl,
    cancel_url: input.cancelUrl,
    webhook_url: input.webhookUrl,
    return_type: "GET",
  })) as { status?: boolean; payment_url?: string; message?: string };

  if (!data.payment_url) {
    logger.error("UddoktaPay create charge missing payment_url", { message: data.message });
    throw new ApiError(502, "Could not start the payment. Please try again.", { expose: true });
  }
  return { paymentUrl: data.payment_url };
}

/** Authoritative status check for an invoice. This is the source of truth. */
export async function verifyPayment(invoiceId: string): Promise<UddoktaPayment> {
  return (await call("/api/verify-payment", { invoice_id: invoiceId })) as UddoktaPayment;
}

/**
 * Validate an incoming webhook by comparing the request's API-key header against
 * ours. UddoktaPay's webhook security is header-based (no HMAC), so this guard +
 * a re-verify is the documented pattern.
 */
export function isValidWebhookKey(headerValue: string | undefined): boolean {
  if (!headerValue) return false;
  // Constant-time comparison so the secret can't be recovered by timing the
  // response. timingSafeEqual requires equal-length buffers, so length-check first.
  const a = Buffer.from(headerValue);
  const b = Buffer.from(requireEnv.uddoktapayKey());
  return a.length === b.length && timingSafeEqual(a, b);
}
