"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, Tooltip, CircularProgress, Alert, Chip, Stack, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import TerminalIcon from '@mui/icons-material/Terminal';
import CloseIcon from '@mui/icons-material/Close';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  // Log Modal State
  const [logOpen, setLogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<{id: string, name: string} | null>(null);
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchServices = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Filter out "not-found" or incomplete service entries
      const validServices = (data.services || []).filter((s: any) => 
        s.load !== 'not-found' && s.id.includes('.service')
      );
      setServices(validServices);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAction = async (serviceId: string, action: string) => {
    setActionId(`${serviceId}-${action}`);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, serviceId })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setTimeout(fetchServices, 1000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionId(null);
    }
  };

  const handleOpenLogs = async (id: string, name: string) => {
    setSelectedService({ id, name });
    setLogOpen(true);
    setLogsLoading(true);
    setLogs('');
    try {
      const res = await fetch(`/api/services/${id}/logs`);
      const json = await res.json();
      setLogs(json.logs || 'No logs found.');
    } catch (e) {
      setLogs('Failed to fetch logs.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (logOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, logOpen]);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <SettingsSuggestIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h4" fontWeight="bold">System Services</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField 
            size="small" 
            placeholder="Search services..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
          <Tooltip title="Refresh">
            <Button 
              variant="outlined" 
              onClick={fetchServices} 
              disabled={refreshing}
              sx={{ minWidth: { xs: '40px', sm: 'auto' }, p: { xs: 1, sm: '6px 16px' } }}
            >
              <RefreshIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Refresh</Box>
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 'calc(100vh - 200px)', overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Service Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>Load</TableCell>
              <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', lg: 'table-cell' } }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}>No services found.</TableCell></TableRow>
            ) : (
              filteredServices.map((svc) => (
                <TableRow key={svc.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{svc.name}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        label={svc.active} 
                        size="small" 
                        color={svc.active === 'active' ? 'success' : svc.active === 'inactive' ? 'default' : 'error'} 
                        variant="filled"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>{svc.load}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, display: { xs: 'none', lg: 'table-cell' } }}>
                    <Typography variant="body2" noWrap sx={{ opacity: 0.8 }}>{svc.description}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Logs">
                        <IconButton size="small" onClick={() => handleOpenLogs(svc.id, svc.name)} color="primary">
                          <TerminalIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {svc.active === 'active' ? (
                        <Tooltip title="Stop">
                          <IconButton color="error" size="small" onClick={() => handleAction(svc.id, 'stop')} disabled={!!actionId}>
                            {actionId === `${svc.id}-stop` ? <CircularProgress size={18} /> : <StopIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Start">
                          <IconButton color="success" size="small" onClick={() => handleAction(svc.id, 'start')} disabled={!!actionId}>
                            {actionId === `${svc.id}-start` ? <CircularProgress size={18} /> : <PlayArrowIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Restart">
                        <IconButton color="warning" size="small" onClick={() => handleAction(svc.id, 'restart')} disabled={!!actionId}>
                          {actionId === `${svc.id}-restart` ? <CircularProgress size={18} /> : <RestartAltIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Log Dialog */}
      <Dialog 
        open={logOpen} 
        onClose={() => setLogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { height: '80vh', display: 'flex', flexDirection: 'column' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center">
            <TerminalIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Logs: {selectedService?.name}</Typography>
          </Box>
          <IconButton onClick={() => setLogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#1e1e1e', color: '#f0f0f0', flexGrow: 1, overflow: 'auto' }}>
          {logsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress /></Box>
          ) : (
            <Box component="pre" sx={{ p: 2, m: 0, fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {logs}
              <div ref={logsEndRef} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setLogOpen(false)} variant="outlined">Close</Button>
          <Button onClick={() => selectedService && handleOpenLogs(selectedService.id, selectedService.name)} variant="contained" startIcon={<RefreshIcon />}>Refresh</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
