'use client';

import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    CircularProgress,
    Chip,
    Button,
    Fade,
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Lightbulb,
    TrendingUp,
    Package as Inventory,
    Wallet as AccountBalanceWallet,
    RefreshCw as Refresh,
    ChevronRight
} from 'lucide-react';
import { generateBusinessAdvice } from '@/lib/ai';

interface AIAdvisorProps {
    context: {
        totalSales: number;
        lowStockItems: string[];
        overdueAmount: number;
        topClient: string;
    };
}

export default function AIAdvisor({ context }: AIAdvisorProps) {
    const [advice, setAdvice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchAdvice = async () => {
        setLoading(true);
        try {
            const res = await generateBusinessAdvice(context);
            setAdvice(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvice();
    }, [context.totalSales, context.overdueAmount]);

    const getIcon = (category: string) => {
        switch (category) {
            case 'Inventory': return <Inventory color="primary" />;
            case 'Cashflow': return <AccountBalanceWallet color="error" />;
            case 'Growth': return <TrendingUp color="success" />;
            default: return <Lightbulb color="warning" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            default: return 'info';
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" color="text.secondary">AI Advisor is analyzing your data...</Typography>
                </Stack>
            </Paper>
        );
    }

    return (
        <Fade in={!loading}>
            <Paper sx={{
                p: 3,
                borderRadius: 2,
                height: '100%',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                    <Lightbulb size={100} />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Lightbulb fontSize="small" color="secondary" />
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            NEntreOS AI ADVISOR
                        </Typography>
                    </Stack>
                    <Tooltip title="Refresh advice">
                        <IconButton size="small" onClick={fetchAdvice} sx={{ color: 'white' }}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Chip
                        label={advice?.category || 'General'}
                        size="small"
                        color={getPriorityColor(advice?.priority)}
                        sx={{ fontWeight: 'bold', mb: 2 }}
                    />
                    <Typography variant="h6" fontWeight="medium" line-height={1.4}>
                        "{advice?.advice}"
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    color="secondary"
                    endIcon={<ChevronRight />}
                    fullWidth
                    sx={{
                        mt: 'auto',
                        fontWeight: 'bold',
                        borderRadius: 10,
                        backgroundColor: 'white',
                        color: 'primary.dark',
                        '&:hover': { backgroundColor: 'grey.100' }
                    }}
                >
                    Take Action
                </Button>
            </Paper>
        </Fade>
    );
}
