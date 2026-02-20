'use client';

import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Grid
} from '@mui/material';
import { Plus, Download, Users, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { formatCurrency } from '@/lib/utils';
import { calculateNigerianPAYE } from '@/lib/tax-utils';
import toast from 'react-hot-toast';

export default function PayrollPage() {
    const [payroll, setPayroll] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newEntry, setNewEntry] = useState({
        employee_name: '',
        gross_salary: ''
    });

    const supabase = createClient();

    const fetchPayroll = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('payroll')
            .select('*')
            .order('payment_date', { ascending: false });

        if (error) toast.error('Failed to load payroll');
        else setPayroll(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchPayroll();
    }, []);

    const handleAddEntry = async () => {
        const gross = Number(newEntry.gross_salary);
        if (!newEntry.employee_name || gross <= 0) {
            toast.error('Please enter valid employee details');
            return;
        }

        const paye = calculateNigerianPAYE(gross);
        const pension = gross * 0.08; // Standard 8% employee contribution
        const net = gross - paye - pension;

        const { error } = await supabase.from('payroll').insert([{
            employee_name: newEntry.employee_name,
            gross_salary: gross,
            paye_tax: paye,
            pension: pension,
            net_salary: net
        }]);

        if (error) {
            toast.error('Failed to save payroll entry');
        } else {
            toast.success('Payroll entry added');
            setOpen(false);
            fetchPayroll();
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Module: Payroll</Typography>
                    <Typography color="text.secondary">Automated PAYE & National Pension compliance for Nigerian SMEs.</Typography>
                </Box>
                <Button variant="contained" startIcon={<Plus />} onClick={() => setOpen(true)}>
                    Run Payroll
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, bgcolor: 'primary.dark', color: 'white' }}>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Salaries (MTD)</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {formatCurrency(payroll.reduce((sum, p) => sum + Number(p.gross_salary), 0))}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderLeft: '4px solid', borderColor: 'warning.main' }}>
                        <Typography variant="body2" color="text.secondary">Total PAYE Liability</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {formatCurrency(payroll.reduce((sum, p) => sum + Number(p.paye_tax), 0))}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderLeft: '4px solid', borderColor: 'info.main' }}>
                        <Typography variant="body2" color="text.secondary">Pension Fund (8%)</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {formatCurrency(payroll.reduce((sum, p) => sum + Number(p.pension), 0))}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Gross Pay</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>PAYE Tax</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Pension</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Net Pay</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payroll.map((entry) => (
                            <TableRow key={entry.id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{entry.employee_name}</TableCell>
                                <TableCell>{formatCurrency(entry.gross_salary)}</TableCell>
                                <TableCell sx={{ color: 'error.main' }}>{formatCurrency(entry.paye_tax)}</TableCell>
                                <TableCell>{formatCurrency(entry.pension)}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                                    {formatCurrency(entry.net_salary)}
                                </TableCell>
                                <TableCell sx={{ color: 'text.secondary' }}>
                                    {entry.payment_date ? new Date(entry.payment_date).toLocaleDateString() : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Add Payroll Entry</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Employee Name"
                            fullWidth
                            value={newEntry.employee_name}
                            onChange={(e) => setNewEntry({ ...newEntry, employee_name: e.target.value })}
                        />
                        <TextField
                            label="Gross Monthly Salary (₦)"
                            type="number"
                            fullWidth
                            value={newEntry.gross_salary}
                            onChange={(e) => setNewEntry({ ...newEntry, gross_salary: e.target.value })}
                        />
                        <Alert severity="info">
                            Tax1 will automatically compute Nigerian PAYE and 8% Pension deduction.
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddEntry}>Generate Paystub</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

