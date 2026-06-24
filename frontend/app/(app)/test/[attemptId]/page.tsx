"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { TestRunner } from "@/components/features/runner/test-runner";
import { Button } from "@/components/ui/button";
import type { Attempt, PublicTest } from "@/lib/types";

export default function TestPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const { call } = useApi();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["attempt-run", attemptId],
    queryFn: () =>
      call<{ attempt: Attempt; test: PublicTest }>(`/api/attempts/${attemptId}`),
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (data?.attempt.status === "graded") router.replace(`/results/${attemptId}`);
  }, [data, attemptId, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted">
        <Loader2 className="size-8 animate-spin text-accent" />
        Loading your test…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Could not load this test."}
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const sectionCount =
    Number(Boolean(data.test.listening?.hasContent)) +
    Number(Boolean(data.test.reading?.hasContent)) +
    Number(Boolean(data.test.writing?.task1 || data.test.writing?.task2));

  return (
    <TestRunner
      test={data.test}
      attemptId={attemptId}
      initialAnswers={data.attempt.answers}
      practice={sectionCount === 1}
    />
  );
}
