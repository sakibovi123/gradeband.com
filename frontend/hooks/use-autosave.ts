"use client";

import * as React from "react";
import { useApi } from "@/hooks/use-api";
import type { AnswersPayload } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave of the answers payload to the attempt. Survives refresh:
 * the runner re-hydrates from the persisted attempt on load.
 */
export function useAutosave(attemptId: string, answers: AnswersPayload, enabled: boolean) {
  const { call } = useApi();
  const [state, setState] = React.useState<SaveState>("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = React.useRef(true);
  const serialized = JSON.stringify(answers);

  React.useEffect(() => {
    if (!enabled) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setState("saving");
    timer.current = setTimeout(async () => {
      try {
        await call(`/api/attempts/${attemptId}`, {
          method: "PATCH",
          body: JSON.stringify({ answers: JSON.parse(serialized) }),
        });
        setState("saved");
      } catch {
        setState("error");
      }
    }, 1200);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, attemptId, enabled]);

  return state;
}
