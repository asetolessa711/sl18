/**
 * Timeline Builder
 * Converts asset manifests into structured timelines for the render worker.
 * 
 * Usage:
 *   npx tsx render-stack/builder/build-timeline.ts --episodeId test_001 --manifest assets/test_001/manifest.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  TIMELINE_SCHEMA_VERSION,
  type Timeline,
  type Track,
  type Clip,
  type CaptionSegment,
  type PersonaStyle,
  type QCFlags,
  type RenderProfile,
  type TimelineBuildOptions,
  type TimelineValidationResult
} from '../types/timeline.types.js';
import type {
  AssetManifest,
  AssetMetadata
} from '../types/assetManifest.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

/** Background music volume (0.0-1.0) */
const BACKGROUND_MUSIC_VOLUME = 0.3;

/** Default persona styles - loaded from persona_styles.json if available */
const DEFAULT_PERSONA_STYLE: PersonaStyle = {
  personaCode: 'default',
  primaryColor: '#FF6B35',
  secondaryColor: '#004E89',
  fontFamily: 'Inter',
  captionPosition: 'bottom-center',
  motionPreset: 'subtle-zoom',
  transitionPreset: 'fade',
  defaultRenderProfile: 'vertical_1080x1920'
};

/** QC thresholds */
const QC_MAX_CAPTION_LENGTH = 80;
const QC_MAX_DURATION_SECONDS = 180; // 3 minutes for short-form

/**
 * Load persona styles from configuration
 */
function loadPersonaStyles(): Record<string, PersonaStyle> {
  const stylesPath = join(repoRoot, 'render-stack', 'config', 'persona_styles.json');
  if (existsSync(stylesPath)) {
    try {
      const raw = readFileSync(stylesPath, 'utf8');
      return JSON.parse(raw) as Record<string, PersonaStyle>;
    } catch (e) {
      console.warn('[build-timeline] Failed to load persona_styles.json, using defaults');
    }
  }
  return {};
}

/**
 * Get persona style by code, falling back to default
 */
function getPersonaStyle(personaCode: string): PersonaStyle {
  const styles = loadPersonaStyles();
  return styles[personaCode] ?? { ...DEFAULT_PERSONA_STYLE, personaCode };
}

/**
 * Parse SRT/VTT transcript file into caption segments
 */
function parseTranscript(content: string, format: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  
  if (format === 'srt' || format === 'vtt') {
    // Simple SRT/VTT parser
    const blocks = content.split(/\n\n+/);
    let segmentId = 0;
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;
      
      // Find timing line (contains -->)
      const timingLineIdx = lines.findIndex(l => l.includes('-->'));
      if (timingLineIdx === -1) continue;
      
      const timingLine = lines[timingLineIdx];
      const timingMatch = timingLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
      if (!timingMatch) continue;
      
      const startTime = parseTimestamp(timingMatch[1]);
      const endTime = parseTimestamp(timingMatch[2]);
      const text = lines.slice(timingLineIdx + 1).join(' ').trim();
      
      if (text) {
        segments.push({
          id: `caption_${segmentId++}`,
          startTime,
          endTime,
          text
        });
      }
    }
  } else if (format === 'json') {
    // JSON transcript format (e.g., from Whisper)
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data.segments)) {
        data.segments.forEach((seg: any, idx: number) => {
          segments.push({
            id: `caption_${idx}`,
            startTime: seg.start ?? seg.startTime ?? 0,
            endTime: seg.end ?? seg.endTime ?? 0,
            text: seg.text ?? ''
          });
        });
      }
    } catch (e) {
      console.warn('[build-timeline] Failed to parse JSON transcript');
    }
  }
  
  return segments;
}

/**
 * Parse timestamp string to seconds
 */
function parseTimestamp(ts: string): number {
  // Handle HH:MM:SS,mmm or HH:MM:SS.mmm
  const normalized = ts.replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Run QC checks on the timeline
 */
function runQCChecks(timeline: Timeline, captions: CaptionSegment[]): QCFlags {
  const flags: QCFlags = {
    contentWarnings: [],
    needsHumanReview: false,
    notes: []
  };
  
  // Check caption lengths
  const longCaptions = captions.filter(c => c.text.length > QC_MAX_CAPTION_LENGTH);
  if (longCaptions.length > 0) {
    flags.captionLengthExceeded = true;
    flags.needsHumanReview = true;
    flags.reviewReason = `${longCaptions.length} caption(s) exceed ${QC_MAX_CAPTION_LENGTH} characters`;
    flags.notes?.push(`Long captions: ${longCaptions.map(c => c.id).join(', ')}`);
  }
  
  // Check duration
  if (timeline.duration > QC_MAX_DURATION_SECONDS) {
    flags.durationExceeded = true;
    flags.needsHumanReview = true;
    flags.reviewReason = (flags.reviewReason ? flags.reviewReason + '; ' : '') + 
      `Duration ${timeline.duration}s exceeds ${QC_MAX_DURATION_SECONDS}s limit`;
  }
  
  return flags;
}

/**
 * Build a timeline from an asset manifest
 */
export async function buildTimeline(options: TimelineBuildOptions): Promise<Timeline> {
  const { episodeId, manifestPath, renderProfile, personaOverride, skipQC } = options;
  
  // Load manifest
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  
  const manifestRaw = readFileSync(manifestPath, 'utf8');
  const manifest: AssetManifest = JSON.parse(manifestRaw);
  
  // Get persona style
  const baseStyle = getPersonaStyle(manifest.episode.personaCode);
  const style: PersonaStyle = personaOverride 
    ? { ...baseStyle, ...personaOverride }
    : baseStyle;
  
  // Determine render profile
  const profile: RenderProfile = renderProfile ?? style.defaultRenderProfile ?? 'vertical_1080x1920';
  
  // Find key assets
  const voiceAsset = manifest.assets.find(a => a.type === 'voice');
  const musicAsset = manifest.assets.find(a => a.type === 'music');
  const backgroundAsset = manifest.assets.find(a => a.type === 'background');
  const transcriptAsset = manifest.assets.find(a => a.type === 'transcript');
  
  // Calculate duration (use voice duration as primary)
  const duration = voiceAsset?.duration ?? manifest.episode.targetDuration ?? 60;
  
  // Parse captions if transcript exists
  let captions: CaptionSegment[] = [];
  if (transcriptAsset) {
    const transcriptPath = join(dirname(manifestPath), transcriptAsset.path);
    if (existsSync(transcriptPath)) {
      const transcriptContent = readFileSync(transcriptPath, 'utf8');
      captions = parseTranscript(transcriptContent, transcriptAsset.format);
    }
  }
  
  // Build tracks
  const tracks: Track[] = [];
  
  // Video/Background track
  if (backgroundAsset) {
    tracks.push({
      id: 'track_video',
      type: 'video',
      name: 'Background',
      clips: [{
        id: 'clip_background',
        type: 'background',
        assetRef: backgroundAsset.id,
        startTime: 0,
        duration,
        layer: 0,
        motion: style.motionPreset
      }]
    });
  }
  
  // Voice track
  if (voiceAsset) {
    tracks.push({
      id: 'track_voice',
      type: 'audio',
      name: 'Voice',
      clips: [{
        id: 'clip_voice',
        type: 'voice',
        assetRef: voiceAsset.id,
        startTime: 0,
        duration: voiceAsset.duration ?? duration,
        layer: 10,
        volume: 1.0
      }]
    });
  }
  
  // Music track
  if (musicAsset) {
    tracks.push({
      id: 'track_music',
      type: 'audio',
      name: 'Music',
      clips: [{
        id: 'clip_music',
        type: 'music',
        assetRef: musicAsset.id,
        startTime: 0,
        duration: musicAsset.duration ?? duration,
        layer: 5,
        volume: BACKGROUND_MUSIC_VOLUME
      }],
      volume: BACKGROUND_MUSIC_VOLUME
    });
  }
  
  // Caption track
  if (captions.length > 0) {
    tracks.push({
      id: 'track_captions',
      type: 'caption',
      name: 'Captions',
      clips: [{
        id: 'clip_captions',
        type: 'caption',
        startTime: 0,
        duration,
        layer: 20,
        captions
      }]
    });
  }
  
  // Build initial timeline
  const timeline: Timeline = {
    timelineVersion: TIMELINE_SCHEMA_VERSION,
    episodeId,
    personaCode: manifest.episode.personaCode,
    franchiseId: manifest.episode.franchiseId,
    renderProfile: profile,
    duration,
    frameRate: 30,
    tracks,
    style,
    qcFlags: {
      contentWarnings: [],
      needsHumanReview: false
    },
    createdAt: new Date().toISOString(),
    assetManifestPath: manifestPath
  };
  
  // Run QC checks
  if (!skipQC) {
    timeline.qcFlags = runQCChecks(timeline, captions);
  }
  
  return timeline;
}

/**
 * Validate a timeline structure
 */
export function validateTimeline(timeline: Timeline): TimelineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!timeline.timelineVersion) errors.push('Missing timelineVersion');
  if (!timeline.episodeId) errors.push('Missing episodeId');
  if (!timeline.personaCode) errors.push('Missing personaCode');
  if (!timeline.renderProfile) errors.push('Missing renderProfile');
  if (typeof timeline.duration !== 'number' || timeline.duration <= 0) {
    errors.push('Invalid duration');
  }
  if (!Array.isArray(timeline.tracks)) errors.push('Missing tracks array');
  
  // Track validation
  for (const track of timeline.tracks) {
    if (!track.id) errors.push(`Track missing id`);
    if (!track.type) errors.push(`Track ${track.id} missing type`);
    if (!Array.isArray(track.clips)) errors.push(`Track ${track.id} missing clips array`);
    
    for (const clip of track.clips) {
      if (!clip.id) errors.push(`Clip in track ${track.id} missing id`);
      if (!clip.type) errors.push(`Clip ${clip.id} missing type`);
      if (typeof clip.startTime !== 'number') errors.push(`Clip ${clip.id} missing startTime`);
      if (typeof clip.duration !== 'number' || clip.duration <= 0) {
        warnings.push(`Clip ${clip.id} has invalid duration`);
      }
    }
  }
  
  // QC flags
  if (timeline.qcFlags?.needsHumanReview) {
    warnings.push(`Episode requires human review: ${timeline.qcFlags.reviewReason ?? 'unspecified'}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Save timeline to file
 */
export function saveTimeline(timeline: Timeline, outputPath: string): void {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, JSON.stringify(timeline, null, 2), 'utf8');
  console.log(`[build-timeline] Saved timeline to ${outputPath}`);
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  const getArg = (name: string): string | undefined => {
    const idx = args.indexOf(name);
    if (idx === -1 || idx + 1 >= args.length) return undefined;
    return args[idx + 1];
  };
  
  const episodeId = getArg('--episodeId') ?? getArg('-e');
  const manifestPath = getArg('--manifest') ?? getArg('-m');
  const outputDir = getArg('--output') ?? getArg('-o') ?? join(repoRoot, 'timelines');
  const renderProfile = getArg('--profile') as RenderProfile | undefined;
  const skipQC = args.includes('--skip-qc');
  
  if (!episodeId || !manifestPath) {
    console.log(`
Usage: npx tsx render-stack/builder/build-timeline.ts [options]

Options:
  --episodeId, -e   Episode ID (required)
  --manifest, -m    Path to asset manifest JSON (required)
  --output, -o      Output directory (default: timelines/)
  --profile         Render profile (vertical_1080x1920, horizontal_1920x1080, square_1080x1080)
  --skip-qc         Skip QC validation

Example:
  npx tsx render-stack/builder/build-timeline.ts -e test_001 -m assets/test_001/manifest.json
`);
    process.exit(1);
  }
  
  try {
    console.log(`[build-timeline] Building timeline for episode: ${episodeId}`);
    
    const timeline = await buildTimeline({
      episodeId,
      manifestPath,
      renderProfile,
      skipQC
    });
    
    // Validate
    const validation = validateTimeline(timeline);
    if (!validation.valid) {
      console.error('[build-timeline] Validation errors:', validation.errors);
      process.exit(1);
    }
    if (validation.warnings.length > 0) {
      console.warn('[build-timeline] Warnings:', validation.warnings);
    }
    
    // Save
    const outputPath = join(outputDir, episodeId, 'timeline.json');
    saveTimeline(timeline, outputPath);
    
    console.log(`[build-timeline] Success! Duration: ${timeline.duration}s, Tracks: ${timeline.tracks.length}`);
    if (timeline.qcFlags.needsHumanReview) {
      console.warn(`[build-timeline] ⚠️  Episode requires human review: ${timeline.qcFlags.reviewReason}`);
    }
    
  } catch (error) {
    console.error('[build-timeline] Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.startsWith('file:')) {
  const isDirectRun = process.argv[1]?.includes('build-timeline');
  if (isDirectRun) {
    main();
  }
}
