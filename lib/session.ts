import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

/** Returns the current user, or null when signed out. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as typeof session.user & { role?: string }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role ?? "user",
  }
}

/** Throws when signed out. Use inside server actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

/** Returns just the user id. Every user-scoped query must filter on this. */
export async function getUserId(): Promise<string> {
  return (await requireUser()).id
}

/** Throws unless the current user is an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== "admin") throw new Error("Forbidden")
  return user
}
