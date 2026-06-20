import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getSpecialistDetail } from "@/app/actions/marketplace"
import { AppHeader } from "@/components/app-header"
import { StarRating } from "@/components/specialists/star-rating"
import { VerifiedBadge } from "@/components/specialists/verified-badge"
import { ReviewsList } from "@/components/specialists/reviews-list"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatPrice, formatPricePrecise } from "@/lib/specialists"
import {
  ArrowLeft,
  BadgeCheck,
  CalendarPlus,
  Clock,
  Linkedin,
  MapPin,
  TrendingUp,
  Users,
} from "lucide-react"

export default async function SpecialistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { id } = await params
  const detail = await getSpecialistDetail(id)
  if (!detail) notFound()

  const { specialist: s, rating, reviewCount, reviews, fees } = detail

  const verificationSteps = [
    {
      label: "LinkedIn profile verified",
      done: true,
      detail: "We confirmed their identity and professional history.",
    },
    {
      label: "Reference check completed",
      done: s.verification.referenceChecked,
      detail: "A past client or employer vouched for their work.",
    },
    {
      label: "Sample-session interview passed",
      done: s.verification.sampleSessionPassed,
      detail: "They taught a live mock session with our team.",
    },
  ]

  return (
    <div className="min-h-svh bg-secondary/20">
      <AppHeader userName={session.user.name} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href="/specialists"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All tutors
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <Image
              src={s.avatar || "/placeholder.svg"}
              alt={`Portrait of ${s.name}`}
              width={104}
              height={104}
              className="shrink-0 rounded-2xl object-cover"
              style={{ width: 104, height: 104 }}
              priority
            />
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">{s.name}</h1>
              <p className="text-muted-foreground">{s.title}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <VerifiedBadge verified={s.verified} size="md" />
                <Badge variant="secondary">{s.expertise}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <StarRating rating={rating} />
                  <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                  <span className="text-xs">({reviewCount} reviews)</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {s.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {s.sessions} sessions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking CTA card */}
        <Card className="mt-8">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-foreground">{formatPrice(s.priceCents)}</span>
              <span className="text-sm text-muted-foreground">per 60-minute session</span>
            </div>
            <div className="flex items-center gap-3">
              {s.verified ? (
                <Button asChild size="lg">
                  <Link href={`/specialists/${s.id}/book`}>
                    <CalendarPlus className="h-4 w-4" />
                    Book a session
                  </Link>
                </Button>
              ) : (
                <Button size="lg" disabled>
                  <Clock className="h-4 w-4" />
                  Not yet bookable
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-8 md:col-span-2">
            {/* About */}
            <section>
              <h2 className="mb-3 font-serif text-xl font-semibold text-foreground">About</h2>
              <p className="leading-relaxed text-foreground/90">{s.bio}</p>
            </section>

            {/* Reviews */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Reviews <span className="text-muted-foreground">({reviewCount})</span>
                </h2>
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <StarRating rating={rating} />
                  <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                </span>
              </div>
              <ReviewsList reviews={reviews} />
            </section>
          </div>

          {/* Sidebar: verification + earnings link */}
          <aside className="flex flex-col gap-6">
            <Card>
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">
                    {s.verified ? "Verified Tutor" : "Verification in progress"}
                  </h3>
                </div>
                <ul className="flex flex-col gap-3">
                  {verificationSteps.map((step) => (
                    <li key={step.label} className="flex items-start gap-2.5">
                      <span
                        className={
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full " +
                          (step.done ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")
                        }
                      >
                        {step.done ? <BadgeCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{step.label}</span>
                        <span className="text-xs text-muted-foreground">{step.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                {s.verified && (
                  <a
                    href={s.verification.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    View LinkedIn profile
                  </a>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">For tutors</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  You keep <span className="font-medium text-foreground">{formatPricePrecise(fees.payoutCents)}</span> of
                  every {formatPrice(s.priceCents)} session. Go Teach Yourself&apos;s fee is {`${fees.feePercent}%`} (
                  {formatPricePrecise(fees.platformFeeCents)}).
                </p>
                <Button asChild variant="outline" size="sm" className="mt-1">
                  <Link href={`/specialists/${s.id}/earnings`}>View earnings dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
