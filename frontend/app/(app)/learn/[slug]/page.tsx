"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, PenLine, BookOpen, Check } from "lucide-react";
import { TRACK_LABEL, lessonBySlug, lessonsByTrack } from "@/lib/learn/content";
import { useLessonProgress } from "@/lib/learn/progress";
import { LessonBlocks } from "@/components/features/learn/lesson-blocks";
import { ReadingDrill } from "@/components/features/learn/reading-drill";
import { WritingDrill } from "@/components/features/learn/writing-drill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isComplete, toggle } = useLessonProgress();
  const lesson = lessonBySlug(slug);

  if (!lesson) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-muted">That lesson doesn&apos;t exist.</p>
        <Link href="/learn">
          <Button variant="outline">Back to Learn</Button>
        </Link>
      </div>
    );
  }

  // Prev/next within the same track.
  const inTrack = lessonsByTrack(lesson.track);
  const idx = inTrack.findIndex((l) => l.slug === lesson.slug);
  const prev = inTrack[idx - 1];
  const next = inTrack[idx + 1];

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent"
        >
          <ArrowLeft className="size-4" /> Learn
        </Link>
        <div className="mt-4 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          {TRACK_LABEL[lesson.track]} · {lesson.group}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <Clock className="size-4" /> {lesson.minutes} min read
        </p>
      </div>

      <LessonBlocks blocks={lesson.blocks} />

      {lesson.drill && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-t border-line pt-6">
            {lesson.drill.kind === "reading" ? (
              <BookOpen className="size-5 text-coral" />
            ) : (
              <PenLine className="size-5 text-coral" />
            )}
            <h2 className="text-xl font-semibold tracking-tight">Try it</h2>
          </div>
          {lesson.drill.kind === "reading" ? (
            <ReadingDrill drill={lesson.drill} />
          ) : (
            <WritingDrill drill={lesson.drill} />
          )}
        </section>
      )}

      <div className="flex justify-center border-t border-line pt-6">
        <Button
          variant={isComplete(lesson.slug) ? "secondary" : "default"}
          onClick={() => toggle(lesson.slug)}
          className={cn(isComplete(lesson.slug) && "text-success")}
        >
          <Check className={cn("size-4", !isComplete(lesson.slug) && "opacity-60")} />
          {isComplete(lesson.slug) ? "Completed" : "Mark as complete"}
        </Button>
      </div>

      <nav className="flex items-center justify-between gap-3 pt-2">
        {prev ? (
          <Link
            href={`/learn/${prev.slug}`}
            className="group flex items-center gap-2 text-sm text-muted hover:text-accent"
          >
            <ArrowLeft className="size-4" />
            <span className="text-left">
              <span className="block text-[10px] uppercase tracking-wide">Previous</span>
              <span className="font-medium text-ink group-hover:text-accent">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${next.slug}`}
            className="group flex items-center gap-2 text-right text-sm text-muted hover:text-accent"
          >
            <span>
              <span className="block text-[10px] uppercase tracking-wide">Next</span>
              <span className="font-medium text-ink group-hover:text-accent">{next.title}</span>
            </span>
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
