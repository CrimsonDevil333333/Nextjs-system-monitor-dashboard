"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Stack, CircularProgress, Alert, TextField,
  InputAdornment, Card, CardContent
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import GroupWorkRoundedIcon from '@mui/icons-material/GroupWorkRounded';

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports?: string[];
  stats?: { cpu: number; mem: number; memLimit: number };
}

interface ComposeStack {
  name: string;
  path: string;
  status: string;
  containers: string[];
}

interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

export type DockerTab = 'containers' | 'images' | 'compose';

export default function DockerManager() {
  const [tab, setTab] = useState<DockerTab>('containers');
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [images, setImages] = useState<DockerImage[]>([]);
  const [stacks, setStacks] = useState<ComposeStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pullImage, setPullImage] = useState('');
  const [pulling, setPulling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'containers') {
        const res = await fetch('/api/docker');
        if (!res.ok) throw new Error('Failed to fetch containers');
        const data = await res.json();
        setContainers(data.containers || []);
      } else if (tab === 'images') {
        const res = await fetch('/api/docker/images');
        if (!res.ok) throw new Error('Failed to fetch images');
        const data = await res.json();
        setImages(data.images || []);
      } else if (tab === 'compose') {
        const res = await fetch('/api/compose');
        if (!res.ok) throw new Error('Failed to fetch stacks');
        const data = await res.json();
        setStacks(data.stacks || []);
      }
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const containerAction = async (id: string, action: string) => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch('/api/docker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, containerId: id })
      });
      if (!res.ok) throw new Error(`Failed to ${action} container`);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const pullImageHandler = async () => {
    if (!pullImage.trim()) return;
    setPulling(true);
    try {
      const res = await fetch('/api/docker/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', image: pullImage.trim() })
      });
      if (!res.ok) throw new Error('Failed to pull image');
      setPullImage('');
      setTab('images');
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
    setPulling(false);
  };

  const filteredContainers = containers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.image.toLowerCase().includes(search.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <ExtensionRoundedIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">Docker Manager</Typography>
            <Chip label={`${containers.length} containers`} size="small" variant="outlined" />
          </Box>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            {tab === 'containers' && (
              <TextField
                size="small"
                placeholder="Search containers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ width: 220 }}
              />
            )}
            {tab === 'images' && (
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  placeholder="nginx:latest"
                  value={pullImage}
                  onChange={(e) => setPullImage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && pullImageHandler()}
                  sx={{ width: 200 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={pullImageHandler}
                  disabled={pulling || !pullImage}
                  startIcon={pulling ? <CircularProgress size={16} /> : undefined}
                >
                  Pull
                </Button>
              </Box>
            )}
            <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} onClick={fetchData}>
              Refresh
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tab label={`Containers (${containers.length})`} value="containers" icon={<LayersRoundedIcon fontSize="small" />} iconPosition="start" />
        <Tab label={`Images (${images.length})`} value="images" icon={<GroupWorkRoundedIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Compose" value="compose" icon={<GroupWorkRoundedIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {error && <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Containers Tab */}
      {tab === 'containers' && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Container</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">CPU</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">RAM</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContainers.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{c.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{c.image.split(':').slice(0, 2).join(':')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.state}
                      size="small"
                      color={c.state === 'running' ? 'success' : 'default'}
                      variant={c.state === 'running' ? 'filled' : 'outlined'}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontFamily="monospace">
                      {c.stats?.cpu?.toFixed(1) ?? '-'}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontFamily="monospace">
                      {c.stats ? formatBytes(c.stats.mem) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={c.state === 'running' ? 'Stop' : 'Start'}>
                      <IconButton
                        size="small"
                        color={c.state === 'running' ? 'error' : 'success'}
                        disabled={actionLoading === `${c.id}-${c.state === 'running' ? 'stop' : 'start'}`}
                        onClick={() => containerAction(c.id, c.state === 'running' ? 'stop' : 'start')}
                      >
                        {c.state === 'running' ? <StopRoundedIcon fontSize="small" /> : <PlayArrowRoundedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Restart">
                      <IconButton
                        size="small"
                        color="warning"
                        disabled={actionLoading === `${c.id}-restart`}
                        onClick={() => containerAction(c.id, 'restart')}
                      >
                        <RestartAltRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredContainers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>No containers found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Images Tab */}
      {tab === 'images' && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Repository</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tag</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Size</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(images || []).map((img) => (
                <TableRow key={img.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{img.repository || '<none>'}</TableCell>
                  <TableCell><Chip label={img.tag || '<none>'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{img.id?.slice(0, 12)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{img.size}</TableCell>
                  <TableCell>{new Date(img.created).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {images.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>No images found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Compose Tab */}
      {tab === 'compose' && (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary">Docker Compose management coming next. For now use the terminal page.</Typography>
        </Box>
      )}
    </Paper>
  );
}
