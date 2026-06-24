"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, PenLine, GraduationCap, Sparkles, Clock, ArrowRight, Check } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { LESSONS, TRACK_LABEL, type Lesson, type Track } from "@/lib/learn/content";
import { useLessonProgress } from "@/lib/learn/progress";
import { cn } from "@/lib/utils";
import type { Attempt } from "@/lib/types";

const TRACK_ORDER: Track[] = ["foundations", "reading", "writing"];
const TRACK_ICON = { foundations: GraduationCap, reading: BookOpen, writing: PenLine } as const;

export default function LearnHub() {
  const { call } = useApi();
  const { isComplete, completedCount } = useLessonProgress();
  const attemptsQ = useQuery({
    queryKey: ["attempts"],
    queryFn: () => call<{ attempts: Attempt[] }>("/api/attempts").then((r) => r.attempts),
  });

  // Recommend the weaker skill from the latest graded attempt.
  const graded = (attemptsQ.data ?? []).filter((a) => a.status === "graded");
  const latest = graded[0];
  let recommendedTrack: Track | null = null;
  if (latest) {
    const r = latest.readingBand ?? -1;
    const w = latest.writingBand ?? -1;
    recommendedTrack = w <= r ? "writing" : "reading";
  }
  const recommended = recommendedTrack
    ? LESSONS.filter((l) => l.track === recommendedTrack).slice(0, 3)
    : [];

  return (
    <div className="flex flex-col gap-9">
      <div>
        <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          <span className="h-px w-5 bg-accent" />
          Learn
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Study how to reach Band 8
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Short lessons for every Reading and Writing question type — strategy, the language that
          scores, and interactive practice that marks itself.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.round((completedCount / LESSONS.length) * 100)}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted">
            {completedCount}/{LESSONS.length} lessons complete
          </span>
        </div>
      </div>

      {recommended.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-coral" />
            <h2 className="text-sm font-semibold">
              Recommended from your last result — focus on {TRACK_LABEL[recommendedTrack!]}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {recommended.map((l) => (
              <LessonCard key={l.slug} lesson={l} done={isComplete(l.slug)} />
            ))}
          </div>
        </section>
      )}

      {TRACK_ORDER.map((track) => {
        const lessons = LESSONS.filter((l) => l.track === track);
        if (lessons.length === 0) return null;
        const Icon = TRACK_ICON[track];
        return (
          <section key={track}>
            <div className="mb-4 flex items-center gap-2">
              <Icon className="size-5 text-accent" />
              <h2 className="text-xl font-semibold tracking-tight">{TRACK_LABEL[track]}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((l) => (
                <LessonCard key={l.slug} lesson={l} done={isComplete(l.slug)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function LessonCard({ lesson, done }: { lesson: Lesson; done?: boolean }) {
  return (
    <Link
      href={`/learn/${lesson.slug}`}
      className={cn(
        "group flex h-full flex-col rounded-xl border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent",
        done ? "border-success/40" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {lesson.group}
        </span>
        {done ? (
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
            <Check className="size-3" /> Done
          </span>
        ) : (
          lesson.drill && (
            <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
              Interactive
            </span>
          )
        )}
      </div>
      <h3 className="mt-2 font-semibold">{lesson.title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted">{lesson.summary}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {lesson.minutes} min
        </span>
        <span className="flex items-center gap-1 font-medium text-accent">
          Start <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
