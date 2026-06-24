"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PencilRuler, History, User, LogOut, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice", label: "Practice", icon: PencilRuler },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/**
 * App shell navigation as a dark "instrument-panel" sidebar that echoes the
 * landing aesthetic. Persistent on desktop; a controlled slide-in drawer on
 * mobile (open state lives in AppShell, shared with the header menu button).
 */
export function AppSidebar({
  email,
  open,
  onClose,
}: {
  email: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile drawer + backdrop */}
      <div
        className={cn("fixed inset-0 z-40 md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          onClick={onClose}
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[82%] transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Panel email={email} pathname={pathname} onSignOut={signOut}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close menu"
              className="text-[#CBD8D2] hover:bg-white/10 hover:text-white"
            >
              <X />
            </Button>
          </Panel>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 md:block">
        <Panel email={email} pathname={pathname} onSignOut={signOut} />
      </aside>
    </>
  );
}

function Brand({ light }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative h-7 w-7 shrink-0 rounded-md bg-[#FBFBF9]/10 ring-1 ring-white/10">
        <span className="absolute inset-x-1.5 bottom-1.5 h-3.5 rounded-[2px] bg-[#117A6B]" />
        <span className="absolute inset-x-1.5 bottom-1.5 h-[9px] rounded-[2px] bg-coral" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-tight",
          light ? "text-[#FBFBF9]" : "text-ink",
        )}
      >
        IELTS Mock
      </span>
    </span>
  );
}

function Panel({
  email,
  pathname,
  onSignOut,
  children,
}: {
  email: string | null;
  pathname: string;
  onSignOut: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-[#13201E] text-[#CBD8D2]">
      <div className="flex items-center justify-between px-5 pt-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brand light />
        </Link>
        {children}
      </div>

      <div className="mt-7 px-3">
        <div className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6F837C]">
          Workspace
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[#117A6B]/20 font-medium text-[#FBFBF9]"
                    : "text-[#9FB1AA] hover:bg-white/5 hover:text-[#FBFBF9]",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center [&_svg]:size-4",
                    active ? "text-coral" : "text-[#7E938C] group-hover:text-[#CBD8D2]",
                  )}
                >
                  <Icon />
                </span>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-4">
        {email && (
          <div className="mb-3 truncate px-1 font-mono text-[11px] text-[#7E938C]" title={email}>
            {email}
          </div>
        )}
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start gap-2 text-[#CBD8D2] hover:bg-white/10 hover:text-[#FBFBF9]"
        >
          <LogOut />
          Sign out
        </Button>
      </div>
    </div>
  );
}
