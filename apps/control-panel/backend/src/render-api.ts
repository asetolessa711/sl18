/**
 * Render API Routes
 * REST endpoints for render job management.
 * 
 * POST /api/render - Queue a new render job
 * GET /api/render/:jobId - Get job status
 * GET /api/render/episode/:episodeId - Get job by episode ID
 * GET /api/render/queue - Get queue status and stats
 * DELETE /api/render/:jobId - Cancel a queued job
 */

import { Router, type Request, type Response } from 'express';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import render worker components
// Note: These will be dynamically loaded to avoid circular dependencies
let renderQueue: any;
let renderWorker: any;
let workerStarted = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

// Lazy load render modules
async function loadRenderModules() {
  if (!renderQueue) {
    try {
      const queueModule = await import('../../../../render-stack/worker/render-queue.js');
      renderQueue = queueModule.renderQueue;
    } catch (e) {
      console.warn('[render-api] Failed to load render queue:', e);
    }
  }
  if (!renderWorker) {
    try {
      const workerModule = await import('../../../../render-stack/worker/render-worker.js');
      renderWorker = workerModule.renderWorker;
    } catch (e) {
      console.warn('[render-api] Failed to load render worker:', e);
    }
  }
}

export const renderRouter = Router();

/**
 * POST /api/render
 * Queue a new render job
 */
renderRouter.post('/', async (req: Request, res: Response) => {
  await loadRenderModules();
  
  if (!renderQueue) {
    res.status(503).json({ error: 'Render queue not available' });
    return;
  }

  const { episodeId, timelinePath, priority, force, callbackUrl, actor } = req.body ?? {};

  if (!episodeId || typeof episodeId !== 'string') {
    res.status(400).json({ error: 'episodeId is required' });
    return;
  }

  // Validate timeline exists
  const resolvedTimelinePath = timelinePath || `timelines/${episodeId}/timeline.json`;
  const fullTimelinePath = path.join(repoRoot, resolvedTimelinePath);
  
  if (!existsSync(fullTimelinePath)) {
    res.status(404).json({ 
      error: 'Timeline not found',
      timelinePath: resolvedTimelinePath,
      hint: 'Run build-timeline.ts first to create the timeline'
    });
    return;
  }

  try {
    const job = renderQueue.enqueue({
      episodeId,
      timelinePath: resolvedTimelinePath,
      priority: priority || 'normal',
      force: force === true,
      callbackUrl,
      actor
    });

    // Start worker if not already running
    if (renderWorker && !workerStarted) {
      workerStarted = true;
      renderWorker.startProcessing().catch((e: any) => {
        console.error('[render-api] Worker error:', e);
        workerStarted = false;
      });
    }

    res.status(201).json({
      success: true,
      job,
      message: `Render job queued for episode ${episodeId}`
    });
  } catch (error: any) {
    if (error.message?.includes('already')) {
      res.status(409).json({ error: error.message });
    } else {
      console.error('[render-api] Queue error:', error);
      res.status(500).json({ error: 'Failed to queue render job' });
    }
  }
});

/**
 * GET /api/render/queue
 * Get queue status and statistics
 */
renderRouter.get('/queue', async (_req: Request, res: Response) => {
  await loadRenderModules();
  
  if (!renderQueue) {
    res.status(503).json({ error: 'Render queue not available' });
    return;
  }

  try {
    const stats = renderQueue.getStats();
    const queuedJobs = renderQueue.getJobs('queued');
    const renderingJobs = renderQueue.getJobs('rendering');
    const recentCompleted = renderQueue.getJobs('completed').slice(0, 10);
    const recentFailed = renderQueue.getJobs('failed').slice(0, 10);

    res.json({
      stats,
      queued: queuedJobs,
      rendering: renderingJobs,
      recentCompleted,
      recentFailed,
      workerRunning: workerStarted,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[render-api] Queue status error:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

/**
 * GET /api/render/:jobId
 * Get job status by job ID
 */
renderRouter.get('/:jobId', async (req: Request, res: Response) => {
  await loadRenderModules();
  
  if (!renderQueue) {
    res.status(503).json({ error: 'Render queue not available' });
    return;
  }

  const { jobId } = req.params;

  if (!jobId) {
    res.status(400).json({ error: 'jobId is required' });
    return;
  }

  const job = renderQueue.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found', jobId });
    return;
  }

  res.json({ job });
});

/**
 * GET /api/render/episode/:episodeId/status
 * Get job status by episode ID
 */
renderRouter.get('/episode/:episodeId/status', async (req: Request, res: Response) => {
  await loadRenderModules();
  
  if (!renderQueue) {
    res.status(503).json({ error: 'Render queue not available' });
    return;
  }

  const { episodeId } = req.params;

  if (!episodeId) {
    res.status(400).json({ error: 'episodeId is required' });
    return;
  }

  const job = renderQueue.getJobByEpisodeId(episodeId);

  if (!job) {
    res.status(404).json({ 
      error: 'No render job found for episode',
      episodeId,
      hint: 'POST /api/render to queue a new job'
    });
    return;
  }

  res.json({ 
    job,
    isComplete: job.status === 'completed',
    isFailed: job.status === 'failed',
    isProcessing: job.status === 'rendering' || job.status === 'queued'
  });
});

/**
 * DELETE /api/render/:jobId
 * Cancel a queued job
 */
renderRouter.delete('/:jobId', async (req: Request, res: Response) => {
  await loadRenderModules();
  
  if (!renderQueue) {
    res.status(503).json({ error: 'Render queue not available' });
    return;
  }

  const { jobId } = req.params;

  if (!jobId) {
    res.status(400).json({ error: 'jobId is required' });
    return;
  }

  const job = renderQueue.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found', jobId });
    return;
  }

  if (job.status !== 'queued') {
    res.status(400).json({ 
      error: 'Can only cancel queued jobs',
      currentStatus: job.status
    });
    return;
  }

  const cancelled = renderQueue.cancelJob(jobId);

  if (cancelled) {
    res.json({ success: true, message: `Job ${jobId} cancelled` });
  } else {
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

/**
 * POST /api/render/worker/start
 * Start the render worker (if not already running)
 */
renderRouter.post('/worker/start', async (_req: Request, res: Response) => {
  await loadRenderModules();
  
  if (!renderWorker) {
    res.status(503).json({ error: 'Render worker not available' });
    return;
  }

  if (workerStarted) {
    res.json({ success: true, message: 'Worker already running' });
    return;
  }

  try {
    workerStarted = true;
    renderWorker.startProcessing().catch((e: any) => {
      console.error('[render-api] Worker error:', e);
      workerStarted = false;
    });
    res.json({ success: true, message: 'Worker started' });
  } catch (error) {
    workerStarted = false;
    res.status(500).json({ error: 'Failed to start worker' });
  }
});

/**
 * POST /api/render/worker/stop
 * Stop the render worker
 */
renderRouter.post('/worker/stop', async (_req: Request, res: Response) => {
  await loadRenderModules();
  
  if (!renderWorker) {
    res.status(503).json({ error: 'Render worker not available' });
    return;
  }

  if (!workerStarted) {
    res.json({ success: true, message: 'Worker not running' });
    return;
  }

  try {
    renderWorker.stopProcessing();
    workerStarted = false;
    res.json({ success: true, message: 'Worker stopped' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop worker' });
  }
});

/**
 * GET /api/render/health
 * Check render system health (ffmpeg availability, etc.)
 */
renderRouter.get('/health', async (_req: Request, res: Response) => {
  await loadRenderModules();
  
  const health: Record<string, any> = {
    timestamp: new Date().toISOString(),
    queueAvailable: !!renderQueue,
    workerAvailable: !!renderWorker,
    workerRunning: workerStarted
  };

  if (renderWorker) {
    try {
      health.ffmpegAvailable = await renderWorker.checkFFmpeg();
    } catch (e) {
      health.ffmpegAvailable = false;
    }
  }

  if (renderQueue) {
    health.queueStats = renderQueue.getStats();
  }

  const allHealthy = health.queueAvailable && health.workerAvailable && health.ffmpegAvailable !== false;
  
  res.status(allHealthy ? 200 : 503).json(health);
});
