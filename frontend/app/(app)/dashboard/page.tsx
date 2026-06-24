"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Target, TrendingUp } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { BandGauge } from "@/components/features/band-gauge";
import { ProgressChart } from "@/components/features/progress-chart";
import { GenerateTestButton } from "@/components/features/generate-test-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtBand, fmtDate, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Attempt, Profile } from "@/lib/types";

export default function DashboardPage() {
  const { call } = useApi();

  const profileQ = useQuery({
    queryKey: ["me"],
    queryFn: () => call<{ profile: Profile }>("/api/me").then((r) => r.profile),
  });
  const attemptsQ = useQuery({
    queryKey: ["attempts"],
    queryFn: () => call<{ attempts: Attempt[] }>("/api/attempts").then((r) => r.attempts),
  });

  const profile = profileQ.data;
  const attempts = attemptsQ.data ?? [];
  const graded = attempts.filter((a) => a.status === "graded");
  const latest = graded[0];
  const days = daysUntil(profile?.examDate);
  const urgent = days != null && days <= 14;

  const chartData = [...graded]
    .reverse()
    .map((a, i) => ({ label: `#${i + 1}`, overall: a.overallBand }));

  return (
    <div className="flex flex-col gap-9">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            <span className="h-px w-5 bg-accent" />
            Your workspace
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {profile?.name ? `Hi, ${profile.name}.` : "Dashboard"}
          </h1>
          <p className="mt-2 text-muted">
            Practise under real exam conditions. Bands shown are estimates.
          </p>
        </div>
        <GenerateTestButton
          size="lg"
          className="bg-coral text-coral-foreground hover:bg-coral/90"
        />
      </div>

      {/* Top stat row */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<CalendarClock className="size-3.5" />}
          label="Exam countdown"
          value={
            profileQ.isLoading
              ? "…"
              : days == null
                ? "Not set"
                : `${days} day${days === 1 ? "" : "s"}`
          }
          sub={profile?.examDate ? fmtDate(profile.examDate) : "Set your exam date in Profile"}
          accent={urgent ? "coral" : "ink"}
        />
        <StatCard
          icon={<Target className="size-3.5" />}
          label="Target band"
          value={profileQ.isLoading ? "…" : fmtBand(profile?.targetBand ?? null)}
          sub="Adjust in Profile"
        />
        <StatCard
          icon={<TrendingUp className="size-3.5" />}
          label="Latest overall"
          value={attemptsQ.isLoading ? "…" : fmtBand(latest?.overallBand ?? null)}
          sub={latest ? fmtDate(latest.createdAt) : "No graded tests yet"}
          accent="teal"
        />
      </div>

      {/* Gauge + progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              Latest estimate
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            {attemptsQ.isLoading ? (
              <Skeleton className="h-[220px] w-[220px] rounded-full" />
            ) : (
              <BandGauge band={latest?.overallBand ?? null} target={profile?.targetBand ?? null} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              Progress over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attemptsQ.isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ProgressChart data={chartData} target={profile?.targetBand ?? null} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Recent attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attemptsQ.isLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="max-w-sm text-sm text-muted">
                No attempts yet. Generate your first mock test to find out where you stand.
              </p>
              <GenerateTestButton className="bg-coral text-coral-foreground hover:bg-coral/90" />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {attempts.slice(0, 6).map((a, i) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <span className="font-mono text-sm text-muted tabular-nums">
                    #{String(attempts.length - i).padStart(2, "0")}
                  </span>
                  <span className="text-sm">{fmtDate(a.createdAt)}</span>
                  {a.status === "graded" ? (
                    <Badge variant="success">Overall {fmtBand(a.overallBand)}</Badge>
                  ) : (
                    <Badge variant="muted">In progress</Badge>
                  )}
                  <div className="ml-auto flex gap-2">
                    {a.status === "graded" ? (
                      <Link
                        href={`/results/${a.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        View results
                      </Link>
                    ) : (
                      <Link
                        href={`/test/${a.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        Resume
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "ink",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: "ink" | "teal" | "coral";
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm">
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          accent === "coral" ? "bg-coral" : accent === "teal" ? "bg-accent" : "bg-transparent",
        )}
      />
      <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-3 font-mono text-3xl font-bold tabular-nums",
          accent === "coral" ? "text-coral" : "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </div>
  );
}
