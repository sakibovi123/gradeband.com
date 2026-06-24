"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import type { Drill } from "@/lib/learn/content";
import { isAnswerCorrect } from "@/lib/learn/score";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ReadingDrill = Extract<Drill, { kind: "reading" }>;

export function ReadingDrill({ drill }: { drill: ReadingDrill }) {
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [checked, setChecked] = React.useState(false);

  const score = drill.questions.filter((q, i) => isAnswerCorrect(q.answer, answers[i])).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-surface p-4 text-[15px] leading-7">
        <p className="whitespace-pre-wrap">{drill.passage}</p>
      </div>

      <p className="text-sm text-muted">{drill.instructions}</p>

      <div className="flex flex-col gap-3">
        {drill.questions.map((q, i) => {
          const val = answers[i] ?? "";
          const correct = isAnswerCorrect(q.answer, val);
          return (
            <div key={i} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-start gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-bg font-mono text-xs font-semibold">
                  {i + 1}
                </span>
                <p className="text-sm font-medium leading-relaxed">{q.q}</p>
              </div>

              <div className="mt-3 pl-8">
                {q.options ? (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        disabled={checked}
                        onClick={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm transition-colors",
                          val === opt ? "border-accent bg-accent/10" : "border-line hover:bg-bg",
                          checked && q.answer.split("/").includes(opt) && "border-success bg-success/10",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input
                    value={val}
                    disabled={checked}
                    onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                    placeholder="Type your answer"
                    className="max-w-xs"
                  />
                )}

                {checked && (
                  <div
                    className={cn(
                      "mt-2 flex items-start gap-2 rounded-md px-3 py-2 text-sm",
                      correct ? "bg-success/10 text-ink" : "bg-destructive/10 text-ink",
                    )}
                  >
                    {correct ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <span>
                      {!correct && (
                        <>
                          Answer: <strong>{q.answer.replace(/\//g, " / ")}</strong>.{" "}
                        </>
                      )}
                      {q.explanation}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {!checked ? (
          <Button onClick={() => setChecked(true)} disabled={Object.keys(answers).length === 0}>
            Check answers
          </Button>
        ) : (
          <>
            <span className="font-mono text-sm font-semibold">
              Score: {score}/{drill.questions.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChecked(false);
                setAnswers({});
              }}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
