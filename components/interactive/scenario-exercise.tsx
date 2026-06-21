"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ScenarioChoice {
  id: string
  text: string
  nextNodeId?: string // if undefined, this ends the scenario
  isCorrect?: boolean
  feedback: string
}

export interface ScenarioNode {
  id: string
  type: "scene" | "outcome"
  title: string
  description: string
  choices?: ScenarioChoice[]
}

export interface ScenarioConfig {
  id: string
  title: string
  description?: string
  startNodeId: string
  nodes: ScenarioNode[]
}

export interface ScenarioPathStep {
  nodeId: string
  choiceId?: string
}

export interface ScenarioState {
  currentNodeId: string
  path: ScenarioPathStep[]
  completed: boolean
  correctEndings: number
}

export function ScenarioExercise({
  config,
  onComplete,
  initialState,
}: {
  config: ScenarioConfig
  onComplete?: (state: ScenarioState) => void
  initialState?: ScenarioState
}) {
  const [state, setState] = useState<ScenarioState>(
    initialState || {
      currentNodeId: config.startNodeId,
      path: [{ nodeId: config.startNodeId }],
      completed: false,
      correctEndings: 0,
    },
  )

  const currentNode = config.nodes.find((n) => n.id === state.currentNodeId)
  if (!currentNode) {
    return <div className="p-4 text-red-600">Error: Node not found</div>
  }

  function handleChoice(choice: ScenarioChoice) {
    if (choice.nextNodeId) {
      // Continue to next node
      const newStep: ScenarioPathStep = { nodeId: choice.nextNodeId, choiceId: choice.id }
      setState((prev) => ({
        ...prev,
        currentNodeId: choice.nextNodeId!,
        path: [...prev.path, newStep],
        correctEndings: prev.correctEndings + (choice.isCorrect ? 1 : 0),
      }))
    } else {
      // End scenario
      const newStep: ScenarioPathStep = { nodeId: state.currentNodeId, choiceId: choice.id }
      setState((prev) => ({
        ...prev,
        completed: true,
        path: [...prev.path, newStep],
        correctEndings: prev.correctEndings + (choice.isCorrect ? 1 : 0),
      }))
      onComplete?.({
        ...state,
        completed: true,
        path: [...state.path, newStep],
        correctEndings: state.correctEndings + (choice.isCorrect ? 1 : 0),
      })
    }
  }

  function handleRestart() {
    setState({
      currentNodeId: config.startNodeId,
      path: [{ nodeId: config.startNodeId }],
      completed: false,
      correctEndings: 0,
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
      </div>

      {/* Scene */}
      <div className="space-y-4">
        <div className="p-4 rounded bg-secondary/30 border">
          <h4 className="font-semibold mb-2">{currentNode.title}</h4>
          <p className="text-sm leading-relaxed text-foreground/80">
            {currentNode.description}
          </p>
        </div>

        {/* Choices */}
        {currentNode.choices && currentNode.choices.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              What do you do?
            </p>
            <div className="flex flex-col gap-2">
              {currentNode.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice)}
                  className={cn(
                    "p-4 rounded border-2 text-left transition-all flex items-center gap-3 group",
                    "border-border bg-background hover:border-primary hover:bg-secondary/30",
                  )}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {choice.text}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Outcome feedback */}
        {state.completed && (
          <div className="space-y-3">
            <div
              className={cn(
                "p-4 rounded border",
                state.correctEndings > 0
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100",
              )}
            >
              <p className="text-sm font-medium">
                {state.correctEndings > 0
                  ? "Good choice! You made the right decision."
                  : "Not ideal. Can you find a better solution?"}
              </p>
            </div>

            {/* Show the last choice feedback */}
            {state.path.length > 0 && (
              (() => {
                const lastPath = state.path[state.path.length - 1]
                const lastNode = config.nodes.find((n) => n.id === lastPath.nodeId)
                if (lastNode && lastPath.choiceId) {
                  const lastChoice = lastNode.choices?.find((c) => c.id === lastPath.choiceId)
                  if (lastChoice) {
                    return (
                      <div
                        className={cn(
                          "p-3 rounded text-sm border",
                          lastChoice.isCorrect
                            ? "bg-green-100 dark:bg-green-950 border-green-500 text-green-900 dark:text-green-100"
                            : "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-100",
                        )}
                      >
                        {lastChoice.feedback}
                      </div>
                    )
                  }
                }
                return null
              })()
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {state.completed && (
        <Button onClick={handleRestart} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}

      {/* Path visualization */}
      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-2">Your path:</p>
        <div className="flex flex-wrap gap-1">
          {state.path.map((step, idx) => {
            const node = config.nodes.find((n) => n.id === step.nodeId)
            return (
              <span key={idx}>
                <Badge variant="outline" className="text-xs">
                  {node?.title || "Unknown"}
                </Badge>
                {idx < state.path.length - 1 && <span className="mx-1">→</span>}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
