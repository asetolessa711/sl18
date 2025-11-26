/**
 * Timeline Schema v1.0.0
 * Defines the contract between AI generation layer and the renderer.
 * 
 * The Timeline represents a complete episode structure with tracks,
 * clips, captions, and styling tokens that the render worker consumes.
 */

/** Schema version for compatibility checking */
export const TIMELINE_SCHEMA_VERSION = '1.0.0';

/** Supported render profiles (aspect ratios) */
export type RenderProfile = 
  | 'vertical_1080x1920'   // 9:16 (TikTok, Reels, Shorts)
  | 'horizontal_1920x1080' // 16:9 (YouTube standard)
  | 'square_1080x1080';    // 1:1 (Instagram feed)

/** Track types in the timeline */
export type TrackType = 'video' | 'audio' | 'caption' | 'overlay';

/** Supported clip types */
export type ClipType = 
  | 'background'  // Static or video background
  | 'voice'       // TTS audio
  | 'music'       // Background music
  | 'sfx'         // Sound effects
  | 'caption'     // Text overlay/subtitle
  | 'image'       // Static image overlay
  | 'transition'; // Transition effect

/** Caption positioning options */
export type CaptionPosition = 
  | 'bottom-center'
  | 'top-center'
  | 'middle-center'
  | 'bottom-left'
  | 'bottom-right';

/** Transition presets */
export type TransitionPreset = 
  | 'none'
  | 'fade'
  | 'crossfade'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out';

/** Motion presets for elements */
export type MotionPreset = 
  | 'none'
  | 'subtle-zoom'
  | 'ken-burns'
  | 'parallax';

/**
 * A single caption segment with timing information
 */
export interface CaptionSegment {
  /** Unique identifier for this segment */
  id: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** The text content */
  text: string;
  /** Optional speaker identifier */
  speaker?: string;
  /** Word-level timing for advanced rendering */
  words?: CaptionWord[];
}

/**
 * Word-level timing for karaoke-style captions
 */
export interface CaptionWord {
  /** The word text */
  word: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
}

/**
 * A clip represents a single media element on a track
 */
export interface Clip {
  /** Unique identifier for this clip */
  id: string;
  /** Type of clip */
  type: ClipType;
  /** Reference to asset in manifest (assetId from AssetManifest) */
  assetRef?: string;
  /** Start time on the timeline in seconds */
  startTime: number;
  /** Duration in seconds */
  duration: number;
  /** Layer/z-index (higher = on top) */
  layer: number;
  /** Volume level for audio clips (0.0 - 1.0) */
  volume?: number;
  /** Caption segments for caption clips */
  captions?: CaptionSegment[];
  /** Transition in effect */
  transitionIn?: TransitionPreset;
  /** Transition out effect */
  transitionOut?: TransitionPreset;
  /** Motion preset for visual elements */
  motion?: MotionPreset;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * A track contains clips of the same type
 */
export interface Track {
  /** Unique identifier for this track */
  id: string;
  /** Track type */
  type: TrackType;
  /** Human-readable name */
  name: string;
  /** Clips on this track */
  clips: Clip[];
  /** Track-level volume (multiplier) */
  volume?: number;
  /** Whether track is muted */
  muted?: boolean;
}

/**
 * Persona styling tokens applied during rendering
 */
export interface PersonaStyle {
  /** Persona code reference */
  personaCode: string;
  /** Primary brand color (hex) */
  primaryColor: string;
  /** Secondary accent color (hex) */
  secondaryColor: string;
  /** Font family for captions */
  fontFamily: string;
  /** Caption position preference */
  captionPosition: CaptionPosition;
  /** Motion preset for backgrounds */
  motionPreset: MotionPreset;
  /** Transition preset between scenes */
  transitionPreset: TransitionPreset;
  /** Default render profile for this persona */
  defaultRenderProfile?: RenderProfile;
}

/**
 * QC flags for governance and review
 */
export interface QCFlags {
  /** Content warnings (e.g., "mature themes", "cultural reference") */
  contentWarnings: string[];
  /** Whether this episode requires human review before publish */
  needsHumanReview: boolean;
  /** Reason for requiring human review */
  reviewReason?: string;
  /** Maximum caption length exceeded */
  captionLengthExceeded?: boolean;
  /** Duration exceeds platform limits */
  durationExceeded?: boolean;
  /** Additional QC notes */
  notes?: string[];
}

/**
 * The main Timeline document that the render worker consumes
 */
export interface Timeline {
  /** Schema version for compatibility checking */
  timelineVersion: string;
  /** Unique episode identifier */
  episodeId: string;
  /** Persona code for styling lookup */
  personaCode: string;
  /** Franchise identifier */
  franchiseId?: string;
  /** Render profile (aspect ratio) */
  renderProfile: RenderProfile;
  /** Total duration in seconds */
  duration: number;
  /** Output frame rate */
  frameRate: number;
  /** Tracks containing clips */
  tracks: Track[];
  /** Persona styling tokens */
  style: PersonaStyle;
  /** QC flags for governance */
  qcFlags: QCFlags;
  /** Timestamp when timeline was built */
  createdAt: string;
  /** Human-readable notes for debugging */
  notes?: string;
  /** Reference to asset manifest */
  assetManifestPath?: string;
}

/**
 * Timeline build options
 */
export interface TimelineBuildOptions {
  /** Episode ID to build timeline for */
  episodeId: string;
  /** Path to asset manifest */
  manifestPath: string;
  /** Override render profile */
  renderProfile?: RenderProfile;
  /** Override persona style */
  personaOverride?: Partial<PersonaStyle>;
  /** Skip QC validation */
  skipQC?: boolean;
}

/**
 * Result of timeline validation
 */
export interface TimelineValidationResult {
  /** Whether timeline is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}
