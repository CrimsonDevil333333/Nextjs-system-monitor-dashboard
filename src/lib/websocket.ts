import { WebSocketServer, WebSocket } from 'ws';
import si from 'systeminformation';
import { Server } from 'http';

let wss: WebSocketServer | null = null;
let broadcastInterval: NodeJS.Timeout | null = null;

interface ClientInfo {
  ws: WebSocket;
  isAlive: boolean;
}

const clients = new Map<WebSocket, ClientInfo>();

export function initializeWebSocket(server: Server) {
  if (wss) {
    console.warn('WebSocket server already initialized');
    return wss;
  }

  wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    const clientInfo: ClientInfo = {
      ws,
      isAlive: true,
    };
    
    clients.set(ws, clientInfo);

    // Send initial stats immediately
    sendStats(ws);

    // Heartbeat handling
    ws.on('pong', () => {
      clientInfo.isAlive = true;
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Start broadcasting stats every 2 seconds
  broadcastInterval = setInterval(broadcastStats, 2000);

  // Heartbeat check every 30 seconds
  const heartbeat = setInterval(() => {
    clients.forEach((clientInfo, ws) => {
      if (!clientInfo.isAlive) {
        console.log('Terminating stale WebSocket connection');
        ws.terminate();
        return;
      }
      clientInfo.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Prevent memory leaks
  wss.on('close', () => {
    if (broadcastInterval) clearInterval(broadcastInterval);
    clearInterval(heartbeat);
  });

  console.log('WebSocket server initialized');
  return wss;
}

async function sendStats(ws: WebSocket) {
  try {
    const [currentLoad, mem, networkStats, time, cpuTemp] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
      si.time(),
      si.cpuTemperature().catch(() => ({ main: 0 })),
    ]);

    const data = {
      type: 'stats',
      timestamp: Date.now(),
      load: {
        currentLoad: currentLoad.currentLoad,
      },
      mem: {
        active: mem.active,
        total: mem.total,
        available: mem.available,
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
      },
      network: networkStats.map(net => ({
        iface: net.iface,
        rx_sec: net.rx_sec,
        tx_sec: net.tx_sec,
        operstate: net.operstate,
      })),
      uptime: time.uptime,
      temp: cpuTemp.main,
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error broadcasting stats:', error);
  }
}

async function broadcastStats() {
  const data: any[] = [];
  
  try {
    const [currentLoad, mem, networkStats, time, cpuTemp] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
      si.time(),
      si.cpuTemperature().catch(() => ({ main: 0 })),
    ]);

    const stats = {
      type: 'stats',
      timestamp: Date.now(),
      load: {
        currentLoad: currentLoad.currentLoad,
      },
      mem: {
        active: mem.active,
        total: mem.total,
        available: mem.available,
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
      },
      network: networkStats.map(net => ({
        iface: net.iface,
        rx_sec: net.rx_sec,
        tx_sec: net.tx_sec,
        operstate: net.operstate,
      })),
      uptime: time.uptime,
      temp: cpuTemp.main,
    };

    data.push(stats);
  } catch (error) {
    console.error('Error collecting stats:', error);
    return;
  }

  const message = JSON.stringify(data);
  
  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function broadcastMessage(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function getWebSocketServer() {
  return wss;
}

export function shutdownWebSocket() {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
  
  if (wss) {
    wss.clients.forEach(ws => ws.close());
    wss.close();
    wss = null;
  }
  
  clients.clear();
}
