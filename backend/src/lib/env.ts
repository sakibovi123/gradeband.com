import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";

// Load the single shared root .env (../../.env relative to backend/src/lib).
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../../../.env") });

/**
 * Boot-time env validation.
 *
 * Ports / origins are always required (the server cannot start without them).
 * Secrets (Supabase, DB, OpenRouter, OpenAI) are validated as *optional* here so
 * the skeleton can boot during early milestones, but each is exposed through a
 * `require*()` accessor that throws a clear, actionable error the moment a
 * feature actually needs it. This keeps "missing key" failures explicit and
 * server-side, never silent.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4099),
  WEB_ORIGIN: z.string().url().default("http://localhost:3099"),
  // Public base URLs, shared with the frontend. The app URL is the canonical
  // origin for user-facing links (e.g. payment redirects); the API URL is this
  // backend's own public origin (e.g. the payment webhook target).
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3099"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4099"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),

  // Database
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_DEFAULT_MODEL: z.string().min(1).default("anthropic/claude-sonnet-4.6"),
  // The model used for billable generation/grading once a user has purchased.
  // Credit prices are calibrated to this model, so paid actions must not use a
  // per-user model.
  PAID_MODEL: z.string().min(1).default("anthropic/claude-sonnet-4.6"),
  // The model used for users who have not yet purchased (still on welcome
  // credits). A free OpenRouter model — the swap is fully server-side and
  // invisible to the user. The instant their first top-up completes they are
  // upgraded to PAID_MODEL automatically. See services/tier.ts.
  FREE_MODEL: z.string().min(1).default("meta-llama/llama-3.3-70b-instruct:free"),

  // UddoktaPay (pay-as-you-go credit top-ups; bKash personal configured in panel)
  UDDOKTAPAY_BASE_URL: z.string().url().default("https://sandbox.uddoktapay.com"),
  UDDOKTAPAY_API_KEY: z.string().min(1).optional(),
  // Credits granted to a brand-new wallet so users can try before buying.
  WELCOME_CREDITS: z.coerce.number().int().min(0).default(30),

  // OpenAI TTS
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_TTS_MODEL: z.string().min(1).default("gpt-4o-mini-tts"),
  OPENAI_TTS_VOICE: z.string().min(1).default("alloy"),

  AUDIO_CACHE_DIR: z.string().min(1).default(".cache/audio"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:\n", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed. See errors above and check your root .env file.");
}

export const env = parsed.data;

/** Throw a clear error when an optional-at-boot secret is required for a feature. */
function require(name: keyof typeof env, hint?: string): string {
  const value = env[name];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Missing required env var "${name}". ${hint ?? "Set it in the root .env file."}`,
    );
  }
  return String(value);
}

export const requireEnv = {
  databaseUrl: () => require("DATABASE_URL", "Set the Supabase pooled connection string."),
  supabaseUrl: () => require("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: () =>
    require("SUPABASE_SERVICE_ROLE_KEY", "Server-only Supabase service role key."),
  supabaseJwtSecret: () =>
    require("SUPABASE_JWT_SECRET", "Used to verify incoming Supabase access tokens."),
  openRouterKey: () => require("OPENROUTER_API_KEY", "Get one at https://openrouter.ai/keys"),
  openAiKey: () => require("OPENAI_API_KEY", "Used for text-to-speech audio generation."),
  uddoktapayKey: () =>
    require("UDDOKTAPAY_API_KEY", "UddoktaPay API key (RT-UDDOKTAPAY-API-KEY) from your panel."),
};

export const isProd = env.NODE_ENV === "production";
