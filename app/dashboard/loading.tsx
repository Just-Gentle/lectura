import {
  HeaderSkeleton,
  PageHeadingSkeleton,
  StatCardsSkeleton,
} from "@/components/page-skeletons"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-svh">
      <HeaderSkeleton />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <span className="sr-only" role="status">
          Loading your lectures
        </span>

        <PageHeadingSkeleton lines={2} />

        <div className="mb-10">
          <StatCardsSkeleton count={3} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="flex h-full flex-col gap-4 p-6">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-auto h-9 w-full" />
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
