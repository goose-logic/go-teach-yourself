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
import { ArrowLeft, Award, CalendarDays, Clock, Target } from "lucide-react"

export function CourseView({ detail }: { detail: CourseDetail }) {
  const { course } = detail
  const [lessons, setLessons] = useState(detail.lessons)

  const completedLessons = lessons.filter((l) => l.completed).length
  const progress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0
  const isComplete = lessons.length > 0 && completedLessons === lessons.length

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
            Back
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

        {/* Certificate: unlocked once every lesson is complete */}
        {lessons.length > 0 &&
          (isComplete ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Course complete — your certificate is ready</span>
                  <span className="text-sm text-muted-foreground">
                    You&apos;ve finished every lesson. Congratulations!
                  </span>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link href={`/course/${course.id}/certificate`}>
                  <Award className="h-4 w-4" />
                  View certificate
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Award className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">Earn your certificate</span>
                <span className="text-sm text-muted-foreground">
                  Complete all {lessons.length} lessons to unlock your certificate of completion.
                </span>
              </div>
            </div>
          ))}
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
    <TimetableTab schedule={detail.schedule} totalWeeks={course.totalWeeks} assessments={detail.assessments} />
  </TabsContent>

        <TabsContent value="assessments">
          <AssessmentsTab assessments={detail.assessments} schedule={detail.schedule} startDate={course.startDate} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
