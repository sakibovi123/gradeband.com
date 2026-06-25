import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "./logger.js";

/** A typed, user-safe API error. `expose: true` means the message is shown to clients. */
export class ApiError extends Error {
  status: number;
  expose: boolean;
  details?: unknown;
  constructor(status: number, message: string, opts?: { expose?: boolean; details?: unknown }) {
    super(message);
    this.status = status;
    this.expose = opts?.expose ?? status < 500;
    this.details = opts?.details;
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new ApiError(400, msg, { expose: true, details });
export const unauthorized = (msg = "Authentication required") =>
  new ApiError(401, msg, { expose: true });
export const paymentRequired = (msg = "Insufficient credits", details?: unknown) =>
  new ApiError(402, msg, { expose: true, details });
export const forbidden = (msg = "Forbidden") => new ApiError(403, msg, { expose: true });
export const notFound = (msg = "Not found") => new ApiError(404, msg, { expose: true });

/** Wrap async route handlers so thrown/rejected errors reach the error middleware. */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}

/** Central error handler: never leaks provider internals or secrets to clients. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid request",
      details: err.flatten().fieldErrors,
    });
  }
  if (err instanceof ApiError) {
    if (err.status >= 500) logger.error("API error", { status: err.status, message: err.message });
    return res.status(err.status).json({
      error: err.expose ? err.message : "Something went wrong",
      ...(err.details ? { details: err.details } : {}),
    });
  }
  // Malformed JSON body (raised by express.json/body-parser) → client error.
  const e = err as { type?: string; status?: number } | undefined;
  if (err instanceof SyntaxError && (e?.status === 400 || e?.type === "entity.parse.failed")) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  logger.error("Unhandled error", { message: (err as Error)?.message });
  return res.status(500).json({ error: "Internal server error" });
}
