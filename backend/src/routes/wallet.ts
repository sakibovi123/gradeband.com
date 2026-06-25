import { Router } from "express";
import { prisma } from "../lib/db.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { getBalance } from "../services/wallet.js";
import { PRACTICE_PRICES, MOCK_PRICE, LEARN_PRICES, GUIDE_PRICES } from "../lib/pricing.js";

export const walletRouter = Router();

walletRouter.use(requireAuth);

/** GET /api/wallet — current balance + the price list for each action. */
walletRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const balance = await getBalance(req.user.id);
    res.json({
      balance,
      prices: {
        practice: PRACTICE_PRICES,
        mock: MOCK_PRICE,
        learn: LEARN_PRICES,
        guide: GUIDE_PRICES,
      },
    });
  }),
);

/** GET /api/wallet/transactions — recent ledger entries (newest first). */
walletRouter.get(
  "/transactions",
  asyncHandler(async (req: AuthedRequest, res) => {
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        balanceAfter: true,
        type: true,
        reason: true,
        createdAt: true,
      },
    });
    res.json({ transactions });
  }),
);
