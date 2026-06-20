import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getSpecialistEarnings } from "@/app/actions/marketplace"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPricePrecise } from "@/lib/specialists"
import { ArrowLeft, TrendingUp, Wallet, Receipt, Building2 } from "lucide-react"

function fmt(cents: number) {
  return formatPricePrecise(cents)
}

function fmtDate(value: Date | string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export default async function EarningsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { id } = await params
  const data = await getSpecialistEarnings(id)
  if (!data) notFound()

  const { specialist: s, perSession, platform, lifetime, feePercent } = data

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

        <div className="mb-8 flex items-center gap-4">
          <Image
            src={s.avatar || "/placeholder.svg"}
            alt={`Portrait of ${s.name}`}
            width={56}
            height={56}
            className="rounded-xl object-cover"
            style={{ width: 56, height: 56 }}
          />
          <div>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Specialist earnings
            </span>
            <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">{s.name}</h1>
          </div>
        </div>

        {/* Per-session transparency breakdown */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-lg font-semibold text-foreground">How each session pays out</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Curio takes a transparent {feePercent}% platform fee on every session. Here&apos;s exactly how a single
              session breaks down.
            </p>
            <div className="rounded-xl border bg-secondary/30 p-5">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Session price (learner pays)</span>
                <span className="text-lg font-semibold text-foreground">{fmt(perSession.priceCents)}</span>
              </div>
              <div className="flex items-center justify-between border-t py-2">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Platform fee ({perSession.feePercent}%)
                </span>
                <span className="font-medium text-destructive">−{fmt(perSession.platformFeeCents)}</span>
              </div>
              <div className="flex items-center justify-between border-t py-2">
                <span className="font-medium text-foreground">Your payout</span>
                <span className="text-lg font-semibold text-primary">{fmt(perSession.payoutCents)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifetime totals */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col gap-1 p-5">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Gross billed
              </span>
              <span className="text-2xl font-semibold text-foreground">{fmt(lifetime.grossCents)}</span>
              <span className="text-xs text-muted-foreground">{lifetime.sessions} sessions delivered</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 p-5">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Platform fees
              </span>
              <span className="text-2xl font-semibold text-foreground">{fmt(lifetime.feesCents)}</span>
              <span className="text-xs text-muted-foreground">{feePercent}% of gross</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 p-5">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Net payout
              </span>
              <span className="text-2xl font-semibold text-primary">{fmt(lifetime.payoutCents)}</span>
              <span className="text-xs text-muted-foreground">After platform fees</span>
            </CardContent>
          </Card>
        </div>

        {/* Recent platform bookings */}
        <section className="mt-8">
          <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
            Bookings through Curio
            {platform.count > 0 ? <span className="text-muted-foreground"> ({platform.count})</span> : null}
          </h2>
          {platform.count === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No live bookings yet. When learners book sessions on the platform, each one will appear here with
                its full fee and payout breakdown.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Session</th>
                    <th className="px-4 py-3 text-right font-medium">Price</th>
                    <th className="px-4 py-3 text-right font-medium">Fee</th>
                    <th className="px-4 py-3 text-right font-medium">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {platform.bookings.map((b) => (
                    <tr key={b.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-foreground">{b.slotLabel}</span>
                          <span className="text-xs text-muted-foreground">Booked {fmtDate(b.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">{fmt(b.priceCents)}</td>
                      <td className="px-4 py-3 text-right text-destructive">−{fmt(b.platformFeeCents)}</td>
                      <td className="px-4 py-3 text-right font-medium text-primary">{fmt(b.payoutCents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-secondary/30 font-medium">
                    <td className="px-4 py-3 text-foreground">Total</td>
                    <td className="px-4 py-3 text-right text-foreground">{fmt(platform.grossCents)}</td>
                    <td className="px-4 py-3 text-right text-destructive">−{fmt(platform.feesCents)}</td>
                    <td className="px-4 py-3 text-right text-primary">{fmt(platform.payoutCents)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
          <Badge variant="secondary">Demo</Badge>
          Lifetime totals combine this specialist&apos;s prior sessions with live platform bookings to illustrate the
          earnings and fee model.
        </p>
      </main>
    </div>
  )
}
