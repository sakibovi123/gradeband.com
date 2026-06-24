import { Router } from "express";
import { prisma } from "../lib/db.js";
import { asyncHandler, notFound } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { generateTestSchema } from "../schemas/api.js";
import { generateMockTest } from "../services/generation.js";
import { toPublicTest } from "../services/attempts.js";

export const testsRouter = Router();

testsRouter.use(requireAuth);

/**
 * POST /api/tests/generate
 * Generates a full mock test (Listening + Reading + Writing + audio) and opens
 * an in-progress attempt for the user. Generation can take many seconds.
 */
testsRouter.post(
  "/generate",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20, key: "generate" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { model } = generateTestSchema.parse(req.body ?? {});
    const chosenModel = model ?? (await getUserModel(req.user.id));
    const testId = await generateMockTest(chosenModel);
    const attempt = await prisma.attempt.create({
      data: { userId: req.user.id, mockTestId: testId, answers: {} },
    });
    res.status(201).json({ testId, attemptId: attempt.id });
  }),
);

/** GET /api/tests/:id — answer-free test content for the runner. */
testsRouter.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const test = await prisma.mockTest.findUnique({ where: { id: req.params.id } });
    if (!test) throw notFound("Test not found");
    res.json(toPublicTest(test));
  }),
);

async function getUserModel(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  return profile?.model;
}
