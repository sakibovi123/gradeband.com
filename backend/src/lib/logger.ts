import { env } from "./env.js";

type Level = "debug" | "info" | "warn" | "error";

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = env.NODE_ENV === "production" ? order.info : order.debug;

/**
 * Minimal structured logger. Emits one JSON line per event in production
 * (easy to ship to a log aggregator) and a readable line in development.
 * Never log secrets — callers are responsible for redaction.
 */
function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (order[level] < threshold) return;
  const record = { level, msg, time: new Date().toISOString(), ...meta };
  const line = env.NODE_ENV === "production"
    ? JSON.stringify(record)
    : `[${level.toUpperCase()}] ${msg}${meta ? " " + JSON.stringify(meta) : ""}`;
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
