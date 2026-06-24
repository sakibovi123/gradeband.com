"use client";

import * as React from "react";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";
import { fmtClock } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

/**
 * Section countdown clock.
 * - mode "auto": runs immediately, no controls (timed mock — like the real exam).
 * - mode "manual": starts paused with Start / Pause / Resume / Reset controls
 *   (practice mode, so the candidate can time themselves at will).
 * Fires onExpire once when it reaches zero.
 */
export function SectionClock({
  durationSec,
  label,
  mode = "manual",
  onExpire,
}: {
  durationSec: number;
  label?: string;
  mode?: "auto" | "manual";
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = React.useState(durationSec);
  const [running, setRunning] = React.useState(mode === "auto");
  const onExpireRef = React.useRef(onExpire);
  onExpireRef.current = onExpire;

  // Reset if the section duration changes (new section mounts).
  React.useEffect(() => {
    setRemaining(durationSec);
    setRunning(mode === "auto");
  }, [durationSec, mode]);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const done = remaining === 0;
  const started = running || remaining < durationSec;
  const low = remaining <= 60;

  function reset() {
    setRunning(false);
    setRemaining(durationSec);
  }

  return (
    <div className="flex items-center gap-1.5">
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

      {mode === "manual" && (
        <>
          {running ? (
            <button
              type="button"
              onClick={() => setRunning(false)}
              aria-label="Pause timer"
              className="flex items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-bg"
            >
              <Pause className="size-3.5" /> Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (done) setRemaining(durationSec);
                setRunning(true);
              }}
              aria-label={started && !done ? "Resume timer" : "Start timer"}
              className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <Play className="size-3.5" /> {started && !done ? "Resume" : "Start"}
            </button>
          )}
          {started && (
            <button
              type="button"
              onClick={reset}
              aria-label="Reset timer"
              title="Reset"
              className="grid place-items-center rounded-md border border-line bg-surface p-1.5 text-muted transition-colors hover:bg-bg hover:text-ink"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
