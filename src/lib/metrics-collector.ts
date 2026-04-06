import { insertMetric } from './database';
import si from 'systeminformation';

let collectionInterval: NodeJS.Timeout | null = null;

export function startMetricsCollection() {
  if (collectionInterval) {
    console.warn('Metrics collection already started');
    return;
  }

  console.log('Starting metrics collection (every 30 seconds)');
  
  // Collect immediately
  collectMetrics();

  // Then every 30 seconds
  collectionInterval = setInterval(collectMetrics, 30000);
}

async function collectMetrics() {
  try {
    const [currentLoad, mem, networkStats, time, cpuTemp, dockerContainers, netInterfaces] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
      si.time(),
      si.cpuTemperature().catch(() => ({ main: 0 })),
      si.dockerContainers().catch(() => []),
      si.networkInterfaces().catch(() => []),
    ]);

    // Calculate total network I/O — filter out internal/down interfaces
    const internalIfaces = new Set(netInterfaces.filter(n => n.internal || n.operstate === 'down').map(n => n.iface));
    let totalRx = 0;
    let totalTx = 0;
    networkStats.forEach(net => {
      if (!internalIfaces.has(net.iface)) {
        totalRx += net.rx_sec || 0;
        totalTx += net.tx_sec || 0;
      }
    });

    // Calculate total disk usage (root filesystem)
    const rootFs = await si.fsSize().then(fs => fs.find(f => f.mount === '/'));
    
    insertMetric({
      cpu_load: currentLoad.currentLoad,
      memory_active: mem.active,
      memory_total: mem.total,
      memory_percent: (mem.active / mem.total) * 100,
      swap_used: mem.swapused,
      swap_total: mem.swaptotal,
      temp_cpu: cpuTemp.main,
      uptime: time.uptime,
      network_rx: totalRx,
      network_tx: totalTx,
      disk_used: rootFs?.used || 0,
      disk_total: rootFs?.size || 0,
      docker_containers: dockerContainers.length,
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
  }
}

export function stopMetricsCollection() {
  if (collectionInterval) {
    clearInterval(collectionInterval);
    collectionInterval = null;
    console.log('Metrics collection stopped');
  }
}
