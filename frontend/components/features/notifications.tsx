"use client";

import * as React from "react";
import { Bell, CheckCheck, FileCheck2, BookOpenCheck, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

type NotifTone = "score" | "content" | "reminder";

type Notif = {
  id: string;
  tone: NotifTone;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const ICONS: Record<NotifTone, React.ComponentType<{ className?: string }>> = {
  score: FileCheck2,
  content: BookOpenCheck,
  reminder: CalendarClock,
};

// Placeholder feed — wire to a real /api/notifications endpoint when it exists.
const SEED: Notif[] = [
  {
    id: "n1",
    tone: "score",
    title: "Writing mock scored",
    body: "Your latest attempt came back at an estimated Band 6.5.",
    time: "12m ago",
    read: false,
  },
  {
    id: "n2",
    tone: "content",
    title: "New Reading set ready",
    body: "Three fresh academic passages were added to Practice.",
    time: "2h ago",
    read: false,
  },
  {
    id: "n3",
    tone: "reminder",
    title: "Exam in 14 days",
    body: "Keep your streak going — try a full timed mock this week.",
    time: "Yesterday",
    read: true,
  },
];

export function Notifications() {
  const [items, setItems] = React.useState<Notif[]>(SEED);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read).length;

  // Close on outside click or Escape.
  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-lg text-ink transition-colors hover:bg-surface [&_svg]:size-[18px]"
      >
        <Bell />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 font-mono text-[10px] font-bold leading-none text-coral-foreground ring-2 ring-bg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              Notifications
            </span>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="flex items-center gap-1.5 text-xs font-medium text-accent transition-opacity hover:underline disabled:cursor-default disabled:text-muted disabled:no-underline disabled:opacity-60"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          </div>

          <ul className="max-h-[22rem] divide-y divide-line overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted">You&apos;re all caught up.</li>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.tone];
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-bg",
                      !n.read && "bg-accent/[0.04]",
                    )}
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent [&_svg]:size-4">
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-coral" />}
                      </div>
                      <p className="mt-0.5 text-xs leading-snug text-muted">{n.body}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted">
                        {n.time}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-line px-4 py-2.5 text-center">
            <button
              type="button"
              className="text-xs font-medium text-accent hover:underline"
              onClick={() => setOpen(false)}
            >
              View all activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
