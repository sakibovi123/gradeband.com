import type { QuestionType, WritingVisual } from "@/lib/types";

export type Track = "foundations" | "reading" | "writing";

export type LessonBlock =
  | { type: "prose"; title?: string; body: string }
  | { type: "steps"; title?: string; items: string[] }
  | { type: "list"; title?: string; variant?: "do" | "dont" | "traps" | "plain"; items: string[] }
  | { type: "bank"; title: string; groups: { label: string; items: string[] }[] }
  | { type: "template"; title?: string; lines: string[] }
  | { type: "model"; title?: string; band: number; answer: string; notes?: string[] };

export type ReadingDrillQ = {
  type: QuestionType;
  q: string;
  options?: string[];
  answer: string; // alternatives joined with "/"
  explanation: string;
};

export type Drill =
  | { kind: "reading"; instructions: string; passage: string; questions: ReadingDrillQ[] }
  | { kind: "writing"; task: "task1" | "task2"; prompt: string; visual?: WritingVisual };

export interface Lesson {
  slug: string;
  track: Track;
  group: string;
  title: string;
  summary: string;
  minutes: number;
  blocks: LessonBlock[];
  drill?: Drill;
}

export const TRACK_LABEL: Record<Track, string> = {
  foundations: "Foundations",
  reading: "Reading",
  writing: "Writing",
};

export const LESSONS: Lesson[] = [
  // ---------------------------------------------------------------- FOUNDATIONS
  {
    slug: "understand-the-bands",
    track: "foundations",
    group: "Start here",
    title: "Understand the bands",
    summary: "What Band 6 vs 7 vs 8 actually means, and how each section is scored.",
    minutes: 6,
    blocks: [
      {
        type: "prose",
        body: "You can't hit a target you can't see. Reading is scored objectively — a raw mark out of 40 is converted to a band. Writing is scored by four equally-weighted criteria, each given a band, then averaged. Task 2 counts double towards your Writing band.",
      },
      {
        type: "bank",
        title: "The four Writing criteria, decoded",
        groups: [
          { label: "Task Response (TR)", items: ["Did you fully answer every part of the question, with a clear position and developed ideas? Band 8 = fully addressed, well-developed; Band 6 = addressed but some parts underdeveloped or off-topic."] },
          { label: "Coherence & Cohesion (CC)", items: ["Logical flow, clear paragraphs, linkers used naturally. Band 8 = effortless to follow; Band 6 = organised but mechanical or repetitive linking."] },
          { label: "Lexical Resource (LR)", items: ["Range and precision of vocabulary. Band 8 = wide, natural, few slips; Band 6 = adequate but repetitive, with errors that rarely block meaning."] },
          { label: "Grammatical Range & Accuracy (GRA)", items: ["Variety of structures and error rate. Band 8 = mostly error-free complex sentences; Band 6 = mix of simple/complex with frequent errors."] },
        ],
      },
      {
        type: "list",
        variant: "plain",
        title: "Reading: raw score → band (Academic, /40)",
        items: ["Band 9 ≈ 39–40", "Band 8 ≈ 35–36", "Band 7 ≈ 30–32", "Band 6 ≈ 23–26", "Band 5 ≈ 15–18"],
      },
      {
        type: "prose",
        title: "What this means for you",
        body: "For Band 7+ Reading you can only afford ~8–10 wrong out of 40 — accuracy and time management matter more than reading speed. For Writing, the fastest gains usually come from your single lowest criterion, not from writing more.",
      },
    ],
  },

  // ------------------------------------------------------------------- READING
  {
    slug: "reading-strategy",
    track: "reading",
    group: "Foundations",
    title: "Reading strategy & timing",
    summary: "The 20-minutes-per-passage plan, skim-then-scan, and how to not run out of time.",
    minutes: 7,
    blocks: [
      {
        type: "steps",
        title: "Per passage (20 minutes)",
        items: [
          "Skim the passage for 2–3 minutes: read the title, first/last sentence of each paragraph, and note the topic of each.",
          "Read the questions and underline keywords (names, dates, numbers, unusual nouns).",
          "Scan back into the text for those keywords — answers usually follow passage order for most question types.",
          "Write answers straight onto the answer sheet; don't leave transferring to the end.",
          "Never spend more than ~90 seconds on one question — mark it, move on, come back.",
        ],
      },
      {
        type: "list",
        variant: "traps",
        title: "What costs people Band 7",
        items: [
          "Reading every word — you don't have time. Scan for the answer location, then read closely there.",
          "Matching words instead of meaning — the answer is usually a paraphrase, not the same words.",
          "Spelling/grammar slips on transfer — a correct answer spelled wrong is marked wrong.",
        ],
      },
    ],
  },
  {
    slug: "reading-tfng",
    track: "reading",
    group: "Question types",
    title: "True / False / Not Given",
    summary: "Master the False-vs-Not-Given distinction that decides this question type.",
    minutes: 8,
    blocks: [
      {
        type: "prose",
        body: "You judge a statement against the passage. TRUE = the passage confirms it. FALSE = the passage contradicts it. NOT GIVEN = the passage neither confirms nor contradicts it. (Yes/No/Not Given works the same way but about the writer's opinion.)",
      },
      {
        type: "steps",
        title: "Method",
        items: [
          "Find the part of the passage the statement refers to (questions follow passage order).",
          "Compare meaning, not words. Ask: does the text say the same thing, the opposite thing, or nothing about it?",
          "If you're hunting for information that simply isn't there → it's Not Given. Don't use outside knowledge.",
        ],
      },
      {
        type: "list",
        variant: "traps",
        items: [
          "FALSE needs a direct contradiction in the text. If the text is just silent on it, it's NOT GIVEN.",
          "Watch qualifiers: 'all', 'always', 'only', 'never' often make a statement FALSE.",
        ],
      },
    ],
    drill: {
      kind: "reading",
      instructions: "Do the statements agree with the passage? Choose True, False, or Not Given.",
      passage:
        "The axolotl, a salamander native to lakes near Mexico City, retains its larval features throughout its life, a condition known as neoteny. Unlike most amphibians, it never undergoes full metamorphosis and keeps its feathery external gills. Axolotls are remarkable for their ability to regenerate lost limbs, and even parts of the heart and brain, within weeks. In the wild they are now critically endangered, largely because of water pollution and the introduction of predatory fish. However, they are bred in their thousands in laboratories worldwide, where they are studied for insights into tissue regeneration.",
      questions: [
        {
          type: "tfng",
          q: "Axolotls keep features that other amphibians normally lose as adults.",
          options: ["True", "False", "Not Given"],
          answer: "True",
          explanation: "The passage says it 'retains its larval features throughout its life' and 'never undergoes full metamorphosis' — confirming the statement.",
        },
        {
          type: "tfng",
          q: "Axolotls can regrow their limbs but not any internal organs.",
          options: ["True", "False", "Not Given"],
          answer: "False",
          explanation: "Contradicted: the text says they regenerate limbs 'and even parts of the heart and brain'.",
        },
        {
          type: "tfng",
          q: "Laboratory-bred axolotls live longer than wild ones.",
          options: ["True", "False", "Not Given"],
          answer: "Not Given",
          explanation: "The passage mentions lab breeding but says nothing comparing lifespans — so it's Not Given, not False.",
        },
      ],
    },
  },
  {
    slug: "reading-matching-headings",
    track: "reading",
    group: "Question types",
    title: "Matching headings",
    summary: "Identify each paragraph's main idea and beat the distractor headings.",
    minutes: 7,
    blocks: [
      {
        type: "steps",
        title: "Method",
        items: [
          "Do this question type last for that passage — by then you know the text.",
          "For each paragraph, find the main idea (often the first or last sentence), not a small detail.",
          "Match it to a heading by meaning. Cross off headings as you use them.",
          "Beware headings that match a detail in the paragraph but not its overall point.",
        ],
      },
      {
        type: "list",
        variant: "traps",
        items: [
          "There are always more headings than paragraphs — some are pure distractors.",
          "A heading that repeats a word from the paragraph is often the trap, not the answer.",
        ],
      },
    ],
    drill: {
      kind: "reading",
      instructions: "Choose the best heading for the paragraph from the list.",
      passage:
        "Paragraph: Early lighthouses burned wood or coal in open fires, which were dim and easily lost in fog. The breakthrough came in 1822, when Augustin Fresnel designed a lens of concentric glass rings that bent scattered light into a single powerful beam. A Fresnel lens could throw light more than twenty miles out to sea using a fraction of the fuel, and within decades it had been fitted to lighthouses across the world.",
      questions: [
        {
          type: "match",
          q: "Which heading best fits the paragraph?",
          options: [
            "The dangers faced by early sailors",
            "A lens that transformed lighthouse design",
            "How coal was transported to the coast",
            "The decline of the lighthouse keeper",
          ],
          answer: "A lens that transformed lighthouse design",
          explanation: "The paragraph's main idea is Fresnel's lens and its impact. The other options touch on side details or topics the paragraph never develops.",
        },
      ],
    },
  },
  {
    slug: "reading-mcq",
    track: "reading",
    group: "Question types",
    title: "Multiple choice",
    summary: "Eliminate distractors and choose the option that matches meaning, not words.",
    minutes: 6,
    blocks: [
      {
        type: "steps",
        title: "Method",
        items: [
          "Read the question stem first and find the relevant lines in the passage.",
          "Predict the answer in your own words before reading the options.",
          "Eliminate: options that are true but don't answer the question, that overstate ('always', 'all'), or that use passage words but distort the meaning.",
        ],
      },
      { type: "list", variant: "traps", items: ["The option with the most words copied from the passage is frequently the distractor."] },
    ],
    drill: {
      kind: "reading",
      instructions: "Choose the correct answer.",
      passage:
        "Honeybees communicate the location of food through a 'waggle dance'. The direction of the waggle relative to vertical indicates the angle to the food source relative to the sun, while the duration of the waggle signals the distance. Crucially, bees adjust the dance as the sun moves across the sky, so the same food source is described differently in the morning and afternoon.",
      questions: [
        {
          type: "mcq",
          q: "According to the passage, the duration of the waggle tells other bees about the food's:",
          options: ["direction", "distance", "quality", "quantity"],
          answer: "distance",
          explanation: "'the duration of the waggle signals the distance'. Direction is shown by the angle, not duration — that's the distractor.",
        },
        {
          type: "mcq",
          q: "Why does the same food source get described differently during the day?",
          options: [
            "Because the food runs out",
            "Because the bees become tired",
            "Because the sun's position changes",
            "Because other bees take over",
          ],
          answer: "Because the sun's position changes",
          explanation: "'bees adjust the dance as the sun moves across the sky' — the dance is relative to the sun.",
        },
      ],
    },
  },
  {
    slug: "reading-completion",
    track: "reading",
    group: "Question types",
    title: "Sentence, summary & note completion",
    summary: "Use exact words from the passage and respect the word limit.",
    minutes: 6,
    blocks: [
      {
        type: "prose",
        body: "You complete gaps using words taken from the passage. The instruction sets a strict limit — e.g. 'NO MORE THAN TWO WORDS'. Going over the limit, or changing the word's form, makes the answer wrong even if the meaning is right.",
      },
      {
        type: "steps",
        title: "Method",
        items: [
          "Read the sentence/summary and predict the type of word needed (noun? number? verb?).",
          "Scan the passage for the same idea — usually paraphrased around the answer.",
          "Copy the exact word(s) from the passage. Check spelling and the word limit.",
        ],
      },
    ],
    drill: {
      kind: "reading",
      instructions: "Complete each sentence with NO MORE THAN TWO WORDS from the passage.",
      passage:
        "The Roman city of Pompeii was buried under several metres of volcanic ash when Mount Vesuvius erupted in AD 79. Because the ash sealed the city from air and moisture, buildings, frescoes and even loaves of bread survived almost intact. Modern archaeologists pour liquid plaster into the cavities left by decomposed bodies, producing detailed casts that capture the victims' final positions.",
      questions: [
        {
          type: "gap",
          q: "Pompeii was covered by volcanic _____ during the eruption.",
          answer: "ash",
          explanation: "'buried under several metres of volcanic ash'. One word, taken directly from the text.",
        },
        {
          type: "gap",
          q: "Archaeologists create casts by pouring _____ into hollow spaces.",
          answer: "liquid plaster/plaster",
          explanation: "'pour liquid plaster into the cavities'. Either 'liquid plaster' or 'plaster' fits within the two-word limit.",
        },
      ],
    },
  },
  {
    slug: "reading-matching-information",
    track: "reading",
    group: "Question types",
    title: "Matching information & features",
    summary: "Locate specific facts in the right paragraph — the slowest type, so manage time.",
    minutes: 5,
    blocks: [
      {
        type: "prose",
        body: "You're told a piece of information (e.g. 'a definition of a term', 'an example of a benefit') and must find which paragraph contains it. Unlike most types, these do NOT follow passage order, so they can be slow — save them for after the others.",
      },
      {
        type: "list",
        variant: "do",
        items: [
          "Scan for the specific thing named (a reason, an example, a comparison), not for keywords.",
          "A paragraph can be the answer to more than one question, or to none.",
        ],
      },
    ],
    drill: {
      kind: "reading",
      instructions: "Which paragraph (A, B or C) contains the following information?",
      passage:
        "A. Bamboo is technically a grass, yet some species grow nearly a metre a day, making it the fastest-growing plant on Earth. B. Its strength-to-weight ratio rivals steel, which is why it has long been used as scaffolding across much of Asia. C. Because it regrows from the same root system after cutting, it can be harvested repeatedly without replanting, unlike most timber.",
      questions: [
        {
          type: "match",
          q: "a comparison between bamboo and a building material",
          options: ["A", "B", "C"],
          answer: "B",
          explanation: "Paragraph B compares bamboo's strength to steel and mentions scaffolding.",
        },
        {
          type: "match",
          q: "the reason bamboo does not need replanting",
          options: ["A", "B", "C"],
          answer: "C",
          explanation: "Paragraph C explains it 'regrows from the same root system after cutting'.",
        },
      ],
    },
  },

  // ------------------------------------------------------------------- WRITING — TASK 1
  {
    slug: "task1-overview",
    track: "writing",
    group: "Task 1",
    title: "Task 1: the structure that scores",
    summary: "The four-paragraph shape and the overview examiners require for Band 7+.",
    minutes: 7,
    blocks: [
      {
        type: "template",
        title: "Four paragraphs",
        lines: [
          "1. Introduction — paraphrase what the figure shows (what, where, when). Don't copy the prompt.",
          "2. Overview — 1–2 sentences on the biggest features/trends. NO specific numbers here.",
          "3. Body 1 — group of data, with figures and comparisons.",
          "4. Body 2 — the remaining data, with figures and comparisons.",
        ],
      },
      {
        type: "prose",
        title: "The overview is non-negotiable",
        body: "A clear overview of the main trends is the single biggest lever for Task Achievement. Without it you are capped around Band 5–6, however accurate your details are.",
      },
      {
        type: "bank",
        title: "Language bank",
        groups: [
          { label: "Trends", items: ["rose, climbed, surged, soared", "fell, declined, dropped, plummeted", "fluctuated, levelled off, remained stable, peaked"] },
          { label: "Comparisons", items: ["higher/lower than", "more than double", "the highest/lowest", "whereas, while, by contrast"] },
          { label: "Approximation", items: ["approximately, around, roughly", "just over/under, nearly", "a little above"] },
        ],
      },
      { type: "list", variant: "dont", items: ["Don't give opinions or guess causes.", "Don't describe every data point — select the main ones.", "Don't copy the prompt wording."] },
      {
        type: "prose",
        title: "Worked example",
        body: "Below is a Band 9 response to a line graph showing electricity (in terawatt-hours) generated from coal, natural gas and renewables in one country between 2000 and 2020.",
      },
      {
        type: "model",
        band: 9,
        answer: `The line graph illustrates the quantity of electricity, measured in terawatt-hours (TWh), generated from three sources — coal, natural gas and renewables — in one country between 2000 and 2020.

Overall, although coal remained the leading source throughout the period, its output fell steadily, whereas the contribution of renewables grew dramatically and had almost matched that of coal by the end.

In 2000, coal dominated at approximately 320 TWh, far exceeding natural gas (150 TWh) and renewables, which were negligible at just 40 TWh. Over the next two decades coal declined gradually, slipping to around 210 TWh and losing its commanding lead.

Renewables, by contrast, surged upward, climbing especially sharply after 2010 to reach roughly 190 TWh in 2020. Natural gas increased more modestly, from 150 to about 180 TWh, and was ultimately overtaken by renewables in the final years.`,
        notes: [
          "Paragraph 1 paraphrases the prompt (no copying) and states what, where and when.",
          "Paragraph 2 is the overview — the two biggest movements, with NO specific figures.",
          "The body paragraphs group the data and back every claim with accurate figures and comparisons ('far exceeding', 'overtaken by').",
          "≈ 160 words — concise but complete.",
        ],
      },
    ],
  },
  {
    slug: "task1-line",
    track: "writing",
    group: "Task 1",
    title: "Task 1: Line graphs",
    summary: "Describe change over time with accurate trend language.",
    minutes: 6,
    blocks: [
      { type: "prose", body: "Line graphs show change over time. Your overview should capture the overall movement (rising? falling? converging?) and any standout point (a peak, a crossover). In the body, describe each line's trend and compare lines at key moments." },
      { type: "list", variant: "do", items: ["Use the past simple for finished periods and 'is projected to' for future data.", "Pair a trend verb with a degree adverb: 'rose sharply', 'fell gradually'.", "Compare lines: when one overtakes another, say so."] },
    ],
    drill: {
      kind: "writing",
      task: "task1",
      prompt:
        "The line graph below shows the number of international visitors (in millions) to three cities — Lisbon, Prague and Vienna — from 2000 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
      visual: {
        kind: "line",
        title: "International visitors (millions), 2000–2020",
        unit: "m",
        categories: ["2000", "2005", "2010", "2015", "2020"],
        series: [
          { name: "Lisbon", values: [2, 3, 4.5, 7, 9] },
          { name: "Prague", values: [3, 4, 5, 6, 5.5] },
          { name: "Vienna", values: [4, 4.2, 4.5, 5, 6] },
        ],
      },
    },
  },
  {
    slug: "task1-bar",
    track: "writing",
    group: "Task 1",
    title: "Task 1: Bar charts",
    summary: "Compare quantities across categories without listing every bar.",
    minutes: 5,
    blocks: [
      { type: "prose", body: "Bar charts are about comparison. Your overview should state the highest and lowest overall, or the biggest contrast. Group similar bars together rather than describing them one by one." },
      { type: "list", variant: "do", items: ["Use comparative/superlative language: 'far higher than', 'the least popular'.", "Group: 'X and Y were similar, whereas Z was markedly lower.'"] },
    ],
    drill: {
      kind: "writing",
      task: "task1",
      prompt:
        "The bar chart below shows the percentage of households owning four types of pet (dogs, cats, fish, birds) in three countries. Summarise the main features and make comparisons. Write at least 150 words.",
      visual: {
        kind: "bar",
        title: "Households owning pets (%)",
        unit: "%",
        categories: ["Dogs", "Cats", "Fish", "Birds"],
        series: [
          { name: "Brazil", values: [58, 36, 12, 9] },
          { name: "Japan", values: [25, 41, 18, 6] },
          { name: "Germany", values: [40, 44, 8, 5] },
        ],
      },
    },
  },
  {
    slug: "task1-table",
    track: "writing",
    group: "Task 1",
    title: "Task 1: Tables",
    summary: "Select the key figures from a grid — don't transcribe the whole table.",
    minutes: 5,
    blocks: [
      { type: "prose", body: "Tables hand you a lot of numbers; the skill is selection. Find the highest and lowest, the biggest change, or a clear pattern across a row or column for your overview, then support with a few precise figures." },
      { type: "list", variant: "traps", items: ["Don't read the table out as a list — that caps Task Achievement.", "Round sensibly and use approximation where exact figures aren't the point."] },
    ],
    drill: {
      kind: "writing",
      task: "task1",
      prompt:
        "The table below shows average weekly spending (in USD) on three categories by age group. Summarise the main features and make comparisons. Write at least 150 words.",
      visual: {
        kind: "table",
        title: "Average weekly spending (USD)",
        unit: "$",
        categories: ["18–29", "30–49", "50+"],
        series: [
          { name: "Eating out", values: [62, 48, 30] },
          { name: "Groceries", values: [55, 90, 75] },
          { name: "Entertainment", values: [70, 45, 25] },
        ],
      },
    },
  },
  {
    slug: "task1-pie",
    track: "writing",
    group: "Task 1",
    title: "Task 1: Pie charts",
    summary: "Describe proportions, and compare across pies when there are several.",
    minutes: 5,
    blocks: [
      { type: "prose", body: "Pie charts show proportions of a whole. Lead with the largest and smallest slices. If there are two or more pies (e.g. two years), the overview should capture how the proportions shifted." },
      { type: "bank", title: "Proportion language", groups: [{ label: "Phrases", items: ["accounted for, made up, represented", "a (significant/small) proportion of", "just under a quarter, exactly half, a tenth"] }] },
    ],
    drill: {
      kind: "writing",
      task: "task1",
      prompt:
        "The pie chart below shows how a typical household's monthly budget is divided. Summarise the main features. Write at least 150 words.",
      visual: {
        kind: "pie",
        title: "Household monthly budget",
        unit: "%",
        categories: ["Housing", "Food", "Transport", "Savings", "Other"],
        series: [{ name: "Share", values: [35, 22, 15, 18, 10] }],
      },
    },
  },
  {
    slug: "task1-process",
    track: "writing",
    group: "Task 1",
    title: "Task 1: Process diagrams",
    summary: "Sequence the stages and use the passive voice naturally.",
    minutes: 6,
    blocks: [
      { type: "prose", body: "A process has stages, not numbers. Your overview should say how many stages there are and whether the process is linear or cyclical, and name the start and end points. Then describe each stage in order." },
      { type: "bank", title: "Sequencing & passive", groups: [
        { label: "Sequencers", items: ["first(ly), next, subsequently, after that, finally", "once X has been done, …", "at this stage / in the final step"] },
        { label: "Passive", items: ["the beans are roasted", "the mixture is then left to cool", "the parts are assembled by machine"] },
      ] },
    ],
    drill: {
      kind: "writing",
      task: "task1",
      prompt:
        "The diagram shows the process of making instant coffee. The stages are: harvested coffee cherries → beans removed and dried → beans roasted → ground into powder → brewed into concentrated liquid → liquid frozen and broken into granules → granules dried and packaged. Summarise the process by describing the main stages. Write at least 150 words.",
    },
  },
  {
    slug: "task1-map",
    track: "writing",
    group: "Task 1",
    title: "Task 1: Maps",
    summary: "Describe change between two maps using location and direction language.",
    minutes: 6,
    blocks: [
      { type: "prose", body: "Maps usually show a place at two points in time. Your overview should summarise how the area changed overall (more developed? more residential?). Use compass directions and the passive for changes." },
      { type: "bank", title: "Map language", groups: [
        { label: "Location", items: ["to the north/south of, in the north-east corner", "adjacent to, alongside, on the outskirts"] },
        { label: "Change", items: ["was demolished / replaced by", "a car park was constructed", "the forest was cleared to make way for housing"] },
      ] },
    ],
    drill: {
      kind: "writing",
      task: "task1",
      prompt:
        "Two maps show the village of Stokeford in 1930 and 2010. In 1930 there were farms in the south, a small school in the centre, and woodland by the river to the north. By 2010 the farms had been replaced by housing, the school had been enlarged, and the woodland had been cleared for a riverside park. Summarise the main changes. Write at least 150 words.",
    },
  },

  // ------------------------------------------------------------------- WRITING — TASK 2
  {
    slug: "task2-structure",
    track: "writing",
    group: "Task 2",
    title: "Task 2: the essay structure",
    summary: "A universal four-paragraph shape, plus what pushes Coherence and Task Response to Band 8.",
    minutes: 8,
    blocks: [
      {
        type: "template",
        title: "Four paragraphs (~280 words)",
        lines: [
          "1. Introduction — paraphrase the question + a clear thesis stating your position/answer.",
          "2. Body 1 — one main idea (topic sentence) → explain → specific example → link back.",
          "3. Body 2 — a second main idea, developed the same way.",
          "4. Conclusion — restate your position and summarise; add no new ideas.",
        ],
      },
      { type: "list", variant: "do", items: [
        "Answer ALL parts of the question — that's Task Response.",
        "Develop two ideas deeply rather than listing five shallow ones.",
        "Use linkers naturally (However, Furthermore, As a result, For instance) plus referencing (this, such, which).",
      ] },
      { type: "bank", title: "Useful frames", groups: [
        { label: "Thesis", items: ["This essay will argue that …", "While there are benefits, I believe the drawbacks outweigh them."] },
        { label: "Develop", items: ["This is largely because …", "A clear example of this is …", "Consequently, …"] },
      ] },
      {
        type: "prose",
        title: "Worked example",
        body: "Below is a Band 9 response to: 'Some people believe that children should be required to learn a second language at primary school. To what extent do you agree or disagree?'",
      },
      {
        type: "model",
        band: 9,
        answer: `It is sometimes argued that learning a foreign language should be compulsory for children in primary school. I strongly agree with this view, as early exposure both accelerates language acquisition and broadens children's cultural horizons.

The most compelling reason concerns the way children learn. Young minds are remarkably receptive to new sounds and grammatical patterns, absorbing them almost effortlessly in a way that becomes far harder during adolescence. A child who begins French at the age of six, for instance, is likely to develop a more natural accent and a more intuitive grasp of grammar than someone who starts as a teenager. Making such learning mandatory ensures that every child benefits from this critical window, not merely those whose parents can afford private tuition.

A second advantage is cultural. Studying another language inevitably introduces children to different customs and ways of thinking, nurturing tolerance and curiosity from an early age. In an increasingly interconnected world, this open-mindedness is invaluable, and it is far easier to cultivate in childhood than to instil later in life.

Opponents might contend that young children should first master their mother tongue. However, research consistently indicates that bilingual children suffer no lasting disadvantage in their first language; if anything, their overall literacy tends to improve.

In conclusion, although such reservations are understandable, I firmly believe that compulsory second-language learning at primary level is beneficial. The cognitive and cultural rewards it offers are simply too significant to leave to chance.`,
        notes: [
          "The introduction paraphrases the prompt and states an unmistakable position (the thesis).",
          "Each body paragraph opens with a topic sentence, then explains and gives a concrete example.",
          "The fourth paragraph concedes the opposing view and rebuts it — a Band 8+ move that strengthens Task Response.",
          "Cohesion is natural ('The most compelling reason', 'A second advantage', 'However', 'In conclusion') and the conclusion adds no new ideas. ≈ 290 words.",
        ],
      },
    ],
  },
  {
    slug: "task2-opinion",
    track: "writing",
    group: "Task 2",
    title: "Task 2: Opinion (agree/disagree)",
    summary: "State a clear position and defend it consistently.",
    minutes: 6,
    blocks: [
      { type: "prose", body: "The prompt asks how far you agree. Pick a clear stance in the introduction and keep it the whole way through. A fully one-sided or a balanced ('partly agree') answer can both score Band 8 — what matters is that your position is clear and consistently supported." },
      { type: "list", variant: "do", items: ["Make your position unmistakable in the thesis.", "Each body paragraph = one reason supporting your stance, fully developed."] },
    ],
    drill: {
      kind: "writing",
      task: "task2",
      prompt:
        "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.",
    },
  },
  {
    slug: "task2-discussion",
    track: "writing",
    group: "Task 2",
    title: "Task 2: Discuss both views",
    summary: "Present both sides fairly, then give your own opinion — don't forget the opinion.",
    minutes: 6,
    blocks: [
      { type: "prose", body: "'Discuss both views and give your own opinion' has THREE parts: view A, view B, and your opinion. Many candidates lose Task Response marks by forgetting the opinion. State it in the introduction and reinforce it in the conclusion." },
      { type: "template", title: "Shape", lines: [
        "Intro — paraphrase + state which view you favour.",
        "Body 1 — explain view A (and why some hold it).",
        "Body 2 — explain view B (the one you favour, developed more).",
        "Conclusion — restate your opinion.",
      ] },
    ],
    drill: {
      kind: "writing",
      task: "task2",
      prompt:
        "Some people think children should start school as early as possible, while others believe they should not start until they are at least seven. Discuss both views and give your own opinion. Write at least 250 words.",
    },
  },
  {
    slug: "task2-problem-solution",
    track: "writing",
    group: "Task 2",
    title: "Task 2: Problem & solution",
    summary: "Identify real causes and propose solutions that clearly address them.",
    minutes: 6,
    blocks: [
      { type: "prose", body: "These prompts ask for problems/causes and solutions. The key to Band 8 is that each solution clearly tackles a cause you named — not a generic list. Keep it focused: one or two well-developed causes and matching solutions beat many shallow ones." },
      { type: "list", variant: "do", items: ["Link cause → solution explicitly ('To address this, …').", "Make solutions realistic and specific (who does what)."] },
    ],
    drill: {
      kind: "writing",
      task: "task2",
      prompt:
        "Many cities around the world are becoming increasingly congested with traffic. What are the causes of this problem, and what measures could be taken to solve it? Write at least 250 words.",
    },
  },
  {
    slug: "task2-advantages",
    track: "writing",
    group: "Task 2",
    title: "Task 2: Advantages & disadvantages",
    summary: "Weigh both sides and, if asked, judge whether the benefits outweigh the drawbacks.",
    minutes: 6,
    blocks: [
      { type: "prose", body: "Read carefully: 'Do the advantages outweigh the disadvantages?' requires a judgement (a thesis), whereas 'Discuss the advantages and disadvantages' may not. If a judgement is required, state it in the introduction and defend it." },
      { type: "list", variant: "traps", items: ["Don't sit on the fence when the prompt asks you to weigh — pick a side.", "Balance your paragraphs, but develop the side you favour more fully."] },
    ],
    drill: {
      kind: "writing",
      task: "task2",
      prompt:
        "More and more people are choosing to work remotely from home rather than in an office. Do the advantages of this trend outweigh the disadvantages? Write at least 250 words.",
    },
  },
];

export function lessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

export function lessonsByTrack(track: Track): Lesson[] {
  return LESSONS.filter((l) => l.track === track);
}
