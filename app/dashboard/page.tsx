import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCoursesWithProgress } from "@/app/actions/courses"
import { AppHeader } from "@/components/app-header"
import { DemoCourses } from "@/components/demo-courses"
import { CourseCard } from "@/components/course-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Sparkles, Users } from "lucide-react"

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
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  level={course.level}
                  pace={course.pace}
                  summary={course.summary}
                  completedLessons={course.completedLessons}
                  totalLessons={course.totalLessons}
                  progress={course.progress}
                  totalWeeks={course.totalWeeks}
                  hoursPerWeek={course.hoursPerWeek}
                />
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
