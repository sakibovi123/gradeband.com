"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Coins, Loader2, Sparkles, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CreditPackage {
  id: string;
  amountBdt: number;
  credits: number;
  bonus?: string;
}
interface WalletData {
  balance: number;
  prices: {
    practice: { reading: number; listening: number; writing: number };
    mock: number;
    learn: { grade: number; model: number };
  };
}
interface Transaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  reason: string;
  createdAt: string;
}

/** Turn a ledger `reason` code into a human label. */
function reasonLabel(reason: string): string {
  const map: Record<string, string> = {
    "practice:reading": "Reading practice",
    "practice:listening": "Listening practice",
    "practice:writing": "Writing practice",
    mock: "Full mock test",
    "learn:grade": "Learn — essay grade",
    "learn:model": "Learn — model answer",
    topup: "Credit top-up",
    welcome: "Welcome credits",
  };
  if (map[reason]) return map[reason];
  if (reason.endsWith(":refund")) return `${reasonLabel(reason.slice(0, -7))} (refund)`;
  return reason;
}

export default function WalletPage() {
  const { call } = useApi();

  const walletQ = useQuery({
    queryKey: ["wallet"],
    queryFn: () => call<WalletData>("/api/wallet"),
  });
  const packagesQ = useQuery({
    queryKey: ["wallet", "packages"],
    queryFn: () => call<{ packages: CreditPackage[] }>("/api/payments/packages").then((r) => r.packages),
  });
  const txQ = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () =>
      call<{ transactions: Transaction[] }>("/api/wallet/transactions").then((r) => r.transactions),
  });

  const buy = useMutation({
    mutationFn: (packageId: string) =>
      call<{ paymentUrl: string }>("/api/payments/create-charge", {
        method: "POST",
        body: JSON.stringify({ packageId }),
      }),
    onSuccess: ({ paymentUrl }) => {
      // Hand off to the UddoktaPay hosted checkout.
      window.location.href = paymentUrl;
    },
  });

  const balance = walletQ.data?.balance;
  const prices = walletQ.data?.prices;

  return (
    <div className="flex flex-col gap-9">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          <span className="h-px w-5 bg-accent" />
          Wallet
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Credits</h1>
        <p className="mt-2 text-muted">
          You pay only for what you use. Top up with bKash, then spend credits on practice, mock
          tests, and Learn feedback.
        </p>
      </div>

      {/* Balance */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Current balance
            </div>
            <div className="mt-2 flex items-center gap-2.5">
              <Coins className="size-7 text-coral" />
              <span className="font-mono text-4xl font-bold tabular-nums text-ink">
                {walletQ.isLoading || balance == null ? "…" : balance.toLocaleString()}
              </span>
              <span className="text-muted">credits</span>
            </div>
          </div>
          <a href="#packages">
            <Button size="lg" className="bg-coral text-coral-foreground hover:bg-coral/90">
              Top up
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Packages */}
      <div id="packages" className="scroll-mt-20">
        <h2 className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Top up
        </h2>
        {buy.isError && (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {buy.error instanceof Error ? buy.error.message : "Could not start the payment."}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packagesQ.isLoading
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
            : (packagesQ.data ?? []).map((pkg) => {
                const pending = buy.isPending && buy.variables === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className="relative flex flex-col rounded-xl border border-line bg-surface p-5 shadow-sm"
                  >
                    {pkg.bonus && (
                      <Badge variant="success" className="absolute right-3 top-3 gap-1">
                        <Sparkles className="size-3" />
                        {pkg.bonus}
                      </Badge>
                    )}
                    <div className="font-mono text-3xl font-bold tabular-nums text-ink">
                      {pkg.credits.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-muted">credits</div>
                    <div className="mt-4 text-sm text-muted">৳{pkg.amountBdt.toLocaleString()}</div>
                    <Button
                      onClick={() => buy.mutate(pkg.id)}
                      disabled={buy.isPending}
                      className="mt-4 w-full"
                    >
                      {pending ? <Loader2 className="animate-spin" /> : "Buy"}
                    </Button>
                  </div>
                );
              })}
        </div>
        <p className="mt-3 text-xs text-muted">
          Payments are processed securely by UddoktaPay. 1 credit = ৳1.
        </p>
      </div>

      {/* What things cost */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            What things cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletQ.isLoading || !prices ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <PriceRow label="Full mock test" cost={prices.mock} />
              <PriceRow label="Writing practice" cost={prices.practice.writing} />
              <PriceRow label="Listening practice" cost={prices.practice.listening} />
              <PriceRow label="Reading practice" cost={prices.practice.reading} />
              <PriceRow label="Learn — essay grade" cost={prices.learn.grade} />
              <PriceRow label="Learn — model answer" cost={prices.learn.model} />
            </ul>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txQ.isLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (txQ.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(txQ.data ?? []).map((t) => {
                const credit = t.amount > 0;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-full [&_svg]:size-4",
                        credit ? "bg-accent/10 text-accent" : "bg-surface text-muted",
                      )}
                    >
                      {credit ? <ArrowUpRight /> : <ArrowDownRight />}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-ink">{reasonLabel(t.reason)}</div>
                      <div className="text-xs text-muted">{fmtDate(t.createdAt)}</div>
                    </div>
                    <span
                      className={cn(
                        "ml-auto font-mono text-sm font-bold tabular-nums",
                        credit ? "text-accent" : "text-ink",
                      )}
                    >
                      {credit ? "+" : ""}
                      {t.amount}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PriceRow({ label, cost }: { label: string; cost: number }) {
  return (
    <li className="flex items-center justify-between border-b border-line/60 py-2 text-sm last:border-0">
      <span className="text-ink">{label}</span>
      <span className="font-mono font-bold tabular-nums text-muted">{cost} cr</span>
    </li>
  );
}
