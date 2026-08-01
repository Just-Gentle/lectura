import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"
import { sendEmail } from "@/lib/email/mailer"
import { passwordResetEmail } from "@/lib/email/templates"

/** Password reset links stay valid for one hour. */
const RESET_PASSWORD_TOKEN_TTL_SECONDS = 60 * 60

const appURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL)

export const auth = betterAuth({
  database: pool,
  baseURL: appURL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // Tokens are stored in the `verification` table with this expiry and are
    // rejected (and deleted) once past it, so they expire automatically.
    resetPasswordTokenExpiresIn: RESET_PASSWORD_TOKEN_TTL_SECONDS,
    // A reset implies the old password may be compromised, so sign out
    // everywhere.
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, token }) {
      // Link straight to our own page rather than Better Auth's redirect
      // endpoint, so the token survives email-client link rewriting.
      const url = new URL("/reset-password", appURL ?? "http://localhost:3000")
      url.searchParams.set("token", token)

      const { subject, html, text } = passwordResetEmail({
        name: user.name,
        url: url.toString(),
        expiresInMinutes: RESET_PASSWORD_TOKEN_TTL_SECONDS / 60,
      })

      await sendEmail({ to: user.email, subject, html, text })
    },
    async onPasswordReset({ user }) {
      console.log(`[v0] Password reset completed for user ${user.id}`)
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        // Never let a client set its own role.
        input: false,
      },
    },
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    // v0 serves the running app from a sandbox/preview host that is not
    // exposed as an env var, so allow those wildcard origins outside
    // production. Never widened in production.
    ...(process.env.NODE_ENV === "production"
      ? []
      : [
          "http://localhost:3000",
          "https://*.vercel.run",
          "https://*.vusercontent.net",
          "https://*.vercel.app",
        ]),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          // In dev (v0 preview iframe), force cross-site cookies so the
          // session cookie is stored by the browser.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
