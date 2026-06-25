"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { useApi } from "@/hooks/use-api";

/**
 * Credit balance pill in the app header. Reads the wallet balance and links to
 * the wallet page. Shares the ["wallet"] query key so any spend/top-up that
 * invalidates it updates this badge too.
 */
export function WalletBadge() {
  const { call } = useApi();
  const { data, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => call<{ balance: number }>("/api/wallet"),
  });
  const balance = data?.balance;

  return (
    <Link
      href="/wallet"
      title="Your credits"
      aria-label={balance == null ? "Credits" : `${balance} credits`}
      className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 font-mono text-sm font-bold tabular-nums text-ink transition-colors hover:bg-bg"
    >
      <Coins className="size-4 text-coral" />
      <span>{isLoading || balance == null ? "…" : balance.toLocaleString()}</span>
    </Link>
  );
}
