"use client"

import { useState } from "react"
import Link from "next/link"
import { deleteCourse } from "@/app/actions/courses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, BookOpen, Trash2, Loader2 } from "lucide-react"

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

  return (
    <div className="group relative">
      <Link href={`/course/${id}`} className="block">
        <Card className="h-full transition-shadow group-hover:shadow-md">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {level}
              </Badge>
              <Badge variant="outline">
                {pace === "full_time" ? "Full time" : "Part time"}
              </Badge>
            </div>
            <CardTitle className="text-balance leading-snug group-hover:text-primary">
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
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
