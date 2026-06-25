"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import type { Drill } from "@/lib/learn/content";
import type { WritingGrade, WritingVisual as WV } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { ApiClientError } from "@/lib/api";
import { wordCount } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WritingVisual } from "@/components/features/runner/writing-visual";
import { fmtBand } from "@/lib/format";
import { cn } from "@/lib/utils";

type WritingDrill = Extract<Drill, { kind: "writing" }>;

/** Append the figure's data to the prompt so the grader can judge accuracy. */
function visualToText(v: WV): string {
  const unit = v.unit ? ` ${v.unit}` : "";
  const rows = v.series.map(
    (s) => `- ${s.name}: ${s.values.map((val, i) => `${v.categories[i] ?? `#${i + 1}`}=${val}${unit}`).join(", ")}`,
  );
  return [`${v.title} (categories: ${v.categories.join(", ")})`, ...rows].join("\n");
}

export function WritingDrill({ drill }: { drill: WritingDrill }) {
  const { call } = useApi();
  const queryClient = useQueryClient();
  const [text, setText] = React.useState("");
  const [grade, setGrade] = React.useState<WritingGrade | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needsTopUp, setNeedsTopUp] = React.useState(false);

  const [model, setModel] = React.useState<string | null>(null);
  const [modelLoading, setModelLoading] = React.useState(false);
  const [modelError, setModelError] = React.useState<string | null>(null);
  const [modelNeedsTopUp, setModelNeedsTopUp] = React.useState(false);

  const minWords = drill.task === "task1" ? 150 : 250;
  const count = wordCount(text);

  const gradePrompt = drill.visual
    ? `${drill.prompt}\n\nFigure data:\n${visualToText(drill.visual)}`
    : drill.prompt;

  async function grateIt() {
    setLoading(true);
    setError(null);
    setNeedsTopUp(false);
    try {
      const r = await call<{ grade: WritingGrade }>("/api/learn/grade", {
        method: "POST",
        body: JSON.stringify({ task: drill.task, prompt: gradePrompt, text }),
      });
      setGrade(r.grade);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 402) setNeedsTopUp(true);
      setError(err instanceof Error ? err.message : "Couldn't grade your response. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function revealModel() {
    if (model || modelLoading) return;
    setModelLoading(true);
    setModelError(null);
    setModelNeedsTopUp(false);
    try {
      const r = await call<{ answer: string }>("/api/learn/model", {
        method: "POST",
        body: JSON.stringify({ task: drill.task, prompt: gradePrompt }),
      });
      setModel(r.answer);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 402) setModelNeedsTopUp(true);
      setModelError(err instanceof Error ? err.message : "Couldn't load a model answer. Please try again.");
    } finally {
      setModelLoading(false);
    }
  }

  const topUpLink = (
    <>
      {" "}
      <Link href="/wallet" className="font-medium underline">
        Top up your wallet
      </Link>
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-surface p-4">
        <p className="whitespace-pre-wrap text-[15px] leading-7">{drill.prompt}</p>
        {drill.visual && (
          <div className="mt-4">
            <WritingVisual visual={drill.visual} />
          </div>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder="Write your response here…"
          className="min-h-[260px] resize-none rounded-none border-0 bg-transparent p-4 text-[15px] leading-7 focus-visible:ring-0"
        />
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs">
          <span className={cn("font-mono", count < minWords ? "text-muted" : "text-success")}>
            {count} / {minWords} words {count >= minWords ? "✓" : null}
          </span>
          <Button
            size="sm"
            onClick={grateIt}
            disabled={loading || count < 20}
            className="bg-coral text-coral-foreground hover:bg-coral/90"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Grading…
              </>
            ) : (
              <>
                <Sparkles /> Get AI feedback
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          {needsTopUp && topUpLink}
        </p>
      )}

      {grade && (
        <div className="rounded-lg border border-accent/30 bg-accent/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              AI feedback
            </span>
            <span className="font-mono text-2xl font-bold">{fmtBand(grade.band)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["Task", grade.criteria.taskResponse],
                ["Coherence", grade.criteria.coherenceCohesion],
                ["Lexical", grade.criteria.lexicalResource],
                ["Grammar", grade.criteria.grammaticalRange],
              ] as [string, number][]
            ).map(([label, v]) => (
              <div key={label} className="rounded-md border border-line bg-surface px-3 py-2">
                <div className="text-xs text-muted">{label}</div>
                <div className="font-mono text-lg">{fmtBand(v)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">{grade.summary}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-success">Strengths</div>
              <ul className="list-disc pl-4 text-sm text-muted">
                {grade.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">To improve</div>
              <ul className="list-disc pl-4 text-sm text-muted">
                {grade.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* On-demand Band 9 model answer */}
      <div className="rounded-lg border border-accent/30 bg-accent/[0.04]">
        {!model ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-muted">Want to see how a top candidate would answer?</span>
            <Button variant="outline" size="sm" onClick={revealModel} disabled={modelLoading}>
              {modelLoading ? (
                <>
                  <Loader2 className="animate-spin" /> Writing…
                </>
              ) : (
                <>
                  <Sparkles /> Reveal Band 9 model answer
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              <Sparkles className="size-4" /> Band 9 model answer
            </div>
            <p className="whitespace-pre-wrap text-[14px] leading-7">{model}</p>
            <p className="mt-3 text-xs text-muted">
              Study the structure and language, then try the task again.
            </p>
          </div>
        )}
        {modelError && (
          <p role="alert" className="px-4 pb-3 text-sm text-destructive">
            {modelError}
            {modelNeedsTopUp && topUpLink}
          </p>
        )}
      </div>
    </div>
  );
}
