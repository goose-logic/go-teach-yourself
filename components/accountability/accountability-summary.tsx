"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PauseCourse } from "@/components/accountability/pause-course"
import { formatFee } from "@/lib/deadlines"
import { CalendarPlus, CircleDollarSign, PauseCircle } from "lucide-react"

/**
 * Top-of-tab overview of the learner's accountability standing: extension passes
 * left, pause status, and any outstanding late fees — plus the pause control.
 */
export function AccountabilitySummary({
  courseId,
  passesRemaining,
  maxPasses,
  isPaused,
  freePauseAvailable,
  pausedUntil,
  outstandingCents,
}: {
  courseId: number
  passesRemaining: number
  maxPasses: number
  isPaused: boolean
  freePauseAvailable: boolean
  pausedUntil: Date | string | null
  outstandingCents: number
}) {
  return (
    <Card className="border-border/70 bg-secondary/30">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-lg font-semibold text-foreground">Deadlines & accountability</h3>
          <p className="text-sm text-muted-foreground">
            Each module has a target deadline based on your pace. Missing one adds a flat late fee — use an
            extension pass or pause the course to stay on track.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            icon={<CalendarPlus className="h-4 w-4 text-primary" />}
            label="Extension passes"
            value={`${passesRemaining} of ${maxPasses} left`}
          />
          <Stat
            icon={<PauseCircle className="h-4 w-4 text-primary" />}
            label="Course pause"
            value={isPaused ? "Active" : freePauseAvailable ? "1 free available" : "Evidence required"}
          />
          <Stat
            icon={<CircleDollarSign className="h-4 w-4 text-primary" />}
            label="Outstanding fees"
            value={outstandingCents > 0 ? formatFee(outstandingCents) : "None"}
            highlight={outstandingCents > 0}
          />
        </div>

        <div className="border-t pt-4">
          <PauseCourse
            courseId={courseId}
            isPaused={isPaused}
            freePauseAvailable={freePauseAvailable}
            pausedUntil={pausedUntil}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-3">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={highlight ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-foreground"}>
        {value}
      </span>
    </div>
  )
}
