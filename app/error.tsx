"use client"

import Link from "next/link"
import { useEffect } from "react"
import { RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[lecture-assistant] route error:", error)
  }, [error])

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-16">
      <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <TriangleAlert className="h-7 w-7 text-destructive" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            That page could not be loaded. Your lectures and study sets are safe —
            try again, or head back to your dashboard.
          </p>
          {error.digest && (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button render={<Link href="/dashboard" />} variant="secondary">
            Back to lectures
          </Button>
        </div>
      </Card>
    </main>
  )
}
