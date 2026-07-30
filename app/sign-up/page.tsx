import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { getCurrentUser } from "@/lib/session"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Lecture Assistant account and start studying smarter.",
}

export default async function SignUpPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return <AuthForm mode="sign-up" />
}
