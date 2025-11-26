/**
 * SL18 Render Stack - System Types
 * Phase 8: Scaling & Deployment
 * 
 * Type definitions for system monitoring, metrics, and scaling operations.
 */

// ============================================================================
// System Metrics Types
// ============================================================================

export interface SystemMetrics {
  timestamp: string;
  uptime: number; // seconds
  version: string;
  environment: string;
  
  // Render metrics
  render: {
    queueDepth: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgRenderTime: number; // seconds
    totalRenderTime: number; // seconds
  };
  
  // Publishing metrics
  publishing: {
    queueDepth: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
  };
  
  // QC metrics
  qc: {
    pendingReview: number;
    approved: number;
    rejected: number;
    flaggedContent: number;
  };
  
  // Storage metrics
  storage: {
    totalSize: number; // bytes
    usedSize: number; // bytes
    adaptersActive: number;
  };
  
  // Resource metrics
  resources: {
    cpuUsage: number; // percentage 0-100
    memoryUsage: number; // percentage 0-100
    memoryTotal: number; // bytes
    memoryUsed: number; // bytes
  };
}

// ============================================================================
// Worker Node Types
// ============================================================================

export type NodeStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';
export type NodeRole = 'render' | 'publish' | 'control-panel' | 'mixed';

export interface WorkerNode {
  id: string;
  name: string;
  role: NodeRole;
  status: NodeStatus;
  host: string;
  port: number;
  startedAt: string;
  lastHeartbeat: string;
  
  // Capacity
  capacity: {
    maxConcurrentJobs: number;
    currentJobs: number;
    cpuCores: number;
    memoryMb: number;
  };
  
  // Performance
  performance: {
    jobsProcessed: number;
    avgJobTime: number; // seconds
    errorRate: number; // percentage 0-100
  };
  
  // Labels for scheduling
  labels: Record<string, string>;
}

export interface NodeRegistry {
  nodes: WorkerNode[];
  lastUpdated: string;
}

// ============================================================================
// Scaling Types
// ============================================================================

export type ScaleAction = 'scale-up' | 'scale-down' | 'restart' | 'drain';

export interface ScaleRequest {
  action: ScaleAction;
  nodeRole?: NodeRole;
  targetCount?: number;
  reason?: string;
  requestedBy?: string;
}

export interface ScaleResult {
  success: boolean;
  action: ScaleAction;
  previousCount: number;
  newCount: number;
  message: string;
  timestamp: string;
  affectedNodes?: string[];
}

export interface ScalePolicy {
  minNodes: number;
  maxNodes: number;
  targetUtilization: number; // percentage 0-100
  scaleUpThreshold: number; // queue depth or utilization
  scaleDownThreshold: number;
  cooldownPeriod: number; // seconds
}

// ============================================================================
// Logging Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogSource = 'render' | 'publish' | 'qc' | 'storage' | 'system' | 'api';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  nodeId?: string;
  jobId?: string;
  episodeId?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

export interface LogQuery {
  level?: LogLevel;
  source?: LogSource;
  nodeId?: string;
  jobId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface LogQueryResult {
  entries: LogEntry[];
  total: number;
  hasMore: boolean;
  query: LogQuery;
}

// ============================================================================
// Deployment Types
// ============================================================================

export interface DeploymentInfo {
  version: string;
  environment: string;
  buildId?: string;
  commitHash?: string;
  deployedAt: string;
  
  // Configuration
  config: {
    renderWorkers: number;
    publishWorkers: number;
    maxConcurrentRenders: number;
    maxConcurrentPublish: number;
    storageProvider: string;
    ffmpegPath?: string;
  };
  
  // Feature flags
  features: Record<string, boolean>;
  
  // Health
  health: {
    overall: NodeStatus;
    services: Record<string, NodeStatus>;
  };
}

// ============================================================================
// Prometheus Metrics Types (for export)
// ============================================================================

export interface PrometheusMetric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels?: Record<string, string>;
  value: number;
}

export interface PrometheusExport {
  metrics: PrometheusMetric[];
  timestamp: string;
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number; // ms
  lastCheck: string;
}

export interface HealthReport {
  status: NodeStatus;
  checks: HealthCheck[];
  timestamp: string;
  version: string;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: 'ip' | 'user' | 'api-key';
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: string;
  limit: number;
}
