"use client";

import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function HelpPage() {
  return (
    <Box maxWidth="md">
        <Typography variant="h4" gutterBottom>Help & Support</Typography>
        
        <Paper sx={{ p: 2 }}>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">How to login?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    Use your Raspberry Pi's SSH username and password. This authenticates directly against the system.
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">Docker logs not showing?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    Ensure the user running the dashboard has permission to access `/var/run/docker.sock`. Try running `sudo usermod -aG docker $USER`.
                </AccordionDetails>
            </Accordion>
        </Paper>
    </Box>
  );
}
