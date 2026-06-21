"use client"

import type { Assessment, Course, ScheduleItem } from "@/lib/types"
import { AssessmentCard } from "@/components/assessment-card"
import { AccountabilitySummary } from "@/components/accountability/accountability-summary"
import {
  effectiveDeadline,
  extensionPassesRemaining,
  freePauseAvailable,
  hasOutstandingCharge,
  isOverdue,
  LATE_FEE_CENTS,
  MAX_EXTENSIONS,
} from "@/lib/deadlines"
import { ClipboardList } from "lucide-react"

export function AssessmentsTab({
  assessments,
  schedule,
  course,
  lateFeeCents = LATE_FEE_CENTS,
}: {
  assessments: Assessment[]
  schedule: ScheduleItem[]
  course: Course
  lateFeeCents?: number
}) {
  if (assessments.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">This course has no tests or projects.</p>
      </div>
    )
  }

  const startDate = course.startDate
  const isPaused = course.isPaused
  const passesRemaining = extensionPassesRemaining(course)

  // Estimated minutes per assessment, taken from its matching schedule item.
  const minutesByRef = new Map<string, number>()
  for (const item of schedule) {
    if ((item.itemType === "test" || item.itemType === "project") && item.refId != null) {
      minutesByRef.set(`${item.itemType}:${item.refId}`, item.durationMinutes)
    }
  }

  function estimatedMinutes(a: Assessment): number {
    const fromSchedule = minutesByRef.get(`${a.type}:${a.id}`)
    if (fromSchedule) return fromSchedule
    return a.type === "test" ? 45 : a.category === "final" ? 240 : 120
  }

  const sorted = [...assessments].sort((a, b) => a.weekNumber - b.weekNumber)

  const outstandingCount = sorted.filter((a) => hasOutstandingCharge(a, startDate, isPaused)).length

  return (
    <div className="mt-2 flex flex-col gap-4">
      <AccountabilitySummary
        courseId={course.id}
        passesRemaining={passesRemaining}
        maxPasses={MAX_EXTENSIONS}
        isPaused={isPaused}
        freePauseAvailable={freePauseAvailable(course)}
        pausedUntil={course.pausedUntil}
        outstandingCents={outstandingCount * lateFeeCents}
      />

      {sorted.map((a) => (
        <AssessmentCard
          key={a.id}
          assessment={a}
          estimatedMinutes={estimatedMinutes(a)}
          dueDate={effectiveDeadline(a, startDate)}
          overdue={isOverdue(a, startDate, isPaused)}
          outstandingCharge={hasOutstandingCharge(a, startDate, isPaused)}
          chargeSettled={isOverdue(a, startDate, isPaused) && (a.lateChargePaid || a.lateChargeWaived)}
          passesRemaining={passesRemaining}
          lateFeeCents={lateFeeCents}
        />
      ))}
    </div>
  )
}
