import { randomUUID } from "node:crypto";
import { chatJson } from "../lib/openrouter.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/db.js";
import {
  llmListeningSchema,
  llmReadingSchema,
  llmWritingSchema,
  type LlmQuestion,
  type ListeningSection,
  type ReadingSection,
  type WritingSection,
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
- "task1.prompt": an Academic Task 1 describing a visual (chart/graph/table/process/map). Fully describe the data in words so the candidate can respond without an image. Ask for at least 150 words in ~20 minutes.
- "task2.prompt": an Academic Task 2 essay question (opinion / discussion / problem-solution). Ask for at least 250 words in ~40 minutes.
Return STRICT JSON only.`,
  });
  return data;
}

/**
 * Orchestrates generation of all three sections (parallel) plus Listening TTS,
 * then persists a MockTest. Returns the created record id.
 */
export async function generateMockTest(model?: string): Promise<string> {
  logger.info("Generating mock test", { model: model ?? "default" });

  const [reading, listeningBase, writing] = await Promise.all([
    generateReading(model),
    generateListening(model),
    generateWriting(model),
  ]);

  // Synthesize audio for the listening transcript (cached by hash). Non-fatal:
  // the runner can fall back to on-device speech if audio is unavailable.
  let audioUrl: string | null = null;
  try {
    audioUrl = await synthesizeListeningAudio(listeningBase.transcript);
  } catch (err) {
    logger.warn("TTS failed; listening will use fallback", {
      message: (err as Error)?.message,
    });
  }

  const listening: ListeningSection = { ...listeningBase, audioUrl };

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
