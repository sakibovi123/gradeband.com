"use client";

import * as React from "react";

const KEY = "ielts-learn-progress";
const EVENT = "learn-progress-change";

function read(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * Tracks completed lessons in localStorage. Lightweight and offline — a learner
 * marks lessons done; the hub reflects progress. Updates live in the same tab
 * via a custom event and across tabs via the storage event.
 */
export function useLessonProgress() {
  const [map, setMap] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setMap(read());
    const refresh = () => setMap(read());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const toggle = React.useCallback((slug: string) => {
    const next = read();
    if (next[slug]) delete next[slug];
    else next[slug] = true;
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return {
    isComplete: (slug: string) => Boolean(map[slug]),
    completedCount: Object.values(map).filter(Boolean).length,
    toggle,
  };
}
