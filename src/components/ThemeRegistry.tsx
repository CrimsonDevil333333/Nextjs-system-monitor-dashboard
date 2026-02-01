"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline, useMediaQuery, GlobalStyles } from '@mui/material';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) {
      setMode(savedMode as 'light' | 'dark');
    } else {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#6200ea' : '#b388ff', // Deep Purple / Light Lavender
          },
          secondary: {
            main: mode === 'light' ? '#00bfa5' : '#64ffda', // Teal
          },
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
        shape: {
          borderRadius: 16,
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(26,26,26,0.8)',
                backdropFilter: 'blur(12px)',
                color: mode === 'light' ? '#2d3748' : '#e2e8f0',
                boxShadow: 'none',
                borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === 'light' ? '#ffffff' : '#111111',
                borderRight: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                boxShadow: mode === 'light' 
                  ? '0px 4px 20px rgba(0,0,0,0.05)' 
                  : '0px 4px 20px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'light'
                    ? '0px 12px 24px rgba(0,0,0,0.1)'
                    : '0px 12px 24px rgba(0,0,0,0.4)',
                },
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                margin: '8px 16px',
                '&.Mui-selected': {
                  backgroundColor: mode === 'light' ? 'rgba(98, 0, 234, 0.08)' : 'rgba(179, 136, 255, 0.12)',
                  color: mode === 'light' ? '#6200ea' : '#b388ff',
                  '& .MuiListItemIcon-root': {
                    color: mode === 'light' ? '#6200ea' : '#b388ff',
                  },
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>;

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          '::-webkit-scrollbar': { width: '8px', height: '8px' },
          '::-webkit-scrollbar-thumb': { backgroundColor: mode === 'light' ? '#cbd5e0' : '#4a5568', borderRadius: '4px' },
          '::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        }} />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
