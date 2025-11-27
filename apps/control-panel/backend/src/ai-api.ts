/**
 * AI API Routes v1.0.0
 * REST API for AI integration with operating mode support.
 */

import { Router, type Request, type Response } from 'express';
import {
  getModeConfig,
  setModeConfig,
  getGlobalModeConfig,
  setGlobalModeConfig,
  generateScript,
  generateStyling,
  performQCCheck,
  approveTask,
  rejectTask,
  getTask,
  listTasks,
  getAuditLog,
  getModeBehavior,
  getAvailableModes,
  getAIStats
} from '../../render-stack/ai/ai-manager';
import {
  calculateConfidence,
  isAutonomousModeAllowed,
  getThresholds,
  setThresholds,
  getMetricsSummary,
  getMetricsHistory,
  recordQCResult,
  recordPublishingResult,
  recordScriptApproval,
  recordStylingAcceptance
} from '../../render-stack/ai/confidence-manager';
import {
  createShadowPublish,
  createAutonomousPublish,
  compareShadowWithOperator,
  overrideAutonomousJob,
  rollbackAutonomousJob,
  getAutonomousJob,
  getShadowResult,
  listAutonomousJobs,
  listShadowResults,
  getAutonomousAuditLog,
  getAutonomousStats
} from '../../render-stack/ai/autonomous-manager';
import type {
  AIOperatingMode,
  AIModeConfig,
  AIScriptRequest,
  AIStylingRequest,
  AIQCRequest
} from '../../render-stack/ai/ai.types';
import type { PublishingPlatform } from '../../render-stack/publishing/publishing.types';

export const aiRouter = Router();

/**
 * GET /api/ai/modes
 * List available operating modes with descriptions
 */
aiRouter.get('/modes', (_req: Request, res: Response) => {
  try {
    const modes = getAvailableModes();
    res.json({
      modes,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get modes failed', error);
    res.status(500).json({ error: 'Failed to get AI modes' });
  }
});

/**
 * GET /api/ai/mode
 * Get current mode configuration (global or workspace-specific)
 */
aiRouter.get('/mode', (req: Request, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string | undefined;
    const config = getModeConfig(workspaceId);
    const behavior = getModeBehavior(config.mode);
    
    res.json({
      config,
      behavior,
      workspaceId: workspaceId ?? 'global',
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get mode failed', error);
    res.status(500).json({ error: 'Failed to get AI mode configuration' });
  }
});

/**
 * PUT /api/ai/mode
 * Set mode configuration for a workspace or globally
 */
aiRouter.put('/mode', (req: Request, res: Response) => {
  try {
    const { workspaceId, ...configUpdate } = req.body;
    
    if (!configUpdate.mode || !['humanLead', 'humanAssisted', 'fullyAI'].includes(configUpdate.mode)) {
      res.status(400).json({ error: 'Valid mode is required (humanLead, humanAssisted, fullyAI)' });
      return;
    }
    
    let config: AIModeConfig;
    if (workspaceId) {
      config = setModeConfig(workspaceId, configUpdate);
    } else {
      config = setGlobalModeConfig(configUpdate);
    }
    
    const behavior = getModeBehavior(config.mode);
    
    res.json({
      config,
      behavior,
      workspaceId: workspaceId ?? 'global',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] set mode failed', error);
    res.status(500).json({ error: 'Failed to set AI mode configuration' });
  }
});

/**
 * POST /api/ai/script
 * Generate AI script
 */
aiRouter.post('/script', async (req: Request, res: Response) => {
  try {
    const request: AIScriptRequest = {
      contentId: req.body.contentId,
      genre: req.body.genre,
      personaCode: req.body.personaCode,
      topic: req.body.topic,
      targetDuration: req.body.targetDuration ?? 60,
      context: req.body.context,
      workspaceId: req.body.workspaceId,
      modeOverride: req.body.modeOverride as AIOperatingMode | undefined
    };
    
    if (!request.contentId || !request.genre || !request.personaCode || !request.topic) {
      res.status(400).json({ 
        error: 'Missing required fields',
        required: ['contentId', 'genre', 'personaCode', 'topic']
      });
      return;
    }
    
    const result = await generateScript(request);
    res.json(result);
  } catch (error) {
    console.error('[ai] script generation failed', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

/**
 * POST /api/ai/styling
 * Generate AI styling suggestions
 */
aiRouter.post('/styling', async (req: Request, res: Response) => {
  try {
    const request: AIStylingRequest = {
      contentId: req.body.contentId,
      genre: req.body.genre,
      personaCode: req.body.personaCode,
      currentStyling: req.body.currentStyling,
      targetPlatform: req.body.targetPlatform,
      workspaceId: req.body.workspaceId,
      modeOverride: req.body.modeOverride as AIOperatingMode | undefined
    };
    
    if (!request.contentId || !request.genre || !request.personaCode) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['contentId', 'genre', 'personaCode']
      });
      return;
    }
    
    const result = await generateStyling(request);
    res.json(result);
  } catch (error) {
    console.error('[ai] styling generation failed', error);
    res.status(500).json({ error: 'Failed to generate styling' });
  }
});

/**
 * POST /api/ai/qc
 * Perform AI QC check
 */
aiRouter.post('/qc', async (req: Request, res: Response) => {
  try {
    const request: AIQCRequest = {
      contentId: req.body.contentId,
      genre: req.body.genre,
      timeline: req.body.timeline,
      existingFlags: req.body.existingFlags,
      workspaceId: req.body.workspaceId,
      modeOverride: req.body.modeOverride as AIOperatingMode | undefined
    };
    
    if (!request.contentId || !request.genre) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['contentId', 'genre']
      });
      return;
    }
    
    const result = await performQCCheck(request);
    res.json(result);
  } catch (error) {
    console.error('[ai] QC check failed', error);
    res.status(500).json({ error: 'Failed to perform QC check' });
  }
});

/**
 * GET /api/ai/tasks
 * List AI tasks with optional filters
 */
aiRouter.get('/tasks', (req: Request, res: Response) => {
  try {
    const filters = {
      contentId: req.query.contentId as string | undefined,
      workspaceId: req.query.workspaceId as string | undefined,
      type: req.query.type as 'script' | 'styling' | 'qc' | undefined,
      status: req.query.status as any,
      mode: req.query.mode as AIOperatingMode | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
    };
    
    const result = listTasks(filters);
    res.json({
      ...result,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] list tasks failed', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

/**
 * GET /api/ai/tasks/:taskId
 * Get a specific task
 */
aiRouter.get('/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const task = getTask(req.params.taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (error) {
    console.error('[ai] get task failed', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

/**
 * POST /api/ai/tasks/:taskId/approve
 * Approve an AI task
 */
aiRouter.post('/tasks/:taskId/approve', (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;
    if (!approvedBy) {
      res.status(400).json({ error: 'approvedBy is required' });
      return;
    }
    
    const task = approveTask(req.params.taskId, approvedBy);
    if (!task) {
      res.status(404).json({ error: 'Task not found or not awaiting approval' });
      return;
    }
    
    res.json(task);
  } catch (error) {
    console.error('[ai] approve task failed', error);
    res.status(500).json({ error: 'Failed to approve task' });
  }
});

/**
 * POST /api/ai/tasks/:taskId/reject
 * Reject an AI task
 */
aiRouter.post('/tasks/:taskId/reject', (req: Request, res: Response) => {
  try {
    const { rejectedBy, reason } = req.body;
    if (!rejectedBy || !reason) {
      res.status(400).json({ error: 'rejectedBy and reason are required' });
      return;
    }
    
    const task = rejectTask(req.params.taskId, rejectedBy, reason);
    if (!task) {
      res.status(404).json({ error: 'Task not found or not awaiting approval' });
      return;
    }
    
    res.json(task);
  } catch (error) {
    console.error('[ai] reject task failed', error);
    res.status(500).json({ error: 'Failed to reject task' });
  }
});

/**
 * GET /api/ai/audit
 * Get AI audit log
 */
aiRouter.get('/audit', (req: Request, res: Response) => {
  try {
    const filters = {
      taskId: req.query.taskId as string | undefined,
      action: req.query.action as any,
      actor: req.query.actor as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    };
    
    const entries = getAuditLog(filters);
    res.json({
      entries,
      count: entries.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get audit log failed', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

/**
 * GET /api/ai/stats
 * Get AI integration statistics
 */
aiRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = getAIStats();
    res.json({
      ...stats,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get stats failed', error);
    res.status(500).json({ error: 'Failed to get AI stats' });
  }
});

/**
 * GET /api/ai/health
 * AI integration health check
 */
aiRouter.get('/health', (_req: Request, res: Response) => {
  try {
    const config = getGlobalModeConfig();
    const stats = getAIStats();
    
    res.json({
      status: 'ok',
      mode: config.mode,
      enabledFeatures: config.enabledFeatures,
      totalTasks: stats.totalTasks,
      pendingApprovals: stats.byStatus.awaiting_approval,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] health check failed', error);
    res.status(500).json({ error: 'AI health check failed' });
  }
});

// =============================================================================
// Phase 11: Autonomous Mode Endpoints
// =============================================================================

/**
 * GET /api/ai/confidence
 * Get current confidence score and autonomous readiness
 */
aiRouter.get('/confidence', (req: Request, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string | undefined;
    const confidence = calculateConfidence(workspaceId);
    const autonomousCheck = isAutonomousModeAllowed(workspaceId);
    
    res.json({
      confidence,
      autonomousAllowed: autonomousCheck.allowed,
      reason: autonomousCheck.reason,
      workspaceId: workspaceId ?? 'global',
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get confidence failed', error);
    res.status(500).json({ error: 'Failed to get confidence score' });
  }
});

/**
 * GET /api/ai/confidence/thresholds
 * Get confidence thresholds
 */
aiRouter.get('/confidence/thresholds', (_req: Request, res: Response) => {
  try {
    const thresholds = getThresholds();
    res.json({
      thresholds,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get thresholds failed', error);
    res.status(500).json({ error: 'Failed to get thresholds' });
  }
});

/**
 * PUT /api/ai/confidence/thresholds
 * Update confidence thresholds
 */
aiRouter.put('/confidence/thresholds', (req: Request, res: Response) => {
  try {
    const newThresholds = setThresholds(req.body);
    res.json({
      thresholds: newThresholds,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] set thresholds failed', error);
    res.status(500).json({ error: 'Failed to set thresholds' });
  }
});

/**
 * GET /api/ai/confidence/metrics
 * Get metrics summary
 */
aiRouter.get('/confidence/metrics', (req: Request, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string | undefined;
    const summary = getMetricsSummary(workspaceId);
    
    res.json({
      metrics: summary,
      workspaceId: workspaceId ?? 'global',
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get metrics failed', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * GET /api/ai/confidence/metrics/:type/history
 * Get metrics history for a specific type
 */
aiRouter.get('/confidence/metrics/:type/history', (req: Request, res: Response) => {
  try {
    const type = req.params.type as any;
    const workspaceId = req.query.workspaceId as string | undefined;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    
    const history = getMetricsHistory(type, { workspaceId, days, limit });
    
    res.json({
      type,
      history,
      count: history.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get metrics history failed', error);
    res.status(500).json({ error: 'Failed to get metrics history' });
  }
});

/**
 * POST /api/ai/confidence/record
 * Record a metric for confidence tracking
 */
aiRouter.post('/confidence/record', (req: Request, res: Response) => {
  try {
    const { type, success, contentId, workspaceId, platform } = req.body;
    
    if (!type || success === undefined) {
      res.status(400).json({ error: 'type and success are required' });
      return;
    }
    
    switch (type) {
      case 'qc':
        recordQCResult(success, { contentId, workspaceId });
        break;
      case 'publishing':
        recordPublishingResult(success, platform ?? 'unknown', { contentId, workspaceId });
        break;
      case 'script':
        recordScriptApproval(success, { contentId, workspaceId });
        break;
      case 'styling':
        recordStylingAcceptance(success, { contentId, workspaceId });
        break;
      default:
        res.status(400).json({ error: 'Invalid metric type' });
        return;
    }
    
    res.json({
      recorded: true,
      type,
      success,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] record metric failed', error);
    res.status(500).json({ error: 'Failed to record metric' });
  }
});

/**
 * POST /api/publish/shadow
 * Create shadow publish job (simulates AI decision)
 */
aiRouter.post('/publish/shadow', async (req: Request, res: Response) => {
  try {
    const { episodeId, platform, workspaceId, metadata, actor } = req.body;
    
    if (!episodeId || !platform) {
      res.status(400).json({ error: 'episodeId and platform are required' });
      return;
    }
    
    const result = await createShadowPublish(episodeId, platform as PublishingPlatform, {
      workspaceId,
      metadata,
      actor
    });
    
    res.json(result);
  } catch (error) {
    console.error('[ai] shadow publish failed', error);
    res.status(500).json({ error: 'Failed to create shadow publish' });
  }
});

/**
 * POST /api/publish/shadow/:jobId/compare
 * Compare shadow result with operator decision
 */
aiRouter.post('/publish/shadow/:jobId/compare', (req: Request, res: Response) => {
  try {
    const { operatorDecision, operatorActor } = req.body;
    
    if (!operatorDecision || !operatorActor) {
      res.status(400).json({ error: 'operatorDecision and operatorActor are required' });
      return;
    }
    
    const result = compareShadowWithOperator(
      req.params.jobId,
      operatorDecision,
      operatorActor
    );
    
    if (!result) {
      res.status(404).json({ error: 'Shadow job not found' });
      return;
    }
    
    res.json(result);
  } catch (error) {
    console.error('[ai] compare shadow failed', error);
    res.status(500).json({ error: 'Failed to compare shadow result' });
  }
});

/**
 * GET /api/publish/shadow
 * List shadow publish results
 */
aiRouter.get('/publish/shadow', (req: Request, res: Response) => {
  try {
    const filters = {
      episodeId: req.query.episodeId as string | undefined,
      platform: req.query.platform as PublishingPlatform | undefined,
      decision: req.query.decision as 'publish' | 'hold' | 'reject' | undefined,
      hasOperatorComparison: req.query.hasComparison === 'true' ? true : 
                             req.query.hasComparison === 'false' ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    };
    
    const results = listShadowResults(filters);
    
    res.json({
      results,
      count: results.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] list shadow results failed', error);
    res.status(500).json({ error: 'Failed to list shadow results' });
  }
});

/**
 * GET /api/publish/shadow/:jobId
 * Get shadow result by ID
 */
aiRouter.get('/publish/shadow/:jobId', (req: Request, res: Response) => {
  try {
    const result = getShadowResult(req.params.jobId);
    
    if (!result) {
      res.status(404).json({ error: 'Shadow result not found' });
      return;
    }
    
    res.json(result);
  } catch (error) {
    console.error('[ai] get shadow result failed', error);
    res.status(500).json({ error: 'Failed to get shadow result' });
  }
});

/**
 * POST /api/publish/auto
 * Autonomous publish (AI decides and executes)
 */
aiRouter.post('/publish/auto', async (req: Request, res: Response) => {
  try {
    const { episodeId, platforms, metadata, forcePublish, workspaceId, actor } = req.body;
    
    if (!episodeId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      res.status(400).json({ error: 'episodeId and platforms array are required' });
      return;
    }
    
    const result = await createAutonomousPublish({
      episodeId,
      platforms,
      metadata,
      forcePublish,
      workspaceId,
      actor
    });
    
    res.json(result);
  } catch (error) {
    console.error('[ai] autonomous publish failed', error);
    res.status(500).json({ error: 'Failed to create autonomous publish' });
  }
});

/**
 * GET /api/publish/auto
 * List autonomous jobs
 */
aiRouter.get('/publish/auto', (req: Request, res: Response) => {
  try {
    const filters = {
      type: req.query.type as 'shadow' | 'autonomous' | undefined,
      status: req.query.status as any,
      episodeId: req.query.episodeId as string | undefined,
      workspaceId: req.query.workspaceId as string | undefined,
      platform: req.query.platform as PublishingPlatform | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
    };
    
    const result = listAutonomousJobs(filters);
    
    res.json({
      ...result,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] list autonomous jobs failed', error);
    res.status(500).json({ error: 'Failed to list autonomous jobs' });
  }
});

/**
 * GET /api/publish/auto/:jobId
 * Get autonomous job by ID
 */
aiRouter.get('/publish/auto/:jobId', (req: Request, res: Response) => {
  try {
    const job = getAutonomousJob(req.params.jobId);
    
    if (!job) {
      res.status(404).json({ error: 'Autonomous job not found' });
      return;
    }
    
    res.json(job);
  } catch (error) {
    console.error('[ai] get autonomous job failed', error);
    res.status(500).json({ error: 'Failed to get autonomous job' });
  }
});

/**
 * POST /api/publish/auto/:jobId/override
 * Override autonomous job decision
 */
aiRouter.post('/publish/auto/:jobId/override', (req: Request, res: Response) => {
  try {
    const { newDecision, overriddenBy, reason } = req.body;
    
    if (!newDecision || !overriddenBy || !reason) {
      res.status(400).json({ error: 'newDecision, overriddenBy, and reason are required' });
      return;
    }
    
    const job = overrideAutonomousJob(req.params.jobId, newDecision, overriddenBy, reason);
    
    if (!job) {
      res.status(404).json({ error: 'Autonomous job not found' });
      return;
    }
    
    res.json(job);
  } catch (error) {
    console.error('[ai] override autonomous job failed', error);
    res.status(500).json({ error: 'Failed to override autonomous job' });
  }
});

/**
 * POST /api/publish/rollback/:jobId
 * Rollback a published autonomous job
 */
aiRouter.post('/publish/rollback/:jobId', (req: Request, res: Response) => {
  try {
    const { rolledBackBy, reason } = req.body;
    
    if (!rolledBackBy || !reason) {
      res.status(400).json({ error: 'rolledBackBy and reason are required' });
      return;
    }
    
    const job = rollbackAutonomousJob(req.params.jobId, rolledBackBy, reason);
    
    if (!job) {
      res.status(404).json({ error: 'Job not found or cannot be rolled back' });
      return;
    }
    
    res.json(job);
  } catch (error) {
    console.error('[ai] rollback job failed', error);
    res.status(500).json({ error: 'Failed to rollback job' });
  }
});

/**
 * GET /api/publish/auto/audit
 * Get autonomous audit log
 */
aiRouter.get('/publish/auto/audit', (req: Request, res: Response) => {
  try {
    const filters = {
      jobId: req.query.jobId as string | undefined,
      action: req.query.action as any,
      actor: req.query.actor as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    };
    
    const entries = getAutonomousAuditLog(filters);
    
    res.json({
      entries,
      count: entries.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get autonomous audit failed', error);
    res.status(500).json({ error: 'Failed to get autonomous audit log' });
  }
});

/**
 * GET /api/publish/auto/stats
 * Get autonomous publishing statistics
 */
aiRouter.get('/publish/auto/stats', (_req: Request, res: Response) => {
  try {
    const stats = getAutonomousStats();
    
    res.json({
      ...stats,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ai] get autonomous stats failed', error);
    res.status(500).json({ error: 'Failed to get autonomous stats' });
  }
});
