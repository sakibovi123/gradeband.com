import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/http.js";

/**
 * Tiny in-memory sliding-window rate limiter. Good enough for a single-instance
 * personal app; swap for Redis if you scale horizontally. Keyed by user id when
 * authenticated, otherwise by IP.
 */
export function rateLimit(opts: { windowMs: number; max: number; key?: string }) {
  const hits = new Map<string, number[]>();
  return (req: Request, _res: Response, next: NextFunction) => {
    const id =
      (req as { user?: { id: string } }).user?.id ??
      req.ip ??
      req.socket.remoteAddress ??
      "anon";
    const bucket = `${opts.key ?? "default"}:${id}`;
    const now = Date.now();
    const windowStart = now - opts.windowMs;

    const arr = (hits.get(bucket) ?? []).filter((t) => t > windowStart);
    if (arr.length >= opts.max) {
      return next(new ApiError(429, "Too many requests — please slow down.", { expose: true }));
    }
    arr.push(now);
    hits.set(bucket, arr);
    next();
  };
}
