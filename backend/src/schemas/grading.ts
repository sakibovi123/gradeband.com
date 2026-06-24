import { z } from "zod";

/** Band values move in 0.5 steps across 0–9. */
export const bandSchema = z
  .number()
  .min(0)
  .max(9)
  .refine((n) => Number.isInteger(n * 2), { message: "band must be in 0.5 steps" });

/** LLM writing-grading contract (per task), calibrated to official descriptors. */
export const writingGradeSchema = z.object({
  band: bandSchema,
  criteria: z.object({
    taskResponse: bandSchema,
    coherenceCohesion: bandSchema,
    lexicalResource: bandSchema,
    grammaticalRange: bandSchema,
  }),
  strengths: z.array(z.string().min(1)).min(1).max(6),
  improvements: z.array(z.string().min(1)).min(1).max(6),
  summary: z.string().min(1),
});
export type WritingGrade = z.infer<typeof writingGradeSchema>;

/** Focus-plan contract. */
export const focusPlanSchema = z.object({
  message: z.string().min(1),
  focus: z
    .array(
      z.object({
        area: z.string().min(1),
        why: z.string().min(1),
        action: z.string().min(1),
      }),
    )
    .min(1)
    .max(6),
});
export type FocusPlan = z.infer<typeof focusPlanSchema>;
