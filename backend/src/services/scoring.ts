/**
 * Deterministic IELTS scoring — pure functions, fully unit-tested.
 * The model is NEVER involved here; only writing quality/feedback uses the LLM.
 */

export type Section = "listening" | "reading";

export interface ScorableQuestion {
  id: string;
  answer: string; // correct answer; alternatives joined with "/"
}

export interface ObjectiveResult {
  correct: number;
  total: number;
  results: { id: string; correct: boolean; expected: string; given: string | null }[];
}

/** Normalize for comparison: trim, lowercase, collapse internal whitespace, drop surrounding punctuation. */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[\s"'.,;:!?()-]+|[\s"'.,;:!?()-]+$/g, "");
}

/** Accept any of the "/"-separated alternatives (case-insensitive, trimmed). */
export function isAnswerCorrect(correctAnswer: string, given: string | null | undefined): boolean {
  if (given == null) return false;
  const candidate = normalizeAnswer(given);
  if (candidate === "") return false;
  return correctAnswer
    .split("/")
    .map(normalizeAnswer)
    .filter(Boolean)
    .some((alt) => alt === candidate);
}

/** Grade objective answers. `answers` maps question id -> user's answer. */
export function gradeObjective(
  questions: ScorableQuestion[],
  answers: Record<string, string | null | undefined>,
): ObjectiveResult {
  const results = questions.map((q) => {
    const given = answers[q.id] ?? null;
    return {
      id: q.id,
      correct: isAnswerCorrect(q.answer, given),
      expected: q.answer,
      given: given ?? null,
    };
  });
  return {
    correct: results.filter((r) => r.correct).length,
    total: questions.length,
    results,
  };
}

// Official Academic band conversion tables (raw out of 40 -> band).
// [minRawOutOf40, band], descending.
const LISTENING_TABLE: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5],
  [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [6, 3.5], [4, 3], [0, 2.5],
];
const READING_TABLE: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5],
  [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [0, 2.5],
];

/**
 * Convert raw correct / total to an Academic band.
 * Tests may have fewer than 40 questions, so we scale the raw score to a /40
 * equivalent before applying the official conversion table.
 */
export function rawToBand(correct: number, total: number, section: Section): number {
  if (total <= 0) return 0;
  const clamped = Math.max(0, Math.min(correct, total));
  const scaled = Math.round((clamped / total) * 40);
  const table = section === "listening" ? LISTENING_TABLE : READING_TABLE;
  for (const [minRaw, band] of table) {
    if (scaled >= minRaw) return band;
  }
  return 2.5;
}

/** Round a number to the nearest 0.5 (half rounds up). */
export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/**
 * Overall band = mean of available section bands, rounded by the IELTS rule
 * (.25 -> .5, .75 -> next whole). roundToHalf implements exactly that, since
 * mean*2 rounded half-up then /2 maps .25->.5 and .75->+1.
 */
export function overallBand(
  ...sections: (number | null | undefined)[]
): number | null {
  const present = sections.filter((s): s is number => typeof s === "number");
  if (present.length === 0) return null;
  const mean = present.reduce((a, b) => a + b, 0) / present.length;
  return roundToHalf(mean);
}
