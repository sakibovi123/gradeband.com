import { Check, X, AlertTriangle, Sparkles } from "lucide-react";
import type { LessonBlock } from "@/lib/learn/content";
import { cn } from "@/lib/utils";

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
      {children}
    </h3>
  );
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "prose":
      return (
        <div>
          {block.title && <Heading>{block.title}</Heading>}
          <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink/90">{block.body}</p>
        </div>
      );

    case "steps":
      return (
        <div>
          {block.title && <Heading>{block.title}</Heading>}
          <ol className="flex flex-col gap-2">
            {block.items.map((it, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-7">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ol>
        </div>
      );

    case "list": {
      const variant = block.variant ?? "plain";
      const Icon = variant === "do" ? Check : variant === "dont" ? X : variant === "traps" ? AlertTriangle : null;
      const tone =
        variant === "do"
          ? "text-success"
          : variant === "dont"
            ? "text-destructive"
            : variant === "traps"
              ? "text-amber-500"
              : "text-accent";
      return (
        <div>
          {block.title && <Heading>{block.title}</Heading>}
          <ul className="flex flex-col gap-1.5">
            {block.items.map((it, i) => (
              <li key={i} className="flex gap-2 text-[15px] leading-7">
                {Icon ? (
                  <Icon className={cn("mt-1.5 size-4 shrink-0", tone)} />
                ) : (
                  <span className={cn("mt-2.5 size-1.5 shrink-0 rounded-full bg-accent")} />
                )}
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case "bank":
      return (
        <div className="rounded-lg border border-line bg-bg p-4">
          <Heading>{block.title}</Heading>
          <div className="flex flex-col gap-3">
            {block.groups.map((g, i) => (
              <div key={i}>
                <div className="text-sm font-semibold">{g.label}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {g.items.map((it, j) => (
                    <span
                      key={j}
                      className="rounded-md border border-line bg-surface px-2 py-1 text-[13px] text-ink/90"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "template":
      return (
        <div className="rounded-lg border border-line bg-bg p-4">
          {block.title && <Heading>{block.title}</Heading>}
          <ol className="flex flex-col gap-1.5">
            {block.lines.map((l, i) => (
              <li key={i} className="border-l-2 border-accent/40 pl-3 text-[15px] leading-7">
                {l}
              </li>
            ))}
          </ol>
        </div>
      );

    case "model":
      return (
        <div className="rounded-lg border border-accent/30 bg-accent/[0.04] p-4">
          <div className="mb-2 flex items-center justify-between">
            <Heading>{block.title ?? "Model answer"}</Heading>
            <span className="flex items-center gap-1 font-mono text-sm font-bold text-accent">
              <Sparkles className="size-4" /> Band {block.band.toFixed(1)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-[14px] leading-7">{block.answer}</p>
          {block.notes && (
            <ul className="mt-3 flex flex-col gap-1 border-t border-accent/20 pt-3 text-xs text-muted">
              {block.notes.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>
          )}
        </div>
      );

    default:
      return null;
  }
}
