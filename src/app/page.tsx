"use client";

import { useEffect, useState, useRef } from 'react';
import { 
  Grid, LinearProgress, Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, Skeleton, Card, CardContent, Typography, Stack
} from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import StatCard from '@/components/dashboard/StatCard';
import DockerTable from '@/components/dashboard/DockerTable';
import SystemInfo from '@/components/dashboard/SystemInfo';

// Type definitions
type HistoryPoint = { time: string, cpu: number, mem: number };

export default function Dashboard() {
  const theme = useTheme();
  // Split state
  const [fastData, setFastData] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  
  const [cpuHistory, setCpuHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Polling refs to avoid closure staleness if we needed them, 
  // but useEffect cleanup is enough here.

  const fetchFast = async () => {
    try {
      const res = await fetch('/api/stats/fast');
      if (!res.ok) throw new Error('Fast poll failed');
      const json = await res.json();
      
      const now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setFastData(json);
      
      setCpuHistory(prev => {
        const memPercent = json.mem ? (json.mem.active / json.mem.total) * 100 : 0;
        const next = [...prev, { time: now, cpu: json.load.currentLoad, mem: memPercent }];
        return next.slice(-40); 
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDetails = async () => {
    try {
      const res = await fetch('/api/stats/details');
      if (!res.ok) throw new Error('Details poll failed');
      const json = await res.json();
      setDetailData(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchFast();
    fetchDetails();

    // Fast poll (2s) for gauges/charts
    const fastInterval = setInterval(fetchFast, 2000);
    // Slow poll (10s) for table/docker/OS
    const detailInterval = setInterval(fetchDetails, 10000);

    return () => {
      clearInterval(fastInterval);
      clearInterval(detailInterval);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes && bytes !== 0) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '-';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  if (loading && !fastData) {
     return (
         <Grid container spacing={3}>
             {[1,2,3,4].map(i => (
                 <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                     <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
                 </Grid>
             ))}
              <Grid size={{ xs: 12 }}>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
              </Grid>
         </Grid>
     )
  }

  return (
    <Box sx={{ maxWidth: '1600px', mx: 'auto' }}>
    <Stack spacing={3}>
      
      {/* 1. KEY METRICS ROW (FAST DATA) */}
      <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
                title="Uptime" 
                value={formatUptime(fastData?.uptime)} 
                icon={<AccessTimeRoundedIcon />} 
                color={theme.palette.primary.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
                title="CPU Load" 
                value={`${fastData?.load?.currentLoad.toFixed(1)}%`} 
                icon={<SpeedRoundedIcon />} 
                color={theme.palette.error.main}
            >
                <LinearProgress variant="determinate" value={fastData?.load?.currentLoad || 0} color="error" sx={{ height: 6, borderRadius: 1 }} />
            </StatCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
                title="Memory" 
                value={`${fastData?.mem ? ((fastData.mem.active/fastData.mem.total)*100).toFixed(0) : 0}%`} 
                subValue={fastData?.mem ? `${formatBytes(fastData.mem.active)} / ${formatBytes(fastData.mem.total)}` : '-'}
                icon={<MemoryRoundedIcon />} 
                color={theme.palette.success.main}
            >
                <LinearProgress variant="determinate" value={fastData?.mem ? (fastData.mem.active/fastData.mem.total)*100 : 0} color="success" sx={{ height: 6, borderRadius: 1 }} />
            </StatCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
             <StatCard 
                title="Temp" 
                value={`${detailData?.temp?.main || '-'}°C`} 
                icon={<DnsRoundedIcon />} 
                color={theme.palette.warning.main}
            >
                <Chip 
                    label={detailData?.temp?.main > 75 ? 'Warning' : 'Normal'} 
                    size="small" 
                    color={detailData?.temp?.main > 75 ? 'error' : 'success'} 
                    variant="filled"
                    sx={{ alignSelf: 'flex-start', height: 20, fontSize: '0.65rem' }}
                />
            </StatCard>
          </Grid>
      </Grid>

      {/* 2. CHARTS & SYSTEM INFO */}
      <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: '100%', minHeight: 400 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">Resource History</Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cpuHistory}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                            interval="preserveStartEnd"
                        />
                        <YAxis 
                            domain={[0, 100]} 
                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                            unit="%"
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
                          itemStyle={{ color: theme.palette.text.primary }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="cpu" 
                            name="CPU"
                            stroke={theme.palette.error.main} 
                            fillOpacity={1} 
                            fill="url(#colorCpu)" 
                            strokeWidth={2} 
                            isAnimationActive={false} 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="mem" 
                            name="Memory"
                            stroke={theme.palette.primary.main} 
                            fillOpacity={1} 
                            fill="url(#colorMem)" 
                            strokeWidth={2} 
                            isAnimationActive={false} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
             {detailData ? (
                <SystemInfo 
                  osInfo={detailData.osInfo} 
                  cpu={detailData.cpu} 
                  mem={fastData?.mem || {}} 
                  processes={detailData?.topProcesses}
                  users={detailData?.users}
                  diskLayout={detailData?.diskLayout}
                  connections={detailData?.connections}
                />
             ) : (
                <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />
             )}
          </Grid>
      </Grid>

      {/* 3. DOCKER SECTION */}
      {detailData?.docker && detailData.docker.length > 0 ? (
          <DockerTable containers={detailData.docker} />
      ) : (
          <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                   <Typography variant="h6" color="text.secondary">
                       {detailData?.docker ? 'No active containers found' : 'Loading Docker info...'}
                   </Typography>
              </CardContent>
          </Card>
      )}

      {/* 4. STORAGE & NETWORK & SERVICES */}
      <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
                <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <StorageRoundedIcon sx={{ mr: 1 }} color="secondary" />
                    <Typography variant="h6" fontWeight="bold">Storage</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                    <TableHead>
                        <TableRow>
                        <TableCell>Mount</TableCell>
                        <TableCell align="right">Usage</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {detailData?.fs?.filter((d:any) => d.size > 0 && !d.mount.startsWith('/var/lib/docker/overlay2')).map((disk: any, i: number) => (
                        <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row">
                            <Box>
                                <Typography variant="body2" fontWeight={600}>{disk.mount}</Typography>
                                <Typography variant="caption" color="text.secondary">{formatBytes(disk.used)} / {formatBytes(disk.size)}</Typography>
                            </Box>
                            </TableCell>
                            <TableCell align="right">
                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                                <LinearProgress 
                                    variant="determinate" 
                                    value={disk.use} 
                                    color={disk.use > 90 ? 'error' : 'secondary'}
                                    sx={{ width: 60, height: 6, borderRadius: 4, mr: 1 }} 
                                    />
                                <Typography variant="caption" fontWeight="bold">{disk.use.toFixed(0)}%</Typography>
                            </Box>
                            </TableCell>
                        </TableRow>
                        ))}
                        {/* Virtual Mounts Section - Filtered for specific paths of interest */}
                        {detailData?.fs?.filter((d:any) => ['/mnt/ramdisk', '/var/log', '/tmp', '/run'].some(p => d.mount === p || d.mount.startsWith(p + '/'))).length > 0 && (
                            <>
                                <TableRow>
                                    <TableCell colSpan={2} sx={{ pt: 2, pb: 1 }}>
                                        <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">Virtual / RAM Mounts</Typography>
                                    </TableCell>
                                </TableRow>
                                {detailData?.fs?.filter((d:any) => ['/mnt/ramdisk', '/var/log', '/tmp', '/run'].some(p => d.mount === p || d.mount.startsWith(p + '/'))).map((disk: any, i: number) => (
                                    <TableRow key={`v-${i}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row">
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{disk.mount}</Typography>
                                            <Typography variant="caption" color="text.secondary">{formatBytes(disk.used)} / {formatBytes(disk.size)}</Typography>
                                        </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={disk.use} 
                                                color="info"
                                                sx={{ width: 60, height: 6, borderRadius: 4, mr: 1 }} 
                                                />
                                            <Typography variant="caption" fontWeight="bold">{disk.use.toFixed(0)}%</Typography>
                                        </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}
                        {!detailData && <TableRow><TableCell colSpan={2}><LinearProgress /></TableCell></TableRow>}
                    </TableBody>
                    </Table>
                </TableContainer>
                </CardContent>
            </Card>
          </Grid>

           <Grid size={{ xs: 12, md: 6 }}>
             <Stack spacing={3}>
                <Card>
                    <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                        <WifiRoundedIcon sx={{ mr: 1 }} color="primary" />
                        <Typography variant="h6" fontWeight="bold">Network Speed</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {fastData?.network?.filter((n:any) => !n.internal && n.operstate !== 'down').map((net: any, i: number) => (
                            <Grid size={{ xs: 12 }} key={i}>
                            <Box p={2} border={`1px solid ${theme.palette.divider}`} borderRadius={3} bgcolor="background.default">
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" fontWeight="bold">{net.iface}</Typography>
                                    <Chip 
                                        label={net.operstate.toUpperCase()} 
                                        size="small" 
                                        color={net.operstate === 'up' ? 'success' : 'default'} 
                                        sx={{ height: 20, fontSize: '0.65rem' }} 
                                    />
                                </Box>
                                <Box display="flex" gap={2}>
                                    <Box flex={1}>
                                        <Typography variant="caption" color="text.secondary" display="block">RX Speed</Typography>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            {formatBytes(net.rx_sec || 0)}/s
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Total: {formatBytes(net.rx_bytes)}
                                        </Typography>
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="caption" color="text.secondary" display="block">TX Speed</Typography>
                                        <Typography variant="body2" fontWeight="bold" color="info.main">
                                            {formatBytes(net.tx_sec || 0)}/s
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Total: {formatBytes(net.tx_bytes)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            </Grid>
                        ))}
                    </Grid>
                    </CardContent>
                </Card>

                <Card>
                  <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <SettingsSuggestRoundedIcon sx={{ mr: 1 }} color="info" />
                        <Typography variant="h6" fontWeight="bold">System Services</Typography>
                      </Box>
                      <Box display="flex" gap={1} flexWrap="wrap">
                          {detailData?.services?.map((svc: any, i: number) => (
                              <Chip 
                                key={i}
                                label={svc.name}
                                color={svc.running ? 'success' : 'default'}
                                variant={svc.running ? 'filled' : 'outlined'}
                                size="small"
                              />
                          ))}
                          {!detailData && <Typography variant="caption">Loading services...</Typography>}
                      </Box>
                  </CardContent>
                </Card>
             </Stack>
          </Grid>
      </Grid>
    </Stack>
    </Box>
  );
}
