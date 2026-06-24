"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/features/app-sidebar";
import { AppHeader } from "@/components/features/app-header";

/**
 * Client shell that wires the persistent sidebar, the sticky header, and the
 * page content together — and shares the mobile drawer's open state between the
 * header's menu button and the sidebar.
 */
export function AppShell({ email, children }: { email: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:flex md:items-start">
      <AppSidebar email={email} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <AppHeader email={email} onMenu={() => setOpen(true)} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
