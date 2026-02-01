"use client";

import { useRouter } from 'next/navigation';
import Login from '@/components/Login';
import { Box, Typography } from '@mui/material';

export default function LoginPage() {
  const router = useRouter();

  return (
    <Box 
        sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            bgcolor: 'background.default' 
        }}
    >
        <Login onLogin={() => router.push('/')} />
    </Box>
  );
}
