"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch, ApiClientError } from "@/lib/api";

/**
 * Returns an authenticated fetch bound to the current Supabase session.
 * The Supabase access token is attached as a Bearer token; the backend
 * verifies it and scopes every query to the user.
 */
export function useApi() {
  const supabase = React.useMemo(() => createClient(), []);

  const call = React.useCallback(
    async <T = unknown>(path: string, opts: RequestInit = {}): Promise<T> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new ApiClientError(401, "Your session has expired. Please sign in again.");
      return apiFetch<T>(path, { ...opts, accessToken: session.access_token });
    },
    [supabase],
  );

  return { call, supabase };
}
