"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, RotateCcw, GripHorizontal, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type DragDropMode = "ordering" | "matching" | "categorizing"

export interface DragDropItem {
  id: string
  text: string
  category?: string // correct category for categorizing mode
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
  correctMatches?: Record<string, string> // for matching mode: itemId -> correct answer text
  matchOptions?: string[] // for matching mode: the shuffled answer texts to drag
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
}: {
  config: DragDropConfig
  onComplete?: (state: DragDropState) => void
}) {
  if (config.mode === "matching") {
    return <MatchingExercise config={config} onComplete={onComplete} />
  }
  if (config.mode === "categorizing") {
    return <CategorizingExercise config={config} onComplete={onComplete} />
  }
  return <OrderingExercise config={config} onComplete={onComplete} />
}

// --- Shared shell -----------------------------------------------------------

function ExerciseShell({
  config,
  children,
  onCheck,
  onReset,
  completed,
  isCorrect,
  feedback,
  checkLabel = "Check answer",
  canCheck = true,
}: {
  config: DragDropConfig
  children: React.ReactNode
  onCheck: () => void
  onReset: () => void
  completed: boolean
  isCorrect: boolean
  feedback: string
  checkLabel?: string
  canCheck?: boolean
}) {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold text-card-foreground">{config.title}</h3>
        {config.description && <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>}
        <p className="mt-2 text-sm italic text-foreground/70">{config.instruction}</p>
      </div>

      {children}

      {completed && (
        <div
          className={cn(
            "rounded-lg border p-4 text-sm font-medium",
            isCorrect
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-destructive/30 bg-destructive/10 text-foreground",
          )}
        >
          {feedback}
        </div>
      )}

      <div className="flex gap-2 border-t pt-4">
        <Button variant="outline" onClick={onReset} disabled={!completed && !canCheck} className="flex-1">
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button onClick={onCheck} disabled={completed || !canCheck} className="flex-1">
          {checkLabel}
        </Button>
      </div>
    </div>
  )
}

// --- Ordering ---------------------------------------------------------------

function OrderingExercise({
  config,
  onComplete,
}: {
  config: DragDropConfig
  onComplete?: (state: DragDropState) => void
}) {
  const [order, setOrder] = useState<string[]>(config.items.map((i) => i.id))
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState("")

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }
    const from = order.indexOf(draggedId)
    const to = order.indexOf(targetId)
    if (from === -1 || to === -1) {
      setDraggedId(null)
      return
    }
    const next = [...order]
    const [removed] = next.splice(from, 1)
    next.splice(to, 0, removed)
    setOrder(next)
    setDraggedId(null)
  }

  function check() {
    const correct = !!config.correctOrder && order.every((id, idx) => id === config.correctOrder![idx])
    setIsCorrect(correct)
    setCompleted(true)
    const fb = correct ? "Perfect! Everything is in the right order." : "Not quite — review the sequence and try again."
    setFeedback(fb)
    onComplete?.({ currentOrder: order, completed: true, isCorrect: correct, feedback: fb })
  }

  function reset() {
    setOrder(config.items.map((i) => i.id))
    setCompleted(false)
    setIsCorrect(false)
    setFeedback("")
  }

  return (
    <ExerciseShell
      config={config}
      onCheck={check}
      onReset={reset}
      completed={completed}
      isCorrect={isCorrect}
      feedback={feedback}
      checkLabel="Check order"
    >
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Drag to reorder</p>
        {order.map((itemId, idx) => {
          const item = config.items.find((i) => i.id === itemId)
          if (!item) return null
          const inRightSpot = config.correctOrder && config.correctOrder[idx] === itemId
          return (
            <div
              key={itemId}
              draggable
              onDragStart={() => setDraggedId(itemId)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(itemId)}
              className={cn(
                "flex cursor-move items-center gap-3 rounded-lg border-2 p-3 transition-all",
                draggedId === itemId
                  ? "border-primary bg-primary/10 opacity-50"
                  : "border-border bg-background hover:border-primary/50",
                completed && inRightSpot && "border-primary bg-primary/10",
                completed && !inRightSpot && "border-destructive bg-destructive/10",
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {idx + 1}
              </span>
              <GripHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm">{item.text}</span>
              {completed &&
                (inRightSpot ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                ))}
            </div>
          )
        })}
      </div>
    </ExerciseShell>
  )
}

// --- Matching ---------------------------------------------------------------
// Drag answer chips onto their matching term.

function MatchingExercise({
  config,
  onComplete,
}: {
  config: DragDropConfig
  onComplete?: (state: DragDropState) => void
}) {
  const options = config.matchOptions ?? []
  // itemId -> dropped answer text
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [dragged, setDragged] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState("")

  const usedAnswers = new Set(Object.values(assignments))
  const allAssigned = config.items.every((i) => assignments[i.id])

  function assign(itemId: string) {
    if (!dragged) return
    setAssignments((prev) => {
      const next: Record<string, string> = {}
      // remove this answer from any other term, then assign here
      for (const [k, v] of Object.entries(prev)) {
        if (v !== dragged) next[k] = v
      }
      next[itemId] = dragged
      return next
    })
    setDragged(null)
  }

  function check() {
    const correct = config.items.every((i) => assignments[i.id] === config.correctMatches?.[i.id])
    setIsCorrect(correct)
    setCompleted(true)
    const fb = correct ? "Great matching! Every pair is correct." : "Some pairs aren't right yet — try again."
    setFeedback(fb)
    onComplete?.({ currentOrder: [], completed: true, isCorrect: correct, feedback: fb })
  }

  function reset() {
    setAssignments({})
    setCompleted(false)
    setIsCorrect(false)
    setFeedback("")
  }

  return (
    <ExerciseShell
      config={config}
      onCheck={check}
      onReset={reset}
      completed={completed}
      isCorrect={isCorrect}
      feedback={feedback}
      canCheck={allAssigned}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Answer bank */}
        <div className="flex flex-wrap gap-2 md:w-2/5 md:flex-col">
          <p className="w-full text-xs font-medium uppercase tracking-wide text-muted-foreground">Drag these</p>
          {options.map((opt) => {
            const used = usedAnswers.has(opt)
            return (
              <div
                key={opt}
                draggable={!used && !completed}
                onDragStart={() => setDragged(opt)}
                className={cn(
                  "rounded-lg border-2 px-3 py-2 text-sm transition-all",
                  used
                    ? "cursor-default border-dashed border-border bg-muted/50 text-muted-foreground opacity-40"
                    : "cursor-move border-accent/40 bg-accent/10 hover:border-accent",
                )}
              >
                {opt}
              </div>
            )
          })}
        </div>

        {/* Terms with drop zones */}
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Match to</p>
          {config.items.map((item) => {
            const assigned = assignments[item.id]
            const correctHere = completed && assigned === config.correctMatches?.[item.id]
            return (
              <div
                key={item.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => assign(item.id)}
                className="flex items-center gap-3 rounded-lg border bg-background p-3"
              >
                <span className="flex-1 text-sm font-medium">{item.text}</span>
                <span
                  className={cn(
                    "min-w-[40%] rounded-md border-2 border-dashed px-3 py-1.5 text-sm",
                    !assigned && "border-border text-muted-foreground",
                    assigned && !completed && "border-primary/40 bg-primary/5",
                    correctHere && "border-primary bg-primary/10",
                    completed && assigned && !correctHere && "border-destructive bg-destructive/10",
                  )}
                >
                  {assigned || "Drop here"}
                </span>
                {completed &&
                  (correctHere ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  ))}
              </div>
            )
          })}
        </div>
      </div>
    </ExerciseShell>
  )
}

// --- Categorizing -----------------------------------------------------------
// Drag items into the category bucket they belong to.

function CategorizingExercise({
  config,
  onComplete,
}: {
  config: DragDropConfig
  onComplete?: (state: DragDropState) => void
}) {
  const categories = config.categories ?? []
  // itemId -> category name (or undefined if still in the tray)
  const [placement, setPlacement] = useState<Record<string, string>>({})
  const [dragged, setDragged] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState("")

  const unplaced = config.items.filter((i) => !placement[i.id])
  const allPlaced = unplaced.length === 0

  function place(category: string) {
    if (!dragged) return
    setPlacement((prev) => ({ ...prev, [dragged]: category }))
    setDragged(null)
  }

  function check() {
    const correct = config.items.every((i) => placement[i.id] === i.category)
    setIsCorrect(correct)
    setCompleted(true)
    const fb = correct ? "Spot on! Every item is in the right group." : "Some items are miscategorised — try again."
    setFeedback(fb)
    onComplete?.({ currentOrder: [], completed: true, isCorrect: correct, feedback: fb })
  }

  function reset() {
    setPlacement({})
    setCompleted(false)
    setIsCorrect(false)
    setFeedback("")
  }

  return (
    <ExerciseShell
      config={config}
      onCheck={check}
      onReset={reset}
      completed={completed}
      isCorrect={isCorrect}
      feedback={feedback}
      canCheck={allPlaced}
    >
      {/* Tray of unplaced items */}
      <div
        className="flex min-h-[3rem] flex-wrap gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-3"
        onDragOver={(e) => e.preventDefault()}
      >
        {unplaced.length === 0 && (
          <span className="text-xs italic text-muted-foreground">All items placed — check your answer.</span>
        )}
        {unplaced.map((item) => (
          <div
            key={item.id}
            draggable={!completed}
            onDragStart={() => setDragged(item.id)}
            className="cursor-move rounded-lg border-2 border-accent/40 bg-accent/10 px-3 py-2 text-sm transition-all hover:border-accent"
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Category buckets */}
      <div className={cn("grid gap-3", categories.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {categories.map((cat) => (
          <div
            key={cat}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => place(cat)}
            className="flex min-h-[6rem] flex-col gap-2 rounded-lg border bg-background p-3"
          >
            <h4 className="border-b pb-1.5 text-sm font-semibold text-foreground">{cat}</h4>
            <div className="flex flex-col gap-1.5">
              {config.items
                .filter((i) => placement[i.id] === cat)
                .map((item) => {
                  const correctHere = completed && item.category === cat
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm",
                        !completed && "border-primary/30 bg-primary/5",
                        correctHere && "border-primary bg-primary/10",
                        completed && !correctHere && "border-destructive bg-destructive/10",
                      )}
                    >
                      <span className="flex-1">{item.text}</span>
                      {completed &&
                        (correctHere ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        ))}
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </ExerciseShell>
  )
}
