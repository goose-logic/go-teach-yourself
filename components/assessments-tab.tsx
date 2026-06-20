"use client"

import type { Assessment } from "@/lib/types"
import { AssessmentCard } from "@/components/assessment-card"
import { ClipboardList } from "lucide-react"

export function AssessmentsTab({ assessments }: { assessments: Assessment[] }) {
  if (assessments.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">This course has no tests or projects.</p>
      </div>
    )
  }

  const sorted = [...assessments].sort((a, b) => a.weekNumber - b.weekNumber)

  return (
    <div className="mt-2 flex flex-col gap-4">
      {sorted.map((a) => (
        <AssessmentCard key={a.id} assessment={a} />
      ))}
    </div>
  )
}
