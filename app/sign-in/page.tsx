import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { getCurrentUser } from "@/lib/session"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Lecture Assistant account.",
}

export default async function SignInPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return <AuthForm mode="sign-in" />
}
