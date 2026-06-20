import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getAllSubmissions } from "@/app/actions/courses"
import { AppHeader } from "@/components/app-header"
import { Markdown } from "@/components/markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, FileText, FolderGit2, Trophy } from "lucide-react"

function formatDate(value: Date | string | null) {
  if (!value) return ""
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export default async function SubmissionsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const submissions = await getAllSubmissions()

  return (
    <div className="min-h-svh bg-secondary/20">
      <AppHeader userName={session.user.name} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Your submissions</h1>
          <p className="text-muted-foreground">
            Every test and project you&apos;ve completed, with scores and feedback.
          </p>
        </div>

        {submissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">No submissions yet</p>
                <p className="text-muted-foreground">
                  Complete a summative test or project and it will show up here.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard">Go to your courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.map((s) => {
              const isTest = s.type === "test"
              const isFinal = s.category === "final"
              const Icon = isFinal ? Trophy : isTest ? ClipboardList : FolderGit2
              const label = isFinal ? "Final project" : isTest ? "Summative test" : "Project"
              return (
                <Card key={s.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{label}</Badge>
                            <span className="text-xs text-muted-foreground">Week {s.weekNumber}</span>
                            {s.submittedAt && (
                              <span className="text-xs text-muted-foreground">
                                · {formatDate(s.submittedAt)}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-base leading-snug">{s.title}</CardTitle>
                          <Link
                            href={`/course/${s.courseId}`}
                            className="text-xs text-muted-foreground hover:text-primary hover:underline"
                          >
                            {s.courseTitle}
                          </Link>
                        </div>
                      </div>
                      {s.score != null && (
                        <Badge className="shrink-0 text-sm">{s.score}%</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {s.fileName && (
                      <p className="inline-flex w-fit items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        {s.fileName}
                      </p>
                    )}

                    {s.submission && (
                      <details className="group rounded-lg border bg-card">
                        <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-foreground">
                          View your submission
                        </summary>
                        <p className="whitespace-pre-wrap border-t px-3 py-2 text-sm text-foreground/90">
                          {s.submission}
                        </p>
                      </details>
                    )}

                    {s.feedback && (
                      <div className="rounded-lg bg-secondary/60 px-4 py-3">
                        <h4 className="mb-1 text-sm font-semibold text-foreground">Feedback</h4>
                        <Markdown>{s.feedback}</Markdown>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
