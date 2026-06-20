import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({
  rating,
  size = 16,
  className,
}: {
  rating: number
  size?: number
  className?: string
}) {
  // Render 5 stars with a clipped overlay to show partial fills.
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100))
  return (
    <div className={cn("relative inline-flex", className)} aria-label={`${rating} out of 5 stars`}>
      <div className="flex text-muted-foreground/30">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} style={{ width: size, height: size }} className="fill-current" />
        ))}
      </div>
      <div className="absolute left-0 top-0 flex overflow-hidden text-accent" style={{ width: `${pct}%` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} style={{ width: size, height: size }} className="shrink-0 fill-current" />
        ))}
      </div>
    </div>
  )
}
