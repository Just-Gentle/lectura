import type { ReviewRating } from "@/lib/db/schema"

/**
 * A small SM-2 variant. Ease is carried around in hundredths so it can live in
 * an integer column, and a lapse ("again") sends the card back to a short
 * relearning step instead of dropping it out of the session.
 */

export const MIN_EASE = 130
export const MAX_EASE = 300
export const MAX_INTERVAL_DAYS = 365
/** Relearning delay for a lapsed card, in minutes. */
export const RELEARN_MINUTES = 10

const DAY_MS = 24 * 60 * 60 * 1000

export type SchedulerState = {
  repetitions: number
  lapses: number
  totalReviews: number
  intervalDays: number
  easeHundredths: number
}

export type SchedulerResult = SchedulerState & {
  dueAt: Date
  lastRating: ReviewRating
}

export const NEW_CARD_STATE: SchedulerState = {
  repetitions: 0,
  lapses: 0,
  totalReviews: 0,
  intervalDays: 0,
  easeHundredths: 250,
}

function clampEase(value: number) {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, Math.round(value)))
}

function clampInterval(value: number) {
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(value)))
}

export function schedule(
  state: SchedulerState,
  rating: ReviewRating,
  now: Date = new Date(),
): SchedulerResult {
  const ease = state.easeHundredths / 100
  const base: SchedulerState = {
    ...state,
    totalReviews: state.totalReviews + 1,
  }

  if (rating === "again") {
    return {
      ...base,
      repetitions: 0,
      lapses: state.lapses + 1,
      intervalDays: 0,
      easeHundredths: clampEase(state.easeHundredths - 20),
      dueAt: new Date(now.getTime() + RELEARN_MINUTES * 60 * 1000),
      lastRating: rating,
    }
  }

  let intervalDays: number
  if (rating === "hard") {
    intervalDays = state.repetitions === 0 ? 1 : clampInterval(state.intervalDays * 1.2)
  } else if (rating === "good") {
    if (state.repetitions === 0) intervalDays = 1
    else if (state.repetitions === 1) intervalDays = 3
    else intervalDays = clampInterval(state.intervalDays * ease)
  } else {
    intervalDays =
      state.repetitions === 0 ? 3 : clampInterval(state.intervalDays * ease * 1.3)
  }

  const easeDelta = rating === "hard" ? -15 : rating === "easy" ? 15 : 0

  return {
    ...base,
    repetitions: state.repetitions + 1,
    intervalDays,
    easeHundredths: clampEase(state.easeHundredths + easeDelta),
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
    lastRating: rating,
  }
}

/** Human-readable "next review" copy for a rating preview. */
export function intervalLabel(state: SchedulerState, rating: ReviewRating) {
  if (rating === "again") return `${RELEARN_MINUTES} min`
  const { intervalDays } = schedule(state, rating)
  if (intervalDays === 1) return "1 day"
  if (intervalDays < 30) return `${intervalDays} days`
  const months = Math.round(intervalDays / 30)
  return months === 1 ? "1 month" : `${months} months`
}

/** Cards are "mature" once they survive to a week or longer between reviews. */
export function isMature(intervalDays: number) {
  return intervalDays >= 7
}
