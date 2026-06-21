import "server-only"

import { db } from "@/lib/db"
import { platformSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export type PlatformSettings = {
  courseUnlockFeeCents: number
  lateFeeCents: number
  commissionPercent: number
}

// Fallback values that mirror the seeded DB row. Used if the settings row is
// somehow missing so the app never breaks.
export const DEFAULT_SETTINGS: PlatformSettings = {
  courseUnlockFeeCents: 20000,
  lateFeeCents: 1000,
  commissionPercent: 18,
}

// Number of free "trial" lesson units before the course paywall kicks in.
export const FREE_UNIT_LESSONS = 4

/**
 * Read the live, admin-controlled platform pricing. Always reads the single
 * settings row (id = 1). Cheap enough to call per-request in server components
 * and server actions so price changes take effect immediately.
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const [row] = await db.select().from(platformSettings).where(eq(platformSettings.id, 1))
    if (!row) return DEFAULT_SETTINGS
    return {
      courseUnlockFeeCents: row.courseUnlockFeeCents,
      lateFeeCents: row.lateFeeCents,
      commissionPercent: row.commissionPercent,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}
