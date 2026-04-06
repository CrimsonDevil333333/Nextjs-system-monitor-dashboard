import { getRecentMetrics, insertAlert } from './database';

interface Prediction {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  details?: any;
}

/**
 * Analyzes recent metrics and generates predictions/alerts
 */
export function generatePredictions(): Prediction[] {
  const predictions: Prediction[] = [];
  
  try {
    // Get recent metrics for analysis
    const metrics = getRecentMetrics(100); // Last 100 data points
    
    if (metrics.length < 10) {
      // Not enough data for meaningful analysis
      return predictions;
    }

    // Reverse to get chronological order
    metrics.reverse();

    predictions.push(...analyzeMemoryLeaks(metrics));
    predictions.push(...analyzeTemperatureTrends(metrics));
    predictions.push(...analyzeDiskFillRate(metrics));
    predictions.push(...analyzeResourceAnomalies(metrics));
    
  } catch (error) {
    console.error('Error generating predictions:', error);
  }

  return predictions;
}

/**
 * Detect potential memory leaks by analyzing upward trends
 */
function analyzeMemoryLeaks(metrics: any[]): Prediction[] {
  const predictions: Prediction[] = [];
  
  if (metrics.length < 20) return predictions;

  // Get last 20 measurements
  const recent = metrics.slice(-20);
  const memoryPercents = recent.map(m => m.memory_percent);
  
  // Calculate trend (simple linear regression)
  const trend = calculateTrend(memoryPercents);
  
  // If memory is consistently increasing (>0.5% per measurement)
  if (trend.slope > 0.5 && trend.rSquared > 0.7) {
    const currentMem = memoryPercents[memoryPercents.length - 1];
    const projectedHours = (100 - currentMem) / (trend.slope * 2); // 2 measurements per minute
    
    predictions.push({
      id: 'memory-leak',
      type: 'memory_leak',
      severity: currentMem > 80 ? 'critical' : 'warning',
      title: 'Potential Memory Leak Detected',
      message: `Memory usage has been steadily increasing (${trend.slope.toFixed(2)}% per measurement). At current rate, system will run out of memory in ~${projectedHours.toFixed(1)} hours.`,
      timestamp: Date.now(),
      details: {
        currentMemory: currentMem.toFixed(1),
        trend: trend.slope.toFixed(2),
        confidence: (trend.rSquared * 100).toFixed(0) + '%',
        projectedHours: projectedHours.toFixed(1),
      },
    });
    
    // Insert alert into database if critical
    if (currentMem > 80) {
      insertAlert({
        type: 'memory_leak',
        severity: 'critical',
        message: predictions[predictions.length - 1].message,
        details: JSON.stringify(predictions[predictions.length - 1].details),
      });
    }
  }
  
  return predictions;
}

/**
 * Analyze temperature trends for thermal throttling prediction
 */
function analyzeTemperatureTrends(metrics: any[]): Prediction[] {
  const predictions: Prediction[] = [];
  
  if (metrics.length < 20) return predictions;
  
  const recent = metrics.slice(-20);
  const temps = recent.map(m => m.temp_cpu || 0).filter(t => t > 0);
  
  if (temps.length < 10) return predictions;
  
  const currentTemp = temps[temps.length - 1];
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const trend = calculateTrend(temps);
  
  // High temperature warning
  if (currentTemp > 75) {
    predictions.push({
      id: 'high-temp',
      type: 'temperature',
      severity: currentTemp > 80 ? 'critical' : 'warning',
      title: 'High CPU Temperature',
      message: `CPU temperature is ${currentTemp.toFixed(1)}°C. ${currentTemp > 80 ? 'Risk of thermal throttling!' : 'Monitor closely.'}`,
      timestamp: Date.now(),
      details: {
        currentTemp: currentTemp.toFixed(1),
        avgTemp: avgTemp.toFixed(1),
        maxRecorded: Math.max(...temps).toFixed(1),
      },
    });
  }
  
  // Rising temperature trend
  if (trend.slope > 1 && trend.rSquared > 0.6) {
    const projected = currentTemp + (trend.slope * 10); // 10 measurements ahead
    predictions.push({
      id: 'temp-trend',
      type: 'temperature_trend',
      severity: projected > 80 ? 'warning' : 'info',
      title: 'Rising Temperature Trend',
      message: `Temperature increasing at ${trend.slope.toFixed(2)}°C per measurement. Projected to reach ${projected.toFixed(1)}°C.`,
      timestamp: Date.now(),
      details: {
        currentTemp: currentTemp.toFixed(1),
        trend: trend.slope.toFixed(2),
        projected: projected.toFixed(1),
      },
    });
  }
  
  return predictions;
}

/**
 * Predict disk space exhaustion
 */
function analyzeDiskFillRate(metrics: any[]): Prediction[] {
  const predictions: Prediction[] = [];
  
  if (metrics.length < 30) return predictions;
  
  const recent = metrics.slice(-30);
  const diskUsage = recent.map(m => ({
    percent: (m.disk_used / m.disk_total) * 100,
    used: m.disk_used,
    total: m.disk_total,
  })).filter(d => d.total > 0);
  
  if (diskUsage.length < 10) return predictions;
  
  const percents = diskUsage.map(d => d.percent);
  const trend = calculateTrend(percents);
  const current = diskUsage[diskUsage.length - 1];
  
  // If disk is filling up
  if (trend.slope > 0.1 && trend.rSquared > 0.5) {
    const daysToFull = (100 - current.percent) / (trend.slope * 2); // 2 measurements per minute
    
    if (current.percent > 85 || daysToFull < 48) {
      predictions.push({
        id: 'disk-fill',
        type: 'disk_space',
        severity: current.percent > 90 ? 'critical' : 'warning',
        title: 'Disk Space Warning',
        message: `Disk is ${(current.percent).toFixed(1)}% full. At current fill rate, disk will be full in ~${daysToFull.toFixed(0)} hours.`,
        timestamp: Date.now(),
        details: {
          currentPercent: current.percent.toFixed(1),
          usedGB: (current.used / 1024 / 1024 / 1024).toFixed(1),
          totalGB: (current.total / 1024 / 1024 / 1024).toFixed(1),
          fillRate: trend.slope.toFixed(2),
          hoursToFull: daysToFull.toFixed(0),
        },
      });
    }
  }
  
  return predictions;
}

/**
 * Detect CPU and resource anomalies
 */
function analyzeResourceAnomalies(metrics: any[]): Prediction[] {
  const predictions: Prediction[] = [];
  
  if (metrics.length < 20) return predictions;
  
  const recent = metrics.slice(-20);
  const cpuLoads = recent.map(m => m.cpu_load);
  
  const avgCpu = cpuLoads.reduce((a, b) => a + b, 0) / cpuLoads.length;
  const maxCpu = Math.max(...cpuLoads);
  const currentCpu = cpuLoads[cpuLoads.length - 1];
  
  // Sustained high CPU
  if (avgCpu > 80 && currentCpu > 75) {
    predictions.push({
      id: 'high-cpu',
      type: 'cpu_load',
      severity: avgCpu > 90 ? 'critical' : 'warning',
      title: 'Sustained High CPU Load',
      message: `Average CPU load is ${avgCpu.toFixed(1)}% over the last 10 minutes. Current: ${currentCpu.toFixed(1)}%.`,
      timestamp: Date.now(),
      details: {
        average: avgCpu.toFixed(1),
        current: currentCpu.toFixed(1),
        max: maxCpu.toFixed(1),
      },
    });
  }
  
  return predictions;
}

/**
 * Simple linear regression to calculate trend
 */
function calculateTrend(values: number[]): { slope: number; rSquared: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, rSquared: 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
    sumY2 += values[i] * values[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  let ssTot = 0, ssRes = 0;
  
  for (let i = 0; i < n; i++) {
    const yPred = slope * i + intercept;
    ssTot += (values[i] - yMean) ** 2;
    ssRes += (values[i] - yPred) ** 2;
  }
  
  const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
  
  return { slope, rSquared };
}
