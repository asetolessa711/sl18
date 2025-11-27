/**
 * Airtable Sync Module
 * Syncs render status and QC flags between SL18 and Airtable.
 * 
 * Features:
 * - Push render status to Airtable Episodes table
 * - Sync QC flags (contentWarnings, needsHumanReview, reviewedAt)
 * - Webhook notifications for job completion
 * - Batch sync for multiple episodes
 */

import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'fs';
import path from 'path';

// Types for Airtable sync
export interface AirtableSyncConfig {
  apiKey: string;
  baseId: string;
  episodesTable: string;
  webhookUrl?: string;
  syncFields: AirtableSyncFieldMapping;
}

export interface AirtableSyncFieldMapping {
  renderStatus: string;
  renderUrl: string;
  renderCompletedAt: string;
  qcNeedsReview: string;
  qcContentWarnings: string;
  qcReviewedAt: string;
  qcReviewedBy: string;
  storageProvider: string;
}

export interface SyncRecord {
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

export interface SyncResult {
  success: boolean;
  episodeId: string;
  airtableRecordId?: string;
  error?: string;
  syncedAt: string;
}

export interface BatchSyncResult {
  total: number;
  succeeded: number;
  failed: number;
  results: SyncResult[];
  syncedAt: string;
}

export interface WebhookPayload {
  event: 'render_completed' | 'render_failed' | 'qc_review_completed';
  episodeId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// Default field mapping
export const DEFAULT_FIELD_MAPPING: AirtableSyncFieldMapping = {
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
 * Airtable Sync Manager
 * Manages synchronization between SL18 render stack and Airtable.
 */
export class AirtableSyncManager {
  private config: AirtableSyncConfig;
  private syncLogPath: string;

  constructor(config: Partial<AirtableSyncConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.AIRTABLE_API_KEY || '',
      baseId: config.baseId || process.env.AIRTABLE_BASE_ID || '',
      episodesTable: config.episodesTable || process.env.AIRTABLE_EPISODES_TABLE || 'Episodes',
      webhookUrl: config.webhookUrl || process.env.AIRTABLE_WEBHOOK_URL,
      syncFields: config.syncFields || DEFAULT_FIELD_MAPPING
    };

    // Set up sync log directory
    const logsDir = path.join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    this.syncLogPath = path.join(logsDir, 'airtable_sync.jsonl');
  }

  /**
   * Check if Airtable credentials are configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.baseId);
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfigStatus(): { configured: boolean; baseId?: string; table: string; webhookConfigured: boolean } {
    return {
      configured: this.isConfigured(),
      baseId: this.config.baseId ? `${this.config.baseId.substring(0, 8)}...` : undefined,
      table: this.config.episodesTable,
      webhookConfigured: Boolean(this.config.webhookUrl)
    };
  }

  /**
   * Build Airtable API URL
   */
  private buildApiUrl(recordId?: string): string {
    const base = `https://api.airtable.com/v0/${this.config.baseId}/${encodeURIComponent(this.config.episodesTable)}`;
    return recordId ? `${base}/${recordId}` : base;
  }

  /**
   * Build fields object for Airtable update
   */
  private buildFieldsPayload(record: SyncRecord): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    const mapping = this.config.syncFields;

    // Render fields
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

    // QC fields
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

  /**
   * Sync a single record to Airtable
   */
  async syncRecord(record: SyncRecord): Promise<SyncResult> {
    const timestamp = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        success: false,
        episodeId: record.episodeId,
        error: 'Airtable not configured',
        syncedAt: timestamp
      };
    }

    if (!record.airtableRecordId) {
      return {
        success: false,
        episodeId: record.episodeId,
        error: 'Missing Airtable record ID',
        syncedAt: timestamp
      };
    }

    try {
      const fields = this.buildFieldsPayload(record);
      const url = this.buildApiUrl(record.airtableRecordId);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
      }

      const result: SyncResult = {
        success: true,
        episodeId: record.episodeId,
        airtableRecordId: record.airtableRecordId,
        syncedAt: timestamp
      };

      this.logSync(result);
      return result;
    } catch (error) {
      const result: SyncResult = {
        success: false,
        episodeId: record.episodeId,
        airtableRecordId: record.airtableRecordId,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: timestamp
      };

      this.logSync(result);
      return result;
    }
  }

  /**
   * Sync multiple records to Airtable
   */
  async syncBatch(records: SyncRecord[]): Promise<BatchSyncResult> {
    const results: SyncResult[] = [];

    for (const record of records) {
      const result = await this.syncRecord(record);
      results.push(result);
    }

    return {
      total: records.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      syncedAt: new Date().toISOString()
    };
  }

  /**
   * Find Airtable record by episode ID
   */
  async findRecordByEpisodeId(episodeId: string): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const url = this.buildApiUrl();
      const filterFormula = encodeURIComponent(`{episode_id} = '${episodeId}'`);
      const fullUrl = `${url}?filterByFormula=${filterFormula}&maxRecords=1`;

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        console.warn(`[airtable-sync] Failed to find record: ${response.status}`);
        return null;
      }

      const data = await response.json() as { records?: Array<{ id: string }> };
      return data.records?.[0]?.id || null;
    } catch (error) {
      console.warn('[airtable-sync] Error finding record:', error);
      return null;
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(payload: WebhookPayload): Promise<boolean> {
    if (!this.config.webhookUrl) {
      console.log('[airtable-sync] No webhook URL configured');
      return false;
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`[airtable-sync] Webhook failed: ${response.status}`);
        return false;
      }

      console.log(`[airtable-sync] Webhook sent: ${payload.event} for ${payload.episodeId}`);
      return true;
    } catch (error) {
      console.warn('[airtable-sync] Webhook error:', error);
      return false;
    }
  }

  /**
   * Notify render completion
   */
  async notifyRenderComplete(episodeId: string, renderUrl: string, success: boolean): Promise<void> {
    const payload: WebhookPayload = {
      event: success ? 'render_completed' : 'render_failed',
      episodeId,
      timestamp: new Date().toISOString(),
      data: { renderUrl, success }
    };

    await this.sendWebhook(payload);
  }

  /**
   * Notify QC review completion
   */
  async notifyQCReviewComplete(episodeId: string, reviewedBy: string, approved: boolean): Promise<void> {
    const payload: WebhookPayload = {
      event: 'qc_review_completed',
      episodeId,
      timestamp: new Date().toISOString(),
      data: { reviewedBy, approved }
    };

    await this.sendWebhook(payload);
  }

  /**
   * Log sync operation
   */
  private logSync(result: SyncResult): void {
    try {
      const logEntry = JSON.stringify({
        ...result,
        loggedAt: new Date().toISOString()
      }) + '\n';

      appendFileSync(this.syncLogPath, logEntry);
    } catch (error) {
      console.warn('[airtable-sync] Failed to log sync:', error);
    }
  }

  /**
   * Read sync history
   */
  readSyncHistory(limit: number = 50): SyncResult[] {
    try {
      if (!existsSync(this.syncLogPath)) {
        return [];
      }

      const content = readFileSync(this.syncLogPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      const entries: SyncResult[] = [];

      for (const line of lines.slice(-limit)) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // Skip invalid lines
        }
      }

      return entries.reverse();
    } catch {
      return [];
    }
  }
}

// Default instance
let defaultManager: AirtableSyncManager | null = null;

/**
 * Get or create default Airtable sync manager
 */
export function getAirtableSyncManager(): AirtableSyncManager {
  if (!defaultManager) {
    defaultManager = new AirtableSyncManager();
  }
  return defaultManager;
}

/**
 * Sync render status to Airtable
 */
export async function syncRenderStatus(
  episodeId: string,
  airtableRecordId: string,
  status: SyncRecord['renderStatus'],
  renderUrl?: string,
  storageProvider?: string
): Promise<SyncResult> {
  const manager = getAirtableSyncManager();
  return manager.syncRecord({
    episodeId,
    airtableRecordId,
    renderStatus: status,
    renderUrl,
    renderCompletedAt: status === 'completed' ? new Date().toISOString() : undefined,
    storageProvider
  });
}

/**
 * Sync QC flags to Airtable
 */
export async function syncQCFlags(
  episodeId: string,
  airtableRecordId: string,
  qcFlags: SyncRecord['qcFlags']
): Promise<SyncResult> {
  const manager = getAirtableSyncManager();
  return manager.syncRecord({
    episodeId,
    airtableRecordId,
    renderStatus: 'completed',
    qcFlags
  });
}

export default AirtableSyncManager;
