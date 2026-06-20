import Link from "next/link"
import Image from "next/image"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { BookOpen, CalendarDays, ClipboardCheck, Compass, GraduationCap, Sparkles } from "lucide-react"

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const authed = !!session?.user

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <span className="font-serif text-xl font-semibold text-foreground">Curio</span>
        <nav className="flex items-center gap-2">
          {authed ? (
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2 md:gap-6 md:px-10 md:py-20">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-designed courses
            </span>
            <h1 className="text-balance font-serif text-4xl font-semibold leading-tight text-foreground md:text-6xl">
              Design your own course. Learn anything, your way.
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              Tell Curio what you want to learn. It asks a few smart questions, then builds a full curriculum,
              written lessons, a study timetable, plus tests and projects tailored to how you want to study.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={authed ? "/new" : "/sign-up"}>
                  {authed ? "Design a course" : "Start for free"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={authed ? "/dashboard" : "/sign-in"}>
                  {authed ? "My courses" : "Sign in"}
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <Image
                src="/hero-learning.png"
                alt="An illustration of a personalized learning path with lessons, a timetable, and a graduation milestone"
                width={720}
                height={720}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-secondary/30">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
            <h2 className="mb-3 text-center font-serif text-3xl font-semibold text-foreground">
              From idea to syllabus in minutes
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
              Curio turns a single sentence into a complete, structured learning experience.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Compass,
                  title: "Tell us your goal",
                  body: "Type what you want to learn and why. Curio asks a few clarifying questions to understand your level and focus.",
                },
                {
                  icon: BookOpen,
                  title: "Get a full curriculum",
                  body: "Weekly modules, written lessons, and clear objectives — generated and ready to study right away.",
                },
                {
                  icon: CalendarDays,
                  title: "Study on a real timetable",
                  body: "A full or part-time schedule maps your lessons, tests, and projects across the weeks ahead.",
                },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="flex items-start gap-4 rounded-xl border bg-card p-6">
                <ClipboardCheck className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-foreground">Tests &amp; projects</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Check your understanding with auto-graded quizzes, and apply your skills with project briefs
                    that Curio reviews and scores with personalized feedback.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl border bg-card p-6">
                <GraduationCap className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-foreground">Track your progress</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Mark lessons complete, watch your course progress climb, and finish with a capstone project
                    that proves what you have learned.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-center">
              <Button asChild size="lg">
                <Link href={authed ? "/new" : "/sign-up"}>Design your first course</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground md:px-10">
        Curio — design your own course, learn anything.
      </footer>
    </div>
  )
}
