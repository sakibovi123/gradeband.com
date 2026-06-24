"use client";

import * as React from "react";
import { PenLine } from "lucide-react";
import type { PublicWriting } from "@/lib/types";
import { wordCount } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionClock } from "./section-clock";
import { WritingVisual } from "./writing-visual";
import { WritingHints } from "./writing-hints";
import { cn } from "@/lib/utils";

interface Props {
  data: PublicWriting;
  task1: string;
  task2: string;
  onChange: (task: "task1" | "task2", value: string) => void;
  onNext: () => void;
  nextLabel?: string;
  practice?: boolean;
  durationSec?: number;
}

/**
 * Writing: typed editor with live word count and undo/redo (native). Browser
 * spellcheck/autocorrect are disabled to mirror the real exam (no spell checker).
 * Task 1 (~20 min, 150+ words) then Task 2 (~40 min, 250+ words).
 */
export function WritingSection({
  data,
  task1,
  task2,
  onChange,
  onNext,
  nextLabel = "Submit test",
  practice = false,
  durationSec = 60 * 60,
}: Props) {
  const hasTask1 = Boolean(data.task1?.prompt);
  const [tab, setTab] = React.useState<"task1" | "task2">(hasTask1 ? "task1" : "task2");

  const active = tab === "task1" ? data.task1 : data.task2;
  const value = tab === "task1" ? task1 : task2;
  const minWords = tab === "task1" ? 150 : 250;
  const recMin = tab === "task1" ? 20 : 40;
  const count = wordCount(value);

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-16 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 bg-bg/90 px-1 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <PenLine className="size-5 text-accent" />
          <h2 className="font-semibold">Writing</h2>
        </div>
        <SectionClock
          durationSec={durationSec}
          label="Writing"
          mode={practice ? "manual" : "auto"}
          onExpire={practice ? undefined : onNext}
        />
      </div>

      {hasTask1 && (
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {(["task1", "task2"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t ? "bg-accent text-accent-foreground" : "text-muted hover:bg-bg",
              )}
            >
              {t === "task1" ? "Task 1" : "Task 2"}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5 lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{tab === "task1" ? "Task 1" : "Task 2"}</h3>
            <span className="text-xs text-muted">
              ~{recMin} min · min {minWords} words
            </span>
          </div>
          <p className="whitespace-pre-wrap text-[15px] leading-7">{active?.prompt}</p>
          {tab === "task1" && data.task1?.visual && (
            <div className="mt-4">
              <WritingVisual visual={data.task1.visual} />
            </div>
          )}
          {practice && (
            <div className="mt-4">
              <WritingHints task={tab} />
            </div>
          )}
        </div>

        <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface lg:max-h-[calc(100dvh-12rem)]">
          <Textarea
            value={value}
            onChange={(e) => onChange(tab, e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Type your response here…"
            className="min-h-[440px] flex-1 resize-none rounded-none border-0 bg-transparent p-5 font-sans text-[15px] leading-7 focus-visible:ring-0 lg:min-h-0"
            aria-label={`${tab === "task1" ? "Task 1" : "Task 2"} response`}
          />
          {/* Sticky footer: live word-count progress toward the task minimum. */}
          <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2.5 text-xs">
            <span className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-mono text-sm font-semibold tabular-nums",
                  count < minWords ? "text-ink" : "text-success",
                )}
              >
                {count}
              </span>
              <span className="text-muted">
                / {minWords} words {count >= minWords ? "✓" : null}
              </span>
            </span>
            <span className="text-muted">Spell-check off, like the real exam</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-4">
        <Button onClick={onNext}>{nextLabel}</Button>
      </div>
    </div>
  );
}
