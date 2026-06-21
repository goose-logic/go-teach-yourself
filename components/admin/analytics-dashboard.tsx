"use client"

import type { AdminAnalytics } from "@/app/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, DollarSign, GraduationCap, LockOpen, CalendarX, Percent } from "lucide-react"

function formatMoney(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US")
}

export function AnalyticsDashboard({ analytics }: { analytics: AdminAnalytics }) {
  const { signups, revenue, completion } = analytics

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">A snapshot of platform performance.</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={<Users className="h-4 w-4 text-primary" />}
          label="Total sign-ups"
          value={formatNumber(signups.total)}
          sub={`+${formatNumber(signups.thisMonth)} this month`}
        />
        <KpiCard
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          label="Total revenue"
          value={formatMoney(revenue.total)}
          sub="Unlocks, fees & commissions"
        />
        <KpiCard
          icon={<GraduationCap className="h-4 w-4 text-primary" />}
          label="Completion rate"
          value={`${completion.rate}%`}
          sub={`${formatNumber(completion.completed)} of ${formatNumber(completion.started)} finished`}
        />
      </div>

      {/* Sign-ups over time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Sign-ups over time
          </CardTitle>
          <CardDescription>New learners per month over the last 12 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupChart data={signups.overTime} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue breakdown</CardTitle>
            <CardDescription>Where platform revenue comes from.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <RevenueRow
              icon={<LockOpen className="h-4 w-4 text-primary" />}
              label="Course unlock fees"
              detail={`${formatNumber(revenue.counts.courseUnlocks)} unlocks`}
              amount={revenue.unlock}
              total={revenue.total}
            />
            <RevenueRow
              icon={<CalendarX className="h-4 w-4 text-primary" />}
              label="Missed deadline fees"
              detail={`${formatNumber(revenue.counts.deadlinesMissed)} charges`}
              amount={revenue.deadline}
              total={revenue.total}
            />
            <RevenueRow
              icon={<Percent className="h-4 w-4 text-primary" />}
              label="Specialist commissions"
              detail={`${formatNumber(revenue.counts.specialistBookings)} bookings`}
              amount={revenue.commission}
              total={revenue.total}
            />
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-sm font-semibold text-foreground">{formatMoney(revenue.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Completion funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course completion</CardTitle>
            <CardDescription>How many learners finish what they start.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Courses started</span>
                <span className="font-medium text-foreground">{formatNumber(completion.started)}</span>
              </div>
              <Progress value={100} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Courses completed</span>
                <span className="font-medium text-foreground">{formatNumber(completion.completed)}</span>
              </div>
              <Progress value={completion.rate} />
            </div>
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
              <p className="font-serif text-3xl font-semibold text-primary">{completion.rate}%</p>
              <p className="text-xs text-muted-foreground">completion rate</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-serif text-3xl font-semibold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </CardContent>
    </Card>
  )
}

function SignupChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex h-56 items-end gap-2" role="img" aria-label="Bar chart of monthly sign-ups">
      {data.map((d) => {
        const heightPct = Math.max(4, Math.round((d.count / max) * 100))
        return (
          <div key={d.month} className="group flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="relative w-full rounded-t-md bg-primary/80 transition-colors hover:bg-primary"
                style={{ height: `${heightPct}%` }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {d.count.toLocaleString("en-US")}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">{d.month}</span>
          </div>
        )
      })}
    </div>
  )
}

function RevenueRow({
  icon,
  label,
  detail,
  amount,
  total,
}: {
  icon: React.ReactNode
  label: string
  detail: string
  amount: number
  total: number
}) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm text-foreground">
          {icon}
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">{formatMoney(amount)}</span>
      </div>
      <Progress value={pct} />
      <span className="text-xs text-muted-foreground">
        {detail} · {pct}% of revenue
      </span>
    </div>
  )
}
