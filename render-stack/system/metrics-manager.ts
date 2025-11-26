/**
 * SL18 Render Stack - System Metrics Manager
 * Phase 8: Scaling & Deployment
 * 
 * Collects and aggregates system metrics for monitoring and scaling decisions.
 */

import type {
  SystemMetrics,
  PrometheusMetric,
  PrometheusExport,
  HealthCheck,
  HealthReport,
  NodeStatus
} from './system.types.js';

// ============================================================================
// Constants
// ============================================================================

const VERSION = process.env.SL18_VERSION || '1.0.0';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const START_TIME = Date.now();

// ============================================================================
// Metrics State (in-memory for MVP)
// ============================================================================

interface MetricsState {
  render: {
    queued: number;
    active: number;
    completed: number;
    failed: number;
    totalTime: number;
    count: number;
  };
  publishing: {
    queued: number;
    active: number;
    completed: number;
    failed: number;
  };
  qc: {
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
  };
  storage: {
    totalSize: number;
    usedSize: number;
    adaptersActive: number;
  };
}

const metricsState: MetricsState = {
  render: { queued: 0, active: 0, completed: 0, failed: 0, totalTime: 0, count: 0 },
  publishing: { queued: 0, active: 0, completed: 0, failed: 0 },
  qc: { pending: 0, approved: 0, rejected: 0, flagged: 0 },
  storage: { totalSize: 0, usedSize: 0, adaptersActive: 1 }
};

// ============================================================================
// Metrics Collection Functions
// ============================================================================

export function updateRenderMetrics(update: Partial<MetricsState['render']>): void {
  Object.assign(metricsState.render, update);
}

export function updatePublishingMetrics(update: Partial<MetricsState['publishing']>): void {
  Object.assign(metricsState.publishing, update);
}

export function updateQCMetrics(update: Partial<MetricsState['qc']>): void {
  Object.assign(metricsState.qc, update);
}

export function updateStorageMetrics(update: Partial<MetricsState['storage']>): void {
  Object.assign(metricsState.storage, update);
}

export function recordRenderComplete(duration: number, success: boolean): void {
  if (success) {
    metricsState.render.completed++;
    metricsState.render.totalTime += duration;
    metricsState.render.count++;
  } else {
    metricsState.render.failed++;
  }
  metricsState.render.active = Math.max(0, metricsState.render.active - 1);
}

export function recordPublishComplete(success: boolean): void {
  if (success) {
    metricsState.publishing.completed++;
  } else {
    metricsState.publishing.failed++;
  }
  metricsState.publishing.active = Math.max(0, metricsState.publishing.active - 1);
}

// ============================================================================
// Resource Metrics
// ============================================================================

function getResourceMetrics(): { cpuUsage: number; memoryUsage: number; memoryTotal: number; memoryUsed: number } {
  // In-process memory metrics
  const memUsage = process.memoryUsage();
  const heapUsed = memUsage.heapUsed;
  const heapTotal = memUsage.heapTotal;
  const memoryUsage = heapTotal > 0 ? Math.round((heapUsed / heapTotal) * 100) : 0;
  
  // CPU usage approximation (would need proper monitoring in production)
  const cpuUsage = Math.round(Math.random() * 30 + 10); // Placeholder for demo
  
  return {
    cpuUsage,
    memoryUsage,
    memoryTotal: heapTotal,
    memoryUsed: heapUsed
  };
}

// ============================================================================
// Aggregated Metrics
// ============================================================================

export function getSystemMetrics(): SystemMetrics {
  const resources = getResourceMetrics();
  const avgRenderTime = metricsState.render.count > 0 
    ? metricsState.render.totalTime / metricsState.render.count 
    : 0;
  
  return {
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    version: VERSION,
    environment: ENVIRONMENT,
    
    render: {
      queueDepth: metricsState.render.queued,
      activeJobs: metricsState.render.active,
      completedJobs: metricsState.render.completed,
      failedJobs: metricsState.render.failed,
      avgRenderTime,
      totalRenderTime: metricsState.render.totalTime
    },
    
    publishing: {
      queueDepth: metricsState.publishing.queued,
      activeJobs: metricsState.publishing.active,
      completedJobs: metricsState.publishing.completed,
      failedJobs: metricsState.publishing.failed
    },
    
    qc: {
      pendingReview: metricsState.qc.pending,
      approved: metricsState.qc.approved,
      rejected: metricsState.qc.rejected,
      flaggedContent: metricsState.qc.flagged
    },
    
    storage: {
      totalSize: metricsState.storage.totalSize,
      usedSize: metricsState.storage.usedSize,
      adaptersActive: metricsState.storage.adaptersActive
    },
    
    resources
  };
}

// ============================================================================
// Prometheus Export
// ============================================================================

export function getPrometheusMetrics(): PrometheusExport {
  const metrics = getSystemMetrics();
  const prometheusMetrics: PrometheusMetric[] = [];
  
  // Render metrics
  prometheusMetrics.push(
    { name: 'sl18_render_queue_depth', help: 'Number of jobs in render queue', type: 'gauge', value: metrics.render.queueDepth },
    { name: 'sl18_render_active_jobs', help: 'Number of active render jobs', type: 'gauge', value: metrics.render.activeJobs },
    { name: 'sl18_render_completed_total', help: 'Total completed render jobs', type: 'counter', value: metrics.render.completedJobs },
    { name: 'sl18_render_failed_total', help: 'Total failed render jobs', type: 'counter', value: metrics.render.failedJobs },
    { name: 'sl18_render_avg_time_seconds', help: 'Average render time in seconds', type: 'gauge', value: metrics.render.avgRenderTime }
  );
  
  // Publishing metrics
  prometheusMetrics.push(
    { name: 'sl18_publish_queue_depth', help: 'Number of jobs in publish queue', type: 'gauge', value: metrics.publishing.queueDepth },
    { name: 'sl18_publish_active_jobs', help: 'Number of active publish jobs', type: 'gauge', value: metrics.publishing.activeJobs },
    { name: 'sl18_publish_completed_total', help: 'Total completed publish jobs', type: 'counter', value: metrics.publishing.completedJobs },
    { name: 'sl18_publish_failed_total', help: 'Total failed publish jobs', type: 'counter', value: metrics.publishing.failedJobs }
  );
  
  // QC metrics
  prometheusMetrics.push(
    { name: 'sl18_qc_pending_review', help: 'Episodes pending QC review', type: 'gauge', value: metrics.qc.pendingReview },
    { name: 'sl18_qc_approved_total', help: 'Total approved episodes', type: 'counter', value: metrics.qc.approved },
    { name: 'sl18_qc_rejected_total', help: 'Total rejected episodes', type: 'counter', value: metrics.qc.rejected },
    { name: 'sl18_qc_flagged_content', help: 'Episodes flagged for content issues', type: 'gauge', value: metrics.qc.flaggedContent }
  );
  
  // Resource metrics
  prometheusMetrics.push(
    { name: 'sl18_uptime_seconds', help: 'System uptime in seconds', type: 'counter', value: metrics.uptime },
    { name: 'sl18_cpu_usage_percent', help: 'CPU usage percentage', type: 'gauge', value: metrics.resources.cpuUsage },
    { name: 'sl18_memory_usage_percent', help: 'Memory usage percentage', type: 'gauge', value: metrics.resources.memoryUsage },
    { name: 'sl18_memory_used_bytes', help: 'Memory used in bytes', type: 'gauge', value: metrics.resources.memoryUsed }
  );
  
  return {
    metrics: prometheusMetrics,
    timestamp: metrics.timestamp
  };
}

export function formatPrometheusText(): string {
  const { metrics } = getPrometheusMetrics();
  const lines: string[] = [];
  
  for (const metric of metrics) {
    lines.push(`# HELP ${metric.name} ${metric.help}`);
    lines.push(`# TYPE ${metric.name} ${metric.type}`);
    
    if (metric.labels && Object.keys(metric.labels).length > 0) {
      const labelStr = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      lines.push(`${metric.name}{${labelStr}} ${metric.value}`);
    } else {
      lines.push(`${metric.name} ${metric.value}`);
    }
  }
  
  return lines.join('\n');
}

// ============================================================================
// Health Checks
// ============================================================================

export async function runHealthChecks(): Promise<HealthReport> {
  const checks: HealthCheck[] = [];
  const now = new Date().toISOString();
  
  // Memory check
  const resources = getResourceMetrics();
  checks.push({
    name: 'memory',
    status: resources.memoryUsage < 80 ? 'pass' : resources.memoryUsage < 95 ? 'warn' : 'fail',
    message: `Memory usage: ${resources.memoryUsage}%`,
    lastCheck: now
  });
  
  // Render queue check
  const renderQueueStatus = metricsState.render.queued < 100 ? 'pass' : metricsState.render.queued < 500 ? 'warn' : 'fail';
  checks.push({
    name: 'render_queue',
    status: renderQueueStatus,
    message: `Queue depth: ${metricsState.render.queued}`,
    lastCheck: now
  });
  
  // Error rate check
  const totalRenders = metricsState.render.completed + metricsState.render.failed;
  const errorRate = totalRenders > 0 ? (metricsState.render.failed / totalRenders) * 100 : 0;
  checks.push({
    name: 'error_rate',
    status: errorRate < 5 ? 'pass' : errorRate < 15 ? 'warn' : 'fail',
    message: `Error rate: ${errorRate.toFixed(1)}%`,
    lastCheck: now
  });
  
  // Storage check
  const storageUsage = metricsState.storage.totalSize > 0 
    ? (metricsState.storage.usedSize / metricsState.storage.totalSize) * 100 
    : 0;
  checks.push({
    name: 'storage',
    status: storageUsage < 80 ? 'pass' : storageUsage < 95 ? 'warn' : 'fail',
    message: `Storage usage: ${storageUsage.toFixed(1)}%`,
    lastCheck: now
  });
  
  // Determine overall status
  let overall: NodeStatus = 'healthy';
  if (checks.some(c => c.status === 'fail')) {
    overall = 'unhealthy';
  } else if (checks.some(c => c.status === 'warn')) {
    overall = 'degraded';
  }
  
  return {
    status: overall,
    checks,
    timestamp: now,
    version: VERSION
  };
}

// ============================================================================
// Export Index
// ============================================================================

export * from './system.types.js';
