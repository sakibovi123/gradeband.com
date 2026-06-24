"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import type { PublicQuestion } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  index: number;
  question: PublicQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
  flagged: boolean;
  onToggleFlag: () => void;
}

/** Renders a single question by type, with a flag-for-review toggle. */
export function QuestionInput({ index, question, value, onChange, flagged, onToggleFlag }: Props) {
  return (
    <div
      id={`q-${question.id}`}
      className="scroll-mt-24 rounded-lg border border-line bg-surface p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bg font-mono text-xs font-semibold">
            {index + 1}
          </span>
          <p className="text-sm font-medium leading-relaxed">{renderPrompt(question.q)}</p>
        </div>
        <button
          type="button"
          onClick={onToggleFlag}
          aria-pressed={flagged}
          aria-label={flagged ? "Remove flag" : "Flag for review"}
          title="Flag for review"
          className={cn(
            "shrink-0 rounded-md p-1.5 transition-colors",
            flagged ? "bg-accent/15 text-accent" : "text-muted hover:bg-bg",
          )}
        >
          <Flag className="size-4" fill={flagged ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="pl-8">{renderBody(question, value, onChange)}</div>
    </div>
  );
}

function renderPrompt(q: string) {
  // Render gap blanks as a visible underline.
  const parts = q.split("_____");
  if (parts.length === 1) return q;
  return parts.map((p, i) => (
    <React.Fragment key={i}>
      {p}
      {i < parts.length - 1 && <span className="mx-1 font-mono text-muted">_____</span>}
    </React.Fragment>
  ));
}

function renderBody(
  question: PublicQuestion,
  value: string | undefined,
  onChange: (v: string) => void,
) {
  switch (question.type) {
    case "gap":
      return (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer (you can paste from the text)"
          className="max-w-sm"
          aria-label="Answer"
        />
      );
    case "tfng":
      return (
        <ChoiceList
          options={question.options ?? ["True", "False", "Not Given"]}
          value={value}
          onChange={onChange}
          name={question.id}
        />
      );
    case "mcq":
      return (
        <ChoiceList options={question.options ?? []} value={value} onChange={onChange} name={question.id} />
      );
    case "match":
    case "dragdrop":
      return <DragSlot options={question.options ?? []} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function ChoiceList({
  options,
  value,
  onChange,
  name,
}: {
  options: string[];
  value: string | undefined;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <label
            key={opt}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              selected ? "border-accent bg-accent/10" : "border-line hover:bg-bg",
            )}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(opt)}
              className="accent-[hsl(var(--accent))]"
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

/** Click-and-drag slot: drag a chip into the slot, or click a chip to assign. */
function DragSlot({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  const [over, setOver] = React.useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const opt = e.dataTransfer.getData("text/plain");
          if (opt) onChange(opt);
        }}
        className={cn(
          "flex min-h-[44px] items-center justify-between rounded-md border-2 border-dashed px-3 py-2 text-sm",
          over ? "border-accent bg-accent/10" : "border-line",
        )}
      >
        <span className={value ? "font-medium" : "text-muted"}>
          {value || "Drag or click an option to place it here"}
        </span>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-muted hover:text-destructive">
            clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", opt)}
            onClick={() => onChange(opt)}
            className={cn(
              "cursor-grab rounded-md border px-3 py-1.5 text-sm transition-colors active:cursor-grabbing",
              value === opt ? "border-accent bg-accent/10" : "border-line bg-bg hover:bg-surface",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
