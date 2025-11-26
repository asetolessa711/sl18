/**
 * Publishing Queue
 * In-memory job queue for publishing tasks with priority ordering.
 */

import { randomUUID } from 'crypto';
import type {
  PublishingJob,
  PublishingJobRequest,
  PublishingJobStatus,
  PublishingJobPriority,
  PublishingPlatform,
  PublishingQueueStats,
  PublishingHistoryEntry,
  DEFAULT_PUBLISHING_CONFIG
} from './publishing.types.js';

// Priority order (higher = process first)
const PRIORITY_ORDER: Record<PublishingJobPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1
};

/**
 * Publishing Queue Manager
 */
export class PublishingQueue {
  private jobs: Map<string, PublishingJob> = new Map();
  private history: PublishingHistoryEntry[] = [];
  private maxHistorySize: number = 1000;

  /**
   * Create a new publishing job
   */
  createJob(
    episodeId: string,
    platform: PublishingPlatform,
    videoPath: string,
    renderUrl: string,
    request: Partial<PublishingJobRequest>
  ): PublishingJob {
    const job: PublishingJob = {
      id: randomUUID(),
      episodeId,
      platform,
      status: 'pending',
      priority: request.priority || 'normal',
      metadata: request.metadata || { title: `Episode ${episodeId}` },
      videoPath,
      renderUrl,
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      actor: request.actor
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Queue a job for publishing (mark as queued)
   */
  queueJob(jobId: string, qcApproval?: { approvedAt: string; approvedBy: string }): PublishingJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    job.status = 'queued';
    job.queuedAt = new Date().toISOString();
    if (qcApproval) {
      job.qcApproval = qcApproval;
    }

    return job;
  }

  /**
   * Get the next job to process (by priority)
   */
  dequeue(): PublishingJob | null {
    const queuedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'queued')
      .sort((a, b) => {
        // Sort by priority (higher first)
        const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        // Then by queue time (older first)
        return new Date(a.queuedAt || a.createdAt).getTime() - new Date(b.queuedAt || b.createdAt).getTime();
      });

    if (queuedJobs.length === 0) return null;

    const job = queuedJobs[0];
    job.status = 'uploading';
    job.startedAt = new Date().toISOString();
    return job;
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = Math.min(100, Math.max(0, progress));
    }
  }

  /**
   * Update job status
   */
  updateStatus(jobId: string, status: PublishingJobStatus): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
    }
  }

  /**
   * Complete a job successfully
   */
  completeJob(jobId: string, platformVideoId: string, platformUrl: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.platformVideoId = platformVideoId;
      job.platformUrl = platformUrl;
      job.completedAt = new Date().toISOString();
      
      if (job.startedAt) {
        job.uploadDuration = (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000;
      }

      this.addToHistory(job);
    }
  }

  /**
   * Fail a job
   */
  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.retryCount++;
      
      if (job.retryCount < job.maxRetries) {
        // Re-queue for retry
        job.status = 'queued';
        job.error = `Retry ${job.retryCount}/${job.maxRetries}: ${error}`;
      } else {
        // Max retries exceeded
        job.status = 'failed';
        job.error = error;
        job.completedAt = new Date().toISOString();
        this.addToHistory(job);
      }
    }
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): PublishingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get jobs by episode ID
   */
  getJobsByEpisode(episodeId: string): PublishingJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.episodeId === episodeId);
  }

  /**
   * Get jobs by platform
   */
  getJobsByPlatform(platform: PublishingPlatform): PublishingJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.platform === platform);
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: PublishingJobStatus): PublishingJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.status === status);
  }

  /**
   * Get pending jobs (awaiting QC approval)
   */
  getPendingJobs(): PublishingJob[] {
    return this.getJobsByStatus('pending');
  }

  /**
   * Get queue statistics
   */
  getStats(): PublishingQueueStats {
    const jobs = Array.from(this.jobs.values());
    
    const byStatus: Record<PublishingJobStatus, number> = {
      pending: 0,
      queued: 0,
      uploading: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    const byPlatform: Record<PublishingPlatform, number> = {
      youtube: 0,
      meta: 0,
      tiktok: 0
    };

    const uploadTimes: number[] = [];

    for (const job of jobs) {
      byStatus[job.status]++;
      byPlatform[job.platform]++;
      
      if (job.uploadDuration) {
        uploadTimes.push(job.uploadDuration);
      }
    }

    return {
      total: jobs.length,
      byStatus,
      byPlatform,
      uploading: byStatus.uploading,
      avgUploadTime: uploadTimes.length > 0 
        ? uploadTimes.reduce((a, b) => a + b, 0) / uploadTimes.length 
        : undefined,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get count of active (uploading) jobs
   */
  getActiveCount(): number {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'uploading' || job.status === 'processing')
      .length;
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && (job.status === 'pending' || job.status === 'queued')) {
      this.jobs.delete(jobId);
      return true;
    }
    return false;
  }

  /**
   * Add completed job to history
   */
  private addToHistory(job: PublishingJob): void {
    const entry: PublishingHistoryEntry = {
      jobId: job.id,
      episodeId: job.episodeId,
      platform: job.platform,
      status: job.status,
      platformVideoId: job.platformVideoId,
      platformUrl: job.platformUrl,
      publishedAt: job.completedAt,
      actor: job.actor,
      error: job.error
    };

    this.history.unshift(entry);
    
    // Trim history to max size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get publishing history
   */
  getHistory(limit: number = 50): PublishingHistoryEntry[] {
    return this.history.slice(0, limit);
  }

  /**
   * Get history by episode
   */
  getHistoryByEpisode(episodeId: string): PublishingHistoryEntry[] {
    return this.history.filter(entry => entry.episodeId === episodeId);
  }

  /**
   * Clear completed jobs from memory
   */
  clearCompleted(): number {
    let count = 0;
    for (const [id, job] of this.jobs) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): PublishingJob[] {
    return Array.from(this.jobs.values());
  }
}

// Singleton instance
export const publishingQueue = new PublishingQueue();
