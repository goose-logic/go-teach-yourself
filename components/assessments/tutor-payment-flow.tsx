"use client"

import { useState } from "react"
import type { Assessment } from "@/lib/types"
import type { Specialist } from "@/lib/specialists"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { selectTutorMarking, selectTutorPlusSession } from "@/app/actions/reviews"

type ReviewType = "tutor_marking" | "tutor_plus_session"
type Tier = "standard" | "premium" | "expert"

export function TutorPaymentFlow({
  assessment,
  tutor,
  tier,
  price,
  reviewType,
  onBack,
  onSuccess,
}: {
  assessment: Assessment
  tutor: Specialist
  tier: Tier
  price: number
  reviewType: ReviewType
  onBack: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<"review" | "payment" | "success">("review")
  const [formData, setFormData] = useState({
    name: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  })
  const [loading, setLoading] = useState(false)

  const isFormValid = formData.name && formData.cardNumber && formData.expiry && formData.cvc

  async function handlePayment() {
    try {
      setLoading(true)
      if (reviewType === "tutor_marking") {
        await selectTutorMarking(assessment.id, tutor.id, tier)
      } else {
        // For tutor_plus_session, we'd need a booking ID - for demo, use 0
        await selectTutorPlusSession(assessment.id, tutor.id, tier, 0)
      }
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setStep("success")
    } catch (error) {
      console.error("Payment failed:", error)
    } finally {
      setLoading(false)
    }
  }

  if (step === "review") {
    return (
      <>
        <div className="mb-4">
          <h3 className="font-semibold">Review Order</h3>
          <p className="text-sm text-muted-foreground">Confirm your tutor review selection</p>
        </div>

        <div className="space-y-4 py-6">
          {/* Order Summary */}
          <div className="rounded-lg border bg-secondary/30 p-4">
            <p className="text-sm font-medium text-muted-foreground">Order Summary</p>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Review Type</span>
                <span className="font-medium capitalize">
                  {reviewType === "tutor_marking" ? "Tutor Marking" : "Tutor + Session"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tier</span>
                <span className="font-medium capitalize">{tier}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tutor</span>
                <span className="font-medium">{tutor.name}</span>
              </div>

              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">${price}.00</span>
              </div>
            </div>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground">
            This is a demo payment flow — no real card is charged. After confirmation, your tutor will review your test and provide feedback.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setStep("payment")} className="flex-1">
            Continue to Payment
          </Button>
        </div>
      </>
    )
  }

  if (step === "payment") {
    return (
      <>
        <div className="mb-4">
          <h3 className="font-semibold">Payment Details</h3>
          <p className="text-sm text-muted-foreground">Enter your payment information</p>
        </div>

        <div className="space-y-4 py-6">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Card Number</label>
            <Input
              placeholder="4242 4242 4242 4242"
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
              className="mt-1.5 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Expiry</label>
              <Input
                placeholder="MM/YY"
                value={formData.expiry}
                onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                className="mt-1.5 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CVC</label>
              <Input
                placeholder="123"
                value={formData.cvc}
                onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                className="mt-1.5 font-mono"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Demo payment flow — no real charges. Use any test card details.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("review")} className="flex-1" disabled={loading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handlePayment} disabled={!isFormValid || loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${price}.00`
            )}
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-4">
        <h3 className="font-semibold">Review Confirmed</h3>
        <p className="text-sm text-muted-foreground">Your tutor review has been ordered</p>
      </div>

      <div className="space-y-6 py-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-50 p-4 dark:bg-green-950/20">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tutor Assigned</p>
            <p className="mt-1 font-medium">{tutor.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Review Type</p>
            <p className="mt-1 font-medium capitalize">
              {reviewType === "tutor_marking" ? "Tutor Marking" : "Tutor + Tutorial Session"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
            <p className="mt-1 text-lg font-bold">${price}.00</p>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">What Happens Next?</p>
          <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            {tutor.name} will review your test within 2-3 business days and provide detailed feedback. You'll receive a notification when your feedback is ready.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onSuccess} className="flex-1">
          Done
        </Button>
      </div>
    </>
  )
}
