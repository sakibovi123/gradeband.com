"use client";

import * as React from "react";
import { Highlighter as Hi, Eraser } from "lucide-react";

/**
 * Lets the candidate highlight text by selecting it (like the real CD exam).
 * Select text -> a small toolbar appears -> Highlight. Click a highlight to
 * remove it. Operates on stable content (e.g. the reading passage) so marks
 * persist; copy-paste from the text into gap inputs still works normally.
 */
export function Highlighter({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [bar, setBar] = React.useState<{ x: number; y: number } | null>(null);

  function onMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setBar(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) {
      setBar(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    const host = ref.current.getBoundingClientRect();
    setBar({ x: rect.left - host.left + rect.width / 2, y: rect.top - host.top - 8 });
  }

  function highlight() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const mark = document.createElement("mark");
    mark.className = "exam-highlight";
    try {
      range.surroundContents(mark);
    } catch {
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
    }
    sel.removeAllRanges();
    setBar(null);
  }

  function onClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName === "MARK") {
      const parent = target.parentNode!;
      while (target.firstChild) parent.insertBefore(target.firstChild, target);
      parent.removeChild(target);
      parent.normalize();
    }
  }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} onMouseUp={onMouseUp} onClick={onClick}>
      {bar && (
        <div
          className="absolute z-20 flex -translate-x-1/2 -translate-y-full gap-1 rounded-md border border-line bg-surface p-1 shadow-md"
          style={{ left: bar.x, top: bar.y }}
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={highlight}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-bg"
          >
            <Hi className="size-3.5" /> Highlight
          </button>
        </div>
      )}
      <p className="mb-2 flex items-center gap-1 text-xs text-muted">
        <Eraser className="size-3" /> Select text to highlight · click a highlight to remove
      </p>
      {children}
    </div>
  );
}
