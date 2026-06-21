"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { payLateFee, requestExtension } from "@/app/actions/accountability"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatFee, LATE_FEE_CENTS } from "@/lib/deadlines"
import { AlertTriangle, CalendarPlus, CheckCircle2, CreditCard, Loader2, Lock } from "lucide-react"

/**
 * Inline missed-deadline charge panel. Mirrors the marketplace booking payment
 * flow: a flat late fee that can be paid with a (mock) card, or waived by
 * spending one of the course's extension passes.
 */
export function LateFeeFlow({
  assessmentId,
  passesRemaining,
  lateFeeCents = LATE_FEE_CENTS,
}: {
  assessmentId: number
  passesRemaining: number
  lateFeeCents?: number
}) {
  const router = useRouter()
  const [mode, setMode] = useState<"notice" | "pay">("notice")
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [processing, setProcessing] = useState(false)
  const [extending, setExtending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const digits = cardNumber.replace(/\D/g, "")
  const cardValid =
    cardName.trim().length > 1 && digits.length >= 15 && /^\d{2}\/\d{2}$/.test(expiry) && cvc.length >= 3

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4)
    return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`
  }

  async function handlePay() {
    if (!cardValid) return
    setError(null)
    setProcessing(true)
    try {
      await new Promise((r) => setTimeout(r, 1300))
      await payLateFee(assessmentId)
      router.refresh()
    } catch {
      setError("Your payment could not be processed. Please try again.")
      setProcessing(false)
    }
  }

  async function handleExtension() {
    setError(null)
    setExtending(true)
    try {
      const res = await requestExtension(assessmentId)
      if (!res.ok) {
        setError(res.error ?? "Could not request an extension.")
        setExtending(false)
        return
      }
      router.refresh()
    } catch {
      setError("Could not request an extension. Please try again.")
      setExtending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-foreground">Deadline missed</p>
          <p className="text-sm text-muted-foreground">
            A flat {formatFee(lateFeeCents)} late fee applies. Pay it now, or use an extension pass to push
            the deadline back and waive the charge.
          </p>
        </div>
      </div>

      {mode === "notice" && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="destructive" onClick={() => setMode("pay")}>
            <CreditCard className="h-4 w-4" />
            Pay {formatFee(lateFeeCents)} late fee
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={passesRemaining <= 0 || extending}
            onClick={handleExtension}
          >
            {extending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Request extension ({passesRemaining} left)
          </Button>
        </div>
      )}

      {mode === "pay" && (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`ln-${assessmentId}`}>Name on card</Label>
            <Input
              id={`ln-${assessmentId}`}
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Jane Learner"
              autoComplete="cc-name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`lc-${assessmentId}`}>Card number</Label>
            <Input
              id={`lc-${assessmentId}`}
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              autoComplete="cc-number"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`le-${assessmentId}`}>Expiry</Label>
              <Input
                id={`le-${assessmentId}`}
                inputMode="numeric"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                autoComplete="cc-exp"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`lv-${assessmentId}`}>CVC</Label>
              <Input
                id={`lv-${assessmentId}`}
                inputMode="numeric"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                autoComplete="cc-csc"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={!cardValid || processing} onClick={handlePay}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay {formatFee(lateFeeCents)}
                </>
              )}
            </Button>
            <Button size="sm" variant="ghost" disabled={processing} onClick={() => setMode("notice")}>
              Cancel
            </Button>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Demo payment flow — no real card is charged.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

/** Small confirmation shown once a late fee has been settled. */
export function LateFeePaid() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-foreground">Late fee paid. You&apos;re all caught up on this assessment.</span>
    </div>
  )
}
