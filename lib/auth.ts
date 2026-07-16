import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

export const auth = betterAuth({
  database: pool,
  // BETTER_AUTH_SECRET must be set in Vercel env vars. Without it Better Auth
  // generates a new random secret on every cold start, which invalidates all
  // existing sessions after each redeploy.
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    // v0 / Vercel preview domains can vary by subdomain (embedded iframe vs.
    // "open in new tab"), so trust the whole family via wildcards. This keeps
    // sign-in working across every preview surface.
    "*.vusercontent.net",
    "*.v0.dev",
    "*.vercel.app",
    "*.vercel.run",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // SameSite=None + Secure is required both in the v0 preview (cross-site
  // iframe) and on Vercel production (HTTPS). Without this, session cookies are
  // not sent on cross-origin requests and every page load appears unauthenticated.
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none" as const,
      secure: true,
    },
  },
})
