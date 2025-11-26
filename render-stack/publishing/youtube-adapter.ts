/**
 * YouTube Publishing Adapter
 * Handles video uploads to YouTube via the YouTube Data API v3.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import type {
  PublishingAdapter,
  PlatformUploadResult,
  PublishingMetadata,
  PlatformAdapterConfig
} from './publishing.types.js';

// Default YouTube category IDs
const YOUTUBE_CATEGORIES = {
  PEOPLE_BLOGS: '22',
  ENTERTAINMENT: '24',
  COMEDY: '23',
  MUSIC: '10',
  EDUCATION: '27'
};

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
 * YouTube Publishing Adapter
 */
export class YouTubeAdapter implements PublishingAdapter {
  readonly platform = 'youtube' as const;
  private config: PlatformAdapterConfig;
  private tokensPath: string;

  constructor(config?: Partial<PlatformAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokensPath = this.config.tokensPath || path.join(process.cwd(), 'config', 'youtube_tokens.json');
    
    // Load credentials from environment
    this.config.credentials = {
      clientId: config?.credentials?.clientId || process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: config?.credentials?.clientSecret || process.env.YOUTUBE_CLIENT_SECRET || '',
      apiKey: config?.credentials?.apiKey || process.env.YOUTUBE_API_KEY || '',
      accessToken: config?.credentials?.accessToken || process.env.YOUTUBE_ACCESS_TOKEN || '',
      refreshToken: config?.credentials?.refreshToken || process.env.YOUTUBE_REFRESH_TOKEN || ''
    };

    // Try to load tokens from file
    this.loadTokens();
  }

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean {
    return Boolean(
      this.config.credentials.clientId &&
      this.config.credentials.clientSecret &&
      (this.config.credentials.accessToken || this.config.credentials.refreshToken)
    );
  }

  /**
   * Load tokens from file
   */
  private loadTokens(): void {
    if (existsSync(this.tokensPath)) {
      try {
        const tokens = JSON.parse(readFileSync(this.tokensPath, 'utf8'));
        this.config.credentials.accessToken = tokens.access_token || this.config.credentials.accessToken;
        this.config.credentials.refreshToken = tokens.refresh_token || this.config.credentials.refreshToken;
      } catch (error) {
        console.warn('[youtube-adapter] Failed to load tokens:', error);
      }
    }
  }

  /**
   * Save tokens to file
   */
  private saveTokens(tokens: { access_token?: string; refresh_token?: string }): void {
    try {
      const dir = path.dirname(this.tokensPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      const existingTokens = existsSync(this.tokensPath) 
        ? JSON.parse(readFileSync(this.tokensPath, 'utf8')) 
        : {};
      
      const merged = { ...existingTokens, ...tokens };
      writeFileSync(this.tokensPath, JSON.stringify(merged, null, 2));
    } catch (error) {
      console.warn('[youtube-adapter] Failed to save tokens:', error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.config.credentials.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.credentials.clientId || '',
          client_secret: this.config.credentials.clientSecret || '',
          refresh_token: this.config.credentials.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        console.warn('[youtube-adapter] Token refresh failed:', response.status);
        return false;
      }

      const data = await response.json() as { access_token?: string };
      if (data.access_token) {
        this.config.credentials.accessToken = data.access_token;
        this.saveTokens({ access_token: data.access_token });
        return true;
      }
    } catch (error) {
      console.warn('[youtube-adapter] Token refresh error:', error);
    }

    return false;
  }

  /**
   * Upload video to YouTube
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
        error: 'YouTube adapter not configured. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and tokens.'
      };
    }

    // Ensure we have a valid access token
    if (!this.config.credentials.accessToken && this.config.credentials.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        return {
          success: false,
          error: 'Failed to refresh access token. Re-authentication required.'
        };
      }
    }

    try {
      // Build video metadata
      const videoMetadata = {
        snippet: {
          title: metadata.title,
          description: metadata.description || '',
          tags: metadata.tags || [],
          categoryId: metadata.categoryId || YOUTUBE_CATEGORIES.PEOPLE_BLOGS
        },
        status: {
          privacyStatus: metadata.privacyStatus || 'private',
          selfDeclaredMadeForKids: metadata.madeForKids || false
        }
      };

      // Read video file
      const videoBuffer = readFileSync(videoPath);
      const videoSize = videoBuffer.length;

      // Step 1: Initialize resumable upload
      const initResponse = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.credentials.accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Length': videoSize.toString(),
            'X-Upload-Content-Type': 'video/*'
          },
          body: JSON.stringify(videoMetadata)
        }
      );

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        
        // Try token refresh on 401
        if (initResponse.status === 401 && this.config.credentials.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry upload
            return this.upload(videoPath, metadata);
          }
        }
        
        return {
          success: false,
          error: `YouTube API error: ${initResponse.status} - ${errorText}`
        };
      }

      // Get upload URL from Location header
      const uploadUrl = initResponse.headers.get('Location');
      if (!uploadUrl) {
        return {
          success: false,
          error: 'Failed to get upload URL from YouTube API'
        };
      }

      // Step 2: Upload video data
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/*',
          'Content-Length': videoSize.toString()
        },
        body: videoBuffer
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        return {
          success: false,
          error: `Video upload failed: ${uploadResponse.status} - ${errorText}`
        };
      }

      const result = await uploadResponse.json() as { id?: string };
      const videoId = result.id;
      const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;

      const uploadDuration = (Date.now() - startTime) / 1000;

      // Step 3: Set thumbnail if provided
      if (metadata.thumbnailPath && existsSync(metadata.thumbnailPath) && videoId) {
        await this.setThumbnail(videoId, metadata.thumbnailPath);
      }

      // Step 4: Add to playlist if provided
      if (metadata.playlistId && videoId) {
        await this.addToPlaylist(metadata.playlistId, videoId);
      }

      console.log(`[youtube-adapter] Upload complete: ${videoId}`);

      return {
        success: true,
        videoId,
        videoUrl,
        uploadDuration,
        platformData: result
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown upload error',
        uploadDuration: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * Set video thumbnail
   */
  private async setThumbnail(videoId: string, thumbnailPath: string): Promise<boolean> {
    try {
      const thumbnailBuffer = readFileSync(thumbnailPath);
      const mimeType = thumbnailPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      const response = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.credentials.accessToken}`,
            'Content-Type': mimeType
          },
          body: thumbnailBuffer
        }
      );

      if (!response.ok) {
        console.warn('[youtube-adapter] Thumbnail set failed:', response.status);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[youtube-adapter] Thumbnail error:', error);
      return false;
    }
  }

  /**
   * Add video to playlist
   */
  private async addToPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.credentials.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId
              }
            }
          })
        }
      );

      if (!response.ok) {
        console.warn('[youtube-adapter] Playlist add failed:', response.status);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[youtube-adapter] Playlist error:', error);
      return false;
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
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id=${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.credentials.accessToken}`
          }
        }
      );

      if (!response.ok) {
        return { status: 'unknown' };
      }

      const data = await response.json() as { items?: Array<{ status?: { uploadStatus?: string }, processingDetails?: { processingProgress?: { partsProcessed?: number, partsTotal?: number } } }> };
      const video = data.items?.[0];
      
      if (!video) {
        return { status: 'not_found' };
      }

      const uploadStatus = video.status?.uploadStatus || 'unknown';
      const processingDetails = video.processingDetails;
      
      let progress: number | undefined;
      if (processingDetails?.processingProgress) {
        const { partsProcessed, partsTotal } = processingDetails.processingProgress;
        if (partsTotal && partsTotal > 0) {
          progress = Math.round(((partsProcessed || 0) / partsTotal) * 100);
        }
      }

      return { status: uploadStatus, progress };
    } catch (error) {
      return { status: 'error' };
    }
  }

  /**
   * Delete video from YouTube
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    if (!this.config.credentials.accessToken) {
      return false;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.credentials.accessToken}`
          }
        }
      );

      return response.ok || response.status === 204;
    } catch (error) {
      console.warn('[youtube-adapter] Delete error:', error);
      return false;
    }
  }
}

// Default instance
export const youtubeAdapter = new YouTubeAdapter();
