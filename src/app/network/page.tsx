"use client";

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Chip, TextField, Button, Paper 
} from '@mui/material';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import DnsIcon from '@mui/icons-material/Dns';

export default function NetworkPage() {
  const [data, setData] = useState<any>(null);
  const [target, setTarget] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/network')
      .then(res => res.json())
      .then(setData);
  }, []);

  const runTool = async (tool: 'ping' | 'dns') => {
    setLoading(true);
    setOutput(`Running ${tool}...`);
    try {
        const res = await fetch('/api/network/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool, target })
        });
        const json = await res.json();
        setOutput(json.output);
    } catch (e) {
        setOutput('Error executing tool');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">Network Tools</Typography>

      <Grid container spacing={3}>
        {/* Interfaces */}
        {data?.interfaces?.map((iface: any, i: number) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                <Card>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                            <Typography variant="h6">{iface.iface}</Typography>
                            <Chip label={iface.operstate} color={iface.operstate === 'up' ? 'success' : 'default'} size="small" />
                        </Box>
                        <Typography variant="body2">IP: {iface.ip4}</Typography>
                        <Typography variant="body2">MAC: {iface.mac}</Typography>
                        <Typography variant="body2">Speed: {iface.speed > 0 ? `${iface.speed} Mbps` : 'N/A'}</Typography>
                    </CardContent>
                </Card>
            </Grid>
        ))}

        {/* Tools Section */}
        <Grid size={{ xs: 12 }}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Utilities</Typography>
                    <Box>
                        <Box display="flex" gap={2} mb={2}>
                            <TextField 
                                size="small" 
                                label="Target (IP/Host)" 
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                fullWidth
                            />
                            <Button 
                                variant="contained" 
                                onClick={() => runTool('ping')} 
                                disabled={loading || !target}
                                startIcon={<NetworkCheckIcon />}
                            >
                                Ping
                            </Button>
                            <Button 
                                variant="outlined" 
                                onClick={() => runTool('dns')} 
                                disabled={loading || !target}
                                startIcon={<DnsIcon />}
                            >
                                DNS
                            </Button>
                        </Box>
                        <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#f0f0f0', fontFamily: 'monospace', minHeight: 200 }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
                        </Paper>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
