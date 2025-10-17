import nodemailer from "nodemailer";
import { emailConfig, isEmailConfigured } from "../config/email.config.js";

let transporter = null;
export const getTransporter = () => {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
};

export async function sendEmail({ to, subject, text, html, attachments }) {
  const tx = getTransporter();
  if (!tx) {
    console.warn("Email not configured; skipping email to:", to, subject);
    return { skipped: true };
  }
  const info = await tx.sendMail({
    from: emailConfig.from,
    to,
    subject,
    text,
    html,
    attachments,
  });
  return { messageId: info.messageId };
}
