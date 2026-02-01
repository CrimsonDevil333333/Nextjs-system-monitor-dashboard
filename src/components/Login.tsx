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
      setError('Login failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box 
                sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: 2
                }}
            >
                <LockIcon fontSize="large" />
            </Box>
            <Typography variant="h5" fontWeight="bold">System Access</Typography>
            <Typography variant="body2" color="text.secondary">Login with SSH credentials</Typography>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <TextField 
              fullWidth 
              label="Username" 
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <TextField 
              fullWidth 
              label="Password" 
              type="password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            
            <FormControlLabel
                control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
                label="Remember me"
            />
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}
