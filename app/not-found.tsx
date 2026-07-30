import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export const metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-16">
      <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="rounded-full bg-accent/10 p-4">
          <FileQuestion className="h-7 w-7 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This lecture may have been deleted, or the link is no longer valid.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href="/dashboard" />}>Back to lectures</Button>
          <Button render={<Link href="/" />} variant="secondary">
            Go home
          </Button>
        </div>
      </Card>
    </main>
  )
}
