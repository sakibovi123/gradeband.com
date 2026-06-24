"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const order = ["light", "dark", "system"] as const;
type Mode = (typeof order)[number];

const icons: Record<Mode, React.ReactNode> = {
  light: <Sun />,
  dark: <Moon />,
  system: <Monitor />,
};

/** Cycles light → dark → system. Avoids hydration mismatch by mounting first. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = (theme as Mode) ?? "system";

  function next() {
    const idx = order.indexOf(current);
    setTheme(order[(idx + 1) % order.length]!);
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={next}
      aria-label={`Theme: ${current}. Click to change.`}
      title={`Theme: ${current}`}
    >
      {mounted ? icons[current] : <Monitor />}
    </Button>
  );
}
