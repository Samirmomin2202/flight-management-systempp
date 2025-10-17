import dotenv from "dotenv";
dotenv.config();

export const emailConfig = {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT || 587),
  secure: Boolean(process.env.SMTP_SECURE === "true"), // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  from: process.env.MAIL_FROM || process.env.SMTP_FROM || "no-reply@flightapp.local",
};

export const isEmailConfigured = () => {
  return Boolean(emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass);
};
