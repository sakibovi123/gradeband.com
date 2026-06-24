import { z } from "zod";

export const generateTestSchema = z.object({
  model: z.string().min(1).optional(),
});

export const sectionParamSchema = z.enum(["listening", "reading", "writing"]);

export const generatePracticeSchema = z.object({
  section: sectionParamSchema,
  model: z.string().min(1).optional(),
});

/** Answers payload for autosave + submit. */
export const answersSchema = z.object({
  listening: z.record(z.string(), z.string()).optional(),
  reading: z.record(z.string(), z.string()).optional(),
  writing: z
    .object({
      task1: z.string().optional(),
      task2: z.string().optional(),
    })
    .optional(),
  flags: z.record(z.string(), z.boolean()).optional(),
});
export type AnswersPayload = z.infer<typeof answersSchema>;

export const autosaveSchema = z.object({
  answers: answersSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).nullable().optional(),
  examDate: z.string().datetime().nullable().optional(),
  targetBand: z.number().min(0).max(9).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  model: z.string().min(1).optional(),
});

export const ttsSchema = z.object({
  transcript: z.string().min(1).max(8000),
});
