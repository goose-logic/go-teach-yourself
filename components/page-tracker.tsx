"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

// Fires a fire-and-forget POST to /api/track on every pathname change.
// Mounted once in the root layout so it captures all navigations.
export function PageTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    if (pathname === lastTracked.current) return
    lastTracked.current = pathname

    // Skip admin pages
    if (pathname.startsWith("/admin")) return

    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      // keepalive so the request survives page unload
      keepalive: true,
    }).catch(() => {/* silent */})
  }, [pathname])

  return null
}
