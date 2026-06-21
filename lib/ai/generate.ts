import "server-only"
import { generateText, Output } from "ai"
import {
  MODEL,
  questionsSchema,
  curriculumSchema,
  lessonContentSchema,
  formativeSchema,
  openGradeSchema,
  testSchema,
  projectSchema,
  gradeSchema,
  interactiveElementsSchema,
  type InteractiveElementConfig,
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
  totalWeeks: number
  answers: IntakeAnswer[]
}) {
  const { subject, goal, pace, hoursPerWeek, totalWeeks, answers } = params
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: curriculumSchema }),
    system:
      "You are an expert curriculum designer. Build a complete, well-sequenced course broken into weekly modules. " +
      `The course MUST be exactly ${totalWeeks} week(s) long: produce exactly ${totalWeeks} modules, one per week, ` +
      "numbered 1.. sequentially. Each module has 2-6 lessons with clear objectives and realistic durations. " +
      "EVERY week must end with a summative assessment of type 'test' that covers that week's lessons (set assessment.type to 'test'). " +
      "Do NOT use type 'project' for the weekly assessments — a separate final capstone project is added at the end of the course. " +
      "Scale the weekly workload to the learner's available hours.",
    prompt:
      `Subject: ${subject}\n` +
      `Goal: ${goal || "general proficiency"}\n` +
      `Total length: exactly ${totalWeeks} weeks\n` +
      `Study pace: ${pace === "full_time" ? "Full time" : "Part time"}\n` +
      `Hours available per week: ${hoursPerWeek}\n` +
      `Intake answers:\n${intakeToText(answers)}\n\n` +
      `Design the curriculum so that the sum of lesson + assessment time each week is close to the hours available. ` +
      `Remember: exactly ${totalWeeks} weekly modules, each with a summative 'test'.`,
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

// Generate a per-lesson formative check: 2-3 MCQs + 1-2 open questions.
export async function generateFormative(params: {
  courseTitle: string
  lessonTitle: string
  objective: string
  content: string
}) {
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: formativeSchema }),
    system:
      "You are an assessment designer creating a short FORMATIVE check for a single lesson. " +
      "Produce 2-3 multiple-choice questions (kind 'mcq', each with 3-4 options, one correct answerIndex, and a short explanation) " +
      "and 1-2 open-answer questions (kind 'open', with a concise sampleAnswer and explanation, and null options/answerIndex). " +
      "Base every question strictly on the lesson content provided.",
    prompt:
      `Course: ${params.courseTitle}\nLesson: ${params.lessonTitle}\nObjective: ${params.objective}\n\n` +
      `Lesson content:\n${params.content}\n\nWrite the formative check.`,
  })
  return experimental_output.questions
}

// Generate 2-4 interactive in-lesson elements (quiz, drag-drop, scenario, listening).
export async function generateInteractiveElements(params: {
  courseTitle: string
  lessonTitle: string
  objective: string
  content: string
}): Promise<InteractiveElementConfig[]> {
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: interactiveElementsSchema }),
    system:
      "You design GENUINELY INTERACTIVE in-lesson activities so a lesson never feels like passive reading. " +
      "Produce 2-4 elements of DIFFERENT types drawn from: 'quiz' (quick check questions), " +
      "'dragdrop' (put items in the correct order), 'scenario' (a 'what would you do' decision with branching feedback), " +
      "and 'audio' (a short listening passage read aloud, followed by comprehension questions). " +
      "ALWAYS include at least one 'audio' listening element. " +
      "For each element, fill ONLY the block matching its type and leave the others null. " +
      "Base everything strictly on the lesson content. Keep text concise and unambiguous, with exactly one correct option per question.",
    prompt:
      `Course: ${params.courseTitle}\nLesson: ${params.lessonTitle}\nObjective: ${params.objective}\n\n` +
      `Lesson content:\n${params.content}\n\nDesign the interactive elements.`,
  })

  const out: InteractiveElementConfig[] = []
  experimental_output.elements.forEach((el, i) => {
    const base = { id: `el-${i}`, title: el.title, description: el.description ?? undefined }

    if (el.type === "quiz" && el.quiz) {
      out.push({
        ...base,
        type: "quiz",
        config: {
          id: `quiz-${i}`,
          title: el.title,
          description: el.description ?? undefined,
          questions: el.quiz.questions.map((q, qi) => ({
            id: `q-${i}-${qi}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          })),
        },
      })
    } else if (el.type === "dragdrop" && el.dragdrop) {
      // Items are given in correct order; assign ids, record correct order, then shuffle for display.
      const ordered = el.dragdrop.orderedItems.map((text, ii) => ({ id: `it-${i}-${ii}`, text }))
      const correctOrder = ordered.map((it) => it.id)
      const shuffled = shuffle(ordered)
      out.push({
        ...base,
        type: "dragdrop",
        config: {
          id: `dd-${i}`,
          title: el.title,
          description: el.description ?? undefined,
          mode: "ordering",
          instruction: el.dragdrop.instruction,
          items: shuffled,
          correctOrder,
        },
      })
    } else if (el.type === "scenario" && el.scenario) {
      out.push({
        ...base,
        type: "scenario",
        config: {
          id: `sc-${i}`,
          title: el.title,
          description: el.description ?? undefined,
          startNodeId: "start",
          nodes: [
            {
              id: "start",
              type: "scene",
              title: el.title,
              description: el.scenario.situation,
              choices: el.scenario.choices.map((c, ci) => ({
                id: `ch-${i}-${ci}`,
                text: c.text,
                isCorrect: c.isCorrect,
                feedback: c.feedback,
              })),
            },
          ],
        },
      })
    } else if (el.type === "audio" && el.audio) {
      out.push({
        ...base,
        type: "audio",
        config: {
          id: `au-${i}`,
          audioUrl: "", // no file; the component reads the transcript aloud via text-to-speech
          title: el.title,
          description: el.description ?? undefined,
          transcript: el.audio.transcript,
          questions: el.audio.questions.map((q, qi) => ({
            id: `aq-${i}-${qi}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          })),
        },
      })
    }
  })

  return out
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  // Guard against returning the identical order for short lists.
  return a
}

// Grade a single open formative answer against the model answer.
export async function gradeOpenAnswer(params: {
  question: string
  sampleAnswer: string
  learnerAnswer: string
}) {
  const { experimental_output } = await generateText({
    model: MODEL,
    experimental_output: Output.object({ schema: openGradeSchema }),
    system:
      "You assess a learner's short open answer against a model answer. Be encouraging but honest. " +
      "Mark correct if it shows reasonable understanding, even if worded differently.",
    prompt:
      `Question: ${params.question}\nModel answer: ${params.sampleAnswer}\n` +
      `Learner answer: ${params.learnerAnswer}\n\nAssess it.`,
  })
  return experimental_output
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
