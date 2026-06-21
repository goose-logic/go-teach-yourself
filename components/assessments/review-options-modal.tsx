"use client"

import { useEffect, useState } from "react"
import type { Assessment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Brain, Users, Zap, X, CheckCircle2 } from "lucide-react"
import { selectAIReview } from "@/app/actions/reviews"
import { AIReviewSimulator } from "@/components/assessments/ai-review-simulator"
import { TutorReviewSelector } from "@/components/assessments/tutor-review-selector"

export function ReviewOptionsModal({
  open,
  onOpenChange,
  assessment,
  noun = "test",
  onAIReview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: Assessment
  // What to call the work being reviewed, e.g. "test" or "project".
  noun?: string
  // Optional custom AI-review handler. When provided (e.g. for projects), the AI
  // option runs this real grading instead of the simulated test feedback.
  onAIReview?: () => Promise<void>
}) {
  const [step, setStep] = useState<"select" | "ai" | "tutor">("select")
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Always start on the choice screen each time the modal is opened, so reopening
  // it (e.g. to add a tutor review after an AI mark) doesn't show a stale step.
  useEffect(() => {
    if (open) setStep("select")
  }, [open])

  async function handleSelectAI() {
    // Project path: run the real AI grading provided by the parent.
    if (onAIReview) {
      setStep("ai")
      setAiLoading(true)
      try {
        await onAIReview()
      } catch (error) {
        console.error("Failed to run AI review:", error)
      } finally {
        setAiLoading(false)
      }
      return
    }
    // Test path: mark the assessment for AI review and show the simulator.
    try {
      setLoading(true)
      await selectAIReview(assessment.id)
      setStep("ai")
    } catch (error) {
      console.error("Failed to select AI review:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectTutor() {
    setStep("tutor")
  }

  function handleBack() {
    if (step === "ai" || step === "tutor") {
      setStep("select")
    }
  }

  const handleClose = () => {
    if (step === "select") {
      onOpenChange(false)
    } else {
      handleBack()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border bg-background shadow-lg">
        <div className="p-6">
          {step === "select" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">How would you like your {noun} reviewed?</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose between a free AI review or get personalized feedback from an expert tutor
                  </p>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 py-6">
                {/* AI Review Option */}
                <button
                  onClick={handleSelectAI}
                  disabled={loading}
                  className="flex items-start gap-4 rounded-lg border-2 border-transparent bg-secondary/50 p-4 transition-all hover:border-primary hover:bg-secondary/80 disabled:opacity-50"
                >
                  <div className="mt-1">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">AI Review</h3>
                      <Badge variant="secondary" className="text-xs">
                        FREE
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get instant feedback powered by AI. Great for quick insights on your performance.
                    </p>
                  </div>
                  {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </button>

                {/* Tutor Marking Option */}
                <button
                  onClick={handleSelectTutor}
                  className="flex items-start gap-4 rounded-lg border-2 border-transparent bg-secondary/50 p-4 transition-all hover:border-primary hover:bg-secondary/80"
                >
                  <div className="mt-1">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Tutor Marking</h3>
                      <Badge variant="secondary" className="text-xs">
                        PAID
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Expert tutor reviews your work with detailed feedback. Available in 3 tiers: Standard ($15), Premium ($25), Expert ($40).
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                </button>

                {/* Tutor + Session Option */}
                <button
                  onClick={handleSelectTutor}
                  className="flex items-start gap-4 rounded-lg border-2 border-transparent bg-secondary/50 p-4 transition-all hover:border-primary hover:bg-secondary/80"
                >
                  <div className="mt-1">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Tutor + Tutorial Session</h3>
                      <Badge variant="secondary" className="text-xs">
                        PAID
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get tutor marking plus a 1-on-1 tutorial session to discuss your performance and improve.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                </button>
              </div>
            </>
          )}

          {step === "ai" && onAIReview && (
            <div>
              <div className="mb-4">
                <h3 className="font-semibold">AI Review</h3>
                <p className="text-sm text-muted-foreground">
                  Your {noun} is being marked by our AI system
                </p>
              </div>
              {aiLoading ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Analyzing your submission…</p>
                </div>
              ) : (
                <div className="space-y-6 py-2">
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Review complete — your score and feedback are shown below.
                    </p>
                  </div>
                  <Button onClick={() => onOpenChange(false)} className="w-full">
                    Done
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "ai" && !onAIReview && (
            <AIReviewSimulator
              assessment={assessment}
              onBack={handleBack}
              onClose={() => onOpenChange(false)}
            />
          )}

          {step === "tutor" && (
            <TutorReviewSelector
              assessment={assessment}
              onBack={handleBack}
              onClose={() => onOpenChange(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
