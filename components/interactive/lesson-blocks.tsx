"use client"

import { Markdown } from "@/components/markdown"
import { ConceptVisual, type ConceptVisualData } from "./concept-visual"
import { InteractiveRenderer, type InteractiveElement } from "./interactive-renderer"

// Ordered, interleaved lesson content. Each block is either a prose passage, a
// teaching visual, or a hands-on exercise — rendered inline in sequence so
// concepts are taught and then immediately demonstrated/checked.
export type LessonBlock =
  | { kind: "prose"; markdown: string }
  | { kind: "visual"; variant: string; data: ConceptVisualData }
  | { kind: "exercise"; element: InteractiveElement }

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => {
        if (block.kind === "prose") {
          return <Markdown key={i}>{block.markdown}</Markdown>
        }
        if (block.kind === "visual") {
          return <ConceptVisual key={i} variant={block.variant} data={block.data} />
        }
        if (block.kind === "exercise") {
          return <InteractiveRenderer key={i} element={block.element} />
        }
        return null
      })}
    </div>
  )
}
