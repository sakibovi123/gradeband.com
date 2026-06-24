import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/http.js";

/**
 * Tiny in-memory sliding-window rate limiter. Good enough for a single-instance
 * personal app; swap for Redis if you scale horizontally. Keyed by user id when
 * authenticated, otherwise by IP.
 *
 * A periodic sweeper evicts buckets whose timestamps have all aged out, so the
 * map can't grow unbounded as users/keys accumulate. The sweep timer is
 * `unref()`-ed so it never keeps the process alive on shutdown.
 */
export function rateLimit(opts: { windowMs: number; max: number; key?: string }) {
  const hits = new Map<string, number[]>();

  const sweeper = setInterval(() => {
    const cutoff = Date.now() - opts.windowMs;
    for (const [bucket, arr] of hits) {
      const live = arr.filter((t) => t > cutoff);
      if (live.length === 0) hits.delete(bucket);
      else hits.set(bucket, live);
    }
  }, opts.windowMs);
  sweeper.unref?.();

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
