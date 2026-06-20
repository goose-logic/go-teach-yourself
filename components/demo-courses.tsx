"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { seedDemoCourse } from "@/app/actions/courses"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Boxes, Megaphone, Loader2, Sparkles } from "lucide-react"

const DEMOS = [
  {
    key: "cybersecurity",
    title: "Cybersecurity Foundations",
    blurb: "Threats, attacks, and the controls that stop them.",
    Icon: ShieldCheck,
  },
  {
    key: "product-management",
    title: "Product Management",
    blurb: "From customer discovery to launch and metrics.",
    Icon: Boxes,
  },
  {
    key: "digital-marketing",
    title: "Digital Marketing",
    blurb: "Funnels, SEO, paid ads, email, and analytics.",
    Icon: Megaphone,
  },
]

export function DemoCourses() {
  const router = useRouter()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  async function loadDemo(key: string) {
    setLoadingKey(key)
    try {
      const id = await seedDemoCourse(key)
      router.push(`/course/${id}`)
    } catch {
      setLoadingKey(null)
    }
  }

  return (
    <Card className="border-dashed bg-card/60">
      <CardContent className="flex flex-col gap-5 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Try a ready-made course</p>
            <p className="text-sm text-muted-foreground">
              Load a fully built sample to explore lessons, the timetable, tests, and projects — no setup needed.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {DEMOS.map(({ key, title, blurb, Icon }) => (
            <div key={key} className="flex flex-col gap-3 rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <Badge variant="secondary">Demo</Badge>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-medium leading-snug text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{blurb}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-auto"
                onClick={() => loadDemo(key)}
                disabled={loadingKey !== null}
              >
                {loadingKey === key ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load course"
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
