"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  cardReviews,
  lectures,
  studySets,
  type ReviewRating,
} from "@/lib/db/schema"
import {
  NEW_CARD_STATE,
  isMature,
  schedule,
  type SchedulerState,
} from "@/lib/review/scheduler"
import { getUserId } from "@/lib/session"

/** How many never-seen cards to introduce in a single session. */
const NEW_PER_SESSION = 12
/** Hard cap on session length so a large backlog stays approachable. */
const SESSION_LIMIT = 40

export type ReviewCard = {
  lectureId: number
  lectureTitle: string
  courseName: string | null
  cardIndex: number
  front: string
  back: string
  state: SchedulerState
  isNew: boolean
  dueAt: string | null
}

export type ReviewQueue = {
  cards: ReviewCard[]
  counts: {
    due: number
    new: number
    learning: number
    mature: number
    tracked: number
    total: number
    dueBacklog: number
    reviewedToday: number
  }
  nextDueAt: string | null
}

type CardRow = {
  lectureId: number
  lectureTitle: string
  courseName: string | null
  cardIndex: number
  front: string
  back: string
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Builds the review session: everything overdue first, then a few new cards. */
export async function getReviewQueue(): Promise<ReviewQueue> {
  const userId = await getUserId()
  const now = new Date()

  const [setRows, reviewRows] = await Promise.all([
    db
      .select({
        lectureId: studySets.lectureId,
        flashcards: studySets.flashcards,
        title: lectures.title,
        courseName: lectures.courseName,
      })
      .from(studySets)
      .innerJoin(lectures, eq(lectures.id, studySets.lectureId))
      .where(and(eq(studySets.userId, userId), eq(lectures.userId, userId))),
    db.select().from(cardReviews).where(eq(cardReviews.userId, userId)),
  ])

  const allCards: CardRow[] = []
  for (const set of setRows) {
    const flashcards = set.flashcards ?? []
    flashcards.forEach((card, cardIndex) => {
      allCards.push({
        lectureId: set.lectureId,
        lectureTitle: set.title,
        courseName: set.courseName,
        cardIndex,
        front: card.front,
        back: card.back,
      })
    })
  }

  const reviewFor = new Map(
    reviewRows.map((row) => [`${row.lectureId}:${row.cardIndex}`, row]),
  )

  const due: ReviewCard[] = []
  const fresh: ReviewCard[] = []
  let learning = 0
  let mature = 0
  let reviewedToday = 0

  for (const card of allCards) {
    const row = reviewFor.get(`${card.lectureId}:${card.cardIndex}`)

    if (!row) {
      fresh.push({ ...card, state: NEW_CARD_STATE, isNew: true, dueAt: null })
      continue
    }

    if (isMature(row.intervalDays)) mature += 1
    else learning += 1
    if (isSameDay(new Date(row.lastReviewedAt), now)) reviewedToday += 1

    if (new Date(row.dueAt) <= now) {
      due.push({
        ...card,
        state: {
          repetitions: row.repetitions,
          lapses: row.lapses,
          totalReviews: row.totalReviews,
          intervalDays: row.intervalDays,
          easeHundredths: row.easeHundredths,
        },
        isNew: false,
        dueAt: new Date(row.dueAt).toISOString(),
      })
    }
  }

  // Most overdue first, so nothing rots at the bottom of a backlog.
  due.sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""))

  const cards = [...due, ...fresh.slice(0, NEW_PER_SESSION)].slice(0, SESSION_LIMIT)

  const upcoming = reviewRows
    .map((row) => new Date(row.dueAt))
    .filter((date) => date > now)
    .sort((a, b) => a.getTime() - b.getTime())

  return {
    cards,
    counts: {
      due: due.length,
      new: fresh.length,
      learning,
      mature,
      tracked: reviewRows.length,
      total: allCards.length,
      dueBacklog: Math.max(0, due.length - cards.length),
      reviewedToday,
    },
    nextDueAt: upcoming[0]?.toISOString() ?? null,
  }
}

/** Counts used by the dashboard and header badge. */
export async function getDueSummary() {
  const { counts, nextDueAt } = await getReviewQueue()
  return { ...counts, nextDueAt }
}

export async function gradeCard({
  lectureId,
  cardIndex,
  front,
  rating,
}: {
  lectureId: number
  cardIndex: number
  front: string
  rating: ReviewRating
}) {
  const userId = await getUserId()

  const [lecture] = await db
    .select({ id: lectures.id })
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), eq(lectures.userId, userId)))
    .limit(1)
  if (!lecture) throw new Error("Lecture not found")

  const [existing] = await db
    .select()
    .from(cardReviews)
    .where(
      and(
        eq(cardReviews.userId, userId),
        eq(cardReviews.lectureId, lectureId),
        eq(cardReviews.cardIndex, cardIndex),
      ),
    )
    .limit(1)

  const current: SchedulerState = existing
    ? {
        repetitions: existing.repetitions,
        lapses: existing.lapses,
        totalReviews: existing.totalReviews,
        intervalDays: existing.intervalDays,
        easeHundredths: existing.easeHundredths,
      }
    : NEW_CARD_STATE

  const next = schedule(current, rating)
  const now = new Date()

  if (existing) {
    await db
      .update(cardReviews)
      .set({
        front,
        repetitions: next.repetitions,
        lapses: next.lapses,
        totalReviews: next.totalReviews,
        intervalDays: next.intervalDays,
        easeHundredths: next.easeHundredths,
        lastRating: next.lastRating,
        dueAt: next.dueAt,
        lastReviewedAt: now,
      })
      .where(eq(cardReviews.id, existing.id))
  } else {
    await db.insert(cardReviews).values({
      userId,
      lectureId,
      cardIndex,
      front,
      repetitions: next.repetitions,
      lapses: next.lapses,
      totalReviews: next.totalReviews,
      intervalDays: next.intervalDays,
      easeHundredths: next.easeHundredths,
      lastRating: next.lastRating,
      dueAt: next.dueAt,
      lastReviewedAt: now,
    })
  }

  // Deliberately no revalidatePath here: invalidating /review mid-session would
  // re-render the page with an empty queue and unmount the session summary.
  // The client refreshes explicitly when the user asks for more cards.
  return { intervalDays: next.intervalDays, dueAt: next.dueAt.toISOString() }
}

/** Clears scheduling for one lecture's cards so the deck starts over. */
export async function resetLectureReviews(lectureId: number) {
  const userId = await getUserId()
  await db
    .delete(cardReviews)
    .where(and(eq(cardReviews.userId, userId), eq(cardReviews.lectureId, lectureId)))
  revalidatePath("/review")
  revalidatePath(`/lectures/${lectureId}`)
}
