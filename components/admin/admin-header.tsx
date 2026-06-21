"use client"

import { useRouter } from "next/navigation"
import { adminLogout } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { LogOut, ShieldCheck } from "lucide-react"

export function AdminHeader() {
  const router = useRouter()

  async function handleLogout() {
    await adminLogout()
    router.replace("/admin/login")
    router.refresh()
  }

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">Go Teach Yourself</span>
            <span className="text-xs text-muted-foreground">Platform admin</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  )
}
