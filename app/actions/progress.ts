"use server"

import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { lectures, quizAttempts, studySets } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"

export type AccuracyPoint = {
  /** ISO date of the attempt, used as the x-axis key */
  date: string
  label: string
  accuracy: number
  lectureTitle: string
  score: number
  total: number
}

export type ActivityDay = {
  date: string
  label: string
  attempts: number
  questions: number
}

export type LectureBreakdown = {
  lectureId: number
  title: string
  courseName: string | null
  attempts: number
  bestAccuracy: number
  latestAccuracy: number
  averageAccuracy: number
  questionsAnswered: number
}

export type RecentAttempt = {
  id: number
  lectureId: number
  lectureTitle: string
  score: number
  total: number
  accuracy: number
  createdAt: Date
}

export type ProgressOverview = {
  totals: {
    lectures: number
    studySetsReady: number
    quizzesTaken: number
    questionsAnswered: number
    correctAnswers: number
    averageAccuracy: number
    flashcards: number
    minutesEstimated: number
  }
  streak: { current: number; best: number; activeDays: number }
  trend: { delta: number; firstHalf: number; secondHalf: number } | null
  accuracyOverTime: AccuracyPoint[]
  activity: ActivityDay[]
  byLecture: LectureBreakdown[]
  recentAttempts: RecentAttempt[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function dayKey(date: Date) {
  // Local-day bucket in YYYY-MM-DD form.
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function shortLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function percent(score: number, total: number) {
  if (total <= 0) return 0
  return Math.round((score / total) * 100)
}

function mean(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

/** Longest and current run of consecutive active days. */
function computeStreak(dayKeys: string[]) {
  const unique = Array.from(new Set(dayKeys)).sort()
  if (unique.length === 0) return { current: 0, best: 0, activeDays: 0 }

  let best = 1
  let run = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(`${unique[i - 1]}T00:00:00`).getTime()
    const curr = new Date(`${unique[i]}T00:00:00`).getTime()
    run = curr - prev === DAY_MS ? run + 1 : 1
    if (run > best) best = run
  }

  const today = dayKey(new Date())
  const yesterday = dayKey(new Date(Date.now() - DAY_MS))
  const last = unique[unique.length - 1]
  const current = last === today || last === yesterday ? run : 0

  return { current, best, activeDays: unique.length }
}

export async function getProgressOverview(): Promise<ProgressOverview> {
  const userId = await getUserId()

  const [lectureRows, attemptRows, setRows] = await Promise.all([
    db.select().from(lectures).where(eq(lectures.userId, userId)),
    db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(asc(quizAttempts.createdAt)),
    db
      .select({
        lectureId: studySets.lectureId,
        flashcards: studySets.flashcards,
        analysis: studySets.analysis,
      })
      .from(studySets)
      .where(eq(studySets.userId, userId)),
  ])

  const titleFor = new Map(lectureRows.map((l) => [l.id, l.title]))
  const courseFor = new Map(lectureRows.map((l) => [l.id, l.courseName]))

  const flashcards = setRows.reduce((sum, s) => sum + (s.flashcards?.length ?? 0), 0)
  const minutesEstimated = setRows.reduce(
    (sum, s) => sum + (s.analysis?.estimatedStudyMinutes ?? 0),
    0,
  )

  const questionsAnswered = attemptRows.reduce((sum, a) => sum + a.total, 0)
  const correctAnswers = attemptRows.reduce((sum, a) => sum + a.score, 0)

  /* ---------------- accuracy over time (last 30 attempts) ---------------- */
  const accuracyOverTime: AccuracyPoint[] = attemptRows.slice(-30).map((a) => {
    const created = new Date(a.createdAt)
    return {
      date: created.toISOString(),
      label: shortLabel(created),
      accuracy: percent(a.score, a.total),
      lectureTitle: titleFor.get(a.lectureId) ?? "Deleted lecture",
      score: a.score,
      total: a.total,
    }
  })

  /* ---------------- 14-day activity histogram ---------------- */
  const buckets = new Map<string, { attempts: number; questions: number }>()
  for (const a of attemptRows) {
    const key = dayKey(new Date(a.createdAt))
    const bucket = buckets.get(key) ?? { attempts: 0, questions: 0 }
    bucket.attempts += 1
    bucket.questions += a.total
    buckets.set(key, bucket)
  }

  const activity: ActivityDay[] = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(Date.now() - (13 - i) * DAY_MS)
    const key = dayKey(date)
    const bucket = buckets.get(key)
    return {
      date: key,
      label: shortLabel(date),
      attempts: bucket?.attempts ?? 0,
      questions: bucket?.questions ?? 0,
    }
  })

  /* ---------------- per-lecture breakdown ---------------- */
  const grouped = new Map<number, typeof attemptRows>()
  for (const a of attemptRows) {
    const list = grouped.get(a.lectureId) ?? []
    list.push(a)
    grouped.set(a.lectureId, list)
  }

  const byLecture: LectureBreakdown[] = Array.from(grouped.entries())
    .map(([lectureId, list]) => {
      const accuracies = list.map((a) => percent(a.score, a.total))
      return {
        lectureId,
        title: titleFor.get(lectureId) ?? "Deleted lecture",
        courseName: courseFor.get(lectureId) ?? null,
        attempts: list.length,
        bestAccuracy: Math.max(...accuracies),
        latestAccuracy: accuracies[accuracies.length - 1],
        averageAccuracy: mean(accuracies),
        questionsAnswered: list.reduce((sum, a) => sum + a.total, 0),
      }
    })
    .sort((a, b) => a.averageAccuracy - b.averageAccuracy)

  /* ---------------- recent attempts ---------------- */
  const recentAttempts: RecentAttempt[] = attemptRows
    .slice(-8)
    .reverse()
    .map((a) => ({
      id: a.id,
      lectureId: a.lectureId,
      lectureTitle: titleFor.get(a.lectureId) ?? "Deleted lecture",
      score: a.score,
      total: a.total,
      accuracy: percent(a.score, a.total),
      createdAt: new Date(a.createdAt),
    }))

  /* ---------------- first-half vs second-half trend ---------------- */
  let trend: ProgressOverview["trend"] = null
  if (attemptRows.length >= 4) {
    const all = attemptRows.map((a) => percent(a.score, a.total))
    const mid = Math.floor(all.length / 2)
    const firstHalf = mean(all.slice(0, mid))
    const secondHalf = mean(all.slice(mid))
    trend = { firstHalf, secondHalf, delta: secondHalf - firstHalf }
  }

  return {
    totals: {
      lectures: lectureRows.length,
      studySetsReady: lectureRows.filter((l) => l.status === "ready").length,
      quizzesTaken: attemptRows.length,
      questionsAnswered,
      correctAnswers,
      averageAccuracy: percent(correctAnswers, questionsAnswered),
      flashcards,
      minutesEstimated,
    },
    streak: computeStreak(attemptRows.map((a) => dayKey(new Date(a.createdAt)))),
    trend,
    accuracyOverTime,
    activity,
    byLecture,
    recentAttempts,
  }
}
