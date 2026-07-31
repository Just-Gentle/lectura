import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarClock, Layers, Sparkles, Zap } from "lucide-react"
import { getReviewQueue } from "@/app/actions/reviews"
import { AppHeader } from "@/components/app-header"
import { ReviewSession } from "@/components/review-session"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/session"

export const metadata = {
  title: "Review — Lecture Assistant",
  description: "Spaced repetition review of the flashcards from your lectures.",
}

function relativeDay(iso: string) {
  const target = new Date(iso)
  const diffMs = target.getTime() - Date.now()
  const hours = Math.round(diffMs / (60 * 60 * 1000))
  if (hours < 1) return "in a few minutes"
  if (hours < 24) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`
  const days = Math.round(hours / 24)
  return `in ${days} ${days === 1 ? "day" : "days"}`
}

export default async function ReviewPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const { cards, counts, nextDueAt } = await getReviewQueue()

  const stats = [
    { icon: Zap, label: "Due now", value: counts.due },
    { icon: Sparkles, label: "Not yet seen", value: counts.new },
    { icon: Layers, label: "Cards tracked", value: counts.tracked },
    { icon: CalendarClock, label: "Reviewed today", value: counts.reviewedToday },
  ]

  return (
    <div className="min-h-svh">
      <AppHeader name={user.name} email={user.email} />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Daily review
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Cards from every lecture, scheduled so you see each one just before you
            would forget it. Rate your recall honestly and the intervals adapt.
          </p>
        </div>

        {counts.total > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <Card key={label} className="gap-0 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  <span className="text-xs">{label}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </Card>
            ))}
          </div>
        )}

        {counts.total === 0 ? (
          <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="rounded-full bg-accent/10 p-4">
              <Layers className="h-8 w-8 text-accent" aria-hidden="true" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-semibold">No flashcards yet</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Upload a lecture and generate its study set. Every flashcard it
                produces lands in this review queue automatically.
              </p>
            </div>
            <Button render={<Link href="/dashboard" />}>Go to lectures</Button>
          </Card>
        ) : cards.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="rounded-full bg-accent/10 p-4">
              <CalendarClock className="h-8 w-8 text-accent" aria-hidden="true" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-semibold">Nothing due right now</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                You are caught up on all {counts.tracked} tracked{" "}
                {counts.tracked === 1 ? "card" : "cards"}.
                {nextDueAt ? ` The next one is due ${relativeDay(nextDueAt)}.` : ""}
              </p>
            </div>
            <Button variant="outline" render={<Link href="/progress" />}>
              See your progress
            </Button>
          </Card>
        ) : (
          <>
            <ReviewSession cards={cards} />
            {counts.dueBacklog > 0 && (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {counts.dueBacklog} more overdue{" "}
                {counts.dueBacklog === 1 ? "card is" : "cards are"} waiting. Finish this
                session and start another to keep chipping away.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
