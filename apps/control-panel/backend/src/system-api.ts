/**
 * SL18 Control Panel - System API
 * Phase 8: Scaling & Deployment
 * 
 * REST API endpoints for system monitoring, metrics, and scaling operations.
 */

import { Router, type Request, type Response } from 'express';
import {
  getSystemMetrics,
  getPrometheusMetrics,
  formatPrometheusText,
  runHealthChecks
} from '../../../render-stack/system/metrics-manager.js';
import {
  getNodeRegistry,
  getNode,
  registerNode,
  deregisterNode,
  updateNodeHeartbeat,
  executeScale,
  getScaleRecommendation,
  getNodeCount
} from '../../../render-stack/system/node-manager.js';
import {
  queryLogs,
  getRecentLogs,
  getLogSummary,
  readLogsFromFile
} from '../../../render-stack/system/log-manager.js';
import type { ScaleRequest, LogQuery, NodeRole } from '../../../render-stack/system/system.types.js';

export const systemRouter = Router();

// ============================================================================
// Metrics Endpoints
// ============================================================================

/**
 * GET /api/system/metrics
 * Get aggregated system metrics
 */
systemRouter.get('/metrics', (_req: Request, res: Response) => {
  try {
    const metrics = getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('[system-api] metrics error:', error);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

/**
 * GET /api/system/metrics/prometheus
 * Get metrics in Prometheus format
 */
systemRouter.get('/metrics/prometheus', (_req: Request, res: Response) => {
  try {
    const text = formatPrometheusText();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(text);
  } catch (error) {
    console.error('[system-api] prometheus metrics error:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * GET /api/system/metrics/json
 * Get Prometheus-style metrics as JSON
 */
systemRouter.get('/metrics/json', (_req: Request, res: Response) => {
  try {
    const metrics = getPrometheusMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('[system-api] prometheus json error:', error);
    res.status(500).json({ error: 'Failed to get prometheus metrics' });
  }
});

// ============================================================================
// Node Endpoints
// ============================================================================

/**
 * GET /api/system/nodes
 * List all registered worker nodes
 */
systemRouter.get('/nodes', (_req: Request, res: Response) => {
  try {
    const registry = getNodeRegistry();
    const counts = getNodeCount();
    res.json({
      ...registry,
      counts
    });
  } catch (error) {
    console.error('[system-api] nodes list error:', error);
    res.status(500).json({ error: 'Failed to list nodes' });
  }
});

/**
 * GET /api/system/nodes/:nodeId
 * Get a specific node
 */
systemRouter.get('/nodes/:nodeId', (req: Request, res: Response) => {
  try {
    const node = getNode(req.params.nodeId);
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json(node);
  } catch (error) {
    console.error('[system-api] node get error:', error);
    res.status(500).json({ error: 'Failed to get node' });
  }
});

/**
 * POST /api/system/nodes/register
 * Register a new worker node
 */
systemRouter.post('/nodes/register', (req: Request, res: Response) => {
  try {
    const { id, name, role, host, port, capacity, labels } = req.body;
    
    if (!id || !name || !role || !host) {
      res.status(400).json({ error: 'Missing required fields: id, name, role, host' });
      return;
    }
    
    const node = registerNode({
      id,
      name,
      role: role as NodeRole,
      host,
      port: port ?? 3000,
      startedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      capacity: capacity ?? { maxConcurrentJobs: 4, currentJobs: 0, cpuCores: 4, memoryMb: 8192 },
      performance: { jobsProcessed: 0, avgJobTime: 0, errorRate: 0 },
      labels: labels ?? {}
    });
    
    res.status(201).json(node);
  } catch (error) {
    console.error('[system-api] node register error:', error);
    res.status(500).json({ error: 'Failed to register node' });
  }
});

/**
 * POST /api/system/nodes/:nodeId/heartbeat
 * Update node heartbeat
 */
systemRouter.post('/nodes/:nodeId/heartbeat', (req: Request, res: Response) => {
  try {
    const success = updateNodeHeartbeat(req.params.nodeId);
    if (!success) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[system-api] heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

/**
 * DELETE /api/system/nodes/:nodeId
 * Deregister a worker node
 */
systemRouter.delete('/nodes/:nodeId', (req: Request, res: Response) => {
  try {
    const success = deregisterNode(req.params.nodeId);
    if (!success) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json({ success: true, message: 'Node deregistered' });
  } catch (error) {
    console.error('[system-api] node deregister error:', error);
    res.status(500).json({ error: 'Failed to deregister node' });
  }
});

// ============================================================================
// Scaling Endpoints
// ============================================================================

/**
 * POST /api/system/scale
 * Execute a scaling action (admin only)
 */
systemRouter.post('/scale', async (req: Request, res: Response) => {
  try {
    const { action, nodeRole, targetCount, reason, requestedBy } = req.body;
    
    if (!action) {
      res.status(400).json({ error: 'action is required' });
      return;
    }
    
    const scaleRequest: ScaleRequest = {
      action,
      nodeRole,
      targetCount,
      reason,
      requestedBy
    };
    
    const result = await executeScale(scaleRequest);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[system-api] scale error:', error);
    res.status(500).json({ error: 'Failed to execute scale action' });
  }
});

/**
 * GET /api/system/scale/recommendation
 * Get auto-scaling recommendation based on current load
 */
systemRouter.get('/scale/recommendation', (req: Request, res: Response) => {
  try {
    const queueDepth = parseInt(req.query.queueDepth as string) || 0;
    const activeJobs = parseInt(req.query.activeJobs as string) || 0;
    
    const recommendation = getScaleRecommendation(queueDepth, activeJobs);
    
    res.json({
      hasRecommendation: recommendation !== null,
      recommendation,
      currentLoad: { queueDepth, activeJobs },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[system-api] scale recommendation error:', error);
    res.status(500).json({ error: 'Failed to get scale recommendation' });
  }
});

// ============================================================================
// Logging Endpoints
// ============================================================================

/**
 * GET /api/system/logs
 * Query system logs
 */
systemRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const query: LogQuery = {
      level: req.query.level as any,
      source: req.query.source as any,
      nodeId: req.query.nodeId as string,
      jobId: req.query.jobId as string,
      startTime: req.query.startTime as string,
      endTime: req.query.endTime as string,
      limit: parseInt(req.query.limit as string) || 100,
      offset: parseInt(req.query.offset as string) || 0
    };
    
    // Clean undefined values
    Object.keys(query).forEach(key => {
      if ((query as any)[key] === undefined || (query as any)[key] === '') {
        delete (query as any)[key];
      }
    });
    
    const result = queryLogs(query);
    res.json(result);
  } catch (error) {
    console.error('[system-api] logs query error:', error);
    res.status(500).json({ error: 'Failed to query logs' });
  }
});

/**
 * GET /api/system/logs/recent
 * Get recent logs
 */
systemRouter.get('/logs/recent', (_req: Request, res: Response) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 100;
    const entries = getRecentLogs(limit);
    res.json({ entries, count: entries.length });
  } catch (error) {
    console.error('[system-api] recent logs error:', error);
    res.status(500).json({ error: 'Failed to get recent logs' });
  }
});

/**
 * GET /api/system/logs/summary
 * Get log summary statistics
 */
systemRouter.get('/logs/summary', (_req: Request, res: Response) => {
  try {
    const summary = getLogSummary();
    res.json(summary);
  } catch (error) {
    console.error('[system-api] log summary error:', error);
    res.status(500).json({ error: 'Failed to get log summary' });
  }
});

/**
 * GET /api/system/logs/file
 * Read logs from file (for historical data)
 */
systemRouter.get('/logs/file', async (req: Request, res: Response) => {
  try {
    const query: LogQuery = {
      level: req.query.level as any,
      source: req.query.source as any,
      startTime: req.query.startTime as string,
      endTime: req.query.endTime as string,
      limit: parseInt(req.query.limit as string) || 1000,
      offset: parseInt(req.query.offset as string) || 0
    };
    
    const entries = await readLogsFromFile(query);
    res.json({ entries, count: entries.length });
  } catch (error) {
    console.error('[system-api] file logs error:', error);
    res.status(500).json({ error: 'Failed to read log file' });
  }
});

// ============================================================================
// Deployment Info Endpoints
// ============================================================================

/**
 * GET /api/system/deployment
 * Get deployment configuration and status
 */
systemRouter.get('/deployment', async (req: Request, res: Response) => {
  try {
    const healthReport = await runHealthChecks();
    
    const deploymentInfo = {
      version: process.env.SL18_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      buildId: process.env.BUILD_ID || 'local',
      commitHash: process.env.COMMIT_HASH || 'unknown',
      deployedAt: process.env.DEPLOY_TIMESTAMP || new Date().toISOString(),
      
      config: {
        renderWorkers: parseInt(process.env.RENDER_WORKERS || '2'),
        publishWorkers: parseInt(process.env.PUBLISH_WORKERS || '1'),
        maxConcurrentRenders: parseInt(process.env.MAX_CONCURRENT_RENDERS || '4'),
        maxConcurrentPublish: parseInt(process.env.MAX_CONCURRENT_PUBLISH || '2'),
        storageProvider: process.env.STORAGE_PROVIDER || 'local',
        ffmpegPath: process.env.FFMPEG_PATH
      },
      
      features: {
        cloudStorage: process.env.ENABLE_CLOUD_STORAGE === 'true',
        autoScaling: process.env.ENABLE_AUTO_SCALING === 'true',
        metricsExport: process.env.ENABLE_METRICS_EXPORT !== 'false',
        airtableSync: !!process.env.AIRTABLE_API_KEY
      },
      
      health: {
        overall: healthReport.status,
        services: Object.fromEntries(
          healthReport.checks.map(c => [c.name, c.status === 'pass' ? 'healthy' : c.status === 'warn' ? 'degraded' : 'unhealthy'])
        )
      }
    };
    
    res.json(deploymentInfo);
  } catch (error) {
    console.error('[system-api] deployment info error:', error);
    res.status(500).json({ error: 'Failed to get deployment info' });
  }
});

/**
 * GET /api/system/health
 * Run health checks
 */
systemRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const report = await runHealthChecks();
    
    const statusCode = report.status === 'healthy' ? 200 : report.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(report);
  } catch (error) {
    console.error('[system-api] health check error:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default systemRouter;
