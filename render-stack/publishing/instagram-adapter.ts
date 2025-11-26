/**
 * Instagram Publishing Adapter
 * Handles video uploads (Reels) to Instagram via the Graph API.
 */

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

// Max wait time for container processing (5 minutes)
const MAX_CONTAINER_WAIT_ATTEMPTS = 60;
const CONTAINER_POLL_INTERVAL_MS = 5000;

/**
 * Instagram Publishing Adapter
 * Uploads Reels to Instagram using the Graph API.
 * Requires a Business or Creator account.
 */
export class InstagramAdapter implements PublishingAdapter {
  readonly platform = 'instagram' as const;
  private config: PlatformAdapterConfig;
  private graphApiVersion: string;

  constructor(config?: Partial<PlatformAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.graphApiVersion = (config as any)?.graphApiVersion || process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;
    
    // Load credentials from environment
    this.config.credentials = {
      accessToken: config?.credentials?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '',
      apiKey: config?.credentials?.apiKey || process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || ''
    };
  }

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.credentials.accessToken && this.getIgUserId());
  }

  /**
   * Get the configured Instagram User ID
   */
  private getIgUserId(): string {
    return process.env.INSTAGRAM_USER_ID || process.env.META_IG_USER_ID || '';
  }

  /**
   * Get Graph API base URL
   */
  private getApiUrl(endpoint: string): string {
    const baseUrl = this.config.apiEndpoint || `https://graph.facebook.com/${this.graphApiVersion}`;
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Upload video to Instagram (Reels)
   * Note: Instagram requires a publicly accessible video URL.
   */
  async upload(videoPath: string, metadata: PublishingMetadata): Promise<PlatformUploadResult> {
    const startTime = Date.now();

    // Check configuration
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Instagram adapter not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID environment variables.'
      };
    }

    const igUserId = metadata.custom?.igUserId as string || this.getIgUserId();

    // Instagram requires a publicly accessible video URL
    const videoUrl = metadata.custom?.videoUrl as string;
    
    if (!videoUrl) {
      return {
        success: false,
        error: 'Instagram requires a publicly accessible video URL. Upload to storage first and pass the URL via metadata.custom.videoUrl'
      };
    }

    try {
      // Build caption with hashtags
      let caption = metadata.title;
      if (metadata.description) {
        caption += `\n\n${metadata.description}`;
      }
      if (metadata.tags && metadata.tags.length > 0) {
        const hashtags = metadata.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
        caption += `\n\n${hashtags}`;
      }
      if (metadata.personaCode) {
        caption += `\n\n#${metadata.personaCode}`;
      }

      // Step 1: Create media container
      const createUrl = this.getApiUrl(`/${igUserId}/media`);
      const createParams = new URLSearchParams({
        access_token: this.config.credentials.accessToken || '',
        media_type: 'REELS',
        video_url: videoUrl,
        caption
      });

      // Add cover image if thumbnail provided
      if (metadata.custom?.coverUrl) {
        createParams.append('cover_url', metadata.custom.coverUrl as string);
      }

      // Add share to feed option
      if (metadata.custom?.shareToFeed !== false) {
        createParams.append('share_to_feed', 'true');
      }

      const createResponse = await fetch(`${createUrl}?${createParams}`, { method: 'POST' });

      if (!createResponse.ok) {
        const errorData = await createResponse.json() as { error?: { message?: string; code?: number } };
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
      let lastStatus = '';

      while (!containerReady && attempts < MAX_CONTAINER_WAIT_ATTEMPTS) {
        await this.sleep(CONTAINER_POLL_INTERVAL_MS);
        attempts++;

        const statusUrl = this.getApiUrl(`/${containerId}`);
        const statusParams = new URLSearchParams({
          access_token: this.config.credentials.accessToken || '',
          fields: 'status_code,status'
        });

        const statusResponse = await fetch(`${statusUrl}?${statusParams}`);
        const statusData = await statusResponse.json() as { status_code?: string; status?: string };
        lastStatus = statusData.status_code || statusData.status || 'unknown';

        if (lastStatus === 'FINISHED') {
          containerReady = true;
        } else if (lastStatus === 'ERROR' || lastStatus === 'EXPIRED') {
          return {
            success: false,
            error: `Instagram container processing failed: ${lastStatus}`
          };
        }

        // Log progress
        if (attempts % 6 === 0) { // Every 30 seconds
          console.log(`[instagram-adapter] Container status: ${lastStatus} (attempt ${attempts}/${MAX_CONTAINER_WAIT_ATTEMPTS})`);
        }
      }

      if (!containerReady) {
        return {
          success: false,
          error: `Instagram container processing timeout (last status: ${lastStatus})`
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

      console.log(`[instagram-adapter] Upload complete: ${mediaId}`);

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
   * Check media status
   */
  async checkStatus(mediaId: string): Promise<{ status: string; progress?: number }> {
    if (!this.config.credentials.accessToken) {
      return { status: 'unknown' };
    }

    try {
      const url = this.getApiUrl(`/${mediaId}`);
      const params = new URLSearchParams({
        access_token: this.config.credentials.accessToken,
        fields: 'status'
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        return { status: 'unknown' };
      }

      const data = await response.json() as { status?: string };
      return { status: data.status || 'unknown' };
    } catch (error) {
      return { status: 'error' };
    }
  }

  /**
   * Delete media from Instagram
   * Note: Instagram API doesn't support media deletion via API.
   */
  async deleteVideo(_mediaId: string): Promise<boolean> {
    console.warn('[instagram-adapter] Instagram API does not support media deletion. Use the Instagram app or website.');
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default instance
export const instagramAdapter = new InstagramAdapter();
