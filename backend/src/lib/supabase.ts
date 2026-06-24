import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env.js";

/**
 * Server-only Supabase admin client (service-role key — bypasses RLS).
 * Used for privileged operations such as reading auth user metadata.
 * NEVER expose the service-role key to the browser.
 */
let cached: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;
  cached = createClient(requireEnv.supabaseUrl(), requireEnv.supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
