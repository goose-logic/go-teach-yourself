"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { courses, assessments } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  EXTENSION_DAYS,
  FREE_PAUSES,
  MAX_EXTENSIONS,
  PAUSE_DAYS,
} from "@/lib/deadlines"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

function revalidate(courseId: number) {
  revalidatePath(`/course/${courseId}`)
  revalidatePath("/dashboard")
}

/** Pay the flat late fee for a missed-deadline assessment (mock payment). */
export async function payLateFee(assessmentId: number) {
  const userId = await getUserId()
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))
  if (!assessment) throw new Error("Assessment not found")

  await db
    .update(assessments)
    .set({ lateChargePaid: true })
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))

  revalidate(assessment.courseId)
  return { ok: true }
}

/**
 * Use one of the course's extension passes on a single deadline: pushes it back
 * by EXTENSION_DAYS and waives any pending late charge.
 */
export async function requestExtension(assessmentId: number) {
  const userId = await getUserId()
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))
  if (!assessment) throw new Error("Assessment not found")

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, assessment.courseId), eq(courses.userId, userId)))
  if (!course) throw new Error("Course not found")

  if (course.extensionPassesUsed >= MAX_EXTENSIONS) {
    return { ok: false, error: "No extension passes remaining" as const }
  }

  await db
    .update(assessments)
    .set({
      extensionDays: assessment.extensionDays + EXTENSION_DAYS,
      lateChargeWaived: true,
    })
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId)))

  await db
    .update(courses)
    .set({ extensionPassesUsed: course.extensionPassesUsed + 1 })
    .where(and(eq(courses.id, course.id), eq(courses.userId, userId)))

  revalidate(assessment.courseId)
  return { ok: true, passesRemaining: MAX_EXTENSIONS - (course.extensionPassesUsed + 1) }
}

/**
 * Pause an entire course, suspending all deadlines for PAUSE_DAYS. The first
 * pause is free; subsequent pauses require a supporting reason (already reviewed
 * on the client via the simulated AI review before this is called).
 */
export async function pauseCourse(courseId: number, reason?: string) {
  const userId = await getUserId()
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
  if (!course) throw new Error("Course not found")

  const needsEvidence = course.pausesUsed >= FREE_PAUSES
  if (needsEvidence && (!reason || reason.trim().length === 0)) {
    return { ok: false, error: "Supporting evidence required" as const }
  }

  const pausedUntil = new Date(Date.now() + PAUSE_DAYS * 24 * 60 * 60 * 1000)
  await db
    .update(courses)
    .set({
      isPaused: true,
      pausedUntil,
      pausesUsed: course.pausesUsed + 1,
      pauseReason: reason?.trim() || null,
    })
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))

  revalidate(courseId)
  return { ok: true }
}

/** Resume a paused course. Deadlines that were already passed shift forward by
 * the length of the pause so the learner isn't instantly penalised. */
export async function resumeCourse(courseId: number) {
  const userId = await getUserId()
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
  if (!course) throw new Error("Course not found")

  // Credit the elapsed pause time as extension days on every not-yet-finished
  // assessment so resuming doesn't immediately mark everything overdue.
  if (course.pausedUntil) {
    const elapsedDays = Math.max(
      0,
      Math.ceil((Date.now() - new Date(course.pausedUntil).getTime()) / (24 * 60 * 60 * 1000)) + PAUSE_DAYS,
    )
    if (elapsedDays > 0) {
      const courseAssessments = await db
        .select()
        .from(assessments)
        .where(and(eq(assessments.courseId, courseId), eq(assessments.userId, userId)))
      for (const a of courseAssessments) {
        if (a.status === "pending") {
          await db
            .update(assessments)
            .set({ extensionDays: a.extensionDays + elapsedDays })
            .where(eq(assessments.id, a.id))
        }
      }
    }
  }

  await db
    .update(courses)
    .set({ isPaused: false, pausedUntil: null })
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))

  revalidate(courseId)
  return { ok: true }
}
