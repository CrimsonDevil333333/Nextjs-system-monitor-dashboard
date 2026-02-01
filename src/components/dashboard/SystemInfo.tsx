import { 
  Box, Card, CardContent, Grid, Typography, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip 
} from '@mui/material';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

export default function SystemInfo({ 
  osInfo, cpu, mem, processes, users, diskLayout, connections 
}: { 
  osInfo: any, cpu: any, mem: any, processes?: any[], users?: any[], diskLayout?: any[], connections?: number 
}) {
  const formatBytes = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
         {/* System Info Section */}
         <Box display="flex" alignItems="center" mb={2}>
            <InfoRoundedIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">System Details</Typography>
         </Box>
         <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Hostname</Typography>
                <Typography variant="body2" fontWeight={500}>{osInfo.hostname}</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">OS</Typography>
                <Typography variant="body2" fontWeight={500}>{osInfo.distro} {osInfo.release}</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Kernel</Typography>
                <Typography variant="body2" fontWeight={500}>{osInfo.kernel}</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Architecture</Typography>
                <Typography variant="body2" fontWeight={500}>{osInfo.arch}</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Total Memory</Typography>
                <Typography variant="body2" fontWeight={500}>{formatBytes(mem.total)}</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Active Connections</Typography>
                <Typography variant="body2" fontWeight={500} color="success.main">{connections || 0}</Typography>
            </Grid>
         </Grid>

         {/* Active Connections */}
         <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Active Connections</Typography>
                <Typography variant="body2" fontWeight={500} color="success.main">{connections || 0}</Typography>
            </Grid>
         </Grid>

         {/* Connected Users */}
         {users && users.length > 0 && (
             <Box mb={3}>
                 <Box display="flex" alignItems="center" mb={1}>
                    <GroupRoundedIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight="bold">Active Sessions</Typography>
                 </Box>
                 <Box display="flex" gap={1} flexWrap="wrap">
                    {users.map((user, i) => (
                        <Chip key={i} label={`${user.user} (${user.tty})`} size="small" variant="outlined" />
                    ))}
                 </Box>
             </Box>
         )}

         {/* Top Processes Section */}
         {processes && processes.length > 0 && (
             <>
                 <Box display="flex" alignItems="center" mb={2}>
                    <AssignmentRoundedIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">Top Processes</Typography>
                 </Box>
                 <TableContainer>
                     <Table size="small">
                         <TableHead>
                             <TableRow>
                                 <TableCell>Name</TableCell>
                                 <TableCell align="right">CPU</TableCell>
                                 <TableCell align="right">Mem</TableCell>
                             </TableRow>
                         </TableHead>
                         <TableBody>
                             {processes.map((proc, i) => (
                                 <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                     <TableCell component="th" scope="row" sx={{ py: 0.5, fontWeight: 500 }}>
                                         {proc.name}
                                     </TableCell>
                                     <TableCell align="right" sx={{ py: 0.5 }}>{proc.cpu.toFixed(1)}%</TableCell>
                                     <TableCell align="right" sx={{ py: 0.5 }}>{proc.mem.toFixed(1)}%</TableCell>
                                 </TableRow>
                             ))}
                         </TableBody>
                     </Table>
                 </TableContainer>
             </>
         )}
      </CardContent>
    </Card>
  );
}
