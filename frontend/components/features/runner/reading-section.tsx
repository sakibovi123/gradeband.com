"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import type { PublicReading, PublicQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { QuestionInput } from "./question-input";
import { QuestionNav } from "./question-nav";
import { SectionClock } from "./section-clock";
import { Highlighter } from "./highlighter";
import { cn } from "@/lib/utils";

interface Props {
  data: PublicReading;
  answers: Record<string, string>;
  flags: Record<string, boolean>;
  onAnswer: (qid: string, value: string) => void;
  onToggleFlag: (qid: string) => void;
  onNext: () => void;
  practice?: boolean;
  durationSec?: number;
}

/** IELTS-style instruction shown above each run of same-type questions. */
const TYPE_INSTRUCTION: Record<PublicQuestion["type"], string> = {
  tfng: "Do the following statements agree with the information in the passage? Choose True, False, or Not Given.",
  mcq: "Choose the correct answer for each question.",
  gap: "Complete each sentence with words taken from the passage.",
  match: "Match each statement with the correct option.",
  dragdrop: "Drag the correct option into each gap.",
};
const TYPE_LABEL: Record<PublicQuestion["type"], string> = {
  tfng: "True / False / Not Given",
  mcq: "Multiple choice",
  gap: "Sentence completion",
  match: "Matching",
  dragdrop: "Matching",
};

/**
 * Reading: split screen — passage left, questions right. The divider between the
 * panes is draggable on desktop so the candidate can size each pane; each pane
 * scrolls independently. Questions are grouped by type with an instruction
 * header, preserving the original numbering.
 */
export function ReadingSection({
  data,
  answers,
  flags,
  onAnswer,
  onToggleFlag,
  onNext,
  practice = false,
  durationSec = 20 * 60,
}: Props) {
  // Draggable divider (desktop only).
  const containerRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);
  const [leftPct, setLeftPct] = React.useState(54);
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      setLeftPct(Math.min(68, Math.max(32, pct)));
    }
    function onUp() {
      draggingRef.current = false;
      setDragging(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const passage = React.useMemo(
    () => <div className="whitespace-pre-wrap text-[15px] leading-7">{data.passage}</div>,
    [data.passage],
  );

  // Group consecutive same-type questions, keeping each question's original index.
  const groups = React.useMemo(() => {
    const out: { type: PublicQuestion["type"]; items: { q: PublicQuestion; index: number }[] }[] = [];
    data.questions.forEach((q, index) => {
      const last = out[out.length - 1];
      if (last && last.type === q.type) last.items.push({ q, index });
      else out.push({ type: q.type, items: [{ q, index }] });
    });
    return out;
  }, [data.questions]);

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-16 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 bg-bg/90 px-1 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-accent" />
          <h2 className="font-semibold">{data.title || "Reading"}</h2>
        </div>
        <SectionClock
          durationSec={durationSec}
          label="Reading"
          mode={practice ? "manual" : "auto"}
          onExpire={practice ? undefined : onNext}
        />
      </div>

      <div
        ref={containerRef}
        className={cn("flex flex-col gap-4 lg:grid lg:items-start lg:gap-0", dragging && "select-none")}
        style={{ gridTemplateColumns: `${leftPct}fr 14px ${100 - leftPct}fr` }}
      >
        {/* Passage pane */}
        <div className="rounded-lg border border-line bg-surface p-5 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
          <Highlighter>{passage}</Highlighter>
        </div>

        {/* Drag handle (desktop) */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            draggingRef.current = true;
            setDragging(true);
          }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panes"
          className="group hidden cursor-col-resize items-center justify-center lg:flex"
        >
          <div
            className={cn(
              "h-16 w-1 rounded-full transition-colors",
              dragging ? "bg-accent" : "bg-line group-hover:bg-accent",
            )}
          />
        </div>

        {/* Questions pane */}
        <div className="flex flex-col gap-3 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto lg:pl-1">
          <QuestionNav questions={data.questions} answers={answers} flags={flags} />
          {groups.map((g, gi) => {
            const first = g.items[0]!.index + 1;
            const last = g.items[g.items.length - 1]!.index + 1;
            return (
              <div key={gi} className="flex flex-col gap-3">
                <div className="rounded-md border border-line bg-bg px-3 py-2">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                    Questions {first === last ? first : `${first}–${last}`} · {TYPE_LABEL[g.type]}
                  </div>
                  <p className="mt-1 text-xs text-muted">{TYPE_INSTRUCTION[g.type]}</p>
                </div>
                {g.items.map(({ q, index }) => (
                  <QuestionInput
                    key={q.id}
                    index={index}
                    question={q}
                    value={answers[q.id]}
                    onChange={(v) => onAnswer(q.id, v)}
                    flagged={Boolean(flags[q.id])}
                    onToggleFlag={() => onToggleFlag(q.id)}
                  />
                ))}
              </div>
            );
          })}
          <div className="flex justify-end pb-4">
            <Button onClick={onNext}>Finish Reading</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
