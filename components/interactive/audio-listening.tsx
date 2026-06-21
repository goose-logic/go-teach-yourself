"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Volume2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AudioListeningConfig {
  id: string
  audioUrl: string
  title: string
  description?: string
  transcript?: string
  questions: Array<{
    id: string
    timestamp?: number // seconds
    question: string
    options: string[]
    correctIndex: number
    explanation: string
  }>
}

export interface AudioListeningState {
  currentQuestionIndex: number
  selectedAnswers: Record<string, number | null> // questionId -> selectedIndex
  completed: boolean
  score: number
}

export function AudioListeningExercise({
  config,
  onComplete,
  initialState,
}: {
  config: AudioListeningConfig
  onComplete?: (state: AudioListeningState) => void
  initialState?: AudioListeningState
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const [state, setState] = useState<AudioListeningState>(
    initialState || {
      currentQuestionIndex: 0,
      selectedAnswers: {},
      completed: false,
      score: 0,
    },
  )

  const currentQuestion = config.questions[state.currentQuestionIndex]
  const selectedIndex = state.selectedAnswers[currentQuestion.id]
  const isAnswered = selectedIndex !== null && selectedIndex !== undefined
  const isCorrect = selectedIndex === currentQuestion.correctIndex

  // When there's no real audio file, read the transcript aloud via the browser's
  // built-in speech synthesis so the listening exercise still works with no backend.
  const useSpeech = !config.audioUrl && !!config.transcript

  function handlePlayPause() {
    if (useSpeech) {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : null
      if (!synth) return
      if (isPlaying) {
        synth.cancel()
        setIsPlaying(false)
      } else {
        synth.cancel()
        const utterance = new SpeechSynthesisUtterance(config.transcript)
        utterance.rate = 0.95
        utterance.onend = () => setIsPlaying(false)
        utterance.onerror = () => setIsPlaying(false)
        synth.speak(utterance)
        setIsPlaying(true)
      }
      return
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  function handleSelectAnswer(optionIndex: number) {
    setState((prev) => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [currentQuestion.id]: optionIndex,
      },
    }))
  }

  function handleNext() {
    if (state.currentQuestionIndex < config.questions.length - 1) {
      setState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }))
    } else {
      // Calculate final score
      const correct = config.questions.filter(
        (q) => state.selectedAnswers[q.id] === q.correctIndex,
      ).length
      const finalScore = Math.round((correct / config.questions.length) * 100)
      const completed: AudioListeningState = {
        ...state,
        completed: true,
        score: finalScore,
      }
      setState(completed)
      onComplete?.(completed)
    }
  }

  if (state.completed) {
    return (
      <div className="space-y-6 rounded-lg border bg-card p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Listening Exercise Complete</h3>
          <p className="text-3xl font-bold text-primary mt-2">{state.score}%</p>
          <p className="text-sm text-muted-foreground mt-1">
            {Math.round((state.score / 100) * config.questions.length)} of{" "}
            {config.questions.length} correct
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      {/* Audio Player */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="outline"
            onClick={handlePlayPause}
            className="shrink-0"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          {useSpeech ? (
            <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="h-4 w-4" />
              <span>{isPlaying ? "Playing the passage aloud…" : "Press play to listen to the passage"}</span>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-1">
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </div>

        {!useSpeech && (
          <audio
            ref={audioRef}
            src={config.audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          />
        )}

        {config.transcript && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full"
          >
            {showTranscript ? "Hide" : "Show"} Transcript
          </Button>
        )}

        {showTranscript && config.transcript && (
          <div className="text-sm bg-secondary/50 p-3 rounded italic text-foreground/80">
            {config.transcript}
          </div>
        )}
      </div>

      {/* Question */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{currentQuestion.question}</h4>
            <Badge variant="outline">
              {state.currentQuestionIndex + 1} / {config.questions.length}
            </Badge>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            const selected = selectedIndex === idx
            const isCorrectOption = idx === currentQuestion.correctIndex
            let bgClass = "bg-background hover:bg-secondary/50"

            if (isAnswered) {
              if (selected && isCorrect) {
                bgClass = "bg-green-100 dark:bg-green-950 border-green-500"
              } else if (selected && !isCorrect) {
                bgClass = "bg-red-100 dark:bg-red-950 border-red-500"
              } else if (isCorrectOption && !isCorrect) {
                bgClass = "bg-green-50 dark:bg-green-950/30 border-green-500"
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(idx)}
                disabled={isAnswered}
                className={cn(
                  "w-full text-left p-3 rounded border transition-all flex items-center gap-3",
                  bgClass,
                  selected && "border-2",
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground",
                  )}
                >
                  {selected && isAnswered && (
                    isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )
                  )}
                </div>
                <span className="flex-1">{option}</span>
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div
            className={cn(
              "p-3 rounded text-sm",
              isCorrect
                ? "bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800",
            )}
          >
            {isCorrect ? "Correct!" : "Incorrect."} {currentQuestion.explanation}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
              }))
            }
            disabled={state.currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className="flex-1"
          >
            {state.currentQuestionIndex === config.questions.length - 1
              ? "Complete"
              : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
