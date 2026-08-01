import nodemailer, { type Transporter } from "nodemailer"

/**
 * Gmail SMTP transport.
 *
 * `GMAIL_APP_PASSWORD` must be a Google *App Password* (16 characters, created
 * at https://myaccount.google.com/apppasswords with 2FA enabled) — a regular
 * account password will be rejected by Gmail.
 *
 * Port 465 (implicit TLS) is used because it works on Vercel's serverless
 * runtime as well as locally.
 */
const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

let transporter: Transporter | null = null

export function isEmailConfigured(): boolean {
  return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD)
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

export type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Sends a transactional email. Never throws — callers (like Better Auth's
 * `sendResetPassword`) must not leak SMTP failures into the HTTP response,
 * because that would reveal whether an account exists.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ sent: boolean }> {
  if (!isEmailConfigured()) {
    // Local/preview fallback so the flow is still testable without SMTP creds.
    console.log("[v0] GMAIL_USER / GMAIL_APP_PASSWORD not set — email not sent.")
    console.log(`[v0] To: ${to}`)
    console.log(`[v0] Subject: ${subject}`)
    console.log(`[v0] Body:\n${text}`)
    return { sent: false }
  }

  try {
    await getTransporter().sendMail({
      from: `"Lecture Assistant" <${GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    })
    return { sent: true }
  } catch (error) {
    console.error("[v0] Failed to send email:", error)
    return { sent: false }
  }
}
