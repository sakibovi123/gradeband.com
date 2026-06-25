import { Router } from "express";
import { prisma } from "../lib/db.js";
import { env } from "../lib/env.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { generatePracticeSchema } from "../schemas/api.js";
import { practicePrice } from "../lib/pricing.js";
import { charge, refund } from "../services/wallet.js";
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
    const { section } = generatePracticeSchema.parse(req.body ?? {});

    // Pay-as-you-go: charge the section price upfront (covers generation +
    // grading). Billable actions always use the fixed paid model so the cost
    // matches the price — the per-user model choice does not apply here.
    const price = practicePrice(section);
    const balance = await charge(req.user.id, price, { reason: `practice:${section}` });

    // Refund if generation OR the subsequent persistence fails — otherwise the
    // user is charged with no usable attempt to show for it.
    let testId: string;
    let attemptId: string;
    try {
      const generated = await generateSingleSection(section, env.PAID_MODEL);

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
      testId = test.id;
      attemptId = attempt.id;
    } catch (err) {
      await refund(req.user.id, price, { reason: `practice:${section}:refund` }).catch(() => {});
      throw err;
    }

    res.status(201).json({ testId, attemptId, section, charged: price, balance });
  }),
);
