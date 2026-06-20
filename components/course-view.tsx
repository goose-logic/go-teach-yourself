"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { CourseDetail } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CurriculumTab } from "@/components/curriculum-tab"
import { TimetableTab } from "@/components/timetable-tab"
import { AssessmentsTab } from "@/components/assessments-tab"
import { ArrowLeft, CalendarDays, Clock, Target } from "lucide-react"

export function CourseView({ detail }: { detail: CourseDetail }) {
  const { course } = detail
  const [lessons, setLessons] = useState(detail.lessons)

  const completedLessons = lessons.filter((l) => l.completed).length
  const progress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0

  const totalHours = useMemo(() => {
    const mins = lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0)
    return Math.round(mins / 60)
  }, [lessons])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Link>
        </Button>
      </div>

      {/* Course header */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {course.level}
          </Badge>
          <Badge variant="outline">{course.pace === "full_time" ? "Full time" : "Part time"}</Badge>
        </div>
        <h1 className="text-balance font-serif text-3xl font-semibold text-foreground md:text-4xl">
          {course.title}
        </h1>
        {course.summary && <p className="max-w-3xl text-pretty text-muted-foreground">{course.summary}</p>}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {course.totalWeeks} weeks
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {course.hoursPerWeek}h per week · ~{totalHours}h total
          </span>
          {course.goal && (
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              {course.goal}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Course progress</span>
            <span className="text-muted-foreground">
              {completedLessons}/{lessons.length} lessons · {progress}%
            </span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      <Tabs defaultValue="curriculum">
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="assessments">Tests &amp; Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum">
          <CurriculumTab
            modules={detail.modules}
            lessons={lessons}
            assessments={detail.assessments}
            onLessonToggle={(id, completed) =>
              setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, completed } : l)))
            }
          />
        </TabsContent>

        <TabsContent value="timetable">
          <TimetableTab schedule={detail.schedule} totalWeeks={course.totalWeeks} />
        </TabsContent>

        <TabsContent value="assessments">
          <AssessmentsTab assessments={detail.assessments} schedule={detail.schedule} startDate={course.startDate} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
