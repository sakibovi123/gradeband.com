import { Router } from "express";
import { env } from "../lib/env.js";

export const healthRouter = Router();

/**
 * Liveness + lightweight readiness probe.
 * Reports which integrations are *configured* (key present) without ever
 * returning the secret values themselves.
 */
healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "ielts-backend",
    time: new Date().toISOString(),
    env: env.NODE_ENV,
    configured: {
      supabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      database: Boolean(env.DATABASE_URL),
      openrouter: Boolean(env.OPENROUTER_API_KEY),
      tts: Boolean(env.OPENAI_API_KEY),
    },
  });
});
