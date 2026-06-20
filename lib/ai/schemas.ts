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
