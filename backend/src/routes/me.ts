import { Router } from "express";
import { prisma } from "../lib/db.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { updateProfileSchema } from "../schemas/api.js";

export const meRouter = Router();

meRouter.use(requireAuth);

/** GET /api/me — the authenticated user's profile. */
meRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await prisma.profile.findUnique({ where: { id: req.user.id } });
    res.json({ profile });
  }),
);

/** PATCH /api/me — update exam date, target band, model, theme, name. */
meRouter.patch(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateProfileSchema.parse(req.body ?? {});
    const profile = await prisma.profile.update({
      where: { id: req.user.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.examDate !== undefined
          ? { examDate: data.examDate ? new Date(data.examDate) : null }
          : {}),
        ...(data.targetBand !== undefined ? { targetBand: data.targetBand } : {}),
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
        ...(data.model !== undefined ? { model: data.model } : {}),
      },
    });
    res.json({ profile });
  }),
);
