"use client";

import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemIcon, ListItemText, Link } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LoginIcon from '@mui/icons-material/Login';
import InventoryIcon from '@mui/icons-material/Inventory';
import TerminalIcon from '@mui/icons-material/Terminal';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';

export default function HelpPage() {
  return (
    <Box maxWidth="md" sx={{ mx: 'auto' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Help & Documentation</Typography>
        
        <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Quick Start</Typography>
            <List dense>
                <ListItem>
                    <ListItemIcon><LoginIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Login" secondary="Use your Linux system username and password" />
                </ListItem>
                <ListItem>
                    <ListItemIcon><InventoryIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Docker" secondary="Monitor containers, view logs, start/stop" />
                </ListItem>
                <ListItem>
                    <ListItemIcon><TerminalIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Terminal" secondary="Execute commands directly from the browser" />
                </ListItem>
            </List>
        </Paper>

        <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Frequently Asked Questions</Typography>
            
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">How does authentication work?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    The dashboard authenticates against your Linux system's user database (/etc/shadow). 
                    Enter your system username and password to login. Make sure the user account exists and is enabled.
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Docker logs not showing?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    Ensure the user running the dashboard has permission to access Docker. Try:
                    <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, overflow: 'auto' }}>
sudo usermod -aG docker $USER
                    </Box>
                    Then logout and login again for group changes to take effect.
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Temperature not showing?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    Temperature monitoring requires privileged access. In Docker, use:
                    <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, overflow: 'auto' }}>
privileged: true
                    </Box>
                    Or mount thermal zones:
                    <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, overflow: 'auto' }}>
- /sys/class/thermal:/sys/class/thermal:ro
                    </Box>
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">How to run in production?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box component="pre" sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, overflow: 'auto', fontSize: '0.85rem' }}>
# Build the app
npm run build

# Run with proper security
PORT=3000 JWT_SECRET=$(openssl rand -hex 32) node .next/standalone/server.js
                    </Box>
                    Always set a strong JWT_SECRET in production!
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Process kill not working?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    You can only kill processes owned by your user. To kill system processes, 
                    the dashboard must run as root (not recommended for security reasons).
                </AccordionDetails>
            </Accordion>
        </Paper>

        <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Security Notes</Typography>
            <List dense>
                <ListItem>
                    <ListItemIcon><SecurityIcon color="warning" /></ListItemIcon>
                    <ListItemText primary="JWT_SECRET" secondary="Set this in production environment" />
                </ListItem>
                <ListItem>
                    <ListItemIcon><SecurityIcon color="warning" /></ListItemIcon>
                    <ListItemText primary="HTTPS" secondary="Use reverse proxy (nginx, caddy) for SSL" />
                </ListItem>
                <ListItem>
                    <ListItemIcon><SecurityIcon color="warning" /></ListItemIcon>
                    <ListItemText primary="Rate Limiting" secondary="Terminal commands limited to 12/min" />
                </ListItem>
            </List>
        </Paper>

        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Environment Variables</Typography>
            <Box component="pre" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, overflow: 'auto', fontSize: '0.85rem' }}>
PORT=3000                    # Server port
JWT_SECRET=your-secret-here  # REQUIRED in production
DEV_AUTH=admin:password      # Dev mode fallback
CHECKPW_PATH=./checkpw       # Password verifier
DEFAULT_HOME=/home/user      # Terminal default dir
NEXT_PUBLIC_DEFAULT_USER=user # Terminal username
NEXT_PUBLIC_DEFAULT_HOST=host # Terminal hostname
DB_PATH=./data/metrics.db   # SQLite database
            </Box>
        </Paper>
    </Box>
  );
}
