"use client"

import { useState } from "react"
import { LoginAnalyticsSection } from "./login-analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import type { LoginAnalytics } from "@/app/actions/admin"

interface ProtectedLoginAnalyticsProps {
  data: LoginAnalytics
}

export function ProtectedLoginAnalytics({ data }: ProtectedLoginAnalyticsProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "private") {
      setIsUnlocked(true)
      setError("")
      setPassword("")
    } else {
      setError("Incorrect password")
      setPassword("")
    }
  }

  if (isUnlocked) {
    return <LoginAnalyticsSection data={data} />
  }

  return (
    <div className="flex items-center justify-center rounded-lg border border-border bg-card p-8">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-center font-semibold text-foreground">This section is password protected</h3>
        <p className="text-center text-sm text-muted-foreground">Enter the password to view user and login analytics.</p>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          Unlock
        </Button>
      </form>
    </div>
  )
}
