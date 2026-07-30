import { BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Matches the height and layout of AppHeader so nothing jumps on load. */
export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" aria-hidden="true" />
            <span className="hidden text-lg font-semibold sm:inline">
              Lecture Assistant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </header>
  )
}

export function PageHeadingSkeleton({ lines = 1 }: { lines?: number }) {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <Skeleton className="h-9 w-56" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full max-w-md" />
      ))}
    </div>
  )
}

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="gap-0 p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2 h-3 w-32" />
        </Card>
      ))}
    </div>
  )
}
