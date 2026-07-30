import { redirect } from "next/navigation"
import { BookOpen, CheckCircle2, FileText, Layers } from "lucide-react"
import { listLectures } from "@/app/actions/lectures"
import { AppHeader } from "@/components/app-header"
import { LectureBrowser } from "@/components/lecture-browser"
import { UploadLectureDialog } from "@/components/upload-lecture-dialog"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/session"

export const metadata = {
  title: "Dashboard — Lecture Assistant",
  description: "Your uploaded lectures and generated study sets.",
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const lectures = await listLectures()
  const ready = lectures.filter((l) => l.status === "ready").length
  const totalPages = lectures.reduce((sum, l) => sum + l.pageCount, 0)

  const stats = [
    { icon: FileText, label: "Lectures", value: lectures.length },
    { icon: CheckCircle2, label: "Study sets ready", value: ready },
    { icon: Layers, label: "Pages analysed", value: totalPages },
  ]

  return (
    <div className="min-h-svh">
      <AppHeader name={user.name} email={user.email} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              Your lectures
            </h1>
            <p className="mt-2 text-muted-foreground">
              Upload a lecture PDF to generate a summary, quiz, flashcards, and
              revision notes.
            </p>
          </div>
          {lectures.length > 0 && <UploadLectureDialog />}
        </div>

        {lectures.length > 0 && (
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {stats.map(({ icon: Icon, label, value }) => (
              <Card key={label} className="flex flex-row items-center gap-4 p-5">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {lectures.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="rounded-full bg-accent/10 p-4">
              <BookOpen className="h-8 w-8 text-accent" aria-hidden="true" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-semibold">No lectures yet</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Upload your first lecture PDF and we&apos;ll turn it into a
                complete study kit in under a minute.
              </p>
            </div>
            <UploadLectureDialog variant="empty" />
          </Card>
        ) : (
          <LectureBrowser lectures={lectures} />
        )}
      </main>
    </div>
  )
}
