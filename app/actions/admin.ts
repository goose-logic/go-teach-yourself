"use server"

import { db } from "@/lib/db"
import { platformSettings, user, session, pageViews } from "@/lib/db/schema"
import { eq, sql, desc, gte, and } from "drizzle-orm"
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

// --- Real page view analytics ---------------------------------------------

export type PageViewAnalytics = Awaited<ReturnType<typeof getPageViewAnalytics>>

export async function getPageViewAnalytics() {
  if (!(await isAdminAuthenticated())) throw new Error("Not authorized")

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Total views all time
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(pageViews)

  // Views last 30 days
  const [{ last30 }] = await db
    .select({ last30: sql<number>`count(*)::int` })
    .from(pageViews)
    .where(gte(pageViews.createdAt, thirtyDaysAgo))

  // Views last 7 days
  const [{ last7 }] = await db
    .select({ last7: sql<number>`count(*)::int` })
    .from(pageViews)
    .where(gte(pageViews.createdAt, sevenDaysAgo))

  // Unique visitors (by userId or sessionId) last 30 days
  const [{ uniqueVisitors }] = await db
    .select({
      uniqueVisitors: sql<number>`count(distinct coalesce("userId", "sessionId"))::int`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, thirtyDaysAgo))

  // Top pages last 30 days
  const topPages = await db
    .select({
      path: pageViews.path,
      views: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct coalesce("userId", "sessionId"))::int`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, thirtyDaysAgo))
    .groupBy(pageViews.path)
    .orderBy(desc(sql`count(*)`))
    .limit(20)

  // Daily views for the last 30 days (for chart)
  const dailyRaw = await db
    .select({
      day: sql<string>`to_char("createdAt", 'YYYY-MM-DD')`,
      views: sql<number>`count(*)::int`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char("createdAt", 'YYYY-MM-DD')`)
    .orderBy(sql`to_char("createdAt", 'YYYY-MM-DD')`)

  // Fill in any missing days with 0
  const dailyMap = new Map(dailyRaw.map((r) => [r.day, r.views]))
  const dailyViews: { day: string; label: string; views: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    dailyViews.push({ day: key, label, views: dailyMap.get(key) ?? 0 })
  }

  return {
    total: Number(total),
    last30: Number(last30),
    last7: Number(last7),
    uniqueVisitors: Number(uniqueVisitors),
    topPages,
    dailyViews,
  }
}

// --- Real login / user analytics ------------------------------------------

export type LoginAnalytics = Awaited<ReturnType<typeof getLoginAnalytics>>

export async function getLoginAnalytics() {
  if (!(await isAdminAuthenticated())) throw new Error("Not authorized")

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // All users with their most recent session info
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      // Most recent session
      lastLoginAt: sql<Date | null>`(
        SELECT MAX(s."createdAt") FROM session s WHERE s."userId" = "user".id
      )`,
      sessionCount: sql<number>`(
        SELECT count(*)::int FROM session s WHERE s."userId" = "user".id
      )`,
      activeSessionCount: sql<number>`(
        SELECT count(*)::int FROM session s
        WHERE s."userId" = "user".id AND s."expiresAt" > now()
      )`,
      lastIp: sql<string | null>`(
        SELECT s."ipAddress" FROM session s
        WHERE s."userId" = "user".id
        ORDER BY s."createdAt" DESC LIMIT 1
      )`,
      lastUserAgent: sql<string | null>`(
        SELECT s."userAgent" FROM session s
        WHERE s."userId" = "user".id
        ORDER BY s."createdAt" DESC LIMIT 1
      )`,
    })
    .from(user)
    .orderBy(desc(user.createdAt))

  // New sign-ups last 30 days
  const [{ newSignups }] = await db
    .select({ newSignups: sql<number>`count(*)::int` })
    .from(user)
    .where(gte(user.createdAt, thirtyDaysAgo))

  // Active users (at least one session in the last 30 days)
  const [{ activeUsers }] = await db
    .select({
      activeUsers: sql<number>`count(distinct "userId")::int`,
    })
    .from(session)
    .where(gte(session.createdAt, thirtyDaysAgo))

  // Daily sign-ups last 30 days for chart
  const dailyRaw = await db
    .select({
      day: sql<string>`to_char("createdAt", 'YYYY-MM-DD')`,
      signups: sql<number>`count(*)::int`,
    })
    .from(user)
    .where(gte(user.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char("createdAt", 'YYYY-MM-DD')`)
    .orderBy(sql`to_char("createdAt", 'YYYY-MM-DD')`)

  const now = new Date()
  const dailyMap = new Map(dailyRaw.map((r) => [r.day, r.signups]))
  const dailySignups: { day: string; label: string; signups: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    dailySignups.push({ day: key, label, signups: dailyMap.get(key) ?? 0 })
  }

  return {
    totalUsers: users.length,
    newSignups: Number(newSignups),
    activeUsers: Number(activeUsers),
    users,
    dailySignups,
  }
}
