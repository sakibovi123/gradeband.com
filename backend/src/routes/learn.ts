import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { learnGradeSchema, learnModelSchema, learnGenerateSchema } from "../schemas/api.js";
import { LEARN_PRICES, GUIDE_PRICES } from "../lib/pricing.js";
import { charge, refund } from "../services/wallet.js";
import { gradeWritingTask, generateModelAnswer } from "../services/grading.js";
import { generateReadingGuide, generateWritingGuide } from "../services/generation.js";
import { resolveModelForUser } from "../services/tier.js";

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
    const balance = await charge(req.user.id, LEARN_PRICES.grade, { reason: "learn:grade" });
    let grade;
    try {
      const model = await resolveModelForUser(req.user.id);
      grade = await gradeWritingTask(task, prompt, text, model);
    } catch (err) {
      await refund(req.user.id, LEARN_PRICES.grade, { reason: "learn:grade:refund" }).catch(() => {});
      throw err;
    }
    res.json({ grade, charged: LEARN_PRICES.grade, balance });
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
    const balance = await charge(req.user.id, LEARN_PRICES.model, { reason: "learn:model" });
    let answer;
    try {
      const model = await resolveModelForUser(req.user.id);
      answer = await generateModelAnswer(task, prompt, model);
    } catch (err) {
      await refund(req.user.id, LEARN_PRICES.model, { reason: "learn:model:refund" }).catch(() => {});
      throw err;
    }
    res.json({ answer, charged: LEARN_PRICES.model, balance });
  }),
);

/**
 * POST /api/learn/generate { kind: "reading" | "writing" }
 * Generates a fresh practice guide on demand. Charged upfront (one LLM
 * generation), refunded if generation fails. Returns a `drill` shaped for the
 * Learn drill renderers.
 */
learnRouter.post(
  "/generate",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 30, key: "learn-generate" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { kind } = learnGenerateSchema.parse(req.body ?? {});
    const price = GUIDE_PRICES[kind];
    const balance = await charge(req.user.id, price, { reason: `learn:generate:${kind}` });
    let drill;
    try {
      const model = await resolveModelForUser(req.user.id);
      drill =
        kind === "reading"
          ? await generateReadingGuide(model)
          : await generateWritingGuide(model);
    } catch (err) {
      await refund(req.user.id, price, { reason: `learn:generate:${kind}:refund` }).catch(() => {});
      throw err;
    }
    res.json({ drill, charged: price, balance });
  }),
);
