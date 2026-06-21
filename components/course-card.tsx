"use client"

import { useState } from "react"
import Link from "next/link"
import { deleteCourse } from "@/app/actions/courses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, BookOpen, Trash2, Loader2, AlertTriangle, Lock, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

export function CourseCard({
  id,
  title,
  level,
  pace,
  summary,
  completedLessons,
  totalLessons,
  progress,
  totalWeeks,
  hoursPerWeek,
  hasOverdue = false,
  isFrozen = false,
}: {
  id: number
  title: string
  level: string | null | undefined
  pace: string | null | undefined
  summary: string | null | undefined
  completedLessons: number
  totalLessons: number
  progress: number
  totalWeeks: number | null | undefined
  hoursPerWeek: number | null | undefined
  hasOverdue?: boolean
  isFrozen?: boolean
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return

    setIsDeleting(true)
    try {
      await deleteCourse(id)
    } catch (error) {
      console.error("Failed to delete course:", error)
      setIsDeleting(false)
    }
  }

  const cardInner = (
    <Card
      className={cn(
        "h-full transition-shadow",
        !isFrozen && "group-hover:shadow-md",
        hasOverdue && "border-destructive ring-1 ring-destructive",
        isFrozen && "opacity-60 grayscale",
      )}
    >
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {level}
          </Badge>
          <Badge variant="outline">
            {pace === "full_time" ? "Full time" : "Part time"}
          </Badge>
          {hasOverdue && (
            <Badge variant="destructive" className="ml-auto gap-1">
              <AlertTriangle className="h-3 w-3" />
              Overdue
            </Badge>
          )}
        </div>
        <CardTitle className={cn("text-balance leading-snug", !isFrozen && "group-hover:text-primary")}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completedLessons}/{totalLessons} lessons
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {totalWeeks} weeks
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {hoursPerWeek}h/week
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {totalLessons} lessons
          </span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="group relative">
      {isFrozen ? (
        // Frozen: the course body is greyed out and unclickable until the late
        // fee is paid. Only the "Pay late fee" action remains interactive.
        <div className="relative">
          <div className="pointer-events-none select-none" aria-hidden="true">
            {cardInner}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/40 p-4 text-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/30 bg-card/95 px-4 py-3 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
                <Lock className="h-4 w-4 text-destructive" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-foreground">
                <span className="sr-only">{title}: </span>Locked — late fee unpaid
              </p>
              <p className="max-w-[15rem] text-xs text-muted-foreground">
                Pay your outstanding late fee to unlock this course.
              </p>
              <Button asChild size="sm" variant="destructive" className="mt-1">
                <Link href={`/course/${id}`} aria-label={`Pay late fee to unlock ${title}`}>
                  <CreditCard className="h-4 w-4" />
                  Pay late fee
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Link href={`/course/${id}`} className="block">
          {cardInner}
        </Link>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10 h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete course"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
