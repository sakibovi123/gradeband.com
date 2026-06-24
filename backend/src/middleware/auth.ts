import type { NextFunction, Request, Response } from "express";
import { jwtVerify, createRemoteJWKSet, decodeProtectedHeader, type JWTPayload } from "jose";
import { requireEnv } from "../lib/env.js";
import { prisma } from "../lib/db.js";
import { unauthorized } from "../lib/http.js";
import { logger } from "../lib/logger.js";

export interface AuthedRequest extends Request {
  user: { id: string; email: string | null };
}

// Legacy symmetric secret (HS256) — still used by older Supabase projects.
let secretKey: Uint8Array | null = null;
function getSecret() {
  if (!secretKey) secretKey = new TextEncoder().encode(requireEnv.supabaseJwtSecret());
  return secretKey;
}

// Asymmetric signing keys (ES256/RS256) — the current Supabase default. The
// remote JWKS is fetched once and cached, then refetched on key rotation.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL("/auth/v1/.well-known/jwks.json", requireEnv.supabaseUrl()));
  }
  return jwks;
}

/**
 * Verify a Supabase access token, supporting both signing schemes: asymmetric
 * (ES256/RS256, verified against the project JWKS) and legacy symmetric (HS256,
 * verified with the shared JWT secret). The token header's `alg` selects the path.
 */
async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { alg } = decodeProtectedHeader(token);
  if (alg && alg !== "HS256") {
    const { payload } = await jwtVerify(token, getJwks(), { algorithms: ["ES256", "RS256"] });
    return payload;
  }
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
  return payload;
}

/**
 * Verifies the Supabase access token from the Authorization: Bearer header and
 * attaches the user to req. Also lazily ensures an app-side Profile row exists
 * (defensive — the DB trigger is the primary path). Never trusts a
 * client-supplied user id.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw unauthorized("Missing bearer token");
    const token = header.slice("Bearer ".length).trim();

    const payload = await verifyAccessToken(token);
    const id = payload.sub;
    if (!id || typeof id !== "string") throw unauthorized("Invalid token");
    const email = (typeof payload.email === "string" ? payload.email : null) ?? null;

    // Ensure the profile exists (FK target for attempts). The DB trigger is the
    // primary path, so this is a cheap read on the common path; we only write
    // (upsert) on the rare occasion the row is genuinely missing.
    const exists = await prisma.profile.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      await prisma.profile.upsert({ where: { id }, create: { id, email }, update: {} });
    }

    (req as AuthedRequest).user = { id, email };
    next();
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) return next(err);
    logger.warn("Auth verification failed", { message: (err as Error)?.message });
    next(unauthorized("Invalid or expired session"));
  }
}
