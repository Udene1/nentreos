'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    CircularProgress,
    Button,
    ButtonGroup,
    Stack,
    Divider,
    MenuItem,
    Alert,
    Container
} from '@mui/material';
import {
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Assessment as TaxIcon
} from '@mui/icons-material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { createClient } from '@/lib/supabase-client';
import { useRole } from '@/hooks/useRole';
import { formatCurrency, downloadCSV, VAT_RATE } from '@/lib/utils';
import toast from 'react-hot-toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [salesData, setSalesData] = useState<any[]>([]);
    const [itemsData, setItemsData] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState('30'); // Days
    const supabase = createClient();
    const { role } = useRole();

    const fetchData = async () => {
        setLoading(true);
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - Number(dateRange));

            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*, items(name)')
                .gte('sale_date', startDate.toISOString())
                .order('sale_date', { ascending: true });

            const { data: items, error: itemsError } = await supabase
                .from('items')
                .select('*');

            if (salesError || itemsError) throw new Error('Failed to load data');

            setSalesData(sales || []);
            setItemsData(items || []);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    // Financial Calculations
    const totalRevenue = salesData.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0);
    const totalCOGS = salesData.reduce((sum: number, sale: any) => sum + (Number(sale.cost_at_sale || 0) * Number(sale.quantity_sold)), 0);
    const grossProfit = totalRevenue - totalCOGS;

    // VAT Logic (Output VAT)
    // In Nigeria, VAT is 7.5%. Usually it's inclusive in total_amount or exclusive. 
    // Assuming standard practice of calculating from total revenue.
    const outputVAT = totalRevenue * (VAT_RATE / (1 + VAT_RATE));

    const handleExportCSV = () => {
        const exportData = salesData.map((sale: any) => ({
            Date: new Date(sale.sale_date).toLocaleDateString(),
            Item: sale.items?.name || 'Unknown',
            Quantity: sale.quantity_sold,
            UnitPrice: sale.unit_price,
            Total: sale.total_amount,
            VAT: (Number(sale.total_amount) * (VAT_RATE / (1 + VAT_RATE))).toFixed(2),
        }));
        downloadCSV(exportData, `NEntreOS_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Report exported to CSV');
    };

    // Prepare Daily Revenue Chart Data
    const dailyRevenue = salesData.reduce((acc: any, sale: any) => {
        const date = new Date(sale.sale_date).toLocaleDateString();
        acc[date] = (acc[date] || 0) + Number(sale.total_amount);
        return acc;
    }, {});

    const revenueChartData = {
        labels: Object.keys(dailyRevenue),
        datasets: [
            {
                label: 'Revenue (₦)',
                data: Object.values(dailyRevenue),
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    if (loading && salesData.length === 0) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}>
                <CircularProgress size={60} />
                <Typography color="text.secondary">Aggregating financial data...</Typography>
            </Box>
        );
    }

    if (role === 'staff') {
        return (
            <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
                <Paper sx={{ p: 4 }}>
                    <TaxIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight="bold">Access Restricted</Typography>
                    <Typography color="text.secondary">
                        Financial analytics and tax reports are only available to Owners and Managers.
                        Please contact your administrator if you need access.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">Financial Analytics</Typography>
                <Stack direction="row" spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Range</InputLabel>
                        <Select
                            value={dateRange}
                            label="Range"
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <MenuItem value="7">Last 7 Days</MenuItem>
                            <MenuItem value="30">Last 30 Days</MenuItem>
                            <MenuItem value="90">Last 3 Months</MenuItem>
                            <MenuItem value="365">Last Year</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                        sx={{ fontWeight: 'bold' }}
                    >
                        Export CSV
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, borderTop: '4px solid', borderTopColor: 'primary.main', height: '100%' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Gross Revenue</Typography>
                        <Typography variant="h5" fontWeight="bold">{formatCurrency(totalRevenue)}</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, borderTop: '4px solid', borderTopColor: 'success.main', height: '100%' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Gross Profit</Typography>
                        <Typography variant="h5" fontWeight="bold" color="success.main">{formatCurrency(grossProfit)}</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, borderTop: '4px solid', borderTopColor: 'warning.main', height: '100%', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <TaxIcon fontSize="small" />
                            <Typography variant="body2" fontWeight="bold">Est. Output VAT</Typography>
                        </Box>
                        <Typography variant="h5" fontWeight="bold">{formatCurrency(outputVAT)}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>FIRS Standard 7.5%</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, borderTop: '4px solid', borderTopColor: 'info.main', height: '100%' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Active Inventory Value</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {formatCurrency(itemsData.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.weighted_avg_cost || item.price || 0)), 0))}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper sx={{ p: 3, height: 450, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Revenue Trend (₦)</Typography>
                        <Box sx={{ height: 350 }}>
                            <Line
                                data={revenueChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { beginAtZero: true }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ p: 3, height: 450, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold">VAT Compliance Audit</Typography>
                            <TaxIcon color="disabled" />
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Net Taxable Revenue</Typography>
                                <Typography variant="body2" fontWeight="bold">{formatCurrency(totalRevenue - outputVAT)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Computed VAT (7.5%)</Typography>
                                <Typography variant="body2" fontWeight="bold">{formatCurrency(outputVAT)}</Typography>
                            </Box>
                            <Divider />
                            <Alert severity="info" variant="outlined" sx={{ border: 'none', px: 0 }}>
                                <Typography variant="caption">
                                    Include this summary in your FIRS Monthly VAT Return (Form 002). Ensure your TIN is updated in Settings.
                                </Typography>
                            </Alert>
                            <Button variant="outlined" fullWidth sx={{ mt: 2 }} disabled>
                                Download PDF Audit Report
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

