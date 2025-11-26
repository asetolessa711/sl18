/**
 * Render Worker
 * ffmpeg-based render worker that consumes timeline.json and produces master.mp4.
 */

import { spawn, type ChildProcess } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import type { Timeline, RenderProfile, CaptionSegment } from '../types/timeline.types.js';
import type { AssetManifest } from '../types/assetManifest.types.js';
import type {
  RenderJob,
  RenderWorkerConfig,
  FFmpegRenderOptions,
  DEFAULT_RENDER_CONFIG
} from './render-job.types.js';
import { renderQueue } from './render-queue.js';

// Lazy import storage manager to avoid circular dependencies
let storageManager: any = null;
async function getStorageManager() {
  if (!storageManager) {
    try {
      const module = await import('../storage/storage-manager.js');
      storageManager = module.storageManager;
    } catch (e) {
      console.warn('[render-worker] Storage manager not available:', e);
    }
  }
  return storageManager;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

/** Render profile dimensions */
const PROFILE_DIMENSIONS: Record<RenderProfile, { width: number; height: number }> = {
  'vertical_1080x1920': { width: 1080, height: 1920 },
  'horizontal_1920x1080': { width: 1920, height: 1080 },
  'square_1080x1080': { width: 1080, height: 1080 }
};

/**
 * Escape a file path for use in ffmpeg filter expressions.
 * 
 * ffmpeg filter expressions use single quotes for paths.
 * This function handles:
 * - Windows backslashes → forward slashes
 * - Colons → escaped colons (Windows drive letters like C:)
 * - Single quotes → shell-escaped quotes
 * - Semicolons → escaped (ffmpeg filter separator)
 * 
 * Note: This is specifically for ffmpeg subtitle filter paths,
 * not general shell escaping.
 */
function escapeFFmpegPath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') {
    return '';
  }
  // Validate path doesn't contain dangerous patterns
  if (filePath.includes('..') && filePath.includes('/')) {
    // Path traversal attempt - use basename only
    const parts = filePath.split(/[/\\]/);
    filePath = parts[parts.length - 1] || filePath;
  }
  return filePath
    .replace(/\\/g, '/')        // Convert backslashes to forward slashes
    .replace(/:/g, '\\:')       // Escape colons (Windows drive letters)
    .replace(/'/g, "'\\''")     // Escape single quotes
    .replace(/;/g, '\\;');      // Escape semicolons (ffmpeg filter separator)
}

/**
 * Render Worker class
 */
export class RenderWorker {
  private config: RenderWorkerConfig;
  private processing: boolean = false;
  private currentProcess: ChildProcess | null = null;

  constructor(config?: Partial<RenderWorkerConfig>) {
    this.config = {
      maxConcurrent: 2,
      maxRenderTime: 600,
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe',
      outputDir: join(repoRoot, 'renders'),
      tempDir: join(repoRoot, 'renders', 'tmp'),
      keepIntermediateFiles: false,
      defaultVideoCodec: 'libx264',
      defaultAudioCodec: 'aac',
      defaultVideoBitrate: '5M',
      defaultAudioBitrate: '192k',
      ...config
    };

    // Ensure directories exist
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }
    if (!existsSync(this.config.tempDir)) {
      mkdirSync(this.config.tempDir, { recursive: true });
    }
  }

  /**
   * Start processing the queue
   */
  async startProcessing(): Promise<void> {
    if (this.processing) {
      console.log('[render-worker] Already processing');
      return;
    }

    this.processing = true;
    console.log('[render-worker] Started queue processing');

    while (this.processing) {
      const activeCount = renderQueue.getActiveCount();
      if (activeCount >= this.config.maxConcurrent) {
        await this.sleep(1000);
        continue;
      }

      const job = renderQueue.dequeue();
      if (!job) {
        await this.sleep(1000);
        continue;
      }

      // Process job (don't await to allow concurrent processing)
      this.processJob(job).catch(error => {
        console.error(`[render-worker] Error processing job ${job.id}:`, error);
        renderQueue.failJob(job.id, error.message || 'Unknown error');
      });
    }
  }

  /**
   * Stop processing
   */
  stopProcessing(): void {
    this.processing = false;
    if (this.currentProcess) {
      this.currentProcess.kill();
    }
    console.log('[render-worker] Stopped queue processing');
  }

  /**
   * Process a single render job
   */
  async processJob(job: RenderJob): Promise<void> {
    console.log(`[render-worker] Starting job ${job.id} for episode ${job.episodeId}`);
    renderQueue.updateStatus(job.id, 'rendering');

    try {
      // Load timeline
      const timelinePath = join(repoRoot, job.timelinePath);
      if (!existsSync(timelinePath)) {
        throw new Error(`Timeline not found: ${timelinePath}`);
      }
      const timeline: Timeline = JSON.parse(readFileSync(timelinePath, 'utf8'));

      // Load asset manifest
      let manifest: AssetManifest | undefined;
      if (timeline.assetManifestPath) {
        const manifestPath = join(repoRoot, timeline.assetManifestPath);
        if (existsSync(manifestPath)) {
          manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        }
      }

      // Create output directory for this episode
      const episodeOutputDir = join(this.config.outputDir, job.episodeId);
      if (!existsSync(episodeOutputDir)) {
        mkdirSync(episodeOutputDir, { recursive: true });
      }

      // Build ffmpeg options
      const outputPath = join(episodeOutputDir, 'master.mp4');
      const ffmpegOptions = this.buildFFmpegOptions(timeline, manifest, outputPath);

      // Generate subtitle file if captions exist
      const subtitlePath = await this.generateSubtitleFile(timeline, job.episodeId);
      if (subtitlePath) {
        ffmpegOptions.subtitlePath = subtitlePath;
      }

      // Execute ffmpeg
      await this.executeFFmpeg(ffmpegOptions, job.id);

      // Upload to storage if storage manager is available
      let renderUrl = `file://${outputPath}`;
      const storage = await getStorageManager();
      if (storage) {
        try {
          const uploadResult = await storage.uploadRender(outputPath, job.episodeId, {
            verifyChecksum: true,
            contentType: 'video/mp4'
          });
          renderUrl = uploadResult.url;
          console.log(`[render-worker] Uploaded to storage: ${renderUrl}`);
        } catch (uploadError: any) {
          console.warn(`[render-worker] Storage upload failed, using local path:`, uploadError.message);
        }
      }

      // Complete job
      renderQueue.completeJob(job.id, outputPath, renderUrl);
      console.log(`[render-worker] Completed job ${job.id}: ${outputPath}`);

    } catch (error: any) {
      console.error(`[render-worker] Job ${job.id} failed:`, error);
      renderQueue.failJob(job.id, error.message || 'Render failed');
      throw error;
    }
  }

  /**
   * Build ffmpeg options from timeline
   */
  private buildFFmpegOptions(
    timeline: Timeline,
    manifest: AssetManifest | undefined,
    outputPath: string
  ): FFmpegRenderOptions {
    const dimensions = PROFILE_DIMENSIONS[timeline.renderProfile];
    const manifestDir = manifest 
      ? dirname(join(repoRoot, timeline.assetManifestPath || ''))
      : repoRoot;

    // Find audio inputs
    const audioInputs: FFmpegRenderOptions['audioInputs'] = [];
    
    for (const track of timeline.tracks) {
      if (track.type === 'audio' && !track.muted) {
        for (const clip of track.clips) {
          if (clip.assetRef && manifest) {
            const asset = manifest.assets.find(a => a.id === clip.assetRef);
            if (asset) {
              audioInputs.push({
                path: join(manifestDir, asset.path),
                volume: (clip.volume ?? 1.0) * (track.volume ?? 1.0),
                startTime: clip.startTime
              });
            }
          }
        }
      }
    }

    // Find background input
    let backgroundInput: string | undefined;
    for (const track of timeline.tracks) {
      if (track.type === 'video') {
        for (const clip of track.clips) {
          if (clip.type === 'background' && clip.assetRef && manifest) {
            const asset = manifest.assets.find(a => a.id === clip.assetRef);
            if (asset) {
              backgroundInput = join(manifestDir, asset.path);
              break;
            }
          }
        }
        if (backgroundInput) break;
      }
    }

    return {
      backgroundInput,
      audioInputs,
      width: dimensions.width,
      height: dimensions.height,
      frameRate: timeline.frameRate,
      duration: timeline.duration,
      outputPath,
      videoCodec: this.config.defaultVideoCodec,
      audioCodec: this.config.defaultAudioCodec,
      videoBitrate: this.config.defaultVideoBitrate,
      audioBitrate: this.config.defaultAudioBitrate
    };
  }

  /**
   * Generate SRT subtitle file from timeline captions
   */
  private async generateSubtitleFile(timeline: Timeline, episodeId: string): Promise<string | undefined> {
    // Find caption track
    let captions: CaptionSegment[] = [];
    for (const track of timeline.tracks) {
      if (track.type === 'caption') {
        for (const clip of track.clips) {
          if (clip.captions) {
            captions = captions.concat(clip.captions);
          }
        }
      }
    }

    if (captions.length === 0) {
      return undefined;
    }

    // Generate SRT content
    let srtContent = '';
    captions.forEach((caption, index) => {
      const startTime = this.formatSrtTime(caption.startTime);
      const endTime = this.formatSrtTime(caption.endTime);
      srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n\n`;
    });

    // Write to temp file
    const subtitlePath = join(this.config.tempDir, `${episodeId}_captions.srt`);
    writeFileSync(subtitlePath, srtContent, 'utf8');
    return subtitlePath;
  }

  /**
   * Format time for SRT (HH:MM:SS,mmm)
   */
  private formatSrtTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
  }

  /**
   * Execute ffmpeg render
   */
  private async executeFFmpeg(options: FFmpegRenderOptions, jobId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = this.buildFFmpegArgs(options);
      console.log(`[render-worker] ffmpeg command: ${this.config.ffmpegPath} ${args.join(' ')}`);

      const process = spawn(this.config.ffmpegPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.currentProcess = process;
      let stderr = '';

      // Parse progress from ffmpeg stderr
      process.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;

        // Parse time progress
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.\d{2}/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = parseInt(timeMatch[3], 10);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const progress = Math.min(99, Math.round((currentTime / options.duration) * 100));
          renderQueue.updateProgress(jobId, progress);
        }
      });

      // Timeout handling
      const timeout = setTimeout(() => {
        process.kill();
        reject(new Error(`Render timeout after ${this.config.maxRenderTime} seconds`));
      }, this.config.maxRenderTime * 1000);

      process.on('close', (code) => {
        clearTimeout(timeout);
        this.currentProcess = null;

        if (code === 0) {
          resolve();
        } else {
          // Extract error from stderr
          const errorMatch = stderr.match(/Error[^\n]*/i);
          const errorMessage = errorMatch ? errorMatch[0] : `ffmpeg exited with code ${code}`;
          reject(new Error(errorMessage));
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        this.currentProcess = null;
        reject(error);
      });
    });
  }

  /**
   * Build ffmpeg command arguments
   */
  private buildFFmpegArgs(options: FFmpegRenderOptions): string[] {
    const args: string[] = ['-y']; // Overwrite output

    // Background/video input
    if (options.backgroundInput && existsSync(options.backgroundInput)) {
      // If it's an image, loop it
      const ext = (options.backgroundInput.toLowerCase().split('.').pop() ?? '').toLowerCase();
      const imageExtensions = ['png', 'jpg', 'jpeg', 'webp'];
      if (ext && imageExtensions.includes(ext)) {
        args.push('-loop', '1', '-t', options.duration.toString());
      }
      args.push('-i', options.backgroundInput);
    } else {
      // Generate solid color background
      args.push(
        '-f', 'lavfi',
        '-i', `color=c=black:s=${options.width}x${options.height}:d=${options.duration}:r=${options.frameRate}`
      );
    }

    // Audio inputs
    for (const audio of options.audioInputs) {
      if (existsSync(audio.path)) {
        args.push('-i', audio.path);
      }
    }

    // Build filter complex for audio mixing
    const filterParts: string[] = [];
    const audioCount = options.audioInputs.filter(a => existsSync(a.path)).length;
    
    if (audioCount > 0) {
      // Scale and pad video to target dimensions
      filterParts.push(`[0:v]scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2[v]`);
      
      // Mix audio tracks
      const audioMixInputs: string[] = [];
      let inputIdx = 1;
      for (const audio of options.audioInputs) {
        if (existsSync(audio.path)) {
          filterParts.push(`[${inputIdx}:a]volume=${audio.volume}[a${inputIdx}]`);
          audioMixInputs.push(`[a${inputIdx}]`);
          inputIdx++;
        }
      }
      
      if (audioMixInputs.length > 1) {
        filterParts.push(`${audioMixInputs.join('')}amix=inputs=${audioMixInputs.length}:duration=longest[aout]`);
      } else if (audioMixInputs.length === 1) {
        filterParts.push(`[a1]anull[aout]`);
      }

      // Add subtitles if present
      if (options.subtitlePath && existsSync(options.subtitlePath)) {
        const escapedPath = escapeFFmpegPath(options.subtitlePath);
        filterParts.push(`[v]subtitles='${escapedPath}':force_style='FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2'[vout]`);
        args.push('-filter_complex', filterParts.join(';'));
        args.push('-map', '[vout]');
      } else {
        args.push('-filter_complex', filterParts.join(';'));
        args.push('-map', '[v]');
      }

      if (audioMixInputs.length > 0) {
        args.push('-map', '[aout]');
      }
    } else {
      // No audio, just scale video
      args.push('-vf', `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`);
      
      // Add subtitles if present
      if (options.subtitlePath && existsSync(options.subtitlePath)) {
        const escapedPath = escapeFFmpegPath(options.subtitlePath);
        args.push('-vf', `subtitles='${escapedPath}':force_style='FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2'`);
      }
    }

    // Output settings
    args.push(
      '-c:v', options.videoCodec || 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', options.audioCodec || 'aac',
      '-b:a', options.audioBitrate || '192k',
      '-r', options.frameRate.toString(),
      '-t', options.duration.toString(),
      '-movflags', '+faststart',
      options.outputPath
    );

    // Add extra args if provided
    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    return args;
  }

  /**
   * Render a single episode (convenience method)
   */
  async renderEpisode(episodeId: string, timelinePath?: string): Promise<RenderJob> {
    const job = renderQueue.enqueue({
      episodeId,
      timelinePath,
      priority: 'normal'
    });

    await this.processJob(job);
    return renderQueue.getJob(job.id)!;
  }

  /**
   * Check if ffmpeg is available
   */
  async checkFFmpeg(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn(this.config.ffmpegPath, ['-version']);
      process.on('close', (code) => resolve(code === 0));
      process.on('error', () => resolve(false));
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const renderWorker = new RenderWorker();
