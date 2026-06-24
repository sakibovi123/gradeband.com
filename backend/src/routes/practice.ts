import { Router } from "express";
import { prisma } from "../lib/db.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { generatePracticeSchema } from "../schemas/api.js";
import { generateSingleSection } from "../services/generation.js";
import {
  emptyListening,
  emptyReading,
  emptyWriting,
} from "../services/attempts.js";
import type { ListeningSection, ReadingSection, WritingSection } from "../schemas/test.js";

export const practiceRouter = Router();

practiceRouter.use(requireAuth);

/**
 * POST /api/practice/generate { section }
 * Generates a single section for targeted drilling, stored as a MockTest with
 * only that section populated, plus an in-progress attempt.
 */
practiceRouter.post(
  "/generate",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 30, key: "practice" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { section, model } = generatePracticeSchema.parse(req.body ?? {});
    const profile = await prisma.profile.findUnique({ where: { id: req.user.id } });
    const chosenModel = model ?? profile?.model;

    const generated = await generateSingleSection(section, chosenModel);

    let listening: ListeningSection = emptyListening;
    let reading: ReadingSection = emptyReading;
    let writing: WritingSection = emptyWriting;
    if (section === "listening") listening = generated as ListeningSection;
    else if (section === "reading") reading = generated as ReadingSection;
    else writing = generated as WritingSection;

    const test = await prisma.mockTest.create({
      data: {
        listening: listening as object,
        reading: reading as object,
        writing: writing as object,
      },
    });
    const attempt = await prisma.attempt.create({
      data: { userId: req.user.id, mockTestId: test.id, answers: {} },
    });

    res.status(201).json({ testId: test.id, attemptId: attempt.id, section });
  }),
);
