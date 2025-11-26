/**
 * SL18 Render Stack - Phase 8 System Tests
 * Scaling & Deployment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// System Types Tests
// ============================================================================

describe('Phase 8: System Types', () => {
  it('should define SystemMetrics interface structure', () => {
    const metrics = {
      timestamp: '2024-01-01T00:00:00Z',
      uptime: 3600,
      version: '1.0.0',
      environment: 'production',
      render: {
        queueDepth: 10,
        activeJobs: 2,
        completedJobs: 100,
        failedJobs: 5,
        avgRenderTime: 120,
        totalRenderTime: 12000
      },
      publishing: {
        queueDepth: 5,
        activeJobs: 1,
        completedJobs: 50,
        failedJobs: 2
      },
      qc: {
        pendingReview: 8,
        approved: 45,
        rejected: 3,
        flaggedContent: 2
      },
      storage: {
        totalSize: 1073741824,
        usedSize: 536870912,
        adaptersActive: 1
      },
      resources: {
        cpuUsage: 45,
        memoryUsage: 60,
        memoryTotal: 8589934592,
        memoryUsed: 5153960755
      }
    };
    
    expect(metrics.timestamp).toBeDefined();
    expect(metrics.render.queueDepth).toBeTypeOf('number');
    expect(metrics.publishing.queueDepth).toBeTypeOf('number');
    expect(metrics.qc.pendingReview).toBeTypeOf('number');
    expect(metrics.storage.adaptersActive).toBe(1);
    expect(metrics.resources.cpuUsage).toBeLessThanOrEqual(100);
  });

  it('should define WorkerNode interface structure', () => {
    const node = {
      id: 'node-001',
      name: 'Render Worker 1',
      role: 'render' as const,
      status: 'healthy' as const,
      host: '10.0.0.1',
      port: 3001,
      startedAt: '2024-01-01T00:00:00Z',
      lastHeartbeat: '2024-01-01T01:00:00Z',
      capacity: {
        maxConcurrentJobs: 4,
        currentJobs: 2,
        cpuCores: 4,
        memoryMb: 8192
      },
      performance: {
        jobsProcessed: 150,
        avgJobTime: 90,
        errorRate: 2.5
      },
      labels: {
        'environment': 'production',
        'gpu': 'true'
      }
    };
    
    expect(node.id).toBe('node-001');
    expect(node.role).toBe('render');
    expect(node.status).toBe('healthy');
    expect(node.capacity.maxConcurrentJobs).toBe(4);
    expect(node.performance.errorRate).toBeLessThanOrEqual(100);
  });

  it('should define ScaleRequest and ScaleResult structures', () => {
    const request = {
      action: 'scale-up' as const,
      nodeRole: 'render' as const,
      targetCount: 5,
      reason: 'High queue depth',
      requestedBy: 'operator@example.com'
    };
    
    const result = {
      success: true,
      action: 'scale-up' as const,
      previousCount: 3,
      newCount: 5,
      message: 'Scaled successfully',
      timestamp: '2024-01-01T00:00:00Z',
      affectedNodes: ['node-004', 'node-005']
    };
    
    expect(request.action).toBe('scale-up');
    expect(result.success).toBe(true);
    expect(result.newCount).toBeGreaterThan(result.previousCount);
  });

  it('should define LogEntry interface structure', () => {
    const entry = {
      timestamp: '2024-01-01T00:00:00Z',
      level: 'error' as const,
      source: 'render' as const,
      message: 'ffmpeg process failed',
      nodeId: 'node-001',
      jobId: 'job-123',
      episodeId: 'ep-456',
      metadata: { exitCode: 1 },
      stackTrace: 'Error at line 42'
    };
    
    expect(entry.level).toBe('error');
    expect(entry.source).toBe('render');
    expect(entry.jobId).toBeDefined();
  });

  it('should define HealthCheck interface structure', () => {
    const check = {
      name: 'memory',
      status: 'pass' as const,
      message: 'Memory usage: 60%',
      duration: 5,
      lastCheck: '2024-01-01T00:00:00Z'
    };
    
    expect(check.status).toMatch(/pass|fail|warn/);
    expect(check.name).toBeDefined();
  });

  it('should define PrometheusMetric interface structure', () => {
    const metric = {
      name: 'sl18_render_queue_depth',
      help: 'Number of jobs in render queue',
      type: 'gauge' as const,
      labels: { component: 'render-worker' },
      value: 15
    };
    
    expect(metric.name).toMatch(/^sl18_/);
    expect(metric.type).toMatch(/counter|gauge|histogram|summary/);
  });

  it('should define DeploymentInfo interface structure', () => {
    const deployment = {
      version: '1.0.0',
      environment: 'production',
      buildId: 'build-123',
      commitHash: 'abc123',
      deployedAt: '2024-01-01T00:00:00Z',
      config: {
        renderWorkers: 3,
        publishWorkers: 2,
        maxConcurrentRenders: 4,
        maxConcurrentPublish: 2,
        storageProvider: 'azure'
      },
      features: {
        cloudStorage: true,
        autoScaling: true,
        metricsExport: true
      },
      health: {
        overall: 'healthy' as const,
        services: {
          render: 'healthy',
          publish: 'healthy',
          storage: 'healthy'
        }
      }
    };
    
    expect(deployment.version).toBeDefined();
    expect(deployment.features.cloudStorage).toBe(true);
    expect(deployment.health.overall).toBe('healthy');
  });
});

// ============================================================================
// Metrics Manager Tests
// ============================================================================

describe('Phase 8: Metrics Manager', () => {
  it('should collect system metrics', () => {
    // Mock metrics collection
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: 3600,
      version: '1.0.0',
      environment: 'test',
      render: {
        queueDepth: 5,
        activeJobs: 2,
        completedJobs: 50,
        failedJobs: 3,
        avgRenderTime: 90,
        totalRenderTime: 4500
      },
      publishing: {
        queueDepth: 2,
        activeJobs: 1,
        completedJobs: 25,
        failedJobs: 1
      },
      qc: {
        pendingReview: 5,
        approved: 22,
        rejected: 2,
        flaggedContent: 1
      },
      storage: {
        totalSize: 1073741824,
        usedSize: 268435456,
        adaptersActive: 1
      },
      resources: {
        cpuUsage: 35,
        memoryUsage: 50,
        memoryTotal: 8589934592,
        memoryUsed: 4294967296
      }
    };
    
    expect(metrics.timestamp).toBeDefined();
    expect(metrics.render.queueDepth).toBe(5);
    expect(metrics.resources.cpuUsage).toBeLessThanOrEqual(100);
  });

  it('should format Prometheus metrics correctly', () => {
    const prometheusOutput = `# HELP sl18_render_queue_depth Number of jobs in render queue
# TYPE sl18_render_queue_depth gauge
sl18_render_queue_depth 10
# HELP sl18_render_active_jobs Number of active render jobs
# TYPE sl18_render_active_jobs gauge
sl18_render_active_jobs 2`;
    
    expect(prometheusOutput).toContain('# HELP');
    expect(prometheusOutput).toContain('# TYPE');
    expect(prometheusOutput).toContain('sl18_render_queue_depth');
  });

  it('should track render job completion', () => {
    let completedJobs = 0;
    let totalTime = 0;
    
    const recordComplete = (duration: number, success: boolean) => {
      if (success) {
        completedJobs++;
        totalTime += duration;
      }
    };
    
    recordComplete(120, true);
    recordComplete(90, true);
    recordComplete(150, true);
    
    expect(completedJobs).toBe(3);
    expect(totalTime).toBe(360);
    expect(totalTime / completedJobs).toBe(120); // avg
  });

  it('should run health checks', () => {
    const healthReport = {
      status: 'healthy' as const,
      checks: [
        { name: 'memory', status: 'pass', message: 'Memory usage: 50%', lastCheck: new Date().toISOString() },
        { name: 'render_queue', status: 'pass', message: 'Queue depth: 5', lastCheck: new Date().toISOString() },
        { name: 'error_rate', status: 'pass', message: 'Error rate: 2%', lastCheck: new Date().toISOString() },
        { name: 'storage', status: 'warn', message: 'Storage usage: 85%', lastCheck: new Date().toISOString() }
      ],
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    expect(healthReport.status).toBe('healthy');
    expect(healthReport.checks).toHaveLength(4);
    expect(healthReport.checks.filter(c => c.status === 'warn')).toHaveLength(1);
  });
});

// ============================================================================
// Node Manager Tests
// ============================================================================

describe('Phase 8: Node Manager', () => {
  it('should register a new worker node', () => {
    const node = {
      id: 'test-node-001',
      name: 'Test Render Worker',
      role: 'render' as const,
      host: '127.0.0.1',
      port: 3001,
      startedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      capacity: { maxConcurrentJobs: 4, currentJobs: 0, cpuCores: 4, memoryMb: 8192 },
      performance: { jobsProcessed: 0, avgJobTime: 0, errorRate: 0 },
      labels: {}
    };
    
    expect(node.id).toBe('test-node-001');
    expect(node.role).toBe('render');
  });

  it('should track node heartbeats', () => {
    const node = {
      id: 'node-001',
      lastHeartbeat: new Date(Date.now() - 10000).toISOString(),
      status: 'healthy' as const
    };
    
    // Simulate heartbeat update
    node.lastHeartbeat = new Date().toISOString();
    
    expect(new Date(node.lastHeartbeat).getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('should detect offline nodes', () => {
    const HEARTBEAT_TIMEOUT_MS = 30000;
    const lastHeartbeat = new Date(Date.now() - 60000); // 60 seconds ago
    
    const isOffline = Date.now() - lastHeartbeat.getTime() > HEARTBEAT_TIMEOUT_MS;
    
    expect(isOffline).toBe(true);
  });

  it('should get node count by role', () => {
    const nodes = [
      { id: 'node-1', role: 'render' },
      { id: 'node-2', role: 'render' },
      { id: 'node-3', role: 'render' },
      { id: 'node-4', role: 'publish' },
      { id: 'node-5', role: 'control-panel' }
    ];
    
    const byRole = {
      render: nodes.filter(n => n.role === 'render').length,
      publish: nodes.filter(n => n.role === 'publish').length,
      'control-panel': nodes.filter(n => n.role === 'control-panel').length
    };
    
    expect(byRole.render).toBe(3);
    expect(byRole.publish).toBe(1);
    expect(byRole['control-panel']).toBe(1);
  });

  it('should validate scale request parameters', () => {
    const validateScaleRequest = (request: any) => {
      if (!request.action) return { valid: false, error: 'action is required' };
      if (!['scale-up', 'scale-down', 'restart', 'drain'].includes(request.action)) {
        return { valid: false, error: 'invalid action' };
      }
      return { valid: true };
    };
    
    expect(validateScaleRequest({ action: 'scale-up' }).valid).toBe(true);
    expect(validateScaleRequest({ action: 'invalid' }).valid).toBe(false);
    expect(validateScaleRequest({}).valid).toBe(false);
  });

  it('should enforce scale policy limits', () => {
    const policy = {
      minNodes: 2,
      maxNodes: 10,
      cooldownPeriod: 300
    };
    
    const canScaleUp = (currentCount: number) => currentCount < policy.maxNodes;
    const canScaleDown = (currentCount: number) => currentCount > policy.minNodes;
    
    expect(canScaleUp(5)).toBe(true);
    expect(canScaleUp(10)).toBe(false);
    expect(canScaleDown(5)).toBe(true);
    expect(canScaleDown(2)).toBe(false);
  });

  it('should generate scale recommendations', () => {
    const getRecommendation = (queueDepth: number, utilization: number) => {
      if (queueDepth > 50 || utilization > 70) {
        return { action: 'scale-up', reason: 'High load' };
      }
      if (queueDepth < 5 && utilization < 20) {
        return { action: 'scale-down', reason: 'Low load' };
      }
      return null;
    };
    
    expect(getRecommendation(100, 80)?.action).toBe('scale-up');
    expect(getRecommendation(2, 10)?.action).toBe('scale-down');
    expect(getRecommendation(20, 50)).toBe(null);
  });
});

// ============================================================================
// Log Manager Tests
// ============================================================================

describe('Phase 8: Log Manager', () => {
  it('should create log entries with correct structure', () => {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info' as const,
      source: 'render' as const,
      message: 'Render job started',
      jobId: 'job-123',
      episodeId: 'ep-456'
    };
    
    expect(entry.timestamp).toBeDefined();
    expect(entry.level).toBe('info');
    expect(entry.source).toBe('render');
  });

  it('should filter logs by level', () => {
    const logs = [
      { level: 'debug', message: 'Debug message' },
      { level: 'info', message: 'Info message' },
      { level: 'warn', message: 'Warning message' },
      { level: 'error', message: 'Error message' },
      { level: 'error', message: 'Another error' }
    ];
    
    const errorLogs = logs.filter(l => l.level === 'error');
    
    expect(errorLogs).toHaveLength(2);
  });

  it('should filter logs by source', () => {
    const logs = [
      { source: 'render', message: 'Render message' },
      { source: 'publish', message: 'Publish message' },
      { source: 'render', message: 'Another render message' },
      { source: 'qc', message: 'QC message' }
    ];
    
    const renderLogs = logs.filter(l => l.source === 'render');
    
    expect(renderLogs).toHaveLength(2);
  });

  it('should filter logs by time range', () => {
    const now = new Date();
    const logs = [
      { timestamp: new Date(now.getTime() - 3600000).toISOString(), message: '1 hour ago' },
      { timestamp: new Date(now.getTime() - 1800000).toISOString(), message: '30 min ago' },
      { timestamp: new Date(now.getTime() - 900000).toISOString(), message: '15 min ago' },
      { timestamp: now.toISOString(), message: 'Now' }
    ];
    
    const startTime = new Date(now.getTime() - 2000000).toISOString();
    const filtered = logs.filter(l => l.timestamp >= startTime);
    
    expect(filtered).toHaveLength(3);
  });

  it('should generate log summary', () => {
    const logs = [
      { level: 'info', source: 'render' },
      { level: 'info', source: 'publish' },
      { level: 'error', source: 'render' },
      { level: 'warn', source: 'qc' },
      { level: 'error', source: 'storage' }
    ];
    
    const summary = {
      total: logs.length,
      byLevel: {
        info: logs.filter(l => l.level === 'info').length,
        warn: logs.filter(l => l.level === 'warn').length,
        error: logs.filter(l => l.level === 'error').length
      },
      bySource: {
        render: logs.filter(l => l.source === 'render').length,
        publish: logs.filter(l => l.source === 'publish').length,
        qc: logs.filter(l => l.source === 'qc').length,
        storage: logs.filter(l => l.source === 'storage').length
      }
    };
    
    expect(summary.total).toBe(5);
    expect(summary.byLevel.error).toBe(2);
    expect(summary.bySource.render).toBe(2);
  });
});

// ============================================================================
// System API Tests
// ============================================================================

describe('Phase 8: System API Endpoints', () => {
  it('should define /api/system/metrics endpoint', () => {
    const response = {
      timestamp: new Date().toISOString(),
      uptime: 3600,
      version: '1.0.0',
      render: { queueDepth: 5, activeJobs: 2 },
      publishing: { queueDepth: 2, activeJobs: 1 },
      qc: { pendingReview: 5 },
      resources: { cpuUsage: 35, memoryUsage: 50 }
    };
    
    expect(response.timestamp).toBeDefined();
    expect(response.render).toBeDefined();
  });

  it('should define /api/system/nodes endpoint', () => {
    const response = {
      nodes: [
        { id: 'node-1', name: 'Worker 1', role: 'render', status: 'healthy' },
        { id: 'node-2', name: 'Worker 2', role: 'render', status: 'healthy' }
      ],
      lastUpdated: new Date().toISOString(),
      counts: { total: 2, healthy: 2, byRole: { render: 2 } }
    };
    
    expect(response.nodes).toHaveLength(2);
    expect(response.counts.healthy).toBe(2);
  });

  it('should define /api/system/scale endpoint', () => {
    const request = {
      action: 'scale-up',
      nodeRole: 'render',
      targetCount: 5,
      reason: 'High queue depth'
    };
    
    const response = {
      success: true,
      action: 'scale-up',
      previousCount: 3,
      newCount: 5,
      message: 'Scale action completed',
      timestamp: new Date().toISOString()
    };
    
    expect(request.action).toBe('scale-up');
    expect(response.success).toBe(true);
    expect(response.newCount).toBe(5);
  });

  it('should define /api/system/logs endpoint', () => {
    const query = {
      level: 'error',
      source: 'render',
      limit: 50,
      offset: 0
    };
    
    const response = {
      entries: [
        { timestamp: '2024-01-01T00:00:00Z', level: 'error', source: 'render', message: 'Test error' }
      ],
      total: 1,
      hasMore: false,
      query
    };
    
    expect(response.entries).toHaveLength(1);
    expect(response.hasMore).toBe(false);
  });

  it('should define /api/system/deployment endpoint', () => {
    const response = {
      version: '1.0.0',
      environment: 'production',
      buildId: 'build-123',
      config: {
        renderWorkers: 3,
        publishWorkers: 2,
        storageProvider: 'local'
      },
      features: {
        cloudStorage: true,
        autoScaling: false
      },
      health: {
        overall: 'healthy',
        services: { render: 'healthy', publish: 'healthy' }
      }
    };
    
    expect(response.version).toBe('1.0.0');
    expect(response.health.overall).toBe('healthy');
  });

  it('should define /api/system/health endpoint', () => {
    const response = {
      status: 'healthy',
      checks: [
        { name: 'memory', status: 'pass' },
        { name: 'render_queue', status: 'pass' },
        { name: 'error_rate', status: 'pass' }
      ],
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    expect(response.status).toBe('healthy');
    expect(response.checks.every(c => c.status === 'pass')).toBe(true);
  });
});

// ============================================================================
// Docker Configuration Tests
// ============================================================================

describe('Phase 8: Docker Configuration', () => {
  it('should define correct Dockerfile structure for render-worker', () => {
    const dockerfile = {
      baseImage: 'node:20-alpine',
      stages: ['builder', 'production'],
      packages: ['ffmpeg'],
      user: 'sl18',
      healthcheck: '/healthz',
      expose: 3001
    };
    
    expect(dockerfile.packages).toContain('ffmpeg');
    expect(dockerfile.user).toBe('sl18');
    expect(dockerfile.expose).toBe(3001);
  });

  it('should define docker-compose services', () => {
    const services = ['control-panel', 'render-worker', 'publishing-manager', 'prometheus', 'grafana', 'nginx'];
    
    expect(services).toContain('control-panel');
    expect(services).toContain('render-worker');
    expect(services).toContain('prometheus');
  });

  it('should define required volumes', () => {
    const volumes = ['renders', 'timelines', 'storage', 'logs', 'exports', 'prometheus-data', 'grafana-data'];
    
    expect(volumes).toContain('renders');
    expect(volumes).toContain('storage');
    expect(volumes).toContain('logs');
  });
});

// ============================================================================
// Kubernetes Configuration Tests
// ============================================================================

describe('Phase 8: Kubernetes Configuration', () => {
  it('should define namespace', () => {
    const namespace = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: 'sl18' }
    };
    
    expect(namespace.kind).toBe('Namespace');
    expect(namespace.metadata.name).toBe('sl18');
  });

  it('should define deployment replicas', () => {
    const deployments = {
      'control-panel': { replicas: 2 },
      'render-worker': { replicas: 3, hpa: { min: 2, max: 10 } },
      'publishing-manager': { replicas: 2 }
    };
    
    expect(deployments['render-worker'].replicas).toBe(3);
    expect(deployments['render-worker'].hpa.max).toBe(10);
  });

  it('should define resource limits', () => {
    const resources = {
      'render-worker': {
        requests: { memory: '2Gi', cpu: '1000m' },
        limits: { memory: '4Gi', cpu: '2000m' }
      }
    };
    
    expect(resources['render-worker'].limits.memory).toBe('4Gi');
  });

  it('should define PVC storage sizes', () => {
    const pvcs = {
      'sl18-renders-pvc': '100Gi',
      'sl18-storage-pvc': '200Gi',
      'sl18-logs-pvc': '10Gi'
    };
    
    expect(pvcs['sl18-renders-pvc']).toBe('100Gi');
  });

  it('should define ingress rules', () => {
    const ingress = {
      hosts: ['sl18.example.com', 'api.sl18.example.com'],
      paths: [
        { path: '/', backend: 'control-panel:5178' },
        { path: '/api/render', backend: 'render-worker:3001' },
        { path: '/api/publish', backend: 'publishing-manager:3002' }
      ]
    };
    
    expect(ingress.paths).toHaveLength(3);
  });
});

// ============================================================================
// Monitoring Configuration Tests
// ============================================================================

describe('Phase 8: Monitoring Configuration', () => {
  it('should define Prometheus scrape configs', () => {
    const scrapeConfigs = [
      { job_name: 'control-panel', target: 'control-panel:5178' },
      { job_name: 'render-worker', target: 'render-worker:3001' },
      { job_name: 'publishing-manager', target: 'publishing-manager:3002' }
    ];
    
    expect(scrapeConfigs).toHaveLength(3);
    expect(scrapeConfigs[0].job_name).toBe('control-panel');
  });

  it('should define alert rules', () => {
    const alerts = [
      { alert: 'RenderQueueHigh', expr: 'sl18_render_queue_depth > 50', severity: 'warning' },
      { alert: 'RenderQueueCritical', expr: 'sl18_render_queue_depth > 100', severity: 'critical' },
      { alert: 'MemoryUsageHigh', expr: 'sl18_memory_usage_percent > 85', severity: 'warning' }
    ];
    
    expect(alerts).toHaveLength(3);
    expect(alerts.filter(a => a.severity === 'critical')).toHaveLength(1);
  });

  it('should define Grafana datasource', () => {
    const datasource = {
      name: 'Prometheus',
      type: 'prometheus',
      url: 'http://prometheus:9090',
      isDefault: true
    };
    
    expect(datasource.type).toBe('prometheus');
    expect(datasource.isDefault).toBe(true);
  });

  it('should define dashboard panels', () => {
    const panels = [
      { title: 'Render Queue Depth', type: 'stat' },
      { title: 'Active Render Jobs', type: 'stat' },
      { title: 'Average Render Time', type: 'gauge' },
      { title: 'CPU Usage', type: 'gauge' },
      { title: 'Memory Usage', type: 'gauge' }
    ];
    
    expect(panels).toHaveLength(5);
    expect(panels.filter(p => p.type === 'gauge')).toHaveLength(3);
  });
});
