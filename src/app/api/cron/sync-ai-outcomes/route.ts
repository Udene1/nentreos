import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hashClientId } from '@/lib/utils';

// POST /api/cron/sync-ai-outcomes - Push anonymized payment data to AI microservice
export async function POST(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const AI_API_URL = process.env.AI_API_URL?.replace(/\/$/, '');
        const AI_API_KEY = process.env.AI_API_KEY;

        if (!AI_API_URL || !AI_API_KEY) {
            return NextResponse.json({ error: 'AI Service credentials missing' }, { status: 500 });
        }

        const supabase = createAdminClient();

        // Find recently updated invoices (last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentInvoices, error } = await supabase
            .from('invoices')
            .select('user_id, client_id, amount, currency, due_date, paid_at, status, description, reminder_count, updated_at')
            .gt('updated_at', yesterday);

        if (error) throw error;

        if (!recentInvoices || recentInvoices.length === 0) {
            return NextResponse.json({ success: true, synced: 0 });
        }

        // Anonymize and format for ML microservice
        const anonymizedData = recentInvoices.map(inv => ({
            user_id: inv.user_id,
            client_id: hashClientId(inv.client_id),
            invoice_amount: inv.amount,
            currency: inv.currency,
            due_date: inv.due_date,
            payment_status: inv.status,
            payment_time: inv.paid_at || null,
            description: inv.description || '',
            reminder_count: inv.reminder_count || 0
        }));

        // Send to AI Service
        const res = await fetch(`${AI_API_URL}/api/sync-data`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(anonymizedData),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`AI Service sync failed: ${errorText}`);
        }

        return NextResponse.json({
            success: true,
            synced: anonymizedData.length,
            status: 'AI Microservice sync completed'
        });

    } catch (error: any) {
        console.error('Sync outcomes error:', error);
        return NextResponse.json({ error: 'Sync failed', details: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    return POST(request);
}
