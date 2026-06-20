"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createBooking } from "@/app/actions/marketplace"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatPricePrecise } from "@/lib/specialists"
import { CalendarCheck, CreditCard, Loader2, Lock, CheckCircle2, ArrowLeft } from "lucide-react"

type Slot = { value: string; label: string }

export function BookingFlow({
  specialistId,
  specialistName,
  expertise,
  avatar,
  priceCents,
  slots,
}: {
  specialistId: string
  specialistName: string
  expertise: string
  avatar: string
  priceCents: number
  slots: Slot[]
}) {
  const router = useRouter()
  const [step, setStep] = useState<"slot" | "pay" | "done">("slot")
  const [slot, setSlot] = useState<Slot | null>(null)

  // Mock card fields.
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<number | null>(null)

  const digits = cardNumber.replace(/\D/g, "")
  const cardValid =
    cardName.trim().length > 1 && digits.length >= 15 && /^\d{2}\/\d{2}$/.test(expiry) && cvc.length >= 3

  function formatCardNumber(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 16)
    return d.replace(/(.{4})/g, "$1 ").trim()
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4)
    if (d.length <= 2) return d
    return `${d.slice(0, 2)}/${d.slice(2)}`
  }

  async function handlePay() {
    if (!slot || !cardValid) return
    setError(null)
    setProcessing(true)
    try {
      // Simulate a realistic payment gateway round-trip.
      await new Promise((r) => setTimeout(r, 1400))
      const id = await createBooking({
        specialistId,
        sessionDate: slot.value,
        slotLabel: slot.label,
        cardLast4: digits.slice(-4),
      })
      setBookingId(id)
      setStep("done")
      router.refresh()
    } catch {
      setError("Your payment could not be processed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Session booked</h2>
            <p className="text-muted-foreground">
              Your session with {specialistName} is confirmed for{" "}
              <span className="font-medium text-foreground">{slot?.label}</span>.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-xl border bg-secondary/40 p-4 text-left text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Specialist</span>
              <span className="font-medium text-foreground">{specialistName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">When</span>
              <span className="font-medium text-foreground">{slot?.label}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium text-foreground">{formatPricePrecise(priceCents)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/sessions">View my sessions</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/specialists/${specialistId}`}>Back to profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        {step === "slot" ? (
          <Card>
            <CardContent className="flex flex-col gap-5 p-6">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-lg font-semibold text-foreground">Choose a time</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                All sessions are 60 minutes, held over video call. Times are shown in your local timezone.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((sl) => {
                  const selected = slot?.value === sl.value
                  return (
                    <button
                      key={sl.value}
                      type="button"
                      onClick={() => setSlot(sl)}
                      className={
                        "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors " +
                        (selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-secondary")
                      }
                    >
                      {sl.label}
                    </button>
                  )
                })}
              </div>
              <Button className="mt-2 w-fit" disabled={!slot} onClick={() => setStep("pay")}>
                Continue to payment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-5 p-6">
              <button
                type="button"
                onClick={() => setStep("slot")}
                className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Change time
              </button>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-lg font-semibold text-foreground">Payment details</h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cardName">Name on card</Label>
                  <Input
                    id="cardName"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Jane Learner"
                    autoComplete="cc-name"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cardNumber">Card number</Label>
                  <Input
                    id="cardNumber"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    autoComplete="cc-number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      inputMode="numeric"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      autoComplete="cc-exp"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      inputMode="numeric"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      autoComplete="cc-csc"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="mt-1" disabled={!cardValid || processing} onClick={handlePay}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing payment…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay {formatPricePrecise(priceCents)}
                  </>
                )}
              </Button>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                This is a demo payment flow — no real card is charged.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order summary */}
      <aside>
        <Card className="sticky top-24">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <Image
                src={avatar || "/placeholder.svg"}
                alt={`Portrait of ${specialistName}`}
                width={48}
                height={48}
                className="rounded-lg object-cover"
                style={{ width: 48, height: 48 }}
              />
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{specialistName}</span>
                <Badge variant="secondary" className="mt-0.5 w-fit">
                  {expertise}
                </Badge>
              </div>
            </div>
            <div className="border-t pt-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">60-minute session</span>
                <span className="text-foreground">{formatPricePrecise(priceCents)}</span>
              </div>
              {slot && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-right font-medium text-foreground">{slot.label}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t pt-3 text-base font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatPricePrecise(priceCents)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
