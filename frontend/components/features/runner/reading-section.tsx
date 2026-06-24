"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import type { PublicReading } from "@/lib/types";
import { useCountdown } from "@/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { QuestionInput } from "./question-input";
import { QuestionNav } from "./question-nav";
import { SectionTimer } from "./section-timer";
import { Highlighter } from "./highlighter";

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

/**
 * Reading: split screen — passage left, questions right, each pane scrolls
 * independently. Passage text is highlightable; gap inputs accept paste from
 * the passage (browser-native). Single passage ~20 min by default (configurable).
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
  const remaining = useCountdown(durationSec, { running: !practice, onExpire: onNext });

  // Stable passage element so highlight marks survive re-renders.
  const passage = React.useMemo(
    () => (
      <div className="whitespace-pre-wrap text-[15px] leading-7">
        {data.passage}
      </div>
    ),
    [data.passage],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 bg-bg/90 px-1 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-accent" />
          <h2 className="font-semibold">{data.title || "Reading"}</h2>
        </div>
        {!practice && <SectionTimer remaining={remaining} label="Reading" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Passage pane (independent scroll) */}
        <div className="rounded-lg border border-line bg-surface p-5 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
          <Highlighter>{passage}</Highlighter>
        </div>

        {/* Questions pane (independent scroll) */}
        <div className="flex flex-col gap-3 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto lg:pr-1">
          <QuestionNav questions={data.questions} answers={answers} flags={flags} />
          {data.questions.map((q, i) => (
            <QuestionInput
              key={q.id}
              index={i}
              question={q}
              value={answers[q.id]}
              onChange={(v) => onAnswer(q.id, v)}
              flagged={Boolean(flags[q.id])}
              onToggleFlag={() => onToggleFlag(q.id)}
            />
          ))}
          <div className="flex justify-end pb-4">
            <Button onClick={onNext}>Finish Reading</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
