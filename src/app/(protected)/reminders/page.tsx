'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    IconButton,
    Chip,
    Tooltip,
    LinearProgress
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridActionsCellItem,
    GridValueGetter
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import AIIcon from '@mui/icons-material/SmartToy';
import CopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import { createClient } from '@/lib/supabase-client';
import { formatCurrency, formatDate, isOverdue } from '@/lib/utils';
import InvoiceDialog from '@/components/InvoiceDialog';
import AIReminderDialog from '@/components/AIReminderDialog';
import toast from 'react-hot-toast';

export default function RemindersPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [aiDialogOpen, setAIDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const supabase = createClient();

    const fetchInvoices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('invoices')
            .select('*, client:clients(name, email, phone)')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error(error.message);
        } else {
            setInvoices(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this invoice?')) {
            const { error } = await supabase.from('invoices').delete().eq('id', id);
            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Invoice deleted');
                fetchInvoices();
            }
        }
    };

    const handleAIGenerate = (invoice: any) => {
        setSelectedInvoice(invoice);
        setAIDialogOpen(true);
    };

    const handleCopyLink = (id: string) => {
        const link = `${window.location.origin}/invoice/${id}`;
        navigator.clipboard.writeText(link);
        toast.success('Payment link copied to clipboard');
    };

    const columns: GridColDef[] = [
        { field: 'invoice_number', headerName: 'Invoice #', width: 150 },
        {
            field: 'client_name',
            headerName: 'Client',
            flex: 1,
            valueGetter: (value, row) => row.client?.name || 'N/A'
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 150,
            renderCell: (params) => (
                <Typography>
                    {formatCurrency(params.row.amount, params.row.currency)}
                </Typography>
            )
        },
        {
            field: 'due_date',
            headerName: 'Due Date',
            width: 150,
            valueFormatter: (value) => formatDate(value)
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => {
                const overdue = isOverdue(params.row.due_date) && params.row.status !== 'paid';
                return (
                    <Chip
                        label={params.value.toUpperCase()}
                        color={params.value === 'paid' ? 'success' : overdue ? 'error' : 'default'}
                        variant="outlined"
                        size="small"
                    />
                );
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<AIIcon color="primary" />}
                    label="AI Reminder"
                    onClick={() => handleAIGenerate(params.row)}
                    showInMenu={false}
                />,
                <GridActionsCellItem
                    icon={<LinkIcon color="secondary" />}
                    label="Copy Payment Link"
                    onClick={() => handleCopyLink(params.id as string)}
                    showInMenu={false}
                />,
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => {
                        setSelectedInvoice(params.row);
                        setDialogOpen(true);
                    }}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDelete(params.id as string)}
                />,
            ],
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">AI Reminders & Invoices</Typography>
                <Box>
                    <IconButton onClick={fetchInvoices} sx={{ mr: 1 }}>
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setSelectedInvoice(null);
                            setDialogOpen(true);
                        }}
                    >
                        Create Invoice
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ height: 600, width: '100%', mb: 2 }}>
                <DataGrid
                    rows={invoices}
                    columns={columns}
                    loading={loading}
                    disableRowSelectionOnClick
                    sx={{ border: 'none' }}
                />
            </Paper>

            <InvoiceDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                invoice={selectedInvoice}
                onSuccess={fetchInvoices}
            />

            {selectedInvoice && (
                <AIReminderDialog
                    open={aiDialogOpen}
                    onClose={() => setAIDialogOpen(false)}
                    invoice={selectedInvoice}
                />
            )}
        </Box>
    );
}
