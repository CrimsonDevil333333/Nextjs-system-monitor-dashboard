"use client";

import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Box, Drawer, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  useTheme, Avatar 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import TerminalRoundedIcon from '@mui/icons-material/TerminalRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import NetworkCheckRoundedIcon from '@mui/icons-material/NetworkCheckRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useColorMode } from './ThemeRegistry';

const DRAWER_WIDTH = 260;

export default function Navigation({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const colorMode = useColorMode();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar /> {/* Spacer to clear fixed AppBar */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          variant="rounded" 
          sx={{ 
            bgcolor: 'primary.main', 
            width: 40, height: 40,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          Pi
        </Avatar>
        <Typography variant="h6" fontWeight="bold">
          SysAdmin
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1, px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/" selected={pathname === '/'} onClick={() => setMobileOpen(false)}>
            <ListItemIcon><DashboardRoundedIcon /></ListItemIcon>
            <ListItemText primary="Overview" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/processes" selected={pathname === '/processes'} onClick={() => setMobileOpen(false)}>
            <ListItemIcon><AppsRoundedIcon /></ListItemIcon>
            <ListItemText primary="Processes" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="#" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><TerminalRoundedIcon /></ListItemIcon>
            <ListItemText primary="Terminal (Soon)" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="#" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><StorageRoundedIcon /></ListItemIcon>
            <ListItemText primary="Storage Manager" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="#" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><NetworkCheckRoundedIcon /></ListItemIcon>
            <ListItemText primary="Network Tools" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="#" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><SettingsRoundedIcon /></ListItemIcon>
            <ListItemText primary="Settings" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="#" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><HelpRoundedIcon /></ListItemIcon>
            <ListItemText primary="Help & Support" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" display="block" align="center">
          v1.2.0 • Caretaker
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
          zIndex: (theme) => theme.zIndex.drawer + 1 
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            {pathname === '/' ? 'Dashboard' : 'Processes'}
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
