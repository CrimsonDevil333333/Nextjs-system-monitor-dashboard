"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack,
  Tooltip, CircularProgress, Alert
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

export default function CronPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog State
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState('* * * * *');
  const [command, setCommand] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobs(data.jobs || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSave = async () => {
    try {
      const payload = {
        action: editId !== null ? 'edit' : 'add',
        id: editId,
        schedule,
        command
      };

      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      
      setOpen(false);
      fetchJobs();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this cron job?')) return;
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      fetchJobs();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openEdit = (job: any) => {
    setEditId(job.id);
    setSchedule(job.schedule);
    setCommand(job.command);
    setOpen(true);
  };

  const openAdd = () => {
    setEditId(null);
    setSchedule('* * * * *');
    setCommand('');
    setOpen(true);
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <AccessTimeIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h4" fontWeight="bold">Cron Job Manager</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          New Job
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '150px' }}>Schedule</TableCell>
              <TableCell>Command</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 5 }}>No cron jobs found for current user.</TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{job.schedule}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{job.command}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton color="primary" size="small" onClick={() => openEdit(job)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small" onClick={() => handleDelete(job.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId !== null ? 'Edit Cron Job' : 'Add Cron Job'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} mt={1}>
            <TextField 
              label="Schedule (Cron Expression)" 
              value={schedule} 
              onChange={(e) => setSchedule(e.target.value)} 
              helperText="Format: * * * * * (min hour day month day-of-week)"
              fullWidth 
              sx={{ fontFamily: 'monospace' }}
            />
            <TextField 
              label="Command to Execute" 
              value={command} 
              onChange={(e) => setCommand(e.target.value)} 
              fullWidth 
              multiline
              rows={3}
              sx={{ fontFamily: 'monospace' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!schedule || !command}>
            Save Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
