"use client"

import { useState, useEffect } from "react"
import type { Assessment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react"

export function AIReviewSimulator({
  assessment,
  onBack,
  onClose,
}: {
  assessment: Assessment
  onBack: () => void
  onClose: () => void
}) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    // Simulate AI processing delay
    const timer = setTimeout(() => {
      setIsProcessing(false)
      setShowFeedback(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Generate feedback based on score
  const getFeedback = () => {
    if (!assessment.score) return "Assessment review in progress..."
    if (assessment.score >= 85) {
      return "Excellent work! Your answers demonstrate a strong understanding of the material. Well done on this assessment."
    } else if (assessment.score >= 70) {
      return "Good effort. You've shown solid comprehension of key concepts. Review the areas where you lost points to strengthen your knowledge."
    } else {
      return "There's room for improvement. I recommend reviewing the core concepts covered in this module and attempting similar practice questions before retaking."
    }
  }

  return (
    <>
      <div className="mb-4">
        <h3 className="font-semibold">AI Review</h3>
        <p className="text-sm text-muted-foreground">Your assessment is being reviewed by our AI system</p>
      </div>

      <div>
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="rounded-full bg-primary/10 p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Analyzing your responses...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Badge */}
            {assessment.score && (
              <div className="flex items-center justify-center">
                <div className="rounded-lg bg-secondary/50 px-6 py-4 text-center">
                  <p className="text-sm text-muted-foreground">Your Score</p>
                  <p className="mt-2 text-4xl font-bold">{assessment.score}%</p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Review complete</p>
            </div>

            {/* Feedback */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Feedback</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{getFeedback()}</p>
            </div>

            {/* Next Steps */}
            <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">What's Next?</p>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                {assessment.score && assessment.score >= 70
                  ? "Great job! Move on to the next module or revisit any topics you'd like to strengthen."
                  : "Consider scheduling a tutor session for personalized feedback and support."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onClose} className="flex-1">
          Done
        </Button>
      </div>
    </>
  )
}
