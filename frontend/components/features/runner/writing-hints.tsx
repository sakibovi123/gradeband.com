"use client";

import * as React from "react";
import { Lightbulb, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Block = { heading: string; points: string[] };

const TASK1: Block[] = [
  {
    heading: "Structure (4 paragraphs)",
    points: [
      "Intro: paraphrase the question — say what the figure shows, where and when. Never copy the prompt wording.",
      "Overview: 1–2 sentences on the biggest, most important features or trends. No numbers here. A clear overview is required for Band 7+.",
      "Body 1 & 2: group the data logically and support each point with specific figures and comparisons.",
    ],
  },
  {
    heading: "Language a Band 8–9 uses",
    points: [
      "Trends: rose, climbed, surged, peaked, fell, declined, dipped, fluctuated, levelled off, remained stable.",
      "Comparisons: higher/lower than, more than double, the highest/lowest, whereas, while, by contrast.",
      "Approximation: approximately, just over/under, around, roughly, nearly.",
    ],
  },
  {
    heading: "Do / Don't",
    points: [
      "Do: select and report only the main features; quote accurate data; vary complex sentences.",
      "Don't: give opinions, explain causes, or describe every single data point.",
      "Target ~170–190 words in ~20 minutes.",
    ],
  },
];

const TASK2: Block[] = [
  {
    heading: "Structure (intro · 2 body · conclusion)",
    points: [
      "Intro: paraphrase the question, then state a clear position/thesis that answers it directly.",
      "Each body paragraph: one central idea (topic sentence) → explain it → a specific, developed example → link back to the question.",
      "Conclusion: restate your position and summarise your main points. Add no new ideas.",
    ],
  },
  {
    heading: "What pushes you to Band 8–9",
    points: [
      "Answer ALL parts of the question (e.g. both views AND your opinion; or problem AND solution).",
      "Cohesion: use linkers naturally — However, Furthermore, As a result, For instance — plus referencing and clear paragraphing.",
      "Range: topic-specific vocabulary and collocations; mix complex grammar (conditionals, relative clauses, passives) accurately.",
    ],
  },
  {
    heading: "Process",
    points: [
      "Plan for ~5 minutes before writing — decide your position and two main ideas.",
      "Develop two ideas deeply rather than listing many shallow ones.",
      "Target ~270–300 words in ~40 minutes; leave 2–3 minutes to check.",
    ],
  },
];

/**
 * Collapsible coaching panel (practice mode only): how a Band 8–9 candidate
 * approaches the current task. Educational guidance, not task-specific answers.
 */
export function WritingHints({ task }: { task: "task1" | "task2" }) {
  const [open, setOpen] = React.useState(false);
  const blocks = task === "task1" ? TASK1 : TASK2;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <Lightbulb className="size-4 text-accent" />
        <span className="text-sm font-semibold">
          How to score Band 8–9 on {task === "task1" ? "Task 1" : "Task 2"}
        </span>
        <ChevronDown
          className={cn(
            "ml-auto size-4 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-accent/20 px-4 py-4">
          {blocks.map((b) => (
            <div key={b.heading}>
              <div className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                {b.heading}
              </div>
              <ul className="flex flex-col gap-1.5">
                {b.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-snug text-ink/90">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-muted">
            Tips only — practice mode won&apos;t write the answer for you.
          </p>
        </div>
      )}
    </div>
  );
}
