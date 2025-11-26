/**
 * TikTok Publishing Adapter
 * Handles video uploads to TikTok via the TikTok Open API.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import type {
  PublishingAdapter,
  PlatformUploadResult,
  PublishingMetadata,
  PlatformAdapterConfig
} from './publishing.types.js';

// TikTok API endpoint
const DEFAULT_TIKTOK_API_ENDPOINT = 'https://open.tiktokapis.com/v2';

// Default config
const DEFAULT_CONFIG: PlatformAdapterConfig = {
  credentials: {},
  timeout: 3600000, // 1 hour
  retry: {
    maxAttempts: 3,
    backoffMs: 5000
  }
};

// Chunk size for uploads (5MB - TikTok recommended)
const CHUNK_SIZE = 5 * 1024 * 1024;

// Max wait time for video processing (10 minutes)
const MAX_PROCESSING_WAIT_MS = 600000;
const PROCESSING_POLL_INTERVAL_MS = 5000;

/**
 * TikTok Publishing Adapter
 * Uploads short-form videos to TikTok using the TikTok Open API.
 */
export class TikTokAdapter implements PublishingAdapter {
  readonly platform = 'tiktok' as const;
  private config: PlatformAdapterConfig;

  constructor(config?: Partial<PlatformAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Load credentials from environment
    this.config.credentials = {
      clientId: config?.credentials?.clientId || process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: config?.credentials?.clientSecret || process.env.TIKTOK_CLIENT_SECRET || '',
      accessToken: config?.credentials?.accessToken || process.env.TIKTOK_ACCESS_TOKEN || ''
    };
  }

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean {
    return Boolean(
      this.config.credentials.accessToken &&
      this.config.credentials.clientId
    );
  }

  /**
   * Get TikTok API base URL
   */
  private getApiUrl(endpoint: string): string {
    const baseUrl = this.config.apiEndpoint || DEFAULT_TIKTOK_API_ENDPOINT;
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Upload video to TikTok
   * Supports both direct upload (small files) and chunked upload (large files)
   */
  async upload(videoPath: string, metadata: PublishingMetadata): Promise<PlatformUploadResult> {
    const startTime = Date.now();

    // Validate video file
    if (!existsSync(videoPath)) {
      return {
        success: false,
        error: `Video file not found: ${videoPath}`
      };
    }

    // Check configuration
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'TikTok adapter not configured. Set TIKTOK_ACCESS_TOKEN and TIKTOK_CLIENT_KEY environment variables.'
      };
    }

    try {
      const fileSize = statSync(videoPath).size;

      // Step 1: Initialize video upload
      const initResult = await this.initializeUpload(fileSize, metadata);
      if (!initResult.success) {
        return initResult;
      }

      const { publishId, uploadUrl } = initResult;

      // Step 2: Upload video data
      const uploadResult = await this.uploadVideoData(videoPath, uploadUrl, fileSize);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Step 3: Wait for video processing and get status
      const processResult = await this.waitForProcessing(publishId);
      if (!processResult.success) {
        return {
          success: false,
          error: processResult.error,
          uploadDuration: (Date.now() - startTime) / 1000
        };
      }

      const uploadDuration = (Date.now() - startTime) / 1000;

      console.log(`[tiktok-adapter] Upload complete: ${processResult.videoId}`);

      return {
        success: true,
        videoId: processResult.videoId,
        videoUrl: processResult.videoUrl,
        uploadDuration,
        platformData: { publishId }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'TikTok upload error',
        uploadDuration: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * Initialize video upload session
   */
  private async initializeUpload(fileSize: number, metadata: PublishingMetadata): Promise<{
    success: boolean;
    publishId?: string;
    uploadUrl?: string;
    error?: string;
  }> {
    const url = this.getApiUrl('/post/publish/video/init/');

    // Build caption with hashtags
    let caption = metadata.title;
    if (metadata.description) {
      caption += ` ${metadata.description}`;
    }
    if (metadata.tags && metadata.tags.length > 0) {
      const hashtags = metadata.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
      caption += ` ${hashtags}`;
    }
    if (metadata.personaCode) {
      caption += ` #${metadata.personaCode}`;
    }

    const body = {
      post_info: {
        title: caption.substring(0, 150), // TikTok title limit
        privacy_level: this.mapPrivacyLevel(metadata.privacyStatus),
        disable_duet: metadata.custom?.disableDuet || false,
        disable_comment: metadata.custom?.disableComment || false,
        disable_stitch: metadata.custom?.disableStitch || false
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: fileSize,
        chunk_size: Math.min(CHUNK_SIZE, fileSize),
        total_chunk_count: Math.ceil(fileSize / CHUNK_SIZE)
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: { message?: string; code?: string } };
        return {
          success: false,
          error: `TikTok init error: ${errorData.error?.message || response.status}`
        };
      }

      const data = await response.json() as {
        data?: {
          publish_id?: string;
          upload_url?: string;
        };
        error?: { message?: string };
      };

      if (!data.data?.publish_id || !data.data?.upload_url) {
        return {
          success: false,
          error: 'Failed to initialize TikTok upload'
        };
      }

      return {
        success: true,
        publishId: data.data.publish_id,
        uploadUrl: data.data.upload_url
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'TikTok init request failed'
      };
    }
  }

  /**
   * Upload video data in chunks
   */
  private async uploadVideoData(videoPath: string, uploadUrl: string, fileSize: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    const videoBuffer = readFileSync(videoPath);
    let startOffset = 0;
    let chunkIndex = 0;

    while (startOffset < fileSize) {
      const endOffset = Math.min(startOffset + CHUNK_SIZE, fileSize);
      const chunk = videoBuffer.slice(startOffset, endOffset);

      const headers: Record<string, string> = {
        'Content-Type': 'video/mp4',
        'Content-Length': chunk.length.toString(),
        'Content-Range': `bytes ${startOffset}-${endOffset - 1}/${fileSize}`
      };

      try {
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers,
          body: chunk
        });

        if (!response.ok && response.status !== 201 && response.status !== 206) {
          const errorText = await response.text();
          return {
            success: false,
            error: `TikTok upload chunk ${chunkIndex} failed: ${errorText || response.status}`
          };
        }

        startOffset = endOffset;
        chunkIndex++;

      } catch (error: any) {
        return {
          success: false,
          error: `TikTok upload chunk error: ${error.message}`
        };
      }
    }

    return { success: true };
  }

  /**
   * Wait for video processing to complete
   */
  private async waitForProcessing(publishId: string): Promise<{
    success: boolean;
    videoId?: string;
    videoUrl?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    const url = this.getApiUrl('/post/publish/status/fetch/');

    while (Date.now() - startTime < MAX_PROCESSING_WAIT_MS) {
      await this.sleep(PROCESSING_POLL_INTERVAL_MS);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.credentials.accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
          },
          body: JSON.stringify({ publish_id: publishId })
        });

        if (!response.ok) {
          continue; // Retry on error
        }

        const data = await response.json() as {
          data?: {
            status?: string;
            publicaly_available_post_id?: string[];
            fail_reason?: string;
          };
        };

        const status = data.data?.status;

        if (status === 'PUBLISH_COMPLETE') {
          const postIds = data.data?.publicaly_available_post_id || [];
          const videoId = postIds[0] || publishId;
          
          return {
            success: true,
            videoId,
            videoUrl: `https://www.tiktok.com/@${process.env.TIKTOK_USERNAME || 'user'}/video/${videoId}`
          };
        } else if (status === 'FAILED') {
          return {
            success: false,
            error: `TikTok publishing failed: ${data.data?.fail_reason || 'Unknown error'}`
          };
        }

        // Log progress
        console.log(`[tiktok-adapter] Processing status: ${status}`);

      } catch (error) {
        // Continue polling
      }
    }

    return {
      success: false,
      error: 'TikTok video processing timeout'
    };
  }

  /**
   * Map privacy status to TikTok privacy level
   */
  private mapPrivacyLevel(privacyStatus?: string): string {
    switch (privacyStatus) {
      case 'public':
        return 'PUBLIC_TO_EVERYONE';
      case 'unlisted':
        return 'MUTUAL_FOLLOW_FRIENDS';
      case 'private':
        return 'SELF_ONLY';
      default:
        return 'SELF_ONLY'; // Default to private
    }
  }

  /**
   * Check video status
   */
  async checkStatus(publishId: string): Promise<{ status: string; progress?: number }> {
    if (!this.config.credentials.accessToken) {
      return { status: 'unknown' };
    }

    try {
      const url = this.getApiUrl('/post/publish/status/fetch/');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({ publish_id: publishId })
      });

      if (!response.ok) {
        return { status: 'unknown' };
      }

      const data = await response.json() as {
        data?: { status?: string };
      };

      return { status: data.data?.status || 'unknown' };
    } catch (error) {
      return { status: 'error' };
    }
  }

  /**
   * Delete video from TikTok
   * Note: TikTok API doesn't support video deletion via API.
   */
  async deleteVideo(_videoId: string): Promise<boolean> {
    console.warn('[tiktok-adapter] TikTok API does not support video deletion. Use the TikTok app.');
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default instance
export const tiktokAdapter = new TikTokAdapter();
