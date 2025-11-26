/**
 * Render Job Types
 * Defines the job model for render queue management.
 */

/** Render job status */
export type RenderJobStatus = 
  | 'queued'     // Job is waiting to be processed
  | 'rendering'  // Job is currently being rendered
  | 'completed'  // Job finished successfully
  | 'failed';    // Job failed with error

/** Render job priority */
export type RenderJobPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Render job request (input to queue)
 */
export interface RenderJobRequest {
  /** Episode ID to render */
  episodeId: string;
  /** Path to timeline JSON (optional, will be resolved if not provided) */
  timelinePath?: string;
  /** Job priority */
  priority?: RenderJobPriority;
  /** Force re-render even if output exists */
  force?: boolean;
  /** Callback URL to notify on completion */
  callbackUrl?: string;
  /** Actor/user who queued the job */
  actor?: string;
}

/**
 * Render job in the queue
 */
export interface RenderJob {
  /** Unique job identifier */
  id: string;
  /** Episode ID being rendered */
  episodeId: string;
  /** Current job status */
  status: RenderJobStatus;
  /** Job priority */
  priority: RenderJobPriority;
  /** Path to timeline JSON */
  timelinePath: string;
  /** Path to output video (set on completion) */
  outputPath?: string;
  /** Render URL (set on completion, may be local or cloud) */
  renderUrl?: string;
  /** Error message if failed */
  error?: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** When the job was queued */
  queuedAt: string;
  /** When rendering started */
  startedAt?: string;
  /** When job completed or failed */
  completedAt?: string;
  /** Duration of the render in seconds */
  renderDuration?: number;
  /** Actor who queued the job */
  actor?: string;
  /** Callback URL for notifications */
  callbackUrl?: string;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Render job result returned from API
 */
export interface RenderJobResult {
  /** Job details */
  job: RenderJob;
  /** Whether the operation succeeded */
  success: boolean;
  /** Message */
  message?: string;
}

/**
 * Render queue statistics
 */
export interface RenderQueueStats {
  /** Total jobs in queue */
  total: number;
  /** Jobs by status */
  byStatus: Record<RenderJobStatus, number>;
  /** Currently processing jobs */
  processing: number;
  /** Average render time (seconds) */
  avgRenderTime?: number;
  /** Queue last updated */
  updatedAt: string;
}

/**
 * ffmpeg render options
 */
export interface FFmpegRenderOptions {
  /** Input video/image for background */
  backgroundInput?: string;
  /** Input audio files */
  audioInputs: Array<{
    path: string;
    volume: number;
    startTime: number;
  }>;
  /** Caption/subtitle file path */
  subtitlePath?: string;
  /** Output width */
  width: number;
  /** Output height */
  height: number;
  /** Output frame rate */
  frameRate: number;
  /** Total duration in seconds */
  duration: number;
  /** Output file path */
  outputPath: string;
  /** Use hardware acceleration if available */
  useHardwareAccel?: boolean;
  /** Video codec (default: libx264) */
  videoCodec?: string;
  /** Audio codec (default: aac) */
  audioCodec?: string;
  /** Video bitrate (e.g., '5M') */
  videoBitrate?: string;
  /** Audio bitrate (e.g., '192k') */
  audioBitrate?: string;
  /** Additional ffmpeg arguments */
  extraArgs?: string[];
}

/**
 * Render worker configuration
 */
export interface RenderWorkerConfig {
  /** Maximum concurrent renders */
  maxConcurrent: number;
  /** Maximum render time in seconds before timeout */
  maxRenderTime: number;
  /** Path to ffmpeg binary (default: 'ffmpeg') */
  ffmpegPath: string;
  /** Path to ffprobe binary (default: 'ffprobe') */
  ffprobePath: string;
  /** Output directory for renders */
  outputDir: string;
  /** Temporary directory for intermediate files */
  tempDir: string;
  /** Whether to keep intermediate files after render */
  keepIntermediateFiles: boolean;
  /** Default video codec */
  defaultVideoCodec: string;
  /** Default audio codec */
  defaultAudioCodec: string;
  /** Default video bitrate */
  defaultVideoBitrate: string;
  /** Default audio bitrate */
  defaultAudioBitrate: string;
}

/** Default render worker configuration */
export const DEFAULT_RENDER_CONFIG: RenderWorkerConfig = {
  maxConcurrent: 2,
  maxRenderTime: 600, // 10 minutes
  ffmpegPath: 'ffmpeg',
  ffprobePath: 'ffprobe',
  outputDir: 'renders',
  tempDir: 'renders/tmp',
  keepIntermediateFiles: false,
  defaultVideoCodec: 'libx264',
  defaultAudioCodec: 'aac',
  defaultVideoBitrate: '5M',
  defaultAudioBitrate: '192k'
};
