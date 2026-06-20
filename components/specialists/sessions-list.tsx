"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { markSessionComplete, submitReview } from "@/app/actions/marketplace"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { formatPricePrecise } from "@/lib/specialists"
import { CalendarDays, Loader2, Star, CheckCircle2, Receipt } from "lucide-react"

type Booking = {
  id: number
  specialistId: string
  specialistName: string
  expertise: string
  sessionDate: Date | string
  slotLabel: string
  priceCents: number
  status: string
  cardLast4: string | null
  reviewed: boolean
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
          >
            <Star className={"h-6 w-6 " + (active ? "fill-accent text-accent" : "text-muted-foreground/40")} />
          </button>
        )
      })}
    </div>
  )
}

function ReviewForm({
  specialistId,
  bookingId,
  onDone,
}: {
  specialistId: string
  bookingId: number
  onDone: () => void
}) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (rating < 1) return
    setSaving(true)
    try {
      await submitReview({ specialistId, bookingId, rating, comment })
      onDone()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-secondary/40 p-4">
      <p className="text-sm font-medium text-foreground">How was your session?</p>
      <StarInput value={rating} onChange={setRating} />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share what was helpful — your review appears on the tutor's profile."
        rows={3}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={rating < 1 || saving} onClick={handleSubmit}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit review
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function SessionsList({ bookings }: { bookings: Booking[] }) {
  const router = useRouter()
  const [openReview, setOpenReview] = useState<number | null>(null)
  const [completing, setCompleting] = useState<number | null>(null)

  async function complete(id: number) {
    setCompleting(id)
    try {
      await markSessionComplete(id)
      router.refresh()
    } finally {
      setCompleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {bookings.map((b) => {
        const isCompleted = b.status === "completed"
        return (
          <Card key={b.id}>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isCompleted ? "secondary" : "default"}>
                      {isCompleted ? "Completed" : "Upcoming"}
                    </Badge>
                    <Badge variant="outline">{b.expertise}</Badge>
                  </div>
                  <Link
                    href={`/specialists/${b.specialistId}`}
                    className="text-base font-semibold text-foreground hover:text-primary"
                  >
                    {b.specialistName}
                  </Link>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {b.slotLabel}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm">
                  <span className="font-semibold text-foreground">{formatPricePrecise(b.priceCents)}</span>
                  {b.cardLast4 && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Receipt className="h-3.5 w-3.5" />
                      Paid •••• {b.cardLast4}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                {!isCompleted && (
                  <Button size="sm" variant="outline" disabled={completing === b.id} onClick={() => complete(b.id)}>
                    {completing === b.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Mark as completed
                  </Button>
                )}
                {isCompleted && b.reviewed && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    You reviewed this session
                  </span>
                )}
                {isCompleted && !b.reviewed && openReview !== b.id && (
                  <Button size="sm" onClick={() => setOpenReview(b.id)}>
                    <Star className="h-4 w-4" />
                    Leave a review
                  </Button>
                )}
              </div>

              {openReview === b.id && (
                <ReviewForm
                  specialistId={b.specialistId}
                  bookingId={b.id}
                  onDone={() => setOpenReview(null)}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
