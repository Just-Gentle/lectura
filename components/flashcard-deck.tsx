"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import type { Flashcard } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const card = cards[index]

  function go(delta: number) {
    setFlipped(false)
    setIndex((prev) => (prev + delta + cards.length) % cards.length)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Card {index + 1} of {cards.length}
      </p>

      <Card
        role="button"
        tabIndex={0}
        aria-label={`Flashcard ${index + 1}. Press to ${flipped ? "hide" : "reveal"} the answer.`}
        onClick={() => setFlipped((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setFlipped((prev) => !prev)
          }
        }}
        className="flex min-h-64 w-full max-w-2xl cursor-pointer flex-col items-center justify-center gap-4 p-8 text-center transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {flipped ? "Answer" : "Prompt"}
        </span>
        <p className="text-lg leading-relaxed text-pretty">
          {flipped ? card.back : card.front}
        </p>
        {!flipped && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Click to reveal
          </span>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Previous card">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button variant="secondary" onClick={() => setFlipped((prev) => !prev)}>
          {flipped ? "Hide answer" : "Reveal answer"}
        </Button>
        <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Next card">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
