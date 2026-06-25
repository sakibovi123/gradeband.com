"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, FilePlus2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { ApiClientError } from "@/lib/api";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Generates a full mock test (Reading + Writing, server-side ~10-30s) and routes
 * into the runner. Shows progress so the UI is never silently blocked.
 */
export function GenerateTestButton(props: ButtonProps) {
  const { call } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needsTopUp, setNeedsTopUp] = React.useState(false);

  async function start() {
    setLoading(true);
    setError(null);
    setNeedsTopUp(false);
    try {
      const { attemptId } = await call<{ attemptId: string; testId: string }>(
        "/api/tests/generate",
        { method: "POST", body: JSON.stringify({}) },
      );
      // Mock generation spent credits — refresh the balance badge.
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      router.push(`/test/${attemptId}`);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 402) setNeedsTopUp(true);
      setError(err instanceof Error ? err.message : "Could not generate a test.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={start} disabled={loading} {...props}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Generating test…
          </>
        ) : (
          <>
            <FilePlus2 /> Start a mock test
          </>
        )}
      </Button>
      {loading && (
        <p className="text-xs text-muted">
          Writing your Reading passage &amp; Writing prompts — this takes a little while.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
          {needsTopUp && (
            <>
              {" "}
              <Link href="/wallet" className="font-medium underline">
                Top up your wallet
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
