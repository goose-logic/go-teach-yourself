"use client"

import type { PageViewAnalytics } from "@/app/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, TrendingUp, LayoutList } from "lucide-react"

function formatNum(n: number) {
  return n.toLocaleString("en-US")
}

// Clean up internal path names for display
function formatPath(path: string) {
  if (path === "/") return "Home"
  if (path === "/dashboard") return "Dashboard"
  if (path === "/sign-in") return "Sign in"
  if (path === "/sign-up") return "Sign up"
  if (path === "/specialists") return "Specialists"
  if (path === "/sessions") return "My sessions"
  if (path === "/submissions") return "Submissions"
  if (path === "/new") return "New course"
  if (path.startsWith("/course/") && path.endsWith("/certificate")) {
    return `Certificate (course ${path.split("/")[2]})`
  }
  if (path.startsWith("/course/")) return `Course ${path.split("/")[2]}`
  if (path.startsWith("/specialists/") && path.endsWith("/book")) {
    return `Book specialist ${path.split("/")[2]}`
  }
  if (path.startsWith("/specialists/")) return `Specialist ${path.split("/")[2]}`
  return path
}

export function PageViewsAnalytics({ data }: { data: PageViewAnalytics }) {
  const max = Math.max(...data.dailyViews.map((d) => d.views), 1)

  // Show every 5th label to avoid crowding on 30 days
  const labelledIndices = new Set([0, 6, 13, 20, 27, 29])

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-semibold text-foreground">Page views</h2>
        <p className="text-sm text-muted-foreground">Real traffic data from your platform.</p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard icon={<Eye className="h-4 w-4 text-primary" />} label="Total views" value={formatNum(data.total)} />
        <KpiCard icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Last 30 days" value={formatNum(data.last30)} />
        <KpiCard icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Last 7 days" value={formatNum(data.last7)} />
        <KpiCard icon={<Users className="h-4 w-4 text-primary" />} label="Unique visitors (30d)" value={formatNum(data.uniqueVisitors)} />
      </div>

      {/* Daily chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Daily page views — last 30 days
          </CardTitle>
          <CardDescription>Every page load recorded from real visitor traffic.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.total === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No page views recorded yet. Views will appear here as visitors use the platform.
            </p>
          ) : (
            <div className="flex h-52 items-end gap-px" role="img" aria-label="Daily page views chart">
              {data.dailyViews.map((d, i) => {
                const heightPct = Math.max(2, Math.round((d.views / max) * 100))
                return (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center">
                    <div className="flex h-40 w-full items-end">
                      <div
                        className="w-full rounded-t bg-primary/70 transition-colors hover:bg-primary"
                        style={{ height: `${heightPct}%` }}
                        title={`${d.label}: ${formatNum(d.views)} views`}
                      />
                    </div>
                    {labelledIndices.has(i) && (
                      <span className="mt-1 text-[10px] text-muted-foreground">{d.label}</span>
                    )}
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-foreground px-2 py-1 text-[11px] text-background group-hover:block whitespace-nowrap z-10">
                      {d.label}: {formatNum(d.views)} views
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top pages table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutList className="h-4 w-4 text-primary" />
            Top pages — last 30 days
          </CardTitle>
          <CardDescription>Most visited pages ranked by total views.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topPages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Page</th>
                    <th className="pb-2 pr-4 font-medium">Path</th>
                    <th className="pb-2 pr-4 text-right font-medium">Views</th>
                    <th className="pb-2 text-right font-medium">Unique visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((p, i) => {
                    const barPct = Math.round((p.views / data.topPages[0].views) * 100)
                    return (
                      <tr key={p.path} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-foreground">
                          <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                          {formatPath(p.path)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                            {p.path}
                          </code>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-foreground">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${barPct}%` }} />
                            </div>
                            {formatNum(p.views)}
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-mono text-muted-foreground">
                          {formatNum(p.uniqueUsers)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-serif text-3xl font-semibold text-foreground">{value}</span>
      </CardContent>
    </Card>
  )
}
