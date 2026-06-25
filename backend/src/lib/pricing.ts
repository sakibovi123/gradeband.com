/**
 * Pay-as-you-go pricing.
 *
 * One credit == 1 BDT. Prices below are derived from the measured token/TTS cost
 * of each action on the paid model (anthropic/claude-sonnet-4.6 — $3/M in,
 * $15/M out), multiplied by a ~2x markup, then rounded to a friendly number.
 *
 * These are the single source of truth for what a feature costs. Recalibrate
 * them against real OpenRouter/OpenAI invoices — nothing else needs to change.
 *
 * Charging model: a feature is charged ONCE, upfront, when the user starts it.
 * The price bundles both cost events (generation + grading), so submit/grade is
 * free at the point of use. If generation fails, the charge is refunded.
 */

/** Credit cost of generating + grading one practice section. */
export const PRACTICE_PRICES = {
  reading: 8,
  listening: 10,
  writing: 15,
} as const;

/** Credit cost of generating + grading a full mock test. */
export const MOCK_PRICE = 20;

/** Credit cost of the Learn-guide one-shot helpers (single LLM call each). */
export const LEARN_PRICES = {
  grade: 3,
  model: 2,
} as const;

/**
 * Credit cost of generating a fresh Learn practice guide on demand (one LLM
 * generation, no grading bundled — grading a generated writing guide is the
 * separate LEARN_PRICES.grade charge). Cheaper than full practice for that reason.
 */
export const GUIDE_PRICES = {
  reading: 6,
  writing: 3,
} as const;

export type GuideKind = keyof typeof GUIDE_PRICES;

export type PracticeSection = keyof typeof PRACTICE_PRICES;

/** Price for a practice section, by name. */
export function practicePrice(section: PracticeSection): number {
  return PRACTICE_PRICES[section];
}

/**
 * Top-up packages the user can buy via UddoktaPay. `amountBdt` is what they pay;
 * `credits` is what they receive (bigger packs include a bonus). Since 1 credit
 * == 1 BDT, the bonus is the only difference between the two.
 */
export interface CreditPackage {
  id: string;
  amountBdt: number;
  credits: number;
  /** Marketing label, e.g. "+12% bonus". */
  bonus?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", amountBdt: 100, credits: 100 },
  { id: "regular", amountBdt: 300, credits: 330, bonus: "+10% bonus" },
  { id: "pro", amountBdt: 500, credits: 575, bonus: "+15% bonus" },
  { id: "max", amountBdt: 1000, credits: 1200, bonus: "+20% bonus" },
];

export function findPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}
