"use client"

import { useRef, useState } from "react"
import type { Assessment, TestQuestion, ProjectBrief } from "@/lib/types"
import { getAssessmentContent, submitTest, submitProject, extractDocxText } from "@/app/actions/courses"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Markdown } from "@/components/markdown"
import { LateFeeFlow, LateFeePaid } from "@/components/accountability/late-fee-flow"
import { ReviewOptionsModal } from "@/components/assessments/review-options-modal"
import { cn } from "@/lib/utils"
import { CalendarClock, Check, CheckCircle2, ClipboardList, Clock, FileUp, FolderGit2, Loader2, Trophy, X } from "lucide-react"

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  const rounded = Number.isInteger(hours) ? hours : Math.round(hours * 10) / 10
  return `${rounded} hr${rounded === 1 ? "" : "s"}`
}

function formatDueDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

export function AssessmentCard({
  assessment,
  estimatedMinutes,
  dueDate,
  overdue = false,
  outstandingCharge = false,
  chargeSettled = false,
  passesRemaining = 0,
  lateFeeCents,
}: {
  assessment: Assessment
  estimatedMinutes?: number
  dueDate?: Date | null
  overdue?: boolean
  outstandingCharge?: boolean
  lateFeeCents?: number
  // A settled late charge (paid for, or waived by an extension) on an item that
  // was overdue — used to show a reassuring "caught up" confirmation. Computed by
  // the parent from fresh server data so it stays correct after router.refresh().
  chargeSettled?: boolean
  passesRemaining?: number
}) {
  const [data, setData] = useState<Assessment>(assessment)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTest = data.type === "test"
  const isGraded = data.status === "graded"
  const isFinal = data.category === "final"

  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next && !data.questions) {
      setLoading(true)
      setError(null)
      try {
        const updated = await getAssessmentContent(data.id)
        setData(updated)
      } catch {
        setError("Could not load this assessment. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Card className={cn(overdue && !chargeSettled && "border-destructive ring-1 ring-destructive")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {isFinal ? (
                <Trophy className="h-4 w-4 text-primary" />
              ) : isTest ? (
                <ClipboardList className="h-4 w-4 text-primary" />
              ) : (
                <FolderGit2 className="h-4 w-4 text-primary" />
              )}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {isFinal ? "Final project" : isTest ? "Summative test" : data.type}
                </Badge>
                <span className="text-xs text-muted-foreground">Week {data.weekNumber}</span>
                {data.gradeWeight > 0 && (
                  <span className="text-xs font-medium text-primary">{data.gradeWeight}%</span>
                )}
              </div>
              <CardTitle className="text-lg leading-snug">{data.title}</CardTitle>
              {(estimatedMinutes || dueDate || data.submittedAt) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {estimatedMinutes ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Est. {formatDuration(estimatedMinutes)}
                    </span>
                  ) : null}
                  {dueDate ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        overdue && !chargeSettled && "font-medium text-destructive",
                      )}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      {overdue && !chargeSettled ? "Was due" : "Due"} {formatDueDate(dueDate)}
                    </span>
                  ) : null}
                  {data.submittedAt ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Submitted {formatDueDate(new Date(data.submittedAt))}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {isGraded && <Badge className="text-sm">{data.score}%</Badge>}
            {overdue && !chargeSettled && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
        </div>
        {data.description && <CardDescription className="pt-2">{data.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {outstandingCharge && <LateFeeFlow assessmentId={data.id} passesRemaining={passesRemaining} />}
        {chargeSettled && <LateFeePaid />}

        {!open && (
          <Button variant={isGraded ? "outline" : "default"} className="self-start" onClick={handleOpen}>
            {isGraded ? "Review" : isTest ? "Start test" : "View project"}
          </Button>
        )}

        {open && (
          <div className="flex flex-col gap-4">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isTest ? "Preparing your test…" : "Writing the project brief…"}
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {Boolean(data.questions) && !loading && isTest && (
              <TestRunner
                assessmentId={data.id}
                questions={data.questions as TestQuestion[]}
                initialScore={isGraded ? data.score : null}
                onGraded={(score) => setData((d) => ({ ...d, status: "graded", score }))}
              />
            )}

            {Boolean(data.questions) && !loading && !isTest && (
              <ProjectRunner
                assessmentId={data.id}
                brief={data.questions as ProjectBrief}
                initialSubmission={data.submission}
                initialScore={isGraded ? data.score : null}
                initialFeedback={data.feedback}
                onGraded={(score, feedback, submission) =>
                  setData((d) => ({ ...d, status: "graded", score, feedback, submission }))
                }
              />
            )}

            <Button variant="ghost" size="sm" className="self-start" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TestRunner({
  assessmentId,
  questions,
  initialScore,
  onGraded,
}: {
  assessmentId: number
  questions: TestQuestion[]
  initialScore: number | null
  onGraded: (score: number) => void
}) {
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(initialScore !== null)
  const [score, setScore] = useState<number | null>(initialScore)
  const [saving, setSaving] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  function handleSubmit() {
    const correct = questions.reduce(
      (acc, q, i) => acc + (selected[i] === q.answerIndex ? 1 : 0),
      0,
    )
    const pct = Math.round((correct / questions.length) * 100)
    setScore(pct)
    setSubmitted(true)
    setSaving(true)
    submitTest(assessmentId, pct).finally(() => {
      setSaving(false)
      // Show review options for summative tests
      if (initialScore === null) {
        // Only show for new submissions, not for already-graded tests
        setTimeout(() => setShowReviewModal(true), 500)
      }
    })
    onGraded(pct)
  }

  const allAnswered = questions.every((_, i) => selected[i] !== undefined)

  return (
    <div className="flex flex-col gap-5">
      {submitted && score !== null && (
        <div className="rounded-lg bg-secondary px-4 py-3">
          <p className="font-medium text-foreground">
            You scored {score}% ({questions.filter((q, i) => selected[i] === q.answerIndex).length}/
            {questions.length} correct)
          </p>
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={qi} className="flex flex-col gap-2">
          <p className="font-medium text-foreground">
            {qi + 1}. {q.question}
          </p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, oi) => {
              const chosen = selected[qi] === oi
              const correct = q.answerIndex === oi
              const showResult = submitted
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelected((s) => ({ ...s, [qi]: oi }))}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    !showResult && chosen && "border-primary bg-primary/5",
                    !showResult && !chosen && "hover:bg-secondary",
                    showResult && correct && "border-primary bg-primary/10",
                    showResult && chosen && !correct && "border-destructive bg-destructive/10",
                  )}
                >
                  {showResult && correct && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  {showResult && chosen && !correct && <X className="h-4 w-4 shrink-0 text-destructive" />}
                  <span className="text-foreground">{opt}</span>
                </button>
              )
            })}
          </div>
          {submitted && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{q.explanation}</p>
          )}
        </div>
      ))}

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!allAnswered || saving} className="self-start">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit test
        </Button>
      )}

      {submitted && score !== null && (
        <ReviewOptionsModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          assessment={
            {
              id: assessmentId,
              score,
              courseId: 0,
              userId: "",
              type: "test",
              title: "",
              status: "submitted",
              weekNumber: 0,
              category: "summative",
              gradeWeight: 0,
              description: null,
              moduleId: null,
              questions: null,
              submission: null,
              fileName: null,
              feedback: null,
              submittedAt: new Date(),
              deadline: null,
              extensionDays: 0,
              lateChargePaid: false,
              lateChargeWaived: false,
              reviewType: null,
              tutorId: null,
              tutorMarkingTier: null,
              tutorMarkingFeeCents: null,
              tutorMarkingFeedback: null,
              tutorSessionId: null,
              createdAt: new Date(),
            } as unknown as Assessment
          }
        />
      )}
    </div>
  )
}

function ProjectRunner({
  assessmentId,
  brief,
  initialSubmission,
  initialScore,
  initialFeedback,
  onGraded,
}: {
  assessmentId: number
  brief: ProjectBrief
  initialSubmission: string | null
  initialScore: number | null
  initialFeedback: string | null
  onGraded: (score: number, feedback: string, submission: string) => void
}) {
  const [submission, setSubmission] = useState(initialSubmission ?? "")
  const [score, setScore] = useState<number | null>(initialScore)
  const [feedback, setFeedback] = useState<string | null>(initialFeedback)
  const [grading, setGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const graded = score !== null

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const { fileName: name, text } = await extractDocxText(formData)
      setSubmission((prev) => (prev.trim() ? `${prev}\n\n${text}` : text))
      setFileName(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that Word document.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleSubmit() {
    if (!submission.trim()) {
      setError("Please write or upload your submission before submitting.")
      return
    }
    setError(null)
    setGrading(true)
    try {
      const result = await submitProject(assessmentId, submission, fileName ?? undefined)
      setScore(result.score)
      setFeedback(result.feedback)
      onGraded(result.score, result.feedback, submission)
    } catch {
      setError("Could not grade your submission. Please try again.")
    } finally {
      setGrading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {brief.brief && <Markdown>{brief.brief}</Markdown>}

      {brief.requirements?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">Requirements</h4>
          <ul className="ml-5 list-disc space-y-1 text-sm text-foreground/90">
            {brief.requirements.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {brief.rubric?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">How it&apos;s evaluated</h4>
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
            {brief.rubric.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground">Your submission</h4>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="sr-only"
            onChange={handleFile}
            aria-label="Upload a Word document"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || grading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Upload Word doc
          </Button>
        </div>
        {fileName && (
          <p className="text-xs text-muted-foreground">
            Loaded from <span className="font-medium text-foreground">{fileName}</span>. You can edit the text below before submitting.
          </p>
        )}
        <Textarea
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
          placeholder="Describe what you built, paste your work, link to it, or upload a Word (.docx) file…"
          rows={6}
          disabled={grading}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {graded && feedback && (
        <div className="flex flex-col gap-2 rounded-lg bg-secondary px-4 py-3">
          <p className="font-medium text-foreground">Score: {score}%</p>
          <Markdown>{feedback}</Markdown>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={grading} className="self-start">
        {grading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reviewing…
          </>
        ) : graded ? (
          "Resubmit for review"
        ) : (
          "Submit for review"
        )}
      </Button>
    </div>
  )
}
