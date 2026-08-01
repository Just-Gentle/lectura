"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react"
import { resetPasswordAction, type ResetPasswordState } from "@/app/actions/auth"
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
      {pending ? "Updating password…" : "Update password"}
    </Button>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-accent" aria-hidden="true" />
        <span className="text-xl font-semibold">Lecture Assistant</span>
      </Link>
      <Card className="w-full max-w-sm">{children}</Card>
    </div>
  )
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [state, formAction] = useActionState<ResetPasswordState | null, FormData>(
    resetPasswordAction,
    null,
  )

  if (!token) {
    return (
      <Shell>
        <CardHeader>
          <CardTitle>Link expired or invalid</CardTitle>
          <CardDescription>
            This password reset link is missing its token, has already been used,
            or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/forgot-password" />} className="w-full">
            Request a new link
          </Button>
        </CardContent>
      </Shell>
    )
  }

  if (state?.status === "success") {
    return (
      <Shell>
        <CardHeader>
          <CardTitle>Password updated</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="status"
            className="mb-6 flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-6 text-center"
          >
            <CheckCircle2 className="h-8 w-8 text-accent" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              For your security, any other active sessions were signed out.
            </p>
          </div>
          <Button render={<Link href="/sign-in" />} className="w-full">
            Go to sign in
          </Button>
        </CardContent>
      </Shell>
    )
  }

  return (
    <Shell>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          Pick something at least 8 characters long that you haven&apos;t used
          before.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Re-enter your password"
            />
          </div>

          {state?.status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Shell>
  )
}
