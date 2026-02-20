'use client';

import { Box, Container, Typography, Paper, Button, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Stack } from '@mui/material';
import { Plus, Search, Filter, Download, Trash2, FilePlus } from 'lucide-react';
import { useState } from 'react';

const categories = [
    'Office Supplies',
    'Utilities',
    'Rent',
    'Travel',
    'Marketing',
    'Professional Fees',
    'Maintenance',
    'Other'
];

const mockDeductibles = [
    { id: 1, date: '2026-02-14', amount: '₦15,000', category: 'Marketing', description: 'Facebook Ads - Feb', status: 'Verified' },
    { id: 2, date: '2026-02-12', amount: '₦45,000', category: 'Office Supplies', description: 'HP Toner & Paper', status: 'Pending' },
    { id: 3, date: '2026-02-10', amount: '₦120,000', category: 'Rent', description: 'Office Space - Monthly', status: 'Verified' },
];

export default function DeductiblesPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontFamily: 'var(--font-outfit)' }}>
                        Business Deductibles
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Track your business expenses and automatically reduce your CIT liability.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Plus size={20} />} sx={{ borderRadius: 3 }}>
                    New Expense
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
                <Stack direction="row" spacing={2}>
                    <TextField
                        size="small"
                        placeholder="Search expenses..."
                        fullWidth
                        InputProps={{
                            startAdornment: <Search size={18} style={{ marginRight: '8px', opacity: 0.5 }} />,
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <TextField
                        select
                        size="small"
                        defaultValue="All Categories"
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="All Categories">All Categories</MenuItem>
                        {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                    </TextField>
                    <Button variant="outlined" startIcon={<Filter size={18} />} sx={{ minWidth: 120 }}>
                        Filters
                    </Button>
                </Stack>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockDeductibles.map((item) => (
                            <TableRow key={item.id} hover>
                                <TableCell>{item.date}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{item.description}</TableCell>
                                <TableCell>
                                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(99, 102, 241, 0.08)', color: 'primary.main', borderRadius: 2, display: 'inline-block', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {item.category}
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{item.amount}</TableCell>
                                <TableCell>
                                    <Box sx={{
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 2,
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        display: 'inline-block',
                                        bgcolor: item.status === 'Verified' ? 'success.light' : 'warning.light',
                                        color: item.status === 'Verified' ? 'success.dark' : 'warning.dark'
                                    }}>
                                        {item.status.toUpperCase()}
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" color="primary"><FilePlus size={18} /></IconButton>
                                    <IconButton size="small" color="error"><Trash2 size={18} /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 4, textAlign: 'right' }}>
                <Button variant="outlined" startIcon={<Download size={20} />} sx={{ borderRadius: 3 }}>
                    Download Tax1 Report
                </Button>
            </Box>
        </Container>
    );
}
