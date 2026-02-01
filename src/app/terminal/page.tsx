"use client";

import { useState } from 'react';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';

export default function TerminalPage() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<{cmd: string, out: string, err?: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const execute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    try {
        const res = await fetch('/api/terminal/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        const json = await res.json();
        
        setHistory(prev => [...prev, { cmd: command, out: json.output, err: json.error }]);
        setCommand('');
    } catch (e) {
        setHistory(prev => [...prev, { cmd: command, out: '', err: 'Execution failed' }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Box>
        <Typography variant="h4" gutterBottom>Command Runner</Typography>
        <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#f0f0f0', minHeight: 400, mb: 2, fontFamily: 'monospace' }}>
            {history.map((entry, i) => (
                <Box key={i} mb={2}>
                    <Typography color="success.main" component="span">$ </Typography>
                    <Typography component="span">{entry.cmd}</Typography>
                    {entry.out && <pre style={{ margin: '4px 0', color: '#ccc' }}>{entry.out}</pre>}
                    {entry.err && <pre style={{ margin: '4px 0', color: '#ff6b6b' }}>{entry.err}</pre>}
                </Box>
            ))}
        </Paper>
        <form onSubmit={execute}>
            <Box display="flex" gap={2}>
                <TextField 
                    fullWidth 
                    value={command} 
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command..."
                    disabled={loading}
                    autoFocus
                />
                <Button variant="contained" type="submit" disabled={loading} startIcon={<TerminalIcon />}>
                    Run
                </Button>
            </Box>
        </form>
    </Box>
  );
}
