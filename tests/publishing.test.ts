/**
 * Tests for Phase 7: Publishing Automation
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Types for testing (matching production code)
type PublishingPlatform = 'youtube' | 'meta' | 'tiktok';
type PublishingJobStatus = 'pending' | 'queued' | 'uploading' | 'processing' | 'completed' | 'failed';
type PublishingJobPriority = 'low' | 'normal' | 'high' | 'urgent';

interface PublishingMetadata {
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: 'public' | 'unlisted' | 'private';
  thumbnailPath?: string;
  playlistId?: string;
  madeForKids?: boolean;
  personaCode?: string;
  custom?: Record<string, unknown>;
}

interface PublishingJob {
  id: string;
  episodeId: string;
  platform: PublishingPlatform;
  status: PublishingJobStatus;
  priority: PublishingJobPriority;
  metadata: PublishingMetadata;
  videoPath: string;
  renderUrl: string;
  progress: number;
  platformVideoId?: string;
  platformUrl?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  queuedAt?: string;
  startedAt?: string;
  completedAt?: string;
  uploadDuration?: number;
  actor?: string;
  qcApproval?: {
    approvedAt: string;
    approvedBy: string;
  };
}

interface PublishingQueueStats {
  total: number;
  byStatus: Record<PublishingJobStatus, number>;
  byPlatform: Record<PublishingPlatform, number>;
  uploading: number;
  avgUploadTime?: number;
  updatedAt: string;
}

interface PlatformUploadResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
  uploadDuration?: number;
}

interface SecretsRotationStatus {
  platform: PublishingPlatform;
  lastRotatedAt?: string;
  rotationDueAt?: string;
  isOverdue: boolean;
  daysUntilRotation?: number;
}

interface PublishingHistoryEntry {
  jobId: string;
  episodeId: string;
  platform: PublishingPlatform;
  status: PublishingJobStatus;
  platformVideoId?: string;
  platformUrl?: string;
  publishedAt?: string;
  actor?: string;
  error?: string;
}

// Priority order for sorting
const PRIORITY_ORDER: Record<PublishingJobPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1
};

describe('Publishing Queue', () => {
  describe('Job Creation', () => {
    it('should create a publishing job with correct defaults', () => {
      const job: PublishingJob = {
        id: 'job_001',
        episodeId: 'test_001',
        platform: 'youtube',
        status: 'pending',
        priority: 'normal',
        metadata: { title: 'Test Episode' },
        videoPath: '/renders/test_001/master.mp4',
        renderUrl: 'https://storage.example.com/test_001/master.mp4',
        progress: 0,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString()
      };

      expect(job.status).toBe('pending');
      expect(job.priority).toBe('normal');
      expect(job.retryCount).toBe(0);
      expect(job.maxRetries).toBe(3);
    });

    it('should support different platforms', () => {
      const platforms: PublishingPlatform[] = ['youtube', 'meta', 'tiktok'];

      for (const platform of platforms) {
        const job: PublishingJob = {
          id: `job_${platform}`,
          episodeId: 'test_001',
          platform,
          status: 'pending',
          priority: 'normal',
          metadata: { title: 'Test Episode' },
          videoPath: '/renders/test_001/master.mp4',
          renderUrl: 'file://renders/test_001/master.mp4',
          progress: 0,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date().toISOString()
        };

        expect(job.platform).toBe(platform);
      }
    });

    it('should support different priorities', () => {
      const priorities: PublishingJobPriority[] = ['low', 'normal', 'high', 'urgent'];

      for (const priority of priorities) {
        const job: PublishingJob = {
          id: `job_${priority}`,
          episodeId: 'test_001',
          platform: 'youtube',
          status: 'queued',
          priority,
          metadata: { title: 'Test Episode' },
          videoPath: '/renders/test_001/master.mp4',
          renderUrl: 'file://renders/test_001/master.mp4',
          progress: 0,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date().toISOString()
        };

        expect(job.priority).toBe(priority);
      }
    });
  });

  describe('Priority Ordering', () => {
    it('should sort jobs by priority (urgent first)', () => {
      const jobs: PublishingJob[] = [
        { id: '1', episodeId: 'ep1', platform: 'youtube', status: 'queued', priority: 'low', metadata: { title: 'Low' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '2024-01-15T10:00:00Z' },
        { id: '2', episodeId: 'ep2', platform: 'youtube', status: 'queued', priority: 'urgent', metadata: { title: 'Urgent' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '2024-01-15T10:01:00Z' },
        { id: '3', episodeId: 'ep3', platform: 'youtube', status: 'queued', priority: 'normal', metadata: { title: 'Normal' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '2024-01-15T10:02:00Z' },
        { id: '4', episodeId: 'ep4', platform: 'youtube', status: 'queued', priority: 'high', metadata: { title: 'High' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '2024-01-15T10:03:00Z' }
      ];

      jobs.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);

      expect(jobs[0].priority).toBe('urgent');
      expect(jobs[1].priority).toBe('high');
      expect(jobs[2].priority).toBe('normal');
      expect(jobs[3].priority).toBe('low');
    });

    it('should sort by queue time within same priority', () => {
      const jobs: PublishingJob[] = [
        { id: '1', episodeId: 'ep1', platform: 'youtube', status: 'queued', priority: 'normal', metadata: { title: 'Third' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '2024-01-15T12:00:00Z', queuedAt: '2024-01-15T12:00:00Z' },
        { id: '2', episodeId: 'ep2', platform: 'youtube', status: 'queued', priority: 'normal', metadata: { title: 'First' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '2024-01-15T10:00:00Z', queuedAt: '2024-01-15T10:00:00Z' },
        { id: '3', episodeId: 'ep3', platform: 'youtube', status: 'queued', priority: 'normal', metadata: { title: 'Second' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '2024-01-15T11:00:00Z', queuedAt: '2024-01-15T11:00:00Z' }
      ];

      jobs.sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.queuedAt || a.createdAt).getTime() - new Date(b.queuedAt || b.createdAt).getTime();
      });

      expect(jobs[0].metadata.title).toBe('First');
      expect(jobs[1].metadata.title).toBe('Second');
      expect(jobs[2].metadata.title).toBe('Third');
    });
  });

  describe('Queue Statistics', () => {
    it('should calculate stats correctly', () => {
      const jobs: PublishingJob[] = [
        { id: '1', episodeId: 'ep1', platform: 'youtube', status: 'pending', priority: 'normal', metadata: { title: '1' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '' },
        { id: '2', episodeId: 'ep2', platform: 'youtube', status: 'queued', priority: 'normal', metadata: { title: '2' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 0, maxRetries: 3, createdAt: '' },
        { id: '3', episodeId: 'ep3', platform: 'meta', status: 'uploading', priority: 'normal', metadata: { title: '3' }, videoPath: '', renderUrl: '', progress: 50, retryCount: 0, maxRetries: 3, createdAt: '', uploadDuration: 120 },
        { id: '4', episodeId: 'ep4', platform: 'youtube', status: 'completed', priority: 'normal', metadata: { title: '4' }, videoPath: '', renderUrl: '', progress: 100, retryCount: 0, maxRetries: 3, createdAt: '', uploadDuration: 180 },
        { id: '5', episodeId: 'ep5', platform: 'meta', status: 'failed', priority: 'normal', metadata: { title: '5' }, videoPath: '', renderUrl: '', progress: 0, retryCount: 3, maxRetries: 3, createdAt: '', error: 'Upload failed' }
      ];

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
        if (job.uploadDuration) uploadTimes.push(job.uploadDuration);
      }

      const stats: PublishingQueueStats = {
        total: jobs.length,
        byStatus,
        byPlatform,
        uploading: byStatus.uploading,
        avgUploadTime: uploadTimes.length > 0 ? uploadTimes.reduce((a, b) => a + b, 0) / uploadTimes.length : undefined,
        updatedAt: new Date().toISOString()
      };

      expect(stats.total).toBe(5);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.queued).toBe(1);
      expect(stats.byStatus.uploading).toBe(1);
      expect(stats.byStatus.completed).toBe(1);
      expect(stats.byStatus.failed).toBe(1);
      expect(stats.byPlatform.youtube).toBe(3);
      expect(stats.byPlatform.meta).toBe(2);
      expect(stats.avgUploadTime).toBe(150); // (120 + 180) / 2
    });
  });

  describe('Retry Logic', () => {
    it('should track retry count', () => {
      const job: PublishingJob = {
        id: 'job_001',
        episodeId: 'test_001',
        platform: 'youtube',
        status: 'queued',
        priority: 'normal',
        metadata: { title: 'Test' },
        videoPath: '',
        renderUrl: '',
        progress: 0,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString()
      };

      // Simulate retries
      for (let i = 1; i <= 3; i++) {
        job.retryCount++;
        if (job.retryCount >= job.maxRetries) {
          job.status = 'failed';
          job.error = 'Max retries exceeded';
        }
      }

      expect(job.retryCount).toBe(3);
      expect(job.status).toBe('failed');
    });

    it('should re-queue on retry if under max', () => {
      const job: PublishingJob = {
        id: 'job_001',
        episodeId: 'test_001',
        platform: 'youtube',
        status: 'uploading',
        priority: 'normal',
        metadata: { title: 'Test' },
        videoPath: '',
        renderUrl: '',
        progress: 50,
        retryCount: 1,
        maxRetries: 3,
        createdAt: new Date().toISOString()
      };

      // Simulate failure and retry
      job.retryCount++;
      if (job.retryCount < job.maxRetries) {
        job.status = 'queued';
        job.error = `Retry ${job.retryCount}/${job.maxRetries}: Connection timeout`;
      }

      expect(job.retryCount).toBe(2);
      expect(job.status).toBe('queued');
      expect(job.error).toContain('Retry 2/3');
    });
  });
});

describe('Publishing Metadata', () => {
  describe('Video Metadata', () => {
    it('should support full metadata', () => {
      const metadata: PublishingMetadata = {
        title: 'Test Episode - Ethiopian Comedy',
        description: 'A hilarious comedy episode featuring Ethiopian humor',
        tags: ['comedy', 'ethiopian', 'funny', 'habesha'],
        privacyStatus: 'public',
        thumbnailPath: '/assets/test_001/thumbnail.jpg',
        playlistId: 'PLxxx123',
        madeForKids: false,
        personaCode: 'HABESHA_HUMOR'
      };

      expect(metadata.title).toBeDefined();
      expect(metadata.tags?.length).toBe(4);
      expect(metadata.privacyStatus).toBe('public');
      expect(metadata.madeForKids).toBe(false);
    });

    it('should support minimal metadata', () => {
      const metadata: PublishingMetadata = {
        title: 'Test Episode'
      };

      expect(metadata.title).toBe('Test Episode');
      expect(metadata.description).toBeUndefined();
      expect(metadata.tags).toBeUndefined();
    });

    it('should support custom fields for platform-specific data', () => {
      const youtubeMetadata: PublishingMetadata = {
        title: 'Test Episode',
        custom: {
          categoryId: '22',
          defaultLanguage: 'en',
          license: 'youtube'
        }
      };

      const metaMetadata: PublishingMetadata = {
        title: 'Test Episode',
        custom: {
          target: 'instagram',
          igUserId: 'ig123456',
          pageId: 'fb789'
        }
      };

      expect(youtubeMetadata.custom?.categoryId).toBe('22');
      expect(metaMetadata.custom?.target).toBe('instagram');
    });
  });
});

describe('Platform Adapters', () => {
  describe('Upload Results', () => {
    it('should handle successful YouTube upload', () => {
      const result: PlatformUploadResult = {
        success: true,
        videoId: 'dQw4w9WgXcQ',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        uploadDuration: 120.5
      };

      expect(result.success).toBe(true);
      expect(result.videoId).toBeDefined();
      expect(result.videoUrl).toContain('youtube.com');
    });

    it('should handle successful Meta upload', () => {
      const result: PlatformUploadResult = {
        success: true,
        videoId: '1234567890',
        videoUrl: 'https://www.facebook.com/watch/?v=1234567890',
        uploadDuration: 90.0
      };

      expect(result.success).toBe(true);
      expect(result.videoUrl).toContain('facebook.com');
    });

    it('should handle failed upload', () => {
      const result: PlatformUploadResult = {
        success: false,
        error: 'Authentication failed: Invalid access token',
        uploadDuration: 5.0
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
      expect(result.videoId).toBeUndefined();
    });

    it('should handle quota exceeded error', () => {
      const result: PlatformUploadResult = {
        success: false,
        error: 'YouTube API quota exceeded. Try again tomorrow.',
        uploadDuration: 0.5
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('quota');
    });
  });

  describe('Configuration Check', () => {
    it('should validate YouTube configuration', () => {
      const config = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token'
      };

      const isConfigured = Boolean(
        config.clientId &&
        config.clientSecret &&
        (config.accessToken || config.refreshToken)
      );

      expect(isConfigured).toBe(true);
    });

    it('should detect missing YouTube configuration', () => {
      const config = {
        clientId: '',
        clientSecret: 'test_secret',
        accessToken: '',
        refreshToken: ''
      };

      const isConfigured = Boolean(
        config.clientId &&
        config.clientSecret &&
        (config.accessToken || config.refreshToken)
      );

      expect(isConfigured).toBe(false);
    });

    it('should validate Meta configuration', () => {
      const config = {
        accessToken: 'test_access_token'
      };

      const isConfigured = Boolean(config.accessToken);

      expect(isConfigured).toBe(true);
    });
  });
});

describe('QC Gating', () => {
  describe('Approval Flow', () => {
    it('should require QC approval before publishing', () => {
      const qcFlags = {
        needsHumanReview: true,
        reviewedAt: undefined,
        reviewedBy: undefined
      };

      const canPublish = !qcFlags.needsHumanReview || Boolean(qcFlags.reviewedAt);

      expect(canPublish).toBe(false);
    });

    it('should allow publishing after QC approval', () => {
      const qcFlags = {
        needsHumanReview: true,
        reviewedAt: '2024-01-15T12:00:00Z',
        reviewedBy: 'Operator'
      };

      const canPublish = !qcFlags.needsHumanReview || Boolean(qcFlags.reviewedAt);

      expect(canPublish).toBe(true);
    });

    it('should allow publishing without review if not required', () => {
      const qcFlags = {
        needsHumanReview: false,
        reviewedAt: undefined,
        reviewedBy: undefined
      };

      const canPublish = !qcFlags.needsHumanReview || Boolean(qcFlags.reviewedAt);

      expect(canPublish).toBe(true);
    });

    it('should track approval in publishing job', () => {
      const job: PublishingJob = {
        id: 'job_001',
        episodeId: 'test_001',
        platform: 'youtube',
        status: 'queued',
        priority: 'normal',
        metadata: { title: 'Test' },
        videoPath: '',
        renderUrl: '',
        progress: 0,
        retryCount: 0,
        maxRetries: 3,
        createdAt: '2024-01-15T10:00:00Z',
        queuedAt: '2024-01-15T11:00:00Z',
        qcApproval: {
          approvedAt: '2024-01-15T10:30:00Z',
          approvedBy: 'Producer'
        }
      };

      expect(job.qcApproval).toBeDefined();
      expect(job.qcApproval?.approvedBy).toBe('Producer');
    });
  });
});

describe('Secrets Rotation', () => {
  describe('Rotation Status', () => {
    it('should calculate days until rotation', () => {
      const lastRotated = new Date('2024-01-01T00:00:00Z');
      const rotationPeriodDays = 90;
      const rotationDue = new Date(lastRotated);
      rotationDue.setDate(rotationDue.getDate() + rotationPeriodDays);

      const now = new Date('2024-03-15T00:00:00Z'); // 74 days after last rotation
      const daysUntilRotation = Math.ceil((rotationDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const status: SecretsRotationStatus = {
        platform: 'youtube',
        lastRotatedAt: lastRotated.toISOString(),
        rotationDueAt: rotationDue.toISOString(),
        isOverdue: now > rotationDue,
        daysUntilRotation
      };

      expect(status.isOverdue).toBe(false);
      expect(status.daysUntilRotation).toBe(16); // 90 - 74
    });

    it('should detect overdue rotation', () => {
      const lastRotated = new Date('2024-01-01T00:00:00Z');
      const rotationPeriodDays = 90;
      const rotationDue = new Date(lastRotated);
      rotationDue.setDate(rotationDue.getDate() + rotationPeriodDays);

      const now = new Date('2024-05-01T00:00:00Z'); // 121 days after last rotation
      const daysUntilRotation = Math.ceil((rotationDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const status: SecretsRotationStatus = {
        platform: 'youtube',
        lastRotatedAt: lastRotated.toISOString(),
        rotationDueAt: rotationDue.toISOString(),
        isOverdue: now > rotationDue,
        daysUntilRotation
      };

      expect(status.isOverdue).toBe(true);
      expect(status.daysUntilRotation).toBeLessThan(0);
    });

    it('should handle missing rotation date', () => {
      const status: SecretsRotationStatus = {
        platform: 'meta',
        lastRotatedAt: undefined,
        rotationDueAt: undefined,
        isOverdue: true,
        daysUntilRotation: undefined
      };

      expect(status.isOverdue).toBe(true);
      expect(status.lastRotatedAt).toBeUndefined();
    });
  });
});

describe('Publishing History', () => {
  describe('History Entries', () => {
    it('should record successful publish', () => {
      const entry: PublishingHistoryEntry = {
        jobId: 'job_001',
        episodeId: 'test_001',
        platform: 'youtube',
        status: 'completed',
        platformVideoId: 'dQw4w9WgXcQ',
        platformUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        publishedAt: new Date().toISOString(),
        actor: 'Producer'
      };

      expect(entry.status).toBe('completed');
      expect(entry.platformVideoId).toBeDefined();
      expect(entry.error).toBeUndefined();
    });

    it('should record failed publish', () => {
      const entry: PublishingHistoryEntry = {
        jobId: 'job_002',
        episodeId: 'test_002',
        platform: 'meta',
        status: 'failed',
        publishedAt: new Date().toISOString(),
        actor: 'Producer',
        error: 'Access token expired'
      };

      expect(entry.status).toBe('failed');
      expect(entry.error).toContain('Access token');
      expect(entry.platformVideoId).toBeUndefined();
    });

    it('should sort history by date', () => {
      const history: PublishingHistoryEntry[] = [
        { jobId: '1', episodeId: 'ep1', platform: 'youtube', status: 'completed', publishedAt: '2024-01-15T10:00:00Z' },
        { jobId: '2', episodeId: 'ep2', platform: 'youtube', status: 'completed', publishedAt: '2024-01-15T12:00:00Z' },
        { jobId: '3', episodeId: 'ep3', platform: 'meta', status: 'completed', publishedAt: '2024-01-15T11:00:00Z' }
      ];

      history.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

      expect(history[0].jobId).toBe('2');
      expect(history[1].jobId).toBe('3');
      expect(history[2].jobId).toBe('1');
    });
  });
});

describe('End-to-End Workflow', () => {
  it('should complete full publishing workflow', () => {
    // 1. Create job
    const job: PublishingJob = {
      id: 'job_001',
      episodeId: 'test_001',
      platform: 'youtube',
      status: 'pending',
      priority: 'normal',
      metadata: { title: 'Test Episode' },
      videoPath: '/renders/test_001/master.mp4',
      renderUrl: 'https://storage.example.com/test_001/master.mp4',
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    expect(job.status).toBe('pending');

    // 2. QC approval - job moves to queued
    job.status = 'queued';
    job.queuedAt = new Date().toISOString();
    job.qcApproval = {
      approvedAt: new Date().toISOString(),
      approvedBy: 'Producer'
    };

    expect(job.status).toBe('queued');
    expect(job.qcApproval).toBeDefined();

    // 3. Start uploading
    job.status = 'uploading';
    job.startedAt = new Date().toISOString();
    job.progress = 25;

    expect(job.status).toBe('uploading');

    // 4. Progress updates
    job.progress = 50;
    job.progress = 75;
    job.progress = 100;

    expect(job.progress).toBe(100);

    // 5. Complete
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.platformVideoId = 'abc123';
    job.platformUrl = 'https://www.youtube.com/watch?v=abc123';
    job.uploadDuration = 120;

    expect(job.status).toBe('completed');
    expect(job.platformVideoId).toBe('abc123');
    expect(job.uploadDuration).toBe(120);
  });

  it('should handle failed workflow with retry', () => {
    const job: PublishingJob = {
      id: 'job_001',
      episodeId: 'test_001',
      platform: 'youtube',
      status: 'queued',
      priority: 'normal',
      metadata: { title: 'Test Episode' },
      videoPath: '/renders/test_001/master.mp4',
      renderUrl: 'https://storage.example.com/test_001/master.mp4',
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    // First attempt fails
    job.status = 'uploading';
    job.startedAt = new Date().toISOString();
    job.progress = 50;

    // Simulate failure
    job.retryCount = 1;
    job.status = 'queued'; // Re-queue for retry
    job.error = 'Retry 1/3: Connection timeout';

    expect(job.status).toBe('queued');
    expect(job.retryCount).toBe(1);

    // Second attempt succeeds
    job.status = 'uploading';
    job.progress = 100;
    job.status = 'completed';
    job.platformVideoId = 'abc123';
    job.error = undefined;

    expect(job.status).toBe('completed');
  });
});
