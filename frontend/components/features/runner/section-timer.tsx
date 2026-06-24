"use client";

import { Clock } from "lucide-react";
import { fmtClock } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

/** Persistent, always-visible section countdown (exam-clock feel). */
export function SectionTimer({ remaining, label }: { remaining: number; label?: string }) {
  const low = remaining <= 60;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm tabular-nums",
        low ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-line bg-surface",
      )}
      role="timer"
      aria-live="off"
    >
      <Clock className="size-4" />
      {label && <span className="font-sans text-xs text-muted">{label}</span>}
      <span className="font-semibold">{fmtClock(remaining)}</span>
    </div>
  );
}
