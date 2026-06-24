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

  const chartData = [...graded]
    .reverse()
    .map((a, i) => ({ label: `#${i + 1}`, overall: a.overallBand }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile?.name ? `Hi, ${profile.name}` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted">Practise under real exam conditions. Bands are estimates.</p>
        </div>
        <GenerateTestButton size="lg" />
      </div>

      {/* Top stat row */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<CalendarClock className="size-4" />}
          label="Exam countdown"
          value={
            profileQ.isLoading ? "…" : days == null ? "Not set" : `${days} day${days === 1 ? "" : "s"}`
          }
          sub={profile?.examDate ? fmtDate(profile.examDate) : "Set your exam date in Profile"}
        />
        <StatCard
          icon={<Target className="size-4" />}
          label="Target band"
          value={profileQ.isLoading ? "…" : fmtBand(profile?.targetBand ?? null)}
          sub="Adjust in Profile"
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Latest overall"
          value={attemptsQ.isLoading ? "…" : fmtBand(latest?.overallBand ?? null)}
          sub={latest ? fmtDate(latest.createdAt) : "No graded tests yet"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Latest estimate</CardTitle>
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
            <CardTitle>Progress over time</CardTitle>
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
          <CardTitle>Recent attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {attemptsQ.isLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted">No attempts yet. Generate your first mock test to begin.</p>
              <GenerateTestButton />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {attempts.slice(0, 6).map((a, i) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <span className="font-mono text-sm text-muted">#{attempts.length - i}</span>
                  <span className="text-sm">{fmtDate(a.createdAt)}</span>
                  {a.status === "graded" ? (
                    <Badge variant="success">Overall {fmtBand(a.overallBand)}</Badge>
                  ) : (
                    <Badge variant="muted">In progress</Badge>
                  )}
                  <div className="ml-auto flex gap-2">
                    {a.status === "graded" ? (
                      <Link href={`/results/${a.id}`} className="text-sm text-accent hover:underline">
                        View results
                      </Link>
                    ) : (
                      <Link href={`/test/${a.id}`} className="text-sm text-accent hover:underline">
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
          {icon}
          {label}
        </div>
        <div className="font-mono text-3xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted">{sub}</div>
      </CardContent>
    </Card>
  );
}
