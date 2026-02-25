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
    MenuItem,
    Grid
} from '@mui/material';
import { Plus, Building2, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { formatCurrency } from '@/lib/utils';
import { calculateDepreciation } from '@/lib/tax-utils';
import toast from 'react-hot-toast';
import { nexus } from '@/lib/nexus';

export default function AssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newAsset, setNewAsset] = useState({
        name: '',
        cost: '',
        category: 'IT Equipment',
        depreciation_rate: '20',
        acquisition_date: new Date().toISOString().split('T')[0]
    });

    const supabase = createClient();

    const fetchAssets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('fixed_assets')
            .select('*')
            .order('acquisition_date', { ascending: false });

        if (error) toast.error('Failed to load assets');
        else setAssets(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleAddAsset = async () => {
        const { error } = await supabase.from('fixed_assets').insert([newAsset]);
        if (error) {
            toast.error('Failed to save asset');
        } else {
            // Nexus Integration (Phase 4: Tax1 Sync)
            await nexus.recordTransaction('expense', {
                type: 'fixed_asset',
                name: newAsset.name,
                cost: newAsset.cost,
                category: newAsset.category
            });

            toast.success('Asset tracked successfully');
            setOpen(false);
            fetchAssets();
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Module: Fixed Assets</Typography>
                    <Typography color="text.secondary">Track business equipment and automated depreciation for tax audits.</Typography>
                </Box>
                <Button variant="contained" startIcon={<Plus />} onClick={() => setOpen(true)}>
                    Add New Asset
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, bgcolor: 'secondary.dark', color: 'white' }}>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Asset Value (Cost)</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {formatCurrency(assets.reduce((sum, a) => sum + Number(a.cost), 0))}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderLeft: '4px solid', borderColor: 'error.main' }}>
                        <Typography variant="body2" color="text.secondary">Accumulated Depreciation (Est.)</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {formatCurrency(assets.reduce((sum, a) => sum + calculateDepreciation(a.cost, a.depreciation_rate, a.acquisition_date), 0))}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Asset Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Original Cost</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Depr. Rate</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Current Value</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Acquired</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assets.map((asset) => {
                            const depr = calculateDepreciation(asset.cost, asset.depreciation_rate, asset.acquisition_date);
                            const currentVal = asset.cost - depr;
                            return (
                                <TableRow key={asset.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{asset.name}</TableCell>
                                    <TableCell>{asset.category}</TableCell>
                                    <TableCell>{formatCurrency(asset.cost)}</TableCell>
                                    <TableCell>{asset.depreciation_rate}%</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                                        {formatCurrency(currentVal)}
                                    </TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{asset.acquisition_date}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Fixed Asset</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Asset Name"
                                fullWidth
                                value={newAsset.name}
                                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Original Cost (₦)"
                                type="number"
                                fullWidth
                                value={newAsset.cost}
                                onChange={(e) => setNewAsset({ ...newAsset, cost: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                select
                                label="Category"
                                fullWidth
                                value={newAsset.category}
                                onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                            >
                                <MenuItem value="IT Equipment">IT Equipment</MenuItem>
                                <MenuItem value="Furniture">Furniture</MenuItem>
                                <MenuItem value="Motor Vehicles">Motor Vehicles</MenuItem>
                                <MenuItem value="Machinery">Machinery</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Acquisition Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={newAsset.acquisition_date}
                                onChange={(e) => setNewAsset({ ...newAsset, acquisition_date: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Depreciation Rate (%)"
                                type="number"
                                fullWidth
                                value={newAsset.depreciation_rate}
                                onChange={(e) => setNewAsset({ ...newAsset, depreciation_rate: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddAsset}>Track Asset</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
