"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, FilePlus2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Generates a full mock test (Reading + Writing, server-side ~10-30s) and routes
 * into the runner. Shows progress so the UI is never silently blocked.
 */
export function GenerateTestButton(props: ButtonProps) {
  const { call } = useApi();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const { attemptId } = await call<{ attemptId: string; testId: string }>(
        "/api/tests/generate",
        { method: "POST", body: JSON.stringify({}) },
      );
      router.push(`/test/${attemptId}`);
    } catch (err) {
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
        </p>
      )}
    </div>
  );
}
