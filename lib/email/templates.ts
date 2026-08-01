/** Escapes a value before interpolating it into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatExpiry(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const hours = Math.round(minutes / 60)
  return hours === 1 ? "1 hour" : `${hours} hours`
}

export type PasswordResetEmailOptions = {
  /** Display name of the recipient, when known. */
  name?: string | null
  /** Absolute link to the reset-password page, already carrying the token. */
  url: string
  /** How long the token stays valid, in minutes. */
  expiresInMinutes: number
}

export function passwordResetEmail({
  name,
  url,
  expiresInMinutes,
}: PasswordResetEmailOptions): { subject: string; html: string; text: string } {
  const greeting = name ? `Hi ${escapeHtml(name.split(" ")[0])},` : "Hi there,"
  const safeUrl = escapeHtml(url)
  const expiry = formatExpiry(expiresInMinutes)

  const subject = "Reset your Lecture Assistant password"

  const text = [
    greeting,
    "",
    "We received a request to reset the password for your Lecture Assistant account.",
    "",
    `Reset your password: ${url}`,
    "",
    `This link expires in ${expiry} and can only be used once.`,
    "If you didn't request a password reset, you can safely ignore this email — your password will not change.",
    "",
    "— Lecture Assistant",
  ].join("\n")

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Reset your Lecture Assistant password. This link expires in ${escapeHtml(expiry)}.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0;font-size:15px;font-weight:600;color:#18181b;letter-spacing:-0.01em;">
                  Lecture Assistant
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <h1 style="margin:16px 0 0;font-size:22px;line-height:1.3;font-weight:600;color:#18181b;letter-spacing:-0.02em;">
                  Reset your password
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">
                  ${greeting}
                </p>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">
                  We received a request to reset the password for your Lecture Assistant
                  account. Click the button below to choose a new one.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                <a href="${safeUrl}"
                   style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;">
                  Reset password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
                  This link expires in ${escapeHtml(expiry)} and can only be used once.
                </p>
                <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
                  If you didn't request a password reset, you can safely ignore this
                  email — your password will not change.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;word-break:break-all;">
                  Button not working? Paste this link into your browser:<br />
                  <a href="${safeUrl}" style="color:#71717a;">${safeUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;">
                <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 16px;" />
                <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
                  Lecture Assistant · Turn your lectures into study material
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}
