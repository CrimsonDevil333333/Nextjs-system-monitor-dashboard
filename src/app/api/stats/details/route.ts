import { NextResponse } from 'next/server';
import si from 'systeminformation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      cpu, osInfo, fsSize, temp, 
      dockerContainers, dockerStats, services, processes,
      users, diskLayout, netConnections
    ] = await Promise.all([
      si.cpu(),
      si.osInfo(),
      si.fsSize(),
      si.cpuTemperature(),
      si.dockerContainers().catch(() => []),
      si.dockerContainerStats('*').catch(() => []),
      si.services('ssh, docker, cron, ufw, networking').catch(() => []),
      si.processes().catch(() => null),
      si.users(),
      si.diskLayout().then(disks => disks.filter(d => d.size > 0 && d.type !== 'Virtual')),
      si.networkConnections().catch(() => [])
    ]);

    // Merge docker stats safely (handle potential ID mismatches and camelCase keys)
    const containersWithStats = (dockerContainers || []).map(container => {
      // Try exact match first, then prefix match
      const rawStats = (dockerStats || []).find(s => 
        s && (s.id === container.id || container.id.startsWith(s.id) || s.id.startsWith(container.id))
      ) as any;

      // Normalize stats
      const stats = rawStats ? {
        cpu: rawStats.cpuPercent || rawStats.cpu_percent || 0,
        mem: rawStats.memUsage || rawStats.mem_usage || 0,
        memLimit: rawStats.memLimit || rawStats.mem_limit || 0,
        netIO: {
          rx: rawStats.netIO?.rx || 0,
          tx: rawStats.netIO?.tx || rawStats.netIO?.wx || 0
        },
        blockIO: {
          r: rawStats.blockIO?.r || 0,
          w: rawStats.blockIO?.w || 0
        }
      } : { 
        cpu: 0, 
        mem: 0, 
        memLimit: 0,
        netIO: { rx: 0, tx: 0 }, 
        blockIO: { r: 0, w: 0 }
      };
      
      return { 
        ...container, 
        stats
      };
    });

    return NextResponse.json({
      cpu,
      osInfo,
      fs: fsSize,
      temp,
      docker: containersWithStats,
      services,
      topProcesses: processes ? processes.list.sort((a,b) => b.cpu - a.cpu).slice(0, 5) : [],
      users,
      diskLayout,
      connections: netConnections ? netConnections.filter(c => c.state === 'ESTABLISHED').length : 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch details: ' + error }, { status: 500 });
  }
}
