"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VerifyResult {
  status: string;
  credits?: number;
  balance?: number;
}

function ReturnInner() {
  const params = useSearchParams();
  const invoiceId = params.get("invoice_id") ?? params.get("invoiceId");
  const { call } = useApi();
  const queryClient = useQueryClient();

  const verifyQ = useQuery({
    queryKey: ["wallet", "verify", invoiceId],
    enabled: !!invoiceId,
    retry: 1,
    queryFn: () =>
      call<VerifyResult>("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({ invoiceId }),
      }),
  });

  // Refresh the balance everywhere once a payment completes.
  React.useEffect(() => {
    if (verifyQ.data?.status === "COMPLETED") {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    }
  }, [verifyQ.data?.status, queryClient]);

  let body: React.ReactNode;
  if (!invoiceId) {
    body = (
      <State
        icon={<XCircle className="size-10 text-destructive" />}
        title="No payment to confirm"
        sub="This page is shown after a checkout. There's nothing to verify here."
      />
    );
  } else if (verifyQ.isLoading) {
    body = (
      <State
        icon={<Loader2 className="size-10 animate-spin text-accent" />}
        title="Confirming your payment…"
        sub="Hang tight — this only takes a moment."
      />
    );
  } else if (verifyQ.isError) {
    body = (
      <State
        icon={<XCircle className="size-10 text-destructive" />}
        title="Couldn't confirm the payment"
        sub={verifyQ.error instanceof Error ? verifyQ.error.message : "Please try again."}
      />
    );
  } else if (verifyQ.data?.status === "COMPLETED") {
    body = (
      <State
        icon={<CheckCircle2 className="size-10 text-accent" />}
        title="Payment successful"
        sub={
          verifyQ.data.credits != null
            ? `${verifyQ.data.credits.toLocaleString()} credits added. New balance: ${verifyQ.data.balance?.toLocaleString()}.`
            : "Your credits have been added."
        }
      />
    );
  } else if (verifyQ.data?.status === "PENDING") {
    body = (
      <State
        icon={<Clock className="size-10 text-coral" />}
        title="Payment pending"
        sub="Your payment is being processed. Credits will appear once it's confirmed — check back shortly."
      />
    );
  } else {
    body = (
      <State
        icon={<XCircle className="size-10 text-destructive" />}
        title="Payment not completed"
        sub="The payment wasn't completed. No credits were added and you weren't charged."
      />
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          {body}
          <Link href="/wallet">
            <Button variant="outline">Back to wallet</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function State({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <>
      {icon}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">{sub}</p>
      </div>
    </>
  );
}

export default function WalletReturnPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-md py-20 text-center text-muted">Loading…</div>
      }
    >
      <ReturnInner />
    </React.Suspense>
  );
}
