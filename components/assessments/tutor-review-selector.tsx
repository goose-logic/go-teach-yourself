"use client"

import { useState } from "react"
import type { Assessment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { selectTutorMarking, selectTutorPlusSession } from "@/app/actions/reviews"
import { SPECIALISTS } from "@/lib/specialists"
import { TutorPaymentFlow } from "@/components/assessments/tutor-payment-flow"

type ReviewType = "tutor_marking" | "tutor_plus_session"
type Tier = "standard" | "premium" | "expert"

const tierPrices: Record<Tier, number> = {
  standard: 15,
  premium: 25,
  expert: 40,
}

const tierDescriptions: Record<Tier, string> = {
  standard: "Basic feedback on strengths and areas to improve",
  premium: "Detailed analysis with learning recommendations",
  expert: "In-depth review with advanced guidance",
}

export function TutorReviewSelector({
  assessment,
  onBack,
  onClose,
}: {
  assessment: Assessment
  onBack: () => void
  onClose: () => void
}) {
  const [step, setStep] = useState<"type" | "tier" | "tutor" | "payment">("type")
  const [reviewType, setReviewType] = useState<ReviewType>("tutor_marking")
  const [selectedTier, setSelectedTier] = useState<Tier>("standard")
  const [selectedTutor, setSelectedTutor] = useState<string>(SPECIALISTS[0]?.id || "")
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    if (step === "type") {
      setStep("tier")
    } else if (step === "tier") {
      setStep("tutor")
    } else if (step === "tutor") {
      setStep("payment")
    }
  }

  const handleBack = () => {
    if (step === "type") {
      onBack()
    } else if (step === "tier") {
      setStep("type")
    } else if (step === "tutor") {
      setStep("tier")
    } else if (step === "payment") {
      setStep("tutor")
    }
  }

  const tierPrice = tierPrices[selectedTier]
  const tutor = SPECIALISTS.find((s) => s.id === selectedTutor)

  return (
    <>
      {step === "type" && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold">Select Review Type</h3>
            <p className="text-sm text-muted-foreground">Choose tutor marking only or marking + tutorial session</p>
          </div>

          <div className="space-y-4 py-6">
            {/* Tutor Marking Only */}
            <label className="flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all hover:bg-secondary/50"
              style={{
                borderColor: reviewType === "tutor_marking" ? "hsl(var(--primary))" : "hsl(var(--border))",
                backgroundColor: reviewType === "tutor_marking" ? "hsl(var(--secondary))" : "transparent",
              }}
            >
              <input
                type="radio"
                checked={reviewType === "tutor_marking"}
                onChange={() => setReviewType("tutor_marking")}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium">Tutor Marking Only</p>
                <p className="mt-1 text-sm text-muted-foreground">Get detailed written feedback on your test. Perfect for focused review of your performance.</p>
              </div>
            </label>

            {/* Tutor + Session */}
            <label className="flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all hover:bg-secondary/50"
              style={{
                borderColor: reviewType === "tutor_plus_session" ? "hsl(var(--primary))" : "hsl(var(--border))",
                backgroundColor: reviewType === "tutor_plus_session" ? "hsl(var(--secondary))" : "transparent",
              }}
            >
              <input
                type="radio"
                checked={reviewType === "tutor_plus_session"}
                onChange={() => setReviewType("tutor_plus_session")}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Tutor Marking + Tutorial Session</p>
                  <Badge variant="secondary" className="text-xs">
                    RECOMMENDED
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Get marking plus a 1-on-1 session to discuss your work. Ideal for deeper learning.</p>
              </div>
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              Continue
            </Button>
          </div>
        </>
      )}

      {step === "tier" && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold">Select Tutor Tier</h3>
            <p className="text-sm text-muted-foreground">Choose the level of detail you'd like in your review</p>
          </div>

          <div className="space-y-3 py-6">
            {(Object.keys(tierPrices) as Tier[]).map((tier) => (
              <label key={tier} className="flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all hover:bg-secondary/50"
                style={{
                  borderColor: selectedTier === tier ? "hsl(var(--primary))" : "hsl(var(--border))",
                  backgroundColor: selectedTier === tier ? "hsl(var(--secondary))" : "transparent",
                }}
              >
                <input
                  type="radio"
                  checked={selectedTier === tier}
                  onChange={() => setSelectedTier(tier)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium capitalize">{tier}</p>
                    <Badge variant="secondary" className="text-xs">
                      ${tierPrices[tier]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{tierDescriptions[tier]}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              Continue
            </Button>
          </div>
        </>
      )}

      {step === "tutor" && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold">Select Your Tutor</h3>
            <p className="text-sm text-muted-foreground">Choose which tutor you'd like to review your work</p>
          </div>

          <div className="space-y-3 py-6 max-h-64 overflow-y-auto">
            {SPECIALISTS.map((specialist: any) => (
              <label key={specialist.id} className="flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all hover:bg-secondary/50"
                style={{
                  borderColor: selectedTutor === specialist.id ? "hsl(var(--primary))" : "hsl(var(--border))",
                  backgroundColor: selectedTutor === specialist.id ? "hsl(var(--secondary))" : "transparent",
                }}
              >
                <input
                  type="radio"
                  checked={selectedTutor === specialist.id}
                  onChange={() => setSelectedTutor(specialist.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{specialist.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {specialist.expertise}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{specialist.bio}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              Continue to Payment
            </Button>
          </div>
        </>
      )}

      {step === "payment" && tutor && (
        <TutorPaymentFlow
          assessment={assessment}
          tutor={tutor}
          tier={selectedTier}
          price={tierPrice}
          reviewType={reviewType}
          onBack={handleBack}
          onSuccess={onClose}
        />
      )}
    </>
  )
}
