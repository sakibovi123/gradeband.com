"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Headphones, BookOpen, PenLine, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    key: "listening" as const,
    label: "Listening",
    desc: "One recording, 8 questions. Answer as you listen.",
    icon: Headphones,
  },
  {
    key: "reading" as const,
    label: "Reading",
    desc: "One academic passage, 10 questions, split-screen.",
    icon: BookOpen,
  },
  {
    key: "writing" as const,
    label: "Writing",
    desc: "Task 1 + Task 2 prompts, graded on the band descriptors.",
    icon: PenLine,
  },
];

export default function PracticePage() {
  const { call } = useApi();
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function start(section: string) {
    setLoading(section);
    setError(null);
    try {
      const { attemptId } = await call<{ attemptId: string }>("/api/practice/generate", {
        method: "POST",
        body: JSON.stringify({ section }),
      });
      router.push(`/test/${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start practice.");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Practice a single section</h1>
        <p className="text-sm text-muted">
          Drill one skill in isolation. Practice mode relaxes timing and lets you replay audio.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isLoading = loading === s.key;
          return (
            <button
              key={s.key}
              type="button"
              disabled={Boolean(loading)}
              onClick={() => start(s.key)}
              className={cn(
                "text-left transition-transform",
                !loading && "hover:-translate-y-0.5",
                loading && !isLoading && "opacity-50",
              )}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-accent/10 text-accent">
                      {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Icon className="size-5" />}
                    </span>
                    <CardTitle>{s.label}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">{s.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-accent">
                    {isLoading ? "Generating…" : "Start practice →"}
                  </span>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
