'use client';

import { Box, Container, Typography, Grid, Paper, Button, Stack, useTheme } from '@mui/material';
import { ShieldCheck, Receipt, TrendingUp, AlertCircle, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionPaper = motion(Paper);

export default function TaxHub() {
    const theme = useTheme();

    const taxStats = [
        { title: 'Taxable Sales', value: '₦4,250,000', icon: <TrendingUp color={theme.palette.success.main} />, color: 'success.main' },
        { title: 'VAT Collected (7.5%)', value: '₦318,750', icon: <Receipt color={theme.palette.info.main} />, color: 'info.main' },
        { title: 'Verified Deductibles', value: '₦850,000', icon: <ShieldCheck color={theme.palette.primary.main} />, color: 'primary.main' },
        { title: 'Estimated Liability', value: '₦215,000', icon: <AlertCircle color={theme.palette.error.main} />, color: 'error.main' },
    ];

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontFamily: 'var(--font-outfit)' }}>
                    Tax1 Compliance Hub
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Your automated NGN tax command center. We've synchronized your Track-It sales with Tax1 compliance logic.
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 5 }}>
                {taxStats.map((stat, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
                        <MotionPaper
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            sx={{ p: 3, borderRadius: 4, height: '100%' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                {stat.icon}
                                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                                    {stat.title}
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={800} color={stat.color}>
                                {stat.value}
                            </Typography>
                        </MotionPaper>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 4, borderRadius: 5 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Recent Compliance Alerts</Typography>
                        <Stack spacing={2}>
                            <Box className="glass-card" sx={{ p: 2, borderRadius: 3, borderLeft: '4px solid', borderColor: 'warning.main', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={700}>Missing Invoice Documentation</Typography>
                                    <Typography variant="caption" color="text.secondary">3 deductible claims need supporting PDF receipts.</Typography>
                                </Box>
                                <Button size="small" variant="outlined">Resolve</Button>
                            </Box>
                            <Box className="glass-card" sx={{ p: 2, borderRadius: 3, borderLeft: '4px solid', borderColor: 'success.main', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={700}>VAT Returns Ready</Typography>
                                    <Typography variant="caption" color="text.secondary">September 2026 data is finalized and ready for export.</Typography>
                                </Box>
                                <Button size="small" variant="outlined" endIcon={<Download size={14} />}>Export CSV</Button>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{
                        p: 4,
                        borderRadius: 5,
                        background: 'var(--suite-gradient)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <FileText size={48} style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Need a Tax Consultant?</Typography>
                        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                            We partner with local Nigerian tax experts who can review your NEntreOS reports and file directly with the FIRS.
                        </Typography>
                        <Button variant="contained" sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700, '&:hover': { bgcolor: 'grey.100' } }}>
                            Book a Review
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
}
