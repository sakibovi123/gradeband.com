"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { ProgressChart } from "@/components/features/progress-chart";
import { GenerateTestButton } from "@/components/features/generate-test-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtBand, fmtDate } from "@/lib/format";
import type { Attempt, Profile } from "@/lib/types";

/** Human label for an attempt: "Mock test" or "Practice: Reading". */
function attemptType(a: Attempt): string {
  if (a.mode === "practice") {
    const s = a.sections?.[0];
    return s ? `Practice: ${s[0].toUpperCase()}${s.slice(1)}` : "Practice";
  }
  return "Mock test";
}

export default function HistoryPage() {
  const { call } = useApi();
  const attemptsQ = useQuery({
    queryKey: ["attempts"],
    queryFn: () => call<{ attempts: Attempt[] }>("/api/attempts").then((r) => r.attempts),
  });
  const profileQ = useQuery({
    queryKey: ["me"],
    queryFn: () => call<{ profile: Profile }>("/api/me").then((r) => r.profile),
  });

  const attempts = attemptsQ.data ?? [];
  const graded = attempts.filter((a) => a.status === "graded");
  const chartData = [...graded]
    .reverse()
    .map((a, i) => ({ label: `#${i + 1}`, overall: a.overallBand }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">History</h1>
          <p className="mt-2 text-muted">Every attempt and your band trend over time.</p>
        </div>
        <GenerateTestButton />
      </div>

      {graded.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              Band trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={chartData} target={profileQ.data?.targetBand ?? null} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            All attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attemptsQ.isLoading ? (
            <div className="flex justify-center py-10 text-muted">
              <Loader2 className="animate-spin" />
            </div>
          ) : attemptsQ.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="size-6 text-destructive" />
              <p className="text-sm text-muted">We couldn&apos;t load your attempts.</p>
              <Button variant="outline" size="sm" onClick={() => attemptsQ.refetch()}>
                Try again
              </Button>
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="max-w-sm text-sm text-muted">
                No attempts yet. Start a mock test or practise a single section to see your history
                here.
              </p>
              <GenerateTestButton />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4 font-medium">#</th>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Reading</th>
                    <th className="py-2 pr-4 font-medium">Writing</th>
                    <th className="py-2 pr-4 font-medium">Overall</th>
                    <th className="py-2 pr-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a, i) => (
                    <tr key={a.id} className="border-b border-line/60">
                      <td className="py-2.5 pr-4 font-mono text-muted">{attempts.length - i}</td>
                      <td className="py-2.5 pr-4">{fmtDate(a.createdAt)}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={a.mode === "practice" ? "muted" : "outline"}>
                          {attemptType(a)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 font-mono">{fmtBand(a.readingBand)}</td>
                      <td className="py-2.5 pr-4 font-mono">{fmtBand(a.writingBand)}</td>
                      <td className="py-2.5 pr-4">
                        {a.status === "graded" ? (
                          <span className="font-mono font-semibold">{fmtBand(a.overallBand)}</span>
                        ) : (
                          <Badge variant="muted">in progress</Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link
                          href={a.status === "graded" ? `/results/${a.id}` : `/test/${a.id}`}
                          className="font-medium text-accent hover:underline"
                        >
                          {a.status === "graded" ? "Results" : "Resume"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
