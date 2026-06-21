"use client"

import { Suspense } from "react"
import { AudioListeningExercise, type AudioListeningConfig } from "./audio-listening"
import { QuizAsYouGo, type QuizConfig } from "./quiz-as-you-go"
import { DragDropExercise, type DragDropConfig } from "./drag-drop-exercise"
import { ScenarioExercise, type ScenarioConfig } from "./scenario-exercise"

export type InteractiveElementType =
  | "audio"
  | "quiz"
  | "dragdrop"
  | "scenario"
  | "diagram"
  | "fillblank"
  | "video"

export interface InteractiveElement {
  id: string
  type: InteractiveElementType
  title: string
  description?: string
  config: AudioListeningConfig | QuizConfig | DragDropConfig | ScenarioConfig
}

export function InteractiveRenderer({
  element,
  elements,
  onComplete,
  className,
}: {
  element?: InteractiveElement
  elements?: InteractiveElement[]
  onComplete?: (result: any) => void
  className?: string
}) {
  // If array is provided, render all elements
  if (elements && Array.isArray(elements)) {
    return (
      <div className="flex flex-col gap-6">
        {elements.map((el) => (
          <Suspense key={el.id} fallback={<InteractiveLoadingPlaceholder />}>
            <InteractiveContent element={el} onComplete={onComplete} className={className} />
          </Suspense>
        ))}
      </div>
    )
  }

  // Otherwise render single element
  if (element) {
    return (
      <Suspense fallback={<InteractiveLoadingPlaceholder />}>
        <InteractiveContent element={element} onComplete={onComplete} className={className} />
      </Suspense>
    )
  }

  return null
}

function InteractiveContent({
  element,
  onComplete,
  className,
}: {
  element: InteractiveElement
  onComplete?: (result: any) => void
  className?: string
}) {
  switch (element.type) {
    case "audio":
      return (
        <div className={className}>
          <AudioListeningExercise
            config={element.config as AudioListeningConfig}
            onComplete={onComplete}
          />
        </div>
      )

    case "quiz":
      return (
        <div className={className}>
          <QuizAsYouGo
            config={element.config as QuizConfig}
            onComplete={onComplete}
          />
        </div>
      )

    case "dragdrop":
      return (
        <div className={className}>
          <DragDropExercise
            config={element.config as DragDropConfig}
            onComplete={onComplete}
          />
        </div>
      )

    case "scenario":
      return (
        <div className={className}>
          <ScenarioExercise
            config={element.config as ScenarioConfig}
            onComplete={onComplete}
          />
        </div>
      )

    case "diagram":
    case "fillblank":
    case "video":
      return (
        <div className={`${className} p-4 border rounded bg-muted text-muted-foreground text-sm`}>
          <p>Interactive element &quot;{element.type}&quot; coming soon.</p>
        </div>
      )

    default:
      return (
        <div className={`${className} p-4 border rounded bg-muted text-muted-foreground text-sm`}>
          <p>Unknown interactive element type.</p>
        </div>
      )
  }
}

function InteractiveLoadingPlaceholder() {
  return (
    <div className="space-y-4 p-6 border rounded-lg bg-card animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-32 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-10 bg-muted rounded flex-1" />
        <div className="h-10 bg-muted rounded flex-1" />
      </div>
    </div>
  )
}
