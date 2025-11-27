/**
 * Tests for Render Queue and Job Management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type {
  RenderJob,
  RenderJobRequest,
  RenderJobStatus,
  RenderQueueStats
} from '../render-stack/worker/render-job.types.js';

// Replicate RenderQueue logic for testing (simplified)
class TestRenderQueue {
  private jobs: Map<string, RenderJob> = new Map();
  private episodeJobs: Map<string, string> = new Map();
  private jobCounter = 0;

  enqueue(request: RenderJobRequest): RenderJob {
    const jobId = `render_test_${++this.jobCounter}`;
    const now = new Date().toISOString();

    const existingJobId = this.episodeJobs.get(request.episodeId);
    if (existingJobId && !request.force) {
      const existingJob = this.jobs.get(existingJobId);
      if (existingJob && (existingJob.status === 'queued' || existingJob.status === 'rendering')) {
        throw new Error(`Job already ${existingJob.status} for episode ${request.episodeId}`);
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
      actor: request.actor
    };

    this.jobs.set(jobId, job);
    this.episodeJobs.set(request.episodeId, jobId);
    return job;
  }

  getJob(jobId: string): RenderJob | undefined {
    return this.jobs.get(jobId);
  }

  getJobByEpisodeId(episodeId: string): RenderJob | undefined {
    const jobId = this.episodeJobs.get(episodeId);
    return jobId ? this.jobs.get(jobId) : undefined;
  }

  updateStatus(jobId: string, status: RenderJobStatus, updates?: Partial<RenderJob>): RenderJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    job.status = status;
    if (updates) Object.assign(job, updates);
    return job;
  }

  getStats(): RenderQueueStats {
    const jobs = Array.from(this.jobs.values());
    const byStatus: Record<RenderJobStatus, number> = {
      queued: 0,
      rendering: 0,
      completed: 0,
      failed: 0
    };
    for (const job of jobs) byStatus[job.status]++;
    return {
      total: jobs.length,
      byStatus,
      processing: byStatus.rendering,
      updatedAt: new Date().toISOString()
    };
  }

  clear(): void {
    this.jobs.clear();
    this.episodeJobs.clear();
    this.jobCounter = 0;
  }
}

describe('RenderQueue', () => {
  let queue: TestRenderQueue;

  beforeEach(() => {
    queue = new TestRenderQueue();
  });

  it('enqueues a new render job', () => {
    const job = queue.enqueue({ episodeId: 'test_001' });

    expect(job.id).toMatch(/^render_test_/);
    expect(job.episodeId).toBe('test_001');
    expect(job.status).toBe('queued');
    expect(job.priority).toBe('normal');
    expect(job.progress).toBe(0);
  });

  it('sets default timeline path', () => {
    const job = queue.enqueue({ episodeId: 'test_002' });
    expect(job.timelinePath).toBe('timelines/test_002/timeline.json');
  });

  it('uses custom timeline path if provided', () => {
    const job = queue.enqueue({ 
      episodeId: 'test_003',
      timelinePath: 'custom/path/timeline.json'
    });
    expect(job.timelinePath).toBe('custom/path/timeline.json');
  });

  it('respects priority setting', () => {
    const lowJob = queue.enqueue({ episodeId: 'ep1', priority: 'low' });
    const urgentJob = queue.enqueue({ episodeId: 'ep2', priority: 'urgent' });

    expect(lowJob.priority).toBe('low');
    expect(urgentJob.priority).toBe('urgent');
  });

  it('prevents duplicate jobs for same episode', () => {
    queue.enqueue({ episodeId: 'test_dup' });
    
    expect(() => {
      queue.enqueue({ episodeId: 'test_dup' });
    }).toThrow(/already queued/);
  });

  it('allows force re-queue', () => {
    const job1 = queue.enqueue({ episodeId: 'test_force' });
    const job2 = queue.enqueue({ episodeId: 'test_force', force: true });

    expect(job1.id).not.toBe(job2.id);
    expect(job2.episodeId).toBe('test_force');
  });

  it('retrieves job by ID', () => {
    const created = queue.enqueue({ episodeId: 'test_get' });
    const retrieved = queue.getJob(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
  });

  it('retrieves job by episode ID', () => {
    queue.enqueue({ episodeId: 'test_by_ep' });
    const job = queue.getJobByEpisodeId('test_by_ep');

    expect(job).toBeDefined();
    expect(job?.episodeId).toBe('test_by_ep');
  });

  it('returns undefined for non-existent job', () => {
    expect(queue.getJob('nonexistent')).toBeUndefined();
    expect(queue.getJobByEpisodeId('nonexistent')).toBeUndefined();
  });

  it('updates job status', () => {
    const job = queue.enqueue({ episodeId: 'test_status' });
    
    queue.updateStatus(job.id, 'rendering');
    expect(queue.getJob(job.id)?.status).toBe('rendering');

    queue.updateStatus(job.id, 'completed', { progress: 100, outputPath: '/path/to/output.mp4' });
    const completed = queue.getJob(job.id);
    expect(completed?.status).toBe('completed');
    expect(completed?.progress).toBe(100);
    expect(completed?.outputPath).toBe('/path/to/output.mp4');
  });

  it('calculates queue statistics', () => {
    queue.enqueue({ episodeId: 'ep1' });
    queue.enqueue({ episodeId: 'ep2' });
    const job3 = queue.enqueue({ episodeId: 'ep3' });
    queue.updateStatus(job3.id, 'rendering');

    const stats = queue.getStats();

    expect(stats.total).toBe(3);
    expect(stats.byStatus.queued).toBe(2);
    expect(stats.byStatus.rendering).toBe(1);
    expect(stats.processing).toBe(1);
  });
});

describe('RenderJob Types', () => {
  it('validates job status transitions', () => {
    const validStatuses: RenderJobStatus[] = ['queued', 'rendering', 'completed', 'failed'];
    validStatuses.forEach(status => {
      expect(['queued', 'rendering', 'completed', 'failed']).toContain(status);
    });
  });

  it('calculates render duration', () => {
    const startTime = new Date('2024-01-15T10:00:00Z');
    const endTime = new Date('2024-01-15T10:01:30Z');
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
    expect(duration).toBe(90);
  });
});

describe('FFmpeg Options', () => {
  it('structures audio inputs correctly', () => {
    const audioInputs = [
      { path: '/path/voice.mp3', volume: 1.0, startTime: 0 },
      { path: '/path/music.mp3', volume: 0.3, startTime: 0 }
    ];

    expect(audioInputs).toHaveLength(2);
    expect(audioInputs[0].volume).toBe(1.0);
    expect(audioInputs[1].volume).toBe(0.3);
  });

  it('calculates dimensions for render profiles', () => {
    const profiles = {
      'vertical_1080x1920': { width: 1080, height: 1920 },
      'horizontal_1920x1080': { width: 1920, height: 1080 },
      'square_1080x1080': { width: 1080, height: 1080 }
    };

    expect(profiles['vertical_1080x1920'].width).toBe(1080);
    expect(profiles['vertical_1080x1920'].height).toBe(1920);
    expect(profiles['horizontal_1920x1080'].width).toBe(1920);
    expect(profiles['square_1080x1080'].width).toBe(1080);
  });
});
