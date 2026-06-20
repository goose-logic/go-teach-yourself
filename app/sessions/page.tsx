import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getMyBookings } from "@/app/actions/marketplace"
import { AppHeader } from "@/components/app-header"
import { SessionsList } from "@/components/specialists/sessions-list"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarClock } from "lucide-react"

export const metadata = {
  title: "My sessions — Curio",
}

export default async function SessionsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const bookings = await getMyBookings()

  return (
    <div className="min-h-svh bg-secondary/20">
      <AppHeader userName={session.user.name} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-semibold text-foreground">My sessions</h1>
          <p className="text-muted-foreground">
            Your booked tutorial sessions. After a session, leave a review to help other learners.
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CalendarClock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">No sessions booked yet</p>
                <p className="text-muted-foreground">
                  Browse our vetted specialists and book a one-on-one tutorial.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/specialists">Find a specialist</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <SessionsList bookings={bookings} />
        )}
      </main>
    </div>
  )
}
