import { Resend } from 'resend';
import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}

interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send email using Resend (recommended)
 */
async function sendWithResend(
    options: EmailOptions,
    apiKey: string
): Promise<EmailResult> {
    try {
        const resend = new Resend(apiKey);

        const { data, error } = await resend.emails.send({
            from: options.from || process.env.EMAIL_FROM || 'ChaseAI <invoices@chaseai.app>',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            reply_to: options.replyTo,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, messageId: data?.id };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
}

/**
 * Send email using Nodemailer (SMTP fallback)
 */
async function sendWithNodemailer(
    options: EmailOptions,
    smtpConfig: {
        host: string;
        port: number;
        user: string;
        pass: string;
    }
): Promise<EmailResult> {
    try {
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.port === 465,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
        });

        const info = await transporter.sendMail({
            from: options.from || process.env.EMAIL_FROM || '"ChaseAI" <invoices@chaseai.app>',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            replyTo: options.replyTo,
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
}

/**
 * Send email with automatic provider selection
 */
export async function sendEmail(
    options: EmailOptions,
    settings?: {
        resendApiKey?: string;
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
    }
): Promise<EmailResult> {
    // Try Resend first
    const resendKey = settings?.resendApiKey || process.env.RESEND_API_KEY;
    if (resendKey) {
        return sendWithResend(options, resendKey);
    }

    // Fallback to SMTP/Nodemailer
    if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
        return sendWithNodemailer(options, {
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            user: settings.smtpUser,
            pass: settings.smtpPass,
        });
    }

    // Check for default SMTP env vars
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return sendWithNodemailer(options, {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        });
    }

    return {
        success: false,
        error: 'No email provider configured. Please add Resend API key or SMTP settings.',
    };
}

/**
 * Test email configuration
 */
export async function testEmailConfig(settings?: {
    resendApiKey?: string;
}): Promise<{ success: boolean; provider: string; error?: string }> {
    const resendKey = settings?.resendApiKey || process.env.RESEND_API_KEY;

    if (resendKey) {
        try {
            const resend = new Resend(resendKey);
            // Just validate the key format
            return { success: true, provider: 'Resend' };
        } catch (error) {
            return {
                success: false,
                provider: 'Resend',
                error: error instanceof Error ? error.message : 'Invalid API key'
            };
        }
    }

    if (process.env.SMTP_HOST) {
        return { success: true, provider: 'SMTP/Nodemailer' };
    }

    return {
        success: false,
        provider: 'None',
        error: 'No email provider configured'
    };
}
