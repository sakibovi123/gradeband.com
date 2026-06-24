/**
 * Client-side objective answer check for Reading drills — mirrors the backend
 * scoring (trim, lowercase, collapse whitespace, strip surrounding punctuation,
 * accept "/"-separated alternatives). Keeps drill scoring instant and free.
 */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[\s"'.,;:!?()-]+|[\s"'.,;:!?()-]+$/g, "");
}

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
