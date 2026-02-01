"use client";

import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Box, Chip, IconButton, Collapse, TextField, InputAdornment, TableSortLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress
} from '@mui/material';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import TerminalIcon from '@mui/icons-material/Terminal';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useMemo, useEffect, useRef } from 'react';

function Row({ container, onShowLogs }: { container: any, onShowLogs: (id: string, name: string) => void }) {
  const [open, setOpen] = useState(false);
  
  // Deduplicate ports
  const uniquePorts = Array.from(new Set(container.ports.map((p: any) => 
    p.PublicPort ? `${p.PublicPort} -> ${p.PrivatePort}` : `${p.PrivatePort}`
  )));

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
          {container.name}
        </TableCell>
        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{container.image}</TableCell>
        <TableCell>
          <Chip 
            label={container.state.toUpperCase()} 
            color={container.state === 'running' ? 'success' : 'default'} 
            size="small"
            sx={{ fontWeight: 600, fontSize: '0.7rem', mr: 1 }}
          />
        </TableCell>
        <TableCell align="right">
            {container.stats?.cpu !== undefined ? `${container.stats.cpu.toFixed(1)}%` : '-'}
        </TableCell>
        <TableCell align="right">
            {container.stats?.mem !== undefined ? `${(container.stats.mem / 1024 / 1024).toFixed(0)} MB` : '-'}
        </TableCell>
        <TableCell align="right">
             <IconButton size="small" onClick={() => onShowLogs(container.id, container.name)} title="View Logs" color="primary">
                <TerminalIcon fontSize="small" />
             </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div">
                Details
              </Typography>
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
                 <Box>
                    <Typography variant="caption" color="text.secondary">ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{container.id.substring(0, 12)}</Typography>
                 </Box>
                 <Box>
                    <Typography variant="caption" color="text.secondary">Command</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{container.command}</Typography>
                 </Box>
                 <Box>
                    <Typography variant="caption" color="text.secondary">Ports</Typography>
                    {uniquePorts.map((p: any, i: number) => (
                        <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace' }}>
                           {p}
                        </Typography>
                    ))}
                 </Box>
                 {container.stats && (
                     <Box>
                        <Typography variant="caption" color="text.secondary">I/O Stats</Typography>
                        <Typography variant="body2">
                            Net RX: {((container.stats.netIO?.rx || 0) / 1024 / 1024).toFixed(1)} MB <br/>
                            Net TX: {((container.stats.netIO?.tx || 0) / 1024 / 1024).toFixed(1)} MB <br/>
                            Block R: {((container.stats.blockIO?.r || 0) / 1024 / 1024).toFixed(1)} MB <br/>
                            Block W: {((container.stats.blockIO?.w || 0) / 1024 / 1024).toFixed(1)} MB
                        </Typography>
                     </Box>
                 )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

type Order = 'asc' | 'desc';
type OrderBy = 'name' | 'cpu' | 'mem';

export default function DockerTable({ containers }: { containers: any[] }) {
  const [filter, setFilter] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('cpu');
  
  // Log Modal State
  const [logOpen, setLogOpen] = useState(false);
  const [logContainer, setLogContainer] = useState<{id: string, name: string} | null>(null);
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleOpenLogs = async (id: string, name: string) => {
      setLogContainer({ id, name });
      setLogOpen(true);
      setLogsLoading(true);
      setLogs('');
      try {
          const res = await fetch(`/api/docker/${id}/logs`);
          const json = await res.json();
          setLogs(json.logs || 'No logs found.');
      } catch (e) {
          setLogs('Failed to fetch logs.');
      } finally {
          setLogsLoading(false);
      }
  };

  const handleCloseLogs = () => {
      setLogOpen(false);
      setLogContainer(null);
  };

  useEffect(() => {
    if (logOpen && logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, logOpen]);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filtered = useMemo(() => {
    let result = containers;
    if (filter) {
        result = result.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    }
    return result.sort((a, b) => {
        let aValue, bValue;
        if (orderBy === 'cpu') {
            aValue = a.stats?.cpu || 0;
            bValue = b.stats?.cpu || 0;
        } else if (orderBy === 'mem') {
            aValue = a.stats?.mem || 0;
            bValue = b.stats?.mem || 0;
        } else {
            aValue = a.name;
            bValue = b.name;
        }

        if (bValue < aValue) return order === 'asc' ? 1 : -1;
        if (bValue > aValue) return order === 'asc' ? -1 : 1;
        return 0;
    });
  }, [containers, filter, order, orderBy]);

  if (!containers || containers.length === 0) {
    return (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <ExtensionRoundedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography>No Docker containers found.</Typography>
        </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box p={2} display="flex" alignItems="center" bgcolor="background.default" borderBottom={1} borderColor="divider" flexWrap="wrap" gap={2}>
         <Box display="flex" alignItems="center" mr="auto">
            <ExtensionRoundedIcon sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6" fontWeight="bold">Docker Containers</Typography>
            <Chip label={containers.length} size="small" sx={{ ml: 2 }} />
         </Box>
         <TextField 
            size="small" 
            placeholder="Search..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                sx: { borderRadius: 2, bgcolor: 'background.paper' }
            }}
         />
      </Box>
      <Table aria-label="collapsible table" size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default' }}>
            <TableCell />
            <TableCell>
                <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleRequestSort('name')}>
                    Name
                </TableSortLabel>
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Image</TableCell>
            <TableCell>State</TableCell>
            <TableCell align="right">
                <TableSortLabel active={orderBy === 'cpu'} direction={orderBy === 'cpu' ? order : 'asc'} onClick={() => handleRequestSort('cpu')}>
                    CPU
                </TableSortLabel>
            </TableCell>
            <TableCell align="right">
                <TableSortLabel active={orderBy === 'mem'} direction={orderBy === 'mem' ? order : 'asc'} onClick={() => handleRequestSort('mem')}>
                    Mem
                </TableSortLabel>
            </TableCell>
            <TableCell align="right">Logs</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((container) => (
            <Row key={container.id} container={container} onShowLogs={handleOpenLogs} />
          ))}
        </TableBody>
      </Table>

      {/* Log Dialog */}
      <Dialog 
        open={logOpen} 
        onClose={handleCloseLogs} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
            sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Box display="flex" alignItems="center">
                <TerminalIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Logs: {logContainer?.name}</Typography>
            </Box>
            <IconButton onClick={handleCloseLogs}>
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#1e1e1e', color: '#f0f0f0', flexGrow: 1, overflow: 'auto' }}>
            {logsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                </Box>
            ) : (
                <Box 
                    component="pre" 
                    sx={{ 
                        p: 2, 
                        m: 0, 
                        fontFamily: 'monospace', 
                        fontSize: '0.85rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                    }}
                >
                    {logs}
                    <div ref={logsEndRef} />
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
            <Button onClick={handleCloseLogs} variant="outlined">Close</Button>
            <Button onClick={() => logContainer && handleOpenLogs(logContainer.id, logContainer.name)} variant="contained" startIcon={<TerminalIcon />}>
                Refresh
            </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
}
