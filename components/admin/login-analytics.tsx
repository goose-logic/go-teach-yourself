"use client"

import { useState } from "react"
import type { LoginAnalytics } from "@/app/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, UserCheck, UserPlus, Search, TrendingUp } from "lucide-react"

function formatNum(n: number) {
  return n.toLocaleString("en-US")
}

function formatDate(d: Date | string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function parseUa(ua: string | null): string {
  if (!ua) return "Unknown"
  if (/iPhone|iPad/.test(ua)) return "iOS"
  if (/Android/.test(ua)) return "Android"
  if (/Windows/.test(ua)) return "Windows"
  if (/Mac OS X/.test(ua)) return "macOS"
  if (/Linux/.test(ua)) return "Linux"
  return "Other"
}

export function LoginAnalyticsSection({ data }: { data: LoginAnalytics }) {
  const [search, setSearch] = useState("")

  const filtered = data.users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const max = Math.max(...data.dailySignups.map((d) => d.signups), 1)
  const labelledIndices = new Set([0, 6, 13, 20, 27, 29])

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-semibold text-foreground">User & login analytics</h2>
        <p className="text-sm text-muted-foreground">Real data from your registered learners and their sessions.</p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={<Users className="h-4 w-4 text-primary" />} label="Total users" value={formatNum(data.totalUsers)} sub="All registered accounts" />
        <KpiCard icon={<UserPlus className="h-4 w-4 text-primary" />} label="New sign-ups (30d)" value={formatNum(data.newSignups)} sub="Last 30 days" />
        <KpiCard icon={<UserCheck className="h-4 w-4 text-primary" />} label="Active users (30d)" value={formatNum(data.activeUsers)} sub="At least one session" />
      </div>

      {/* Daily sign-up chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Daily sign-ups — last 30 days
          </CardTitle>
          <CardDescription>New account registrations per day.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.totalUsers === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="flex h-52 items-end gap-px" role="img" aria-label="Daily sign-ups chart">
              {data.dailySignups.map((d, i) => {
                const heightPct = Math.max(2, Math.round((d.signups / max) * 100))
                return (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center">
                    <div className="flex h-40 w-full items-end">
                      <div
                        className="w-full rounded-t bg-primary/70 transition-colors hover:bg-primary"
                        style={{ height: `${heightPct}%` }}
                        title={`${d.label}: ${d.signups} sign-ups`}
                      />
                    </div>
                    {labelledIndices.has(i) && (
                      <span className="mt-1 text-[10px] text-muted-foreground">{d.label}</span>
                    )}
                    <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-foreground px-2 py-1 text-[11px] text-background group-hover:block whitespace-nowrap z-10">
                      {d.label}: {d.signups} sign-up{d.signups !== 1 ? "s" : ""}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                All users
              </CardTitle>
              <CardDescription>Every registered account with login details and session activity.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {search ? "No users match your search." : "No users yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Signed up</th>
                    <th className="pb-2 pr-4 font-medium">Last login</th>
                    <th className="pb-2 pr-4 text-center font-medium">Sessions</th>
                    <th className="pb-2 pr-4 text-center font-medium">Active now</th>
                    <th className="pb-2 font-medium">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-foreground">{u.name}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(u.lastLoginAt)}
                      </td>
                      <td className="py-2.5 pr-4 text-center font-mono text-foreground">
                        {formatNum(Number(u.sessionCount))}
                      </td>
                      <td className="py-2.5 pr-4 text-center">
                        {Number(u.activeSessionCount) > 0 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {parseUa(u.lastUserAgent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length < data.users.length && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing {filtered.length} of {formatNum(data.users.length)} users
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function KpiCard({
  icon, label, value, sub,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string
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
