"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Headphones,
  BookOpen,
  PenLine,
  Lightbulb,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { BandGauge } from "@/components/features/band-gauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GenerateTestButton } from "@/components/features/generate-test-button";
import { fmtBand } from "@/lib/format";
import type { Attempt, Profile, WritingGrade } from "@/lib/types";

export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { call } = useApi();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => call<{ attempt: Attempt }>(`/api/attempts/${attemptId}`).then((r) => r.attempt),
  });
  const profileQ = useQuery({
    queryKey: ["me"],
    queryFn: () => call<{ profile: Profile }>("/api/me").then((r) => r.profile),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted">
        <Loader2 className="size-8 animate-spin text-accent" /> Loading results…
      </div>
    );
  }
  if (isError || !data) {
    return <p className="py-24 text-center text-destructive">Could not load these results.</p>;
  }

  const a = data;
  const w = a.writingDetail;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your results</h1>
          <p className="text-sm text-muted">
            These bands are <strong>estimates</strong> to guide practice — not official IELTS scores.
          </p>
        </div>
        <Link href="/history" className="text-sm text-accent hover:underline">
          All attempts
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overall gauge */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <BandGauge band={a.overallBand} target={profileQ.data?.targetBand ?? null} />
            {profileQ.data?.targetBand != null && a.overallBand != null && (
              <Badge variant={a.overallBand >= profileQ.data.targetBand ? "success" : "muted"}>
                {a.overallBand >= profileQ.data.targetBand
                  ? "At or above target 🎯"
                  : `${(profileQ.data.targetBand - a.overallBand).toFixed(1)} band to target`}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Section breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Section breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SectionBand icon={<BookOpen className="size-4" />} label="Reading" band={a.readingBand} />
            <SectionBand icon={<PenLine className="size-4" />} label="Writing" band={a.writingBand} />
            {/* Listening only appears for legacy tests that were scored for it. */}
            {a.listeningBand != null && (
              <SectionBand icon={<Headphones className="size-4" />} label="Listening" band={a.listeningBand} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Writing detail */}
      {w && (
        <div className="grid gap-6 lg:grid-cols-2">
          {w.task1 && (
            <WritingCard title="Writing — Task 1" grade={w.task1} modelAnswer={w.modelAnswers?.task1} />
          )}
          {w.task2 && (
            <WritingCard title="Writing — Task 2" grade={w.task2} modelAnswer={w.modelAnswers?.task2} />
          )}
        </div>
      )}

      {/* Focus plan */}
      {a.focusPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-5 text-accent" /> Where to focus next
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted">{a.focusPlan.message}</p>
            <ol className="flex flex-col gap-3">
              {a.focusPlan.focus.map((f, i) => (
                <li key={i} className="rounded-lg border border-line bg-bg p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-accent font-mono text-xs text-accent-foreground">
                      {i + 1}
                    </span>
                    {f.area}
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{f.why}</p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-sm">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{f.action}</span>
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <GenerateTestButton />
        <Link href="/practice">
          <Button variant="outline">Practise a single section</Button>
        </Link>
      </div>
    </div>
  );
}

function SectionBand({
  icon,
  label,
  band,
}: {
  icon: React.ReactNode;
  label: string;
  band: number | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line bg-bg p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
        {icon}
        {label}
      </div>
      <div className="font-mono text-3xl font-bold tabular-nums">{fmtBand(band)}</div>
    </div>
  );
}

function WritingCard({
  title,
  grade,
  modelAnswer,
}: {
  title: string;
  grade: WritingGrade;
  modelAnswer?: string | null;
}) {
  const criteria: [string, number][] = [
    ["Task Response", grade.criteria.taskResponse],
    ["Coherence & Cohesion", grade.criteria.coherenceCohesion],
    ["Lexical Resource", grade.criteria.lexicalResource],
    ["Grammatical Range", grade.criteria.grammaticalRange],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <span className="font-mono text-2xl">{fmtBand(grade.band)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {criteria.map(([label, val]) => (
            <div key={label} className="rounded-md border border-line bg-bg px-3 py-2">
              <div className="text-xs text-muted">{label}</div>
              <div className="font-mono text-lg">{fmtBand(val)}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted">{grade.summary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-success">Strengths</div>
            <ul className="list-disc pl-4 text-sm text-muted">
              {grade.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">To improve</div>
            <ul className="list-disc pl-4 text-sm text-muted">
              {grade.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        {modelAnswer && <ModelAnswer text={modelAnswer} />}
      </CardContent>
    </Card>
  );
}

function ModelAnswer({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <Sparkles className="size-4 text-accent" />
        <span className="text-sm font-semibold">Band 9 model answer</span>
        <ChevronDown
          className={`ml-auto size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-accent/20 px-4 py-3">
          <p className="whitespace-pre-wrap text-[14px] leading-7">{text}</p>
          <p className="mt-3 text-xs text-muted">
            A sample high-scoring response — study its structure and language, then try again.
          </p>
        </div>
      )}
    </div>
  );
}
