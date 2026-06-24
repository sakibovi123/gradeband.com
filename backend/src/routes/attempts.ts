import { Router } from "express";
import { prisma } from "../lib/db.js";
import { asyncHandler, badRequest, notFound } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { autosaveSchema } from "../schemas/api.js";
import { gradeAttempt, toPublicTest } from "../services/attempts.js";

export const attemptsRouter = Router();

attemptsRouter.use(requireAuth);

/** GET /api/attempts — list the user's attempts (history / dashboard). */
attemptsRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const attempts = await prisma.attempt.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        listeningBand: true,
        readingBand: true,
        writingBand: true,
        overallBand: true,
        createdAt: true,
        mockTestId: true,
      },
    });
    res.json({ attempts });
  }),
);

/** GET /api/attempts/:id — full attempt (results + answers), scoped to user. */
attemptsRouter.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const attempt = await prisma.attempt.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { mockTest: true },
    });
    if (!attempt) throw notFound("Attempt not found");
    const { mockTest, ...rest } = attempt;
    res.json({ attempt: rest, test: toPublicTest(mockTest) });
  }),
);

/** PATCH /api/attempts/:id — autosave answers (survives refresh). */
attemptsRouter.patch(
  "/:id",
  rateLimit({ windowMs: 60 * 1000, max: 120, key: "autosave" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { answers } = autosaveSchema.parse(req.body ?? {});
    const existing = await prisma.attempt.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      select: { id: true, status: true },
    });
    if (!existing) throw notFound("Attempt not found");
    if (existing.status === "graded") throw badRequest("This attempt is already submitted.");

    const updated = await prisma.attempt.update({
      where: { id: existing.id },
      data: { answers: answers as object },
      select: { id: true },
    });
    res.json({ ok: true, id: updated.id });
  }),
);

/** POST /api/attempts/:id/submit — grade everything and save the result. */
attemptsRouter.post(
  "/:id/submit",
  rateLimit({ windowMs: 60 * 1000, max: 10, key: "submit" }),
  asyncHandler(async (req: AuthedRequest, res) => {
    // Allow submitting with a final answers payload in one call.
    if (req.body?.answers) {
      const { answers } = autosaveSchema.parse(req.body);
      const existing = await prisma.attempt.findFirst({
        where: { id: req.params.id, userId: req.user.id },
        select: { id: true, status: true },
      });
      if (!existing) throw notFound("Attempt not found");
      if (existing.status === "graded") throw badRequest("This attempt is already submitted.");
      await prisma.attempt.update({
        where: { id: existing.id },
        data: { answers: answers as object },
      });
    }

    const result = await gradeAttempt(req.params.id!, req.user.id);
    res.json({ attempt: result.attempt, raw: result.raw });
  }),
);
