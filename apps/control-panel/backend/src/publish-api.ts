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
    const validPlatforms = ['youtube', 'meta', 'facebook', 'instagram', 'tiktok'];
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
        facebook: {
          configured: configStatus.facebook,
          rotation: rotationStatus.find((s: any) => s.platform === 'facebook')
        },
        instagram: {
          configured: configStatus.instagram,
          rotation: rotationStatus.find((s: any) => s.platform === 'instagram')
        },
        tiktok: {
          configured: configStatus.tiktok,
          rotation: rotationStatus.find((s: any) => s.platform === 'tiktok')
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

    if (!updatedJob) {
      res.status(500).json({ error: 'Failed to queue job for approval' });
      return;
    }

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

/**
 * POST /api/publish/facebook/:episodeId
 * Publish to Facebook specifically
 */
publishRouter.post('/facebook/:episodeId', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const body = req.body as PublishRequest;

    const metadata = {
      title: body.metadata?.title || `Episode ${episodeId}`,
      description: body.metadata?.description || '',
      tags: body.metadata?.tags || [],
      privacyStatus: body.metadata?.privacyStatus || 'private',
      custom: { ...body.metadata?.custom, target: 'facebook' }
    };

    const manager = await getPublishingManager();
    if (!manager) {
      res.status(503).json({ error: 'Publishing manager not available' });
      return;
    }

    const result = await manager.createPublishingJobs({
      episodeId,
      platforms: ['facebook'],
      metadata,
      force: body.force,
      actor: body.actor || 'api'
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.errors,
        message: 'Failed to create Facebook publishing job'
      });
      return;
    }

    res.json({
      success: true,
      episodeId,
      platform: 'facebook',
      jobs: result.jobs.map((job: any) => ({
        id: job.id,
        platform: job.platform,
        status: job.status,
        createdAt: job.createdAt
      })),
      message: 'Facebook publishing job created'
    });

  } catch (error) {
    console.error('[publish-api] Error creating Facebook job:', error);
    res.status(500).json({ error: 'Failed to create Facebook publishing job' });
  }
});

/**
 * POST /api/publish/instagram/:episodeId
 * Publish to Instagram specifically
 */
publishRouter.post('/instagram/:episodeId', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const body = req.body as PublishRequest;

    // Instagram requires a video URL
    if (!body.metadata?.custom?.videoUrl) {
      res.status(400).json({
        error: 'Instagram requires a publicly accessible video URL. Pass via metadata.custom.videoUrl'
      });
      return;
    }

    const metadata = {
      title: body.metadata?.title || `Episode ${episodeId}`,
      description: body.metadata?.description || '',
      tags: body.metadata?.tags || [],
      privacyStatus: body.metadata?.privacyStatus || 'private',
      custom: { ...body.metadata?.custom, target: 'instagram' }
    };

    const manager = await getPublishingManager();
    if (!manager) {
      res.status(503).json({ error: 'Publishing manager not available' });
      return;
    }

    const result = await manager.createPublishingJobs({
      episodeId,
      platforms: ['instagram'],
      metadata,
      force: body.force,
      actor: body.actor || 'api'
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.errors,
        message: 'Failed to create Instagram publishing job'
      });
      return;
    }

    res.json({
      success: true,
      episodeId,
      platform: 'instagram',
      jobs: result.jobs.map((job: any) => ({
        id: job.id,
        platform: job.platform,
        status: job.status,
        createdAt: job.createdAt
      })),
      message: 'Instagram publishing job created'
    });

  } catch (error) {
    console.error('[publish-api] Error creating Instagram job:', error);
    res.status(500).json({ error: 'Failed to create Instagram publishing job' });
  }
});

/**
 * POST /api/publish/tiktok/:episodeId
 * Prepare TikTok export (manual upload required)
 * 
 * ⚠️ IMPORTANT: TikTok does not provide a public API for video publishing.
 * This endpoint prepares TikTok-ready assets for MANUAL upload by operators.
 */
publishRouter.post('/tiktok/:episodeId', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const body = req.body as PublishRequest;

    const metadata = {
      title: body.metadata?.title || `Episode ${episodeId}`,
      description: body.metadata?.description || '',
      tags: body.metadata?.tags || [],
      privacyStatus: body.metadata?.privacyStatus || 'private',
      custom: { ...body.metadata?.custom, episodeId }
    };

    const manager = await getPublishingManager();
    if (!manager) {
      res.status(503).json({ error: 'Publishing manager not available' });
      return;
    }

    const result = await manager.createPublishingJobs({
      episodeId,
      platforms: ['tiktok'],
      metadata,
      force: body.force,
      actor: body.actor || 'api'
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.errors,
        message: 'Failed to create TikTok export job'
      });
      return;
    }

    // TikTok jobs are exports, not direct publishes
    res.json({
      success: true,
      episodeId,
      platform: 'tiktok',
      manualUploadRequired: true,
      jobs: result.jobs.map((job: any) => ({
        id: job.id,
        platform: job.platform,
        status: job.status,
        createdAt: job.createdAt
      })),
      message: '⚠️ TikTok export prepared - MANUAL UPLOAD REQUIRED. TikTok does not provide a public publishing API.',
      instructions: [
        '1. Wait for the export job to complete',
        '2. Download the TikTok-ready video from the exports folder',
        '3. Use the metadata file for captions and hashtags',
        '4. Upload manually via TikTok app or approved third-party tools'
      ]
    });

  } catch (error) {
    console.error('[publish-api] Error creating TikTok export job:', error);
    res.status(500).json({ error: 'Failed to create TikTok export job' });
  }
});

/**
 * GET /api/publish/tiktok/:episodeId/download
 * Get download information for TikTok export
 */
publishRouter.get('/tiktok/:episodeId/download', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;

    // Check for export files
    const exportDir = path.join(repoRoot, 'exports/tiktok', episodeId);
    
    if (!existsSync(exportDir)) {
      res.status(404).json({
        error: 'No TikTok export found for this episode',
        message: 'Create a TikTok export first using POST /api/publish/tiktok/:episodeId'
      });
      return;
    }

    // List available exports
    const fs = await import('fs/promises');
    const files = await fs.readdir(exportDir);
    const videoFiles = files.filter(f => f.endsWith('.mp4'));
    const metadataFiles = files.filter(f => f.endsWith('_metadata.json'));

    res.json({
      episodeId,
      platform: 'tiktok',
      manualUploadRequired: true,
      exportDir,
      exports: videoFiles.map((video, index) => ({
        video,
        metadata: metadataFiles[index] || null,
        downloadPath: `/api/storage/tiktok/${episodeId}/${video}`
      })),
      count: videoFiles.length,
      instructions: [
        '1. Download the video file from the downloadPath',
        '2. Review the metadata file for captions and hashtags',
        '3. Upload manually via TikTok app',
        '4. Add sounds, effects, or filters as needed'
      ],
      note: 'TikTok does not provide a public API for video publishing. Manual upload is required.'
    });

  } catch (error) {
    console.error('[publish-api] Error getting TikTok download info:', error);
    res.status(500).json({ error: 'Failed to get TikTok download information' });
  }
});

/**
 * GET /api/publish/:platform/:episodeId/status
 * Get publishing status for a specific platform
 */
publishRouter.get('/:platform/:episodeId/status', async (req: Request, res: Response) => {
  try {
    const { platform, episodeId } = req.params;

    // Validate platform
    const validPlatforms = ['youtube', 'meta', 'facebook', 'instagram', 'tiktok'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({ error: `Invalid platform: ${platform}` });
      return;
    }

    const queue = await getPublishingQueue();
    if (!queue) {
      res.status(503).json({ error: 'Publishing queue not available' });
      return;
    }

    const jobs = queue.getJobsByEpisode(episodeId);
    const history = queue.getHistoryByEpisode(episodeId);

    // Filter by platform
    const platformJobs = jobs.filter((j: any) => j.platform === platform);
    const platformHistory = history.filter((h: any) => h.platform === platform);

    const currentJob = platformJobs[0];

    res.json({
      episodeId,
      platform,
      current: currentJob ? {
        id: currentJob.id,
        status: currentJob.status,
        progress: currentJob.progress,
        platformVideoId: currentJob.platformVideoId,
        platformUrl: currentJob.platformUrl,
        error: currentJob.error,
        createdAt: currentJob.createdAt,
        completedAt: currentJob.completedAt
      } : null,
      history: platformHistory,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[publish-api] Error getting platform status:', error);
    res.status(500).json({ error: 'Failed to get publishing status' });
  }
});

/**
 * GET /api/publish/:platform/history
 * Get publishing history for a specific platform
 */
publishRouter.get('/:platform/history', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { limit = '50' } = req.query;

    // Validate platform
    const validPlatforms = ['youtube', 'meta', 'facebook', 'instagram', 'tiktok'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({ error: `Invalid platform: ${platform}` });
      return;
    }

    const manager = await getPublishingManager();
    if (!manager) {
      res.status(503).json({ error: 'Publishing manager not available' });
      return;
    }

    const allHistory = manager.getHistory(parseInt(limit as string, 10) * 2 || 100);
    const platformHistory = allHistory.filter((entry: any) => entry.platform === platform);

    res.json({
      platform,
      history: platformHistory.slice(0, parseInt(limit as string, 10) || 50),
      count: platformHistory.length,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[publish-api] Error getting platform history:', error);
    res.status(500).json({ error: 'Failed to get publishing history' });
  }
});
