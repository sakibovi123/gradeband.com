import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { ttsSchema } from "../schemas/api.js";
import { synthesizeListeningAudio } from "../services/tts.js";

export const ttsRouter = Router();

ttsRouter.use(requireAuth);

/** POST /api/tts — synthesize (and cache) audio for a transcript. */
ttsRouter.post(
  "/",
  rateLimit({ windowMs: 60 * 1000, max: 20, key: "tts" }),
  asyncHandler(async (req, res) => {
    const { transcript } = ttsSchema.parse(req.body ?? {});
    const audioUrl = await synthesizeListeningAudio(transcript);
    res.json({ audioUrl });
  }),
);
