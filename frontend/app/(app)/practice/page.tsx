"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Headphones, BookOpen, PenLine, Mic, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionKey = "reading" | "writing";

const LIVE_SECTIONS: {
  key: SectionKey;
  label: string;
  desc: string;
  icon: typeof BookOpen;
}[] = [
  {
    key: "reading",
    label: "Reading",
    desc: "One academic passage, 10 questions, split-screen. Marked instantly.",
    icon: BookOpen,
  },
  {
    key: "writing",
    label: "Writing",
    desc: "Task 1 + Task 2 prompts, graded against the official band descriptors.",
    icon: PenLine,
  },
];

const SOON_SECTIONS: { label: string; desc: string; icon: typeof Headphones }[] = [
  {
    label: "Listening",
    desc: "Audio comprehension with timed answers.",
    icon: Headphones,
  },
  {
    label: "Speaking",
    desc: "Spoken interview with fluency feedback.",
    icon: Mic,
  },
];

export default function PracticePage() {
  const { call } = useApi();
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function start(section: SectionKey) {
    setLoading(section);
    setError(null);
    try {
      const { attemptId } = await call<{ attemptId: string }>("/api/practice/generate", {
        method: "POST",
        body: JSON.stringify({ section }),
      });
      router.push(`/test/${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start practice. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Practice a single section</h1>
        <p className="mt-2 text-muted">
          Drill one skill in isolation. Practice mode relaxes timing so you can focus on technique.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {LIVE_SECTIONS.map((s) => {
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
                      {isLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Icon className="size-5" />
                      )}
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

      {/* Out of scope for now — clearly labelled placeholders, not half-built flows. */}
      <div>
        <h2 className="text-sm font-mono font-bold uppercase tracking-[0.16em] text-muted">
          Coming soon
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SOON_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.label}
                aria-disabled="true"
                className="h-full cursor-not-allowed opacity-70 shadow-none"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-md bg-muted/10 text-muted">
                        <Icon className="size-5" />
                      </span>
                      <CardTitle className="text-muted">{s.label}</CardTitle>
                    </div>
                    <Badge variant="muted">Coming soon</Badge>
                  </div>
                  <CardDescription className="pt-2">{s.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
