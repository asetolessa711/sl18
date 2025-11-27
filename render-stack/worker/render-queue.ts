/**
 * Render Queue
 * In-memory job queue for render jobs (MVP implementation).
 * Can be extended to use Airtable or Redis in production.
 */

import { randomUUID } from 'crypto';
import type {
  RenderJob,
  RenderJobRequest,
  RenderJobStatus,
  RenderJobPriority,
  RenderQueueStats
} from './render-job.types.js';

/** Priority weights for sorting */
const PRIORITY_WEIGHTS: Record<RenderJobPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1
};

/**
 * In-memory render queue
 */
export class RenderQueue {
  private jobs: Map<string, RenderJob> = new Map();
  private episodeJobs: Map<string, string> = new Map(); // episodeId -> jobId (latest)
  private maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Add a new job to the queue
   */
  enqueue(request: RenderJobRequest): RenderJob {
    const jobId = `render_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    // Check if there's already a pending/rendering job for this episode
    const existingJobId = this.episodeJobs.get(request.episodeId);
    if (existingJobId && !request.force) {
      const existingJob = this.jobs.get(existingJobId);
      if (existingJob && (existingJob.status === 'queued' || existingJob.status === 'rendering')) {
        throw new Error(`Job already ${existingJob.status} for episode ${request.episodeId}: ${existingJobId}`);
      }
    }

    const job: RenderJob = {
      id: jobId,
      episodeId: request.episodeId,
      status: 'queued',
      priority: request.priority ?? 'normal',
      timelinePath: request.timelinePath ?? `timelines/${request.episodeId}/timeline.json`,
      progress: 0,
      queuedAt: now,
      actor: request.actor,
      callbackUrl: request.callbackUrl
    };

    this.jobs.set(jobId, job);
    this.episodeJobs.set(request.episodeId, jobId);
    this.pruneHistory();

    console.log(`[render-queue] Enqueued job ${jobId} for episode ${request.episodeId}`);
    return job;
  }

  /**
   * Get the next job to process (highest priority, oldest first)
   */
  dequeue(): RenderJob | undefined {
    const queuedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'queued')
      .sort((a, b) => {
        // Sort by priority (descending), then by queue time (ascending)
        const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime();
      });

    return queuedJobs[0];
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): RenderJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get job by episode ID (latest job)
   */
  getJobByEpisodeId(episodeId: string): RenderJob | undefined {
    const jobId = this.episodeJobs.get(episodeId);
    return jobId ? this.jobs.get(jobId) : undefined;
  }

  /**
   * Update job status
   */
  updateStatus(jobId: string, status: RenderJobStatus, updates?: Partial<RenderJob>): RenderJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    job.status = status;
    const now = new Date().toISOString();

    if (status === 'rendering' && !job.startedAt) {
      job.startedAt = now;
    }

    if (status === 'completed' || status === 'failed') {
      job.completedAt = now;
      if (job.startedAt) {
        job.renderDuration = (new Date(now).getTime() - new Date(job.startedAt).getTime()) / 1000;
      }
    }

    if (updates) {
      Object.assign(job, updates);
    }

    console.log(`[render-queue] Job ${jobId} status: ${status}`);
    return job;
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number): RenderJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    job.progress = Math.min(100, Math.max(0, progress));
    return job;
  }

  /**
   * Mark job as failed
   */
  failJob(jobId: string, error: string): RenderJob | undefined {
    return this.updateStatus(jobId, 'failed', { error });
  }

  /**
   * Mark job as completed
   */
  completeJob(jobId: string, outputPath: string, renderUrl?: string): RenderJob | undefined {
    return this.updateStatus(jobId, 'completed', { 
      outputPath, 
      renderUrl,
      progress: 100 
    });
  }

  /**
   * Get all jobs (optionally filtered by status)
   */
  getJobs(status?: RenderJobStatus): RenderJob[] {
    const jobs = Array.from(this.jobs.values());
    if (status) {
      return jobs.filter(job => job.status === status);
    }
    return jobs;
  }

  /**
   * Get queue statistics
   */
  getStats(): RenderQueueStats {
    const jobs = Array.from(this.jobs.values());
    const byStatus: Record<RenderJobStatus, number> = {
      queued: 0,
      rendering: 0,
      completed: 0,
      failed: 0
    };

    let totalRenderTime = 0;
    let completedCount = 0;

    for (const job of jobs) {
      byStatus[job.status]++;
      if (job.status === 'completed' && job.renderDuration) {
        totalRenderTime += job.renderDuration;
        completedCount++;
      }
    }

    return {
      total: jobs.length,
      byStatus,
      processing: byStatus.rendering,
      avgRenderTime: completedCount > 0 ? totalRenderTime / completedCount : undefined,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get currently rendering jobs count
   */
  getActiveCount(): number {
    return Array.from(this.jobs.values()).filter(job => job.status === 'rendering').length;
  }

  /**
   * Cancel a queued job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'queued') {
      return false;
    }
    this.jobs.delete(jobId);
    console.log(`[render-queue] Cancelled job ${jobId}`);
    return true;
  }

  /**
   * Prune old completed/failed jobs to maintain history size
   */
  private pruneHistory(): void {
    const completedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'completed' || job.status === 'failed')
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    while (completedJobs.length > this.maxHistorySize) {
      const oldJob = completedJobs.pop()!;
      this.jobs.delete(oldJob.id);
      // Also clean up episodeJobs mapping if it points to this job
      const episodeJobId = this.episodeJobs.get(oldJob.episodeId);
      if (episodeJobId === oldJob.id) {
        this.episodeJobs.delete(oldJob.episodeId);
      }
    }
  }

  /**
   * Clear all jobs (for testing)
   */
  clear(): void {
    this.jobs.clear();
    this.episodeJobs.clear();
  }
}

// Singleton instance
export const renderQueue = new RenderQueue();
