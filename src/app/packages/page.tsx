"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, TextField, Stack, Tooltip, CircularProgress, Alert, Chip, Tabs, Tab
} from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpgradeIcon from '@mui/icons-material/Upgrade';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upgradable');
  
  const [actionOutput, setActionOutput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPackages = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/packages?type=${type}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPackages(data.packages || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages(tab);
  }, [fetchPackages, tab]);

  const handleAction = async (action: string, name?: string) => {
    const confirmMsg = action === 'upgrade-all' ? 'Upgrade all packages?' : `${action} package ${name}?`;
    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    setActionOutput(`Running apt-get ${action} ${name || ''}...\nThis may take a while.\n`);
    
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionOutput(prev => prev + '\n' + (data.output || 'Done.'));
      
      // Refresh list
      fetchPackages(tab);
    } catch (e: any) {
      setActionOutput(prev => prev + '\nError: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshCache = async () => {
    setActionLoading(true);
    setActionOutput('Running apt-get update...\n');
    try {
      const res = await fetch('/api/packages?type=updates');
      if (!res.ok) throw new Error('Failed to update cache');
      setActionOutput(prev => prev + '\nCache updated successfully.');
      fetchPackages(tab);
    } catch (e: any) {
      setActionOutput(prev => prev + '\nError: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPackages = packages.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <SystemUpdateAltIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h4" fontWeight="bold">APT Package Manager</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button 
            variant="outlined" 
            onClick={handleRefreshCache} 
            disabled={actionLoading}
            sx={{ minWidth: { xs: '40px', sm: 'auto' }, p: { xs: 1, sm: '6px 16px' } }}
          >
            <RefreshIcon sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Update Cache</Box>
          </Button>
          {tab === 'upgradable' && packages.length > 0 && (
            <Button 
              variant="contained" 
              color="warning" 
              onClick={() => handleAction('upgrade-all')} 
              disabled={actionLoading}
              sx={{ minWidth: { xs: '40px', sm: 'auto' }, p: { xs: 1, sm: '6px 16px' } }}
            >
              <UpgradeIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Upgrade All</Box>
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        {/* Left Side: Package List */}
        <Box flex={1}>
          <Paper sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Upgradable" value="upgradable" />
              <Tab label="Installed" value="installed" />
            </Tabs>
            <Box p={2}>
              <TextField 
                size="small" 
                placeholder="Search packages..." 
                fullWidth 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
          </Paper>

          <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: '600px' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Package</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Version</TableCell>
                  {tab === 'installed' && <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>}
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                ) : filteredPackages.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}>No packages found.</TableCell></TableRow>
                ) : (
                  filteredPackages.map((pkg, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{pkg.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        <Chip label={pkg.version} size="small" variant="outlined" />
                      </TableCell>
                      {tab === 'installed' && (
                        <TableCell>
                          <Chip 
                            label={pkg.status === 'install ok installed' ? 'Installed' : pkg.status} 
                            size="small" 
                            color={pkg.status === 'install ok installed' ? 'success' : 'default'} 
                          />
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {tab === 'upgradable' ? (
                          <Tooltip title="Upgrade">
                            <IconButton color="warning" size="small" onClick={() => handleAction('install', pkg.name)} disabled={actionLoading}>
                              <UpgradeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Remove">
                            <IconButton color="error" size="small" onClick={() => handleAction('remove', pkg.name)} disabled={actionLoading}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Right Side: Terminal Output */}
        <Box width={{ xs: '100%', md: '400px' }} flexShrink={0}>
          <Paper sx={{ p: 2, height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', bgcolor: '#1e1e1e', color: '#d4d4d4' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', color: '#4ade80' }}>APT Terminal Output</Typography>
              {actionLoading && <CircularProgress size={16} sx={{ color: '#4ade80' }} />}
            </Box>
            <Box 
              sx={{ 
                flexGrow: 1, 
                fontFamily: 'monospace', 
                fontSize: '0.8rem', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                overflowY: 'auto' 
              }}
            >
              {actionOutput || 'Waiting for commands...'}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
