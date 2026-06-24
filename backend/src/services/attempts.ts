import { prisma } from "../lib/db.js";
import { notFound } from "../lib/http.js";
import { logger } from "../lib/logger.js";
import {
  listeningSectionSchema,
  readingSectionSchema,
  writingSectionSchema,
  type ListeningSection,
  type ReadingSection,
  type WritingSection,
  type Question,
  type PublicQuestion,
  type WritingVisual,
} from "../schemas/test.js";
import type { AnswersPayload } from "../schemas/api.js";
import { gradeObjective, rawToBand, overallBand } from "./scoring.js";
import { gradeWritingTask, combineWritingBand, generateModelAnswer } from "./grading.js";
import { generateFocusPlan } from "./feedback.js";

/** Remove the answer key before sending questions to the client. */
function stripAnswers(questions: Question[]): PublicQuestion[] {
  return questions.map(({ answer: _answer, ...rest }) => rest);
}

/** Render a Task 1 figure as plain text so the writing grader can check accuracy. */
function visualToText(v: WritingVisual): string {
  const unit = v.unit ? ` ${v.unit}` : "";
  const header = `${v.title} (categories: ${v.categories.join(", ")})`;
  const rows = v.series.map(
    (s) =>
      `- ${s.name}: ${s.values
        .map((val, i) => `${v.categories[i] ?? `#${i + 1}`}=${val}${unit}`)
        .join(", ")}`,
  );
  return [header, ...rows].join("\n");
}

/** Parse the stored JSON sections defensively. */
export function parseSections(mock: { listening: unknown; reading: unknown; writing: unknown }) {
  const listening = listeningSectionSchema.safeParse(mock.listening);
  const reading = readingSectionSchema.safeParse(mock.reading);
  const writing = writingSectionSchema.safeParse(mock.writing);
  return {
    listening: listening.success ? listening.data : null,
    reading: reading.success ? reading.data : null,
    writing: writing.success ? writing.data : null,
  };
}

/** Public (answer-free) view of a mock test for the runner. */
export function toPublicTest(mock: {
  id: string;
  listening: unknown;
  reading: unknown;
  writing: unknown;
}) {
  const { listening, reading, writing } = parseSections(mock);
  return {
    id: mock.id,
    listening: listening
      ? {
          title: listening.title,
          audioUrl: listening.audioUrl,
          questions: stripAnswers(listening.questions),
          hasContent: listening.questions.length > 0,
        }
      : null,
    reading: reading
      ? {
          title: reading.title,
          passage: reading.passage,
          questions: stripAnswers(reading.questions),
          hasContent: reading.questions.length > 0,
        }
      : null,
    writing: writing
      ? {
          task1: writing.task1.prompt ? writing.task1 : null,
          task2: writing.task2.prompt ? writing.task2 : null,
        }
      : null,
  };
}

/**
 * Grade an attempt: deterministic objective scoring + LLM writing grading +
 * overall band + focus plan. Scoped to the owning user.
 */
export async function gradeAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, userId },
    include: { mockTest: true, user: true },
  });
  if (!attempt) throw notFound("Attempt not found");

  const answers = (attempt.answers ?? {}) as AnswersPayload;
  const sections = parseSections(attempt.mockTest);

  // --- Objective sections (deterministic) ---
  let listeningBand: number | null = null;
  if (sections.listening && sections.listening.questions.length > 0) {
    const res = gradeObjective(sections.listening.questions, answers.listening ?? {});
    listeningBand = rawToBand(res.correct, res.total, "listening");
  }

  let readingBand: number | null = null;
  let readingRaw: { correct: number; total: number } | null = null;
  if (sections.reading && sections.reading.questions.length > 0) {
    const res = gradeObjective(sections.reading.questions, answers.reading ?? {});
    readingRaw = { correct: res.correct, total: res.total };
    readingBand = rawToBand(res.correct, res.total, "reading");
  }

  let listeningRaw: { correct: number; total: number } | null = null;
  if (sections.listening && sections.listening.questions.length > 0) {
    const res = gradeObjective(sections.listening.questions, answers.listening ?? {});
    listeningRaw = { correct: res.correct, total: res.total };
  }

  // --- Writing (LLM) ---
  let writingBand: number | null = null;
  let writingDetail: Record<string, unknown> | null = null;
  const model = attempt.user.model;
  const writing = sections.writing;
  const task1Text = answers.writing?.task1?.trim();
  const task2Text = answers.writing?.task2?.trim();

  if (writing) {
    // Give the Task 1 grader the figure's data (the prompt no longer restates it),
    // so it can judge accuracy of the candidate's reported numbers/trends.
    const task1Prompt = writing.task1.visual
      ? `${writing.task1.prompt}\n\nFigure data (${writing.task1.visual.kind}):\n${visualToText(writing.task1.visual)}`
      : writing.task1.prompt;

    // Grade the attempted tasks and, in parallel, generate Band 9 model answers
    // for the same tasks so the results page can show what top work looks like.
    const [t1, t2, m1, m2] = await Promise.all([
      writing.task1.prompt && task1Text
        ? gradeWritingTask("task1", task1Prompt, task1Text, model)
        : Promise.resolve(undefined),
      writing.task2.prompt && task2Text
        ? gradeWritingTask("task2", writing.task2.prompt, task2Text, model)
        : Promise.resolve(undefined),
      writing.task1.prompt && task1Text
        ? generateModelAnswer("task1", task1Prompt, model).catch(() => null)
        : Promise.resolve(null),
      writing.task2.prompt && task2Text
        ? generateModelAnswer("task2", writing.task2.prompt, model).catch(() => null)
        : Promise.resolve(null),
    ]);
    const modelAnswers = { task1: m1 ?? null, task2: m2 ?? null };
    if (t2) {
      writingBand = combineWritingBand(t2.band, t1?.band);
      writingDetail = { task1: t1 ?? null, task2: t2, combinedBand: writingBand, modelAnswers };
    } else if (t1) {
      // Only Task 1 attempted.
      writingBand = t1.band;
      writingDetail = { task1: t1, task2: null, combinedBand: writingBand, modelAnswers };
    }
  }

  const overall = overallBand(listeningBand, readingBand, writingBand);

  // --- Focus plan ---
  let focusPlan: unknown = null;
  try {
    const examDate = attempt.user.examDate;
    const daysUntilExam = examDate
      ? Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86_400_000))
      : null;
    const writingCriteria =
      writingDetail && (writingDetail.task2 as { criteria?: unknown } | null)?.criteria
        ? ((writingDetail.task2 as { criteria: never }).criteria)
        : undefined;
    focusPlan = await generateFocusPlan(
      {
        listeningBand,
        readingBand,
        writingBand,
        writingCriteria,
        overallBand: overall,
        targetBand: attempt.user.targetBand,
        daysUntilExam,
      },
      model,
    );
  } catch (err) {
    logger.warn("Focus plan generation failed", { message: (err as Error)?.message });
  }

  const updated = await prisma.attempt.update({
    where: { id: attempt.id },
    data: {
      listeningBand,
      readingBand,
      writingBand,
      overallBand: overall,
      writingDetail: writingDetail as object | undefined,
      focusPlan: focusPlan as object | undefined,
      status: "graded",
    },
  });

  return {
    attempt: updated,
    raw: { listening: listeningRaw, reading: readingRaw },
  };
}

/** Empty section placeholders for practice-mode single-section tests. */
export const emptyListening: ListeningSection = {
  title: "",
  transcript: "",
  audioUrl: null,
  questions: [],
};
export const emptyReading: ReadingSection = { title: "", passage: "", questions: [] };
export const emptyWriting: WritingSection = {
  task1: { prompt: "" },
  task2: { prompt: "" },
};
