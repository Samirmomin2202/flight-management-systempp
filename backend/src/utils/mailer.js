import nodemailer from "nodemailer";
import { emailConfig, isEmailConfigured } from "../config/email.config.js";

// Optional provider envs
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "LOCAL"; // LOCAL | SMTP | RESEND | SENDGRID
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";

let transporter = null; // cached SMTP transporter
let localTransporter = null; // cached local JSON transport

export const getTransporter = () => {
  if (EMAIL_PROVIDER !== "SMTP") return null; // only for raw SMTP
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
    transporter.verify((err) => {
      if (err) {
        console.error("SMTP verify failed:", formatEmailError(err));
      } else {
        console.log("SMTP connection verified. Ready to send emails.");
      }
    });
  }
  return transporter;
};

export const getLocalTransporter = () => {
  if (!localTransporter) {
    // Use jsonTransport for local development - emails are logged to console
    localTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.log("📧 Local email transport initialized (emails will be logged to console)");
  }
  return localTransporter;
};

function formatEmailError(err) {
  if (!err) return "Unknown email error";
  if (err.code === "EAUTH") {
    return `Authentication failed (EAUTH). Hint: For Gmail create an App Password (2FA required). host=smtp.gmail.com port=465 secure=true. Raw: ${err.response || err.message}`;
  }
  return err.message || String(err);
}

async function sendWithLocal(params) {
  const tx = getLocalTransporter();
  try {
    const info = await tx.sendMail({
      from: emailConfig.from || "noreply@flightapp.local",
      ...params,
    });
    
    // Log email to console for local development
    console.log("\n📧 ===== EMAIL SENT (LOCAL MODE) =====");
    console.log("To:", params.to);
    console.log("Subject:", params.subject);
    console.log("From:", emailConfig.from || "noreply@flightapp.local");
    if (params.text) {
      console.log("\nText Content:");
      console.log(params.text);
    }
    if (params.html) {
      console.log("\nHTML Content:");
      console.log(params.html);
    }
    console.log("=====================================\n");
    
    return { messageId: info.messageId || "local-mock-id", provider: "LOCAL" };
  } catch (err) {
    return { error: formatEmailError(err), provider: "LOCAL" };
  }
}

async function sendWithSmtp(params) {
  const tx = getTransporter();
  if (!tx) return { skipped: true, provider: "SMTP", reason: "SMTP not configured" };
  try {
    const info = await tx.sendMail({
      from: emailConfig.from,
      ...params,
    });
    return { messageId: info.messageId, provider: "SMTP" };
  } catch (err) {
    return { error: formatEmailError(err), provider: "SMTP" };
  }
}

async function sendWithResend(params) {
  if (!RESEND_API_KEY) return { skipped: true, provider: "RESEND", reason: "Missing RESEND_API_KEY" };
  let Resend;
  try {
    // dynamic import avoids crash if dependency missing before install
    ({ Resend } = await import("resend"));
  } catch (e) {
    return { error: "resend package not installed. Run: npm install resend", provider: "RESEND" };
  }
  const client = new Resend(RESEND_API_KEY);
  try {
    const { data, error } = await client.emails.send({
      from: emailConfig.from,
      to: params.to,
      subject: params.subject,
      html: params.html || `<pre>${params.text || "(no content)"}</pre>`,
      text: params.text,
      attachments: params.attachments?.map(a => ({ filename: a.filename, content: a.content }))
    });
    if (error) return { error: error.message || String(error), provider: "RESEND" };
    return { messageId: data.id, provider: "RESEND" };
  } catch (err) {
    return { error: formatEmailError(err), provider: "RESEND" };
  }
}

async function sendWithSendgrid(params) {
  if (!SENDGRID_API_KEY) return { skipped: true, provider: "SENDGRID", reason: "Missing SENDGRID_API_KEY" };
  let sgMail;
  try {
    sgMail = await import("@sendgrid/mail");
  } catch (e) {
    return { error: "@sendgrid/mail package not installed. Run: npm install @sendgrid/mail", provider: "SENDGRID" };
  }
  sgMail.default.setApiKey(SENDGRID_API_KEY);
  try {
    const [response] = await sgMail.default.send({
      from: emailConfig.from,
      to: params.to,
      subject: params.subject,
      html: params.html || `<pre>${params.text || "(no content)"}</pre>`,
      text: params.text,
    });
    return { messageId: response?.headers?.['x-message-id'] || "sendgrid", provider: "SENDGRID" };
  } catch (err) {
    return { error: formatEmailError(err), provider: "SENDGRID" };
  }
}

export async function sendEmail({ to, subject, text, html, attachments }) {
  switch (EMAIL_PROVIDER.toUpperCase()) {
    case "RESEND":
      return await sendWithResend({ to, subject, text, html, attachments });
    case "SENDGRID":
      return await sendWithSendgrid({ to, subject, text, html, attachments });
    case "SMTP":
      return await sendWithSmtp({ to, subject, text, html, attachments });
    case "LOCAL":
    default:
      return await sendWithLocal({ to, subject, text, html, attachments });
  }
}

export function emailProviderInfo() {
  return {
    provider: EMAIL_PROVIDER,
    smtpConfigured: isEmailConfigured(),
    resendConfigured: Boolean(RESEND_API_KEY),
    sendgridConfigured: Boolean(SENDGRID_API_KEY),
    localMode: EMAIL_PROVIDER.toUpperCase() === "LOCAL"
  };
}
