import { getTransporter } from "./src/utils/mailer.js";
import { emailConfig, isEmailConfigured } from "./src/config/email.config.js";

(async () => {
  console.log("Email config snapshot:", {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    userPresent: Boolean(emailConfig.auth.user),
    passPresent: Boolean(emailConfig.auth.pass),
    from: emailConfig.from,
    configured: isEmailConfigured(),
  });
  const tx = getTransporter();
  if (!tx) {
    console.log("Transporter not created: missing SMTP env vars.");
    process.exit(0);
  }
  try {
    await tx.verify();
    console.log("✅ SMTP verify OK. Ready to send.");
  } catch (e) {
    console.error("❌ SMTP verify failed:", e.message);
    console.error(e);
  }
})();
