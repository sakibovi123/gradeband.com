import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackendStatus } from "@/components/features/backend-status";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-dvh">
      <header className="border-b border-line">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-accent font-mono text-sm font-bold text-accent-foreground">
              9
            </span>
            <span className="font-semibold">IELTS Mock</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="container grid gap-10 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col justify-center gap-6">
          <span className="w-fit rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
            Computer-delivered · Academic
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Practise IELTS under real exam conditions.
          </h1>
          <p className="text-pretty text-lg text-muted">
            AI-generated Listening, Reading &amp; Writing mocks. Auto-graded objective
            sections, writing scored against the band descriptors, and a study plan built
            around your exam date.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button size="lg">Start a mock test</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Create an account
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted">
            Bands shown are <strong>estimates</strong>, not official scores.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-6">
          {/* Band-gauge teaser (signature element — built out in milestone 7). */}
          <div className="rounded-xl border border-line bg-surface p-8 text-center">
            <div className="text-xs uppercase tracking-widest text-muted">
              Estimated overall band
            </div>
            <div className="mt-2 font-mono text-7xl font-bold tabular-nums">7.5</div>
            <div className="mt-1 text-sm text-muted">target 8.0 · 0–9 scale</div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-accent" style={{ width: "83%" }} />
            </div>
          </div>
          <BackendStatus />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="container py-6 text-center text-xs text-muted">
          Milestone 1 skeleton · frontend :3099 ↔ backend :4099
        </div>
      </footer>
    </main>
  );
}
