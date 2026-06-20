import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getSpecialistsWithRatings } from "@/app/actions/marketplace"
import { AppHeader } from "@/components/app-header"
import { SpecialistDirectory } from "@/components/specialists/specialist-directory"
import { BadgeCheck } from "lucide-react"

export const metadata = {
  title: "Find a tutor — Curio",
  description:
    "Book one-on-one tutorial sessions with vetted, real-world tutors across cybersecurity, product, marketing, data, design and more.",
}

export default async function SpecialistsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const specialists = await getSpecialistsWithRatings()

  return (
    <div className="min-h-svh bg-secondary/20">
      <AppHeader userName={session.user.name} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <BadgeCheck className="h-4 w-4" />
            Vetted tutors
          </span>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Book a one-on-one tutorial</h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Go beyond your AI-built course with live tutorials from people who do this work for a living — not
            lecturers, but real-world practitioners. Every tutor is vetted before they can list.
          </p>
        </div>

        <SpecialistDirectory specialists={specialists} />
      </main>
    </div>
  )
}
