"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WritingVisual } from "@/lib/types";

// A small, theme-aware palette for series/slices.
const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--coral))",
  "#3FB3A2",
  "#E0A23B",
  "#6C8AE4",
  "#B06CC9",
];

const axisTick = { fontSize: 11, fill: "hsl(var(--muted))" } as const;
const tooltipStyle = {
  background: "hsl(var(--surface))",
  border: "1px solid hsl(var(--line))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--ink))",
} as const;

/** Renders an IELTS Task 1 figure (table / bar / line / pie) from structured data. */
export function WritingVisual({ visual }: { visual: WritingVisual }) {
  const { kind, title, unit, categories, series } = visual;

  // Row-per-category shape for the recharts cartesian charts.
  const chartData = categories.map((c, i) => {
    const row: Record<string, string | number> = { category: c };
    series.forEach((s) => {
      row[s.name] = s.values[i] ?? 0;
    });
    return row;
  });

  return (
    <figure className="rounded-lg border border-line bg-bg p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{title}</span>
        {unit && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
            in {unit}
          </span>
        )}
      </figcaption>

      {kind === "table" ? (
        <Table visual={visual} />
      ) : kind === "pie" ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={categories.map((c, i) => ({ name: c, value: series[0]?.values[i] ?? 0 }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(d) => `${d.name}: ${d.value}${unit ?? ""}`}
              labelLine={false}
              fontSize={11}
            >
              {categories.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      ) : kind === "line" ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="hsl(var(--line))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" tick={axisTick} tickLine={false} axisLine={{ stroke: "hsl(var(--line))" }} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="hsl(var(--line))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" tick={axisTick} tickLine={false} axisLine={{ stroke: "hsl(var(--line))" }} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--accent) / 0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => (
              <Bar key={s.name} dataKey={s.name} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}

/** Data table: first column = series name, then one column per category. */
function Table({ visual }: { visual: WritingVisual }) {
  const { categories, series, unit } = visual;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="py-2 pr-4 font-medium text-muted"></th>
            {categories.map((c) => (
              <th key={c} className="py-2 pr-4 text-right font-medium text-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.name} className="border-b border-line/60">
              <td className="py-2 pr-4 font-medium">{s.name}</td>
              {categories.map((_, i) => (
                <td key={i} className="py-2 pr-4 text-right font-mono tabular-nums">
                  {s.values[i] ?? "—"}
                  {unit && s.values[i] != null ? <span className="text-muted">{unit}</span> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
