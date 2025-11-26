/**
 * Publishing Manager
 * Coordinates publishing across multiple platforms with QC gating.
 */

import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'fs';
import path from 'path';
import { publishingQueue, PublishingQueue } from './publishing-queue.js';
import { youtubeAdapter, YouTubeAdapter } from './youtube-adapter.js';
import { metaAdapter, MetaAdapter } from './meta-adapter.js';
import type {
  PublishingJob,
  PublishingJobRequest,
  PublishingPlatform,
  PublishingAdapter,
  PlatformUploadResult,
  SecretsRotationStatus,
  DEFAULT_PUBLISHING_CONFIG
} from './publishing.types.js';

// Secrets rotation period in days (90 days is standard)
const SECRETS_ROTATION_PERIOD_DAYS = 90;

/**
 * Publishing Manager
 * Handles QC gating, queue management, and multi-platform publishing.
 */
export class PublishingManager {
  private adapters: Map<PublishingPlatform, PublishingAdapter> = new Map();
  private processing: boolean = false;
  private maxConcurrent: number = 2;
  private logPath: string;

  constructor() {
    // Register adapters
    this.adapters.set('youtube', youtubeAdapter);
    this.adapters.set('meta', metaAdapter);
    // TikTok is export-only for now

    // Set up logging
    const logsDir = path.join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    this.logPath = path.join(logsDir, 'publishing.jsonl');
  }

  /**
   * Get adapter for platform
   */
  getAdapter(platform: PublishingPlatform): PublishingAdapter | undefined {
    return this.adapters.get(platform);
  }

  /**
   * Check if platform is configured
   */
  isConfigured(platform: PublishingPlatform): boolean {
    const adapter = this.adapters.get(platform);
    return adapter?.isConfigured() || false;
  }

  /**
   * Get configuration status for all platforms
   */
  getConfigurationStatus(): Record<PublishingPlatform, boolean> {
    return {
      youtube: this.isConfigured('youtube'),
      meta: this.isConfigured('meta'),
      tiktok: false // Export-only
    };
  }

  /**
   * Check QC approval status for episode
   */
  async checkQCApproval(episodeId: string): Promise<{
    approved: boolean;
    reviewedAt?: string;
    reviewedBy?: string;
    reason?: string;
  }> {
    const timelinesDir = path.join(process.cwd(), 'timelines');
    const timelinePath = path.join(timelinesDir, episodeId, 'timeline.json');

    if (!existsSync(timelinePath)) {
      return { approved: false, reason: 'Timeline not found' };
    }

    try {
      const timeline = JSON.parse(readFileSync(timelinePath, 'utf8'));
      const qcFlags = timeline.qcFlags;

      if (!qcFlags) {
        return { approved: false, reason: 'No QC flags found' };
      }

      if (qcFlags.needsHumanReview && !qcFlags.reviewedAt) {
        return { approved: false, reason: 'Episode requires human review' };
      }

      return {
        approved: true,
        reviewedAt: qcFlags.reviewedAt,
        reviewedBy: qcFlags.reviewedBy
      };
    } catch (error) {
      return { approved: false, reason: 'Failed to read timeline' };
    }
  }

  /**
   * Get render info for episode
   */
  async getRenderInfo(episodeId: string): Promise<{
    exists: boolean;
    videoPath?: string;
    renderUrl?: string;
    error?: string;
  }> {
    const rendersDir = path.join(process.cwd(), 'renders');
    const episodeRenderDir = path.join(rendersDir, episodeId);
    const videoPath = path.join(episodeRenderDir, 'master.mp4');

    if (!existsSync(videoPath)) {
      return { exists: false, error: 'Render not found' };
    }

    // Try to get storage URL from storage info
    const storageInfoPath = path.join(episodeRenderDir, 'storage_info.json');
    let renderUrl = `file://${videoPath}`;

    if (existsSync(storageInfoPath)) {
      try {
        const storageInfo = JSON.parse(readFileSync(storageInfoPath, 'utf8'));
        renderUrl = storageInfo.url || renderUrl;
      } catch {
        // Use local path
      }
    }

    return {
      exists: true,
      videoPath,
      renderUrl
    };
  }

  /**
   * Create publishing jobs for episode
   */
  async createPublishingJobs(request: PublishingJobRequest): Promise<{
    success: boolean;
    jobs: PublishingJob[];
    errors: string[];
  }> {
    const jobs: PublishingJob[] = [];
    const errors: string[] = [];

    // Check QC approval (unless force publish)
    if (!request.force) {
      const qcStatus = await this.checkQCApproval(request.episodeId);
      if (!qcStatus.approved) {
        return {
          success: false,
          jobs: [],
          errors: [`QC not approved: ${qcStatus.reason}`]
        };
      }
    }

    // Check render exists
    const renderInfo = await this.getRenderInfo(request.episodeId);
    if (!renderInfo.exists) {
      return {
        success: false,
        jobs: [],
        errors: [renderInfo.error || 'Render not found']
      };
    }

    // Create job for each platform
    for (const platform of request.platforms) {
      if (platform === 'tiktok') {
        errors.push('TikTok: Export-only, manual upload required');
        continue;
      }

      if (!this.isConfigured(platform)) {
        errors.push(`${platform}: Not configured`);
        continue;
      }

      const job = publishingQueue.createJob(
        request.episodeId,
        platform,
        renderInfo.videoPath!,
        renderInfo.renderUrl!,
        request
      );

      // If QC approved, queue immediately
      if (!request.force) {
        const qcStatus = await this.checkQCApproval(request.episodeId);
        if (qcStatus.approved) {
          publishingQueue.queueJob(job.id, {
            approvedAt: qcStatus.reviewedAt!,
            approvedBy: qcStatus.reviewedBy!
          });
        }
      } else {
        publishingQueue.queueJob(job.id, {
          approvedAt: new Date().toISOString(),
          approvedBy: request.actor || 'force_publish'
        });
      }

      jobs.push(job);
    }

    return {
      success: jobs.length > 0,
      jobs,
      errors
    };
  }

  /**
   * Start processing the publishing queue
   */
  async startProcessing(): Promise<void> {
    if (this.processing) {
      console.log('[publishing-manager] Already processing');
      return;
    }

    this.processing = true;
    console.log('[publishing-manager] Started queue processing');

    while (this.processing) {
      const activeCount = publishingQueue.getActiveCount();
      if (activeCount >= this.maxConcurrent) {
        await this.sleep(1000);
        continue;
      }

      const job = publishingQueue.dequeue();
      if (!job) {
        await this.sleep(1000);
        continue;
      }

      // Process job (don't await to allow concurrent processing)
      this.processJob(job).catch(error => {
        console.error(`[publishing-manager] Error processing job ${job.id}:`, error);
        publishingQueue.failJob(job.id, error.message || 'Unknown error');
      });
    }
  }

  /**
   * Stop processing
   */
  stopProcessing(): void {
    this.processing = false;
    console.log('[publishing-manager] Stopped queue processing');
  }

  /**
   * Process a single publishing job
   */
  async processJob(job: PublishingJob): Promise<void> {
    console.log(`[publishing-manager] Starting job ${job.id} for ${job.episodeId} on ${job.platform}`);

    const adapter = this.adapters.get(job.platform);
    if (!adapter) {
      publishingQueue.failJob(job.id, `No adapter for platform: ${job.platform}`);
      return;
    }

    try {
      // Upload to platform
      const result = await adapter.upload(job.videoPath, job.metadata);

      if (result.success && result.videoId && result.videoUrl) {
        publishingQueue.completeJob(job.id, result.videoId, result.videoUrl);
        this.logPublish(job, result);
        console.log(`[publishing-manager] Completed job ${job.id}: ${result.videoUrl}`);
      } else {
        publishingQueue.failJob(job.id, result.error || 'Upload failed');
        this.logPublish(job, result);
      }
    } catch (error: any) {
      publishingQueue.failJob(job.id, error.message || 'Unknown error');
      this.logPublish(job, { success: false, error: error.message });
    }
  }

  /**
   * Publish single episode to platform
   */
  async publishEpisode(
    episodeId: string,
    platform: PublishingPlatform,
    metadata: PublishingJobRequest['metadata'],
    options?: { force?: boolean; actor?: string }
  ): Promise<{
    success: boolean;
    job?: PublishingJob;
    result?: PlatformUploadResult;
    error?: string;
  }> {
    const request: PublishingJobRequest = {
      episodeId,
      platforms: [platform],
      metadata,
      force: options?.force,
      actor: options?.actor
    };

    const { success, jobs, errors } = await this.createPublishingJobs(request);

    if (!success || jobs.length === 0) {
      return {
        success: false,
        error: errors.join('; ')
      };
    }

    const job = jobs[0];

    // Process immediately
    await this.processJob(job);

    // Get updated job status
    const updatedJob = publishingQueue.getJob(job.id);

    return {
      success: updatedJob?.status === 'completed',
      job: updatedJob,
      result: updatedJob?.status === 'completed'
        ? { success: true, videoId: updatedJob.platformVideoId, videoUrl: updatedJob.platformUrl }
        : undefined,
      error: updatedJob?.error
    };
  }

  /**
   * Log publishing event
   */
  private logPublish(job: PublishingJob, result: Partial<PlatformUploadResult>): void {
    try {
      const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        jobId: job.id,
        episodeId: job.episodeId,
        platform: job.platform,
        success: result.success,
        videoId: result.videoId,
        videoUrl: result.videoUrl,
        error: result.error,
        uploadDuration: result.uploadDuration,
        actor: job.actor
      }) + '\n';

      appendFileSync(this.logPath, entry);
    } catch (error) {
      console.warn('[publishing-manager] Failed to log:', error);
    }
  }

  /**
   * Get secrets rotation status
   */
  getSecretsRotationStatus(): SecretsRotationStatus[] {
    const statuses: SecretsRotationStatus[] = [];

    // Check each platform's secrets
    const platforms: PublishingPlatform[] = ['youtube', 'meta'];
    
    for (const platform of platforms) {
      const envVar = `${platform.toUpperCase()}_SECRETS_LAST_ROTATED`;
      const lastRotatedStr = process.env[envVar];
      
      let lastRotatedAt: string | undefined;
      let rotationDueAt: string | undefined;
      let isOverdue = false;
      let daysUntilRotation: number | undefined;

      if (lastRotatedStr) {
        lastRotatedAt = lastRotatedStr;
        const lastRotated = new Date(lastRotatedStr);
        const rotationDue = new Date(lastRotated);
        rotationDue.setDate(rotationDue.getDate() + SECRETS_ROTATION_PERIOD_DAYS);
        rotationDueAt = rotationDue.toISOString();
        
        const now = new Date();
        isOverdue = now > rotationDue;
        daysUntilRotation = Math.ceil((rotationDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        isOverdue = true;
      }

      statuses.push({
        platform,
        lastRotatedAt,
        rotationDueAt,
        isOverdue,
        daysUntilRotation
      });
    }

    return statuses;
  }

  /**
   * Get publishing history
   */
  getHistory(limit?: number): Array<{ timestamp: string; [key: string]: unknown }> {
    try {
      if (!existsSync(this.logPath)) {
        return [];
      }

      const content = readFileSync(this.logPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      const entries: Array<{ timestamp: string; [key: string]: unknown }> = [];

      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // Skip invalid lines
        }
      }

      // Sort by timestamp descending
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return limit ? entries.slice(0, limit) : entries;
    } catch {
      return [];
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const publishingManager = new PublishingManager();
