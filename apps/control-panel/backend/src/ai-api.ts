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
import type {
  AIOperatingMode,
  AIModeConfig,
  AIScriptRequest,
  AIStylingRequest,
  AIQCRequest
} from '../../render-stack/ai/ai.types';

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
