import { Router } from "express";
import { prisma } from "../lib/db.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { learnGradeSchema, learnModelSchema } from "../schemas/api.js";
import { gradeWritingTask, generateModelAnswer } from "../services/grading.js";

export const learnRouter = Router();

learnRouter.use(requireAuth);

/**
 * POST /api/learn/grade { task, prompt, text }
 * Grades a single writing-drill response from the Learn guide against the
 * official descriptors. Does not create an attempt — it's a practice aid.
 */
learnRouter.post(
  "/grade",
  rateLimit({ windowMs: 60 * 1000, max: 20, key: "learn-grade" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { task, prompt, text } = learnGradeSchema.parse(req.body ?? {});
    const profile = await prisma.profile.findUnique({ where: { id: req.user.id } });
    const grade = await gradeWritingTask(task, prompt, text, profile?.model ?? undefined);
    res.json({ grade });
  }),
);

/**
 * POST /api/learn/model { task, prompt }
 * Returns a Band 9 model answer for a drill so the learner can study it.
 */
learnRouter.post(
  "/model",
  rateLimit({ windowMs: 60 * 1000, max: 20, key: "learn-model" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { task, prompt } = learnModelSchema.parse(req.body ?? {});
    const profile = await prisma.profile.findUnique({ where: { id: req.user.id } });
    const answer = await generateModelAnswer(task, prompt, profile?.model ?? undefined);
    res.json({ answer });
  }),
);
