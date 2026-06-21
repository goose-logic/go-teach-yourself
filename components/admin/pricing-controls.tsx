"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updatePlatformSettings } from "@/app/actions/admin"
import type { PlatformSettings } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, LockOpen, CalendarX, Percent } from "lucide-react"

function centsToDollars(cents: number) {
  return (cents / 100).toString()
}

export function PricingControls({ settings }: { settings: PlatformSettings }) {
  const router = useRouter()
  const [unlock, setUnlock] = useState(centsToDollars(settings.courseUnlockFeeCents))
  const [late, setLate] = useState(centsToDollars(settings.lateFeeCents))
  const [commission, setCommission] = useState(settings.commissionPercent.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const dirty =
    unlock !== centsToDollars(settings.courseUnlockFeeCents) ||
    late !== centsToDollars(settings.lateFeeCents) ||
    commission !== settings.commissionPercent.toString()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const unlockCents = Math.round(Number.parseFloat(unlock) * 100)
    const lateCents = Math.round(Number.parseFloat(late) * 100)
    const commissionPct = Math.round(Number.parseFloat(commission))

    if ([unlockCents, lateCents, commissionPct].some((n) => Number.isNaN(n))) {
      setError("Please enter valid numbers for every field.")
      return
    }

    setSaving(true)
    try {
      const res = await updatePlatformSettings({
        courseUnlockFeeCents: unlockCents,
        lateFeeCents: lateCents,
        commissionPercent: commissionPct,
      })
      if (!res.ok) {
        setError(res.error ?? "Could not save changes.")
        setSaving(false)
        return
      }
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Something went wrong while saving.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Pricing &amp; fees</CardTitle>
        <CardDescription>
          These values are live. Changes apply immediately across the learner-facing app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid gap-5 md:grid-cols-3">
            <FeeField
              icon={<LockOpen className="h-4 w-4 text-primary" />}
              id="unlock-fee"
              label="Course unlock fee"
              help="Charged once the free trial units run out."
              prefix="$"
              value={unlock}
              onChange={setUnlock}
              step="1"
              min="0"
            />
            <FeeField
              icon={<CalendarX className="h-4 w-4 text-primary" />}
              id="late-fee"
              label="Missed deadline fee"
              help="Flat fee applied when a deadline is missed."
              prefix="$"
              value={late}
              onChange={setLate}
              step="0.5"
              min="0"
            />
            <FeeField
              icon={<Percent className="h-4 w-4 text-primary" />}
              id="commission"
              label="Specialist commission"
              help="Platform cut of every tutorial booking."
              suffix="%"
              value={commission}
              onChange={setCommission}
              step="1"
              min="0"
              max="100"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Saved — pricing updated everywhere
              </span>
            )}
            {dirty && !saved && (
              <span className="text-sm text-muted-foreground">You have unsaved changes</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function FeeField({
  icon,
  id,
  label,
  help,
  prefix,
  suffix,
  value,
  onChange,
  step,
  min,
  max,
}: {
  icon: React.ReactNode
  id: string
  label: string
  help: string
  prefix?: string
  suffix?: string
  value: string
  onChange: (v: string) => void
  step?: string
  min?: string
  max?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-secondary/30 p-4">
      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {label}
      </span>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          min={min}
          max={max}
          className={prefix ? "pl-7" : suffix ? "pr-8" : ""}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{help}</p>
    </div>
  )
}
