/**
 * AI Integration Types v1.0.0
 * Defines AI-assisted creative and QC capabilities for SL18.
 * 
 * Three operating modes provide configurable autonomy:
 * - Human-Lead: Operators drive, AI suggests
 * - Human-Assisted: AI drafts, operators approve
 * - Fully AI: AI generates, validates, and publishes autonomously
 */

import { ContentGenre } from '../workspaces/workspace.types';
import { QCFlags } from '../types/timeline.types';

/**
 * Operating modes for AI integration
 */
export type AIOperatingMode = 'humanLead' | 'humanAssisted' | 'fullyAI';

/**
 * AI task status
 */
export type AITaskStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'failed';

/**
 * AI confidence level
 */
export type AIConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Mode configuration per workspace or global
 */
export interface AIModeConfig {
  /** Operating mode */
  mode: AIOperatingMode;
  /** Auto-apply threshold for suggestions (0-1, only for humanAssisted) */
  autoApplyThreshold?: number;
  /** Require human review above this risk level */
  humanReviewRiskThreshold?: number;
  /** Enable autonomous publishing (only for fullyAI) */
  autonomousPublishing?: boolean;
  /** Maximum auto-approvals per hour (rate limiting) */
  maxAutoApprovalsPerHour?: number;
  /** Enabled AI features */
  enabledFeatures: AIFeature[];
}

/**
 * Available AI features
 */
export type AIFeature = 
  | 'script_generation'
  | 'styling_suggestions'
  | 'qc_assistance'
  | 'content_moderation'
  | 'engagement_prediction'
  | 'auto_captions'
  | 'thumbnail_generation';

/**
 * AI script generation request
 */
export interface AIScriptRequest {
  /** Episode or content ID */
  contentId: string;
  /** Content genre */
  genre: ContentGenre;
  /** Persona code for styling */
  personaCode: string;
  /** Topic or theme */
  topic: string;
  /** Target duration in seconds */
  targetDuration: number;
  /** Additional context or requirements */
  context?: string;
  /** Workspace ID (for mode config) */
  workspaceId?: string;
  /** Override operating mode */
  modeOverride?: AIOperatingMode;
}

/**
 * AI script generation result
 */
export interface AIScriptResult {
  /** Request ID */
  requestId: string;
  /** Task status */
  status: AITaskStatus;
  /** Generated script */
  script?: {
    /** Full script text */
    text: string;
    /** Scenes/segments */
    segments: AIScriptSegment[];
    /** Estimated duration */
    estimatedDuration: number;
    /** Word count */
    wordCount: number;
  };
  /** AI confidence in the result */
  confidence: AIConfidenceLevel;
  /** Confidence score (0-1) */
  confidenceScore: number;
  /** Suggestions for improvement */
  suggestions: AIScriptSuggestion[];
  /** Whether auto-applied (based on mode) */
  autoApplied: boolean;
  /** Requires human approval */
  requiresApproval: boolean;
  /** Generation timestamp */
  generatedAt: string;
  /** Model used */
  modelUsed: string;
}

/**
 * Script segment
 */
export interface AIScriptSegment {
  /** Segment ID */
  id: string;
  /** Segment type */
  type: 'intro' | 'main' | 'transition' | 'outro' | 'callout';
  /** Segment text */
  text: string;
  /** Duration in seconds */
  duration: number;
  /** Speaker/persona */
  speaker?: string;
  /** Visual notes */
  visualNotes?: string;
  /** Audio cues */
  audioCues?: string[];
}

/**
 * AI suggestion for script improvement
 */
export interface AIScriptSuggestion {
  /** Suggestion ID */
  id: string;
  /** Type of suggestion */
  type: 'pacing' | 'tone' | 'clarity' | 'engagement' | 'structure';
  /** Segment ID (if applicable) */
  segmentId?: string;
  /** Original text */
  original?: string;
  /** Suggested text */
  suggested: string;
  /** Explanation */
  reason: string;
  /** Impact score (0-1) */
  impact: number;
}

/**
 * AI styling suggestion request
 */
export interface AIStylingRequest {
  /** Content ID */
  contentId: string;
  /** Content genre */
  genre: ContentGenre;
  /** Persona code */
  personaCode: string;
  /** Current styling (if any) */
  currentStyling?: any;
  /** Target platform */
  targetPlatform?: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  /** Workspace ID */
  workspaceId?: string;
  /** Override operating mode */
  modeOverride?: AIOperatingMode;
}

/**
 * AI styling suggestion result
 */
export interface AIStylingResult {
  /** Request ID */
  requestId: string;
  /** Task status */
  status: AITaskStatus;
  /** Suggested styling */
  styling?: {
    /** Caption style */
    captions: AICaptionStyling;
    /** Color palette */
    colors: AIColorPalette;
    /** Typography */
    typography: AITypography;
    /** Transitions */
    transitions: AITransitionSuggestions;
    /** Overlays */
    overlays: AIOverlaySuggestions;
  };
  /** Confidence */
  confidence: AIConfidenceLevel;
  /** Confidence score */
  confidenceScore: number;
  /** Pre-applied (based on mode) */
  preApplied: boolean;
  /** Requires confirmation */
  requiresConfirmation: boolean;
  /** Generated at */
  generatedAt: string;
}

/**
 * AI caption styling
 */
export interface AICaptionStyling {
  /** Recommended font */
  fontFamily: string;
  /** Font size */
  fontSize: number;
  /** Font weight */
  fontWeight: 'normal' | 'bold' | 'light';
  /** Text color */
  textColor: string;
  /** Background color */
  backgroundColor: string;
  /** Position */
  position: 'bottom' | 'top' | 'center';
  /** Animation */
  animation: 'none' | 'fade' | 'typewriter' | 'bounce';
  /** Reasoning */
  reasoning: string;
}

/**
 * AI color palette
 */
export interface AIColorPalette {
  /** Primary color */
  primary: string;
  /** Secondary color */
  secondary: string;
  /** Accent color */
  accent: string;
  /** Background color */
  background: string;
  /** Text color */
  text: string;
  /** Palette name */
  paletteName: string;
  /** Reasoning */
  reasoning: string;
}

/**
 * AI typography suggestions
 */
export interface AITypography {
  /** Heading font */
  headingFont: string;
  /** Body font */
  bodyFont: string;
  /** Accent font */
  accentFont?: string;
  /** Font pairing reasoning */
  reasoning: string;
}

/**
 * AI transition suggestions
 */
export interface AITransitionSuggestions {
  /** Default transition */
  defaultTransition: string;
  /** Scene change transition */
  sceneChangeTransition: string;
  /** Transition duration */
  transitionDuration: number;
  /** Reasoning */
  reasoning: string;
}

/**
 * AI overlay suggestions
 */
export interface AIOverlaySuggestions {
  /** Suggested overlays */
  overlays: {
    type: 'logo' | 'watermark' | 'lower-third' | 'frame';
    position: { x: number; y: number };
    timing: 'always' | 'intro' | 'outro';
    opacity: number;
  }[];
  /** Reasoning */
  reasoning: string;
}

/**
 * AI QC assistance request
 */
export interface AIQCRequest {
  /** Content ID */
  contentId: string;
  /** Content genre */
  genre: ContentGenre;
  /** Timeline data */
  timeline: any;
  /** Existing QC flags */
  existingFlags?: QCFlags;
  /** Workspace ID */
  workspaceId?: string;
  /** Override operating mode */
  modeOverride?: AIOperatingMode;
}

/**
 * AI QC check result
 */
export interface AIQCResult {
  /** Request ID */
  requestId: string;
  /** Task status */
  status: AITaskStatus;
  /** Overall QC pass/fail */
  passed: boolean;
  /** QC score (0-100) */
  score: number;
  /** Issues found */
  issues: AIQCIssue[];
  /** Recommended fixes */
  recommendedFixes: AIQCFix[];
  /** Auto-enforced (for fullyAI mode) */
  autoEnforced: boolean;
  /** Requires human decision */
  requiresHumanDecision: boolean;
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Checked at */
  checkedAt: string;
}

/**
 * AI QC issue
 */
export interface AIQCIssue {
  /** Issue ID */
  id: string;
  /** Issue type */
  type: 'caption_length' | 'pacing' | 'loudness' | 'timing' | 'content' | 'technical';
  /** Severity */
  severity: 'warning' | 'error' | 'critical';
  /** Description */
  description: string;
  /** Location in timeline */
  location?: {
    startTime: number;
    endTime?: number;
    segmentId?: string;
  };
  /** Can be auto-fixed */
  autoFixable: boolean;
}

/**
 * AI QC fix recommendation
 */
export interface AIQCFix {
  /** Fix ID */
  id: string;
  /** Related issue ID */
  issueId: string;
  /** Fix type */
  type: 'automatic' | 'suggested';
  /** Fix description */
  description: string;
  /** Fix action (machine-readable) */
  action: {
    operation: string;
    parameters: Record<string, any>;
  };
  /** Confidence in fix */
  confidence: AIConfidenceLevel;
  /** Applied automatically */
  applied: boolean;
}

/**
 * AI task for tracking
 */
export interface AITask {
  /** Task ID */
  id: string;
  /** Task type */
  type: 'script' | 'styling' | 'qc' | 'moderation' | 'thumbnail';
  /** Content ID */
  contentId: string;
  /** Workspace ID */
  workspaceId?: string;
  /** Operating mode used */
  mode: AIOperatingMode;
  /** Status */
  status: AITaskStatus;
  /** Created at */
  createdAt: string;
  /** Updated at */
  updatedAt: string;
  /** Completed at */
  completedAt?: string;
  /** Approved by */
  approvedBy?: string;
  /** Approved at */
  approvedAt?: string;
  /** Rejected reason */
  rejectedReason?: string;
  /** Result data */
  result?: any;
  /** Error message */
  error?: string;
}

/**
 * AI audit log entry
 */
export interface AIAuditEntry {
  /** Entry ID */
  id: string;
  /** Task ID */
  taskId: string;
  /** Action */
  action: 'created' | 'processing' | 'completed' | 'approved' | 'rejected' | 'auto_applied' | 'error';
  /** Actor (user or 'system') */
  actor: string;
  /** Timestamp */
  timestamp: string;
  /** Details */
  details?: Record<string, any>;
}

/**
 * Mode behavior descriptions
 */
export const MODE_BEHAVIORS = {
  humanLead: {
    name: 'Human-Lead',
    description: 'Operators drive all decisions. AI provides suggestions only.',
    scriptBehavior: 'AI suggests scripts, operator edits and applies manually.',
    stylingBehavior: 'AI provides styling suggestions for review only.',
    qcBehavior: 'AI flags issues, operator decides on all fixes.',
    publishingBehavior: 'Manual publish/export only.'
  },
  humanAssisted: {
    name: 'Human-Assisted',
    description: 'AI drafts content, operators approve before application.',
    scriptBehavior: 'AI drafts complete scripts, operator reviews and approves.',
    stylingBehavior: 'AI pre-applies high-confidence styling, operator confirms.',
    qcBehavior: 'AI flags issues and recommends fixes, operator approves.',
    publishingBehavior: 'One-click publish after AI preparation and approval.'
  },
  fullyAI: {
    name: 'Fully AI',
    description: 'AI generates, validates, and publishes autonomously.',
    scriptBehavior: 'AI drafts and auto-applies scripts.',
    stylingBehavior: 'AI auto-applies styling based on genre and persona.',
    qcBehavior: 'AI enforces QC pass/fail autonomously.',
    publishingBehavior: 'Auto-publish to supported platforms (where APIs allow).'
  }
} as const;

/**
 * Default mode configuration
 */
export const DEFAULT_AI_MODE_CONFIG: AIModeConfig = {
  mode: 'humanAssisted',
  autoApplyThreshold: 0.85,
  humanReviewRiskThreshold: 0.3,
  autonomousPublishing: false,
  maxAutoApprovalsPerHour: 50,
  enabledFeatures: [
    'script_generation',
    'styling_suggestions',
    'qc_assistance',
    'auto_captions'
  ]
};

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  /** Provider name */
  provider: 'openai' | 'anthropic' | 'local';
  /** Model identifier */
  model: string;
  /** API key environment variable */
  apiKeyEnvVar: string;
  /** Max tokens per request */
  maxTokens: number;
  /** Temperature for generation */
  temperature: number;
}

/**
 * Default AI provider
 */
export const DEFAULT_AI_PROVIDER: AIProviderConfig = {
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  apiKeyEnvVar: 'OPENAI_API_KEY',
  maxTokens: 4096,
  temperature: 0.7
};
