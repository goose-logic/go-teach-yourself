import "server-only"
import { generateText, Output } from "ai"
import {
  MODEL,
  questionsSchema,
  curriculumSchema,
  lessonContentSchema,
  testSchema,
  projectSchema,
  gradeSchema,
} from "./schemas"

type IntakeAnswer = { question: string; answer: string }

function intakeToText(answers: IntakeAnswer[]) {
  return answers.map((a) => `- ${a.question}: ${a.answer}`).join("\n")
}

// Step 1: generate clarifying questions based on the subject + goal.
export async function generateQuestions(subject: string, goal: string) {
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: questionsSchema }),
    system:
      "You are an expert curriculum designer. Given a learning subject, ask 3-5 sharp clarifying questions " +
      "that will let you tailor a course: prior experience, specific focus areas, learning style, time available, " +
      "and desired outcomes. Keep questions concise. Provide 3-5 concrete options per question.",
    prompt: `Subject the learner wants to study: "${subject}".\nTheir stated goal: "${goal || "not specified"}".\nGenerate the clarifying questions.`,
  })
  return experimental_output
}

// Step 2: generate the full curriculum.
export async function generateCurriculum(params: {
  subject: string
  goal: string
  pace: "full_time" | "part_time"
  hoursPerWeek: number
  answers: IntakeAnswer[]
}) {
  const { subject, goal, pace, hoursPerWeek, answers } = params
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: curriculumSchema }),
    system:
      "You are an expert curriculum designer. Build a complete, well-sequenced course broken into weekly modules. " +
      "Each module has 2-6 lessons with clear objectives and realistic durations. Add a test or project to most weeks, " +
      "ending with a capstone project. Scale the total number of weeks and weekly workload to the learner's pace and " +
      "available hours: full-time learners cover more per week; part-time learners need a longer, lighter schedule.",
    prompt:
      `Subject: ${subject}\n` +
      `Goal: ${goal || "general proficiency"}\n` +
      `Study pace: ${pace === "full_time" ? "Full time" : "Part time"}\n` +
      `Hours available per week: ${hoursPerWeek}\n` +
      `Intake answers:\n${intakeToText(answers)}\n\n` +
      `Design the curriculum so that the sum of lesson + assessment time each week is close to the hours available.`,
  })
  return experimental_output
}

// Step 3: generate full content for a single lesson.
export async function generateLessonContent(params: {
  courseTitle: string
  moduleTitle: string
  lessonTitle: string
  objective: string
}) {
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: lessonContentSchema }),
    system:
      "You are an expert instructor writing a single self-contained lesson in markdown. Use headings, short paragraphs, " +
      "concrete examples, and code blocks or worked examples where useful. End with a brief recap and one reflection prompt.",
    prompt:
      `Course: ${params.courseTitle}\nModule: ${params.moduleTitle}\nLesson: ${params.lessonTitle}\n` +
      `Learning objective: ${params.objective}\n\nWrite the lesson content.`,
  })
  return experimental_output.content
}

// Generate a multiple-choice test.
export async function generateTest(params: {
  courseTitle: string
  topic: string
  description: string
}) {
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: testSchema }),
    system:
      "You are an assessment designer. Write a fair multiple-choice test that checks understanding of the topic. " +
      "Each question has one clearly correct option and a short explanation.",
    prompt: `Course: ${params.courseTitle}\nTopic to assess: ${params.topic}\nContext: ${params.description}\n\nWrite the test.`,
  })
  return experimental_output.questions
}

// Generate a project brief + rubric.
export async function generateProject(params: {
  courseTitle: string
  topic: string
  description: string
}) {
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: projectSchema }),
    system:
      "You are a project-based learning designer. Create a practical project that applies the topic, with clear " +
      "requirements and an evaluation rubric.",
    prompt: `Course: ${params.courseTitle}\nTopic: ${params.topic}\nContext: ${params.description}\n\nWrite the project brief.`,
  })
  return experimental_output
}

// Grade a project submission.
export async function gradeSubmission(params: {
  projectTitle: string
  brief: string
  requirements: string[]
  submission: string
}) {
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: gradeSchema }),
    system:
      "You are a supportive but rigorous instructor grading a learner's project submission against the brief and " +
      "requirements. Give a 0-100 score and specific, constructive feedback. Highlight strengths and concrete next steps.",
    prompt:
      `Project: ${params.projectTitle}\nBrief: ${params.brief}\n` +
      `Requirements:\n${params.requirements.map((r) => `- ${r}`).join("\n")}\n\n` +
      `Learner submission:\n${params.submission}\n\nGrade it.`,
  })
  return experimental_output
}
