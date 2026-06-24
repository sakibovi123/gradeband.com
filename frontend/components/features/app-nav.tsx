"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
] as const;

export function AppNav({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
      <div className="container flex h-14 items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-mono text-xs font-bold text-accent-foreground">
            9
          </span>
          <span className="hidden font-semibold sm:inline">IELTS Mock</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors hover:bg-surface",
                pathname.startsWith(l.href) ? "bg-surface font-medium text-ink" : "text-muted",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {email && <span className="hidden text-xs text-muted md:inline">{email}</span>}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
