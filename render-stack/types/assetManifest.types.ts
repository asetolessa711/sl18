/**
 * Asset Manifest Schema
 * Defines the structure for episode assets that feed into the timeline builder.
 * 
 * The manifest describes all media files available for an episode,
 * including audio, video, images, and metadata.
 */

/** Supported asset types */
export type AssetType = 
  | 'voice'       // TTS audio file
  | 'music'       // Background music track
  | 'sfx'         // Sound effect
  | 'background'  // Background image or video
  | 'overlay'     // Overlay image (logo, watermark)
  | 'transcript'  // Caption/transcript file
  | 'script';     // Original script text

/** Audio format types */
export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'm4a' | 'ogg';

/** Video format types */
export type VideoFormat = 'mp4' | 'webm' | 'mov';

/** Image format types */
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp';

/**
 * Metadata for an individual asset
 */
export interface AssetMetadata {
  /** Unique asset identifier */
  id: string;
  /** Asset type */
  type: AssetType;
  /** Relative path from manifest location */
  path: string;
  /** File format */
  format: AudioFormat | VideoFormat | ImageFormat | 'txt' | 'json' | 'srt' | 'vtt';
  /** Duration in seconds (for audio/video) */
  duration?: number;
  /** File size in bytes */
  sizeBytes?: number;
  /** Sample rate for audio */
  sampleRate?: number;
  /** Channels for audio (1 = mono, 2 = stereo) */
  channels?: number;
  /** Width for images/video */
  width?: number;
  /** Height for images/video */
  height?: number;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Episode information in the manifest
 */
export interface EpisodeInfo {
  /** Episode ID (matches Airtable record) */
  episodeId: string;
  /** Episode title/theme */
  title: string;
  /** Persona code */
  personaCode: string;
  /** Franchise ID */
  franchiseId?: string;
  /** Language code (e.g., 'en', 'am') */
  language: string;
  /** Hook/teaser text */
  hook?: string;
  /** Target duration in seconds */
  targetDuration?: number;
  /** Episode date */
  date?: string;
}

/**
 * Generation metadata tracking AI sources
 */
export interface GenerationInfo {
  /** Script generation source (e.g., 'gpt-4', 'manual') */
  scriptSource?: string;
  /** TTS provider (e.g., 'elevenlabs', 'azure') */
  ttsProvider?: string;
  /** Voice ID used for TTS */
  voiceId?: string;
  /** Music generation source (e.g., 'mubert', 'udio', 'stock') */
  musicSource?: string;
  /** Timestamp of generation */
  generatedAt?: string;
}

/**
 * The complete asset manifest for an episode
 */
export interface AssetManifest {
  /** Manifest schema version */
  manifestVersion: string;
  /** Episode information */
  episode: EpisodeInfo;
  /** Generation tracking */
  generation: GenerationInfo;
  /** List of assets */
  assets: AssetMetadata[];
  /** Timestamp when manifest was created */
  createdAt: string;
  /** Timestamp when manifest was last updated */
  updatedAt: string;
}

/** Current manifest schema version */
export const MANIFEST_SCHEMA_VERSION = '1.0.0';

/**
 * Helper to find asset by type
 */
export function findAssetByType(manifest: AssetManifest, type: AssetType): AssetMetadata | undefined {
  return manifest.assets.find(a => a.type === type);
}

/**
 * Helper to find all assets of a type
 */
export function findAssetsByType(manifest: AssetManifest, type: AssetType): AssetMetadata[] {
  return manifest.assets.filter(a => a.type === type);
}

/**
 * Helper to get asset by ID
 */
export function getAssetById(manifest: AssetManifest, id: string): AssetMetadata | undefined {
  return manifest.assets.find(a => a.id === id);
}
