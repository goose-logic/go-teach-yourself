"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface QuizConfig {
  id: string
  title: string
  description?: string
  questions: QuizQuestion[]
}

export interface QuizState {
  selectedAnswers: Record<string, number | null>
  completed: boolean
  score: number
}

export function QuizAsYouGo({
  config,
  onComplete,
  initialState,
}: {
  config: QuizConfig
  onComplete?: (state: QuizState) => void
  initialState?: QuizState
}) {
  const [state, setState] = useState<QuizState>(
    initialState || {
      selectedAnswers: {},
      completed: false,
      score: 0,
    },
  )

  const answeredCount = Object.values(state.selectedAnswers).filter(
    (a) => a !== null && a !== undefined,
  ).length
  const allAnswered = answeredCount === config.questions.length

  function handleSelectAnswer(questionId: string, optionIndex: number) {
    setState((prev) => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [questionId]: optionIndex,
      },
    }))
  }

  function handleSubmit() {
    const correct = config.questions.filter(
      (q) => state.selectedAnswers[q.id] === q.correctIndex,
    ).length
    const score = Math.round((correct / config.questions.length) * 100)
    const completed: QuizState = {
      ...state,
      completed: true,
      score,
    }
    setState(completed)
    onComplete?.(completed)
  }

  if (state.completed) {
    return (
      <div className="space-y-6 rounded-lg border bg-card p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{config.title} — Complete</h3>
          <p className="text-4xl font-bold text-primary mt-3">{state.score}%</p>
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round((state.score / 100) * config.questions.length)} of{" "}
            {config.questions.length} correct
          </p>
        </div>

        {/* Review answers */}
        <div className="space-y-4 border-t pt-6">
          <h4 className="font-semibold text-sm">Review Your Answers</h4>
          {config.questions.map((q, idx) => {
            const selectedIndex = state.selectedAnswers[q.id]
            const isCorrect = selectedIndex === q.correctIndex
            return (
              <div
                key={q.id}
                className={cn(
                  "p-3 rounded border",
                  isCorrect
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your answer: <strong>{q.options[selectedIndex || 0]}</strong>
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Correct answer: <strong>{q.options[q.correctIndex]}</strong>
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">{q.explanation}</p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold">{config.title}</h3>
        {config.description && (
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {config.questions.map((question, idx) => {
          const selectedIndex = state.selectedAnswers[question.id]
          const isAnswered = selectedIndex !== null && selectedIndex !== undefined
          const isCorrect = selectedIndex === question.correctIndex

          return (
            <div key={question.id} className="space-y-3 pb-4 border-b last:border-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {idx + 1}. {question.question}
                </h4>
                {isAnswered && (
                  <Badge variant="outline" className="ml-2">
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {question.options.map((option, optIdx) => {
                  let bgClass = "bg-background hover:bg-secondary/50 cursor-pointer"

                  if (isAnswered) {
                    if (selectedIndex === optIdx && isCorrect) {
                      bgClass = "bg-green-100 dark:bg-green-950 border-green-500"
                    } else if (selectedIndex === optIdx && !isCorrect) {
                      bgClass = "bg-red-100 dark:bg-red-950 border-red-500"
                    } else if (optIdx === question.correctIndex && !isCorrect) {
                      bgClass = "bg-green-50 dark:bg-green-950/30 border-green-500"
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectAnswer(question.id, optIdx)}
                      disabled={isAnswered}
                      className={cn(
                        "w-full text-left p-3 rounded border transition-all flex items-center gap-3",
                        bgClass,
                        selectedIndex === optIdx && "border-2",
                      )}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-semibold",
                          selectedIndex === optIdx
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground",
                        )}
                      >
                        {selectedIndex === optIdx && isAnswered && (
                          isCorrect ? "✓" : "✗"
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                    </button>
                  )
                })}
              </div>

              {isAnswered && (
                <div
                  className={cn(
                    "p-3 rounded text-sm",
                    isCorrect
                      ? "bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800",
                  )}
                >
                  {isCorrect ? "Correct!" : "Incorrect."} {question.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress and Submit */}
      <div className="space-y-3 border-t pt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Progress: {answeredCount} of {config.questions.length} answered
          </span>
          <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(answeredCount / config.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!allAnswered} className="w-full">
          {allAnswered ? "Submit Quiz" : `Answer ${config.questions.length - answeredCount} more`}
        </Button>
      </div>
    </div>
  )
}
