"use server"

import { APIError } from "better-auth/api"
import { z } from "zod"
import { auth } from "@/lib/auth"

const emailSchema = z.string().trim().min(1).max(320).email()

const resetSchema = z
  .object({
    token: z.string().trim().min(1),
    password: z.string().min(8, "Password must be at least 8 characters.").max(128),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })

export type ForgotPasswordState = {
  status: "success" | "error"
  message: string
}

/**
 * Starts the password reset flow.
 *
 * The response is intentionally identical whether or not an account exists, so
 * this endpoint cannot be used to enumerate registered email addresses. Any
 * SMTP failure is swallowed by `sendEmail` for the same reason.
 */
export async function requestPasswordResetAction(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse(formData.get("email"))

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." }
  }

  const genericSuccess: ForgotPasswordState = {
    status: "success",
    message:
      "If an account exists for that email, we've sent a link to reset your password. Check your inbox and spam folder.",
  }

  try {
    // No `redirectTo` needed — `sendResetPassword` in lib/auth.ts builds the
    // link to /reset-password itself.
    await auth.api.requestPasswordReset({ body: { email: parsed.data } })
  } catch (error) {
    // Never surface provider errors here — they would leak account existence.
    console.error("[v0] requestPasswordReset failed:", error)
  }

  return genericSuccess
}

export type ResetPasswordState = {
  status: "success" | "error"
  message: string
}

/** Consumes a reset token and sets the new password. */
export async function resetPasswordAction(
  _prevState: ResetPasswordState | null,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token") ?? "",
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  })

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    }
  }

  try {
    await auth.api.resetPassword({
      body: { token: parsed.data.token, newPassword: parsed.data.password },
    })
  } catch (error) {
    if (error instanceof APIError) {
      return {
        status: "error",
        message:
          error.body?.code === "INVALID_TOKEN"
            ? "This reset link is invalid or has expired. Request a new one."
            : ((error.body?.message as string | undefined) ??
              "We couldn't reset your password. Request a new link."),
      }
    }

    console.error("[v0] resetPassword failed:", error)
    return {
      status: "error",
      message: "Something went wrong. Please request a new reset link.",
    }
  }

  return {
    status: "success",
    message: "Your password has been updated. You can sign in with it now.",
  }
}
