import { Invoice, Client, EscalationLevel } from '@/types';
import { formatCurrency, formatDate } from './utils';

/**
 * Email template data
 */
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * SMS template data
 */
interface SMSTemplate {
  message: string;
}

/**
 * Generate base email HTML wrapper
 */
function emailWrapper(content: string, brandColor: string = '#10b981', businessName?: string, paymentUrl?: string): string {
  const ctaButton = paymentUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${paymentUrl}" style="background-color: ${brandColor}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
        Pay Invoice Now
      </a>
      <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Secure payment powered by Paystack</p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandColor} 0%, #059669 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${businessName || 'ChaseAI'}</h1>
              <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Invoice Payment Reminder</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
              ${ctaButton}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              ${businessName ? `<p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">Sent on behalf of <strong>${businessName}</strong></p>` : ''}
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Sent via ChaseAI - AI-Powered Invoice Management
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate polite reminder (Level 1 - Day 1)
 */
export function getPoliteReminderEmail(
  invoice: Invoice,
  client: Client | null,
  customMessage?: string,
  businessName?: string,
  paymentUrl?: string
): EmailTemplate {
  const clientName = client?.name || 'Valued Client';
  const amount = formatCurrency(invoice.amount, invoice.currency as 'NGN' | 'USD');
  const dueDate = formatDate(invoice.due_date);

  const content = customMessage || `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Dear ${clientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      I hope this message finds you well. This is a friendly reminder about invoice <strong>${invoice.invoice_number}</strong>.
    </p>
    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Due:</td>
          <td style="padding: 8px 0; color: #10b981; font-size: 18px; font-weight: 700; text-align: right;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Due Date:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${dueDate}</td>
        </tr>
      </table>
    </div>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      If you've already sent payment, please disregard this message. Otherwise, I would appreciate it if you could process the payment at your earliest convenience.
    </p>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Please don't hesitate to reach out if you have any questions.
    </p>
    <p style="margin: 30px 0 0 0; color: #374151; font-size: 16px;">
      Best regards
    </p>
  `;

  return {
    subject: `Friendly Reminder: Invoice ${invoice.invoice_number} Due`,
    html: emailWrapper(content, '#10b981', businessName, paymentUrl),
    text: `Dear ${clientName},\n\nThis is a friendly reminder from ${businessName || 'us'} about invoice ${invoice.invoice_number} for ${amount}, due on ${dueDate}.\n\n${paymentUrl ? `Pay here: ${paymentUrl}\n\n` : ''}If you've already sent payment, please disregard this message.\n\nBest regards`,
  };
}

/**
 * Generate firm reminder (Level 2 - Day 7)
 */
export function getFirmReminderEmail(
  invoice: Invoice,
  client: Client | null,
  customMessage?: string,
  businessName?: string,
  paymentUrl?: string
): EmailTemplate {
  const clientName = client?.name || 'Valued Client';
  const amount = formatCurrency(invoice.amount, invoice.currency as 'NGN' | 'USD');
  const dueDate = formatDate(invoice.due_date);

  const content = customMessage || `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Dear ${clientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      I'm following up regarding invoice <strong>${invoice.invoice_number}</strong>, which is now overdue.
    </p>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Due:</td>
          <td style="padding: 8px 0; color: #d97706; font-size: 18px; font-weight: 700; text-align: right;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Original Due Date:</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">${dueDate}</td>
        </tr>
      </table>
    </div>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Timely payments help us maintain our service quality and continue our professional relationship. I kindly request that you prioritize this payment.
    </p>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      <strong>Please process the payment within the next 7 days</strong> to avoid any service impacts.
    </p>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      If there are any issues with the invoice, please contact me immediately so we can resolve them.
    </p>
    <p style="margin: 30px 0 0 0; color: #374151; font-size: 16px;">
      Thank you for your attention to this matter.
    </p>
  `;

  return {
    subject: `Important: Invoice ${invoice.invoice_number} Payment Overdue`,
    html: emailWrapper(content, '#f59e0b', businessName, paymentUrl),
    text: `Dear ${clientName},\n\nThis is a follow-up from ${businessName || 'us'} regarding invoice ${invoice.invoice_number} for ${amount}, which was due on ${dueDate}.\n\n${paymentUrl ? `Pay here: ${paymentUrl}\n\n` : ''}Please process the payment within the next 7 days to avoid any service impacts.\n\nThank you for your attention.`,
  };
}

/**
 * Generate urgent reminder (Level 3 - Day 14)
 */
export function getUrgentReminderEmail(
  invoice: Invoice,
  client: Client | null,
  customMessage?: string,
  businessName?: string,
  paymentUrl?: string
): EmailTemplate {
  const clientName = client?.name || 'Valued Client';
  const amount = formatCurrency(invoice.amount, invoice.currency as 'NGN' | 'USD');
  const dueDate = formatDate(invoice.due_date);

  const content = customMessage || `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Dear ${clientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      <strong style="color: #dc2626;">FINAL NOTICE:</strong> This is an urgent reminder regarding invoice <strong>${invoice.invoice_number}</strong>, which remains unpaid.
    </p>
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Due:</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 18px; font-weight: 700; text-align: right;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Overdue Since:</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">${dueDate}</td>
        </tr>
      </table>
    </div>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Despite our previous reminders, we have not received payment. Please note that continued non-payment may result in:
    </p>
    <ul style="margin: 15px 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
      <li>Late fees being applied to your account</li>
      <li>Suspension of services</li>
      <li>Referral to a collection agency</li>
    </ul>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      <strong>To avoid these consequences, please process the payment immediately</strong> or contact us to discuss a payment arrangement.
    </p>
    <p style="margin: 30px 0 0 0; color: #374151; font-size: 16px;">
      This matter requires your urgent attention.
    </p>
  `;

  return {
    subject: `URGENT: Final Notice for Invoice ${invoice.invoice_number}`,
    html: emailWrapper(content, '#dc2626', businessName),
    text: `FINAL NOTICE from ${businessName || 'ChaseAI'}\n\nDear ${clientName},\n\nThis is an urgent reminder regarding invoice ${invoice.invoice_number} for ${amount}, overdue since ${dueDate}.\n\nContinued non-payment may result in late fees, service suspension, or collection actions.\n\nPlease process the payment immediately.`,
  };
}

/**
 * Generate initial invoice email (The very first send)
 */
export function getInitialInvoiceEmail(
  invoice: Invoice,
  client: Client | null,
  businessName?: string
): EmailTemplate {
  const clientName = client?.name || 'Valued Client';
  const amount = formatCurrency(invoice.amount, invoice.currency as 'NGN' | 'USD');
  const dueDate = formatDate(invoice.due_date);

  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Dear ${clientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      ${businessName ? `<strong>${businessName}</strong> has` : 'A new invoice has been'} generated for you. Please find the details below:
    </p>
    <div style="background-color: #f8fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
          <td style="padding: 8px 0; color: #3b82f6; font-size: 18px; font-weight: 700; text-align: right;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Due Date:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${dueDate}</td>
        </tr>
      </table>
    </div>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      ${invoice.description ? `<strong>Description:</strong> ${invoice.description}<br><br>` : ''}
      Please process the payment by the due date mentioned above. 
      ${invoice.pdf_url ? `You can view or download the full invoice PDF here: <a href="${invoice.pdf_url}" style="color: #3b82f6; text-decoration: underline;">View Invoice</a>` : ''}
    </p>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      If you have any questions or require any clarification, please feel free to reach out.
    </p>
    <p style="margin: 30px 0 0 0; color: #374151; font-size: 16px;">
      Best regards,<br>
      ${businessName || 'ChaseAI team'}
    </p>
  `;

  return {
    subject: `New Invoice from ${businessName || 'ChaseAI'}: ${invoice.invoice_number}`,
    html: emailWrapper(content, '#3b82f6', businessName),
    text: `Dear ${clientName},\n\nA new invoice (${invoice.invoice_number}) for ${amount} has been generated for you, due on ${dueDate}.\n\nBest regards,\n${businessName || 'ChaseAI team'}`,
  };
}

/**
 * Get email template by escalation level
 */
export function getEmailTemplate(
  level: EscalationLevel,
  invoice: Invoice,
  client: Client | null,
  customMessage?: string,
  businessName?: string,
  paymentUrl?: string
): EmailTemplate {
  const templates = {
    1: getPoliteReminderEmail,
    2: getFirmReminderEmail,
    3: getUrgentReminderEmail,
  };

  return templates[level](invoice, client, customMessage, businessName, paymentUrl);
}

/**
 * Generate SMS templates
 */
export function getSMSTemplate(
  level: EscalationLevel,
  invoice: Invoice,
  client: Client | null,
  paymentUrl?: string
): SMSTemplate {
  const clientName = client?.name?.split(' ')[0] || 'Hi';
  const amount = formatCurrency(invoice.amount, invoice.currency as 'NGN' | 'USD');

  const templates: Record<EscalationLevel, SMSTemplate> = {
    1: {
      message: `${clientName}, this is a friendly reminder about invoice ${invoice.invoice_number} (${amount}). Please process payment at your convenience. Questions? Reply to this message.`,
    },
    2: {
      message: `${clientName}, invoice ${invoice.invoice_number} (${amount}) is now overdue. Please process payment within 7 days to avoid service impacts. Contact us if you need assistance.`,
    },
    3: {
      message: `URGENT: ${clientName}, invoice ${invoice.invoice_number} (${amount}) requires immediate attention. Late fees may apply. ${paymentUrl ? `Pay here: ${paymentUrl}` : 'Please pay now'} or contact us immediately.`,
    },
  };

  return templates[level];
}

/**
 * Generate WhatsApp templates (similar to SMS but slightly more friendly)
 */
export function getWhatsAppTemplate(
  level: EscalationLevel,
  invoice: Invoice,
  client: Client | null,
  paymentUrl?: string
): SMSTemplate {
  const clientName = client?.name?.split(' ')[0] || 'Hi';
  const amount = formatCurrency(invoice.amount, invoice.currency as 'NGN' | 'USD');

  const templates: Record<EscalationLevel, SMSTemplate> = {
    1: {
      message: `Hi ${clientName}! 👋\n\nJust a friendly reminder about invoice ${invoice.invoice_number} for ${amount}.\n\nPlease let me know if you have any questions! 🙏`,
    },
    2: {
      message: `Hi ${clientName},\n\nI wanted to follow up on invoice ${invoice.invoice_number} (${amount}), which is now overdue.\n\nCould you please process the payment this week? If there are any issues, I'm happy to discuss. 🤝`,
    },
    3: {
      message: `Hi ${clientName},\n\n⚠️ URGENT: Invoice ${invoice.invoice_number} (${amount}) needs immediate attention.\n\n${paymentUrl ? `Please pay today here: ${paymentUrl}` : 'Please process payment today'} to avoid late fees. Call or message me if you need to discuss a payment plan.`,
    },
  };

  return templates[level];
}

/**
 * Generate welcome email for new users
 */
export function getWelcomeEmail(userName: string): EmailTemplate {
  const content = `
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hi ${userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Welcome to <strong>ChaseAI</strong>! We're excited to help you automate your accounts receivable and get you paid faster.
    </p>
    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #dcfce7;">
      <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 18px;">Quick Start Guide:</h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #374151; font-size: 15px; line-height: 2;">
        <li>Connect your <strong>Paystack</strong> account in Settings</li>
        <li>Add your first <strong>Client</strong></li>
        <li>Create an <strong>Invoice</strong> and enable AI reminding</li>
      </ul>
    </div>
    <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Our AI is already warming up to help you handle those "awkward" conversations professionally.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chaseai.app'}/dashboard" style="background-color: #10b981; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">
        Go to Dashboard
      </a>
    </div>
  `;

  return {
    subject: 'Welcome to ChaseAI! 🚀',
    html: emailWrapper(content, '#10b981', 'ChaseAI Welcome'),
    text: `Hi ${userName},\n\nWelcome to ChaseAI! We're excited to help you get paid faster. Check out your dashboard to get started: ${process.env.NEXT_PUBLIC_APP_URL || 'https://chaseai.app'}/dashboard`,
  };
}
