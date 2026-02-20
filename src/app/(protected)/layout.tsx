'use client';

import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Container,
    Avatar,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    LayoutDashboard as DashboardIcon,
    Package as InventoryIcon,
    ShoppingBag as SalesIcon,
    ShoppingCart as PurchasesIcon,
    BarChart3 as ReportsIcon,
    Settings as SettingsIcon,
    LogOut as LogoutIcon,
    User as PersonIcon,
    Users as ClientsIcon,
    Bot as AIIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useRole } from '@/hooks/useRole';
import toast from 'react-hot-toast';

const drawerWidth = 240;

const menuSections = [
    {
        title: 'Track-It (Inventory)',
        gradient: 'var(--track-it-gradient)',
        items: [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
            { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
            { text: 'Sales', icon: <SalesIcon />, path: '/sales' },
            { text: 'Purchases', icon: <PurchasesIcon />, path: '/purchases' },
        ]
    },
    {
        title: 'Tax1 (Compliance)',
        gradient: 'var(--tax1-gradient)',
        items: [
            { text: 'Tax Hub', icon: <ReportsIcon />, path: '/tax1' },
            { text: 'Deductibles', icon: <SalesIcon />, path: '/tax1/deductibles' },
        ]
    },
    {
        title: 'ChaseAI (Recovery)',
        gradient: 'var(--chase-gradient)',
        items: [
            { text: 'AI Reminders', icon: <AIIcon />, path: '/reminders' },
            { text: 'Clients', icon: <ClientsIcon />, path: '/clients' },
        ]
    },
    {
        title: 'System',
        items: [
            { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
        ]
    }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const { role } = useRole();

    // Flatten for role filtering logic if needed, but we'll filter sections
    const filteredSections = menuSections.map(section => ({
        ...section,
        items: section.items.filter(item => {
            if (role === 'staff') {
                return ['Dashboard', 'Inventory', 'Sales', 'Clients'].includes(item.text);
            }
            return true;
        })
    })).filter(section => section.items.length > 0);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email ?? '');
            }
        };
        getUser();
    }, [supabase.auth]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success('Logged out successfully');
        router.push('/login');
        router.refresh();
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', px: 3, py: 3 }}>
                <Typography variant="h5" sx={{
                    fontWeight: 800,
                    background: 'var(--suite-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'var(--font-outfit)'
                }}>
                    NEntreOS Suite
                </Typography>
            </Toolbar>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2 }}>
                {filteredSections.map((section) => (
                    <Box key={section.title} sx={{ mb: 3 }}>
                        <Typography variant="caption" sx={{
                            px: 2,
                            fontWeight: 700,
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            display: 'block',
                            mb: 1
                        }}>
                            {section.title}
                        </Typography>
                        <List disablePadding>
                            {section.items.map((item) => (
                                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                        selected={pathname.startsWith(item.path)}
                                        onClick={() => router.push(item.path)}
                                        sx={{
                                            borderRadius: 3,
                                            transition: 'all 0.2s',
                                            '&.Mui-selected': {
                                                backgroundColor: 'primary.main',
                                                color: 'primary.contrastText',
                                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                                                '& .MuiListItemIcon-root': {
                                                    color: 'primary.contrastText',
                                                },
                                                '&:hover': {
                                                    backgroundColor: 'primary.dark',
                                                }
                                            },
                                            '&:hover': {
                                                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                                                transform: 'translateX(4px)'
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40, color: pathname.startsWith(item.path) ? 'inherit' : 'text.secondary' }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                variant: 'body2',
                                                fontWeight: pathname.startsWith(item.path) ? 700 : 500
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                ))}
            </Box>

            <Divider sx={{ opacity: 0.5 }} />
            <Box sx={{ p: 2 }}>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, color: 'error.main' }}>
                    <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: 'none',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
                        {filteredSections.flatMap(s => s.items).find(item => pathname?.startsWith(item.path))?.text || 'NentreOS Suite'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
                            {userEmail}
                        </Typography>
                        <Tooltip title="Account settings">
                            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {userEmail?.charAt(0).toUpperCase() || <PersonIcon />}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}
            >
                {children}
            </Box>
        </Box>
    );
}
