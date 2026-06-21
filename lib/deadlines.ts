import type { Assessment, Course } from "@/lib/types"

// --- Accountability constants ----------------------------------------------
export const LATE_FEE_CENTS = 1000 // flat $10 fee per missed deadline
export const MAX_EXTENSIONS = 2 // extension passes per course
export const FREE_PAUSES = 1 // free course pauses before evidence is required
export const EXTENSION_DAYS = 7 // days a single extension pass adds
export const PAUSE_DAYS = 30 // length of a course pause

const DAY_MS = 24 * 60 * 60 * 1000

export function formatFee(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * The effective deadline for an assessment.
 * Uses the explicit `deadline` override when present, otherwise derives it from
 * the course start date + (weekNumber * 7 days). Any earned extension days are
 * always added on top.
 */
export function effectiveDeadline(
  assessment: Pick<Assessment, "deadline" | "extensionDays" | "weekNumber">,
  startDate: Date | string | null,
): Date | null {
  let base: Date | null = null

  if (assessment.deadline) {
    base = new Date(assessment.deadline)
  } else if (startDate) {
    base = new Date(new Date(startDate).getTime() + assessment.weekNumber * 7 * DAY_MS)
  }

  if (!base) return null

  if (assessment.extensionDays) {
    base = new Date(base.getTime() + assessment.extensionDays * DAY_MS)
  }
  return base
}

/**
 * An assessment is overdue when its effective deadline has passed, it has not
 * been submitted or graded, and the course is not currently paused.
 */
export function isOverdue(
  assessment: Pick<Assessment, "deadline" | "extensionDays" | "weekNumber" | "status">,
  startDate: Date | string | null,
  isPaused: boolean,
  now: Date = new Date(),
): boolean {
  if (isPaused) return false
  if (assessment.status === "submitted" || assessment.status === "graded") return false
  const due = effectiveDeadline(assessment, startDate)
  if (!due) return false
  return due.getTime() < now.getTime()
}

/**
 * An assessment has an outstanding late charge when it is overdue and the fee
 * has neither been paid nor waived (e.g. by an extension pass).
 */
export function hasOutstandingCharge(
  assessment: Pick<
    Assessment,
    "deadline" | "extensionDays" | "weekNumber" | "status" | "lateChargePaid" | "lateChargeWaived"
  >,
  startDate: Date | string | null,
  isPaused: boolean,
  now: Date = new Date(),
): boolean {
  if (assessment.lateChargePaid || assessment.lateChargeWaived) return false
  return isOverdue(assessment, startDate, isPaused, now)
}

export function extensionPassesRemaining(course: Pick<Course, "extensionPassesUsed">): number {
  return Math.max(0, MAX_EXTENSIONS - course.extensionPassesUsed)
}

export function freePauseAvailable(course: Pick<Course, "pausesUsed">): boolean {
  return course.pausesUsed < FREE_PAUSES
}
