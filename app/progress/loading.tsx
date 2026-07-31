import {
  HeaderSkeleton,
  PageHeadingSkeleton,
  StatCardsSkeleton,
} from "@/components/page-skeletons"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProgressLoading() {
  return (
    <div className="min-h-svh">
      <HeaderSkeleton />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <span className="sr-only" role="status">
          Loading your progress
        </span>

        <PageHeadingSkeleton lines={2} />

        <div className="flex flex-col gap-6">
          <StatCardsSkeleton count={4} />

          <Card>
            <CardHeader className="gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-56 w-full" />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader className="gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader className="gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-52" />
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-1.5 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
