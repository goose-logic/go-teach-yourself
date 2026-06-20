import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getSpecialist, getAvailabilitySlots } from "@/lib/specialists"
import { AppHeader } from "@/components/app-header"
import { BookingFlow } from "@/components/specialists/booking-flow"
import { ArrowLeft } from "lucide-react"

export default async function BookSpecialistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { id } = await params
  const s = getSpecialist(id)
  if (!s) notFound()
  if (!s.verified) redirect(`/specialists/${id}`)

  const slots = getAvailabilitySlots(id)

  return (
    <div className="min-h-svh bg-secondary/20">
      <AppHeader userName={session.user.name} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href={`/specialists/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
        <h1 className="mb-6 font-serif text-2xl font-semibold text-foreground md:text-3xl">
          Book a session with {s.name}
        </h1>
        <BookingFlow
          specialistId={s.id}
          specialistName={s.name}
          expertise={s.expertise}
          avatar={s.avatar}
          priceCents={s.priceCents}
          slots={slots}
        />
      </main>
    </div>
  )
}
