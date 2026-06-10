import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private templates: Record<string, string> = {};

    constructor() {
        this.initializeTransporter();
        this.loadTemplates();
    }

    private initializeTransporter() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || '465'),
            secure: (process.env.SMTP_PORT || '465') === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: { rejectUnauthorized: false },
        });
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
                'notification-promotional':    '<!DOCTYPE html><html><body><h1>{{subject}}</h1></body></html>',
                'notification-informational':  '<!DOCTYPE html><html><body><h1>{{subject}}</h1></body></html>',
            };
        }
    }

    async sendEmail(to: string, subject: string, html: string, text = '') {
        try {
            if (!this.transporter) this.initializeTransporter();
            const result = await this.transporter!.sendMail({
                from: `"${process.env.SMTP_FROM_NAME || 'Ayropath'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
                to, subject, text, html,
            });
            console.log(`[Email] Sent to ${to}: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        } catch (error: any) {
            console.error(`[Email] Failed to ${to}:`, error);
            return { success: false, error: error.message };
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
        } catch (error: any) {
            console.error('[Email] Notification failed:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new EmailService();
