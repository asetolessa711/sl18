/**
 * Meta Publishing Adapter
 * Handles video uploads to Facebook and Instagram via the Meta Graph API.
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

/**
 * Meta Publishing Adapter (Facebook/Instagram)
 */
export class MetaAdapter implements PublishingAdapter {
  readonly platform = 'meta' as const;
  private config: PlatformAdapterConfig;
  private graphApiVersion: string;

  constructor(config?: Partial<PlatformAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.graphApiVersion = (config as any)?.graphApiVersion || process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;
    
    // Load credentials from environment
    this.config.credentials = {
      accessToken: config?.credentials?.accessToken || process.env.META_ACCESS_TOKEN || '',
      apiKey: config?.credentials?.apiKey || process.env.META_APP_ID || ''
    };
  }

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.credentials.accessToken);
  }

  /**
   * Get Graph API base URL
   */
  private getApiUrl(endpoint: string): string {
    const baseUrl = this.config.apiEndpoint || `https://graph.facebook.com/${this.graphApiVersion}`;
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Upload video to Facebook Page or Instagram
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
        error: 'Meta adapter not configured. Set META_ACCESS_TOKEN environment variable.'
      };
    }

    // Determine target (Facebook or Instagram)
    const target = metadata.custom?.target as string || 'facebook';
    const pageId = metadata.custom?.pageId as string || process.env.META_PAGE_ID;
    const igUserId = metadata.custom?.igUserId as string || process.env.META_IG_USER_ID;

    if (target === 'instagram') {
      return this.uploadToInstagram(videoPath, metadata, igUserId || '', startTime);
    } else {
      return this.uploadToFacebook(videoPath, metadata, pageId || '', startTime);
    }
  }

  /**
   * Upload video to Facebook Page
   */
  private async uploadToFacebook(
    videoPath: string,
    metadata: PublishingMetadata,
    pageId: string,
    startTime: number
  ): Promise<PlatformUploadResult> {
    if (!pageId) {
      return {
        success: false,
        error: 'META_PAGE_ID not configured'
      };
    }

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

      // Step 2: Transfer video data
      const chunkSize = 4 * 1024 * 1024; // 4MB chunks
      let startOffset = 0;

      while (startOffset < fileSize) {
        const endOffset = Math.min(startOffset + chunkSize, fileSize);
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

      // Step 3: Finish upload
      const finishUrl = this.getApiUrl(`/${pageId}/videos`);
      const finishParams = new URLSearchParams({
        access_token: this.config.credentials.accessToken || '',
        upload_phase: 'finish',
        upload_session_id: uploadSessionId,
        title: metadata.title,
        description: metadata.description || ''
      });

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
        console.log(`[meta-adapter] Facebook upload complete: ${videoId}`);
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
   * Upload video to Instagram (Reels)
   */
  private async uploadToInstagram(
    videoPath: string,
    metadata: PublishingMetadata,
    igUserId: string,
    startTime: number
  ): Promise<PlatformUploadResult> {
    if (!igUserId) {
      return {
        success: false,
        error: 'META_IG_USER_ID not configured'
      };
    }

    try {
      // Instagram requires a publicly accessible URL
      // For now, we'll return an error indicating the video needs to be hosted
      const videoUrl = metadata.custom?.videoUrl as string;
      
      if (!videoUrl) {
        return {
          success: false,
          error: 'Instagram requires a publicly accessible video URL. Upload to storage first.'
        };
      }

      // Step 1: Create media container
      const createUrl = this.getApiUrl(`/${igUserId}/media`);
      const createParams = new URLSearchParams({
        access_token: this.config.credentials.accessToken || '',
        media_type: 'REELS',
        video_url: videoUrl,
        caption: `${metadata.title}\n\n${metadata.description || ''}`
      });

      const createResponse = await fetch(`${createUrl}?${createParams}`, { method: 'POST' });

      if (!createResponse.ok) {
        const errorData = await createResponse.json() as { error?: { message?: string } };
        return {
          success: false,
          error: `Instagram create error: ${errorData.error?.message || createResponse.status}`
        };
      }

      const createData = await createResponse.json() as { id?: string };
      const containerId = createData.id;

      if (!containerId) {
        return {
          success: false,
          error: 'Failed to create Instagram media container'
        };
      }

      // Step 2: Wait for container to be ready
      let containerReady = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max wait

      while (!containerReady && attempts < maxAttempts) {
        await this.sleep(5000);
        attempts++;

        const statusUrl = this.getApiUrl(`/${containerId}`);
        const statusParams = new URLSearchParams({
          access_token: this.config.credentials.accessToken || '',
          fields: 'status_code'
        });

        const statusResponse = await fetch(`${statusUrl}?${statusParams}`);
        const statusData = await statusResponse.json() as { status_code?: string };

        if (statusData.status_code === 'FINISHED') {
          containerReady = true;
        } else if (statusData.status_code === 'ERROR') {
          return {
            success: false,
            error: 'Instagram container processing failed'
          };
        }
      }

      if (!containerReady) {
        return {
          success: false,
          error: 'Instagram container processing timeout'
        };
      }

      // Step 3: Publish the container
      const publishUrl = this.getApiUrl(`/${igUserId}/media_publish`);
      const publishParams = new URLSearchParams({
        access_token: this.config.credentials.accessToken || '',
        creation_id: containerId
      });

      const publishResponse = await fetch(`${publishUrl}?${publishParams}`, { method: 'POST' });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json() as { error?: { message?: string } };
        return {
          success: false,
          error: `Instagram publish error: ${errorData.error?.message || publishResponse.status}`
        };
      }

      const publishData = await publishResponse.json() as { id?: string };
      const mediaId = publishData.id;

      const uploadDuration = (Date.now() - startTime) / 1000;

      console.log(`[meta-adapter] Instagram upload complete: ${mediaId}`);

      return {
        success: true,
        videoId: mediaId,
        videoUrl: `https://www.instagram.com/reel/${mediaId}`,
        uploadDuration,
        platformData: { igUserId, mediaId, containerId }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Instagram upload error',
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
   * Delete video from Facebook/Instagram
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
      console.warn('[meta-adapter] Delete error:', error);
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default instance
export const metaAdapter = new MetaAdapter();
