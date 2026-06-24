import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { requireEnv } from "../lib/env.js";
import { prisma } from "../lib/db.js";
import { unauthorized } from "../lib/http.js";
import { logger } from "../lib/logger.js";

export interface AuthedRequest extends Request {
  user: { id: string; email: string | null };
}

let secretKey: Uint8Array | null = null;
function getSecret() {
  if (!secretKey) secretKey = new TextEncoder().encode(requireEnv.supabaseJwtSecret());
  return secretKey;
}

/**
 * Verifies the Supabase access token from the Authorization: Bearer header
 * (HS256, signed with the project JWT secret) and attaches the user to req.
 * Also lazily ensures an app-side Profile row exists (defensive — the DB
 * trigger is the primary path). Never trusts a client-supplied user id.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw unauthorized("Missing bearer token");
    const token = header.slice("Bearer ".length).trim();

    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const id = payload.sub;
    if (!id || typeof id !== "string") throw unauthorized("Invalid token");
    const email = (typeof payload.email === "string" ? payload.email : null) ?? null;

    // Ensure the profile exists (FK target for attempts). Trigger is primary.
    await prisma.profile.upsert({
      where: { id },
      create: { id, email },
      update: email ? { email } : {},
    });

    (req as AuthedRequest).user = { id, email };
    next();
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) return next(err);
    logger.warn("Auth verification failed", { message: (err as Error)?.message });
    next(unauthorized("Invalid or expired session"));
  }
}
