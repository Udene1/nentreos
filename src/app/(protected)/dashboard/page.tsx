'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Alert,
    Button,
    Skeleton,
    Stack
} from '@mui/material';
import {
    TrendingUp,
    Inventory,
    Warning,
    Receipt,
    SmartToy as AIIcon,
    AccountBalanceWallet as WalletIcon,
    Assessment as TaxIcon
} from '@mui/icons-material';
import { createClient } from '@/lib/supabase-client';
import { useRole } from '@/hooks/useRole';
import AIAdvisor from '@/components/AIAdvisor';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalStockValue: 0,
        lowStockCount: 0,
        todaySales: 0,
        totalOverdue: 0,
        pendingReminders: 0,
        recentActivity: [] as any[],
        lowStockNames: [] as string[],
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { role, isManager } = useRole();

    const fetchStats = async () => {
        setLoading(true);
        try {
            // 1. Fetch Items & Stock Value
            const { data: items } = await supabase.from('items').select('quantity, price');
            const totalStockVal = (items || []).reduce((sum: number, item: any) => sum + (item.quantity * Number(item.price)), 0);
            const lowStock = (items || []).filter((item: any) => item.quantity < 10).length;

            // 2. Fetch Today's Sales
            const today = new Date().toISOString().split('T')[0];
            const { data: sales } = await supabase
                .from('sales')
                .select('*')
                .gte('sale_date', today);
            const todaySalesTotal = (sales || []).reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0);

            // 3. Fetch Invoices & Receivables
            const { data: invoices } = await supabase
                .from('invoices')
                .select('amount, status, due_date')
                .neq('status', 'paid');

            const now = new Date();
            const overdueTotal = (invoices || [])
                .filter((inv: any) => new Date(inv.due_date) < now)
                .reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);

            // 4. Fetch Pending Reminders
            const { count: pendingCount } = await supabase
                .from('reminders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // 5. Recent Activity (Sales + Invoices)
            const { data: recentSales } = await supabase
                .from('sales')
                .select('id, total_amount, sale_date, items(name)')
                .order('sale_date', { ascending: false })
                .limit(5);

            setStats({
                totalStockValue: totalStockVal,
                lowStockCount: lowStock,
                todaySales: todaySalesTotal,
                totalOverdue: overdueTotal,
                pendingReminders: pendingCount || 0,
                recentActivity: recentSales || [],
                lowStockNames: (items || []).filter((i: any) => i.quantity < 10).map((i: any) => i.name)
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Real-time listeners for instant updates
        const channels = [
            supabase.channel('dashboard-sales').on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, fetchStats),
            supabase.channel('dashboard-invoices').on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchStats),
            supabase.channel('dashboard-items').on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, fetchStats)
        ];

        channels.forEach(ch => ch.subscribe());

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, []);

    if (loading && stats.recentActivity.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="text" width={300} height={60} sx={{ mb: 4 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
                Business Hub
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                            <Button variant="outlined" startIcon={<Receipt />} href="/sales/new" sx={{ minWidth: 150 }}>
                                New Cash Sale
                            </Button>
                            <Button variant="outlined" startIcon={<Receipt />} href="/invoices/new" sx={{ minWidth: 150 }}>
                                Create Invoice
                            </Button>
                            <Button variant="outlined" startIcon={<TaxIcon />} href="/reports" sx={{ minWidth: 150 }}>
                                Tax Summary
                            </Button>
                            <Button variant="outlined" startIcon={<Inventory />} href="/inventory/add" sx={{ minWidth: 150 }}>
                                Add Stock
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Inventory fontSize="large" />
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Stock Value</Typography>
                                <Typography variant="h5" fontWeight="bold">
                                    {isManager ? formatCurrency(stats.totalStockValue) : '***'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ bgcolor: stats.lowStockCount > 0 ? 'warning.main' : 'success.main', color: 'white' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Warning fontSize="large" />
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Low Stock Alerts</Typography>
                                <Typography variant="h5" fontWeight="bold">{stats.lowStockCount}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TrendingUp fontSize="large" />
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Today's Sales</Typography>
                                <Typography variant="h5" fontWeight="bold">
                                    {isManager ? formatCurrency(stats.todaySales) : '***'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ bgcolor: stats.totalOverdue > 0 ? 'error.main' : 'info.main', color: 'white' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <WalletIcon fontSize="large" />
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Overdue</Typography>
                                <Typography variant="h5" fontWeight="bold">
                                    {isManager ? formatCurrency(stats.totalOverdue) : '***'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Recent Sales & Activity</Typography>
                        <List>
                            {stats.recentActivity.length === 0 ? (
                                <Typography color="text.secondary" sx={{ py: 2 }}>No activity recorded yet.</Typography>
                            ) : (
                                stats.recentActivity.map((activity: any, index: number) => (
                                    <Box key={activity.id}>
                                        <ListItem sx={{ py: 1.5 }}>
                                            <ListItemText
                                                primary={activity.items?.name || 'Item Sale'}
                                                secondary={new Date(activity.sale_date).toLocaleString()}
                                            />
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography fontWeight="bold" color="primary.main">
                                                    {formatCurrency(Number(activity.total_amount))}
                                                </Typography>
                                            </Box>
                                        </ListItem>
                                        {index < stats.recentActivity.length - 1 && <Divider />}
                                    </Box>
                                ))
                            )}
                        </List>
                        <Button fullWidth variant="outlined" sx={{ mt: 2 }} href="/sales">
                            View All Sales
                        </Button>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={3}>
                        <AIAdvisor context={{
                            totalSales: stats.todaySales,
                            lowStockItems: stats.lowStockNames,
                            overdueAmount: stats.totalOverdue,
                            topClient: 'Valued Customer'
                        }} />

                        <Paper sx={{ p: 3, bgcolor: 'primary.dark', color: 'white', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <AIIcon />
                                <Typography variant="h6" fontWeight="bold">AI Payment Chaser</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                                You have <strong>{stats.pendingReminders}</strong> reminders pending execution. Automate your collections with NEntreOS AI.
                            </Typography>
                            <Button variant="contained" color="secondary" fullWidth sx={{ fontWeight: 'bold' }} href="/reminders">
                                Manage AI Reminders
                            </Button>
                        </Paper>

                        {isManager && (
                            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">Tax Compliance</Typography>
                                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                    Total estimated 7.5% VAT collected today: <strong>{formatCurrency(stats.todaySales * 0.075 / 1.075)}</strong>
                                </Typography>
                                <Button variant="outlined" color="primary" fullWidth href="/reports">
                                    View Tax Reports
                                </Button>
                            </Paper>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}

