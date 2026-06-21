import { z } from "zod"

export const MODEL = "openai/gpt-5.4-mini"

// --- Clarifying questions the AI asks before generating ---------------------
export const questionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().describe("short slug id for the question, e.g. 'experience'"),
        question: z.string().describe("the question text shown to the learner"),
        helper: z.string().nullable().describe("optional one-line helper/context"),
        options: z
          .array(z.string())
          .describe("3-5 suggested answer options the learner can pick from"),
        allowCustom: z.boolean().describe("whether a free-text answer is also allowed"),
      }),
    )
    .min(3)
    .max(5),
})

export type GeneratedQuestions = z.infer<typeof questionsSchema>

// --- Full course curriculum -------------------------------------------------
export const curriculumSchema = z.object({
  title: z.string().describe("an engaging course title"),
  summary: z.string().describe("2-3 sentence overview of what the learner will achieve"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  totalWeeks: z.number().int().min(1).max(52),
  modules: z
    .array(
      z.object({
        weekNumber: z.number().int().min(1),
        title: z.string(),
        summary: z.string().describe("what this module/week covers"),
        lessons: z
          .array(
            z.object({
              title: z.string(),
              objective: z.string().describe("the single learning objective"),
              durationMinutes: z.number().int().min(15).max(180),
            }),
          )
          .min(2)
          .max(6),
        assessment: z
          .object({
            type: z.enum(["test", "project"]),
            title: z.string(),
            description: z.string().describe("instructions for the test or project"),
          })
          .nullable()
          .describe("an optional test or project for this week"),
      }),
    )
    .min(1),
})

export type GeneratedCurriculum = z.infer<typeof curriculumSchema>

// --- Lesson content ---------------------------------------------------------
export const lessonContentSchema = z.object({
  content: z
    .string()
    .describe(
      "full lesson content in markdown: explanations, examples, code/diagrams as needed, and a short recap. 400-800 words.",
    ),
})

// --- Per-lesson formative check (MCQs + open answer) ------------------------
export const formativeSchema = z.object({
  questions: z
    .array(
      z.object({
        kind: z.enum(["mcq", "open"]),
        question: z.string(),
        // For mcq only (nullable for open questions, to satisfy strict mode).
        options: z.array(z.string()).nullable().describe("3-4 options for mcq, null for open"),
        answerIndex: z
          .number()
          .int()
          .nullable()
          .describe("index of correct option for mcq, null for open"),
        // For open only.
        sampleAnswer: z
          .string()
          .nullable()
          .describe("a model answer used to assess the learner's open response, null for mcq"),
        explanation: z.string().describe("why the answer is correct / what a good answer covers"),
      }),
    )
    .min(3)
    .max(5)
    .describe("2-3 multiple choice questions and 1-2 open answer questions"),
})

export type GeneratedFormative = z.infer<typeof formativeSchema>

// --- Grading an open formative answer ---------------------------------------
export const openGradeSchema = z.object({
  correct: z.boolean().describe("whether the open answer demonstrates understanding"),
  feedback: z.string().describe("one or two short sentences of feedback"),
})

// --- Interactive in-lesson elements -----------------------------------------
// The AI fills only the block that matches `type`; the rest stay null.
const interactiveMcqItem = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correctIndex: z.number().int().min(0).describe("index of the correct option"),
  explanation: z.string().describe("why the answer is correct"),
})

export const interactiveElementsSchema = z.object({
  elements: z
    .array(
      z.object({
        type: z
          .enum(["quiz", "dragdrop", "scenario", "audio"])
          .describe("which kind of interactive exercise this is"),
        title: z.string().describe("short title for the exercise"),
        description: z.string().nullable().describe("one-line intro, or null"),

        // type === "quiz": 2-4 quick check questions
        quiz: z
          .object({ questions: z.array(interactiveMcqItem).min(2).max(4) })
          .nullable()
          .describe("fill ONLY when type is 'quiz', else null"),

        // type === "dragdrop": ordering exercise. List items in the CORRECT order.
        dragdrop: z
          .object({
            instruction: z.string().describe("e.g. 'Arrange these events in chronological order'"),
            orderedItems: z
              .array(z.string())
              .min(3)
              .max(6)
              .describe("the items written in their CORRECT order; they will be shuffled for the learner"),
          })
          .nullable()
          .describe("fill ONLY when type is 'dragdrop', else null"),

        // type === "scenario": a 'what would you do' situation with branching feedback
        scenario: z
          .object({
            situation: z.string().describe("the scenario set-up the learner faces"),
            choices: z
              .array(
                z.object({
                  text: z.string().describe("a decision the learner could make"),
                  isCorrect: z.boolean().describe("whether this is the best choice"),
                  feedback: z.string().describe("what happens / why, shown after picking this"),
                }),
              )
              .min(2)
              .max(4),
          })
          .nullable()
          .describe("fill ONLY when type is 'scenario', else null"),

        // type === "audio": a listening exercise. Transcript is read aloud via text-to-speech.
        audio: z
          .object({
            transcript: z
              .string()
              .describe("the spoken passage the learner listens to (2-5 sentences)"),
            questions: z.array(interactiveMcqItem).min(1).max(3),
          })
          .nullable()
          .describe("fill ONLY when type is 'audio', else null"),
      }),
    )
    .min(2)
    .max(4)
    .describe("2-4 interactive elements of varying types for this lesson"),
})

export type GeneratedInteractive = z.infer<typeof interactiveElementsSchema>

// Wire-format types matching the React component configs.
export type InteractiveElementConfig = {
  id: string
  type: "quiz" | "dragdrop" | "scenario" | "audio"
  title: string
  description?: string
  config: Record<string, unknown>
}

// --- Interleaved lesson blocks ----------------------------------------------
// A lesson is an ordered list of blocks so visuals and exercises sit INSIDE the
// teaching flow (right where a concept is introduced) rather than dumped at the end.

// An exercise block reused inside the lesson flow. Drag-and-drop now supports
// ordering (sequence), matching (term<->definition) and categorizing (sort into groups).
const exerciseBlockSchema = z.object({
  type: z
    .enum(["quiz", "dragdrop", "scenario", "audio"])
    .describe("which kind of interactive exercise this is"),
  title: z.string().describe("short title for the exercise"),
  description: z.string().nullable().describe("one-line intro, or null"),

  quiz: z
    .object({ questions: z.array(interactiveMcqItem).min(1).max(3) })
    .nullable()
    .describe("fill ONLY when type is 'quiz', else null"),

  dragdrop: z
    .object({
      mode: z
        .enum(["ordering", "matching", "categorizing"])
        .describe("ordering = put in sequence; matching = pair terms to definitions; categorizing = sort items into groups"),
      instruction: z.string().describe("what the learner should do"),
      // ordering
      orderedItems: z
        .array(z.string())
        .nullable()
        .describe("ONLY for mode 'ordering': items in their CORRECT order; they will be shuffled for the learner"),
      // matching
      pairs: z
        .array(z.object({ term: z.string(), match: z.string().describe("the definition/answer it pairs with") }))
        .nullable()
        .describe("ONLY for mode 'matching': the correct term/definition pairs"),
      // categorizing
      categories: z.array(z.string()).nullable().describe("ONLY for mode 'categorizing': the group names"),
      categorizedItems: z
        .array(z.object({ text: z.string(), category: z.string().describe("the category this item belongs in") }))
        .nullable()
        .describe("ONLY for mode 'categorizing': items labelled with their correct category"),
    })
    .nullable()
    .describe("fill ONLY when type is 'dragdrop', else null"),

  scenario: z
    .object({
      situation: z.string().describe("the scenario set-up the learner faces"),
      choices: z
        .array(
          z.object({
            text: z.string(),
            isCorrect: z.boolean(),
            feedback: z.string().describe("what happens / why, shown after picking this"),
          }),
        )
        .min(2)
        .max(4),
    })
    .nullable()
    .describe("fill ONLY when type is 'scenario', else null"),

  audio: z
    .object({
      transcript: z.string().describe("the spoken passage the learner listens to (2-5 sentences)"),
      questions: z.array(interactiveMcqItem).min(1).max(3),
    })
    .nullable()
    .describe("fill ONLY when type is 'audio', else null"),
})

// A visual block, rendered with HTML/CSS (no image files) to teach/demonstrate a concept.
const visualBlockSchema = z.object({
  variant: z
    .enum(["flow", "comparison", "stats", "timeline", "labeled"])
    .describe(
      "flow = process steps with arrows; comparison = side-by-side columns; stats = key figures; timeline = chronological events; labeled = a central concept with labelled parts",
    ),
  title: z.string().describe("the visual's title"),
  caption: z.string().nullable().describe("a short caption explaining the visual, or null"),

  // flow / timeline: ordered steps or events
  steps: z
    .array(z.object({ label: z.string(), detail: z.string().describe("one short sentence") }))
    .nullable()
    .describe("ONLY for 'flow' or 'timeline': the ordered steps/events"),

  // comparison: 2-3 columns
  columns: z
    .array(z.object({ heading: z.string(), points: z.array(z.string()).min(1).max(4) }))
    .nullable()
    .describe("ONLY for 'comparison': 2-3 columns of bullet points"),

  // stats: key figures
  stats: z
    .array(z.object({ value: z.string().describe("e.g. '70%' or '3x'"), label: z.string() }))
    .nullable()
    .describe("ONLY for 'stats': key figure cards"),

  // labeled: a central idea with labelled parts
  centerLabel: z.string().nullable().describe("ONLY for 'labeled': the central concept name"),
  parts: z
    .array(z.object({ label: z.string(), detail: z.string().describe("one short sentence") }))
    .nullable()
    .describe("ONLY for 'labeled': the labelled parts around the centre"),
})

export const lessonBlocksSchema = z.object({
  blocks: z
    .array(
      z.object({
        kind: z.enum(["prose", "visual", "exercise"]).describe("the type of this block"),
        prose: z
          .string()
          .nullable()
          .describe("ONLY when kind is 'prose': a markdown passage (80-200 words) teaching one idea"),
        visual: visualBlockSchema.nullable().describe("ONLY when kind is 'visual', else null"),
        exercise: exerciseBlockSchema.nullable().describe("ONLY when kind is 'exercise', else null"),
      }),
    )
    .min(7)
    .max(14)
    .describe(
      "An ordered, INTERLEAVED lesson: alternate prose with visuals and exercises so concepts are taught then immediately demonstrated/checked. Start with prose. Include at least 2 visuals and at least 3 exercises spread THROUGHOUT (never all at the end), with at least one drag-and-drop and at least one listening (audio) exercise.",
    ),
})

export type GeneratedLessonBlocks = z.infer<typeof lessonBlocksSchema>

// Wire-format block stored in lessons.contentBlocks and consumed by the renderer.
export type LessonBlock =
  | { kind: "prose"; markdown: string }
  | { kind: "visual"; variant: string; data: Record<string, unknown> }
  | { kind: "exercise"; element: InteractiveElementConfig }

// --- Test questions ---------------------------------------------------------
export const testSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).min(3).max(5),
        answerIndex: z.number().int().min(0).describe("index of the correct option"),
        explanation: z.string().describe("why the answer is correct"),
      }),
    )
    .min(3)
    .max(8),
})

// --- Project rubric ---------------------------------------------------------
export const projectSchema = z.object({
  brief: z.string().describe("project brief in markdown explaining the goal and context"),
  requirements: z.array(z.string()).min(3).max(8).describe("checklist of requirements"),
  rubric: z.array(z.string()).min(3).max(6).describe("how the project will be evaluated"),
})

// --- Grading a project submission -------------------------------------------
export const gradeSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().describe("constructive feedback in markdown, 2-4 short paragraphs"),
})
