/**
 * Facebook Publishing Adapter
 * Handles video uploads to Facebook Pages via the Graph API.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import type {
  PublishingAdapter,
  PlatformUploadResult,
  PublishingMetadata,
  PlatformAdapterConfig
} from './publishing.types.js';

// Default Meta Graph API version
const DEFAULT_GRAPH_API_VERSION = 'v18.0';

// Default config
const DEFAULT_CONFIG: PlatformAdapterConfig = {
  credentials: {},
  timeout: 3600000, // 1 hour
  retry: {
    maxAttempts: 3,
    backoffMs: 5000
  }
};

// Chunk size for resumable uploads (4MB)
const CHUNK_SIZE = 4 * 1024 * 1024;

/**
 * Facebook Publishing Adapter
 * Uploads videos to Facebook Pages using the resumable upload API.
 */
export class FacebookAdapter implements PublishingAdapter {
  readonly platform = 'facebook' as const;
  private config: PlatformAdapterConfig;
  private graphApiVersion: string;

  constructor(config?: Partial<PlatformAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.graphApiVersion = (config as any)?.graphApiVersion || process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;
    
    // Load credentials from environment
    this.config.credentials = {
      accessToken: config?.credentials?.accessToken || process.env.FACEBOOK_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '',
      apiKey: config?.credentials?.apiKey || process.env.FACEBOOK_APP_ID || process.env.META_APP_ID || ''
    };
  }

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.credentials.accessToken && this.getPageId());
  }

  /**
   * Get the configured page ID
   */
  private getPageId(): string {
    return process.env.FACEBOOK_PAGE_ID || process.env.META_PAGE_ID || '';
  }

  /**
   * Get Graph API base URL
   */
  private getApiUrl(endpoint: string): string {
    const baseUrl = this.config.apiEndpoint || `https://graph.facebook.com/${this.graphApiVersion}`;
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Upload video to Facebook Page
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
        error: 'Facebook adapter not configured. Set FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID environment variables.'
      };
    }

    const pageId = metadata.custom?.pageId as string || this.getPageId();

    try {
      const videoBuffer = readFileSync(videoPath);
      const fileSize = statSync(videoPath).size;

      // Step 1: Initialize resumable upload session
      const initUrl = this.getApiUrl(`/${pageId}/videos`);
      const initParams = new URLSearchParams({
        access_token: this.config.credentials.accessToken || '',
        upload_phase: 'start',
        file_size: fileSize.toString()
      });

      const initResponse = await fetch(`${initUrl}?${initParams}`, { method: 'POST' });
      
      if (!initResponse.ok) {
        const errorData = await initResponse.json() as { error?: { message?: string } };
        return {
          success: false,
          error: `Facebook init error: ${errorData.error?.message || initResponse.status}`
        };
      }

      const initData = await initResponse.json() as { upload_session_id?: string; video_id?: string };
      const uploadSessionId = initData.upload_session_id;
      const videoId = initData.video_id;

      if (!uploadSessionId || !videoId) {
        return {
          success: false,
          error: 'Failed to initialize Facebook upload session'
        };
      }

      // Step 2: Transfer video data in chunks
      let startOffset = 0;

      while (startOffset < fileSize) {
        const endOffset = Math.min(startOffset + CHUNK_SIZE, fileSize);
        const chunk = videoBuffer.slice(startOffset, endOffset);

        const transferUrl = this.getApiUrl(`/${pageId}/videos`);
        const formData = new FormData();
        formData.append('access_token', this.config.credentials.accessToken || '');
        formData.append('upload_phase', 'transfer');
        formData.append('upload_session_id', uploadSessionId);
        formData.append('start_offset', startOffset.toString());
        formData.append('video_file_chunk', new Blob([chunk]));

        const transferResponse = await fetch(transferUrl, {
          method: 'POST',
          body: formData
        });

        if (!transferResponse.ok) {
          const errorData = await transferResponse.json() as { error?: { message?: string } };
          return {
            success: false,
            error: `Facebook transfer error: ${errorData.error?.message || transferResponse.status}`
          };
        }

        const transferData = await transferResponse.json() as { start_offset?: number; end_offset?: number };
        startOffset = transferData.end_offset || endOffset;
      }

      // Step 3: Finish upload with metadata
      const finishUrl = this.getApiUrl(`/${pageId}/videos`);
      const finishParams = new URLSearchParams({
        access_token: this.config.credentials.accessToken || '',
        upload_phase: 'finish',
        upload_session_id: uploadSessionId,
        title: metadata.title,
        description: metadata.description || ''
      });

      // Add scheduled publish time if specified
      if (metadata.scheduledPublishAt) {
        const scheduledTime = Math.floor(new Date(metadata.scheduledPublishAt).getTime() / 1000);
        finishParams.append('scheduled_publish_time', scheduledTime.toString());
        finishParams.append('published', 'false');
      } else if (metadata.privacyStatus === 'private') {
        finishParams.append('published', 'false');
      }

      const finishResponse = await fetch(`${finishUrl}?${finishParams}`, { method: 'POST' });

      if (!finishResponse.ok) {
        const errorData = await finishResponse.json() as { error?: { message?: string } };
        return {
          success: false,
          error: `Facebook finish error: ${errorData.error?.message || finishResponse.status}`
        };
      }

      const finishData = await finishResponse.json() as { success?: boolean };
      const uploadDuration = (Date.now() - startTime) / 1000;

      if (finishData.success) {
        console.log(`[facebook-adapter] Upload complete: ${videoId}`);
        return {
          success: true,
          videoId,
          videoUrl: `https://www.facebook.com/watch/?v=${videoId}`,
          uploadDuration,
          platformData: { pageId, videoId }
        };
      } else {
        return {
          success: false,
          error: 'Facebook upload finish failed'
        };
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Facebook upload error',
        uploadDuration: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * Check video processing status
   */
  async checkStatus(videoId: string): Promise<{ status: string; progress?: number }> {
    if (!this.config.credentials.accessToken) {
      return { status: 'unknown' };
    }

    try {
      const url = this.getApiUrl(`/${videoId}`);
      const params = new URLSearchParams({
        access_token: this.config.credentials.accessToken,
        fields: 'status'
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        return { status: 'unknown' };
      }

      const data = await response.json() as { status?: { video_status?: string } };
      return { status: data.status?.video_status || 'unknown' };
    } catch (error) {
      return { status: 'error' };
    }
  }

  /**
   * Delete video from Facebook
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    if (!this.config.credentials.accessToken) {
      return false;
    }

    try {
      const url = this.getApiUrl(`/${videoId}`);
      const params = new URLSearchParams({
        access_token: this.config.credentials.accessToken
      });

      const response = await fetch(`${url}?${params}`, { method: 'DELETE' });
      return response.ok;
    } catch (error) {
      console.warn('[facebook-adapter] Delete error:', error);
      return false;
    }
  }
}

// Default instance
export const facebookAdapter = new FacebookAdapter();
