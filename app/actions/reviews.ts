"use server"

import { db } from "@/lib/db"
import { assessments, bookings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error("Not authenticated")
  return session.user.id
}

/**
 * Select AI review for an assessment (free, simulated feedback).
 */
export async function selectAIReview(assessmentId: number) {
  const userId = await getUserId()

  const assessment = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .then((r) => r[0])

  if (!assessment || assessment.userId !== userId) {
    throw new Error("Assessment not found")
  }

  // Simulate AI feedback based on score
  let aiFeedback = ""
  if (assessment.score && assessment.score >= 85) {
    aiFeedback = "Excellent work! Your answers demonstrate a strong understanding of the material. Well done on this assessment."
  } else if (assessment.score && assessment.score >= 70) {
    aiFeedback = "Good effort. You've shown solid comprehension of key concepts. Review the areas where you lost points to strengthen your knowledge."
  } else {
    aiFeedback = "There's room for improvement. I recommend reviewing the core concepts covered in this module and attempting similar practice questions before retaking."
  }

  await db
    .update(assessments)
    .set({
      reviewType: "ai",
      feedback: aiFeedback,
    })
    .where(eq(assessments.id, assessmentId))

  revalidatePath("/course/[id]", "page")
}

/**
 * Select tutor marking for an assessment (paid option).
 */
export async function selectTutorMarking(
  assessmentId: number,
  tutorId: string,
  tier: "standard" | "premium" | "expert",
) {
  const userId = await getUserId()

  const assessment = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .then((r) => r[0])

  if (!assessment || assessment.userId !== userId) {
    throw new Error("Assessment not found")
  }

  // Pricing tiers for tutor marking (in cents)
  const tierPrices: Record<string, number> = {
    standard: 1500, // $15
    premium: 2500, // $25
    expert: 4000, // $40
  }

  const feeCents = tierPrices[tier] || tierPrices.standard

  await db
    .update(assessments)
    .set({
      reviewType: "tutor_marking",
      tutorId,
      tutorMarkingTier: tier,
      tutorMarkingFeeCents: feeCents,
    })
    .where(eq(assessments.id, assessmentId))

  revalidatePath("/course/[id]", "page")
}

/**
 * Select tutor marking + tutorial session for an assessment (combined paid option).
 */
export async function selectTutorPlusSession(
  assessmentId: number,
  tutorId: string,
  tier: "standard" | "premium" | "expert",
  bookingId: number,
) {
  const userId = await getUserId()

  const assessment = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .then((r) => r[0])

  if (!assessment || assessment.userId !== userId) {
    throw new Error("Assessment not found")
  }

  // Verify the booking exists and belongs to this user
  const booking = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .then((r) => r[0])

  if (!booking || booking.userId !== userId) {
    throw new Error("Booking not found")
  }

  // Pricing tiers for tutor marking (in cents)
  const tierPrices: Record<string, number> = {
    standard: 1500, // $15
    premium: 2500, // $25
    expert: 4000, // $40
  }

  const feeCents = tierPrices[tier] || tierPrices.standard

  await db
    .update(assessments)
    .set({
      reviewType: "tutor_plus_session",
      tutorId,
      tutorMarkingTier: tier,
      tutorMarkingFeeCents: feeCents,
      tutorSessionId: bookingId,
    })
    .where(eq(assessments.id, assessmentId))

  revalidatePath("/course/[id]", "page")
}

/**
 * Submit tutor feedback (admin action or simulated by system).
 */
export async function submitTutorFeedback(assessmentId: number, feedback: string, score?: number) {
  const userId = await getUserId()

  const assessment = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .then((r) => r[0])

  if (!assessment || assessment.userId !== userId) {
    throw new Error("Assessment not found")
  }

  if (assessment.reviewType !== "tutor_marking" && assessment.reviewType !== "tutor_plus_session") {
    throw new Error("This assessment does not have tutor marking selected")
  }

  await db
    .update(assessments)
    .set({
      tutorMarkingFeedback: feedback,
      feedback: feedback,
      score: score ?? assessment.score,
      status: "graded",
    })
    .where(eq(assessments.id, assessmentId))

  revalidatePath("/course/[id]", "page")
}
