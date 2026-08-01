import type { Metadata } from "next"
import { ResetPasswordForm } from "@/components/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Lecture Assistant account.",
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams
  // Better Auth's redirect endpoint appends `?error=INVALID_TOKEN` when a token
  // has already expired, so treat that the same as a missing token.
  const validToken = error || !token ? null : token

  return <ResetPasswordForm token={validToken} />
}
