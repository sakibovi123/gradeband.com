"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

interface Point {
  label: string;
  overall: number | null;
}

export function ProgressChart({ data, target }: { data: Point[]; target?: number | null }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted">
        Your band trend will appear here after your first graded test.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="hsl(var(--line))" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted))" }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--line))" }}
        />
        <YAxis
          domain={[0, 9]}
          ticks={[0, 3, 5, 6, 7, 8, 9]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted))" }}
          tickLine={false}
          axisLine={false}
        />
        {target != null && (
          <ReferenceLine
            y={target}
            stroke="hsl(var(--success))"
            strokeDasharray="4 4"
            label={{ value: `target ${target.toFixed(1)}`, fontSize: 10, fill: "hsl(var(--success))", position: "insideTopRight" }}
          />
        )}
        <Tooltip
          contentStyle={{
            background: "hsl(var(--surface))",
            border: "1px solid hsl(var(--line))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--ink))",
          }}
          labelStyle={{ color: "hsl(var(--muted))" }}
        />
        <Line
          type="monotone"
          dataKey="overall"
          stroke="hsl(var(--accent))"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "hsl(var(--accent))" }}
          connectNulls
          name="Overall band"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
