'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    FormControlLabel,
    Checkbox,
    CircularProgress
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, ClientFormValues } from '@/lib/validations';
import { createClient } from '@/lib/supabase-client';
import toast from 'react-hot-toast';

interface ClientDialogProps {
    open: boolean;
    onClose: () => void;
    client?: any;
    onSuccess: () => void;
}

export default function ClientDialog({ open, onClose, client, onSuccess }: ClientDialogProps) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: client ? {
            name: client.name,
            email: client.email,
            phone: client.phone || '',
            whatsapp_enabled: client.whatsapp_enabled || false,
        } : {
            name: '',
            email: '',
            phone: '',
            whatsapp_enabled: false,
        },
    });

    const onSubmit = async (values: ClientFormValues) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            if (client) {
                const { error } = await supabase
                    .from('clients')
                    .update({
                        ...values,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', client.id);
                if (error) throw error;
                toast.success('Client updated successfully');
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert([{
                        ...values,
                        user_id: user.id,
                    }]);
                if (error) throw error;
                toast.success('Client added successfully');
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
                <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Client Name"
                            fullWidth
                            {...register('name')}
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />
                        <TextField
                            label="Email Address"
                            fullWidth
                            {...register('email')}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                        <TextField
                            label="Phone Number"
                            fullWidth
                            {...register('phone')}
                            error={!!errors.phone}
                            helperText={errors.phone?.message}
                        />
                        <FormControlLabel
                            control={<Checkbox {...register('whatsapp_enabled')} defaultChecked={client?.whatsapp_enabled} />}
                            label="WhatsApp Enabled"
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
                        {loading ? <CircularProgress size={24} /> : (client ? 'Update' : 'Add')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
