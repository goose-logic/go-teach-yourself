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
  generateTest,
  generateProject,
  gradeSubmission,
} from "@/lib/ai/generate"
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
  answers: { question: string; answer: string }[]
}) {
  const userId = await getUserId()

  const curriculum = await generateCurriculum({
    subject: input.subject,
    goal: input.goal,
    pace: input.pace,
    hoursPerWeek: input.hoursPerWeek,
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
      totalWeeks: curriculum.totalWeeks,
      startDate: new Date(),
      status: "active",
      summary: curriculum.summary,
      intake: input.answers,
    })
    .returning()

  // Persist modules, lessons, assessments, and build the timetable.
  const daysPerWeek = input.pace === "full_time" ? 5 : 3

  for (let m = 0; m < curriculum.modules.length; m++) {
    const mod = curriculum.modules[m]
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

    if (mod.assessment) {
      const [assessmentRow] = await db
        .insert(assessments)
        .values({
          courseId: course.id,
          moduleId: moduleRow.id,
          userId,
          type: mod.assessment.type,
          title: mod.assessment.title,
          description: mod.assessment.description,
          weekNumber: mod.weekNumber,
          status: "pending",
        })
        .returning()
      await pushSchedule(
        mod.assessment.title,
        mod.assessment.type,
        assessmentRow.id,
        mod.assessment.type === "test" ? 45 : 120,
      )
    }
  }

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
      intake: [{ question: "Sample course", answer: "Loaded from Curio demo library" }],
    })
    .returning()

  const daysPerWeek = demo.pace === "full_time" ? 5 : 3

  for (let m = 0; m < demo.modules.length; m++) {
    const mod = demo.modules[m]
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
        })
        .returning()
      await pushSchedule(les.title, "lesson", lessonRow.id, les.durationMinutes)
    }

    if (mod.assessment) {
      const a = mod.assessment
      const [assessmentRow] = await db
        .insert(assessments)
        .values({
          courseId: course.id,
          moduleId: moduleRow.id,
          userId,
          type: a.type,
          title: a.title,
          description: a.description,
          weekNumber: mod.weekNumber,
          status: "pending",
          // pre-filled questions / brief so the UI never needs to call AI
          questions: a.type === "test" ? a.questions : a.brief,
        })
        .returning()
      await pushSchedule(a.title, a.type, assessmentRow.id, a.type === "test" ? 45 : 120)
    }
  }

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

  return list.map((course) => {
    const courseLessons = allLessons.filter((l) => l.courseId === course.id)
    const total = courseLessons.length
    const done = courseLessons.filter((l) => l.completed).length
    return {
      ...course,
      totalLessons: total,
      completedLessons: done,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
    }
  })
}

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

// Lazily generate lesson content the first time it is opened.
export async function getLessonContent(lessonId: number) {
  const userId = await getUserId()
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)))
  if (!lesson) throw new Error("Lesson not found")
  if (lesson.content) return lesson.content

  const [course] = await db.select().from(courses).where(eq(courses.id, lesson.courseId))
  const [mod] = await db.select().from(modules).where(eq(modules.id, lesson.moduleId))

  const content = await generateLessonContent({
    courseTitle: course?.title ?? "Course",
    moduleTitle: mod?.title ?? "Module",
    lessonTitle: lesson.title,
    objective: lesson.objective ?? lesson.title,
  })

  await db.update(lessons).set({ content }).where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)))
  return content
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
    .set({ status: "graded", score })
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

export async function submitProject(assessmentId: number, submission: string) {
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
    .set({ status: "graded", submission, score: grade.score, feedback: grade.feedback })
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
  return grade
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
