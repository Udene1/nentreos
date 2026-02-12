'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridActionsCellItem
} from '@mui/x-data-grid';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { createClient } from '@/lib/supabase-client';
import ClientDialog from '@/components/ClientDialog';
import toast from 'react-hot-toast';

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const supabase = createClient();

    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            toast.error(error.message);
        } else {
            setClients(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this client?')) {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Client deleted');
                fetchClients();
            }
        }
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Client Name', flex: 1 },
        { field: 'email', headerName: 'Email', width: 250 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        {
            field: 'whatsapp_enabled',
            headerName: 'WA',
            width: 80,
            renderCell: (params) => params.value ? <WhatsAppIcon color="success" /> : null
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => {
                        setSelectedClient(params.row);
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
                <Typography variant="h4" fontWeight="bold">Clients</Typography>
                <Box>
                    <IconButton onClick={fetchClients} sx={{ mr: 1 }}>
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setSelectedClient(null);
                            setDialogOpen(true);
                        }}
                    >
                        Add Client
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={clients}
                    columns={columns}
                    loading={loading}
                    disableRowSelectionOnClick
                    sx={{ border: 'none' }}
                />
            </Paper>

            <ClientDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                client={selectedClient}
                onSuccess={fetchClients}
            />
        </Box>
    );
}
