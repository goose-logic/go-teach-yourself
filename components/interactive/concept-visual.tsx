import { ArrowRight, ArrowDown, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

// Renders teaching visuals purely with HTML/CSS (no image files) so they load
// instantly and always match the lesson text. Five variants cover most concepts.

export interface ConceptVisualData {
  title?: string
  caption?: string
  steps?: Array<{ label: string; detail: string }>
  columns?: Array<{ heading: string; points: string[] }>
  stats?: Array<{ value: string; label: string }>
  centerLabel?: string
  parts?: Array<{ label: string; detail: string }>
}

export type ConceptVisualVariant = "flow" | "comparison" | "stats" | "timeline" | "labeled"

export function ConceptVisual({
  variant,
  data,
}: {
  variant: ConceptVisualVariant | string
  data: ConceptVisualData
}) {
  return (
    <figure className="rounded-xl border bg-card p-6">
      {data.title && (
        <figcaption className="mb-4 flex items-center gap-2">
          <span className="inline-block h-4 w-1 rounded-full bg-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-card-foreground">{data.title}</span>
        </figcaption>
      )}

      {variant === "flow" && <FlowVisual steps={data.steps ?? []} />}
      {variant === "timeline" && <TimelineVisual steps={data.steps ?? []} />}
      {variant === "comparison" && <ComparisonVisual columns={data.columns ?? []} />}
      {variant === "stats" && <StatsVisual stats={data.stats ?? []} />}
      {variant === "labeled" && <LabeledVisual centerLabel={data.centerLabel} parts={data.parts ?? []} />}

      {data.caption && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{data.caption}</p>}
    </figure>
  )
}

function FlowVisual({ steps }: { steps: Array<{ label: string; detail: string }> }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-3 md:flex-row">
          <div className="flex w-full flex-col gap-1 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <span className="text-sm font-semibold text-foreground">{step.label}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">{step.detail}</span>
          </div>
          {i < steps.length - 1 && (
            <>
              <ArrowRight className="hidden h-5 w-5 shrink-0 text-primary md:block" aria-hidden="true" />
              <ArrowDown className="h-5 w-5 shrink-0 text-primary md:hidden" aria-hidden="true" />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function TimelineVisual({ steps }: { steps: Array<{ label: string; detail: string }> }) {
  return (
    <ol className="relative ml-3 border-l-2 border-primary/30">
      {steps.map((step, i) => (
        <li key={i} className="mb-6 ml-6 last:mb-0">
          <span
            className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-primary"
            aria-hidden="true"
          >
            <Circle className="h-2 w-2 fill-primary-foreground text-primary-foreground" />
          </span>
          <span className="block text-sm font-semibold text-foreground">{step.label}</span>
          <span className="block text-xs leading-relaxed text-muted-foreground">{step.detail}</span>
        </li>
      ))}
    </ol>
  )
}

function ComparisonVisual({ columns }: { columns: Array<{ heading: string; points: string[] }> }) {
  return (
    <div className={cn("grid gap-4", columns.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border bg-background p-4">
          <h4 className="border-b pb-2 text-sm font-semibold text-foreground">{col.heading}</h4>
          <ul className="flex flex-col gap-2">
            {col.points.map((p, pi) => (
              <li key={pi} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function StatsVisual({ stats }: { stats: Array<{ value: string; label: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col items-center gap-1 rounded-lg border bg-background p-4 text-center">
          <span className="text-2xl font-bold text-primary">{s.value}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

function LabeledVisual({
  centerLabel,
  parts,
}: {
  centerLabel?: string
  parts: Array<{ label: string; detail: string }>
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {centerLabel && (
        <div className="rounded-full border-2 border-primary bg-primary/10 px-6 py-3 text-center text-sm font-semibold text-foreground">
          {centerLabel}
        </div>
      )}
      <div className="grid w-full gap-3 sm:grid-cols-2">
        {parts.map((part, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-lg border-l-4 border-accent bg-background p-3">
            <span className="text-sm font-semibold text-foreground">{part.label}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">{part.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
