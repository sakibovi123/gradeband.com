import { z } from "zod";
import { chatJson } from "../lib/openrouter.js";
import { writingGradeSchema, type WritingGrade } from "../schemas/grading.js";
import { roundToHalf } from "./scoring.js";

const SYSTEM = `You are a certified IELTS Writing examiner. You grade strictly against the official IELTS Academic band descriptors for the four criteria: Task Achievement/Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Be calibrated and honest — do NOT inflate bands. Bands are in 0.5 steps from 0 to 9. The overall task band is the average of the four criteria, rounded to the nearest 0.5. Output JSON only.`;

function userPrompt(task: "task1" | "task2", prompt: string, essay: string) {
  const minWords = task === "task1" ? 150 : 250;
  const kind =
    task === "task1"
      ? "Academic Writing Task 1 (report describing visual data; minimum 150 words)"
      : "Academic Writing Task 2 (discursive essay; minimum 250 words)";
  return `Grade this ${kind}.

PROMPT:
${prompt}

CANDIDATE RESPONSE (${essay.trim().split(/\s+/).filter(Boolean).length} words; minimum expected ${minWords}):
"""
${essay}
"""

Return JSON with: "band" (overall, average of the four criteria rounded to 0.5),
"criteria" { "taskResponse","coherenceCohesion","lexicalResource","grammaticalRange" } each a band,
"strengths" (1-6 concise points), "improvements" (1-6 concrete, actionable points),
"summary" (2-4 sentences). Penalize under-length and off-topic responses per the descriptors.`;
}

/** Grade a single writing task against the official descriptors. */
export async function gradeWritingTask(
  task: "task1" | "task2",
  prompt: string,
  essay: string,
  model?: string,
): Promise<WritingGrade> {
  return chatJson({
    label: `grade-${task}`,
    model,
    temperature: 0.2,
    schema: writingGradeSchema,
    system: SYSTEM,
    user: userPrompt(task, prompt, essay),
  });
}

const modelAnswerSchema = z.object({ answer: z.string().min(50) });

/**
 * Produce a Band 9 model answer for a writing task, so the candidate can study
 * what a top-scoring response looks like. The prompt for Task 1 should already
 * include the figure's data (so the model answer cites accurate numbers).
 */
export async function generateModelAnswer(
  task: "task1" | "task2",
  prompt: string,
  model?: string,
): Promise<string> {
  const target = task === "task1" ? "150–190 words" : "270–300 words";
  const kind =
    task === "task1"
      ? "Academic Writing Task 1 (describe the figure with a clear overview plus key features, accurate data and comparisons; no opinions, no causes)"
      : "Academic Writing Task 2 (a discursive essay with a clear position, well-developed paragraphs using topic sentences and specific examples, and strong cohesion)";
  const r = await chatJson({
    label: `model-${task}`,
    model,
    temperature: 0.5,
    schema: modelAnswerSchema,
    system:
      "You are an IELTS examiner and expert writer. Produce a Band 9 model answer that fully satisfies all four official descriptors. Output JSON only.",
    user: `Write a Band 9 model answer for this ${kind}.

PROMPT:
${prompt}

Write ${target}. Use natural, sophisticated English with varied complex structures, precise vocabulary, and clear paragraphing (separate paragraphs with blank lines). Return JSON: {"answer":"<the response as plain text>"}.`,
  });
  return r.answer;
}

export interface WritingSectionGrade {
  band: number; // combined writing band (Task 2 weighted double)
  task1?: WritingGrade;
  task2: WritingGrade;
}

/**
 * Combine task grades into a writing-section band. IELTS weights Task 2 twice
 * as heavily as Task 1: band = (task1 + 2*task2) / 3, rounded to 0.5.
 * When only Task 2 is present, the writing band is the Task 2 band.
 */
export function combineWritingBand(task2: number, task1?: number): number {
  if (typeof task1 === "number") return roundToHalf((task1 + 2 * task2) / 3);
  return roundToHalf(task2);
}
