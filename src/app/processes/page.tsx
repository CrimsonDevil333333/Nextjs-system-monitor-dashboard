"use client";

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, LinearProgress, TextField, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function Processes() {
  const [processes, setProcesses] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

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
    const interval = setInterval(fetchProcesses, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const filteredList = processes?.list 
    ? processes.list
        .filter((p: any) => p.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a: any, b: any) => b.cpu - a.cpu) // Sort by CPU desc
        .slice(0, 50) // Top 50
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
              </TableRow>
            ))}
            {filteredList.length === 0 && !loading && (
                <TableRow>
                    <TableCell colSpan={6} align="center">No processes found</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
