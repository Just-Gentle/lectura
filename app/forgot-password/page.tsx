import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { getCurrentUser } from "@/lib/session"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a link to reset your Lecture Assistant password.",
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return <ForgotPasswordForm />
}
