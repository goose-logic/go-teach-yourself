"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { pauseCourse, resumeCourse } from "@/app/actions/accountability"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, PauseCircle, PlayCircle, ShieldCheck } from "lucide-react"

/**
 * Course pause control. The first pause is free; any further pause requires a
 * supporting note that is "reviewed" (simulated AI review) before approval.
 */
export function PauseCourse({
  courseId,
  isPaused,
  freePauseAvailable,
  pausedUntil,
}: {
  courseId: number
  isPaused: boolean
  freePauseAvailable: boolean
  pausedUntil: Date | string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [phase, setPhase] = useState<"idle" | "reviewing" | "approved" | "saving">("idle")
  const [error, setError] = useState<string | null>(null)
  const [resuming, setResuming] = useState(false)

  async function handleResume() {
    setResuming(true)
    try {
      await resumeCourse(courseId)
      router.refresh()
    } catch {
      setResuming(false)
    }
  }

  async function handleFreePause() {
    setPhase("saving")
    setError(null)
    try {
      await pauseCourse(courseId)
      router.refresh()
    } catch {
      setError("Could not pause the course. Please try again.")
      setPhase("idle")
    }
  }

  async function handleEvidencePause() {
    if (reason.trim().length < 10) {
      setError("Please describe your situation in a little more detail (at least 10 characters).")
      return
    }
    setError(null)
    // Simulate an AI reviewing the supporting evidence.
    setPhase("reviewing")
    await new Promise((r) => setTimeout(r, 2200))
    setPhase("approved")
    await new Promise((r) => setTimeout(r, 900))
    setPhase("saving")
    try {
      const res = await pauseCourse(courseId, reason)
      if (!res.ok) {
        setError(res.error ?? "Could not pause the course.")
        setPhase("idle")
        return
      }
      router.refresh()
    } catch {
      setError("Could not pause the course. Please try again.")
      setPhase("idle")
    }
  }

  if (isPaused) {
    const until = pausedUntil ? new Date(pausedUntil) : null
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <PauseCircle className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Course paused</span>
            <span className="text-sm text-muted-foreground">
              All deadlines are suspended{until ? ` until ${until.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}.
            </span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleResume} disabled={resuming} className="shrink-0">
          {resuming ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          Resume course
        </Button>
      </div>
    )
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PauseCircle className="h-4 w-4" />
        Pause course
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <PauseCircle className="h-5 w-5 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Pause this course</h4>
      </div>

      {freePauseAvailable ? (
        <>
          <p className="text-sm text-muted-foreground">
            This pauses all deadlines so you won&apos;t be charged while you&apos;re away. Your first pause is free.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleFreePause} disabled={phase === "saving"}>
              {phase === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />}
              Pause course (free)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={phase === "saving"}>
              Cancel
            </Button>
          </div>
        </>
      ) : phase === "reviewing" || phase === "approved" ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          {phase === "reviewing" ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">AI is reviewing your request…</p>
              <p className="text-sm text-muted-foreground">Checking your supporting note against our pause policy.</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Request approved</p>
              <p className="text-sm text-muted-foreground">Pausing your course now…</p>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            You&apos;ve used your free pause. Additional pauses need a short supporting note, which is reviewed before approval.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`pause-reason-${courseId}`}>Supporting note</Label>
            <Textarea
              id={`pause-reason-${courseId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe what's going on (e.g. illness, work deadline, family situation)…"
              rows={4}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleEvidencePause} disabled={phase === "saving"}>
              Submit for review
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={phase === "saving"}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
