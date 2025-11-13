# Email Configuration Guide

The system currently defaults to **LOCAL** mode, which only logs emails to the console. To actually send emails to users, you need to configure an email provider.

## Quick Setup Options

### Option 1: SMTP (Gmail, Outlook, etc.)

Add to `backend/.env`:

```env
EMAIL_PROVIDER=SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=your-email@gmail.com
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password) in `SMTP_PASS`

**For Outlook/Hotmail:**
```env
EMAIL_PROVIDER=SMTP
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
MAIL_FROM=your-email@outlook.com
```

### Option 2: Resend (Recommended for Production)

1. Sign up at https://resend.com
2. Get your API key
3. Add to `backend/.env`:

```env
EMAIL_PROVIDER=RESEND
RESEND_API_KEY=re_xxxxxxxxxxxxx
MAIL_FROM=noreply@yourdomain.com
```

### Option 3: SendGrid

1. Sign up at https://sendgrid.com
2. Get your API key
3. Add to `backend/.env`:

```env
EMAIL_PROVIDER=SENDGRID
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
MAIL_FROM=noreply@yourdomain.com
```

## Testing Email Configuration

After configuring, restart your backend server and check the console logs. You should see:
- `SMTP connection verified. Ready to send emails.` (for SMTP)
- Or no errors when sending emails

## Current Status

To check your current email configuration, the system logs:
- Email provider being used
- Whether SMTP is configured
- Email sending results

## Troubleshooting

1. **Emails not sending?**
   - Check `EMAIL_PROVIDER` is set correctly in `.env`
   - Verify SMTP credentials (for SMTP)
   - Check API keys (for Resend/SendGrid)
   - Restart backend server after changing `.env`

2. **"Email skipped" messages?**
   - Email provider is not configured
   - Set `EMAIL_PROVIDER` and required credentials

3. **SMTP authentication errors?**
   - For Gmail: Use App Password, not regular password
   - Check if 2FA is enabled (required for App Passwords)
   - Verify SMTP settings match your email provider

## Default Behavior

If no email provider is configured, emails are logged to the console in LOCAL mode. This is useful for development but won't send actual emails.


