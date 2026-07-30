import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  CalendarDays,
  Flame,
  LineChart,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { getProgressOverview } from "@/app/actions/progress"
import { AppHeader } from "@/components/app-header"
import { AccuracyTrendChart, ActivityChart } from "@/components/progress-charts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getCurrentUser } from "@/lib/session"

export const metadata = {
  title: "Progress — Lecture Assistant",
  description:
    "Track your quiz accuracy over time, study streaks, and the lectures that need more revision.",
}

function accuracyTone(value: number) {
  if (value >= 80) return "text-chart-2"
  if (value >= 60) return "text-foreground"
  return "text-destructive"
}

export default async function ProgressPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const { totals, streak, trend, accuracyOverTime, activity, byLecture, recentAttempts } =
    await getProgressOverview()

  const hasAttempts = totals.quizzesTaken > 0
  const focus = byLecture.filter((l) => l.averageAccuracy < 80).slice(0, 5)
  const mastered = byLecture.filter((l) => l.averageAccuracy >= 80)

  const stats = [
    {
      icon: Target,
      label: "Average accuracy",
      value: `${totals.averageAccuracy}%`,
      hint: `${totals.correctAnswers.toLocaleString()} of ${totals.questionsAnswered.toLocaleString()} questions correct`,
    },
    {
      icon: LineChart,
      label: "Quizzes taken",
      value: totals.quizzesTaken.toLocaleString(),
      hint: `across ${byLecture.length} ${byLecture.length === 1 ? "lecture" : "lectures"}`,
    },
    {
      icon: Flame,
      label: "Current streak",
      value: `${streak.current} ${streak.current === 1 ? "day" : "days"}`,
      hint: `best ${streak.best} · ${streak.activeDays} active days`,
    },
    {
      icon: CalendarDays,
      label: "Study time banked",
      value: `${Math.round(totals.minutesEstimated / 60)}h`,
      hint: `${totals.flashcards.toLocaleString()} flashcards generated`,
    },
  ]

  return (
    <div className="min-h-svh">
      <AppHeader name={user.name} email={user.email} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Progress</h1>
            <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
              Every quiz you finish is scored and tracked here, so you can see what is
              sticking and what still needs another pass.
            </p>
          </div>
          <Button render={<Link href="/dashboard" />} variant="secondary">
            Back to lectures
          </Button>
        </div>

        {!hasAttempts ? (
          <Card className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="rounded-full bg-accent/10 p-4">
              <LineChart className="h-8 w-8 text-accent" aria-hidden="true" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-semibold">No quiz results yet</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Open a lecture with a generated study set and finish its quiz. Your score
                history, streaks, and weak topics will appear here straight away.
              </p>
            </div>
            <Button render={<Link href="/dashboard" />}>
              Go to your lectures
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Summary stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(({ icon: Icon, label, value, hint }) => (
                <Card key={label} className="gap-0 p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                    {label}
                  </div>
                  <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {hint}
                  </p>
                </Card>
              ))}
            </div>

            {/* Accuracy trend */}
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Accuracy over time</CardTitle>
                  <CardDescription>
                    {accuracyOverTime.length === 1
                      ? "Your first recorded quiz."
                      : `Your last ${accuracyOverTime.length} quiz attempts.`}
                  </CardDescription>
                </div>
                {trend && (
                  <Badge variant={trend.delta >= 0 ? "default" : "destructive"}>
                    {trend.delta >= 0 ? (
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="h-3 w-3" aria-hidden="true" />
                    )}
                    {trend.delta >= 0 ? "+" : ""}
                    {trend.delta} pts vs earlier attempts
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <AccuracyTrendChart
                  data={accuracyOverTime}
                  average={totals.averageAccuracy}
                />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-5">
              {/* Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Last 14 days</CardTitle>
                  <CardDescription>
                    Questions answered per day. Consistency beats cramming.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityChart data={activity} />
                </CardContent>
              </Card>

              {/* Needs revision */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Needs another pass</CardTitle>
                  <CardDescription>
                    {focus.length > 0
                      ? "Lectures scoring under 80% on average."
                      : "Nothing under 80% — every lecture is in good shape."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {focus.length > 0 ? (
                    <ul className="flex flex-col gap-5">
                      {focus.map((lecture) => (
                        <li key={lecture.lectureId} className="flex flex-col gap-2">
                          <div className="flex items-baseline justify-between gap-3">
                            <Link
                              href={`/lectures/${lecture.lectureId}`}
                              className="truncate text-sm font-medium hover:underline"
                            >
                              {lecture.title}
                            </Link>
                            <span
                              className={`shrink-0 text-sm font-semibold tabular-nums ${accuracyTone(lecture.averageAccuracy)}`}
                            >
                              {lecture.averageAccuracy}%
                            </span>
                          </div>
                          <Progress value={lecture.averageAccuracy} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">
                            {lecture.attempts}{" "}
                            {lecture.attempts === 1 ? "attempt" : "attempts"} · best{" "}
                            {lecture.bestAccuracy}% · latest {lecture.latestAccuracy}%
                            {lecture.courseName ? ` · ${lecture.courseName}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      {mastered.length} {mastered.length === 1 ? "lecture" : "lectures"}{" "}
                      averaging 80% or better. Upload something new to keep going.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent attempts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent attempts</CardTitle>
                <CardDescription>Your latest scored quizzes.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {recentAttempts.map((attempt) => (
                    <li
                      key={attempt.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/lectures/${attempt.lectureId}`}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {attempt.lectureTitle}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {attempt.createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          ·{" "}
                          {attempt.createdAt.toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {attempt.score}/{attempt.total}
                        </span>
                        <span
                          className={`text-sm font-semibold tabular-nums ${accuracyTone(attempt.accuracy)}`}
                        >
                          {attempt.accuracy}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
