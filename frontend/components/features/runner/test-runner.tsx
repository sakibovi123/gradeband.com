"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, CloudOff } from "lucide-react";
import type { PublicTest, AnswersPayload } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { useAutosave } from "@/hooks/use-autosave";
import { wordCount } from "@/lib/format";
import { ListeningSection } from "./listening-section";
import { ReadingSection } from "./reading-section";
import { WritingSection } from "./writing-section";
import { ReviewPanel, type ReviewSection } from "./review-panel";
import { cn } from "@/lib/utils";

type SectionKey = "listening" | "reading" | "writing";

interface Props {
  test: PublicTest;
  attemptId: string;
  initialAnswers?: AnswersPayload;
  practice?: boolean;
}

export function TestRunner({ test, attemptId, initialAnswers, practice = false }: Props) {
  const router = useRouter();
  const { call } = useApi();

  const sections = React.useMemo<SectionKey[]>(() => {
    const list: SectionKey[] = [];
    if (test.listening?.hasContent) list.push("listening");
    if (test.reading?.hasContent) list.push("reading");
    if (test.writing && (test.writing.task1 || test.writing.task2)) list.push("writing");
    return list;
  }, [test]);

  const [step, setStep] = React.useState(0);
  const [reviewing, setReviewing] = React.useState(false);
  const [answers, setAnswers] = React.useState<AnswersPayload>({
    listening: initialAnswers?.listening ?? {},
    reading: initialAnswers?.reading ?? {},
    writing: initialAnswers?.writing ?? {},
    flags: initialAnswers?.flags ?? {},
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const saveState = useAutosave(attemptId, answers, true);

  const current = sections[step];
  const isLast = step === sections.length - 1;

  const setAnswer = (section: "listening" | "reading", qid: string, value: string) =>
    setAnswers((a) => ({ ...a, [section]: { ...a[section], [qid]: value } }));
  const toggleFlag = (qid: string) =>
    setAnswers((a) => ({ ...a, flags: { ...a.flags, [qid]: !a.flags?.[qid] } }));
  const setWriting = (task: "task1" | "task2", value: string) =>
    setAnswers((a) => ({ ...a, writing: { ...a.writing, [task]: value } }));

  function questionsFor(key: SectionKey) {
    if (key === "reading") return test.reading?.questions ?? [];
    if (key === "listening") return test.listening?.questions ?? [];
    return [];
  }
  function answeredFor(key: SectionKey) {
    const a = key === "reading" ? answers.reading : answers.listening;
    return questionsFor(key).filter((q) => a?.[q.id]?.trim()).length;
  }

  function goToStep(i: number) {
    setReviewing(false);
    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function jumpTo(key: string, qid?: string) {
    const i = sections.indexOf(key as SectionKey);
    if (i < 0) return;
    setReviewing(false);
    setStep(i);
    if (qid) {
      setTimeout(
        () =>
          document.getElementById(`q-${qid}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
        80,
      );
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function advance() {
    if (!isLast) {
      goToStep(step + 1);
      return;
    }
    setReviewing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await call(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      router.push(`/results/${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setSubmitting(false);
    }
  }

  const reviewSections: ReviewSection[] = sections.map((key) => {
    if (key === "writing") {
      const tasks: { label: string; words: number; min: number }[] = [];
      if (test.writing?.task1)
        tasks.push({ label: "Task 1", words: wordCount(answers.writing?.task1 ?? ""), min: 150 });
      if (test.writing?.task2)
        tasks.push({ label: "Task 2", words: wordCount(answers.writing?.task2 ?? ""), min: 250 });
      return { kind: "writing", key, label: "Writing", tasks };
    }
    const a = key === "reading" ? answers.reading : answers.listening;
    return {
      kind: "questions",
      key,
      label: key[0].toUpperCase() + key.slice(1),
      questions: questionsFor(key).map((q, i) => ({
        num: i + 1,
        id: q.id,
        answered: Boolean(a?.[q.id]?.trim()),
        flagged: Boolean(answers.flags?.[q.id]),
      })),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper + autosave */}
      <div className="flex flex-wrap items-center gap-3">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {sections.map((s, i) => {
            const total = questionsFor(s).length;
            const done = i < step || reviewing;
            const active = !reviewing && i === step;
            return (
              <li key={s} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 capitalize transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : done
                        ? "bg-success/15 text-success hover:bg-success/25"
                        : "bg-surface text-muted hover:bg-bg",
                  )}
                >
                  {done && <Check className="size-3.5" />}
                  {s}
                  {total > 0 && (
                    <span className={cn("font-mono text-xs", active ? "opacity-90" : "opacity-70")}>
                      {answeredFor(s)}/{total}
                    </span>
                  )}
                </button>
                {i < sections.length - 1 && <span className="text-muted">→</span>}
              </li>
            );
          })}
          <span className="text-muted">→</span>
          <li>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                reviewing ? "bg-accent text-accent-foreground" : "bg-surface text-muted",
              )}
            >
              Review
            </span>
          </li>
        </ol>

        <div className="ml-auto flex items-center gap-1.5 text-xs" aria-live="polite">
          {saveState === "saving" ? (
            <span className="flex items-center gap-1.5 text-muted">
              <Loader2 className="size-3.5 animate-spin" /> Saving…
            </span>
          ) : saveState === "error" ? (
            <span className="flex items-center gap-1.5 text-destructive">
              <CloudOff className="size-3.5" /> Autosave failed — check your connection
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-success">
              <Save className="size-3.5" /> All changes saved
            </span>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {reviewing ? (
        <ReviewPanel
          sections={reviewSections}
          onJump={jumpTo}
          onSubmit={submit}
          onBack={() => goToStep(sections.length - 1)}
          submitting={submitting}
        />
      ) : (
        <>
          {current === "listening" && test.listening && (
            <ListeningSection
              data={test.listening}
              answers={answers.listening ?? {}}
              flags={answers.flags ?? {}}
              onAnswer={(qid, v) => setAnswer("listening", qid, v)}
              onToggleFlag={toggleFlag}
              onNext={advance}
              practice={practice}
            />
          )}
          {current === "reading" && test.reading && (
            <ReadingSection
              data={test.reading}
              answers={answers.reading ?? {}}
              flags={answers.flags ?? {}}
              onAnswer={(qid, v) => setAnswer("reading", qid, v)}
              onToggleFlag={toggleFlag}
              onNext={advance}
              practice={practice}
            />
          )}
          {current === "writing" && test.writing && (
            <WritingSection
              data={test.writing}
              task1={answers.writing?.task1 ?? ""}
              task2={answers.writing?.task2 ?? ""}
              onChange={setWriting}
              onNext={advance}
              nextLabel={isLast ? "Review & submit" : "Next section"}
              practice={practice}
            />
          )}
        </>
      )}

      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface p-8">
            <Loader2 className="size-8 animate-spin text-accent" />
            <p className="font-medium">Grading your test…</p>
            <p className="text-sm text-muted">Scoring answers and assessing your writing.</p>
          </div>
        </div>
      )}
    </div>
  );
}
