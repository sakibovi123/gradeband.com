"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, PenLine, Loader2, Sparkles, Coins } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { ApiClientError } from "@/lib/api";
import type { Drill } from "@/lib/learn/content";
import { ReadingDrill } from "@/components/features/learn/reading-drill";
import { WritingDrill } from "@/components/features/learn/writing-drill";

type Kind = "reading" | "writing";

/**
 * "Generate more practice" — once a learner has finished the fixed lessons, they
 * can spend credits to generate a fresh AI-written reading/writing guide, shown
 * inline using the same drill renderers. Each button shows its credit cost (live
 * from /api/wallet), and a successful generation refreshes the balance badge.
 */
export function GenerateMore() {
  const { call } = useApi();
  const queryClient = useQueryClient();
  const [drill, setDrill] = React.useState<Drill | null>(null);
  const [needsTopUp, setNeedsTopUp] = React.useState(false);

  const walletQ = useQuery({
    queryKey: ["wallet"],
    queryFn: () => call<{ prices: { guide: Record<Kind, number> } }>("/api/wallet"),
  });
  const guide = walletQ.data?.prices.guide;

  const gen = useMutation({
    mutationFn: (kind: Kind) =>
      call<{ drill: Drill }>("/api/learn/generate", {
        method: "POST",
        body: JSON.stringify({ kind }),
      }),
    onMutate: () => setNeedsTopUp(false),
    onSuccess: ({ drill }) => {
      setDrill(drill);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.status === 402) setNeedsTopUp(true);
    },
  });

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-coral" />
        <h2 className="text-sm font-semibold">Generate more practice</h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        You&apos;ve finished every lesson. Generate a fresh, AI-written guide to keep practising.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <GenButton
          icon={BookOpen}
          label="Reading guide"
          cost={guide?.reading}
          pending={gen.isPending && gen.variables === "reading"}
          disabled={gen.isPending}
          onClick={() => gen.mutate("reading")}
        />
        <GenButton
          icon={PenLine}
          label="Writing guide"
          cost={guide?.writing}
          pending={gen.isPending && gen.variables === "writing"}
          disabled={gen.isPending}
          onClick={() => gen.mutate("writing")}
        />
      </div>

      {gen.isError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {gen.error instanceof Error ? gen.error.message : "Could not generate. Please try again."}
          {needsTopUp && (
            <>
              {" "}
              <Link href="/wallet" className="font-medium underline">
                Top up your wallet
              </Link>
            </>
          )}
        </p>
      )}

      {drill && (
        <div className="mt-6 border-t border-line pt-6">
          <div className="mb-4 flex items-center gap-2">
            {drill.kind === "reading" ? (
              <BookOpen className="size-5 text-coral" />
            ) : (
              <PenLine className="size-5 text-coral" />
            )}
            <h3 className="text-lg font-semibold tracking-tight">
              Your generated {drill.kind} guide
            </h3>
          </div>
          {drill.kind === "reading" ? (
            <ReadingDrill drill={drill} />
          ) : (
            <WritingDrill drill={drill} />
          )}
        </div>
      )}
    </section>
  );
}

function GenButton({
  icon: Icon,
  label,
  cost,
  pending,
  disabled,
  onClick,
}: {
  icon: typeof BookOpen;
  label: string;
  cost: number | undefined;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg px-4 py-3 text-left transition-colors hover:border-accent disabled:opacity-60"
    >
      <span className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-md bg-accent/10 text-accent">
          {pending ? <Loader2 className="size-5 animate-spin" /> : <Icon className="size-5" />}
        </span>
        <span className="font-medium">{label}</span>
      </span>
      <span className="flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-muted">
        <Coins className="size-3 text-coral" />
        {cost ?? "…"}
      </span>
    </button>
  );
}
