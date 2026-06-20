import { StarRating } from "@/components/specialists/star-rating"
import type { ReviewItem } from "@/app/actions/marketplace"

function relativeDate(date: Date) {
  const d = new Date(date)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function ReviewsList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to book and review this tutor.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {initials(r.reviewerName)}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">{r.reviewerName}</span>
                <span className="text-xs text-muted-foreground">{relativeDate(r.date)}</span>
              </div>
              <StarRating rating={r.rating} size={14} />
              {r.comment && <p className="mt-1 text-sm leading-relaxed text-foreground/90">{r.comment}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
