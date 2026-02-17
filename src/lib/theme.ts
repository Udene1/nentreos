'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

export const themeOptions: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1', // Indigo
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#a855f7', // Purple/Violet
        },
        info: {
            main: '#0ea5e9', // Blue for Track-It
        },
        success: {
            main: '#10b981', // Emerald for Tax1
        },
        error: {
            main: '#f43f5e', // Rose for ChaseAI
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
        text: {
            primary: '#0f172a',
            secondary: '#64748b',
        },
    },
    typography: {
        fontFamily: 'var(--font-inter), sans-serif',
        h1: { fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 800 },
        h2: { fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 700 },
        h3: { fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 700 },
        h4: { fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600 },
        h5: { fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600 },
        h6: { fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600 },
        button: { fontWeight: 600 },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    boxShadow: '0px 10px 30px rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.05)',
                },
                elevation0: {
                    border: '1px solid rgba(0,0,0,0.08)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    overflow: 'hidden',
                },
            },
        },
    },
};

const theme = createTheme(themeOptions);

export default theme;
