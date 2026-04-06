import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'metrics.db');

let db: Database.Database | null = null;

function ensureDirectory() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getDatabase(): Database.Database {
  if (db) return db;

  ensureDirectory();
  
  try {
    db = new Database(DB_PATH);
    
    // Optimize SQLite for write-heavy workload
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000'); // 64MB cache
    db.pragma('temp_store = MEMORY');
    db.pragma('mmap_size = 268435456'); // 256MB

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        cpu_load REAL NOT NULL,
        memory_active INTEGER NOT NULL,
        memory_total INTEGER NOT NULL,
        memory_percent REAL NOT NULL,
        swap_used INTEGER NOT NULL,
        swap_total INTEGER NOT NULL,
        temp_cpu REAL,
        uptime INTEGER NOT NULL,
        network_rx REAL DEFAULT 0,
        network_tx REAL DEFAULT 0,
        disk_used INTEGER DEFAULT 0,
        disk_total INTEGER DEFAULT 0,
        docker_containers INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON system_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_created_at ON system_metrics(created_at);

      CREATE TABLE IF NOT EXISTS docker_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        container_id TEXT NOT NULL,
        container_name TEXT NOT NULL,
        event_type TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_docker_timestamp ON docker_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_docker_container ON docker_events(container_id);

      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT,
        acknowledged BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_alert_timestamp ON alerts(timestamp);
      CREATE INDEX IF NOT EXISTS idx_alert_type ON alerts(type);
    `);

    console.log('Database initialized:', DB_PATH);
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export function insertMetric(metric: {
  cpu_load: number;
  memory_active: number;
  memory_total: number;
  memory_percent: number;
  swap_used: number;
  swap_total: number;
  temp_cpu?: number;
  uptime: number;
  network_rx?: number;
  network_tx?: number;
  disk_used?: number;
  disk_total?: number;
  docker_containers?: number;
}) {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO system_metrics (
      timestamp, cpu_load, memory_active, memory_total, memory_percent,
      swap_used, swap_total, temp_cpu, uptime,
      network_rx, network_tx, disk_used, disk_total, docker_containers
    ) VALUES (
      @timestamp, @cpu_load, @memory_active, @memory_total, @memory_percent,
      @swap_used, @swap_total, @temp_cpu, @uptime,
      @network_rx, @network_tx, @disk_used, @disk_total, @docker_containers
    )
  `);

  return stmt.run({
    timestamp: Date.now(),
    ...metric,
  });
}

export function insertDockerEvent(event: {
  container_id: string;
  container_name: string;
  event_type: string;
  details?: string;
}) {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO docker_events (timestamp, container_id, container_name, event_type, details)
    VALUES (@timestamp, @container_id, @container_name, @event_type, @details)
  `);

  return stmt.run({
    timestamp: Date.now(),
    ...event,
  });
}

export function insertAlert(alert: {
  type: string;
  severity: string;
  message: string;
  details?: string;
}) {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO alerts (timestamp, type, severity, message, details)
    VALUES (@timestamp, @type, @severity, @message, @details)
  `);

  return stmt.run({
    timestamp: Date.now(),
    ...alert,
  });
}

export function getHistory(range: string) {
  const database = getDatabase();
  
  let interval: number;
  let limit: number;
  
  switch (range) {
    case '1h':
      interval = 30000; // 30 seconds
      limit = 120;
      break;
    case '6h':
      interval = 180000; // 3 minutes
      limit = 120;
      break;
    case '24h':
      interval = 720000; // 12 minutes
      limit = 120;
      break;
    case '7d':
      interval = 5040000; // 84 minutes
      limit = 120;
      break;
    default:
      interval = 30000;
      limit = 120;
  }

  const cutoff = Date.now() - (
    range === '1h' ? 3600000 :
    range === '6h' ? 21600000 :
    range === '24h' ? 86400000 :
    range === '7d' ? 604800000 : 3600000
  );

  const rows = database.prepare(`
    SELECT 
      timestamp,
      cpu_load,
      memory_percent,
      temp_cpu,
      uptime,
      network_rx,
      network_tx,
      memory_active,
      memory_total
    FROM system_metrics
    WHERE timestamp >= @cutoff
    ORDER BY timestamp ASC
  `).all({ cutoff });

  // Aggregate data points to reduce payload
  const aggregated: any[] = [];
  let bucket: any = null;
  let bucketCount = 0;

  rows.forEach((row: any) => {
    if (!bucket || row.timestamp - bucket.timestamp >= interval) {
      if (bucket) {
        // Average the bucket values
        bucket.cpu_load = bucket.cpu_load / bucketCount;
        bucket.memory_percent = bucket.memory_percent / bucketCount;
        aggregated.push(bucket);
      }
      bucket = { ...row };
      bucketCount = 1;
    } else {
      bucket.cpu_load += row.cpu_load;
      bucket.memory_percent += row.memory_percent;
      bucketCount++;
    }
  });

  if (bucket) {
    bucket.cpu_load = bucket.cpu_load / bucketCount;
    bucket.memory_percent = bucket.memory_percent / bucketCount;
    aggregated.push(bucket);
  }

  return aggregated;
}

export function getRecentMetrics(count: number = 50) {
  const database = getDatabase();
  return database.prepare(`
    SELECT * FROM system_metrics
    ORDER BY timestamp DESC
    LIMIT @count
  `).all({ count });
}

export function getAlerts(limit: number = 20, acknowledged: boolean = false) {
  const database = getDatabase();
  return database.prepare(`
    SELECT * FROM alerts
    WHERE acknowledged = @ack
    ORDER BY timestamp DESC
    LIMIT @limit
  `).all({ ack: acknowledged ? 1 : 0, limit });
}

export function acknowledgeAlert(id: number) {
  const database = getDatabase();
  return database.prepare(`
    UPDATE alerts SET acknowledged = 1
    WHERE id = @id
  `).run({ id });
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
