'use client';

import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import { Plus, Search, Filter, Download, Trash2, FilePlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { nexus } from '@/lib/nexus';

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

export default function DeductiblesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'Office Supplies',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    const supabase = createClient();

    const fetchExpenses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('business_expenses')
            .select('*')
            .order('expense_date', { ascending: false });

        if (error) toast.error('Failed to load expenses');
        else setExpenses(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAddExpense = async () => {
        if (!newExpense.amount || !newExpense.description) {
            toast.error('Please fill required fields');
            return;
        }

        const { error } = await supabase.from('business_expenses').insert([newExpense]);
        if (error) {
            toast.error('Failed to save expense');
        } else {
            // Nexus Integration (Phase 4: Tax1 Sync)
            await nexus.recordTransaction('expense', {
                category: newExpense.category,
                description: newExpense.description,
                amount: newExpense.amount,
                date: newExpense.expense_date
            });

            toast.success('Expense recorded for tax deduction');
            setOpen(false);
            setNewExpense({
                amount: '',
                category: 'Office Supplies',
                description: '',
                expense_date: new Date().toISOString().split('T')[0]
            });
            fetchExpenses();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        const { error } = await supabase.from('business_expenses').delete().eq('id', id);
        if (error) toast.error('Delete failed');
        else {
            toast.success('Expense removed');
            fetchExpenses();
        }
    };

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontFamily: 'var(--font-outfit)' }}>
                        Business Expenses
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Track your business costs and automatically reduce your CIT liability with Tax1.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => setOpen(true)} sx={{ borderRadius: 3 }}>
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
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
                        ) : filteredExpenses.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary" sx={{ py: 2 }}>No expenses found.</Typography></TableCell></TableRow>
                        ) : (
                            filteredExpenses.map((entry) => (
                                <TableRow key={entry.id} hover>
                                    <TableCell>{formatDate(entry.expense_date)}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{entry.description}</TableCell>
                                    <TableCell>
                                        <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(99, 102, 241, 0.08)', color: 'primary.main', borderRadius: 2, display: 'inline-block', fontSize: '0.75rem', fontWeight: 700 }}>
                                            {entry.category}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(entry.amount)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(entry.id)}><Trash2 size={18} /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Track Deduction</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Description"
                            fullWidth
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        />
                        <TextField
                            label="Amount (₦)"
                            type="number"
                            fullWidth
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                        <TextField
                            select
                            label="Category"
                            fullWidth
                            value={newExpense.category}
                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Expense Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={newExpense.expense_date}
                            onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddExpense}>Save Expense</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
