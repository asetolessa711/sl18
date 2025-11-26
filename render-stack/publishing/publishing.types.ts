/**
 * Publishing Types
 * Defines the types for automated publishing to external platforms.
 */

/** Supported publishing platforms */
export type PublishingPlatform = 'youtube' | 'meta' | 'tiktok';

/** Publishing job status */
export type PublishingJobStatus = 
  | 'pending'      // Waiting for QC approval
  | 'queued'       // Ready to publish
  | 'uploading'    // Currently uploading
  | 'processing'   // Platform processing (e.g., YouTube encoding)
  | 'completed'    // Successfully published
  | 'failed';      // Publishing failed

/** Publishing job priority */
export type PublishingJobPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Video metadata for publishing
 */
export interface PublishingMetadata {
  /** Video title */
  title: string;
  /** Video description */
  description?: string;
  /** Tags/keywords */
  tags?: string[];
  /** Category ID (platform-specific) */
  categoryId?: string;
  /** Privacy status */
  privacyStatus?: 'public' | 'unlisted' | 'private';
  /** Thumbnail path (local file) */
  thumbnailPath?: string;
  /** Playlist ID (for YouTube) */
  playlistId?: string;
  /** Scheduled publish time (ISO 8601) */
  scheduledPublishAt?: string;
  /** Whether the video is made for kids */
  madeForKids?: boolean;
  /** Persona code for tagging */
  personaCode?: string;
  /** Franchise ID for tagging */
  franchiseId?: string;
  /** Custom fields (platform-specific) */
  custom?: Record<string, unknown>;
}

/**
 * Publishing job request
 */
export interface PublishingJobRequest {
  /** Episode ID to publish */
  episodeId: string;
  /** Target platforms */
  platforms: PublishingPlatform[];
  /** Video metadata */
  metadata: PublishingMetadata;
  /** Job priority */
  priority?: PublishingJobPriority;
  /** Force publish (skip QC check) */
  force?: boolean;
  /** Actor who initiated the publish */
  actor?: string;
}

/**
 * Publishing job in the queue
 */
export interface PublishingJob {
  /** Unique job identifier */
  id: string;
  /** Episode ID being published */
  episodeId: string;
  /** Target platform */
  platform: PublishingPlatform;
  /** Current job status */
  status: PublishingJobStatus;
  /** Job priority */
  priority: PublishingJobPriority;
  /** Video metadata */
  metadata: PublishingMetadata;
  /** Path to rendered video */
  videoPath: string;
  /** Render URL (from storage) */
  renderUrl: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Platform-specific video ID (set on completion) */
  platformVideoId?: string;
  /** Platform-specific video URL (set on completion) */
  platformUrl?: string;
  /** Error message if failed */
  error?: string;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** When the job was created */
  createdAt: string;
  /** When the job was queued */
  queuedAt?: string;
  /** When uploading started */
  startedAt?: string;
  /** When job completed or failed */
  completedAt?: string;
  /** Upload duration in seconds */
  uploadDuration?: number;
  /** Actor who initiated the publish */
  actor?: string;
  /** QC approval info */
  qcApproval?: {
    approvedAt: string;
    approvedBy: string;
  };
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Publishing job result
 */
export interface PublishingJobResult {
  /** Job details */
  job: PublishingJob;
  /** Whether the operation succeeded */
  success: boolean;
  /** Message */
  message?: string;
}

/**
 * Publishing queue statistics
 */
export interface PublishingQueueStats {
  /** Total jobs */
  total: number;
  /** Jobs by status */
  byStatus: Record<PublishingJobStatus, number>;
  /** Jobs by platform */
  byPlatform: Record<PublishingPlatform, number>;
  /** Currently uploading jobs */
  uploading: number;
  /** Average upload time (seconds) */
  avgUploadTime?: number;
  /** Queue last updated */
  updatedAt: string;
}

/**
 * Platform upload result
 */
export interface PlatformUploadResult {
  /** Whether upload succeeded */
  success: boolean;
  /** Platform-specific video ID */
  videoId?: string;
  /** Platform-specific video URL */
  videoUrl?: string;
  /** Error message if failed */
  error?: string;
  /** Upload duration in seconds */
  uploadDuration?: number;
  /** Platform-specific metadata */
  platformData?: Record<string, unknown>;
}

/**
 * Platform adapter interface
 */
export interface PublishingAdapter {
  /** Platform name */
  platform: PublishingPlatform;
  /** Check if adapter is configured */
  isConfigured(): boolean;
  /** Upload video to platform */
  upload(videoPath: string, metadata: PublishingMetadata): Promise<PlatformUploadResult>;
  /** Check upload status (for async platforms) */
  checkStatus?(videoId: string): Promise<{ status: string; progress?: number }>;
  /** Delete video from platform */
  deleteVideo?(videoId: string): Promise<boolean>;
}

/**
 * Platform adapter configuration
 */
export interface PlatformAdapterConfig {
  /** API credentials (from .env) */
  credentials: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  /** Tokens file path */
  tokensPath?: string;
  /** Whether to use sandbox/test mode */
  sandbox?: boolean;
  /** Custom API endpoint (for testing) */
  apiEndpoint?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Publishing history entry
 */
export interface PublishingHistoryEntry {
  /** Job ID */
  jobId: string;
  /** Episode ID */
  episodeId: string;
  /** Platform */
  platform: PublishingPlatform;
  /** Status */
  status: PublishingJobStatus;
  /** Platform video ID */
  platformVideoId?: string;
  /** Platform URL */
  platformUrl?: string;
  /** When published */
  publishedAt?: string;
  /** Who initiated */
  actor?: string;
  /** Error if failed */
  error?: string;
}

/**
 * Secrets rotation tracking
 */
export interface SecretsRotationStatus {
  /** Platform */
  platform: PublishingPlatform;
  /** Last rotation date */
  lastRotatedAt?: string;
  /** Next rotation due */
  rotationDueAt?: string;
  /** Whether rotation is overdue */
  isOverdue: boolean;
  /** Days until rotation */
  daysUntilRotation?: number;
}

/**
 * Default publishing configuration
 */
export const DEFAULT_PUBLISHING_CONFIG = {
  maxRetries: 3,
  retryBackoffMs: 5000,
  uploadTimeout: 3600000, // 1 hour
  maxConcurrentUploads: 2,
  rotationPeriodDays: 90
};
