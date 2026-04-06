"use client";

import { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Checkbox, FormControlLabel, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
        body: JSON.stringify({ username, password, remember }),
        credentials: 'include', // Ensure cookies are included
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        setSuccess(true);
        localStorage.setItem('default_user', username);
        setError('');
        // Wait for cookie to be processed by browser, then redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        setError(json.error || 'Authentication failed');
      }
    } catch (e: any) {
      setError('Login service unavailable. Check server status.');
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
                    bgcolor: success ? 'success.main' : 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: success ? '0 4px 20px rgba(34, 197, 94, 0.4)' : '0 4px 20px rgba(25, 118, 210, 0.4)',
                    transform: 'rotate(-5deg)',
                    transition: 'all 0.3s ease'
                }}
            >
                {success ? (
                    <CircularProgress size={28} color="inherit" />
                ) : (
                    <LockIcon sx={{ fontSize: 32 }} />
                )}
            </Box>
            <Typography variant="h4" fontWeight="800" letterSpacing="-0.5px">Welcome</Typography>
            <Typography variant="body2" color="text.secondary">Secure access to System Monitor</Typography>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <TextField 
              fullWidth 
              label="Username" 
              placeholder="e.g. admin, root, your username"
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
            
            {success && (
                <Alert 
                    severity="success" 
                    sx={{ mt: 2, borderRadius: 2, fontSize: '0.95rem', fontWeight: 'bold' }}
                >
                    ✓ Login successful — redirecting...
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
              {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={18} color="inherit" />
                      <span>Authenticating...</span>
                  </Box>
              ) : 'Unlock Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}
