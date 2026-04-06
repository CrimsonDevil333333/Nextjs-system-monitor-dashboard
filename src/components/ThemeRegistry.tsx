"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline, GlobalStyles, Box } from '@mui/material';

const ColorModeContext = createContext({ 
  toggleColorMode: () => {},
  mode: 'dark' as 'light' | 'dark'
});

export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('themeMode');
    if (saved === 'light' || saved === 'dark') {
      setMode(saved);
    }
    setMounted(true);
  }, []);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', next);
          return next;
        });
      },
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'light' ? '#6200ea' : '#b388ff' },
          secondary: { main: mode === 'light' ? '#00bfa5' : '#64ffda' },
          background: {
            default: mode === 'light' ? '#f4f6f8' : '#0a0a0a',
            paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
          },
          text: {
            primary: mode === 'light' ? '#2d3748' : '#e2e8f0',
            secondary: mode === 'light' ? '#718096' : '#a0aec0',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 700, letterSpacing: '-0.5px' },
          h6: { fontWeight: 600, letterSpacing: '0.1px' },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiAppBar: { 
            styleOverrides: { 
              root: { 
                backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(26,26,26,0.8)', 
                backdropFilter: 'blur(12px)', 
                boxShadow: 'none', 
                borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` 
              } 
            } 
          },
          MuiCard: { 
            styleOverrides: { 
              root: { 
                backgroundImage: 'none', 
                borderRadius: 16,
                boxShadow: mode === 'light' ? '0px 4px 20px rgba(0,0,0,0.05)' : '0px 4px 20px rgba(0,0,0,0.2)' 
              } 
            } 
          },
          MuiListItemButton: { 
            styleOverrides: { 
              root: { 
                borderRadius: 8, 
                margin: '4px 8px', 
                '&.Mui-selected': { 
                  backgroundColor: mode === 'light' ? 'rgba(98, 0, 234, 0.08)' : 'rgba(179, 136, 255, 0.12)', 
                  color: mode === 'light' ? '#6200ea' : '#b388ff', 
                  '& .MuiListItemIcon-root': { color: mode === 'light' ? '#6200ea' : '#b388ff' } 
                } 
              } 
            } 
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          '::-webkit-scrollbar': { width: '8px', height: '8px' },
          '::-webkit-scrollbar-thumb': { backgroundColor: mode === 'light' ? '#cbd5e0' : '#4a5568', borderRadius: '4px' },
          '::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          'body': { overflowX: 'hidden' }
        }} />
        <Box sx={{ 
          opacity: mounted ? 1 : 0, 
          transition: 'opacity 0.3s ease-in-out',
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          {children}
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
