"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Award, Printer } from "lucide-react"

export function Certificate({
  learnerName,
  courseTitle,
  courseId,
  totalWeeks,
  completedDate,
}: {
  learnerName: string
  courseTitle: string
  courseId: number
  totalWeeks: number
  completedDate: string
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
      {/* Actions — hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/course/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Certificate */}
      <div className="rounded-xl border-4 border-double border-primary bg-card p-6 shadow-sm md:p-12 print:border-2 print:shadow-none">
        <div className="flex flex-col items-center gap-6 rounded-lg border border-border px-6 py-10 text-center md:px-12 md:py-14">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Award className="h-9 w-9 text-primary" aria-hidden="true" />
          </span>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Certificate of Completion
            </p>
            <div className="mx-auto mt-2 h-px w-24 bg-primary/40" />
          </div>

          <p className="text-sm text-muted-foreground">This certifies that</p>

          <h1 className="text-balance font-serif text-3xl font-semibold text-foreground md:text-4xl">
            {learnerName}
          </h1>

          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            has successfully completed all {totalWeeks} weeks of study and every lesson in the course
          </p>

          <h2 className="text-balance font-serif text-xl font-medium text-primary md:text-2xl">
            {courseTitle}
          </h2>

          <div className="mt-6 flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <span className="font-serif text-lg text-foreground">{completedDate}</span>
              <span className="border-t border-border pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Date completed
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <span className="font-serif text-lg text-foreground">Go Teach Yourself</span>
              <span className="border-t border-border pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Awarded by
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
