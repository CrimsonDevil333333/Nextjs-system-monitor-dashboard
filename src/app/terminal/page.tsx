"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, TextField, Button, Chip, Stack, IconButton, Tooltip, useTheme } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const QUICK_CMDS = [
  { label: '📊 Top', cmd: 'top -b -n 1 | head -20' },
  { label: '💾 Free', cmd: 'free -h' },
  { label: '📁 Disk', cmd: 'df -h' },
  { label: '🐳 ps', cmd: 'docker ps --format "table {{.Names}}\\t{{.Status}}"' },
  { label: '📦 Imgs', cmd: 'docker images --format "table {{.Repository}}\\t{{.Size}}"' },
  { label: '🔧 Sys', cmd: 'sysctl -a | grep vm.swappiness && uptime' },
  { label: '🌐 Net', cmd: 'ip -br a' },
  { label: '🖥️ Host', cmd: 'hostname -I && hostname && cat /etc/os-release | grep PRETTY_NAME' },
];

const DEFAULT_USER = process.env.NEXT_PUBLIC_DEFAULT_USER || 'user';
const DEFAULT_HOST = process.env.NEXT_PUBLIC_DEFAULT_HOST || 'linux';

export default function TerminalPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<{ cmd: string; stdout: string; stderr: string; time: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [cwd, setCwd] = useState('~');
  const [quickOpen, setQuickOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cmdHistory = useRef<string[]>([]);
  const cmdIdx = useRef(-1);

  const scroll = useCallback(() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100), []);

  const run = async (cmd: string) => {
    if (!cmd.trim()) return;
    setLoading(true);
    const time = new Date().toLocaleTimeString();
    const clean = cmd.trim();
    cmdHistory.current = [clean, ...cmdHistory.current].slice(0, 50);
    cmdIdx.current = -1;
    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: clean, cwd: cwd === '~' ? undefined : cwd }),
      });
      const json = await res.json();
      setOutput(prev => [...prev, { cmd: clean, stdout: json.output || '', stderr: json.error || '', time }]);
    } catch {
      setOutput(prev => [...prev, { cmd: clean, stdout: '', stderr: 'Connection failed', time }]);
    }
    setLoading(false);
    setCommand('');
    scroll();
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); run(command); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && cmdHistory.current.length > 0) {
      e.preventDefault();
      cmdIdx.current = Math.min(cmdIdx.current + 1, cmdHistory.current.length - 1);
      setCommand(cmdHistory.current[cmdIdx.current]);
    } else if (e.key === 'ArrowDown' && cmdIdx.current > 0) {
      cmdIdx.current--;
      setCommand(cmdHistory.current[cmdIdx.current]);
    } else if (e.key === 'ArrowDown' && cmdIdx.current === 0) {
      cmdIdx.current = -1;
      setCommand('');
    }
  };

  useEffect(() => { scroll(); }, [output, scroll]);

  const bg = isDark ? '#1a1a2e' : '#fafafa';

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <TerminalIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h4" fontWeight="bold">Terminal</Typography>
          <Chip label={`${DEFAULT_USER}@${cwd}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          {QUICK_CMDS.slice(0, 4).map(q => (
            <Chip key={q.label} label={q.label} size="small" variant="outlined" onClick={() => run(q.cmd)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} />
          ))}
          <Button size="small" variant="outlined" endIcon={<KeyboardArrowDownIcon />} onClick={() => setQuickOpen(!quickOpen)}>More</Button>
        </Box>
      </Box>

      {quickOpen && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Quick Commands</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {QUICK_CMDS.map(q => (
              <Chip key={q.cmd} label={q.label} size="small" onClick={() => { run(q.cmd); setQuickOpen(false); }} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} />
            ))}
          </Box>
        </Paper>
      )}

      <Paper sx={{ bgcolor: bg, minHeight: 450, mb: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ opacity: 0.5, fontFamily: 'monospace' }}>{DEFAULT_USER}@{DEFAULT_HOST} {cwd}</Typography>
          <Tooltip title="Clear"><IconButton size="small" onClick={() => setOutput([])}><DeleteSweepRoundedIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>
          {output.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, opacity: 0.3 }}>
              <TerminalIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography color="text.secondary">Type a command or select a quick command above</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>Use ↑ ↓ to navigate command history</Typography>
            </Box>
          ) : output.map((entry, i) => (
            <Box key={i} sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>$</Typography>
                <Typography sx={{ color: 'info.main', fontWeight: 500 }}>{entry.cmd}</Typography>
                <Typography sx={{ opacity: 0.3, fontSize: '0.7rem', ml: 'auto' }}>{entry.time}</Typography>
              </Box>
              {entry.stdout && <pre style={{ margin: '0.25rem 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.825rem', color: 'text.primary' }}>{entry.stdout}</pre>}
              {entry.stderr && <pre style={{ margin: '0.25rem 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.825rem', color: 'error.main' }}>{entry.stderr}</pre>}
              {i < output.length - 1 && <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', my: 1, opacity: 0.15 }} />}
            </Box>
          ))}
          <div ref={bottomRef} />
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 1.5, borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ color: 'primary.main', fontFamily: 'monospace', fontWeight: 'bold' }}>$</Typography>
          <TextField inputRef={inputRef} fullWidth size="small" variant="standard" value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter command... (↑↓ for history)" disabled={loading} autoComplete="off" InputProps={{ disableUnderline: true, sx: { fontFamily: 'monospace' } }} />
          <Button variant="contained" type="submit" disabled={loading || !command.trim()} endIcon={<SendRoundedIcon />} size="small">{loading ? '...' : 'Run'}</Button>
        </Paper>
      </form>
    </Box>
  );
}
