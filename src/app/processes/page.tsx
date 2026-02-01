"use client";

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, LinearProgress, TextField, InputAdornment, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Processes() {
  const [processes, setProcesses] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Kill State
  const [killPid, setKillPid] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchProcesses = async () => {
    try {
      const res = await fetch('/api/processes');
      const json = await res.json();
      setProcesses(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleKillRequest = (pid: number) => {
      setKillPid(pid);
      setConfirmOpen(true);
  };

  const executeKill = async () => {
      if (!killPid) return;
      try {
          await fetch(`/api/processes/${killPid}`, { method: 'DELETE' });
          fetchProcesses(); // Refresh immediately
          setConfirmOpen(false);
      } catch (e) {
          alert('Failed to kill process');
      }
  };

  const filteredList = processes?.list 
    ? processes.list
        .filter((p: any) => p.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a: any, b: any) => b.cpu - a.cpu) 
        .slice(0, 50) 
    : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Process Manager</Typography>
      
      {loading && !processes && <LinearProgress />}

      <Paper sx={{ mb: 2, p: 2 }}>
         <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
                <Typography variant="subtitle1">Total: {processes?.all || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                    Running: {processes?.running || 0} | Sleeping: {processes?.sleeping || 0}
                </Typography>
            </Box>
            <TextField 
                size="small" 
                placeholder="Search process..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />
         </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>PID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>User</TableCell>
              <TableCell align="right">CPU %</TableCell>
              <TableCell align="right">Mem %</TableCell>
              <TableCell>State</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredList.map((p: any) => (
              <TableRow key={p.pid}>
                <TableCell>{p.pid}</TableCell>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  {p.name}
                </TableCell>
                <TableCell>{p.user}</TableCell>
                <TableCell align="right">{p.cpu.toFixed(1)}</TableCell>
                <TableCell align="right">{p.mem.toFixed(1)}</TableCell>
                <TableCell>{p.state}</TableCell>
                <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleKillRequest(p.pid)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Kill Process?</DialogTitle>
          <DialogContent>
              <DialogContentText>
                  Are you sure you want to terminate process {killPid}? This action cannot be undone.
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={executeKill} color="error" variant="contained">Kill</Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
}
