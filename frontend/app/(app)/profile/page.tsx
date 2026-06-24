"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtBand } from "@/lib/format";
import type { Attempt, Profile } from "@/lib/types";

const MODELS = [
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-opus-4.8",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.3-70b-instruct",
];

/** Mean of the defined numbers, or null if none. */
function avg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 2) / 2;
}

export default function ProfilePage() {
  const { call } = useApi();
  const qc = useQueryClient();
  const { setTheme } = useTheme();

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: () => call<{ profile: Profile }>("/api/me").then((r) => r.profile),
  });

  // Stats are derived from real saved attempts — never hardcoded.
  const attemptsQ = useQuery({
    queryKey: ["attempts"],
    queryFn: () => call<{ attempts: Attempt[] }>("/api/attempts").then((r) => r.attempts),
  });

  const [form, setForm] = React.useState<Partial<Profile>>({});
  React.useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      call<{ profile: Profile }>("/api/me", { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: (r) => {
      qc.setQueryData(["me"], { profile: r.profile });
      qc.invalidateQueries({ queryKey: ["attempts"] });
    },
  });

  function save(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      name: form.name || null,
      examDate: form.examDate ? new Date(form.examDate).toISOString() : null,
      targetBand: form.targetBand ?? 7,
      model: form.model,
      theme: form.theme,
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 text-muted">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="size-7 text-destructive" />
        <p className="text-sm text-muted">We couldn&apos;t load your profile.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const examDateValue = form.examDate ? form.examDate.slice(0, 10) : "";

  const graded = (attemptsQ.data ?? []).filter((a) => a.status === "graded");
  const stats = {
    taken: graded.length,
    avgOverall: avg(graded.map((a) => a.overallBand)),
    bestOverall: graded.reduce<number | null>(
      (best, a) => (a.overallBand != null && (best == null || a.overallBand > best) ? a.overallBand : best),
      null,
    ),
    avgReading: avg(graded.map((a) => a.readingBand)),
    avgWriting: avg(graded.map((a) => a.writingBand)),
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile &amp; settings</h1>
        <p className="mt-2 text-muted">Set your exam date, target, model and theme.</p>
      </div>

      {/* Stats from real attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Your stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attemptsQ.isLoading ? (
            <div className="flex justify-center py-6 text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : stats.taken === 0 ? (
            <p className="py-4 text-sm text-muted">
              Complete a test to see your stats here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Tests completed" value={String(stats.taken)} />
              <Stat label="Average overall" value={fmtBand(stats.avgOverall)} accent />
              <Stat label="Best overall" value={fmtBand(stats.bestOverall)} accent />
              <Stat label="Avg Reading" value={fmtBand(stats.avgReading)} />
              <Stat label="Avg Writing" value={fmtBand(stats.avgWriting)} />
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={save}>
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field label="Name">
              <Input
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Exam date">
                <Input
                  type="date"
                  value={examDateValue}
                  onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value || null }))}
                />
              </Field>
              <Field label={`Target band: ${(form.targetBand ?? 7).toFixed(1)}`}>
                <input
                  type="range"
                  min={4}
                  max={9}
                  step={0.5}
                  value={form.targetBand ?? 7}
                  onChange={(e) => setForm((f) => ({ ...f, targetBand: Number(e.target.value) }))}
                  className="w-full accent-[hsl(var(--accent))]"
                />
              </Field>
            </div>

            <Field label="Preferred AI model">
              <select
                value={form.model ?? MODELS[0]}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className="h-10 w-full rounded-md border border-line bg-bg px-3 text-sm"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Theme">
              <div className="flex gap-2">
                {(["light", "dark", "system"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={form.theme === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setForm((f) => ({ ...f, theme: t }));
                      setTheme(t);
                    }}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </Field>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
          {mutation.isSuccess && (
            <span className="flex items-center gap-1 text-sm text-success">
              <Check className="size-4" /> Saved
            </span>
          )}
          {mutation.isError && <span className="text-sm text-destructive">Could not save.</span>}
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div
        className={`mt-1 font-mono text-2xl font-bold tabular-nums ${accent ? "text-accent" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
