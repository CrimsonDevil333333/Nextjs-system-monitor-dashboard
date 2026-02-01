import { NextResponse } from 'next/server';
import si from 'systeminformation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Parallelize heavy tasks
    const [
      cpu, mem, osInfo, currentLoad, time, 
      fsSize, networkStats, temp, 
      dockerContainers, dockerStats
    ] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.currentLoad(),
      si.time(),
      si.fsSize(),
      si.networkStats(),
      si.cpuTemperature(),
      si.dockerContainers().catch(() => []),
      si.dockerContainerStats('*').catch(() => [])
    ]);

    // Merge docker stats with container info. Handle missing stats gracefully.
    const containersWithStats = (dockerContainers || []).map(container => {
      const stats = (dockerStats || []).find(s => s && s.id === container.id);
      return { 
        ...container, 
        stats: stats || { cpu_percent: 0, mem_usage: 0, netIO: { rx: 0, tx: 0 } }
      };
    });

    return NextResponse.json({
      cpu,
      mem,
      osInfo,
      load: currentLoad,
      uptime: time.uptime,
      fs: fsSize,
      network: networkStats,
      temp,
      docker: containersWithStats
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats: ' + error }, { status: 500 });
  }
}
