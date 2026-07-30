import { HeaderSkeleton } from "@/components/page-skeletons"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LectureLoading() {
  return (
    <div className="min-h-svh">
      <HeaderSkeleton />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <span className="sr-only" role="status">
          Loading this lecture
        </span>

        <Skeleton className="mb-6 h-8 w-36" />

        <div className="mb-8 flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full max-w-lg" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-2 h-3 w-28" />
            </Card>
          ))}
        </div>

        <Skeleton className="mb-6 h-10 w-full max-w-md" />

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
