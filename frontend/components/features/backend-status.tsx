"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Health = {
  status: string;
  service: string;
  env: string;
  configured: Record<string, boolean>;
};

/** Live connectivity check between the frontend (:3099) and backend (:4099). */
export function BackendStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<Health>("/health"),
    refetchInterval: 15_000,
  });

  const ok = !isError && data?.status === "ok";

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full",
            isLoading ? "bg-muted animate-pulse" : ok ? "bg-success" : "bg-destructive",
          )}
          aria-hidden
        />
        <span className="font-mono text-sm">
          {isLoading ? "Connecting to API…" : ok ? "API connected (:4099)" : "API unreachable"}
        </span>
      </div>
      {data?.configured && (
        <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-muted">
          {Object.entries(data.configured).map(([key, on]) => (
            <li key={key} className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-success" : "bg-line")} />
              <span className="capitalize">{key}</span>
              <span className="ml-auto font-mono">{on ? "ready" : "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
