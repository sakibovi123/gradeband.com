"use client";

import { Check, Flag, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ReviewSection =
  | {
      kind: "questions";
      key: string;
      label: string;
      questions: { num: number; id: string; answered: boolean; flagged: boolean }[];
    }
  | {
      kind: "writing";
      key: string;
      label: string;
      tasks: { label: string; words: number; min: number }[];
    };

/**
 * Pre-submit review: a per-section summary of answered / flagged / under-target
 * items with quick jump-back, then the final submit. Replaces the old
 * browser confirm() so the candidate sees exactly what they're submitting.
 */
export function ReviewPanel({
  sections,
  onJump,
  onSubmit,
  onBack,
  submitting,
}: {
  sections: ReviewSection[];
  onJump: (key: string, qid?: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const gaps = sections.reduce(
    (n, s) =>
      n +
      (s.kind === "questions"
        ? s.questions.filter((q) => !q.answered).length
        : s.tasks.filter((t) => t.words < t.min).length),
    0,
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Review your answers</h2>
        <p className="mt-1 text-sm text-muted">
          Check anything you missed, then submit for grading. You can&apos;t change answers after
          submitting.
        </p>
      </div>

      {sections.map((s) => (
        <div key={s.key} className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">{s.label}</h3>
            <button
              type="button"
              onClick={() => onJump(s.key)}
              className="text-sm font-medium text-accent hover:underline"
            >
              Go to section →
            </button>
          </div>

          {s.kind === "questions" ? (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-wide text-muted">
                <span>
                  {s.questions.filter((q) => q.answered).length}/{s.questions.length} answered
                </span>
                {s.questions.some((q) => q.flagged) && (
                  <span className="flex items-center gap-1">
                    <Flag className="size-3" /> {s.questions.filter((q) => q.flagged).length} flagged
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.questions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onJump(s.key, q.id)}
                    aria-label={`Question ${q.num}${q.answered ? ", answered" : ", not answered"}`}
                    className={cn(
                      "relative grid h-8 w-8 place-items-center rounded-md font-mono text-xs transition-colors",
                      q.answered
                        ? "bg-accent text-accent-foreground"
                        : "border border-line bg-bg text-ink hover:bg-surface",
                    )}
                  >
                    {q.num}
                    {q.flagged && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              {s.tasks.map((t) => (
                <div key={t.label} className="flex items-center justify-between text-sm">
                  <span>{t.label}</span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 font-mono",
                      t.words >= t.min ? "text-success" : "text-muted",
                    )}
                  >
                    {t.words} words
                    {t.words >= t.min ? <Check className="size-3.5" /> : ` · min ${t.min}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {gaps > 0 && (
        <p className="flex items-center gap-2 rounded-md bg-amber-400/10 px-3 py-2 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          {gaps} item{gaps > 1 ? "s are" : " is"} unanswered or below the word target — you can still
          submit.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          Back to test
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          size="lg"
          className="bg-coral text-coral-foreground hover:bg-coral/90"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" /> Submitting…
            </>
          ) : (
            "Submit for grading"
          )}
        </Button>
      </div>
    </div>
  );
}
