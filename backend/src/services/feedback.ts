import { chatJson } from "../lib/openrouter.js";
import { focusPlanSchema, type FocusPlan, type WritingGrade } from "../schemas/grading.js";

export interface FocusPlanInput {
  listeningBand: number | null;
  readingBand: number | null;
  writingBand: number | null;
  writingCriteria?: WritingGrade["criteria"];
  overallBand: number | null;
  targetBand: number;
  daysUntilExam: number | null;
}

/**
 * Builds a prioritised study plan. The weakest sections relative to the target,
 * weighted against time remaining, drive the focus areas.
 */
export async function generateFocusPlan(
  input: FocusPlanInput,
  model?: string,
): Promise<FocusPlan> {
  const timeNote =
    input.daysUntilExam == null
      ? "No exam date is set."
      : `There are ${input.daysUntilExam} days until the exam.`;

  return chatJson({
    label: "focus-plan",
    model,
    temperature: 0.4,
    schema: focusPlanSchema,
    system:
      "You are an experienced IELTS coach. Create a short, prioritised, realistic study plan. Be specific and actionable. Output JSON only.",
    user: `A student's latest mock results (0-9 bands; some may be null if not taken):
- Listening: ${input.listeningBand ?? "n/a"}
- Reading: ${input.readingBand ?? "n/a"}
- Writing: ${input.writingBand ?? "n/a"}${
      input.writingCriteria
        ? ` (Task Response ${input.writingCriteria.taskResponse}, Coherence/Cohesion ${input.writingCriteria.coherenceCohesion}, Lexical Resource ${input.writingCriteria.lexicalResource}, Grammar ${input.writingCriteria.grammaticalRange})`
        : ""
    }
- Estimated overall: ${input.overallBand ?? "n/a"}
- Target band: ${input.targetBand}
${timeNote}

Return JSON: "message" (1-2 encouraging, honest sentences) and "focus" — 2-5 items,
ordered by priority (weakest gap vs. target first), each { "area", "why", "action" }
where "action" is a concrete weekly practice step the student can start now.`,
  });
}
