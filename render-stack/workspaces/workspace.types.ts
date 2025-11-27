/**
 * Workspace Types v1.0.0
 * Defines genre-specific creative pipelines for SL18.
 * 
 * Workspaces allow operators to tailor rendering, styling, and QC rules
 * for different types of content (drama, music, comedy, etc.).
 */

import { 
  PersonaStyle, 
  RenderProfile, 
  TransitionPreset, 
  MotionPreset,
  CaptionPosition 
} from '../types/timeline.types';

/** Supported content genres */
export type ContentGenre = 
  | 'drama'
  | 'music'
  | 'comedy'
  | 'educational'
  | 'documentary'
  | 'news'
  | 'lifestyle'
  | 'gaming'
  | 'custom';

/** Workspace status */
export type WorkspaceStatus = 'active' | 'draft' | 'archived';

/**
 * Genre-specific pacing rules for drama content
 */
export interface DramaPacingRules {
  /** Minimum scene duration in seconds */
  minSceneDuration: number;
  /** Maximum scene duration in seconds */
  maxSceneDuration: number;
  /** Target emotional beats per minute */
  emotionalBeatsPerMinute: number;
  /** Pause duration after dramatic moments (seconds) */
  dramaticPauseDuration: number;
}

/**
 * Genre-specific loudness rules for music content
 */
export interface MusicLoudnessRules {
  /** Target integrated loudness (LUFS) */
  targetLoudness: number;
  /** Maximum true peak (dBTP) */
  maxTruePeak: number;
  /** Loudness range (LU) */
  loudnessRange: number;
  /** Enable loudness normalization */
  normalizeEnabled: boolean;
  /** Beat detection sensitivity (0-1) */
  beatSensitivity: number;
}

/**
 * Genre-specific timing rules for comedy content
 */
export interface ComedyTimingRules {
  /** Pause after punchline (seconds) */
  punchlinePause: number;
  /** Maximum setup duration before punchline (seconds) */
  maxSetupDuration: number;
  /** Minimum time between jokes (seconds) */
  minJokeSpacing: number;
  /** Enable laugh track detection */
  detectLaughTrack: boolean;
}

/**
 * Genre-specific rules for educational content
 */
export interface EducationalRules {
  /** Maximum concept introduction rate (concepts per minute) */
  maxConceptsPerMinute: number;
  /** Minimum explanation duration per concept (seconds) */
  minExplanationDuration: number;
  /** Recap frequency (every N minutes) */
  recapFrequency: number;
  /** Enable visual aid detection */
  detectVisualAids: boolean;
}

/**
 * Genre-specific QC rules based on content type
 */
export interface GenreQCRules {
  /** Drama-specific pacing rules */
  drama?: DramaPacingRules;
  /** Music-specific loudness rules */
  music?: MusicLoudnessRules;
  /** Comedy-specific timing rules */
  comedy?: ComedyTimingRules;
  /** Educational-specific rules */
  educational?: EducationalRules;
  /** Custom rules as key-value pairs */
  custom?: Record<string, number | boolean | string>;
}

/**
 * Caption styling specific to a workspace
 */
export interface WorkspaceCaptionStyle {
  /** Font family */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font weight */
  fontWeight: 'normal' | 'bold' | 'light';
  /** Text color (hex) */
  textColor: string;
  /** Background color with opacity (rgba) */
  backgroundColor: string;
  /** Text shadow enabled */
  textShadow: boolean;
  /** Caption position */
  position: CaptionPosition;
  /** Animation style */
  animation: 'none' | 'fade' | 'typewriter' | 'bounce' | 'slide';
  /** Maximum characters per line */
  maxCharsPerLine: number;
  /** Maximum lines visible */
  maxLines: number;
}

/**
 * Overlay template for workspace-specific visuals
 */
export interface OverlayTemplate {
  /** Template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template type */
  type: 'logo' | 'watermark' | 'lower-third' | 'frame' | 'custom';
  /** Asset path or URL */
  assetPath: string;
  /** Position on screen */
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Opacity (0-1) */
  opacity: number;
  /** When to show the overlay */
  timing: 'always' | 'intro' | 'outro' | 'chapters';
  /** Duration in seconds (if timed) */
  duration?: number;
}

/**
 * Transition configuration for workspace
 */
export interface WorkspaceTransitions {
  /** Default transition between clips */
  defaultTransition: TransitionPreset;
  /** Transition duration in seconds */
  transitionDuration: number;
  /** Scene change transition */
  sceneChangeTransition: TransitionPreset;
  /** Intro transition */
  introTransition: TransitionPreset;
  /** Outro transition */
  outroTransition: TransitionPreset;
}

/**
 * Audio configuration for workspace
 */
export interface WorkspaceAudioConfig {
  /** Background music volume (0-1) */
  musicVolume: number;
  /** Voice/narration volume (0-1) */
  voiceVolume: number;
  /** Sound effects volume (0-1) */
  sfxVolume: number;
  /** Enable auto-ducking (lower music during voice) */
  autoDucking: boolean;
  /** Ducking reduction in dB */
  duckingReduction: number;
  /** Fade in/out duration for music (seconds) */
  musicFadeDuration: number;
}

/**
 * Complete persona template for a workspace
 */
export interface WorkspacePersonaTemplate extends Omit<PersonaStyle, 'personaCode'> {
  /** Template identifier */
  templateId: string;
  /** Template name */
  templateName: string;
  /** Caption styling */
  captionStyle: WorkspaceCaptionStyle;
  /** Overlay templates */
  overlays: OverlayTemplate[];
  /** Transition configuration */
  transitions: WorkspaceTransitions;
  /** Audio configuration */
  audio: WorkspaceAudioConfig;
}

/**
 * Platform-specific export settings
 */
export interface PlatformExportSettings {
  /** Platform identifier */
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  /** Enabled for this workspace */
  enabled: boolean;
  /** Preferred render profile */
  renderProfile: RenderProfile;
  /** Maximum duration in seconds */
  maxDuration: number;
  /** Auto-generate thumbnails */
  autoThumbnails: boolean;
  /** Default hashtags */
  defaultHashtags: string[];
  /** Default description template */
  descriptionTemplate: string;
}

/**
 * QC configuration for a workspace
 */
export interface WorkspaceQCConfig {
  /** Maximum caption length (characters) */
  maxCaptionLength: number;
  /** Maximum short-form duration (seconds) */
  maxShortFormDuration: number;
  /** Maximum long-form duration (seconds) */
  maxLongFormDuration: number;
  /** Warning keywords to flag */
  warningKeywords: string[];
  /** Genre-specific QC rules */
  genreRules: GenreQCRules;
  /** Auto-approve if all checks pass */
  autoApprove: boolean;
  /** Required approvals before publishing */
  requiredApprovals: number;
}

/**
 * The main Workspace document
 */
export interface Workspace {
  /** Unique workspace identifier */
  id: string;
  /** Workspace name */
  name: string;
  /** Description */
  description: string;
  /** Content genre */
  genre: ContentGenre;
  /** Workspace status */
  status: WorkspaceStatus;
  /** Persona templates available in this workspace */
  personaTemplates: WorkspacePersonaTemplate[];
  /** Default persona template ID */
  defaultPersonaTemplateId: string;
  /** Platform export settings */
  platformSettings: PlatformExportSettings[];
  /** QC configuration */
  qcConfig: WorkspaceQCConfig;
  /** Default render profile */
  defaultRenderProfile: RenderProfile;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
  /** Created by user */
  createdBy: string;
  /** Tags for organization */
  tags: string[];
}

/**
 * Create workspace request
 */
export interface CreateWorkspaceRequest {
  /** Workspace name */
  name: string;
  /** Description */
  description: string;
  /** Content genre */
  genre: ContentGenre;
  /** Initial persona templates */
  personaTemplates?: WorkspacePersonaTemplate[];
  /** Platform settings */
  platformSettings?: Partial<PlatformExportSettings>[];
  /** QC configuration */
  qcConfig?: Partial<WorkspaceQCConfig>;
  /** Default render profile */
  defaultRenderProfile?: RenderProfile;
  /** Tags */
  tags?: string[];
}

/**
 * Update workspace request
 */
export interface UpdateWorkspaceRequest {
  /** Workspace name */
  name?: string;
  /** Description */
  description?: string;
  /** Status */
  status?: WorkspaceStatus;
  /** Persona templates */
  personaTemplates?: WorkspacePersonaTemplate[];
  /** Default persona template ID */
  defaultPersonaTemplateId?: string;
  /** Platform settings */
  platformSettings?: PlatformExportSettings[];
  /** QC configuration */
  qcConfig?: Partial<WorkspaceQCConfig>;
  /** Default render profile */
  defaultRenderProfile?: RenderProfile;
  /** Tags */
  tags?: string[];
}

/**
 * Workspace preview request
 */
export interface WorkspacePreviewRequest {
  /** Sample text for caption preview */
  sampleText?: string;
  /** Persona template ID to preview */
  templateId?: string;
  /** Render profile for preview */
  renderProfile?: RenderProfile;
  /** Duration of preview in seconds */
  previewDuration?: number;
}

/**
 * Workspace preview result
 */
export interface WorkspacePreviewResult {
  /** Workspace ID */
  workspaceId: string;
  /** Template used */
  templateId: string;
  /** Preview image URL (if generated) */
  previewImageUrl?: string;
  /** Preview video URL (if generated) */
  previewVideoUrl?: string;
  /** Styled timeline preview data */
  styledTimeline: {
    captionStyle: WorkspaceCaptionStyle;
    overlays: OverlayTemplate[];
    transitions: WorkspaceTransitions;
    sampleCaption: string;
  };
  /** QC rules summary */
  qcRulesSummary: {
    genre: ContentGenre;
    maxCaptionLength: number;
    maxDuration: number;
    warningKeywords: number;
    genreSpecificRules: string[];
  };
}

/**
 * Workspace list filter options
 */
export interface WorkspaceListFilter {
  /** Filter by genre */
  genre?: ContentGenre;
  /** Filter by status */
  status?: WorkspaceStatus;
  /** Filter by tags */
  tags?: string[];
  /** Search by name */
  search?: string;
  /** Pagination offset */
  offset?: number;
  /** Pagination limit */
  limit?: number;
}

/**
 * Workspace list result
 */
export interface WorkspaceListResult {
  /** Workspaces */
  workspaces: Workspace[];
  /** Total count */
  total: number;
  /** Current offset */
  offset: number;
  /** Current limit */
  limit: number;
}

/**
 * Default genre QC rules
 */
export const DEFAULT_GENRE_QC_RULES: Record<ContentGenre, GenreQCRules> = {
  drama: {
    drama: {
      minSceneDuration: 5,
      maxSceneDuration: 120,
      emotionalBeatsPerMinute: 2,
      dramaticPauseDuration: 1.5
    }
  },
  music: {
    music: {
      targetLoudness: -14,
      maxTruePeak: -1,
      loudnessRange: 8,
      normalizeEnabled: true,
      beatSensitivity: 0.7
    }
  },
  comedy: {
    comedy: {
      punchlinePause: 2,
      maxSetupDuration: 30,
      minJokeSpacing: 5,
      detectLaughTrack: true
    }
  },
  educational: {
    educational: {
      maxConceptsPerMinute: 3,
      minExplanationDuration: 10,
      recapFrequency: 5,
      detectVisualAids: true
    }
  },
  documentary: {
    drama: {
      minSceneDuration: 10,
      maxSceneDuration: 180,
      emotionalBeatsPerMinute: 1,
      dramaticPauseDuration: 2
    }
  },
  news: {
    educational: {
      maxConceptsPerMinute: 5,
      minExplanationDuration: 5,
      recapFrequency: 3,
      detectVisualAids: false
    }
  },
  lifestyle: {
    comedy: {
      punchlinePause: 1,
      maxSetupDuration: 45,
      minJokeSpacing: 10,
      detectLaughTrack: false
    }
  },
  gaming: {
    comedy: {
      punchlinePause: 1,
      maxSetupDuration: 20,
      minJokeSpacing: 3,
      detectLaughTrack: false
    }
  },
  custom: {}
};

/**
 * Default workspace QC configuration
 */
export const DEFAULT_WORKSPACE_QC_CONFIG: WorkspaceQCConfig = {
  maxCaptionLength: 150,
  maxShortFormDuration: 180,
  maxLongFormDuration: 600,
  warningKeywords: [],
  genreRules: {},
  autoApprove: false,
  requiredApprovals: 1
};
