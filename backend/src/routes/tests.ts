import { Router } from "express";
import { prisma } from "../lib/db.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { generateTestSchema } from "../schemas/api.js";
import { MOCK_PRICE } from "../lib/pricing.js";
import { charge, refund } from "../services/wallet.js";
import { generateMockTest } from "../services/generation.js";
import { resolveModelForUser } from "../services/tier.js";

export const testsRouter = Router();

testsRouter.use(requireAuth);

/**
 * POST /api/tests/generate
 * Generates a mock test (Reading + Writing) and opens an in-progress attempt
 * for the user. Generation can take many seconds.
 *
 * Note: test content is read back via GET /api/attempts/:id, which is scoped to
 * the owning user — there is intentionally no unscoped GET /api/tests/:id.
 */
testsRouter.post(
  "/generate",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20, key: "generate" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    generateTestSchema.parse(req.body ?? {});

    // Charge the mock price upfront (covers generation + grading). The price is
    // calibrated to the paid model; free-tier users pay the same trial budget
    // but run on the free model behind the scenes.
    const balance = await charge(req.user.id, MOCK_PRICE, { reason: "mock" });

    // Refund if anything between charge and a usable attempt fails — generation
    // OR the persistence that turns it into something the user can open.
    let testId: string;
    let attemptId: string;
    try {
      const model = await resolveModelForUser(req.user.id);
      testId = await generateMockTest(model);
      const attempt = await prisma.attempt.create({
        data: { userId: req.user.id, mockTestId: testId, answers: {} },
      });
      attemptId = attempt.id;
    } catch (err) {
      await refund(req.user.id, MOCK_PRICE, { reason: "mock:refund" }).catch(() => {});
      throw err;
    }
    res.status(201).json({ testId, attemptId, charged: MOCK_PRICE, balance });
  }),
);
