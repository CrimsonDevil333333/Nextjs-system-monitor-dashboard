"use client";

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, 
  Divider, Stack, Alert, Card, CardContent, Grid, Select, MenuItem
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SecurityIcon from '@mui/icons-material/Security';
import ComputerIcon from '@mui/icons-material/Computer';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'System Monitor',
    pollInterval: 10000,
    historyRange: '24h'
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem('sys_settings');
    if (local) setSettings(JSON.parse(local));
  }, []);

  const handleSave = () => {
    localStorage.setItem('sys_settings', JSON.stringify(settings));
    // Trigger event to update other components if needed
    window.dispatchEvent(new Event('settings_updated'));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box maxWidth="1200px" mx="auto">
      <Typography variant="h4" fontWeight="bold" mb={3}>Settings</Typography>
      
      {saved && <Alert severity="success" sx={{ mb: 3 }}>Settings saved successfully!</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {/* General Settings */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}><ComputerIcon sx={{ mr: 1, color: 'primary.main' }} /><Typography variant="h6" fontWeight="bold">General Preferences</Typography></Box>
                <Stack spacing={2}>
                  <TextField fullWidth label="Site Name" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} />
                  <TextField fullWidth type="number" label="Dashboard Polling Interval (ms)" value={settings.pollInterval} onChange={(e) => setSettings({...settings, pollInterval: parseInt(e.target.value) || 10000})} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Default History Range</Typography>
                    <Select fullWidth size="small" value={settings.historyRange} onChange={(e) => setSettings({...settings, historyRange: e.target.value})}>
                      <MenuItem value="1h">1 Hour</MenuItem>
                      <MenuItem value="6h">6 Hours</MenuItem>
                      <MenuItem value="24h">24 Hours</MenuItem>
                      <MenuItem value="7d">7 Days</MenuItem>
                    </Select>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="subtitle2" gutterBottom>Actions</Typography>
            <Button fullWidth variant="contained" startIcon={<SaveIcon />} onClick={handleSave} size="large">Save Changes</Button>
            <Button fullWidth variant="outlined" sx={{ mt: 1 }} color="error" onClick={() => localStorage.removeItem('sys_settings')}>Reset Defaults</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
