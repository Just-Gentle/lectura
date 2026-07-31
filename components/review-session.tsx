"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { gradeCard, type ReviewCard } from "@/app/actions/reviews"
import type { ReviewRating } from "@/lib/db/schema"
import { intervalLabel } from "@/lib/review/scheduler"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const RATINGS: { rating: ReviewRating; label: string; hint: string; key: string }[] = [
  { rating: "again", label: "Again", hint: "Forgot it", key: "1" },
  { rating: "hard", label: "Hard", hint: "Struggled", key: "2" },
  { rating: "good", label: "Good", hint: "Recalled it", key: "3" },
  { rating: "easy", label: "Easy", hint: "Instant", key: "4" },
]

export function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const router = useRouter()
  const [queue, setQueue] = useState(cards)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0, easy: 0 })
  const [pending, startTransition] = useTransition()

  const card = queue[index]
  const done = index >= queue.length

  const grade = useCallback(
    (rating: ReviewRating) => {
      if (!card || pending) return

      setTally((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))

      startTransition(async () => {
        try {
          await gradeCard({
            lectureId: card.lectureId,
            cardIndex: card.cardIndex,
            front: card.front,
            rating,
          })
        } catch {
          toast.error("That review could not be saved.")
        }

        // A lapsed card comes back at the end of this session.
        if (rating === "again") {
          setQueue((prev) => [...prev, { ...prev[index], isNew: false }])
        }
        setRevealed(false)
        setIndex((prev) => prev + 1)
      })
    },
    [card, index, pending],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (done) return

      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault()
        setRevealed(true)
        return
      }
      if (!revealed) return

      const match = RATINGS.find((r) => r.key === event.key)
      if (match) {
        event.preventDefault()
        grade(match.rating)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [revealed, done, grade])

  const reviewed = tally.again + tally.hard + tally.good + tally.easy
  const progress = queue.length === 0 ? 100 : Math.round((index / queue.length) * 100)

  if (done) {
    const retained = tally.good + tally.easy
    return (
      <Card className="flex flex-col items-center gap-5 px-6 py-16 text-center">
        <div className="rounded-full bg-accent/10 p-4">
          <CheckCircle2 className="h-8 w-8 text-accent" aria-hidden="true" />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-semibold">Session complete</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You reviewed {reviewed} {reviewed === 1 ? "card" : "cards"} and recalled{" "}
            {retained} of them without trouble. Each card is now scheduled for the day
            you are most likely to be about to forget it.
          </p>
        </div>
        <dl className="flex flex-wrap justify-center gap-2">
          {RATINGS.map(({ rating, label }) => (
            <div
              key={rating}
              className="flex items-baseline gap-1.5 rounded-md border border-border px-3 py-1.5"
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-semibold">{tally[rating]}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.refresh()}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Check for more
          </Button>
          <Button variant="outline" render={<Link href="/dashboard" />}>
            Back to lectures
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground" aria-live="polite">
            Card {index + 1} of {queue.length}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} aria-label="Session progress" />
      </div>

      <Card
        role="button"
        tabIndex={0}
        aria-label={`Flashcard. ${revealed ? "Answer shown." : "Press to reveal the answer."}`}
        onClick={() => setRevealed(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setRevealed(true)
          }
        }}
        className="cursor-pointer transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-5 p-6 text-center sm:p-10">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">{card.lectureTitle}</Badge>
            {card.isNew ? (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                New
              </Badge>
            ) : (
              <Badge variant="outline">
                {card.state.intervalDays > 0
                  ? `Last gap ${card.state.intervalDays}d`
                  : "Relearning"}
              </Badge>
            )}
          </div>

          <p className="text-lg leading-relaxed font-medium text-pretty">
            {card.front}
          </p>

          {revealed ? (
            <>
              <div className="h-px w-16 bg-border" />
              <p className="text-base leading-relaxed text-muted-foreground text-pretty">
                {card.back}
              </p>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              Click or press Space to reveal
            </span>
          )}
        </CardContent>
      </Card>

      {revealed ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RATINGS.map(({ rating, label, hint, key }) => (
            <Button
              key={rating}
              variant={rating === "good" ? "default" : "outline"}
              disabled={pending}
              onClick={() => grade(rating)}
              className="h-auto flex-col items-center gap-0.5 py-3"
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs font-normal opacity-75">
                {hint} · {intervalLabel(card.state, rating)}
              </span>
              <span className="sr-only">Keyboard shortcut {key}</span>
            </Button>
          ))}
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setRevealed(true)}>
          Reveal answer
        </Button>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Shortcuts: Space reveals, then 1 Again · 2 Hard · 3 Good · 4 Easy
      </p>
    </div>
  )
}
