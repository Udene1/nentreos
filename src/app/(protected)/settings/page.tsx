'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    CircularProgress,
    Divider,
    Alert,
    Grid,
    TextField,
    Stack
} from '@mui/material';
import { createClient } from '@/lib/supabase-client';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'WAC'>('FIFO');
    const [barcodeEnabled, setBarcodeEnabled] = useState<boolean>(true);
    const [businessProfile, setBusinessProfile] = useState({
        businessName: '',
        tin: '',
        address: '',
        vatRate: 7.5,
    });
    const [userRole, setUserRole] = useState<'owner' | 'manager' | 'staff'>('owner');
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                toast.error('Failed to load settings');
            } else if (data) {
                setValuationMethod(data.valuation_method as 'FIFO' | 'WAC');
                setBarcodeEnabled(data.barcode_enabled ?? true);
                setBusinessProfile({
                    businessName: data.business_name || '',
                    tin: data.tin || '',
                    address: data.address || '',
                    vatRate: data.vat_rate || 7.5,
                });
                setUserRole((data as any).role || 'owner');
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('settings')
                .upsert({
                    user_id: user.id,
                    valuation_method: valuationMethod,
                    barcode_enabled: barcodeEnabled,
                    business_name: businessProfile.businessName,
                    tin: businessProfile.tin,
                    address: businessProfile.address,
                    vat_rate: businessProfile.vatRate,
                    role: userRole,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            toast.success('Settings saved successfully');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box maxWidth="md">
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>Settings</Typography>

            <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">Business Profile (FIRS Compliance)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    This information appears on your invoices and tax exports. Ensure your TIN is correct for FIRS-ready reporting.
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Legal Business Name"
                            fullWidth
                            value={businessProfile.businessName}
                            onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Tax Identification Number (TIN)"
                            fullWidth
                            value={businessProfile.tin}
                            onChange={(e) => setBusinessProfile({ ...businessProfile, tin: e.target.value })}
                            placeholder="e.g., 12345678-0001"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Business Address"
                            fullWidth
                            multiline
                            rows={2}
                            value={businessProfile.address}
                            onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Default VAT Rate (%)"
                            type="number"
                            fullWidth
                            value={businessProfile.vatRate}
                            onChange={(e) => setBusinessProfile({ ...businessProfile, vatRate: Number(e.target.value) })}
                            helperText="Standard rate in Nigeria is 7.5%"
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">Inventory Options</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configuration for stock tracking and COST calculation (COGS).
                </Typography>

                <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Valuation Method</FormLabel>
                    <RadioGroup
                        value={valuationMethod}
                        onChange={(e) => setValuationMethod(e.target.value as 'FIFO' | 'WAC')}
                    >
                        <FormControlLabel
                            value="FIFO"
                            control={<Radio />}
                            label={
                                <Box>
                                    <Typography variant="body1">FIFO (First-In, First-Out)</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Assumes the oldest stock is sold first. Recommended for tax audit.
                                    </Typography>
                                </Box>
                            }
                        />
                        <Box sx={{ my: 1 }} />
                        <FormControlLabel
                            value="WAC"
                            control={<Radio />}
                            label={
                                <Box>
                                    <Typography variant="body1">Weighted Average Cost (WAC)</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Average cost of all available stock.
                                    </Typography>
                                </Box>
                            }
                        />
                    </RadioGroup>
                </FormControl>

                <Divider sx={{ my: 3 }} />

                <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Barcodes</FormLabel>
                    <RadioGroup
                        row
                        value={barcodeEnabled ? 'enabled' : 'disabled'}
                        onChange={(e) => setBarcodeEnabled(e.target.value === 'enabled')}
                    >
                        <FormControlLabel value="enabled" control={<Radio />} label="Enabled" />
                        <FormControlLabel value="disabled" control={<Radio />} label="Disabled" />
                    </RadioGroup>
                </FormControl>

                <Divider sx={{ my: 3 }} />

                <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Active User Role (Demo Mode)</FormLabel>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Switching roles helps you test what your staff members will see.
                    </Typography>
                    <RadioGroup
                        row
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value as any)}
                    >
                        <FormControlLabel value="owner" control={<Radio />} label="Owner" />
                        <FormControlLabel value="manager" control={<Radio />} label="Manager" />
                        <FormControlLabel value="staff" control={<Radio />} label="Staff" />
                    </RadioGroup>
                </FormControl>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ px: 5, fontWeight: 'bold' }}
                >
                    {saving ? <CircularProgress size={24} color="inherit" /> : 'Save All Settings'}
                </Button>
            </Box>
        </Box>
    );
}
