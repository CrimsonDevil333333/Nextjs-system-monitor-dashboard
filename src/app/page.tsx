"use client";

import { useEffect, useState, useCallback } from 'react';
import { 
  Grid, LinearProgress, Box, Chip, Skeleton, Card, CardContent, Typography, Stack,
  useTheme
} from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import StatCard from '@/components/dashboard/StatCard';
import SystemInfo from '@/components/dashboard/SystemInfo';
import DockerTable from '@/components/dashboard/DockerTable';

type HistoryPoint = { time: string; cpu: number; mem: number };

interface FastData {
  load?: { currentLoad: number };
  mem?: { active: number; total: number };
  network?: Array<{ iface: string; rx_sec?: number; tx_sec?: number; operstate: string; internal?: boolean }>;
  uptime?: number;
  temp?: number;
}

interface DetailData {
  osInfo?: { hostname: string; distro: string; release: string; kernel: string; arch: string };
  cpu?: unknown;
  fs?: Array<{ mount: string; use: number; used: number; size: number }>;
  docker?: unknown[];
  services?: Array<{ name: string; running: boolean }>;
  topProcesses?: Array<{ name: string; cpu: number; mem: number }>;
  connections?: number;
  temp?: { main: number };
  uptime?: number;
}

interface MemData {
  active: number;
  total: number;
}

export default function Dashboard() {
  const theme = useTheme();
  const [fastData, setFastData] = useState<FastData | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [cpuHistory, setCpuHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFast = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/fast');
      if (!res.ok) return;
      const json = await res.json();
      if (json && !json.error) {
        setFastData(json);
        const now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setCpuHistory(prev => {
          const memPercent = json.mem?.active && json.mem?.total ? (json.mem.active / json.mem.total) * 100 : 0;
          const next = [...prev, { time: now, cpu: json.load?.currentLoad || 0, mem: memPercent }];
          return next.slice(-40);
        });
        if (loading) setLoading(false);
      }
    } catch { /* silent retry */ }
  }, [loading]);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/details');
      if (!res.ok) return;
      const json = await res.json();
      if (json && !json.error) {
        setDetailData(json);
        if (loading) setLoading(false);
      }
    } catch { /* silent retry */ }
  }, [loading]);

  useEffect(() => {
    fetchFast();
    fetchDetails();
    const fast = setInterval(fetchFast, 3000);
    const detail = setInterval(fetchDetails, 15000);
    return () => { clearInterval(fast); clearInterval(detail); };
  }, [fetchFast, fetchDetails]);

  const fmtBytes = (bytes: number) => {
    if (!bytes && bytes !== 0) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const fmtUptime = (s: number) => {
    if (!s) return '-';
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return (d > 0 ? d + 'd ' : '') + h + 'h ' + m + 'm';
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
        <Grid container spacing={2}>
          {[1,2,3,4].map(i => <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}><Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
        <LinearProgress sx={{ mt: 3, borderRadius: 1 }} />
      </Box>
    );
  }

  const cpuLoad = fastData?.load?.currentLoad || 0;
  const memActive = fastData?.mem?.active || 0;
  const memTotal = fastData?.mem?.total || 1;
  const memPercent = (memActive / memTotal) * 100;
  const temp = detailData?.temp?.main || fastData?.temp || 0;
  const uptime = fastData?.uptime || detailData?.uptime || 0;

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* 4 Key Metrics Row */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Uptime" value={fmtUptime(uptime)} icon={<AccessTimeRoundedIcon />} color={theme.palette.primary.main} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="CPU" value={`${cpuLoad.toFixed(1)}%`} icon={<SpeedRoundedIcon />} color={theme.palette.error.main}>
              <LinearProgress variant="determinate" value={Math.min(cpuLoad, 100)} color={cpuLoad > 80 ? 'error' : cpuLoad > 50 ? 'warning' : 'primary'} sx={{ height: 6, borderRadius: 1 }} />
            </StatCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Memory" value={`${memPercent.toFixed(0)}%`} subValue={`${fmtBytes(memActive)} / ${fmtBytes(memTotal)}`} icon={<MemoryRoundedIcon />} color={theme.palette.success.main}>
              <LinearProgress variant="determinate" value={Math.min(memPercent, 100)} color={memPercent > 80 ? 'error' : memPercent > 60 ? 'warning' : 'success'} sx={{ height: 6, borderRadius: 1 }} />
            </StatCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Temp" value={`${temp}°C`} icon={<DnsRoundedIcon />} color={theme.palette.warning.main}>
              <Chip label={temp > 75 ? 'Warning' : 'Normal'} size="small" color={temp > 75 ? 'error' : 'success'} sx={{ height: 20, fontSize: '0.65rem' }} />
            </StatCard>
          </Grid>
        </Grid>

        {/* Chart + System Info Row */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">Resource History</Typography>
                <Box sx={{ flexGrow: 1, minHeight: 250 }}>
                  {cpuHistory.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cpuHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                        <Area type="monotone" dataKey="cpu" name="CPU" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
                        <Area type="monotone" dataKey="mem" name="RAM" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}><Typography color="text.secondary">Collecting data...</Typography></Box>}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            {detailData ? (
              <SystemInfo 
                osInfo={detailData.osInfo || null} 
                cpu={detailData.cpu} 
                mem={fastData?.mem ? { active: fastData.mem.active, total: fastData.mem.total } : null} 
                processes={detailData.topProcesses || []} 
                connections={detailData.connections} 
              />
            ) : <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />}
          </Grid>
        </Grid>

        {/* Docker Containers Table */}
        {detailData?.docker && detailData.docker.length > 0 ? (
          <DockerTable containers={detailData.docker} />
        ) : detailData?.docker ? (
          <Card><CardContent sx={{ textAlign: 'center', py: 3 }}><Typography color="text.secondary">No active containers found</Typography></CardContent></Card>
        ) : null}

        {/* Storage + Network Row */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}><StorageRoundedIcon sx={{ mr: 1, color: 'secondary.main' }} /><Typography variant="h6" fontWeight="bold">Storage</Typography></Box>
                <Stack spacing={2}>
                  {(detailData?.fs || []).filter((d: any) => d.size > 0 && !d.mount.startsWith('/var/lib/docker/overlay2')).map((disk: any, i: number) => (
                    <Box key={i}>
                      <Typography variant="body2" fontWeight={600}>{disk.mount}</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress variant="determinate" value={disk.use} color={disk.use > 90 ? 'error' : disk.use > 70 ? 'warning' : 'primary'} sx={{ flex: 1, height: 6, borderRadius: 1 }} />
                        <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 40 }}>{disk.use.toFixed(0)}%</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{fmtBytes(disk.used)} / {fmtBytes(disk.size)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}><WifiRoundedIcon sx={{ mr: 1, color: 'primary.main' }} /><Typography variant="h6" fontWeight="bold">Network</Typography></Box>
                  <Stack spacing={1.5}>
                    {(fastData?.network || []).filter((n: any) => !n.internal && n.operstate !== 'down').slice(0, 3).map((net: any, i: number) => (
                      <Box key={i} p={1.5} borderRadius={2} bgcolor="background.default" border="1px solid" borderColor="divider">
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="subtitle2" fontWeight="bold">{net.iface}</Typography>
                          <Chip label={net.operstate} size="small" color={net.operstate === 'up' ? 'success' : 'default'} variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                        </Box>
                        <Box display="flex" gap={2}>
                          <Typography variant="caption" color="success.main">↓ {fmtBytes(net.rx_sec || 0)}/s</Typography>
                          <Typography variant="caption" color="info.main">↑ {fmtBytes(net.tx_sec || 0)}/s</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}><SettingsSuggestRoundedIcon sx={{ mr: 1, color: 'info.main' }} /><Typography variant="h6" fontWeight="bold">Services</Typography></Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {(detailData?.services || []).slice(0, 15).map((svc: any, i: number) => (
                      <Chip key={i} label={svc.name} color={svc.running ? 'success' : 'default'} variant={svc.running ? 'filled' : 'outlined'} size="small" sx={{ fontSize: '0.7rem' }} />
                    ))}
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
