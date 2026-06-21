"use client"

import { useState } from "react"
import type { Lesson, FormativeQuestion } from "@/lib/types"
import { getLessonStudy, submitFormative, toggleLessonComplete } from "@/app/actions/courses"
import { Markdown } from "@/components/markdown"
import { InteractiveRenderer, type InteractiveElement } from "@/components/interactive/interactive-renderer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, ChevronDown, Clock, Loader2, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type Study = {
  content: string
  formativeQuestions: FormativeQuestion[]
  formativeCompleted: boolean
  formativeScore: number | null
  formativeFeedback: string | null
  imageUrl: string | null
  imageCaption: string | null
  interactiveElements: InteractiveElement[] | null
}

export function LessonItem({
  lesson,
  onToggle,
}: {
  lesson: Lesson
  onToggle: (id: number, completed: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [study, setStudy] = useState<Study | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Learner's in-progress answers.
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({})
  const [openAnswers, setOpenAnswers] = useState<Record<number, string>>({})
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null)

  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next && !study) {
      setLoading(true)
      setError(null)
      try {
        const s = await getLessonStudy(lesson.id)
        setStudy({
          content: s.content,
          formativeQuestions: s.formativeQuestions ?? [],
          formativeCompleted: s.formativeCompleted,
          formativeScore: s.formativeScore,
          formativeFeedback: s.formativeFeedback,
          imageUrl: s.imageUrl,
          imageCaption: s.imageCaption,
          interactiveElements: (s.interactiveElements as InteractiveElement[] | null) ?? null,
        })
        if (s.formativeCompleted && s.formativeScore != null) {
          setResult({ score: s.formativeScore, feedback: s.formativeFeedback ?? "" })
        }
      } catch {
        setError("Could not load this lesson. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  async function handleSubmitFormative() {
    setGrading(true)
    try {
      const res = await submitFormative(lesson.id, { mcqAnswers, openAnswers })
      setResult(res)
      onToggle(lesson.id, true)
    } catch {
      setError("Could not submit your answers. Please try again.")
    } finally {
      setGrading(false)
    }
  }

  async function handleUncomplete() {
    onToggle(lesson.id, false)
    setResult(null)
    await toggleLessonComplete(lesson.id, false)
  }

  const questions = study?.formativeQuestions ?? []
  const allAnswered =
    questions.length > 0 &&
    questions.every((q, i) =>
      q.kind === "mcq" ? mcqAnswers[i] !== undefined : (openAnswers[i]?.trim().length ?? 0) > 0,
    )

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span
          aria-hidden
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            lesson.completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40",
          )}
        >
          {lesson.completed && <Check className="h-3 w-3" />}
        </span>

        <button type="button" onClick={handleOpen} className="flex flex-1 items-center justify-between gap-2 text-left">
          <div className="flex flex-col">
            <span className={cn("text-sm font-medium text-foreground", lesson.completed && "opacity-70")}>
              {lesson.title}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {lesson.durationMinutes} min
              {lesson.completed && lesson.formativeScore != null && (
                <span className="ml-2 text-primary">Formative: {lesson.formativeScore}%</span>
              )}
            </span>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="border-t px-4 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing your lesson…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {study && !loading && (
            <div className="flex flex-col gap-5">
              {/* Lesson image */}
              {study.imageUrl && (
                <figure className="flex flex-col gap-2">
                  <img src={study.imageUrl} alt={study.imageCaption || "Lesson image"} className="w-full rounded-lg border object-cover" />
                  {study.imageCaption && <figcaption className="text-sm text-muted-foreground">{study.imageCaption}</figcaption>}
                </figure>
              )}

              <Markdown>{study.content}</Markdown>

              {/* Interactive elements */}
              {Array.isArray(study.interactiveElements) && study.interactiveElements.length > 0 && (
                <InteractiveRenderer elements={study.interactiveElements as InteractiveElement[]} />
              )}

              {/* Formative check */}
              <div className="rounded-lg border bg-secondary/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Formative check</h4>
                  <span className="text-xs text-muted-foreground">Complete this to finish the lesson</span>
                </div>

                {result ? (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-md bg-card p-3">
                      <Markdown>{result.feedback}</Markdown>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                        <Check className="h-4 w-4" />
                        Lesson complete
                      </span>
                      <Button size="sm" variant="ghost" onClick={handleUncomplete}>
                        Retake
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {questions.map((q, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {i + 1}. {q.question}
                        </p>
                        {q.kind === "mcq" && q.options ? (
                          <div className="flex flex-col gap-1.5">
                            {q.options.map((opt, oi) => {
                              const selected = mcqAnswers[i] === oi
                              return (
                                <button
                                  key={oi}
                                  type="button"
                                  onClick={() => setMcqAnswers((a) => ({ ...a, [i]: oi }))}
                                  className={cn(
                                    "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                                    selected
                                      ? "border-primary bg-primary/5 text-foreground"
                                      : "border-border bg-card text-foreground hover:bg-secondary",
                                  )}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <Textarea
                            rows={3}
                            placeholder="Type your answer…"
                            value={openAnswers[i] || ""}
                            onChange={(e) => setOpenAnswers((a) => ({ ...a, [i]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      size="sm"
                      className="self-start"
                      onClick={handleSubmitFormative}
                      disabled={!allAnswered || grading}
                    >
                      {grading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Marking…
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Submit & complete lesson
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
