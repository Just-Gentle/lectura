"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { generateStudySetForLecture } from "@/app/actions/lectures"
import type { LectureStatus } from "@/lib/db/schema"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function GenerateStudySetPanel({
  lectureId,
  status,
  errorMessage,
  hasStudySet,
}: {
  lectureId: number
  status: LectureStatus
  errorMessage: string | null
  hasStudySet: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoTriggered = useRef(false)
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    try {
      const result = await generateStudySetForLecture(lectureId)
      if (result.ok) {
        toast.success("Your study set is ready.")
      } else {
        toast.error(result.error ?? "Generation failed.")
      }
      router.refresh()
    } catch {
      toast.error("Generation failed. Please try again.")
    } finally {
      setRunning(false)
    }
  }

  // Auto-start once when arriving straight from the upload dialog.
  useEffect(() => {
    if (autoTriggered.current) return
    if (searchParams.get("generate") !== "1") return
    if (hasStudySet || status === "processing") return

    autoTriggered.current = true
    router.replace(`/lectures/${lectureId}`)
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (running || status === "processing") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
          <div className="max-w-md">
            <h2 className="text-lg font-semibold">Building your study set</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The AI is reading your lecture and writing a summary, quiz,
              flashcards, and notes. This usually takes under a minute.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        {status === "failed" && errorMessage && (
          <Alert variant="destructive" className="text-left">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Generation failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-full bg-accent/10 p-4">
          <Sparkles className="h-7 w-7 text-accent" aria-hidden="true" />
        </div>
        <div className="max-w-md">
          <h2 className="text-lg font-semibold">
            {status === "failed" ? "Try generating again" : "Ready to generate"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We&apos;ll turn this lecture into a summary, an exam-style quiz,
            flashcards, and revision notes.
          </p>
        </div>
        <Button size="lg" onClick={run}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Generate study set
        </Button>
      </CardContent>
    </Card>
  )
}
