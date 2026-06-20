"use client"

import type { Module, Lesson, Assessment } from "@/lib/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { LessonItem } from "@/components/lesson-item"
import { ClipboardList, FolderGit2 } from "lucide-react"

export function CurriculumTab({
  modules,
  lessons,
  assessments,
  onLessonToggle,
}: {
  modules: Module[]
  lessons: Lesson[]
  assessments: Assessment[]
  onLessonToggle: (id: number, completed: boolean) => void
}) {
  return (
    <Accordion type="multiple" defaultValue={modules.length > 0 ? [`m-${modules[0].id}`] : []} className="mt-2">
      {modules.map((mod) => {
        const moduleLessons = lessons
          .filter((l) => l.moduleId === mod.id)
          .sort((a, b) => a.orderIndex - b.orderIndex)
        const moduleAssessments = assessments.filter((a) => a.moduleId === mod.id)
        const done = moduleLessons.filter((l) => l.completed).length

        return (
          <AccordionItem key={mod.id} value={`m-${mod.id}`} className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center justify-between gap-3 pr-2 text-left">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-primary">
                    Week {mod.weekNumber}
                  </span>
                  <span className="font-semibold text-foreground">{mod.title}</span>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {done}/{moduleLessons.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {mod.summary && <p className="mb-4 text-sm text-muted-foreground">{mod.summary}</p>}
              <div className="flex flex-col gap-2">
                {moduleLessons.map((lesson) => (
                  <LessonItem key={lesson.id} lesson={lesson} onToggle={onLessonToggle} />
                ))}

                {moduleAssessments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-dashed bg-secondary/40 px-3 py-3"
                  >
                    {a.type === "test" ? (
                      <ClipboardList className="h-4 w-4 shrink-0 text-accent-foreground" />
                    ) : (
                      <FolderGit2 className="h-4 w-4 shrink-0 text-accent-foreground" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{a.title}</span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {a.type} · see Tests &amp; Projects tab
                      </span>
                    </div>
                    {a.status === "graded" && (
                      <Badge variant="default" className="ml-auto">
                        {a.score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
