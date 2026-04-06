"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Button, Chip, Select, MenuItem, FormControl, InputLabel, CircularProgress, IconButton, Tooltip } from '@mui/material';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';

export default function LogsPage() {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('syslog');
  const [lines, setLines] = useState(100);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?type=${type}&lines=${lines}`);
      const data = await res.json();
      if (res.ok) setLogs(data.logs || 'No logs found.');
      else setLogs(`Error: ${data.error}`);
    } catch (e: any) {
      setLogs(`Failed to fetch logs: ${e.message}`);
    }
    setLoading(false);
  }, [type, lines]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([logs], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${type}_logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <ArticleRoundedIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h4" fontWeight="bold">System Logs</Typography>
          <Chip label="Live" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <FormControl size="small">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <MenuItem value="syslog">Journalctl (Syslog)</MenuItem>
              <MenuItem value="dmesg">Kernel (dmesg)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select value={lines} onChange={(e) => setLines(Number(e.target.value))}>
              <MenuItem value={50}>50 Lines</MenuItem>
              <MenuItem value={100}>100 Lines</MenuItem>
              <MenuItem value={500}>500 Lines</MenuItem>
              <MenuItem value={1000}>1000 Lines</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLogs} disabled={loading} color="primary">
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
          <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={handleDownload}>
            Export
          </Button>
        </Box>
      </Box>

      <Paper 
        sx={{ 
          bgcolor: 'background.default', 
          height: '70vh', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative'
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          <Typography variant="caption" sx={{ opacity: 0.7, fontFamily: 'monospace', fontWeight: 'bold' }}>
            /var/log/{type === 'syslog' ? 'journal' : 'dmesg'}
          </Typography>
          <Tooltip title="Clear Display"><IconButton size="small" onClick={() => setLogs('')}><DeleteSweepRoundedIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
        <Box 
          ref={scrollRef}
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            p: 2, 
            fontFamily: 'monospace', 
            fontSize: '0.85rem', 
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {loading && !logs ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            logs
          )}
        </Box>
      </Paper>
    </Box>
  );
}
