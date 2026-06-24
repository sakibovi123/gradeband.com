"use client";

import * as React from "react";

/**
 * Simple seconds countdown. `running` gates ticking; `onExpire` fires once when
 * it reaches zero. Resets when `seconds` key changes (new section).
 */
export function useCountdown(seconds: number, opts: { running: boolean; onExpire?: () => void }) {
  const [remaining, setRemaining] = React.useState(seconds);
  const expiredRef = React.useRef(false);
  const onExpireRef = React.useRef(opts.onExpire);
  onExpireRef.current = opts.onExpire;

  React.useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [seconds]);

  React.useEffect(() => {
    if (!opts.running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [opts.running]);

  return remaining;
}

export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
