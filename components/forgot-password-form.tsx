"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { ArrowLeft, BookOpen, CheckCircle2, Loader2 } from "lucide-react"
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? "Sending link…" : "Send reset link"}
    </Button>
  )
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ForgotPasswordState | null, FormData>(
    requestPasswordResetAction,
    null,
  )

  const sent = state?.status === "success"

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-accent" aria-hidden="true" />
        <span className="text-xl font-semibold">Lecture Assistant</span>
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter the email you signed up with and we&apos;ll send you a link to
            choose a new password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div
              role="status"
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-6 text-center"
            >
              <CheckCircle2
                className="h-8 w-8 text-accent"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {state.message}
              </p>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@university.edu"
                />
              </div>

              {state?.status === "error" && (
                <p role="alert" className="text-sm text-destructive">
                  {state.message}
                </p>
              )}

              <SubmitButton />
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1 font-medium text-accent underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
