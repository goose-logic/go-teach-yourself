"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { courses, modules, lessons, assessments, scheduleItems } from "@/lib/db/schema"
import { and, asc, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  generateQuestions,
  generateCurriculum,
  generateLessonContent,
  generateFormative,
  gradeOpenAnswer,
  generateTest,
  generateProject,
  gradeSubmission,
} from "@/lib/ai/generate"
import type { FormativeQuestion } from "@/lib/types"
import { isOverdue } from "@/lib/deadlines"
import { getDemoCourse } from "@/lib/demo-data"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

// Step 1: AI asks clarifying questions.
export async function fetchQuestions(subject: string, goal: string) {
  await getUserId()
  if (!subject.trim()) throw new Error("Please tell us what you want to learn.")
  const result = await generateQuestions(subject, goal)
  return result.questions
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// Step 2: generate the full course (curriculum, lessons, assessments, timetable) and persist it.
export async function createCourse(input: {
  subject: string
  goal: string
  pace: "full_time" | "part_time"
  hoursPerWeek: number
  totalWeeks: number
  answers: { question: string; answer: string }[]
}) {
  const userId = await getUserId()

  const curriculum = await generateCurriculum({
    subject: input.subject,
    goal: input.goal,
    pace: input.pace,
    hoursPerWeek: input.hoursPerWeek,
    totalWeeks: input.totalWeeks,
    answers: input.answers,
  })

  const [course] = await db
    .insert(courses)
    .values({
      userId,
      title: curriculum.title,
      subject: input.subject,
      goal: input.goal,
      level: curriculum.level,
      pace: input.pace,
      hoursPerWeek: input.hoursPerWeek,
      totalWeeks: input.totalWeeks,
      startDate: new Date(),
      status: "active",
      summary: curriculum.summary,
      intake: input.answers,
    })
    .returning()

  // Persist modules, lessons, assessments, and build the timetable.
  const daysPerWeek = input.pace === "full_time" ? 5 : 3

  // Grade weights: the capstone is 35% and the per-module summative tests share
  // the remaining 65%, distributed so every assessment adds up to exactly 100%.
  const CAPSTONE_WEIGHT = 35
  const numSummative = curriculum.modules.length
  const baseSummativeWeight = numSummative > 0 ? Math.floor((100 - CAPSTONE_WEIGHT) / numSummative) : 0
  const summativeRemainder = numSummative > 0 ? 100 - CAPSTONE_WEIGHT - baseSummativeWeight * numSummative : 0

  for (let m = 0; m < curriculum.modules.length; m++) {
    const mod = curriculum.modules[m]
    // Spread the leftover points across the first few modules so the total is exact.
    const summativeWeight = baseSummativeWeight + (m < summativeRemainder ? 1 : 0)
    const [moduleRow] = await db
      .insert(modules)
      .values({
        courseId: course.id,
        userId,
        orderIndex: m,
        weekNumber: mod.weekNumber,
        title: mod.title,
        summary: mod.summary,
      })
      .returning()

    let dayCursor = 0
    const pushSchedule = (
      title: string,
      itemType: "lesson" | "test" | "project" | "review",
      refId: number | null,
      durationMinutes: number,
    ) => {
      const dayLabel = DAYS[dayCursor % daysPerWeek]
      dayCursor++
      return db.insert(scheduleItems).values({
        courseId: course.id,
        userId,
        weekNumber: mod.weekNumber,
        dayLabel,
        orderIndex: dayCursor,
        title,
        itemType,
        refId,
        durationMinutes,
      })
    }

    for (let l = 0; l < mod.lessons.length; l++) {
      const les = mod.lessons[l]
      const [lessonRow] = await db
        .insert(lessons)
        .values({
          moduleId: moduleRow.id,
          courseId: course.id,
          userId,
          orderIndex: l,
          title: les.title,
          objective: les.objective,
          durationMinutes: les.durationMinutes,
          content: null,
        })
        .returning()
      await pushSchedule(les.title, "lesson", lessonRow.id, les.durationMinutes)
    }

    // Every week ends with a summative test covering that week's lessons.
    const summativeTitle = mod.assessment?.title ?? `Week ${mod.weekNumber} summative test`
    const summativeDesc =
      mod.assessment?.description ??
      `A summative test covering the lessons from week ${mod.weekNumber}: ${mod.title}.`
    
    const [assessmentRow] = await db
      .insert(assessments)
      .values({
        courseId: course.id,
        moduleId: moduleRow.id,
        userId,
        type: "test",
        category: "summative",
        title: summativeTitle,
        description: summativeDesc,
        weekNumber: mod.weekNumber,
        gradeWeight: summativeWeight, // summative tests share the 65% left after the capstone
        status: "pending",
      })
      .returning()
    await pushSchedule(summativeTitle, "test", assessmentRow.id, 45)
  }

  // One large capstone project at the end that puts everything into practice.
  const finalWeek = curriculum.modules.length
    ? Math.max(...curriculum.modules.map((m) => m.weekNumber))
    : input.totalWeeks
  const [finalProject] = await db
    .insert(assessments)
    .values({
      courseId: course.id,
      moduleId: null,
      userId,
      type: "project",
      category: "final",
      title: `Final project: ${curriculum.title}`,
      description:
        `A comprehensive capstone project that brings together everything from the whole course ` +
        `("${input.subject}"). It should require the learner to apply the skills and knowledge built across all ${finalWeek} weeks.`,
      weekNumber: finalWeek,
      gradeWeight: CAPSTONE_WEIGHT, // 35% for the capstone project
      status: "pending",
    })
    .returning()
  await db.insert(scheduleItems).values({
    courseId: course.id,
    userId,
    weekNumber: finalWeek,
    dayLabel: DAYS[0],
    orderIndex: 99,
    title: finalProject.title,
    itemType: "project",
    refId: finalProject.id,
    durationMinutes: 240,
  })

  revalidatePath("/dashboard")
  return course.id
}

// Seed a fully pre-authored demo course (no AI calls needed) so the whole
// experience — curriculum, lessons, timetable, tests and projects — is clickable.
export async function seedDemoCourse(key: string) {
  const userId = await getUserId()
  const demo = getDemoCourse(key)
  if (!demo) throw new Error("Unknown demo course")

  // Avoid duplicating a demo the user already loaded.
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.userId, userId), eq(courses.subject, demo.subject)))
  if (existing.length > 0) return existing[0].id

  const [course] = await db
    .insert(courses)
    .values({
      userId,
      title: demo.title,
      subject: demo.subject,
      goal: demo.goal,
      level: demo.level,
      pace: demo.pace,
      hoursPerWeek: demo.hoursPerWeek,
      totalWeeks: demo.totalWeeks,
      startDate: new Date(),
      status: "active",
      summary: demo.summary,
      intake: [{ question: "Sample course", answer: "Loaded from Go Teach Yourself demo library" }],
    })
    .returning()

  const daysPerWeek = demo.pace === "full_time" ? 5 : 3

  // Grade weights: the capstone is 35% and the per-module summative tests share
  // the remaining 65%, distributed so every assessment adds up to exactly 100%.
  const CAPSTONE_WEIGHT = 35
  const numSummative = demo.modules.length
  const baseSummativeWeight = numSummative > 0 ? Math.floor((100 - CAPSTONE_WEIGHT) / numSummative) : 0
  const summativeRemainder = numSummative > 0 ? 100 - CAPSTONE_WEIGHT - baseSummativeWeight * numSummative : 0

  for (let m = 0; m < demo.modules.length; m++) {
    const mod = demo.modules[m]
    // Spread the leftover points across the first few modules so the total is exact.
    const summativeWeight = baseSummativeWeight + (m < summativeRemainder ? 1 : 0)
    const [moduleRow] = await db
      .insert(modules)
      .values({
        courseId: course.id,
        userId,
        orderIndex: m,
        weekNumber: mod.weekNumber,
        title: mod.title,
        summary: mod.summary,
      })
      .returning()

    let dayCursor = 0
    const pushSchedule = (
      title: string,
      itemType: "lesson" | "test" | "project" | "review",
      refId: number | null,
      durationMinutes: number,
    ) => {
      const dayLabel = DAYS[dayCursor % daysPerWeek]
      dayCursor++
      return db.insert(scheduleItems).values({
        courseId: course.id,
        userId,
        weekNumber: mod.weekNumber,
        dayLabel,
        orderIndex: dayCursor,
        title,
        itemType,
        refId,
        durationMinutes,
      })
    }

    for (let l = 0; l < mod.lessons.length; l++) {
      const les = mod.lessons[l]
      const [lessonRow] = await db
        .insert(lessons)
        .values({
          moduleId: moduleRow.id,
          courseId: course.id,
          userId,
          orderIndex: l,
          title: les.title,
          objective: les.objective,
          durationMinutes: les.durationMinutes,
          content: les.content, // pre-filled, so no AI call on open
          // Pre-filled formative so "complete the lesson" works without AI.
          formativeQuestions: [
            {
              kind: "mcq",
              question: `What is the main focus of "${les.title}"?`,
              options: [
                les.objective ?? "The core concept of this lesson",
                "An unrelated topic",
                "A topic from a different course",
                "None of the above",
              ],
              answerIndex: 0,
              sampleAnswer: null,
              explanation: `This lesson focuses on: ${les.objective ?? les.title}.`,
            },
            {
              kind: "open",
              question: `In your own words, summarise one key takeaway from "${les.title}".`,
              options: null,
              answerIndex: null,
              sampleAnswer: les.objective ?? "A clear summary of the lesson's main point.",
              explanation: "A good answer restates the lesson's core idea in your own words.",
            },
          ],
        })
        .returning()
      await pushSchedule(les.title, "lesson", lessonRow.id, les.durationMinutes)
    }

    // Every week gets a summative test (uses pre-authored questions when present).
    const a = mod.assessment
    const sumTitle = a?.type === "test" ? a.title : `Week ${mod.weekNumber} summative test`
    const sumDesc =
      a?.type === "test"
        ? a.description
        : `A summative test covering week ${mod.weekNumber}: ${mod.title}.`
    
    const [assessmentRow] = await db
      .insert(assessments)
      .values({
        courseId: course.id,
        moduleId: moduleRow.id,
        userId,
        type: "test",
        category: "summative",
        title: sumTitle,
        description: sumDesc,
        weekNumber: mod.weekNumber,
        gradeWeight: summativeWeight, // summative tests share the 65% left after the capstone
        status: "pending",
        questions: a?.type === "test" ? a.questions : null,
      })
      .returning()
    await pushSchedule(sumTitle, "test", assessmentRow.id, 45)
  }

  // Final capstone project that puts everything into practice.
  const finalWeek = Math.max(...demo.modules.map((m) => m.weekNumber))
  const demoFinal = demo.modules.flatMap((m) => (m.assessment?.type === "project" ? [m.assessment] : []))[0]
  const [finalProject] = await db
    .insert(assessments)
    .values({
      courseId: course.id,
      moduleId: null,
      userId,
      type: "project",
      category: "final",
      title: demoFinal?.title ?? `Final project: ${demo.title}`,
      description:
        demoFinal?.description ??
        `A comprehensive capstone project applying everything from ${demo.title}.`,
      weekNumber: finalWeek,
      gradeWeight: CAPSTONE_WEIGHT, // 35% for the capstone project
      status: "pending",
      questions: demoFinal?.type === "project" ? demoFinal.brief : null,
    })
    .returning()
  await db.insert(scheduleItems).values({
    courseId: course.id,
    userId,
    weekNumber: finalWeek,
    dayLabel: DAYS[0],
    orderIndex: 99,
    title: finalProject.title,
    itemType: "project",
    refId: finalProject.id,
    durationMinutes: 240,
  })

  revalidatePath("/dashboard")
  return course.id
}

export async function getCourses() {
  const userId = await getUserId()
  return db.select().from(courses).where(eq(courses.userId, userId)).orderBy(desc(courses.createdAt))
}

export async function getCoursesWithProgress() {
  const userId = await getUserId()
  const list = await db
    .select()
    .from(courses)
    .where(eq(courses.userId, userId))
    .orderBy(desc(courses.createdAt))

  const allLessons = await db
    .select({ courseId: lessons.courseId, completed: lessons.completed })
    .from(lessons)
    .where(eq(lessons.userId, userId))

  const allAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, userId))

  return list.map((course) => {
    const courseLessons = allLessons.filter((l) => l.courseId === course.id)
    const total = courseLessons.length
    const done = courseLessons.filter((l) => l.completed).length
    const hasOverdue = allAssessments
      .filter((a) => a.courseId === course.id)
      .some((a) => isOverdue(a, course.startDate, course.isPaused))
    return {
      ...course,
      totalLessons: total,
      completedLessons: done,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      hasOverdue,
    }
  })
}

export type CourseWithProgress = Awaited<ReturnType<typeof getCoursesWithProgress>>[number]

export async function getCourseDetail(courseId: number) {
  const userId = await getUserId()
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
  if (!course) return null

  const courseModules = await db
    .select()
    .from(modules)
    .where(and(eq(modules.courseId, courseId), eq(modules.userId, userId)))
    .orderBy(asc(modules.orderIndex))

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.courseId, courseId), eq(lessons.userId, userId)))
    .orderBy(asc(lessons.orderIndex))

  const courseAssessments = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.courseId, courseId), eq(assessments.userId, userId)))
    .orderBy(asc(assessments.weekNumber))

  const schedule = await db
    .select()
    .from(scheduleItems)
    .where(and(eq(scheduleItems.courseId, courseId), eq(scheduleItems.userId, userId)))
    .orderBy(asc(scheduleItems.weekNumber), asc(scheduleItems.orderIndex))

  return { course, modules: courseModules, lessons: courseLessons, assessments: courseAssessments, schedule }
}

// Lazily generate lesson content + formative check the first time it is opened.
export async function getLessonStudy(lessonId: number) {
  const userId = await getUserId()
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)))
  if (!lesson) throw new Error("Lesson not found")

  let content = lesson.content
  let formative = lesson.formativeQuestions as FormativeQuestion[] | null

  if (!content) {
    const [course] = await db.select().from(courses).where(eq(courses.id, lesson.courseId))
    const [mod] = await db.select().from(modules).where(eq(modules.id, lesson.moduleId))
    content = await generateLessonContent({
      courseTitle: course?.title ?? "Course",
      moduleTitle: mod?.title ?? "Module",
      lessonTitle: lesson.title,
      objective: lesson.objective ?? lesson.title,
    })
    await db.update(lessons).set({ content }).where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)))
  }

  if (!formative) {
    const [course] = await db.select().from(courses).where(eq(courses.id, lesson.courseId))
    try {
      formative = (await generateFormative({
        courseTitle: course?.title ?? "Course",
        lessonTitle: lesson.title,
        objective: lesson.objective ?? lesson.title,
        content: content ?? "",
      })) as FormativeQuestion[]
    } catch {
      // Fallback so the lesson is always completable even without AI.
      formative = [
        {
          kind: "open",
          question: `In a few sentences, summarise the key idea of "${lesson.title}".`,
          options: null,
          answerIndex: null,
          sampleAnswer: lesson.objective ?? "A clear summary of the lesson's main point.",
          explanation: "A good answer captures the lesson's core objective in your own words.",
        },
      ]
    }
    await db
      .update(lessons)
      .set({ formativeQuestions: formative })
      .where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)))
  }

  return {
    id: lesson.id,
    title: lesson.title,
    objective: lesson.objective,
    content: content ?? "",
    formativeQuestions: formative,
    completed: lesson.completed,
    formativeCompleted: lesson.formativeCompleted,
    formativeScore: lesson.formativeScore,
    formativeFeedback: lesson.formativeFeedback,
    imageUrl: lesson.imageUrl,
    imageCaption: lesson.imageCaption,
    interactiveElements: lesson.interactiveElements,
  }
}

// Grade a submitted formative check and mark the lesson complete.
export async function submitFormative(
  lessonId: number,
  responses: { mcqAnswers: Record<number, number>; openAnswers: Record<number, string> },
) {
  const userId = await getUserId()
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)))
  if (!lesson) throw new Error("Lesson not found")

  const questions = (lesson.formativeQuestions as FormativeQuestion[]) ?? []
  let correct = 0
  let total = 0
  const notes: string[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    total++
    if (q.kind === "mcq") {
      const picked = responses.mcqAnswers[i]
      const isRight = picked === q.answerIndex
      if (isRight) correct++
      notes.push(
        `**Q${i + 1} (multiple choice):** ${isRight ? "Correct." : "Not quite."} ${q.explanation}`,
      )
    } else {
      const answer = responses.openAnswers[i]?.trim() || ""
      if (!answer) {
        notes.push(`**Q${i + 1} (written):** No answer provided. ${q.explanation}`)
        continue
      }
      try {
        const result = await gradeOpenAnswer({
          question: q.question,
          sampleAnswer: q.sampleAnswer ?? "",
          learnerAnswer: answer,
        })
        if (result.correct) correct++
        notes.push(`**Q${i + 1} (written):** ${result.feedback}`)
      } catch {
        // Fallback: accept a reasonable-length answer.
        if (answer.length > 20) correct++
        notes.push(`**Q${i + 1} (written):** Answer recorded. ${q.explanation}`)
      }
    }
  }

  const score = total > 0 ? Math.round((correct / total) * 100) : 100
  const feedback = `You scored **${score}%** (${correct}/${total}).\n\n${notes.join("\n\n")}`

  await db
    .update(lessons)
    .set({
      formativeCompleted: true,
      formativeScore: score,
      formativeFeedback: feedback,
      completed: true,
    })
    .where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)))
  // keep the matching schedule item in sync
  await db
    .update(scheduleItems)
    .set({ completed: true })
    .where(
      and(
        eq(scheduleItems.userId, userId),
        eq(scheduleItems.itemType, "lesson"),
        eq(scheduleItems.refId, lessonId),
      ),
    )
  revalidatePath("/dashboard")
  return { score, feedback }
}

export async function toggleLessonComplete(lessonId: number, completed: boolean) {
  const userId = await getUserId()
  await db
    .update(lessons)
    .set({ completed })
    .where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)))
  // keep the matching schedule item in sync
  await db
    .update(scheduleItems)
    .set({ completed })
    .where(
      and(
        eq(scheduleItems.userId, userId),
        eq(scheduleItems.itemType, "lesson"),
        eq(scheduleItems.refId, lessonId),
      ),
    )
  revalidatePath("/dashboard")
}

// Lazily generate test questions / project brief the first time an assessment is opened.
export async function getAssessmentContent(assessmentId: number) {
  const userId = await getUserId()
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))
  if (!assessment) throw new Error("Assessment not found")
  if (assessment.questions) return assessment

  const [course] = await db.select().from(courses).where(eq(courses.id, assessment.courseId))

  if (assessment.type === "test") {
    const questions = await generateTest({
      courseTitle: course?.title ?? "Course",
      topic: assessment.title,
      description: assessment.description ?? "",
    })
    const [updated] = await db
      .update(assessments)
      .set({ questions })
      .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))
      .returning()
    return updated
  } else {
    const project = await generateProject({
      courseTitle: course?.title ?? "Course",
      topic: assessment.title,
      description: assessment.description ?? "",
    })
    const [updated] = await db
      .update(assessments)
      .set({ questions: project })
      .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))
      .returning()
    return updated
  }
}

export async function submitTest(assessmentId: number, score: number) {
  const userId = await getUserId()
  await db
    .update(assessments)
    .set({ status: "graded", score, submittedAt: new Date() })
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))
  await db
    .update(scheduleItems)
    .set({ completed: true })
    .where(
      and(
        eq(scheduleItems.userId, userId),
        eq(scheduleItems.itemType, "test"),
        eq(scheduleItems.refId, assessmentId),
      ),
    )
  revalidatePath("/dashboard")
}

export async function submitProject(assessmentId: number, submission: string, fileName?: string) {
  const userId = await getUserId()
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))
  if (!assessment) throw new Error("Assessment not found")

  const brief = (assessment.questions as { brief?: string; requirements?: string[] }) ?? {}
  let grade: { score: number; feedback: string }
  try {
    grade = await gradeSubmission({
      projectTitle: assessment.title,
      brief: brief.brief ?? assessment.description ?? "",
      requirements: brief.requirements ?? [],
      submission,
    })
  } catch {
    // Graceful fallback (e.g. when the AI Gateway is unavailable in demo mode)
    // so the experience stays fully clickable.
    const wordCount = submission.trim().split(/\s+/).filter(Boolean).length
    const score = Math.max(60, Math.min(95, 60 + Math.round(wordCount / 8)))
    grade = {
      score,
      feedback:
        "**Submission received.** Automated AI review is unavailable in demo mode, so this is a sample grade.\n\nYour response addresses the brief and shows you engaged with the requirements. To get detailed, personalized feedback, add an AI Gateway credit card and resubmit.",
    }
  }

  await db
    .update(assessments)
    .set({
      status: "graded",
      submission,
      fileName: fileName ?? null,
      score: grade.score,
      feedback: grade.feedback,
      submittedAt: new Date(),
    })
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))
  await db
    .update(scheduleItems)
    .set({ completed: true })
    .where(
      and(
        eq(scheduleItems.userId, userId),
        eq(scheduleItems.itemType, "project"),
        eq(scheduleItems.refId, assessmentId),
      ),
    )
  revalidatePath("/dashboard")
  revalidatePath("/submissions")
  return grade
}

// Extract text from an uploaded Word document (.docx) for use as a submission.
export async function extractDocxText(formData: FormData) {
  await getUserId()
  const file = formData.get("file")
  if (!(file instanceof File)) throw new Error("No file provided")
  const name = file.name || "document.docx"
  if (!name.toLowerCase().endsWith(".docx")) {
    throw new Error("Please upload a Word (.docx) file.")
  }
  const mammoth = (await import("mammoth")).default
  const buffer = Buffer.from(await file.arrayBuffer())
  const { value } = await mammoth.extractRawText({ buffer })
  return { fileName: name, text: value.trim() }
}

// All submissions the learner has made, across every course.
export async function getAllSubmissions() {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.userId, userId), eq(assessments.status, "graded")))
    .orderBy(desc(assessments.submittedAt))

  const userCourses = await db.select().from(courses).where(eq(courses.userId, userId))
  const titleById = new Map(userCourses.map((c) => [c.id, c.title]))

  return rows.map((a) => ({
    ...a,
    courseTitle: titleById.get(a.courseId) ?? "Course",
  }))
}

export async function deleteCourse(courseId: number) {
  const userId = await getUserId()
  await db.delete(scheduleItems).where(and(eq(scheduleItems.courseId, courseId), eq(scheduleItems.userId, userId)))
  await db.delete(lessons).where(and(eq(lessons.courseId, courseId), eq(lessons.userId, userId)))
  await db.delete(assessments).where(and(eq(assessments.courseId, courseId), eq(assessments.userId, userId)))
  await db.delete(modules).where(and(eq(modules.courseId, courseId), eq(modules.userId, userId)))
  await db.delete(courses).where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
  revalidatePath("/dashboard")
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
}
