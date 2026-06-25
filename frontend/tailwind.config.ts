import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Semantic tokens (exam-paper palette) — values defined in globals.css.
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        coral: "hsl(var(--coral))",
        "coral-foreground": "hsl(var(--coral-foreground))",
        success: "hsl(var(--success))",
        line: "hsl(var(--line))",
        // shadcn-compatible aliases so primitives work out of the box.
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--ink))",
        border: "hsl(var(--line))",
        input: "hsl(var(--line))",
        ring: "hsl(var(--accent))",
        card: "hsl(var(--surface))",
        "card-foreground": "hsl(var(--ink))",
        primary: "hsl(var(--accent))",
        "primary-foreground": "hsl(var(--accent-foreground))",
        secondary: "hsl(var(--surface))",
        "secondary-foreground": "hsl(var(--ink))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--accent-foreground))",
        "muted-foreground": "hsl(var(--muted))",
        popover: "hsl(var(--surface))",
        "popover-foreground": "hsl(var(--ink))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
