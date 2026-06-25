"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Notifications } from "@/components/features/notifications";
import { WalletBadge } from "@/components/features/wallet-badge";

/**
 * Sticky app header sitting above the content column. Holds the mobile menu
 * trigger and the right-hand icon cluster (theme, notifications, account).
 */
export function AppHeader({ email, onMenu }: { email: string | null; onMenu: () => void }) {
  const initial = (email?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-5 backdrop-blur md:px-8">
      {/* Mobile: open the sidebar drawer */}
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="grid size-9 place-items-center rounded-lg text-ink transition-colors hover:bg-surface md:hidden [&_svg]:size-5"
      >
        <Menu />
      </button>

      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted md:hidden">
        IELTS Mock
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <WalletBadge />
        <ThemeToggle />
        <Notifications />
        <Link
          href="/profile"
          aria-label="Your profile"
          title={email ?? "Profile"}
          className="grid size-9 place-items-center rounded-full bg-accent font-mono text-sm font-bold text-accent-foreground ring-1 ring-line transition-transform hover:scale-105"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
