"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, RotateCcw, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export type DragDropMode = "ordering" | "matching" | "categorizing"

export interface DragDropItem {
  id: string
  text: string
  category?: string // for categorizing mode
}

export interface DragDropConfig {
  id: string
  title: string
  description?: string
  mode: DragDropMode
  instruction: string
  items: DragDropItem[]
  categories?: string[] // for categorizing mode
  correctOrder?: string[] // for ordering mode: array of item ids in correct order
  correctMatches?: Record<string, string> // for matching mode: itemId -> correct answer
}

export interface DragDropState {
  currentOrder: string[]
  completed: boolean
  isCorrect: boolean
  feedback: string
}

export function DragDropExercise({
  config,
  onComplete,
  initialState,
}: {
  config: DragDropConfig
  onComplete?: (state: DragDropState) => void
  initialState?: DragDropState
}) {
  const [state, setState] = useState<DragDropState>(
    initialState || {
      currentOrder: config.items.map((i) => i.id),
      completed: false,
      isCorrect: false,
      feedback: "",
    },
  )
  const [draggedId, setDraggedId] = useState<string | null>(null)

  function handleDragStart(id: string) {
    setDraggedId(id)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const draggedIdx = state.currentOrder.indexOf(draggedId)
    const targetIdx = state.currentOrder.indexOf(targetId)

    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedId(null)
      return
    }

    const newOrder = [...state.currentOrder]
    const [removed] = newOrder.splice(draggedIdx, 1)
    newOrder.splice(targetIdx, 0, removed)

    setState((prev) => ({
      ...prev,
      currentOrder: newOrder,
    }))
    setDraggedId(null)
  }

  function handleCheck() {
    const isCorrect =
      config.correctOrder &&
      state.currentOrder.every((id, idx) => id === config.correctOrder![idx])
    const feedback = isCorrect
      ? "Perfect! You've ordered all items correctly."
      : "Not quite right. Check the order and try again."

    setState((prev) => ({
      ...prev,
      completed: true,
      isCorrect: isCorrect || false,
      feedback,
    }))

    onComplete?.({
      ...state,
      completed: true,
      isCorrect: isCorrect || false,
      feedback,
    })
  }

  function handleReset() {
    setState({
      currentOrder: config.items.map((i) => i.id),
      completed: false,
      isCorrect: false,
      feedback: "",
    })
  }

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">{config.title}</h3>
        {config.description && (
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        )}
        <p className="text-sm text-foreground/70 mt-2 italic">{config.instruction}</p>
      </div>

      {/* Drag-Drop Area */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Drag to reorder
        </div>

        <div className="space-y-2">
          {state.currentOrder.map((itemId) => {
            const item = config.items.find((i) => i.id === itemId)
            if (!item) return null

            const isCorrectPosition =
              config.correctOrder && config.correctOrder[state.currentOrder.indexOf(itemId)] === itemId

            return (
              <div
                key={itemId}
                draggable
                onDragStart={() => handleDragStart(itemId)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(itemId)}
                className={cn(
                  "p-3 rounded border-2 cursor-move transition-all flex items-center gap-3",
                  draggedId === itemId
                    ? "bg-primary/10 border-primary opacity-50"
                    : "bg-background border-border hover:border-primary/50",
                  state.completed && isCorrectPosition && "bg-green-50 dark:bg-green-950/30 border-green-500",
                  state.completed && !isCorrectPosition && !state.isCorrect && "bg-red-50 dark:bg-red-950/30 border-red-500",
                )}
              >
                <GripHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1">{item.text}</span>
                {state.completed && isCorrectPosition && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Feedback */}
      {state.completed && (
        <div
          className={cn(
            "p-4 rounded border",
            state.isCorrect
              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
          )}
        >
          <p className="text-sm font-medium">{state.feedback}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!state.completed}
          className="flex-1"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button onClick={handleCheck} disabled={state.completed} className="flex-1">
          Check Order
        </Button>
      </div>
    </div>
  )
}
