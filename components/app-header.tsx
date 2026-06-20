"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { CalendarClock, FileCheck2, LogOut, Plus, Users } from "lucide-react"

export function AppHeader({ userName, showNew = true }: { userName?: string; showNew?: boolean }) {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur md:px-10">
      <Link href="/dashboard" className="font-serif text-xl font-semibold text-foreground">
        Curio
      </Link>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/specialists">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Specialists</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sessions">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">My Sessions</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/submissions">
            <FileCheck2 className="h-4 w-4" />
            <span className="hidden sm:inline">Submissions</span>
          </Link>
        </Button>
        {showNew && (
          <Button asChild size="sm">
            <Link href="/new">
              <Plus className="h-4 w-4" />
              New course
            </Link>
          </Button>
        )}
        {userName && <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>}
        <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
