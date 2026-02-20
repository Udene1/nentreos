'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Divider
} from '@mui/material';
import { Bot as AIIcon, Send as SendIcon } from 'lucide-react';
import { generateReminder } from '@/lib/ai';
import { createClient } from '@/lib/supabase-client';
import toast from 'react-hot-toast';

interface AIReminderDialogProps {
    open: boolean;
    onClose: () => void;
    invoice: any;
}

export default function AIReminderDialog({ open, onClose, invoice }: AIReminderDialogProps) {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [level, setLevel] = useState(1);
    const [generated, setGenerated] = useState<{ subject: string; message: string; tone: string } | null>(null);
    const supabase = createClient();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateReminder(invoice, invoice.client, level as any);
            setGenerated(result);
        } catch (error: any) {
            toast.error('AI generation failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!generated) return;
        setSending(true);
        try {
            const { error } = await supabase
                .from('reminders')
                .insert([{
                    invoice_id: invoice.id,
                    type: 'email',
                    escalation_level: level,
                    status: 'sent', // For demo purposes, we mark as sent
                    ai_message: generated.message,
                    sent_date: new Date().toISOString()
                }]);

            if (error) throw error;

            toast.success('Reminder "sent" successfully (Log record created)');
            onClose();
        } catch (error: any) {
            toast.error('Failed to log reminder: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AIIcon color="primary" />
                AI Payment Chaser
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Generating a personalized reminder for <strong>{invoice.client?.name}</strong> regarding invoice <strong>{invoice.invoice_number}</strong> ({invoice.amount} {invoice.currency}).
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Escalation Level</InputLabel>
                            <Select
                                value={level}
                                label="Escalation Level"
                                onChange={(e) => setLevel(Number(e.target.value))}
                            >
                                <MenuItem value={1}>Level 1: Polite Reminder</MenuItem>
                                <MenuItem value={2}>Level 2: Firm Follow-up</MenuItem>
                                <MenuItem value={3}>Level 3: Urgent Notice</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            onClick={handleGenerate}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
                        >
                            {generated ? 'Regenerate' : 'Generate with AI'}
                        </Button>
                    </Box>

                    {generated && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Divider />
                            <TextField
                                label="Subject"
                                fullWidth
                                value={generated.subject}
                                onChange={(e) => setGenerated({ ...generated, subject: e.target.value })}
                            />
                            <TextField
                                label="Message"
                                multiline
                                rows={10}
                                fullWidth
                                value={generated.message}
                                onChange={(e) => setGenerated({ ...generated, message: e.target.value })}
                            />
                            <Typography variant="caption" color="text.secondary">
                                AI Tone Detected: <strong>{generated.tone}</strong>
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={!generated || sending}
                    startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
                >
                    {sending ? 'Sending...' : 'Send Reminder'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
