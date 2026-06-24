import express from "express";
import cors from "cors";
import { mkdirSync } from "node:fs";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFound } from "./lib/http.js";
import { healthRouter } from "./routes/health.js";
import { testsRouter } from "./routes/tests.js";
import { attemptsRouter } from "./routes/attempts.js";
import { meRouter } from "./routes/me.js";
import { ttsRouter } from "./routes/tts.js";
import { practiceRouter } from "./routes/practice.js";
import { audioCacheDir } from "./services/tts.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  }),
);

// Lightweight request log (no bodies, no secrets).
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Serve cached Listening audio (publicly readable; URLs are unguessable hashes).
const cacheDir = audioCacheDir();
mkdirSync(cacheDir, { recursive: true });
app.use(
  "/audio",
  express.static(cacheDir, {
    maxAge: "7d",
    setHeaders: (res) => res.setHeader("Access-Control-Allow-Origin", env.WEB_ORIGIN),
  }),
);

// ---- Routes -------------------------------------------------------------
app.use("/health", healthRouter);
app.use("/api/tests", testsRouter);
app.use("/api/attempts", attemptsRouter);
app.use("/api/me", meRouter);
app.use("/api/tts", ttsRouter);
app.use("/api/practice", practiceRouter);

// 404 + error handling (must be last).
app.use((_req, _res, next) => next(notFound("Route not found")));
app.use(errorHandler);

const server = app.listen(env.API_PORT, () => {
  logger.info(`API listening on http://localhost:${env.API_PORT}`, {
    env: env.NODE_ENV,
    cors: env.WEB_ORIGIN,
  });
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
