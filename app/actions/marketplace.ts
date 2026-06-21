"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { bookings, reviews } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  getSpecialists,
  getSpecialist,
  feeBreakdown,
  type SeedReview,
} from "@/lib/specialists"
import { getPlatformSettings } from "@/lib/settings"

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user
}

export type ReviewItem = {
  id: string
  reviewerName: string
  rating: number
  comment: string
  date: Date
  source: "learner" | "seed"
}

function seedToDate(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d
}

// Directory: all specialists with their combined (seed + learner) rating.
export async function getSpecialistsWithRatings() {
  const list = getSpecialists()
  const dbReviews = await db.select().from(reviews)

  return list.map((s) => {
    const own = dbReviews.filter((r) => r.specialistId === s.id)
    const dbSum = own.reduce((acc, r) => acc + r.rating, 0)
    const totalCount = s.seedReviewCount + own.length
    const combined =
      totalCount > 0
        ? (s.seedRating * s.seedReviewCount + dbSum) / totalCount
        : s.seedRating
    return {
      id: s.id,
      name: s.name,
      title: s.title,
      expertise: s.expertise,
      location: s.location,
      bio: s.bio,
      priceCents: s.priceCents,
      avatar: s.avatar,
      verified: s.verified,
      rating: Math.round(combined * 10) / 10,
      reviewCount: totalCount,
      sessions: s.sessions,
    }
  })
}

// Full profile detail, including merged reviews (newest learner reviews first).
export async function getSpecialistDetail(id: string) {
  const s = getSpecialist(id)
  if (!s) return null

  const own = await db
    .select()
    .from(reviews)
    .where(eq(reviews.specialistId, id))
    .orderBy(desc(reviews.createdAt))

  const learnerReviews: ReviewItem[] = own.map((r) => ({
    id: `db-${r.id}`,
    reviewerName: r.reviewerName,
    rating: r.rating,
    comment: r.comment ?? "",
    date: r.createdAt,
    source: "learner",
  }))

  const seedReviews: ReviewItem[] = s.seedReviews.map((r: SeedReview, i) => ({
    id: `seed-${i}`,
    reviewerName: r.reviewerName,
    rating: r.rating,
    comment: r.comment,
    date: seedToDate(r.daysAgo),
    source: "seed",
  }))

  const allReviews = [...learnerReviews, ...seedReviews]
  const dbSum = own.reduce((acc, r) => acc + r.rating, 0)
  const totalCount = s.seedReviewCount + own.length
  const combined =
    totalCount > 0 ? (s.seedRating * s.seedReviewCount + dbSum) / totalCount : s.seedRating

  const { commissionPercent } = await getPlatformSettings()
  const fees = feeBreakdown(s.priceCents, commissionPercent)

  return {
    specialist: s,
    rating: Math.round(combined * 10) / 10,
    reviewCount: totalCount,
    reviews: allReviews,
    fees,
  }
}

// Create a booking after a (mock) successful payment.
export async function createBooking(input: {
  specialistId: string
  sessionDate: string // ISO
  slotLabel: string
  cardLast4: string
}) {
  const user = await getSession()
  const s = getSpecialist(input.specialistId)
  if (!s) throw new Error("Specialist not found")

  const { commissionPercent } = await getPlatformSettings()
  const { platformFeeCents, payoutCents, feePercent } = feeBreakdown(s.priceCents, commissionPercent)

  const [row] = await db
    .insert(bookings)
    .values({
      userId: user.id,
      specialistId: s.id,
      specialistName: s.name,
      expertise: s.expertise,
      sessionDate: new Date(input.sessionDate),
      slotLabel: input.slotLabel,
      priceCents: s.priceCents,
      platformFeeCents,
      payoutCents,
      feePercent,
      status: "upcoming",
      cardLast4: input.cardLast4,
    })
    .returning()

  revalidatePath("/sessions")
  revalidatePath(`/specialists/${s.id}`)
  return row.id
}

// All of the signed-in learner's booked sessions.
export async function getMyBookings() {
  const user = await getSession()
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.sessionDate))

  // Which sessions has this user already reviewed?
  const myReviews = await db.select().from(reviews).where(eq(reviews.userId, user.id))
  const reviewedBookingIds = new Set(myReviews.map((r) => r.bookingId).filter(Boolean))

  return rows.map((b) => ({
    ...b,
    reviewed: reviewedBookingIds.has(b.id),
  }))
}

// Mark a session as completed so the learner can review it.
export async function markSessionComplete(bookingId: number) {
  const user = await getSession()
  await db
    .update(bookings)
    .set({ status: "completed" })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id)))
  revalidatePath("/sessions")
}

// Submit a learner review of a specialist.
export async function submitReview(input: {
  specialistId: string
  bookingId?: number
  rating: number
  comment: string
}) {
  const user = await getSession()
  if (input.rating < 1 || input.rating > 5) throw new Error("Rating must be 1-5")

  await db.insert(reviews).values({
    userId: user.id,
    bookingId: input.bookingId ?? null,
    specialistId: input.specialistId,
    reviewerName: user.name,
    rating: input.rating,
    comment: input.comment.trim() || null,
  })

  revalidatePath(`/specialists/${input.specialistId}`)
  revalidatePath("/sessions")
}

// Specialist-facing earnings view. Combines seeded lifetime totals with any
// real bookings made through the platform, and shows the platform's cut.
export async function getSpecialistEarnings(specialistId: string) {
  await getSession()
  const s = getSpecialist(specialistId)
  if (!s) return null

  const { commissionPercent } = await getPlatformSettings()
  const { platformFeeCents, payoutCents, feePercent } = feeBreakdown(s.priceCents, commissionPercent)

  // Real platform bookings for this specialist.
  const platformBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.specialistId, specialistId))
    .orderBy(desc(bookings.sessionDate))

  const platformGross = platformBookings.reduce((acc, b) => acc + b.priceCents, 0)
  const platformFees = platformBookings.reduce((acc, b) => acc + b.platformFeeCents, 0)
  const platformPayout = platformBookings.reduce((acc, b) => acc + b.payoutCents, 0)

  // Lifetime totals (seeded sessions + platform bookings) for context.
  const lifetimeSessions = s.sessions + platformBookings.length
  const lifetimeGross = s.sessions * s.priceCents + platformGross
  const lifetimeFees = s.sessions * platformFeeCents + platformFees
  const lifetimePayout = s.sessions * payoutCents + platformPayout

  return {
    specialist: s,
    perSession: { priceCents: s.priceCents, platformFeeCents, payoutCents, feePercent },
    platform: {
      count: platformBookings.length,
      grossCents: platformGross,
      feesCents: platformFees,
      payoutCents: platformPayout,
      bookings: platformBookings,
    },
    lifetime: {
      sessions: lifetimeSessions,
      grossCents: lifetimeGross,
      feesCents: lifetimeFees,
      payoutCents: lifetimePayout,
    },
    feePercent: commissionPercent,
  }
}
