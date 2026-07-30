import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, FileText, RotateCcw } from "lucide-react"
import {
  getLecture,
  getStudySet,
  listQuizAttempts,
} from "@/app/actions/lectures"
import { AppHeader } from "@/components/app-header"
import { GenerateStudySetPanel } from "@/components/generate-study-set-panel"
import { RegenerateButton } from "@/components/regenerate-button"
import { StudySetView } from "@/components/study-set-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/session"

export default async function LecturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const { id } = await params
  const lectureId = Number(id)
  if (!Number.isInteger(lectureId)) notFound()

  const lecture = await getLecture(lectureId)
  if (!lecture) notFound()

  const [studySet, attempts] = await Promise.all([
    getStudySet(lectureId),
    listQuizAttempts(lectureId),
  ])

  return (
    <div className="min-h-svh">
      <AppHeader name={user.name} email={user.email} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Button
          render={<Link href="/dashboard" />}
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to lectures
        </Button>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {lecture.courseName && (
              <p className="text-sm font-medium text-accent">
                {lecture.courseName}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              {lecture.title}
            </h1>
            <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" aria-hidden="true" />
                <dt className="sr-only">File</dt>
                <dd>{lecture.fileName}</dd>
              </div>
              <div>
                <dt className="sr-only">Pages</dt>
                <dd>{lecture.pageCount} pages</dd>
              </div>
              <div>
                <dt className="sr-only">Words</dt>
                <dd>{lecture.wordCount.toLocaleString()} words</dd>
              </div>
            </dl>
          </div>

          {studySet && <RegenerateButton lectureId={lectureId} />}
        </div>

        {studySet ? (
          <div className="flex flex-col gap-8">
            <StudySetView lectureId={lectureId} studySet={studySet} />

            {attempts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RotateCcw className="h-4 w-4 text-accent" aria-hidden="true" />
                    Quiz history
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col divide-y divide-border">
                    {attempts.map((attempt) => (
                      <li
                        key={attempt.id}
                        className="flex items-center justify-between gap-4 py-3 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {new Date(attempt.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge
                          variant={
                            attempt.score / Math.max(attempt.total, 1) >= 0.7
                              ? "default"
                              : "secondary"
                          }
                        >
                          {attempt.score} / {attempt.total}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <GenerateStudySetPanel
            lectureId={lectureId}
            status={lecture.status}
            errorMessage={lecture.errorMessage}
            hasStudySet={false}
          />
        )}
      </main>
    </div>
  )
}
