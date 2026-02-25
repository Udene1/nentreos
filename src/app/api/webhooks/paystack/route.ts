import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST(req: Request) {
    const payload = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');

    if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);

    if (event.event === 'charge.success') {
        const supabase = await createClient();
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*, client:clients(*)')
            .eq('invoice_number', event.data.reference)
            .single();

        if (invoiceError || !invoice) {
            console.error('Invoice not found:', event.data.reference);
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.status === 'paid') {
            return NextResponse.json({ message: 'Already processed' });
        }

        const userId = invoice.user_id;

        // Start transaction-like operations
        // 1. Mark invoice as paid
        const { error: updateError } = await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', invoice.id);

        if (updateError) throw updateError;

        // 2. Get the items related to this invoice (assuming we have an invoice_items table or metadata)
        // For simplicity in this demo, if the invoice has metadata about items, we use it.
        // If not, we might need a join table. Let's check the schema logic later.
        // Assuming metadata has [{item_id, quantity, unit_price}]
        const items = invoice.metadata?.items || [];

        for (const item of items) {
            // 3. Consume stock batches (using existing RPC)
            const { data: totalCost, error: cogsError } = await supabase.rpc('consume_stock_batch', {
                p_item_id: item.item_id,
                p_quantity_to_sell: item.quantity,
                p_user_id: userId
            });

            if (cogsError) {
                console.error(`Failed to consume stock for item ${item.item_id}:`, cogsError);
                continue;
            }

            // 4. Create sale entry
            await supabase.from('sales').insert([{
                item_id: item.item_id,
                quantity_sold: item.quantity,
                total_amount: item.quantity * item.unit_price * 1.075, // Inc VAT
                cost_at_sale: Number(totalCost) / item.quantity,
                valuation_method_used: 'FIFO', // Default
                customer_name: invoice.client?.name || 'Paystack Customer',
                user_id: userId,
                sale_date: new Date().toISOString()
            }]);
        }

        // 5. Update user notification
        await supabase.from('notifications').insert([{
            user_id: userId,
            title: 'Payment Received',
            message: `Invoice ${invoice.invoice_number} was paid successfully via Paystack.`,
            type: 'success'
        }]);
    }

    return NextResponse.json({ status: 'success' });
}
