"use client";

import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  subValue?: React.ReactNode;
  color?: string;
  children?: React.ReactNode;
}

export default function StatCard({ title, value, icon, subValue, color, children }: StatCardProps) {
  const theme = useTheme();
  const iconColor = color || theme.palette.primary.main;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={600} letterSpacing={1}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ my: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
              {value}
            </Typography>
            {subValue && (
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {subValue}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box 
              sx={{ 
                p: 1.5,
                borderRadius: 4, 
                bgcolor: `${iconColor}15`, 
                color: iconColor,
                display: 'flex',
                boxShadow: `0 4px 12px ${iconColor}20`
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        {children && <Box mt={2} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>{children}</Box>}
      </CardContent>
    </Card>
  );
}
