import fs from 'fs/promises';
import path from 'path';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const FROM = `${process.env.SMTP_FROM_NAME || 'Ayropath'} <${process.env.FROM_EMAIL || 'admin@ayropath.com'}>`;

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

function getSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || '465'),
    secure: (process.env.SMTP_PORT || '465') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
}

class EmailService {
  private templates: Record<string, string> = {};

  constructor() {
    this.loadTemplates();
  }

  private async loadTemplates() {
    try {
      const templatesDir = path.join(process.cwd(), 'lib/templates/email');
      const files = await fs.readdir(templatesDir);
      for (const file of files.filter(f => f.endsWith('.html'))) {
        const name = path.basename(file, '.html');
        this.templates[name] = await fs.readFile(path.join(templatesDir, file), 'utf-8');
      }
    } catch {
      this.templates = {
        'notification-promotional':   '<!DOCTYPE html><html><body><h1>{{subject}}</h1></body></html>',
        'notification-informational': '<!DOCTYPE html><html><body><h1>{{subject}}</h1></body></html>',
      };
    }
  }

  async sendEmail(to: string, subject: string, html: string, _text = '', attempt = 1): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await getResend().emails.send({ from: FROM, to, subject, html });
      if (error) throw error;
      console.log(`[Email/Resend] Sent to ${to}: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (resendErr: any) {
      const isRateLimit = resendErr?.statusCode === 429 || /rate.?limit|too many/i.test(resendErr?.message ?? '');
      if (isRateLimit && attempt < 3) {
        await new Promise(r => setTimeout(r, 300 * attempt));
        return this.sendEmail(to, subject, html, _text, attempt + 1);
      }
      console.warn(`[Email/Resend] Failed (attempt ${attempt}), falling back to SMTP:`, resendErr?.message ?? resendErr);
      try {
        const r = await getSmtpTransporter().sendMail({ from: FROM, to, subject, html });
        console.log(`[Email/SMTP] Sent to ${to}: ${r.messageId}`);
        return { success: true, messageId: r.messageId };
      } catch (smtpErr: any) {
        console.error(`[Email/SMTP] Also failed to ${to}:`, smtpErr);
        return { success: false, error: smtpErr.message };
      }
    }
  }

  renderTemplate(templateName: string, variables: Record<string, string> = {}) {
    let template = this.templates[templateName];
    if (!template) throw new Error(`Template "${templateName}" not found`);
    for (const [key, val] of Object.entries(variables)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), val || '');
    }
    return template;
  }

  async sendNotificationEmail(email: string, subject: string, content: string, emailType: string, variables: Record<string, string> = {}) {
    try {
      const templateName = emailType === 'promotional' ? 'notification-promotional' : 'notification-informational';
      const html = this.renderTemplate(templateName, { ...variables, subject, content });
      return await this.sendEmail(email, subject, html, `${subject}\n\n${content}`);
    } catch (err: any) {
      console.error('[Email] Notification failed:', err);
      return { success: false, error: err.message };
    }
  }
}

export default new EmailService();
