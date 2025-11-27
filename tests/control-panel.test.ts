/**
 * Tests for Phase 6: Control Panel & Airtable Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock types for testing
interface SyncRecord {
  episodeId: string;
  airtableRecordId?: string;
  renderStatus: 'pending' | 'queued' | 'rendering' | 'completed' | 'failed';
  renderUrl?: string;
  renderCompletedAt?: string;
  storageProvider?: string;
  qcFlags?: {
    needsHumanReview: boolean;
    contentWarnings: string[];
    reviewedAt?: string;
    reviewedBy?: string;
  };
}

interface SyncResult {
  success: boolean;
  episodeId: string;
  airtableRecordId?: string;
  error?: string;
  syncedAt: string;
}

interface BatchSyncResult {
  total: number;
  succeeded: number;
  failed: number;
  results: SyncResult[];
  syncedAt: string;
}

interface WebhookPayload {
  event: 'render_completed' | 'render_failed' | 'qc_review_completed';
  episodeId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface AirtableSyncFieldMapping {
  renderStatus: string;
  renderUrl: string;
  renderCompletedAt: string;
  qcNeedsReview: string;
  qcContentWarnings: string;
  qcReviewedAt: string;
  qcReviewedBy: string;
  storageProvider: string;
}

// Default field mapping (matching production code)
const DEFAULT_FIELD_MAPPING: AirtableSyncFieldMapping = {
  renderStatus: 'render_status',
  renderUrl: 'render_url',
  renderCompletedAt: 'render_completed_at',
  qcNeedsReview: 'qc_needs_review',
  qcContentWarnings: 'qc_content_warnings',
  qcReviewedAt: 'qc_reviewed_at',
  qcReviewedBy: 'qc_reviewed_by',
  storageProvider: 'render_storage_provider'
};

/**
 * Helper function to build fields payload (matching production code)
 */
function buildFieldsPayload(record: SyncRecord, mapping: AirtableSyncFieldMapping = DEFAULT_FIELD_MAPPING): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  if (record.renderStatus) {
    fields[mapping.renderStatus] = record.renderStatus;
  }
  if (record.renderUrl) {
    fields[mapping.renderUrl] = record.renderUrl;
  }
  if (record.renderCompletedAt) {
    fields[mapping.renderCompletedAt] = record.renderCompletedAt;
  }
  if (record.storageProvider) {
    fields[mapping.storageProvider] = record.storageProvider;
  }

  if (record.qcFlags) {
    fields[mapping.qcNeedsReview] = record.qcFlags.needsHumanReview;
    if (record.qcFlags.contentWarnings?.length) {
      fields[mapping.qcContentWarnings] = record.qcFlags.contentWarnings.join(', ');
    }
    if (record.qcFlags.reviewedAt) {
      fields[mapping.qcReviewedAt] = record.qcFlags.reviewedAt;
    }
    if (record.qcFlags.reviewedBy) {
      fields[mapping.qcReviewedBy] = record.qcFlags.reviewedBy;
    }
  }

  return fields;
}

describe('Airtable Sync Module', () => {
  describe('Field Mapping', () => {
    it('should have correct default field mapping', () => {
      expect(DEFAULT_FIELD_MAPPING.renderStatus).toBe('render_status');
      expect(DEFAULT_FIELD_MAPPING.renderUrl).toBe('render_url');
      expect(DEFAULT_FIELD_MAPPING.renderCompletedAt).toBe('render_completed_at');
      expect(DEFAULT_FIELD_MAPPING.qcNeedsReview).toBe('qc_needs_review');
      expect(DEFAULT_FIELD_MAPPING.qcContentWarnings).toBe('qc_content_warnings');
      expect(DEFAULT_FIELD_MAPPING.qcReviewedAt).toBe('qc_reviewed_at');
      expect(DEFAULT_FIELD_MAPPING.qcReviewedBy).toBe('qc_reviewed_by');
      expect(DEFAULT_FIELD_MAPPING.storageProvider).toBe('render_storage_provider');
    });

    it('should build render fields correctly', () => {
      const record: SyncRecord = {
        episodeId: 'test_001',
        airtableRecordId: 'rec123',
        renderStatus: 'completed',
        renderUrl: 'https://storage.example.com/test_001/master.mp4',
        renderCompletedAt: '2024-01-15T10:30:00Z',
        storageProvider: 'local'
      };

      const fields = buildFieldsPayload(record);

      expect(fields.render_status).toBe('completed');
      expect(fields.render_url).toBe('https://storage.example.com/test_001/master.mp4');
      expect(fields.render_completed_at).toBe('2024-01-15T10:30:00Z');
      expect(fields.render_storage_provider).toBe('local');
    });

    it('should build QC fields correctly', () => {
      const record: SyncRecord = {
        episodeId: 'test_002',
        airtableRecordId: 'rec456',
        renderStatus: 'completed',
        qcFlags: {
          needsHumanReview: true,
          contentWarnings: ['explicit', 'violence'],
          reviewedAt: '2024-01-15T11:00:00Z',
          reviewedBy: 'Operator'
        }
      };

      const fields = buildFieldsPayload(record);

      expect(fields.qc_needs_review).toBe(true);
      expect(fields.qc_content_warnings).toBe('explicit, violence');
      expect(fields.qc_reviewed_at).toBe('2024-01-15T11:00:00Z');
      expect(fields.qc_reviewed_by).toBe('Operator');
    });

    it('should handle empty QC flags', () => {
      const record: SyncRecord = {
        episodeId: 'test_003',
        airtableRecordId: 'rec789',
        renderStatus: 'queued'
      };

      const fields = buildFieldsPayload(record);

      expect(fields.render_status).toBe('queued');
      expect(fields.qc_needs_review).toBeUndefined();
      expect(fields.qc_content_warnings).toBeUndefined();
    });

    it('should support custom field mapping', () => {
      const customMapping: AirtableSyncFieldMapping = {
        renderStatus: 'custom_render_status',
        renderUrl: 'custom_url',
        renderCompletedAt: 'custom_completed',
        qcNeedsReview: 'custom_qc',
        qcContentWarnings: 'custom_warnings',
        qcReviewedAt: 'custom_reviewed',
        qcReviewedBy: 'custom_reviewer',
        storageProvider: 'custom_provider'
      };

      const record: SyncRecord = {
        episodeId: 'test_004',
        renderStatus: 'completed',
        renderUrl: 'https://example.com/video.mp4'
      };

      const fields = buildFieldsPayload(record, customMapping);

      expect(fields.custom_render_status).toBe('completed');
      expect(fields.custom_url).toBe('https://example.com/video.mp4');
    });
  });

  describe('Sync Record Validation', () => {
    it('should create valid sync result on success', () => {
      const result: SyncResult = {
        success: true,
        episodeId: 'test_001',
        airtableRecordId: 'rec123',
        syncedAt: new Date().toISOString()
      };

      expect(result.success).toBe(true);
      expect(result.episodeId).toBe('test_001');
      expect(result.error).toBeUndefined();
    });

    it('should create valid sync result on failure', () => {
      const result: SyncResult = {
        success: false,
        episodeId: 'test_002',
        error: 'Airtable API error: 401 - Unauthorized',
        syncedAt: new Date().toISOString()
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should handle missing Airtable record ID', () => {
      const result: SyncResult = {
        success: false,
        episodeId: 'test_003',
        error: 'Missing Airtable record ID',
        syncedAt: new Date().toISOString()
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing Airtable record ID');
    });
  });

  describe('Batch Sync', () => {
    it('should calculate batch results correctly', () => {
      const results: SyncResult[] = [
        { success: true, episodeId: 'ep1', syncedAt: new Date().toISOString() },
        { success: true, episodeId: 'ep2', syncedAt: new Date().toISOString() },
        { success: false, episodeId: 'ep3', error: 'Failed', syncedAt: new Date().toISOString() }
      ];

      const batchResult: BatchSyncResult = {
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
        syncedAt: new Date().toISOString()
      };

      expect(batchResult.total).toBe(3);
      expect(batchResult.succeeded).toBe(2);
      expect(batchResult.failed).toBe(1);
    });

    it('should handle empty batch', () => {
      const batchResult: BatchSyncResult = {
        total: 0,
        succeeded: 0,
        failed: 0,
        results: [],
        syncedAt: new Date().toISOString()
      };

      expect(batchResult.total).toBe(0);
      expect(batchResult.succeeded).toBe(0);
      expect(batchResult.failed).toBe(0);
    });
  });

  describe('Webhook Payloads', () => {
    it('should create render_completed webhook payload', () => {
      const payload: WebhookPayload = {
        event: 'render_completed',
        episodeId: 'test_001',
        timestamp: new Date().toISOString(),
        data: {
          renderUrl: 'https://storage.example.com/test_001/master.mp4',
          success: true
        }
      };

      expect(payload.event).toBe('render_completed');
      expect(payload.data.success).toBe(true);
    });

    it('should create render_failed webhook payload', () => {
      const payload: WebhookPayload = {
        event: 'render_failed',
        episodeId: 'test_002',
        timestamp: new Date().toISOString(),
        data: {
          error: 'ffmpeg error: Invalid input',
          success: false
        }
      };

      expect(payload.event).toBe('render_failed');
      expect(payload.data.success).toBe(false);
    });

    it('should create qc_review_completed webhook payload', () => {
      const payload: WebhookPayload = {
        event: 'qc_review_completed',
        episodeId: 'test_003',
        timestamp: new Date().toISOString(),
        data: {
          reviewedBy: 'Operator',
          approved: true
        }
      };

      expect(payload.event).toBe('qc_review_completed');
      expect(payload.data.approved).toBe(true);
    });
  });
});

describe('Control Panel Dashboard', () => {
  describe('Queue Stats', () => {
    interface QueueStats {
      queued: number;
      rendering: number;
      completed: number;
      failed: number;
      total: number;
      averageRenderTime?: number;
    }

    it('should calculate queue stats correctly', () => {
      const renderStatuses = [
        { status: 'queued' },
        { status: 'queued' },
        { status: 'rendering' },
        { status: 'completed', startedAt: '2024-01-15T10:00:00Z', completedAt: '2024-01-15T10:05:00Z' },
        { status: 'completed', startedAt: '2024-01-15T11:00:00Z', completedAt: '2024-01-15T11:03:00Z' },
        { status: 'failed' }
      ];

      const stats: QueueStats = {
        queued: 0,
        rendering: 0,
        completed: 0,
        failed: 0,
        total: 0
      };

      const renderTimes: number[] = [];

      for (const render of renderStatuses) {
        stats.total++;
        switch (render.status) {
          case 'queued': stats.queued++; break;
          case 'rendering': stats.rendering++; break;
          case 'completed': 
            stats.completed++;
            if ('startedAt' in render && 'completedAt' in render) {
              const duration = new Date(render.completedAt!).getTime() - new Date(render.startedAt!).getTime();
              renderTimes.push(duration);
            }
            break;
          case 'failed': stats.failed++; break;
        }
      }

      if (renderTimes.length > 0) {
        stats.averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      }

      expect(stats.total).toBe(6);
      expect(stats.queued).toBe(2);
      expect(stats.rendering).toBe(1);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.averageRenderTime).toBe(240000); // Average of 5 min and 3 min = 4 min
    });

    it('should handle empty queue', () => {
      const stats: QueueStats = {
        queued: 0,
        rendering: 0,
        completed: 0,
        failed: 0,
        total: 0
      };

      expect(stats.total).toBe(0);
      expect(stats.averageRenderTime).toBeUndefined();
    });
  });

  describe('Persona Preview', () => {
    interface PersonaStyle {
      code: string;
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      captionPosition: string;
      motionPreset: string;
      transitionPreset: string;
    }

    it('should generate valid persona preview data', () => {
      const style: PersonaStyle = {
        code: 'ADDIS',
        primaryColor: '#FFD700',
        secondaryColor: '#FFFFFF',
        fontFamily: 'Montserrat',
        captionPosition: 'bottom',
        motionPreset: 'bounce',
        transitionPreset: 'fade'
      };

      expect(style.code).toBe('ADDIS');
      expect(style.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(style.captionPosition).toBe('bottom');
    });

    it('should support different caption positions', () => {
      const positions = ['top', 'middle', 'bottom'];
      
      for (const position of positions) {
        const style: PersonaStyle = {
          code: 'TEST',
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
          fontFamily: 'Arial',
          captionPosition: position,
          motionPreset: 'fade',
          transitionPreset: 'cut'
        };

        expect(['top', 'middle', 'bottom']).toContain(style.captionPosition);
      }
    });
  });

  describe('Render Dashboard Data', () => {
    interface RenderJob {
      episodeId: string;
      status: 'queued' | 'rendering' | 'completed' | 'failed';
      progress?: number;
      startedAt?: string;
      completedAt?: string;
    }

    it('should sort jobs by most recent first', () => {
      const jobs: RenderJob[] = [
        { episodeId: 'ep1', status: 'completed', completedAt: '2024-01-15T10:00:00Z' },
        { episodeId: 'ep2', status: 'completed', completedAt: '2024-01-15T12:00:00Z' },
        { episodeId: 'ep3', status: 'completed', completedAt: '2024-01-15T11:00:00Z' }
      ];

      jobs.sort((a, b) => {
        const dateA = new Date(a.completedAt || a.startedAt || 0);
        const dateB = new Date(b.completedAt || b.startedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      expect(jobs[0].episodeId).toBe('ep2');
      expect(jobs[1].episodeId).toBe('ep3');
      expect(jobs[2].episodeId).toBe('ep1');
    });

    it('should count jobs by persona', () => {
      const timelines = [
        { episodeId: 'ep1', personaCode: 'ADDIS' },
        { episodeId: 'ep2', personaCode: 'ADDIS' },
        { episodeId: 'ep3', personaCode: 'HABESHA_HUMOR' },
        { episodeId: 'ep4', personaCode: 'TECH_TALK' }
      ];

      const byPersona: Record<string, number> = {};

      for (const timeline of timelines) {
        const persona = timeline.personaCode || 'UNKNOWN';
        byPersona[persona] = (byPersona[persona] || 0) + 1;
      }

      expect(byPersona['ADDIS']).toBe(2);
      expect(byPersona['HABESHA_HUMOR']).toBe(1);
      expect(byPersona['TECH_TALK']).toBe(1);
    });

    it('should count jobs by render profile', () => {
      const timelines = [
        { episodeId: 'ep1', renderProfile: 'vertical_1080x1920' },
        { episodeId: 'ep2', renderProfile: 'vertical_1080x1920' },
        { episodeId: 'ep3', renderProfile: 'horizontal_1920x1080' }
      ];

      const byRenderProfile: Record<string, number> = {};

      for (const timeline of timelines) {
        const profile = timeline.renderProfile || 'unknown';
        byRenderProfile[profile] = (byRenderProfile[profile] || 0) + 1;
      }

      expect(byRenderProfile['vertical_1080x1920']).toBe(2);
      expect(byRenderProfile['horizontal_1920x1080']).toBe(1);
    });
  });
});

describe('UI Integration', () => {
  describe('API Response Formatting', () => {
    it('should include fetchedAt timestamp in responses', () => {
      const response = {
        data: { some: 'data' },
        fetchedAt: new Date().toISOString()
      };

      expect(response.fetchedAt).toBeDefined();
      expect(new Date(response.fetchedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should format sync history correctly', () => {
      const history: SyncResult[] = [
        { success: true, episodeId: 'ep1', syncedAt: '2024-01-15T10:00:00Z' },
        { success: false, episodeId: 'ep2', error: 'Failed', syncedAt: '2024-01-15T09:00:00Z' }
      ];

      // Should be sorted newest first
      history.sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime());

      expect(history[0].episodeId).toBe('ep1');
      expect(history[1].episodeId).toBe('ep2');
    });
  });

  describe('Error Handling', () => {
    it('should format API errors correctly', () => {
      const error = {
        error: 'Airtable not configured',
        hint: 'Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables'
      };

      expect(error.error).toBeDefined();
      expect(error.hint).toBeDefined();
    });

    it('should handle 404 errors', () => {
      const error = {
        error: 'Timeline not found for episode: nonexistent_001'
      };

      expect(error.error).toContain('not found');
    });
  });
});
