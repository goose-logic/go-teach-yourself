"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StarRating } from "@/components/specialists/star-rating"
import { VerifiedBadge } from "@/components/specialists/verified-badge"
import { formatPrice } from "@/lib/specialists"
import { MapPin, Search, Users } from "lucide-react"

type DirectorySpecialist = {
  id: string
  name: string
  title: string
  expertise: string
  location: string
  bio: string
  priceCents: number
  avatar: string
  verified: boolean
  rating: number
  reviewCount: number
  sessions: number
}

export function SpecialistDirectory({ specialists }: { specialists: DirectorySpecialist[] }) {
  const [query, setQuery] = useState("")
  const [area, setArea] = useState<string>("all")

  const areas = useMemo(
    () => ["all", ...Array.from(new Set(specialists.map((s) => s.expertise))).sort()],
    [specialists],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return specialists.filter((s) => {
      const matchesArea = area === "all" || s.expertise === area
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.expertise.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.bio.toLowerCase().includes(q)
      return matchesArea && matchesQuery
    })
  }, [specialists, query, area])

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, topic, or expertise…"
            className="pl-9"
            aria-label="Search tutors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setArea(a)}
              className={
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors " +
                (area === a
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary")
              }
            >
              {a === "all" ? "All areas" : a}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} tutor{filtered.length === 1 ? "" : "s"}
        {area !== "all" ? ` in ${area}` : ""}
      </p>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {filtered.map((s) => (
          <Card key={s.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-start gap-4">
                <Image
                  src={s.avatar || "/placeholder.svg"}
                  alt={`Portrait of ${s.name}`}
                  width={72}
                  height={72}
                  className="shrink-0 rounded-xl object-cover"
                  style={{ width: 72, height: 72 }}
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">{s.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <div className="mt-0.5">
                    <VerifiedBadge verified={s.verified} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <Badge variant="secondary">{s.expertise}</Badge>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <StarRating rating={s.rating} />
                  <span className="font-medium text-foreground">{s.rating.toFixed(1)}</span>
                  <span className="text-xs">({s.reviewCount})</span>
                </span>
              </div>

              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{s.bio}</p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {s.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {s.sessions} sessions
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between border-t pt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-foreground">{formatPrice(s.priceCents)}</span>
                  <span className="text-xs text-muted-foreground">/ session</span>
                </div>
                <Button asChild size="sm">
                  <Link href={`/specialists/${s.id}`}>View profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-foreground">No tutors match your search</p>
            <p className="text-sm text-muted-foreground">Try a different topic or clear the filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
