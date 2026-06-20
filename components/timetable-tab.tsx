"use client"

import type { ScheduleItem, Assessment } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ClipboardList, Clock, FolderGit2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_META: Record<string, { label: string; icon: typeof BookOpen }> = {
  lesson: { label: "Lesson", icon: BookOpen },
  test: { label: "Test", icon: ClipboardList },
  project: { label: "Project", icon: FolderGit2 },
  review: { label: "Review", icon: RotateCcw },
}

export function TimetableTab({
  schedule,
  totalWeeks,
  assessments = [],
}: {
  schedule: ScheduleItem[]
  totalWeeks: number
  assessments?: Assessment[]
}) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter((w) =>
    schedule.some((s) => s.weekNumber === w),
  )

  // Map assessments by refId for quick lookup
  const assessmentsByRef = new Map<string, Assessment>()
  for (const a of assessments) {
    assessmentsByRef.set(`${a.type}:${a.id}`, a)
  }

  return (
    <div className="mt-2 flex flex-col gap-5">
      {weeks.map((week) => {
        const items = schedule
          .filter((s) => s.weekNumber === week)
          .sort((a, b) => a.orderIndex - b.orderIndex)
        const weekMinutes = items.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0)

        return (
          <Card key={week}>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-foreground">Week {week}</h3>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.round(weekMinutes / 60)}h planned
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((item) => {
                  const meta = TYPE_META[item.itemType] ?? TYPE_META.lesson
                  const Icon = meta.icon
                  const assessment = item.refId ? assessmentsByRef.get(`${item.itemType}:${item.refId}`) : null
                  const isSummative = assessment?.category === "summative"

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                        isSummative ? "border-primary/50 bg-primary/8" : item.completed ? "bg-primary/5" : "bg-card",
                      )}
                    >
                      <span className="flex w-12 shrink-0 justify-center">
                        <Badge variant={isSummative ? "default" : "outline"} className="font-mono">
                          {item.dayLabel}
                        </Badge>
                      </span>
                      <Icon className={`h-4 w-4 shrink-0 ${isSummative ? "text-primary" : "text-primary"}`} />
                      <span
                        className={cn(
                          `flex-1 text-sm ${isSummative ? "font-bold" : ""} text-foreground`,
                          item.completed && "line-through opacity-60",
                        )}
                      >
                        {item.title}
                        {isSummative && <span className="ml-2 text-xs font-normal text-primary">(Week end)</span>}
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">{meta.label}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.durationMinutes}m
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
