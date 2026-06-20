"use client"

import type { Assessment, ScheduleItem } from "@/lib/types"
import { AssessmentCard } from "@/components/assessment-card"
import { ClipboardList } from "lucide-react"

export function AssessmentsTab({
  assessments,
  schedule,
  startDate,
}: {
  assessments: Assessment[]
  schedule: ScheduleItem[]
  startDate: Date | string | null
}) {
  if (assessments.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">This course has no tests or projects.</p>
      </div>
    )
  }

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

  // Due date = end of the assessment's week (week N is due start + N*7 days).
  const base = startDate ? new Date(startDate) : null
  function dueDate(weekNumber: number): Date | null {
    if (!base) return null
    const d = new Date(base)
    d.setDate(d.getDate() + weekNumber * 7)
    return d
  }

  const sorted = [...assessments].sort((a, b) => a.weekNumber - b.weekNumber)

  return (
    <div className="mt-2 flex flex-col gap-4">
      {sorted.map((a) => (
        <AssessmentCard
          key={a.id}
          assessment={a}
          estimatedMinutes={estimatedMinutes(a)}
          dueDate={dueDate(a.weekNumber)}
        />
      ))}
    </div>
  )
}
