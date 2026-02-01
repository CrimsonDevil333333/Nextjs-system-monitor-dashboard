"use client";

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, Switch, FormControlLabel, 
  TextField, Button, Divider, Alert, Snackbar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useColorMode } from '@/components/ThemeRegistry';
import { useTheme } from '@mui/material/styles';

export default function SettingsPage() {
  const colorMode = useColorMode();
  const theme = useTheme();
  
  const [savedUser, setSavedUser] = useState('');
  const [refreshRate, setRefreshRate] = useState(2000);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Load from local storage
    const user = localStorage.getItem('default_user') || '';
    const rate = localStorage.getItem('refresh_rate') || '2000';
    setSavedUser(user);
    setRefreshRate(parseInt(rate));
  }, []);

  const handleSave = () => {
    localStorage.setItem('default_user', savedUser);
    localStorage.setItem('refresh_rate', refreshRate.toString());
    setMsg('Settings saved!');
  };

  return (
    <Box maxWidth="md">
      <Typography variant="h4" gutterBottom fontWeight="bold">Settings</Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Appearance</Typography>
              <FormControlLabel
                control={<Switch checked={theme.palette.mode === 'dark'} onChange={colorMode.toggleColorMode} />}
                label="Dark Mode"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Preferences</Typography>
              <Box display="flex" flexDirection="column" gap={3}>
                 <TextField
                    label="Default Username (Auto-fill)"
                    helperText="Saved in your browser storage only."
                    value={savedUser}
                    onChange={(e) => setSavedUser(e.target.value)}
                    fullWidth
                 />
                 <TextField
                    label="Polling Interval (ms)"
                    type="number"
                    value={refreshRate}
                    onChange={(e) => setRefreshRate(parseInt(e.target.value))}
                    fullWidth
                 />
                 <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />} 
                    onClick={handleSave}
                    sx={{ alignSelf: 'flex-start' }}
                 >
                    Save Preferences
                 </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!msg}
        autoHideDuration={3000}
        onClose={() => setMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled">{msg}</Alert>
      </Snackbar>
    </Box>
  );
}
