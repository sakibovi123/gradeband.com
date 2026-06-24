"use client";

import type { PublicQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  questions: PublicQuestion[];
  answers: Record<string, string>;
  flags: Record<string, boolean>;
}

/** Question navigation strip: jump to any question; shows answered/flagged state. */
export function QuestionNav({ questions, answers, flags }: Props) {
  function jump(id: string) {
    document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const answered = questions.filter((q) => answers[q.id]?.trim()).length;

  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          {answered}/{questions.length} answered
        </span>
        <div className="flex items-center gap-3">
          <Legend className="bg-accent" label="answered" />
          <Legend className="border border-line bg-bg" label="empty" />
          <Legend className="bg-amber-400" label="flagged" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const isAnswered = Boolean(answers[q.id]?.trim());
          const isFlagged = flags[q.id];
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => jump(q.id)}
              aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ""}${isFlagged ? ", flagged" : ""}`}
              className={cn(
                "relative grid h-8 w-8 place-items-center rounded-md font-mono text-xs transition-colors",
                isAnswered
                  ? "bg-accent text-accent-foreground"
                  : "border border-line bg-bg text-ink hover:bg-surface",
              )}
            >
              {i + 1}
              {isFlagged && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}
