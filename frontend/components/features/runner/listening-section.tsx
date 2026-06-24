"use client";

import * as React from "react";
import { Play, Volume2 } from "lucide-react";
import type { PublicListening } from "@/lib/types";
import { audioSrc } from "@/lib/format";
import { useCountdown } from "@/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { QuestionInput } from "./question-input";
import { QuestionNav } from "./question-nav";
import { SectionTimer } from "./section-timer";

interface Props {
  data: PublicListening;
  answers: Record<string, string>;
  flags: Record<string, boolean>;
  onAnswer: (qid: string, value: string) => void;
  onToggleFlag: (qid: string) => void;
  onNext: () => void;
  practice?: boolean;
  reviewSeconds?: number;
}

type Phase = "ready" | "playing" | "review";

/**
 * Listening: audio plays once while the candidate answers live. After the audio
 * ends there is a short review window (~2 min, configurable) — matching the CD
 * test, not the paper test. Practice mode relaxes this (replay + no limit).
 */
export function ListeningSection({
  data,
  answers,
  flags,
  onAnswer,
  onToggleFlag,
  onNext,
  practice = false,
  reviewSeconds = 120,
}: Props) {
  const [phase, setPhase] = React.useState<Phase>(practice ? "playing" : "ready");
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const src = audioSrc(data.audioUrl);

  const remaining = useCountdown(reviewSeconds, {
    running: phase === "review" && !practice,
    onExpire: onNext,
  });

  function startAudio() {
    setPhase("playing");
    audioRef.current?.play().catch(() => {});
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 bg-bg/90 px-1 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Volume2 className="size-5 text-accent" />
          <h2 className="font-semibold">{data.title || "Listening"}</h2>
        </div>
        {!practice && phase === "review" && <SectionTimer remaining={remaining} label="Review" />}
        {!practice && phase === "playing" && (
          <span className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-muted">
            Audio playing — answer as you listen
          </span>
        )}
      </div>

      {/* Audio */}
      <div className="rounded-lg border border-line bg-surface p-4">
        {!src ? (
          <p className="text-sm text-muted">
            Audio is unavailable for this test. You can still read the questions; in a real test
            you would hear a recording once.
          </p>
        ) : phase === "ready" && !practice ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted">
              The recording plays <strong>once</strong>. Answer the questions as you listen. You
              cannot replay it.
            </p>
            <Button onClick={startAudio}>
              <Play /> Play recording
            </Button>
          </div>
        ) : (
          <audio
            ref={audioRef}
            src={src}
            autoPlay={!practice}
            controls={practice}
            controlsList={practice ? undefined : "nodownload noplaybackrate"}
            onEnded={() => !practice && setPhase("review")}
            className="w-full"
          />
        )}
        {practice && (
          <p className="mt-2 text-xs text-muted">Practice mode: you can replay the audio freely.</p>
        )}
      </div>

      {phase !== "ready" && (
        <>
          <QuestionNav questions={data.questions} answers={answers} flags={flags} />
          <div className="flex flex-col gap-3">
            {data.questions.map((q, i) => (
              <QuestionInput
                key={q.id}
                index={i}
                question={q}
                value={answers[q.id]}
                onChange={(v) => onAnswer(q.id, v)}
                flagged={Boolean(flags[q.id])}
                onToggleFlag={() => onToggleFlag(q.id)}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={onNext} variant="default">
              Finish Listening
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
