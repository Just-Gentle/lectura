import { HeaderSkeleton, PageHeadingSkeleton } from "@/components/page-skeletons"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReviewLoading() {
  return (
    <div className="min-h-svh">
      <HeaderSkeleton />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <span className="sr-only" role="status">
          Loading your review session
        </span>

        <PageHeadingSkeleton lines={2} />

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="gap-0 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-10" />
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <Skeleton className="h-2 w-full" />
          <Card>
            <CardContent className="flex min-h-72 flex-col items-center justify-center gap-5 p-10">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
          <Skeleton className="h-9 w-full" />
        </div>
      </main>
    </div>
  )
}
