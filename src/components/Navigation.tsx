"use client";

import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Box, Drawer, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  useTheme, Avatar, CircularProgress 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import MemoryIcon from '@mui/icons-material/Memory';
import TerminalRoundedIcon from '@mui/icons-material/TerminalRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import NetworkCheckRoundedIcon from '@mui/icons-material/NetworkCheckRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InventoryIcon from '@mui/icons-material/Inventory';
import HandymanIcon from '@mui/icons-material/Handyman';
import ArticleIcon from '@mui/icons-material/Article';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useColorMode } from './ThemeRegistry';

const DRAWER_WIDTH = 260;

const MENU_ITEMS = [
  { text: 'Overview', icon: <DashboardRoundedIcon />, path: '/' },
  { text: 'Processes', icon: <AppsRoundedIcon />, path: '/processes' },
  { text: 'Docker', icon: <MemoryIcon />, path: '/docker' },
  { text: 'Terminal', icon: <TerminalRoundedIcon />, path: '/terminal' },
  { text: 'Cron', icon: <ScheduleIcon />, path: '/cron' },
  { text: 'Packages', icon: <InventoryIcon />, path: '/packages' },
  { text: 'Services', icon: <HandymanIcon />, path: '/services' },
  { text: 'Storage', icon: <StorageRoundedIcon />, path: '/storage' },
  { text: 'Network', icon: <NetworkCheckRoundedIcon />, path: '/network' },
  { text: 'Logs', icon: <ArticleIcon />, path: '/logs' },
  { text: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' },
  { text: 'Help', icon: <HelpRoundedIcon />, path: '/help' },
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const colorMode = useColorMode();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.username || null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setChecking(false);
    };
    checkAuth();
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/login');
      }
    } catch (e) {
      console.error('Logout failed');
    }
  };

  const currentItem = MENU_ITEMS.find(item => item.path === pathname);
  const pageTitle = currentItem ? currentItem.text : 'Dashboard';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar /> {/* TODO: need to add only on mobiles not on desktop.... */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        {checking ? (
          <CircularProgress size={40} />
        ) : (
          <>
            <Avatar 
              variant="rounded" 
              sx={{ 
                bgcolor: user ? 'success.main' : 'primary.main', 
                width: 40, height: 40,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {user ? user.charAt(0).toUpperCase() : 'G'}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {user || 'Guest'}
              </Typography>
              <Typography variant="caption" color={user ? 'success.main' : 'text.secondary'}>
                {user ? 'Logged In' : 'Not Logged In'}
              </Typography>
            </Box>
          </>
        )}
      </Box>
      <List sx={{ flexGrow: 1, px: 1 }}>
        {MENU_ITEMS.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              href={item.path} 
              selected={pathname === item.path} 
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { bgcolor: 'primary.dark' }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ px: 1, pb: 2 }}>
        {user ? (
          <ListItemButton 
            onClick={handleLogout}
            sx={{ borderRadius: 2, color: 'error.main' }}
          >
            <ListItemIcon><LogoutRoundedIcon color="error" /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        ) : (
          <ListItemButton 
            component={Link}
            href="/login"
            sx={{ borderRadius: 2, color: 'primary.main' }}
          >
            <ListItemIcon><LoginRoundedIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Login" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" display="block" align="center">
          System Monitor
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 'bold' }}>
            {pageTitle}
          </Typography>
          <IconButton onClick={colorMode.toggleColorMode} sx={{ color: 'text.primary' }}>
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none', bgcolor: 'background.paper' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }
        }}
      >
        <Toolbar /> 
        {children}
      </Box>
    </Box>
  );
}
