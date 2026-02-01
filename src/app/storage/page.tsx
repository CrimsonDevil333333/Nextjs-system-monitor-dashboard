"use client";

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, LinearProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Breadcrumbs, Link as MuiLink, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import Login from '@/components/Login';

export default function StoragePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // File Explorer
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<any[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Viewer/Editor
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{name: string, path: string} | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isMedia, setIsMedia] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/storage')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
    
    fetchFiles('/');
  }, []);

  const fetchFiles = async (path: string) => {
      setExplorerLoading(true);
      try {
          const res = await fetch('/api/storage/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path })
          });
          if (res.ok) {
              const json = await res.json();
              setFiles(json.files);
              setCurrentPath(path);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setExplorerLoading(false);
      }
  };

  const handleFileClick = async (file: any) => {
      if (file.isDirectory) {
          fetchFiles(file.path);
      } else {
          setSelectedFile(file);
          setViewOpen(true);
          setFileContent(null);
          
          const ext = file.name.split('.').pop().toLowerCase();
          const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
          const isVid = ['mp4', 'webm', 'ogg'].includes(ext);
          
          if (isImg || isVid) {
              setIsMedia(true);
          } else {
              setIsMedia(false);
              // Fetch text content
              const res = await fetch(`/api/storage/content?path=${encodeURIComponent(file.path)}`);
              const text = await res.text();
              setFileContent(text);
          }
      }
  };

  const handleSave = async () => {
      if (!selectedFile || isMedia) return;
      setSaving(true);
      try {
          await fetch('/api/storage/content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: selectedFile.path, content: fileContent })
          });
          setViewOpen(false);
      } catch (e) {
          alert('Failed to save');
      } finally {
          setSaving(false);
      }
  };

  const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">Storage Manager</Typography>

      <Grid container spacing={3}>
        {/* Physical Disks */}
        <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Mounted Filesystems</Typography>
                    <TableContainer sx={{ maxHeight: 250 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Mount</TableCell>
                                    <TableCell align="right">Usage</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.fs?.filter((f: any) => f.size > 0).map((fs: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell component="th" scope="row">
                                            <Typography variant="body2" fontWeight="bold">{fs.mount}</Typography>
                                            <Typography variant="caption">{fs.type}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={fs.use} 
                                                    color={fs.use > 90 ? 'error' : 'primary'}
                                                    sx={{ width: 50, mr: 1, borderRadius: 2 }} 
                                                />
                                                <Typography variant="caption">{fs.use.toFixed(0)}%</Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatBytes(fs.used)} / {formatBytes(fs.size)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Grid>

        {/* File Explorer */}
        <Grid size={{ xs: 12 }}>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">File Explorer</Typography>
                        <IconButton onClick={() => fetchFiles(currentPath)} size="small">
                            <RefreshIcon />
                        </IconButton>
                    </Box>

                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
                        <MuiLink 
                            component="button" 
                            underline="hover" 
                            color="inherit" 
                            onClick={() => fetchFiles('/')}
                        >
                            /
                        </MuiLink>
                        {pathParts.map((part, index) => {
                            const path = '/' + pathParts.slice(0, index + 1).join('/');
                            return (
                                <MuiLink 
                                    key={path} 
                                    component="button" 
                                    underline="hover" 
                                    color={index === pathParts.length - 1 ? 'text.primary' : 'inherit'}
                                    onClick={() => fetchFiles(path)}
                                >
                                    {part}
                                </MuiLink>
                            );
                        })}
                    </Breadcrumbs>

                    {explorerLoading ? (
                        <LinearProgress />
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell align="right">Size</TableCell>
                                        <TableCell align="right">Modified</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentPath !== '/' && (
                                        <TableRow hover onClick={() => fetchFiles(currentPath.split('/').slice(0, -1).join('/') || '/')} sx={{ cursor: 'pointer' }}>
                                            <TableCell colSpan={3}>
                                                <Box display="flex" alignItems="center">
                                                    <FolderIcon color="action" sx={{ mr: 1 }} />
                                                    ..
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {files.map((file, i) => (
                                        <TableRow 
                                            key={i} 
                                            hover 
                                            onClick={() => handleFileClick(file)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    {file.isDirectory ? (
                                                        <FolderIcon color="warning" sx={{ mr: 1 }} />
                                                    ) : (
                                                        <InsertDriveFileIcon color="action" sx={{ mr: 1 }} />
                                                    )}
                                                    {file.name}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                {file.isDirectory ? '-' : formatBytes(file.size)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {new Date(file.mtime).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {files.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">Empty directory</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Grid>
      </Grid>

      {/* File Viewer/Editor Dialog */}
      <Dialog 
        open={viewOpen} 
        onClose={() => setViewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedFile?.name}
              <IconButton onClick={() => setViewOpen(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
              {isMedia && selectedFile ? (
                  <Box display="flex" justifyContent="center">
                      {selectedFile.name.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video controls style={{ maxWidth: '100%', maxHeight: '70vh' }} src={`/api/storage/content?path=${encodeURIComponent(selectedFile.path)}`} />
                      ) : (
                          <img style={{ maxWidth: '100%', maxHeight: '70vh' }} src={`/api/storage/content?path=${encodeURIComponent(selectedFile.path)}`} alt="Preview" />
                      )}
                  </Box>
              ) : (
                  <TextField 
                    fullWidth
                    multiline
                    minRows={10}
                    maxRows={25}
                    value={fileContent || ''}
                    onChange={(e) => setFileContent(e.target.value)}
                    sx={{ fontFamily: 'monospace' }}
                  />
              )}
          </DialogContent>
          {!isMedia && (
              <DialogActions>
                  <Button onClick={() => setViewOpen(false)}>Cancel</Button>
                  <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={<SaveIcon />}>Save</Button>
              </DialogActions>
          )}
      </Dialog>
    </Box>
  );
}
