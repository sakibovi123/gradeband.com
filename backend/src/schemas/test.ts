import { z } from "zod";

/** IELTS question types we support in the computer-delivered runner. */
export const questionTypeSchema = z.enum(["mcq", "tfng", "gap", "match", "dragdrop"]);
export type QuestionType = z.infer<typeof questionTypeSchema>;

/**
 * A single question as returned by the LLM.
 * - gap: answer is 1–3 words; alternatives joined with "/".
 * - mcq/tfng: answer must equal one option; tfng options = True/False/Not Given.
 * - match/dragdrop: options is the draggable pool; answer is the correct option.
 */
export const llmQuestionSchema = z
  .object({
    type: questionTypeSchema,
    q: z.string().min(1),
    options: z.array(z.string().min(1)).optional(),
    answer: z.string().min(1),
  })
  .superRefine((val, ctx) => {
    if ((val.type === "mcq" || val.type === "match" || val.type === "dragdrop") && !val.options?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${val.type} requires options` });
    }
    if (val.type === "tfng") {
      // Normalize/validate against the canonical TFNG set.
      const ok = ["true", "false", "not given"].includes(val.answer.trim().toLowerCase());
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "tfng answer must be True/False/Not Given" });
    }
  });
export type LlmQuestion = z.infer<typeof llmQuestionSchema>;

export const llmListeningSchema = z.object({
  title: z.string().min(1),
  transcript: z.string().min(1),
  questions: z.array(llmQuestionSchema).min(6).max(10),
});

export const llmReadingSchema = z.object({
  title: z.string().min(1),
  passage: z.string().min(1),
  questions: z.array(llmQuestionSchema).min(8).max(12),
});

export const llmWritingSchema = z.object({
  task1: z.object({ prompt: z.string().min(1) }),
  task2: z.object({ prompt: z.string().min(1) }),
});

/** Persisted shapes (questions carry a stable id + the answer is server-side). */
export const questionSchema = llmQuestionSchema.and(z.object({ id: z.string() }));
export type Question = z.infer<typeof questionSchema>;

export const listeningSectionSchema = z.object({
  title: z.string(),
  transcript: z.string(),
  audioUrl: z.string().nullable(),
  questions: z.array(questionSchema),
});
export type ListeningSection = z.infer<typeof listeningSectionSchema>;

export const readingSectionSchema = z.object({
  title: z.string(),
  passage: z.string(),
  questions: z.array(questionSchema),
});
export type ReadingSection = z.infer<typeof readingSectionSchema>;

export const writingSectionSchema = z.object({
  task1: z.object({ prompt: z.string() }),
  task2: z.object({ prompt: z.string() }),
});
export type WritingSection = z.infer<typeof writingSectionSchema>;

/** Public-facing question (answer stripped) sent to the test runner. */
export type PublicQuestion = Omit<Question, "answer">;
