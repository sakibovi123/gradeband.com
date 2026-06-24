"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";

const MODELS = [
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct",
];

export default function ProfilePage() {
  const { call } = useApi();
  const qc = useQueryClient();
  const { setTheme } = useTheme();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => call<{ profile: Profile }>("/api/me").then((r) => r.profile),
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

  const examDateValue = form.examDate ? form.examDate.slice(0, 10) : "";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile &amp; settings</h1>
        <p className="text-sm text-muted">Set your exam date, target, model and theme.</p>
      </div>

      <form onSubmit={save}>
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
