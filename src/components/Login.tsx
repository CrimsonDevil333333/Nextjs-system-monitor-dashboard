"use client";

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Checkbox, FormControlLabel } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      const defaultUser = localStorage.getItem('default_user');
      if (defaultUser) setUsername(defaultUser);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        setError('Please enter both username and password');
        return;
    }
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, remember })
      });
      
      if (res.ok) {
        onLogin();
      } else {
        const json = await res.json();
        setError(json.error || 'Invalid credentials');
      }
    } catch (e) {
      setError('Login service unavailable');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card 
        sx={{ 
            maxWidth: 420, 
            width: '90%', 
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(10px)',
            background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.8)' 
                : 'rgba(255, 255, 255, 0.8)'
        }}
    >
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
            <Box 
                sx={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '20px', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
                    transform: 'rotate(-5deg)'
                }}
            >
                <LockIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h4" fontWeight="800" letterSpacing="-0.5px">Welcome</Typography>
            <Typography variant="body2" color="text.secondary">Secure access to Pi5 Monitor</Typography>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <TextField 
              fullWidth 
              label="Username" 
              placeholder="e.g. pi"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <TextField 
              fullWidth 
              label="Password" 
              type="password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <FormControlLabel
                    control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">Remember me</Typography>}
                />
            </Box>
            
            {error && (
                <Alert 
                    severity="error" 
                    variant="filled"
                    sx={{ mt: 2, borderRadius: 2, fontSize: '0.875rem' }}
                >
                    {error}
                </Alert>
            )}
            
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              size="large"
              sx={{ 
                  mt: 4, 
                  py: 1.5,
                  borderRadius: 3, 
                  textTransform: 'none', 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Unlock Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}
