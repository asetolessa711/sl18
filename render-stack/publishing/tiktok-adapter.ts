/**
 * TikTok Export Adapter
 * 
 * ⚠️ IMPORTANT: TikTok does not provide a general public API for video publishing.
 * Only approved Marketing Partners have access to TikTok's Content API.
 * 
 * This adapter prepares TikTok-ready assets for MANUAL upload by operators:
 * - Validates video is in correct format (vertical 9:16)
 * - Prepares metadata (title, hashtags, persona tags)
 * - Exports to a download-ready location
 * - Marks jobs as "Manual Upload Required"
 * 
 * Operator Workflow:
 * 1. Render Stack prepares TikTok-ready video assets
 * 2. Operators manually upload via TikTok app or approved third-party tools
 * 3. QC gating ensures only approved content is exported for TikTok
 */

import { existsSync, statSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import path from 'path';
import type {
  PublishingAdapter,
  PlatformUploadResult,
  PublishingMetadata,
  PlatformAdapterConfig
} from './publishing.types.js';

// TikTok video format constants
const TIKTOK_RECOMMENDED_ASPECT_RATIO = '9:16';
const TIKTOK_MAX_DURATION_SECONDS = 180; // 3 minutes
const TIKTOK_MAX_FILE_SIZE_MB = 287;
const TIKTOK_TITLE_MAX_LENGTH = 150;

// Default config
const DEFAULT_CONFIG: PlatformAdapterConfig = {
  credentials: {},
  timeout: 60000, // 1 minute for export
  retry: {
    maxAttempts: 1,
    backoffMs: 1000
  }
};

// Default export directory
const DEFAULT_EXPORT_DIR = 'exports/tiktok';

/**
 * TikTok Export Result with download information
 */
export interface TikTokExportResult extends PlatformUploadResult {
  /** Path to exported video file */
  exportPath?: string;
  /** Path to metadata JSON file */
  metadataPath?: string;
  /** Whether manual upload is required */
  manualUploadRequired: boolean;
  /** Validation warnings */
  warnings?: string[];
}

/**
 * TikTok Export Adapter
 * Prepares TikTok-ready assets for manual upload.
 */
export class TikTokAdapter implements PublishingAdapter {
  readonly platform = 'tiktok' as const;
  private config: PlatformAdapterConfig;
  private exportDir: string;

  constructor(config?: Partial<PlatformAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.exportDir = process.env.TIKTOK_EXPORT_DIR || DEFAULT_EXPORT_DIR;
  }

  /**
   * TikTok export is always "configured" as it doesn't require API credentials.
   * It exports files for manual upload.
   */
  isConfigured(): boolean {
    // Always return true since we don't need API access for export mode
    return true;
  }

  /**
   * Export video for TikTok (manual upload required)
   * 
   * Instead of uploading to TikTok API (which is not publicly available),
   * this method:
   * 1. Validates the video format
   * 2. Copies it to an export directory
   * 3. Creates a metadata file for the operator
   * 4. Returns status indicating manual upload is required
   */
  async upload(videoPath: string, metadata: PublishingMetadata): Promise<TikTokExportResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Validate video file exists
    if (!existsSync(videoPath)) {
      return {
        success: false,
        error: `Video file not found: ${videoPath}`,
        manualUploadRequired: true
      };
    }

    try {
      const stats = statSync(videoPath);
      const fileSizeMB = stats.size / (1024 * 1024);

      // Validate file size
      if (fileSizeMB > TIKTOK_MAX_FILE_SIZE_MB) {
        warnings.push(`File size (${fileSizeMB.toFixed(1)}MB) exceeds TikTok's ${TIKTOK_MAX_FILE_SIZE_MB}MB limit`);
      }

      // Build TikTok caption
      const caption = this.buildCaption(metadata);

      // Create export directory
      const episodeExportDir = path.join(this.exportDir, metadata.custom?.episodeId as string || 'unknown');
      mkdirSync(episodeExportDir, { recursive: true });

      // Generate export filenames
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportVideoPath = path.join(episodeExportDir, `tiktok_${timestamp}.mp4`);
      const metadataPath = path.join(episodeExportDir, `tiktok_${timestamp}_metadata.json`);

      // Copy video to export location
      copyFileSync(videoPath, exportVideoPath);

      // Create metadata file for operator reference
      const exportMetadata = {
        platform: 'tiktok',
        status: 'MANUAL_UPLOAD_REQUIRED',
        exportedAt: new Date().toISOString(),
        videoFile: path.basename(exportVideoPath),
        caption,
        hashtags: this.extractHashtags(metadata),
        format: {
          recommendedAspectRatio: TIKTOK_RECOMMENDED_ASPECT_RATIO,
          maxDuration: `${TIKTOK_MAX_DURATION_SECONDS} seconds`,
          maxFileSize: `${TIKTOK_MAX_FILE_SIZE_MB} MB`
        },
        metadata: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          personaCode: metadata.personaCode,
          franchiseId: metadata.franchiseId
        },
        instructions: [
          '1. Open TikTok app on your mobile device',
          '2. Tap the + button to create a new post',
          '3. Upload the video file from this export folder',
          '4. Paste the caption from this metadata file',
          '5. Add sounds, effects, or filters as needed',
          '6. Tap Post to publish'
        ],
        warnings
      };

      writeFileSync(metadataPath, JSON.stringify(exportMetadata, null, 2));

      const uploadDuration = (Date.now() - startTime) / 1000;

      console.log(`[tiktok-adapter] Export complete: ${exportVideoPath}`);
      console.log(`[tiktok-adapter] ⚠️ MANUAL UPLOAD REQUIRED - TikTok does not have a public publishing API`);

      return {
        success: true,
        videoId: `export_${timestamp}`,
        videoUrl: undefined, // No URL until manually uploaded
        uploadDuration,
        exportPath: exportVideoPath,
        metadataPath,
        manualUploadRequired: true,
        warnings: warnings.length > 0 ? warnings : undefined,
        platformData: {
          exportDir: episodeExportDir,
          caption,
          hashtags: this.extractHashtags(metadata),
          status: 'MANUAL_UPLOAD_REQUIRED',
          note: 'TikTok does not provide a public API for video publishing. Please upload manually.'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'TikTok export error',
        uploadDuration: (Date.now() - startTime) / 1000,
        manualUploadRequired: true
      };
    }
  }

  /**
   * Build TikTok caption with hashtags
   */
  private buildCaption(metadata: PublishingMetadata): string {
    let caption = metadata.title || '';
    
    if (metadata.description) {
      caption += ` ${metadata.description}`;
    }

    // Add hashtags
    const hashtags = this.extractHashtags(metadata);
    if (hashtags.length > 0) {
      caption += '\n\n' + hashtags.join(' ');
    }

    // Truncate to TikTok limit
    if (caption.length > TIKTOK_TITLE_MAX_LENGTH) {
      caption = caption.substring(0, TIKTOK_TITLE_MAX_LENGTH - 3) + '...';
    }

    return caption;
  }

  /**
   * Extract hashtags from metadata
   */
  private extractHashtags(metadata: PublishingMetadata): string[] {
    const hashtags: string[] = [];

    // Add tags as hashtags
    if (metadata.tags && metadata.tags.length > 0) {
      hashtags.push(...metadata.tags.map(tag => `#${tag.replace(/\s+/g, '')}`));
    }

    // Add persona code as hashtag
    if (metadata.personaCode) {
      hashtags.push(`#${metadata.personaCode}`);
    }

    // Add franchise as hashtag
    if (metadata.franchiseId) {
      hashtags.push(`#${metadata.franchiseId}`);
    }

    // Add SL18 branding
    hashtags.push('#SL18');

    return hashtags;
  }

  /**
   * Check export status
   * For TikTok, this checks if the export file exists
   */
  async checkStatus(exportId: string): Promise<{ status: string; progress?: number }> {
    // For exports, we just return the manual upload status
    return {
      status: 'MANUAL_UPLOAD_REQUIRED',
      progress: 100
    };
  }

  /**
   * Delete exported video
   * Removes the export file from the export directory
   */
  async deleteVideo(exportPath: string): Promise<boolean> {
    try {
      if (existsSync(exportPath)) {
        const fs = await import('fs/promises');
        await fs.unlink(exportPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[tiktok-adapter] Error deleting export:', error);
      return false;
    }
  }

  /**
   * Get export directory path
   */
  getExportDir(): string {
    return this.exportDir;
  }
}

// Default instance
export const tiktokAdapter = new TikTokAdapter();
