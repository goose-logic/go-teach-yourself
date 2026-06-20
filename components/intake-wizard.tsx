"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { fetchQuestions, createCourse } from "@/app/actions/courses"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react"

type Question = {
  id: string
  question: string
  helper: string | null
  options: string[]
  allowCustom: boolean
}

type Step = "topic" | "questions" | "pace" | "generating"

export function IntakeWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("topic")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [subject, setSubject] = useState("")
  const [goal, setGoal] = useState("")

  const [questions, setQuestions] = useState<Question[]>([])
  // Selected option label per question (may be "All of the above" or "Other").
  const [answers, setAnswers] = useState<Record<string, string>>({})
  // Free text entered when "Other" is chosen.
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})

  const [pace, setPace] = useState<"full_time" | "part_time">("part_time")
  const [hoursPerWeek, setHoursPerWeek] = useState(6)
  const [totalWeeks, setTotalWeeks] = useState(4)

  const LENGTH_OPTIONS = [
    { label: "2 weeks", weeks: 2 },
    { label: "4 weeks", weeks: 4 },
    { label: "6 weeks", weeks: 6 },
    { label: "3 months", weeks: 12 },
  ]

  // Resolve the final answer text for a question, expanding the special options.
  function resolveAnswer(q: Question): string {
    const selected = answers[q.id]
    if (!selected) return "No preference"
    if (selected === "All of the above") {
      return `All of the above (${q.options.join(", ")})`
    }
    if (selected === "Other") {
      return customAnswers[q.id]?.trim() || "Other"
    }
    return selected
  }

  async function handleTopicNext() {
    if (!subject.trim()) {
      setError("Please tell us what you'd like to learn.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const qs = await fetchQuestions(subject, goal)
      setQuestions(qs)
      setStep("questions")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate questions.")
    } finally {
      setLoading(false)
    }
  }

  function handleGenerate() {
    setError(null)
    setStep("generating")
    setLoading(true)
    const payload = {
      subject,
      goal,
      pace,
      hoursPerWeek,
      totalWeeks,
      answers: questions.map((q) => ({
        question: q.question,
        answer: resolveAnswer(q),
      })),
    }
    createCourse(payload)
      .then((courseId) => {
        router.push(`/course/${courseId}`)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not create your course.")
        setStep("pace")
        setLoading(false)
      })
  }

  const progress =
    step === "topic" ? 25 : step === "questions" ? 55 : step === "pace" ? 85 : 100

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Design your course</span>
        </div>
        <Progress value={progress} />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {step === "topic" && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to learn?</CardTitle>
            <CardDescription>
              Be as specific or broad as you like. Go Teach Yourself will ask a few questions next.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Modern web development with React"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal">
                Your goal <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Build and ship my own SaaS app within 3 months"
                rows={3}
              />
            </div>
            <Button onClick={handleTopicNext} disabled={loading} className="self-end">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "questions" && (
        <Card>
          <CardHeader>
            <CardTitle>A few questions</CardTitle>
            <CardDescription>
              Your answers help Go Teach Yourself tailor the curriculum to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {questions.map((q) => (
              <div key={q.id} className="flex flex-col gap-3">
                <div>
                  <p className="font-medium text-foreground">{q.question}</p>
                  {q.helper && <p className="text-sm text-muted-foreground">{q.helper}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...q.options, "All of the above", "Other"].map((opt) => {
                    const selected = answers[q.id] === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={
                          "rounded-full border px-4 py-2 text-sm transition-colors " +
                          (selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:bg-secondary")
                        }
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {answers[q.id] === "Other" && (
                  <Input
                    placeholder="Tell us more…"
                    autoFocus
                    value={customAnswers[q.id] || ""}
                    onChange={(e) =>
                      setCustomAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("topic")}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep("pace")}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "pace" && (
        <Card>
          <CardHeader>
            <CardTitle>How do you want to study?</CardTitle>
            <CardDescription>This shapes your timetable and total length.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <RadioGroup
              value={pace}
              onValueChange={(v) => {
                const next = v as "full_time" | "part_time"
                setPace(next)
                setHoursPerWeek(next === "full_time" ? 30 : 6)
              }}
              className="grid gap-3"
            >
              <Label
                htmlFor="part_time"
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="part_time" id="part_time" className="mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">Part time</span>
                  <span className="text-sm text-muted-foreground">
                    A lighter, longer schedule that fits around work or study.
                  </span>
                </div>
              </Label>
              <Label
                htmlFor="full_time"
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="full_time" id="full_time" className="mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">Full time</span>
                  <span className="text-sm text-muted-foreground">
                    An intensive schedule to learn as fast as possible.
                  </span>
                </div>
              </Label>
            </RadioGroup>

            <div className="flex flex-col gap-2">
              <Label htmlFor="hours">Hours per week: {hoursPerWeek}</Label>
              <input
                id="hours"
                type="range"
                min={2}
                max={40}
                step={1}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2h</span>
                <span>40h</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>How long would you like your course to be?</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LENGTH_OPTIONS.map((opt) => {
                  const selected = totalWeeks === opt.weeks
                  return (
                    <button
                      key={opt.weeks}
                      type="button"
                      onClick={() => setTotalWeeks(opt.weeks)}
                      className={
                        "rounded-lg border px-4 py-3 text-sm font-medium transition-colors " +
                        (selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary")
                      }
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("questions")}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleGenerate}>
                <Sparkles className="h-4 w-4" />
                Generate my course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "generating" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div>
              <p className="text-lg font-medium text-foreground">Building your course…</p>
              <p className="text-sm text-muted-foreground">
                Go Teach Yourself is designing your curriculum, timetable, tests, and projects. This can take up to a minute.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
