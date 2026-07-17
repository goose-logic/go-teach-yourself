import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pageViews } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

// POST /api/track — record a single page view.
// Called client-side on every navigation; fails silently so it never blocks UI.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const path: string = body.path ?? "/"

    // Skip admin pages and API routes from analytics
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true })
    }

    // Attempt to resolve the session — undefined for unauthenticated visits.
    let userId: string | null = null
    let sessionId: string | null = null
    try {
      const session = await auth.api.getSession({ headers: req.headers })
      userId = session?.user?.id ?? null
      sessionId = session?.session?.id ?? null
    } catch {
      // unauthenticated — fine
    }

    const referrer = req.headers.get("referer") ?? null
    const userAgent = req.headers.get("user-agent") ?? null

    await db.insert(pageViews).values({
      path,
      userId,
      sessionId,
      referrer,
      userAgent,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never surface tracking errors to the client
    return NextResponse.json({ ok: true })
  }
}
