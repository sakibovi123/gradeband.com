import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

/**
 * Prisma singleton. The backend connects through the Supabase pooler with a
 * privileged role that BYPASSES Row Level Security — so every query in the
 * service layer MUST be scoped to the authenticated user id. RLS stays enabled
 * in the database as a second line of defense.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
