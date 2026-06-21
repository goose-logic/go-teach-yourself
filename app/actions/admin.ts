"use server"

import { db } from "@/lib/db"
import { platformSettings, user } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import {
  endAdminSession,
  isAdminAuthenticated,
  startAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth"
import { getPlatformSettings } from "@/lib/settings"

// --- Auth ------------------------------------------------------------------

export async function adminLogin(password: string): Promise<{ ok: boolean; error?: string }> {
  if (!verifyAdminPassword(password)) {
    return { ok: false, error: "Incorrect password. Please try again." }
  }
  await startAdminSession()
  return { ok: true }
}

export async function adminLogout() {
  await endAdminSession()
  revalidatePath("/admin")
}

// --- Pricing controls (live) ----------------------------------------------

export async function updatePlatformSettings(input: {
  courseUnlockFeeCents: number
  lateFeeCents: number
  commissionPercent: number
}): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authorized." }
  }

  const unlock = Math.round(input.courseUnlockFeeCents)
  const late = Math.round(input.lateFeeCents)
  const commission = Math.round(input.commissionPercent)

  if (!Number.isFinite(unlock) || unlock < 0 || unlock > 1_000_00) {
    return { ok: false, error: "Course unlock fee must be between $0 and $1,000." }
  }
  if (!Number.isFinite(late) || late < 0 || late > 1_000_00) {
    return { ok: false, error: "Deadline fee must be between $0 and $1,000." }
  }
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
    return { ok: false, error: "Commission must be between 0% and 100%." }
  }

  await db
    .update(platformSettings)
    .set({
      courseUnlockFeeCents: unlock,
      lateFeeCents: late,
      commissionPercent: commission,
      updatedAt: new Date(),
    })
    .where(eq(platformSettings.id, 1))

  // Price changes ripple through the learner-facing surfaces.
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  revalidatePath("/specialists")
  revalidatePath("/sessions")

  return { ok: true }
}

// --- Analytics dashboard ---------------------------------------------------
// Sign-up totals are read live from the auth `user` table; everything else is
// realistic mock/simulated data, with revenue derived from the *live* fees so
// the dashboard reflects pricing changes made above.

export type AdminAnalytics = Awaited<ReturnType<typeof getAdminAnalytics>>

// Deterministic monthly signup curve (mock), scaled to look like steady growth.
const SIGNUP_CURVE = [42, 58, 73, 95, 120, 154, 196, 238, 281, 327, 389, 452]
const MONTH_LABELS = [
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
]

export async function getAdminAnalytics() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Not authorized")
  }

  const settings = await getPlatformSettings()

  // Real sign-up count from the auth table (plus a mock baseline so the demo
  // dashboard looks populated even on a fresh database).
  let realUsers = 0
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(user)
    realUsers = Number(count) || 0
  } catch {
    realUsers = 0
  }

  const mockBaseline = SIGNUP_CURVE.reduce((a, b) => a + b, 0)
  const totalSignups = mockBaseline + realUsers

  const signupsOverTime = MONTH_LABELS.map((month, i) => ({
    month,
    count: SIGNUP_CURVE[i] + (i === MONTH_LABELS.length - 1 ? realUsers : 0),
  }))

  // Simulated activity counts that drive revenue.
  const courseUnlocks = 1280
  const deadlinesMissed = 612
  const specialistBookings = 845
  const avgBookingCents = 10500 // average session price across specialists

  const unlockRevenue = courseUnlocks * settings.courseUnlockFeeCents
  const deadlineRevenue = deadlinesMissed * settings.lateFeeCents
  const commissionRevenue = Math.round(
    (specialistBookings * avgBookingCents * settings.commissionPercent) / 100,
  )
  const totalRevenue = unlockRevenue + deadlineRevenue + commissionRevenue

  // Completion funnel (mock).
  const coursesStarted = 2140
  const coursesCompleted = 1287
  const completionRate = Math.round((coursesCompleted / coursesStarted) * 100)

  return {
    settings,
    signups: {
      total: totalSignups,
      thisMonth: signupsOverTime[signupsOverTime.length - 1].count,
      overTime: signupsOverTime,
    },
    revenue: {
      total: totalRevenue,
      unlock: unlockRevenue,
      deadline: deadlineRevenue,
      commission: commissionRevenue,
      counts: { courseUnlocks, deadlinesMissed, specialistBookings },
    },
    completion: {
      started: coursesStarted,
      completed: coursesCompleted,
      rate: completionRate,
    },
  }
}
