"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { FileText, Loader2, Plus, Upload } from "lucide-react"
import { toast } from "sonner"
import { uploadLecture } from "@/app/actions/lectures"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadLectureDialog({ variant = "default" }: { variant?: "default" | "empty" }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    setPending(true)
    try {
      const result = await uploadLecture(formData)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Lecture uploaded. Generating your study set…")
      setOpen(false)
      setFile(null)
      form.reset()
      router.push(`/lectures/${result.lectureId}?generate=1`)
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        {variant === "empty" ? (
          <Button size="lg">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload your first lecture
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New lecture
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a lecture</DialogTitle>
          <DialogDescription>
            Add a lecture PDF and we&apos;ll build a summary, quiz, flashcards, and notes
            from it.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Lecture PDF</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept="application/pdf,.pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Text-based PDFs up to 20 MB. Scanned slides are not supported.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Week 4 — Neural Networks"
              maxLength={140}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the file name.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="courseName">Course (optional)</Label>
            <Input
              id="courseName"
              name="courseName"
              placeholder="CS229 Machine Learning"
              maxLength={140}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {pending ? "Reading PDF…" : "Upload lecture"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
