export type QuestionType = "mcq" | "tfng" | "gap" | "match" | "dragdrop";

/** Answer-free question delivered to the runner. */
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  q: string;
  options?: string[];
}

export interface PublicListening {
  title: string;
  audioUrl: string | null;
  questions: PublicQuestion[];
  hasContent: boolean;
}
export interface PublicReading {
  title: string;
  passage: string;
  questions: PublicQuestion[];
  hasContent: boolean;
}
/** Structured Task 1 figure, rendered as a table or chart in the runner. */
export interface WritingVisual {
  kind: "table" | "bar" | "line" | "pie";
  title: string;
  unit?: string;
  categories: string[];
  series: { name: string; values: number[] }[];
}
export interface PublicWriting {
  task1: { prompt: string; visual?: WritingVisual } | null;
  task2: { prompt: string } | null;
}

export interface PublicTest {
  id: string;
  listening: PublicListening | null;
  reading: PublicReading | null;
  writing: PublicWriting | null;
}

export interface AnswersPayload {
  listening?: Record<string, string>;
  reading?: Record<string, string>;
  writing?: { task1?: string; task2?: string };
  flags?: Record<string, boolean>;
}

export interface WritingCriteria {
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
}
export interface WritingGrade {
  band: number;
  criteria: WritingCriteria;
  strengths: string[];
  improvements: string[];
  summary: string;
}
export interface FocusPlan {
  message: string;
  focus: { area: string; why: string; action: string }[];
}

export interface Attempt {
  id: string;
  status: "in_progress" | "graded";
  listeningBand: number | null;
  readingBand: number | null;
  writingBand: number | null;
  overallBand: number | null;
  writingDetail: {
    task1: WritingGrade | null;
    task2: WritingGrade | null;
    combinedBand: number;
    modelAnswers?: { task1: string | null; task2: string | null } | null;
  } | null;
  focusPlan: FocusPlan | null;
  answers?: AnswersPayload;
  createdAt: string;
  mockTestId: string;
  /** Present on list responses: "mock" (multi-section) or "practice" (single). */
  mode?: "mock" | "practice";
  /** Present on list responses: section keys with content, e.g. ["reading","writing"]. */
  sections?: string[];
}

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  examDate: string | null;
  targetBand: number;
  theme: string;
  model: string;
}
