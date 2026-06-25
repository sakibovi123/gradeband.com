import { randomUUID } from "node:crypto";
import { z } from "zod";
import { chatJson } from "../lib/openrouter.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/db.js";
import {
  llmListeningSchema,
  llmReadingSchema,
  llmWritingSchema,
  questionTypeSchema,
  type LlmQuestion,
  type ListeningSection,
  type ReadingSection,
  type WritingSection,
  type WritingVisual,
  type Question,
} from "../schemas/test.js";
import { synthesizeListeningAudio } from "./tts.js";

const READING_TOPICS = [
  "the history of urban planning",
  "marine biology and coral reefs",
  "the psychology of decision-making",
  "renewable energy technologies",
  "the development of written language",
  "sleep science and circadian rhythms",
  "the economics of global trade",
  "advances in materials science",
  "the social life of honeybees",
  "archaeology of ancient cities",
];

const LISTENING_SCENARIOS = [
  "a student enquiring about university accommodation",
  "a tour guide describing a museum exhibit",
  "two students discussing a group assignment",
  "a librarian explaining borrowing procedures",
  "a course tutor outlining an assignment brief",
  "a customer booking a guided walking tour",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Attach stable ids to LLM questions for the UI / answer keying. */
function withIds(questions: LlmQuestion[]): Question[] {
  return questions.map((q) => ({ ...q, id: `q_${randomUUID().slice(0, 8)}` }));
}

const QUESTION_RULES = `Question rules:
- type "mcq": provide 3-4 "options"; "answer" must EXACTLY equal one option.
- type "tfng": "options" must be ["True","False","Not Given"]; "answer" one of them.
- type "gap": a fill-in-the-blank using 1-3 words from the text; mark the blank in "q" with "_____". If multiple answers are acceptable, join them with "/". No "options".
- type "match": matching headings/statements; "options" is the pool of choices; "answer" is the correct option text.
- type "dragdrop": drag the correct word/option into a slot; "options" is the draggable pool; "answer" is the correct option text.
Return STRICT JSON only — no markdown, no commentary.`;

export async function generateReading(model?: string): Promise<ReadingSection> {
  const topic = pick(READING_TOPICS);
  const data = await chatJson({
    label: "reading",
    model,
    schema: llmReadingSchema,
    system:
      "You are an IELTS Academic Reading item writer. You produce realistic academic passages and accurate question keys. Output JSON only.",
    user: `Write ONE IELTS Academic Reading passage about ${topic}.
- "passage": 600-780 words, academic register, 4-6 paragraphs.
- "title": a short title.
- "questions": exactly 10 questions mixing these types: tfng, mcq, gap, match. Every "answer" must be verifiable strictly from the passage.
${QUESTION_RULES}`,
  });
  return { title: data.title, passage: data.passage, questions: withIds(data.questions) };
}

export async function generateListening(model?: string): Promise<Omit<ListeningSection, "audioUrl">> {
  const scenario = pick(LISTENING_SCENARIOS);
  const data = await chatJson({
    label: "listening",
    model,
    schema: llmListeningSchema,
    system:
      "You are an IELTS Listening item writer. You write natural spoken-English monologues/dialogues for a SINGLE narrator voice (use speaker labels inline like 'Tom:' only if needed) and accurate question keys. Output JSON only.",
    user: `Write an IELTS Listening section: ${scenario}.
- "transcript": 350-480 words of natural spoken English, readable aloud by one text-to-speech voice.
- "title": a short title.
- "questions": exactly 8 questions in passage order, mixing gap, mcq, and match types, all answerable from the transcript.
${QUESTION_RULES}`,
  });
  return { title: data.title, transcript: data.transcript, questions: withIds(data.questions) };
}

export async function generateWriting(model?: string): Promise<WritingSection> {
  const data = await chatJson({
    label: "writing",
    model,
    temperature: 0.8,
    schema: llmWritingSchema,
    system:
      "You are an IELTS Academic Writing item writer. Output JSON only.",
    user: `Create IELTS Academic Writing prompts.

- "task1": an Academic Task 1 built around ONE figure the candidate must describe.
  - "task1.visual": structured data for the figure. "kind" MUST be exactly one of
    these tokens (no other words): "table", "bar", "line", "pie".
    • "table" — categories are the column headers; each series is a row (name = row label).
    • "bar" — a bar chart; categories are the x-axis groups; each series is a set of bars.
    • "line" — a line graph over time; categories are time points (e.g. years); each series is a line.
    • "pie" — proportions; categories are the slice labels; use a SINGLE series.
    Provide "title", optional "unit" (e.g. "%", "millions"), "categories", and "series"
    where every series has exactly one number per category. Use realistic, varied
    numbers with a clear trend or comparison to write about (2-5 series, 3-8 categories).
  - "task1.prompt": the task wording that refers to the figure, e.g. "The {kind} below shows
    ... Summarise the information by selecting and reporting the main features, and make
    comparisons where relevant." Do NOT list the numbers in prose — the figure carries the
    data. Ask for at least 150 words in ~20 minutes.
- "task2.prompt": an Academic Task 2 essay question (opinion / discussion / problem-solution).
  Ask for at least 250 words in ~40 minutes.
Return STRICT JSON only.`,
  });
  // `kind` is normalized to the enum at parse time; the cast bridges a Zod
  // transform-inference quirk (it widens to string in this position).
  return data as WritingSection;
}

/**
 * Orchestrates generation of the in-scope sections (Reading + Writing) in
 * parallel, then persists a MockTest. Returns the created record id.
 *
 * Listening is out of scope for now: it is persisted as an empty section so the
 * runner cleanly skips it. The Listening generators below are kept intact for
 * when the module is re-enabled.
 */
export async function generateMockTest(model?: string): Promise<string> {
  logger.info("Generating mock test", { model: model ?? "default" });

  const [reading, writing] = await Promise.all([
    generateReading(model),
    generateWriting(model),
  ]);

  // Listening intentionally left empty (out of scope) — no questions, no audio.
  const listening: ListeningSection = {
    title: "",
    transcript: "",
    audioUrl: null,
    questions: [],
  };

  const test = await prisma.mockTest.create({
    data: {
      listening: listening as object,
      reading: reading as object,
      writing: writing as object,
    },
  });

  logger.info("Mock test created", { id: test.id });
  return test.id;
}

// --- Learn guides ---------------------------------------------------------
//
// On-demand, self-contained practice items for the Learn section, shaped to the
// frontend's `Drill` type so the existing ReadingDrill / WritingDrill renderers
// can display them. A reading guide is a short passage with self-marking
// questions that each carry an explanation; a writing guide is a single task
// prompt (Task 1 with a figure, or Task 2).

const llmReadingGuideSchema = z.object({
  instructions: z.string().min(1),
  passage: z.string().min(1),
  questions: z
    .array(
      z.object({
        type: questionTypeSchema,
        q: z.string().min(1),
        options: z.array(z.string().min(1)).optional(),
        answer: z.string().min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(5)
    .max(8),
});

export interface ReadingGuide {
  kind: "reading";
  instructions: string;
  passage: string;
  questions: {
    type: LlmQuestion["type"];
    q: string;
    options?: string[];
    answer: string;
    explanation: string;
  }[];
}

export interface WritingGuide {
  kind: "writing";
  task: "task1" | "task2";
  prompt: string;
  visual?: WritingVisual;
}

/** Generate a fresh, self-marking reading guide for the Learn section. */
export async function generateReadingGuide(model?: string): Promise<ReadingGuide> {
  const topic = pick(READING_TOPICS);
  const data = await chatJson({
    label: "learn-reading-guide",
    model,
    schema: llmReadingGuideSchema,
    system:
      "You are an IELTS Academic Reading item writer and tutor. You produce realistic passages, accurate keys, and short teaching explanations. Output JSON only.",
    user: `Write a SHORT IELTS Academic Reading practice guide about ${topic}.
- "passage": 300-450 words, academic register.
- "instructions": one line telling the learner what to do.
- "questions": exactly 6 questions mixing tfng, mcq, and gap. Every "answer" must be verifiable strictly from the passage.
- Each question also has an "explanation": one sentence pointing to the evidence in the passage that justifies the answer (this is a learning aid).
${QUESTION_RULES}`,
  });
  return { kind: "reading", instructions: data.instructions, passage: data.passage, questions: data.questions };
}

/** Generate a fresh writing guide (one task) for the Learn section. */
export async function generateWritingGuide(model?: string): Promise<WritingGuide> {
  const writing = await generateWriting(model);
  // Half the time give a Task 1 (with its figure), otherwise a Task 2 essay.
  if (Math.random() < 0.5 && writing.task1?.prompt) {
    return { kind: "writing", task: "task1", prompt: writing.task1.prompt, visual: writing.task1.visual };
  }
  return { kind: "writing", task: "task2", prompt: writing.task2.prompt };
}

/** Generate a single section for practice-mode drilling. */
export async function generateSingleSection(
  section: "listening" | "reading" | "writing",
  model?: string,
) {
  if (section === "reading") return generateReading(model);
  if (section === "writing") return generateWriting(model);
  const base = await generateListening(model);
  let audioUrl: string | null = null;
  try {
    audioUrl = await synthesizeListeningAudio(base.transcript);
  } catch {
    audioUrl = null;
  }
  return { ...base, audioUrl };
}
