'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Button,
    CircularProgress,
    Container,
    Alert,
    Stack,
    Grid,
    Chip
} from '@mui/material';
import { CheckCircle, Payment } from '@mui/icons-material';
import { createClient } from '@/lib/supabase-client';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PublicInvoicePage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!id) return;
            const { data, error } = await supabase
                .from('invoices')
                .select('*, client:clients(*), user:users(email, settings)')
                .eq('id', id)
                .single();

            if (error) {
                console.error(error);
            } else {
                setInvoice(data);
            }
            setLoading(false);
        };
        fetchInvoice();
    }, [id, supabase]);

    const handlePaystackPayment = () => {
        if (!invoice) return;

        setProcessing(true);
        const paystackKey = (invoice.user?.settings as any)?.paystackPublicKey || 'pk_test_sample_key';

        const handler = (window as any).PaystackPop?.setup({
            key: paystackKey,
            email: invoice.client?.email || 'customer@example.com',
            amount: Math.round(invoice.amount * 100), // in kobo
            currency: invoice.currency === 'NGN' ? 'NGN' : 'USD',
            ref: `${invoice.invoice_number}_${Date.now()}`,
            onClose: () => {
                setProcessing(false);
            },
            callback: (response: any) => {
                setProcessing(false);
                toast.success('Payment successful!');
                window.location.reload();
            }
        });
        handler?.openIframe();
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );

    if (!invoice) return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Alert severity="error">Invoice not found or invalid link.</Alert>
        </Container>
    );

    const isPaid = invoice.status === 'paid';

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">INVOICE</Typography>
                        <Typography color="text.secondary">#{invoice.invoice_number}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6">{(invoice.user?.settings as any)?.businessName || 'NEntreOS Merchant'}</Typography>
                        <Typography variant="body2" color="text.secondary">{invoice.user?.email}</Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 4 }} />

                <Grid container spacing={4} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">BILL TO</Typography>
                        <Typography variant="body1" fontWeight="medium">{invoice.client?.name}</Typography>
                        <Typography variant="body2">{invoice.client?.email}</Typography>
                        <Typography variant="body2">{invoice.client?.phone}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">DUE DATE</Typography>
                        <Typography variant="body1">{formatDate(invoice.due_date)}</Typography>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mt: 2, display: 'block' }}>STATUS</Typography>
                        <Chip
                            label={invoice.status.toUpperCase()}
                            color={isPaid ? 'success' : 'warning'}
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 1, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>Summary</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>{invoice.description || 'Professional Services'}</Typography>
                        <Typography fontWeight="bold">{formatCurrency(invoice.amount, invoice.currency)}</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h5" fontWeight="bold">Total Due</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                            {formatCurrency(invoice.amount, invoice.currency)}
                        </Typography>
                    </Box>
                </Box>

                {!isPaid ? (
                    <Stack direction="column" spacing={2} sx={{ alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Secure Payment via Paystack</Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Payment />}
                            onClick={handlePaystackPayment}
                            disabled={processing}
                            sx={{ px: 8, py: 1.5, borderRadius: 10, fontWeight: 'bold' }}
                        >
                            {processing ? 'Processing...' : `Pay Now`}
                        </Button>
                    </Stack>
                ) : (
                    <Box sx={{ textAlign: 'center', color: 'success.main' }}>
                        <CheckCircle sx={{ fontSize: 60, mb: 1 }} />
                        <Typography variant="h5" fontWeight="bold">Payment Successful</Typography>
                        <Typography>Thank you for your business!</Typography>
                    </Box>
                )}
            </Paper>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, opacity: 0.5 }}>
                Powered by NEntreOS - Nigerian Entrepreneurship Operating System
            </Typography>

            <script src="https://js.paystack.co/v1/inline.js" async />
        </Container>
    );
}

import toast from 'react-hot-toast';
