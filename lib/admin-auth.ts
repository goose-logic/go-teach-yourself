import "server-only"

import { cookies } from "next/headers"
import { createHash } from "crypto"

// Admin access is a single shared role (no tiers). For this demo it is gated by
// one password. Override it in production by setting ADMIN_PASSWORD.
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "letmein"

const COOKIE_NAME = "gty_admin"
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

// The cookie stores a hash of the password (not the password itself), so the
// raw secret never leaves the server in a readable form.
function sessionToken() {
  return createHash("sha256").update(`gty-admin::${ADMIN_PASSWORD}`).digest("hex")
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export async function startAdminSession() {
  const store = await cookies()
  // The v0 / Vercel preview runs the app inside a cross-site iframe, so the
  // session cookie must be SameSite=None + Secure to be sent back on subsequent
  // requests. (A SameSite=Lax cookie gets set but never returned in that context,
  // which bounces the user straight back to the login page.) This mirrors how
  // the learner-facing Better Auth cookies are configured.
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function endAdminSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value === sessionToken()
}
