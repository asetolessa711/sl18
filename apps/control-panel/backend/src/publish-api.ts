/**
 * Publishing API Routes
 * REST endpoints for automated publishing to external platforms.
 * 
 * POST /api/publish/:episodeId - Trigger publishing to platforms
 * GET /api/publish/:episodeId/status - Get publishing status
 * GET /api/publish/queue - Get queue statistics
 * GET /api/publish/history - Get publishing history
 * GET /api/publish/config - Get platform configuration status
 * DELETE /api/publish/:jobId - Cancel a pending publishing job
 */

import { Router, type Request, type Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

// Lazy import publishing manager to avoid circular dependencies
let publishingManager: any = null;
let publishingQueue: any = null;

async function getPublishingManager() {
  if (!publishingManager) {
    try {
      const module = await import('../../../../render-stack/publishing/publishing-manager.js');
      publishingManager = module.publishingManager;
    } catch (e) {
      console.warn('[publish-api] Publishing manager not available:', e);
    }
  }
  return publishingManager;
}

async function getPublishingQueue() {
  if (!publishingQueue) {
    try {
      const module = await import('../../../../render-stack/publishing/publishing-queue.js');
      publishingQueue = module.publishingQueue;
    } catch (e) {
      console.warn('[publish-api] Publishing queue not available:', e);
    }
  }
  return publishingQueue;
}

export const publishRouter = Router();

// Types for API responses
interface PublishRequest {
  platforms?: string[];
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    privacyStatus?: 'public' | 'unlisted' | 'private';
    thumbnailPath?: string;
    playlistId?: string;
    madeForKids?: boolean;
    custom?: Record<string, unknown>;
  };
  force?: boolean;
  actor?: string;
}

/**
 * POST /api/publish/:episodeId
 * Trigger publishing to platforms
 */
publishRouter.post('/:episodeId', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const body = req.body as PublishRequest;

    // Validate episode ID
    if (!episodeId) {
      res.status(400).json({ error: 'Episode ID is required' });
      return;
    }

    // Default platforms to YouTube if not specified
    const platforms = body.platforms || ['youtube'];

    // Validate platforms
    const validPlatforms = ['youtube', 'meta', 'tiktok'];
    for (const platform of platforms) {
      if (!validPlatforms.includes(platform)) {
        res.status(400).json({ error: `Invalid platform: ${platform}` });
        return;
      }
    }

    // Get episode metadata for title if not provided
    let episodeTitle = episodeId;
    const timelinesDir = path.join(repoRoot, 'timelines');
    const timelinePath = path.join(timelinesDir, episodeId, 'timeline.json');
    
    if (existsSync(timelinePath)) {
      try {
        const timeline = JSON.parse(readFileSync(timelinePath, 'utf8'));
        episodeTitle = timeline.notes || episodeId;
      } catch {
        // Use episode ID as title
      }
    }

    // Build metadata
    const metadata = {
      title: body.metadata?.title || `Episode ${episodeTitle}`,
      description: body.metadata?.description || '',
      tags: body.metadata?.tags || [],
      privacyStatus: body.metadata?.privacyStatus || 'private',
      thumbnailPath: body.metadata?.thumbnailPath,
      playlistId: body.metadata?.playlistId,
      madeForKids: body.metadata?.madeForKids || false,
      custom: body.metadata?.custom
    };

    // Get publishing manager
    const manager = await getPublishingManager();
    if (!manager) {
      res.status(503).json({ error: 'Publishing manager not available' });
      return;
    }

    // Create publishing jobs
    const result = await manager.createPublishingJobs({
      episodeId,
      platforms,
      metadata,
      force: body.force,
      actor: body.actor || 'api'
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.errors,
        message: 'Failed to create publishing jobs'
      });
      return;
    }

    res.json({
      success: true,
      episodeId,
      jobs: result.jobs.map((job: any) => ({
        id: job.id,
        platform: job.platform,
        status: job.status,
        createdAt: job.createdAt
      })),
      errors: result.errors,
      message: `Created ${result.jobs.length} publishing job(s)`
    });

  } catch (error) {
    console.error('[publish-api] Error creating publishing jobs:', error);
    res.status(500).json({ error: 'Failed to create publishing jobs' });
  }
});

/**
 * GET /api/publish/:episodeId/status
 * Get publishing status for an episode
 */
publishRouter.get('/:episodeId/status', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;

    const queue = await getPublishingQueue();
    if (!queue) {
      res.status(503).json({ error: 'Publishing queue not available' });
      return;
    }

    const jobs = queue.getJobsByEpisode(episodeId);
    const history = queue.getHistoryByEpisode(episodeId);

    // Group by platform
    const byPlatform: Record<string, { current?: any; history: any[] }> = {};

    for (const job of jobs) {
      if (!byPlatform[job.platform]) {
        byPlatform[job.platform] = { history: [] };
      }
      byPlatform[job.platform].current = {
        id: job.id,
        status: job.status,
        progress: job.progress,
        platformVideoId: job.platformVideoId,
        platformUrl: job.platformUrl,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      };
    }

    for (const entry of history) {
      if (!byPlatform[entry.platform]) {
        byPlatform[entry.platform] = { history: [] };
      }
      byPlatform[entry.platform].history.push(entry);
    }

    res.json({
      episodeId,
      platforms: byPlatform,
      activeJobs: jobs.length,
      historyCount: history.length,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[publish-api] Error getting status:', error);
    res.status(500).json({ error: 'Failed to get publishing status' });
  }
});

/**
 * GET /api/publish/queue
 * Get queue statistics
 */
publishRouter.get('/queue', async (_req: Request, res: Response) => {
  try {
    const queue = await getPublishingQueue();
    if (!queue) {
      res.status(503).json({ error: 'Publishing queue not available' });
      return;
    }

    const stats = queue.getStats();
    const pendingJobs = queue.getPendingJobs();

    res.json({
      stats,
      pendingApproval: pendingJobs.map((job: any) => ({
        id: job.id,
        episodeId: job.episodeId,
        platform: job.platform,
        createdAt: job.createdAt
      })),
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[publish-api] Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

/**
 * GET /api/publish/history
 * Get publishing history
 */
publishRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const { limit = '50', platform } = req.query;

    const manager = await getPublishingManager();
    if (!manager) {
      res.status(503).json({ error: 'Publishing manager not available' });
      return;
    }

    let history = manager.getHistory(parseInt(limit as string, 10) || 50);

    // Filter by platform if specified
    if (platform && typeof platform === 'string') {
      history = history.filter((entry: any) => entry.platform === platform);
    }

    res.json({
      history,
      count: history.length,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[publish-api] Error getting history:', error);
    res.status(500).json({ error: 'Failed to get publishing history' });
  }
});

/**
 * GET /api/publish/config
 * Get platform configuration status
 */
publishRouter.get('/config', async (_req: Request, res: Response) => {
  try {
    const manager = await getPublishingManager();
    if (!manager) {
      res.status(503).json({ error: 'Publishing manager not available' });
      return;
    }

    const configStatus = manager.getConfigurationStatus();
    const rotationStatus = manager.getSecretsRotationStatus();

    res.json({
      platforms: {
        youtube: {
          configured: configStatus.youtube,
          rotation: rotationStatus.find((s: any) => s.platform === 'youtube')
        },
        meta: {
          configured: configStatus.meta,
          rotation: rotationStatus.find((s: any) => s.platform === 'meta')
        },
        tiktok: {
          configured: false,
          note: 'TikTok is export-only (manual upload required)'
        }
      },
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[publish-api] Error getting config:', error);
    res.status(500).json({ error: 'Failed to get platform configuration' });
  }
});

/**
 * DELETE /api/publish/:jobId
 * Cancel a pending publishing job
 */
publishRouter.delete('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const queue = await getPublishingQueue();
    if (!queue) {
      res.status(503).json({ error: 'Publishing queue not available' });
      return;
    }

    const job = queue.getJob(jobId);
    if (!job) {
      res.status(404).json({ error: `Job not found: ${jobId}` });
      return;
    }

    if (job.status === 'uploading' || job.status === 'processing') {
      res.status(400).json({ error: 'Cannot cancel job that is currently uploading' });
      return;
    }

    const cancelled = queue.cancelJob(jobId);
    if (!cancelled) {
      res.status(400).json({ error: 'Failed to cancel job' });
      return;
    }

    res.json({
      success: true,
      jobId,
      message: 'Publishing job cancelled'
    });

  } catch (error) {
    console.error('[publish-api] Error cancelling job:', error);
    res.status(500).json({ error: 'Failed to cancel publishing job' });
  }
});

/**
 * GET /api/publish/job/:jobId
 * Get details of a specific publishing job
 */
publishRouter.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const queue = await getPublishingQueue();
    if (!queue) {
      res.status(503).json({ error: 'Publishing queue not available' });
      return;
    }

    const job = queue.getJob(jobId);
    if (!job) {
      res.status(404).json({ error: `Job not found: ${jobId}` });
      return;
    }

    res.json({
      job: {
        id: job.id,
        episodeId: job.episodeId,
        platform: job.platform,
        status: job.status,
        priority: job.priority,
        progress: job.progress,
        metadata: job.metadata,
        platformVideoId: job.platformVideoId,
        platformUrl: job.platformUrl,
        error: job.error,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        qcApproval: job.qcApproval,
        createdAt: job.createdAt,
        queuedAt: job.queuedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        uploadDuration: job.uploadDuration,
        actor: job.actor
      },
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[publish-api] Error getting job:', error);
    res.status(500).json({ error: 'Failed to get publishing job' });
  }
});

/**
 * POST /api/publish/:jobId/approve
 * Approve a pending job (moves from pending to queued)
 */
publishRouter.post('/:jobId/approve', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { approvedBy } = req.body as { approvedBy?: string };

    const queue = await getPublishingQueue();
    if (!queue) {
      res.status(503).json({ error: 'Publishing queue not available' });
      return;
    }

    const job = queue.getJob(jobId);
    if (!job) {
      res.status(404).json({ error: `Job not found: ${jobId}` });
      return;
    }

    if (job.status !== 'pending') {
      res.status(400).json({ error: `Job is not pending approval (status: ${job.status})` });
      return;
    }

    const updatedJob = queue.queueJob(jobId, {
      approvedAt: new Date().toISOString(),
      approvedBy: approvedBy || 'Operator'
    });

    res.json({
      success: true,
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        queuedAt: updatedJob.queuedAt,
        qcApproval: updatedJob.qcApproval
      },
      message: 'Job approved and queued for publishing'
    });

  } catch (error) {
    console.error('[publish-api] Error approving job:', error);
    res.status(500).json({ error: 'Failed to approve publishing job' });
  }
});

/**
 * GET /api/publish/health
 * Health check endpoint
 */
publishRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const manager = await getPublishingManager();
    const queue = await getPublishingQueue();

    const healthy = Boolean(manager && queue);

    res.json({
      status: healthy ? 'ok' : 'degraded',
      publishing: Boolean(manager),
      queue: Boolean(queue),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Publishing service unavailable'
    });
  }
});
