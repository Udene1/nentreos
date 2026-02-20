'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Divider,
    Stack,
    CircularProgress,
    Button,
    Alert,
    AlertTitle
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Download,
    ShieldCheck,
    Calculator
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { formatCurrency } from '@/lib/utils';
import { calculateDepreciation } from '@/lib/tax-utils';
import toast from 'react-hot-toast';

export default function TaxHubPage() {
    const [loading, setLoading] = useState(true);
    const [plData, setPlData] = useState({
        revenue: 0,
        cogs: 0,
        expenses: 0,
        payroll: 0,
        depreciation: 0,
    });

    const supabase = createClient();

    const fetchFinancials = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/tax1/pl');
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            setPlData({
                revenue: data.revenue,
                cogs: data.cogs,
                expenses: data.operatingExpenses.general,
                payroll: data.operatingExpenses.payroll,
                depreciation: data.operatingExpenses.depreciation
            });
        } catch (error: any) {
            console.error('P&L Fetch Error:', error);
            toast.error(error.message || 'Failed to aggregate P&L data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancials();
    }, []);

    const grossProfit = plData.revenue - plData.cogs;
    const totalOperatingExpenses = plData.expenses + plData.payroll + plData.depreciation;
    const netProfit = grossProfit - totalOperatingExpenses;

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Tax1: Financial Hub</Typography>
                    <Typography color="text.secondary">Your pro-forma Profit & Loss statement based on live NEntreOS data.</Typography>
                </Box>
                <Button variant="contained" startIcon={<Download />} disabled>
                    Export FIRS Report
                </Button>
            </Box>

            <Alert severity="success" icon={<ShieldCheck />} sx={{ mb: 4, borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 'bold' }}>Enterprise Compliance Active</AlertTitle>
                Tax1 is currently monitoring your Sales, Expenses, and Payroll to provide an accurate P&L and CIT projection.
            </Alert>

            <Grid container spacing={4}>
                {/* Simplified P&L View */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper sx={{ p: 4, borderRadius: 4 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            Pro-Forma Profit & Loss (All Time)
                        </Typography>

                        <Stack spacing={2.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Total Revenue (Net of VAT)</Typography>
                                <Typography variant="h6" fontWeight="bold">{formatCurrency(plData.revenue / 1.075)}</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                                <Typography variant="body1">Cost of Goods Sold (COGS)</Typography>
                                <Typography variant="body1">({formatCurrency(plData.cogs)})</Typography>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                                <Typography variant="h6" fontWeight="bold">Gross Profit</Typography>
                                <Typography variant="h6" fontWeight="bold" color="success.main">{formatCurrency(grossProfit / 1.075)}</Typography>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Operating Expenses</Typography>
                                <Stack spacing={1.5} sx={{ pl: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Salaries & Payroll</Typography>
                                        <Typography variant="body2">{formatCurrency(plData.payroll)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">General Business Expenses</Typography>
                                        <Typography variant="body2">{formatCurrency(plData.expenses)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Depreciation of Assets</Typography>
                                        <Typography variant="body2">{formatCurrency(plData.depreciation)}</Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'primary.dark', color: 'white', p: 2, borderRadius: 2 }}>
                                <Typography variant="h5" fontWeight="bold">Net Profit Before Tax</Typography>
                                <Typography variant="h5" fontWeight="bold">{formatCurrency((netProfit / 1.075))}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Tax Liability Sidebar */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: 3, borderRadius: 3, borderTop: '5px solid', borderColor: 'warning.main' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <BarChart3 className="text-warning-500" />
                                <Typography variant="h6" fontWeight="bold">Tax Liability Summary</Typography>
                            </Box>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Est. VAT (7.5%)</Typography>
                                    <Typography variant="body2" fontWeight="bold">{formatCurrency(plData.revenue * 0.075 / 1.075)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Est. CIT (30%)*</Typography>
                                    <Typography variant="body2" fontWeight="bold">{formatCurrency(Math.max(0, netProfit * 0.3))}</Typography>
                                </Box>
                                <Divider />
                                <Typography variant="caption" color="text.secondary">
                                    *Company Income Tax (CIT) is estimated at 30% for Large companies. Small/Medium may be lower.
                                </Typography>
                            </Stack>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'info.dark', color: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Calculator />
                                <Typography variant="h6" fontWeight="bold">Audit Readiness</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                                Your data is being formatted for FIRS requirements. Ensure all receipts are uploaded in the Expenses module.
                            </Typography>
                            <Button variant="contained" fullWidth sx={{ bgcolor: 'white', color: 'info.dark', fontWeight: 'bold' }}>
                                Run Audit Check
                            </Button>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
