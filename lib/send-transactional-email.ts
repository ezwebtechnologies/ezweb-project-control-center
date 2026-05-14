import nodemailer from "nodemailer";

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Sends HTML mail using Gmail SMTP when `GMAIL_USER` + `GMAIL_APP_PASSWORD` are set
 * (use a Google Account [App Password](https://support.google.com/accounts/answer/185833)).
 * Otherwise uses Resend if `RESEND_API_KEY` is set.
 */
export async function sendTransactionalHtmlEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  if (gmailUser && gmailAppPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailAppPassword },
      });
      const fromRaw = process.env.QUOTATION_EMAIL_FROM?.trim();
      const from =
        fromRaw && fromRaw.length > 0 ? fromRaw : `Quotations <${gmailUser}>`;

      await transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gmail SMTP send failed.";
      return { ok: false, error: msg };
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email is not configured. For Gmail: set GMAIL_USER and GMAIL_APP_PASSWORD (Google App Password). Or set RESEND_API_KEY.",
    };
  }

  const fromRaw = process.env.QUOTATION_EMAIL_FROM?.trim();
  if (!fromRaw) {
    return {
      ok: false,
      error:
        "QUOTATION_EMAIL_FROM is required when using Resend. Set it in your environment (see .env.example).",
    };
  }
  const from = fromRaw;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    let detail = `Email provider returned ${res.status}.`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) detail = body.message;
    } catch {
      /* ignore */
    }
    return { ok: false, error: detail };
  }

  return { ok: true };
}
