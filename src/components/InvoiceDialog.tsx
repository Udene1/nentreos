'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    MenuItem,
    CircularProgress,
    InputAdornment,
    IconButton,
    Autocomplete
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema, InvoiceFormValues } from '@/lib/validations';
import { createClient } from '@/lib/supabase-client';
import { generateInvoiceNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

interface InvoiceDialogProps {
    open: boolean;
    onClose: () => void;
    invoice?: any;
    onSuccess: () => void;
}

export default function InvoiceDialog({ open, onClose, invoice, onSuccess }: InvoiceDialogProps) {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const supabase = createClient();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: invoice ? {
            client_id: invoice.client_id,
            invoice_number: invoice.invoice_number,
            amount: Number(invoice.amount),
            currency: invoice.currency || 'NGN',
            due_date: invoice.due_date,
            description: invoice.description || '',
        } : {
            client_id: '',
            invoice_number: generateInvoiceNumber(),
            amount: 0,
            currency: 'NGN',
            due_date: new Date().toISOString().split('T')[0],
            description: '',
        },
    });

    useEffect(() => {
        if (open) {
            const fetchClients = async () => {
                const { data } = await supabase
                    .from('clients')
                    .select('id, name')
                    .order('name');
                setClients(data || []);
            };
            const fetchItems = async () => {
                const { data } = await supabase.from('items').select('*').order('name');
                setItems(data || []);
            };
            fetchClients();
            fetchItems();
            if (!invoice) {
                setValue('invoice_number', generateInvoiceNumber());
            } else if (invoice.description?.startsWith('ITEM_LINK:')) {
                try {
                    const meta = JSON.parse(invoice.description.replace('ITEM_LINK:', ''));
                    setValue('amount', meta.amount);
                    // We'll set the selected item state later or just leave it for now
                } catch (e) { }
            }
        }
    }, [open, invoice, setValue, supabase]);

    const onSubmit = async (values: InvoiceFormValues) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let description = values.description;
            if (selectedItem) {
                description = `ITEM_LINK:${JSON.stringify({
                    item_id: selectedItem.id,
                    quantity: values.amount / selectedItem.price, // Rough estimation or we could add a qty field
                    unit_price: selectedItem.price,
                    original_desc: values.description
                })}`;
            }

            const payload = {
                ...values,
                description,
                user_id: user.id,
                updated_at: new Date().toISOString(),
            };

            if (invoice) {
                const { error } = await supabase
                    .from('invoices')
                    .update(payload)
                    .eq('id', invoice.id);
                if (error) throw error;
                toast.success('Invoice updated');
            } else {
                const { error } = await supabase
                    .from('invoices')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Invoice created');
            }
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            select
                            label="Client"
                            fullWidth
                            {...register('client_id')}
                            error={!!errors.client_id}
                            helperText={errors.client_id?.message}
                            defaultValue={invoice?.client_id || ''}
                        >
                            <MenuItem value="">Select a client</MenuItem>
                            {clients.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>

                        <Autocomplete
                            fullWidth
                            options={items}
                            value={selectedItem}
                            getOptionLabel={(option) => `${option.name} (N${option.price})`}
                            onChange={(_, value) => {
                                setSelectedItem(value);
                                if (value) {
                                    setValue('amount', value.price);
                                    setValue('description', `Sale of ${value.name}`);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Link to Inventory Item (Optional)" />
                            )}
                        />

                        <TextField
                            label="Invoice Number"
                            fullWidth
                            {...register('invoice_number')}
                            error={!!errors.invoice_number}
                            helperText={errors.invoice_number?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setValue('invoice_number', generateInvoiceNumber())}>
                                            <RefreshIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Amount"
                                type="number"
                                fullWidth
                                {...register('amount', { valueAsNumber: true })}
                                error={!!errors.amount}
                                helperText={errors.amount?.message}
                            />
                            <TextField
                                select
                                label="Currency"
                                sx={{ width: 120 }}
                                {...register('currency')}
                                defaultValue="NGN"
                            >
                                <MenuItem value="NGN">NGN</MenuItem>
                                <MenuItem value="USD">USD</MenuItem>
                                <MenuItem value="EUR">EUR</MenuItem>
                                <MenuItem value="GBP">GBP</MenuItem>
                            </TextField>
                        </Box>

                        <TextField
                            label="Due Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            {...register('due_date')}
                            error={!!errors.due_date}
                            helperText={errors.due_date?.message}
                        />

                        <TextField
                            label="Description"
                            multiline
                            rows={3}
                            fullWidth
                            {...register('description')}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : (invoice ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
