import { fmtBand } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  band: number | null;
  target?: number | null;
  size?: number;
  label?: string;
  className?: string;
}

/**
 * Signature 0–9 band gauge: a 270° arc with the band rendered in monospace,
 * plus an optional target tick. Pure SVG — no client JS needed.
 */
export function BandGauge({ band, target, size = 220, label = "Estimated overall band", className }: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135; // degrees
  const sweep = 270;
  const value = band ?? 0;
  const pct = Math.max(0, Math.min(1, value / 9));

  const circumference = 2 * Math.PI * r;
  const arcLen = (sweep / 360) * circumference;
  const dash = `${arcLen * pct} ${circumference}`;
  const trackDash = `${arcLen} ${circumference}`;
  const rotate = `rotate(${startAngle} ${cx} ${cy})`;

  // Target tick position along the arc.
  const targetAngle =
    target != null ? startAngle + (Math.max(0, Math.min(9, target)) / 9) * sweep : null;
  const tick =
    targetAngle != null
      ? {
          x1: cx + (r - stroke) * Math.cos((targetAngle * Math.PI) / 180),
          y1: cy + (r - stroke) * Math.sin((targetAngle * Math.PI) / 180),
          x2: cx + (r + stroke / 2) * Math.cos((targetAngle * Math.PI) / 180),
          y2: cy + (r + stroke / 2) * Math.sin((targetAngle * Math.PI) / 180),
        }
      : null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={`${label}: ${fmtBand(band)} of 9`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--line))"
            strokeWidth={stroke}
            strokeDasharray={trackDash}
            strokeLinecap="round"
            transform={rotate}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={stroke}
            strokeDasharray={dash}
            strokeLinecap="round"
            transform={rotate}
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />
          {tick && (
            <line
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="hsl(var(--success))"
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-bold tabular-nums">{fmtBand(band)}</span>
          <span className="text-xs text-muted">out of 9</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium">{label}</div>
        {target != null && (
          <div className="text-xs text-muted">
            <span className="text-success">●</span> target {fmtBand(target)}
          </div>
        )}
      </div>
    </div>
  );
}
