"use client"

import { useState, useTransition } from "react"
import type { Lesson } from "@/lib/types"
import { getLessonContent, toggleLessonComplete } from "@/app/actions/courses"
import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function LessonItem({
  lesson,
  onToggle,
}: {
  lesson: Lesson
  onToggle: (id: number, completed: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<string | null>(lesson.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next && !content) {
      setLoading(true)
      setError(null)
      try {
        const c = await getLessonContent(lesson.id)
        setContent(c)
      } catch {
        setError("Could not load this lesson. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  function handleToggle() {
    const next = !lesson.completed
    onToggle(lesson.id, next)
    startTransition(async () => {
      await toggleLessonComplete(lesson.id, next)
    })
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          aria-label={lesson.completed ? "Mark lesson incomplete" : "Mark lesson complete"}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            lesson.completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary",
          )}
        >
          {lesson.completed && <Check className="h-3 w-3" />}
        </button>

        <button type="button" onClick={handleOpen} className="flex flex-1 items-center justify-between gap-2 text-left">
          <div className="flex flex-col">
            <span className={cn("text-sm font-medium text-foreground", lesson.completed && "line-through opacity-60")}>
              {lesson.title}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {lesson.durationMinutes} min
            </span>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="border-t px-4 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Writing your lesson…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {content && !loading && (
            <>
              <Markdown>{content}</Markdown>
              {!lesson.completed && (
                <Button size="sm" className="mt-2" onClick={handleToggle} disabled={pending}>
                  <Check className="h-4 w-4" />
                  Mark complete
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
