"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FileText, Loader2, MoreVertical, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteLecture } from "@/app/actions/lectures"
import type { Lecture } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Not generated", variant: "outline" },
  processing: { label: "Generating", variant: "secondary" },
  ready: { label: "Ready", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
}

export function LectureCard({ lecture }: { lecture: Lecture }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const status = statusLabel[lecture.status] ?? statusLabel.pending

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteLecture(lecture.id)
      toast.success("Lecture deleted.")
      router.refresh()
    } catch {
      toast.error("Could not delete that lecture.")
      setDeleting(false)
    }
  }

  return (
    <Card className="flex h-full flex-col transition-colors hover:border-accent/50">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Badge variant={status.variant} className="w-fit">
            {lecture.status === "processing" && (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            )}
            {status.label}
          </Badge>
          <CardTitle className="text-balance text-base leading-snug">
            <Link href={`/lectures/${lecture.id}`} className="hover:underline">
              {lecture.title}
            </Link>
          </CardTitle>
          {lecture.courseName && (
            <p className="text-sm text-muted-foreground">{lecture.courseName}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />
            }
            aria-label={`Actions for ${lecture.title}`}
          >
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {deleting ? "Deleting…" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="mt-auto flex flex-col gap-3">
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <dt className="sr-only">Pages</dt>
            <dd>{lecture.pageCount} pages</dd>
          </div>
          <div>
            <dt className="sr-only">Words</dt>
            <dd>{lecture.wordCount.toLocaleString()} words</dd>
          </div>
          <div>
            <dt className="sr-only">Uploaded</dt>
            <dd>
              {new Date(lecture.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </dd>
          </div>
        </dl>

        <Button
          render={<Link href={`/lectures/${lecture.id}`} />}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          {lecture.status === "ready" ? "Open study set" : "View lecture"}
        </Button>
      </CardContent>
    </Card>
  )
}
