"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { generateStudySetForLecture } from "@/app/actions/lectures"
import { Button } from "@/components/ui/button"

export function RegenerateButton({ lectureId }: { lectureId: number }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)

  async function handleClick() {
    setRunning(true)
    try {
      const result = await generateStudySetForLecture(lectureId)
      if (result.ok) {
        toast.success("Study set regenerated.")
      } else {
        toast.error(result.error ?? "Regeneration failed.")
      }
      router.refresh()
    } catch {
      toast.error("Regeneration failed. Please try again.")
    } finally {
      setRunning(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={running}>
      {running ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      )}
      {running ? "Regenerating…" : "Regenerate"}
    </Button>
  )
}
