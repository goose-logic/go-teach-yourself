import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCoursesWithProgress } from "@/app/actions/courses"
import { AppHeader } from "@/components/app-header"
import { DemoCourses } from "@/components/demo-courses"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, CalendarDays, Clock, Plus, Sparkles, Users } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const courses = await getCoursesWithProgress()

  return (
    <div className="min-h-svh bg-secondary/20">
      <AppHeader userName={session.user.name} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Your courses</h1>
          <p className="text-muted-foreground">Pick up where you left off, or design something new.</p>
        </div>

        <Link
          href="/specialists"
          className="mb-8 flex items-center justify-between gap-4 rounded-xl border bg-card p-5 transition-colors hover:bg-secondary/40"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Book a tutor</p>
              <p className="text-sm text-muted-foreground">
                Get one-on-one help from vetted, real-world experts in your subject.
              </p>
            </div>
          </div>
          <span className="hidden shrink-0 text-sm font-medium text-primary sm:inline">Browse tutors →</span>
        </Link>

        {courses.length === 0 ? (
          <div className="flex flex-col gap-6">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">No courses yet</p>
                  <p className="text-muted-foreground">
                    Tell Go Teach Yourself what you want to learn and it will build a full course for you.
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href="/new">
                    <Plus className="h-4 w-4" />
                    Design your first course
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <DemoCourses />
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
            {courses.map((course) => (
              <Link key={course.id} href={`/course/${course.id}`} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {course.level}
                      </Badge>
                      <Badge variant="outline">
                        {course.pace === "full_time" ? "Full time" : "Part time"}
                      </Badge>
                    </div>
                    <CardTitle className="text-balance leading-snug group-hover:text-primary">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{course.summary}</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {course.completedLessons}/{course.totalLessons} lessons
                        </span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {course.totalWeeks} weeks
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {course.hoursPerWeek}h/week
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.totalLessons} lessons
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            </div>
            <div className="mt-8">
              <DemoCourses />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
