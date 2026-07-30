import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent" aria-hidden="true" />
          <span className="text-xl font-semibold">Lecture Assistant</span>
        </Link>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button render={<Link href="/dashboard" />} size="sm">
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button render={<Link href="/sign-in" />} variant="ghost" size="sm">
                Sign in
              </Button>
              <Button render={<Link href="/sign-up" />} size="sm">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
