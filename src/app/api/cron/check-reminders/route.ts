import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate, getSMSTemplate, getWhatsAppTemplate } from '@/lib/templates';
import { sendSMS, sendWhatsApp } from '@/lib/sms';
import { Invoice, Client, EscalationLevel, UserSettings } from '@/types';
import { createNotification } from '@/lib/notifications';
import { generateReminder } from '@/lib/ai';

// POST /api/cron/check-reminders - Daily cron job to check and send reminders
export async function POST(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const now = new Date();
        const results = { processed: 0, sent: 0, failed: 0, skipped: 0 };

        // 1. Check for invoices that should be marked as overdue
        const { data: overdueInvoices } = await supabase
            .from('invoices')
            .select('id')
            .eq('status', 'sent')
            .lt('due_date', now.toISOString().split('T')[0]);

        if (overdueInvoices && overdueInvoices.length > 0) {
            await (supabase.from('invoices') as any)
                .update({ status: 'overdue' })
                .in('id', (overdueInvoices as any[]).map((i) => i.id));

            console.log(`Marked ${overdueInvoices.length} invoices as overdue`);

            // Notifications for overdue invoices
            for (const inv of (overdueInvoices as any[])) {
                const { data: fullInvoice }: any = await supabase
                    .from('invoices')
                    .select('user_id, invoice_number')
                    .eq('id', inv.id)
                    .single();

                if (fullInvoice) {
                    await createNotification({
                        userId: fullInvoice.user_id,
                        title: 'Invoice Overdue',
                        message: `Invoice ${fullInvoice.invoice_number} is now overdue.`,
                        type: 'warning',
                        link: `/reminders`,
                        supabaseClient: supabase
                    });
                }
            }
        }

        // 2. Get pending reminders that are due
        const { data: pendingReminders } = await (supabase
            .from('reminders') as any)
            .select(`
                *,
                invoice:invoices(
                    *,
                    client:clients(*),
                    user:users(settings)
                )
            `)
            .eq('status', 'pending')
            .lte('scheduled_date', now.toISOString())
            .limit(100);

        if (!pendingReminders || pendingReminders.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending reminders',
                results,
            });
        }

        // 3. Process each reminder
        for (const reminder of (pendingReminders as any[])) {
            results.processed++;

            const invoice = (reminder as any).invoice as Invoice & {
                client: Client | null;
                user: { settings: UserSettings } | null;
            };

            // Skip if invoice is already paid
            if (invoice.status === 'paid') {
                await (supabase.from('reminders') as any)
                    .update({ status: 'cancelled' })
                    .eq('id', (reminder as any).id);
                results.skipped++;
                continue;
            }

            // Skip if no client
            if (!invoice.client) {
                await (supabase.from('reminders') as any)
                    .update({ status: 'failed', error_message: 'No client found' })
                    .eq('id', (reminder as any).id);
                results.failed++;
                continue;
            }

            const userSettings = (invoice.user?.settings as any) || {};
            const businessName = userSettings.businessName || 'NEntreOS Merchant';

            try {
                // Generate AI reminder message
                let aiMessage = null;
                try {
                    const aiResult = await generateReminder(
                        invoice,
                        invoice.client,
                        (reminder as any).escalation_level as EscalationLevel,
                        {
                            aiProvider: userSettings.aiProvider,
                            groqApiKey: userSettings.groqApiKey,
                            openaiApiKey: userSettings.openaiApiKey,
                            geminiApiKey: userSettings.geminiApiKey,
                        }
                    );
                    aiMessage = aiResult.message;
                } catch (aiError) {
                    console.error(`AI generation failed for reminder ${reminder.id}, falling back to template:`, aiError);
                }

                const paymentUrl = userSettings.paymentLink;

                let result: { success: boolean; error?: string };

                // Send based on type
                if (reminder.type === 'email') {
                    const template = getEmailTemplate(
                        (reminder as any).escalation_level as EscalationLevel,
                        invoice,
                        invoice.client,
                        aiMessage || undefined,
                        businessName,
                        paymentUrl
                    );
                    result = await sendEmail({
                        to: invoice.client.email,
                        subject: template.subject,
                        html: template.html,
                        text: template.text,
                        replyTo: userSettings.replyToEmail,
                    });
                } else if (reminder.type === 'sms') {
                    if (!invoice.client.phone) throw new Error('No phone for SMS');
                    const smsTemplate = getSMSTemplate((reminder as any).escalation_level, invoice, invoice.client, paymentUrl);
                    result = await sendSMS(
                        { to: invoice.client.phone, message: aiMessage || smsTemplate.message },
                        {
                            accountSid: userSettings.twilioAccountSid,
                            authToken: userSettings.twilioAuthToken,
                            phoneNumber: userSettings.twilioPhoneNumber,
                        }
                    );
                } else if (reminder.type === 'whatsapp') {
                    if (!invoice.client.phone) throw new Error('No phone for WhatsApp');
                    const waTemplate = getWhatsAppTemplate((reminder as any).escalation_level, invoice, invoice.client, paymentUrl);
                    result = await sendWhatsApp(
                        { to: invoice.client.phone, message: aiMessage || waTemplate.message },
                        {
                            accountSid: userSettings.twilioAccountSid,
                            authToken: userSettings.twilioAuthToken,
                            whatsappNumber: userSettings.twilioPhoneNumber,
                        }
                    );
                } else {
                    throw new Error(`Unsupported type: ${reminder.type}`);
                }

                if (result.success) {
                    await (supabase.from('reminders') as any)
                        .update({
                            status: 'sent',
                            sent_date: now.toISOString(),
                            ai_message: aiMessage,
                        })
                        .eq('id', (reminder as any).id);
                    results.sent++;

                    await createNotification({
                        userId: invoice.user_id,
                        title: 'Reminder Sent',
                        message: `Level ${(reminder as any).escalation_level} ${reminder.type} for ${invoice.invoice_number} sent to ${invoice.client.name}.`,
                        type: 'success',
                        link: `/reminders`,
                        supabaseClient: supabase
                    });
                } else {
                    await (supabase.from('reminders') as any)
                        .update({ status: 'failed', error_message: result.error })
                        .eq('id', (reminder as any).id);
                    results.failed++;
                }
            } catch (error) {
                console.error(`Failed to send reminder ${reminder.id}:`, error);
                await (supabase.from('reminders') as any)
                    .update({
                        status: 'failed',
                        error_message: error instanceof Error ? error.message : 'Unknown error',
                    })
                    .eq('id', (reminder as any).id);
                results.failed++;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Reminders processed',
            results,
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    return POST(request);
}
