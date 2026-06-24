"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save } from "lucide-react";
import type { PublicTest, AnswersPayload } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { useAutosave } from "@/hooks/use-autosave";
import { ListeningSection } from "./listening-section";
import { ReadingSection } from "./reading-section";
import { WritingSection } from "./writing-section";
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
  const [answers, setAnswers] = React.useState<AnswersPayload>({
    listening: initialAnswers?.listening ?? {},
    reading: initialAnswers?.reading ?? {},
    writing: initialAnswers?.writing ?? {},
    flags: initialAnswers?.flags ?? {},
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const saveState = useAutosave(attemptId, answers, !practice || true);

  const current = sections[step];
  const isLast = step === sections.length - 1;

  const setAnswer = (section: "listening" | "reading", qid: string, value: string) =>
    setAnswers((a) => ({ ...a, [section]: { ...a[section], [qid]: value } }));
  const toggleFlag = (qid: string) =>
    setAnswers((a) => ({ ...a, flags: { ...a.flags, [qid]: !a.flags?.[qid] } }));
  const setWriting = (task: "task1" | "task2", value: string) =>
    setAnswers((a) => ({ ...a, writing: { ...a.writing, [task]: value } }));

  async function advance() {
    if (!isLast) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await submit();
  }

  async function submit() {
    if (!confirm("Submit your test for grading? You won't be able to change your answers.")) return;
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

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-3">
        <ol className="flex items-center gap-2 text-sm">
          {sections.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 capitalize",
                  i === step
                    ? "bg-accent text-accent-foreground"
                    : i < step
                      ? "bg-success/15 text-success"
                      : "bg-surface text-muted",
                )}
              >
                {i < step && <Check className="size-3.5" />}
                {s}
              </span>
              {i < sections.length - 1 && <span className="text-muted">→</span>}
            </li>
          ))}
        </ol>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          {saveState === "saving" ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Saving…
            </>
          ) : saveState === "error" ? (
            <span className="text-destructive">Autosave failed — check your connection</span>
          ) : (
            <>
              <Save className="size-3.5" /> Saved
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Active section */}
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
          nextLabel={isLast ? "Submit test" : "Next section"}
          practice={practice}
        />
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
