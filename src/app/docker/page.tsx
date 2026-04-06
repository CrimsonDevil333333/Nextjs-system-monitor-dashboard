"use client";

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, Chip, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DockerTable from '@/components/dashboard/DockerTable';

type TabType = 'containers' | 'images';

interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  createdAt: string;
  fullName: string;
}

export default function DockerPage() {
  const [tab, setTab] = useState<TabType>('containers');
  const [containers, setContainers] = useState<any[]>([]);
  const [images, setImages] = useState<DockerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Image management
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [newImage, setNewImage] = useState('');
  const [pullingImage, setPullingImage] = useState(false);
  
  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch('/api/docker');
      if (!res.ok) throw new Error('Failed to fetch containers');
      const json = await res.json();
      setContainers(json.containers || []);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch('/api/docker/images');
      if (!res.ok) throw new Error('Failed to fetch images');
      const json = await res.json();
      setImages(json.images || []);
    } catch (e) {
      console.error('Failed to fetch images:', e);
    }
  }, []);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchContainers(), fetchImages()]);
    setRefreshing(false);
  };

  useEffect(() => {
    refreshAll();
    setLoading(false);
    
    // Refresh every 10 seconds
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [fetchContainers, fetchImages]);

  const handleContainerAction = async (containerId: string, action: string) => {
    try {
      const res = await fetch('/api/docker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, containerId }),
      });
      
      if (!res.ok) throw new Error(`Failed to ${action} container`);
      
      // Refresh after action
      setTimeout(fetchContainers, 1000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handlePullImage = async () => {
    if (!newImage) return;
    
    setPullingImage(true);
    try {
      const res = await fetch('/api/docker/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', image: newImage }),
      });
      
      if (!res.ok) throw new Error('Failed to pull image');
      
      setImageDialogOpen(false);
      setNewImage('');
      setTimeout(fetchImages, 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPullingImage(false);
    }
  };

  const handleRemoveImage = async (imageName: string) => {
    if (!confirm(`Remove image ${imageName}?`)) return;
    
    try {
      const res = await fetch('/api/docker/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', image: imageName, force: false }),
      });
      
      if (!res.ok) throw new Error('Failed to remove image');
      
      setTimeout(fetchImages, 1000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handlePruneImages = async () => {
    if (!confirm('Remove all dangling images?')) return;
    
    try {
      const res = await fetch('/api/docker/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prune' }),
      });
      
      if (!res.ok) throw new Error('Failed to prune images');
      
      setTimeout(fetchImages, 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <ExtensionRoundedIcon sx={{ mr: 1, fontSize: 28 }} color="primary" />
          <Typography variant="h4" fontWeight="bold">
            Docker Manager
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={refreshAll}
            disabled={refreshing}
            sx={{ minWidth: { xs: '40px', sm: 'auto' }, p: { xs: 1, sm: '6px 16px' } }}
          >
            <RefreshRoundedIcon sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Refresh</Box>
          </Button>
          {tab === 'images' && (
            <>
              <Button
                variant="outlined"
                onClick={() => setImageDialogOpen(true)}
                sx={{ minWidth: { xs: '40px', sm: 'auto' }, p: { xs: 1, sm: '6px 16px' } }}
              >
                <DownloadRoundedIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Pull Image</Box>
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={handlePruneImages}
                sx={{ minWidth: { xs: '40px', sm: 'auto' }, p: { xs: 1, sm: '6px 16px' } }}
              >
                <DeleteRoundedIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Prune</Box>
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Containers" value="containers" />
          <Tab label={`Images (${images.length})`} value="images" />
        </Tabs>
      </Paper>

      {tab === 'containers' && (
        <DockerTable 
          containers={containers}
          onAction={handleContainerAction}
        />
      )}

      {tab === 'images' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Repository</TableCell>
                <TableCell>Tag</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{image.repository}</TableCell>
                  <TableCell>
                    <Chip label={image.tag} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{image.size}</TableCell>
                  <TableCell>{image.createdAt}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove Image">
                      <IconButton color="error" onClick={() => handleRemoveImage(image.fullName)}>
                        <DeleteRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {images.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No images found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pull Docker Image</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Image Name"
            placeholder="e.g., nginx:latest, postgres:15"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePullImage}
            variant="contained"
            disabled={!newImage || pullingImage}
            startIcon={pullingImage ? <CircularProgress size={20} /> : <DownloadRoundedIcon />}
          >
            {pullingImage ? 'Pulling...' : 'Pull Image'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
