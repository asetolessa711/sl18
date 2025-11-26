/**
 * Workspace Manager
 * Handles CRUD operations for creative workspaces.
 */

import { 
  Workspace,
  WorkspaceStatus,
  ContentGenre,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspacePreviewRequest,
  WorkspacePreviewResult,
  WorkspaceListFilter,
  WorkspaceListResult,
  WorkspacePersonaTemplate,
  WorkspaceCaptionStyle,
  WorkspaceTransitions,
  WorkspaceAudioConfig,
  PlatformExportSettings,
  WorkspaceQCConfig,
  DEFAULT_GENRE_QC_RULES,
  DEFAULT_WORKSPACE_QC_CONFIG,
  GenreQCRules
} from './workspace.types';
import { RenderProfile, PersonaStyle } from '../types/timeline.types';

/**
 * In-memory workspace storage
 * In production, this would be backed by a database
 */
const workspaceStore = new Map<string, Workspace>();

/**
 * Generate a unique workspace ID
 */
function generateWorkspaceId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique template ID
 */
function generateTemplateId(): string {
  return `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get default caption style for a genre
 */
function getDefaultCaptionStyle(genre: ContentGenre): WorkspaceCaptionStyle {
  const baseStyle: WorkspaceCaptionStyle = {
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: 'bold',
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textShadow: true,
    position: 'bottom-center',
    animation: 'fade',
    maxCharsPerLine: 40,
    maxLines: 2
  };

  switch (genre) {
    case 'drama':
      return {
        ...baseStyle,
        fontFamily: 'Playfair Display',
        animation: 'fade',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      };
    case 'music':
      return {
        ...baseStyle,
        fontFamily: 'Montserrat',
        animation: 'bounce',
        textColor: '#FFD700',
        fontSize: 56
      };
    case 'comedy':
      return {
        ...baseStyle,
        fontFamily: 'Comic Sans MS',
        animation: 'bounce',
        backgroundColor: 'rgba(255, 0, 0, 0.6)'
      };
    case 'educational':
      return {
        ...baseStyle,
        fontFamily: 'Open Sans',
        animation: 'typewriter',
        fontSize: 42,
        maxCharsPerLine: 50
      };
    case 'news':
      return {
        ...baseStyle,
        fontFamily: 'Roboto',
        animation: 'slide',
        position: 'bottom-center',
        backgroundColor: 'rgba(0, 0, 100, 0.9)'
      };
    default:
      return baseStyle;
  }
}

/**
 * Get default transitions for a genre
 */
function getDefaultTransitions(genre: ContentGenre): WorkspaceTransitions {
  const baseTransitions: WorkspaceTransitions = {
    defaultTransition: 'fade',
    transitionDuration: 0.5,
    sceneChangeTransition: 'crossfade',
    introTransition: 'fade',
    outroTransition: 'fade'
  };

  switch (genre) {
    case 'drama':
      return {
        ...baseTransitions,
        transitionDuration: 1.0,
        sceneChangeTransition: 'crossfade',
        introTransition: 'fade',
        outroTransition: 'fade'
      };
    case 'music':
      return {
        ...baseTransitions,
        transitionDuration: 0.3,
        defaultTransition: 'slide-left',
        sceneChangeTransition: 'zoom-in'
      };
    case 'comedy':
      return {
        ...baseTransitions,
        transitionDuration: 0.2,
        defaultTransition: 'none',
        sceneChangeTransition: 'slide-right'
      };
    case 'educational':
      return {
        ...baseTransitions,
        transitionDuration: 0.5,
        defaultTransition: 'fade',
        sceneChangeTransition: 'fade'
      };
    default:
      return baseTransitions;
  }
}

/**
 * Get default audio config for a genre
 */
function getDefaultAudioConfig(genre: ContentGenre): WorkspaceAudioConfig {
  const baseConfig: WorkspaceAudioConfig = {
    musicVolume: 0.3,
    voiceVolume: 1.0,
    sfxVolume: 0.5,
    autoDucking: true,
    duckingReduction: 10,
    musicFadeDuration: 2
  };

  switch (genre) {
    case 'music':
      return {
        ...baseConfig,
        musicVolume: 0.8,
        voiceVolume: 0.6,
        autoDucking: false
      };
    case 'drama':
      return {
        ...baseConfig,
        musicVolume: 0.2,
        duckingReduction: 15,
        musicFadeDuration: 3
      };
    case 'comedy':
      return {
        ...baseConfig,
        sfxVolume: 0.7,
        musicVolume: 0.2
      };
    default:
      return baseConfig;
  }
}

/**
 * Get default platform settings
 */
function getDefaultPlatformSettings(): PlatformExportSettings[] {
  return [
    {
      platform: 'youtube',
      enabled: true,
      renderProfile: 'horizontal_1920x1080',
      maxDuration: 600,
      autoThumbnails: true,
      defaultHashtags: [],
      descriptionTemplate: '{{title}}\n\n{{description}}\n\n#SL18'
    },
    {
      platform: 'instagram',
      enabled: true,
      renderProfile: 'vertical_1080x1920',
      maxDuration: 90,
      autoThumbnails: true,
      defaultHashtags: ['#reels', '#viral'],
      descriptionTemplate: '{{title}} {{hashtags}}'
    },
    {
      platform: 'tiktok',
      enabled: true,
      renderProfile: 'vertical_1080x1920',
      maxDuration: 180,
      autoThumbnails: false,
      defaultHashtags: ['#fyp', '#foryou'],
      descriptionTemplate: '{{title}} {{hashtags}}'
    },
    {
      platform: 'facebook',
      enabled: true,
      renderProfile: 'horizontal_1920x1080',
      maxDuration: 240,
      autoThumbnails: true,
      defaultHashtags: [],
      descriptionTemplate: '{{title}}\n\n{{description}}'
    }
  ];
}

/**
 * Create a default persona template for a genre
 */
function createDefaultPersonaTemplate(
  genre: ContentGenre,
  name: string
): WorkspacePersonaTemplate {
  return {
    templateId: generateTemplateId(),
    templateName: name,
    primaryColor: '#FF6B35',
    secondaryColor: '#004E89',
    fontFamily: 'Inter',
    captionPosition: 'bottom-center',
    motionPreset: 'subtle-zoom',
    transitionPreset: 'fade',
    defaultRenderProfile: genre === 'music' || genre === 'comedy' 
      ? 'vertical_1080x1920' 
      : 'horizontal_1920x1080',
    captionStyle: getDefaultCaptionStyle(genre),
    overlays: [],
    transitions: getDefaultTransitions(genre),
    audio: getDefaultAudioConfig(genre)
  };
}

/**
 * Create a new workspace
 */
export function createWorkspace(
  request: CreateWorkspaceRequest,
  createdBy: string = 'system'
): Workspace {
  const workspaceId = generateWorkspaceId();
  const now = new Date().toISOString();

  // Create default persona template if none provided
  const personaTemplates = request.personaTemplates?.length 
    ? request.personaTemplates 
    : [createDefaultPersonaTemplate(request.genre, `Default ${request.genre} Template`)];

  // Merge QC config with defaults
  const genreRules = DEFAULT_GENRE_QC_RULES[request.genre] || {};
  const qcConfig: WorkspaceQCConfig = {
    ...DEFAULT_WORKSPACE_QC_CONFIG,
    ...request.qcConfig,
    genreRules: {
      ...genreRules,
      ...request.qcConfig?.genreRules
    }
  };

  // Merge platform settings with defaults
  const defaultPlatforms = getDefaultPlatformSettings();
  const platformSettings = request.platformSettings?.length
    ? defaultPlatforms.map(defaultPlatform => {
        const override = request.platformSettings?.find(
          p => p.platform === defaultPlatform.platform
        );
        return override ? { ...defaultPlatform, ...override } : defaultPlatform;
      })
    : defaultPlatforms;

  const workspace: Workspace = {
    id: workspaceId,
    name: request.name,
    description: request.description,
    genre: request.genre,
    status: 'active',
    personaTemplates,
    defaultPersonaTemplateId: personaTemplates[0].templateId,
    platformSettings,
    qcConfig,
    defaultRenderProfile: request.defaultRenderProfile || 
      (request.genre === 'music' || request.genre === 'comedy' 
        ? 'vertical_1080x1920' 
        : 'horizontal_1920x1080'),
    createdAt: now,
    updatedAt: now,
    createdBy,
    tags: request.tags || []
  };

  workspaceStore.set(workspaceId, workspace);
  return workspace;
}

/**
 * Get a workspace by ID
 */
export function getWorkspace(workspaceId: string): Workspace | null {
  return workspaceStore.get(workspaceId) || null;
}

/**
 * Update a workspace
 */
export function updateWorkspace(
  workspaceId: string,
  request: UpdateWorkspaceRequest
): Workspace | null {
  const workspace = workspaceStore.get(workspaceId);
  if (!workspace) return null;

  const updatedWorkspace: Workspace = {
    ...workspace,
    ...request,
    qcConfig: request.qcConfig 
      ? { ...workspace.qcConfig, ...request.qcConfig }
      : workspace.qcConfig,
    updatedAt: new Date().toISOString()
  };

  workspaceStore.set(workspaceId, updatedWorkspace);
  return updatedWorkspace;
}

/**
 * Delete a workspace
 */
export function deleteWorkspace(workspaceId: string): boolean {
  return workspaceStore.delete(workspaceId);
}

/**
 * List workspaces with filters
 */
export function listWorkspaces(filter: WorkspaceListFilter = {}): WorkspaceListResult {
  let workspaces = Array.from(workspaceStore.values());

  // Apply filters
  if (filter.genre) {
    workspaces = workspaces.filter(w => w.genre === filter.genre);
  }
  if (filter.status) {
    workspaces = workspaces.filter(w => w.status === filter.status);
  }
  if (filter.tags?.length) {
    workspaces = workspaces.filter(w => 
      filter.tags!.some(tag => w.tags.includes(tag))
    );
  }
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    workspaces = workspaces.filter(w => 
      w.name.toLowerCase().includes(searchLower) ||
      w.description.toLowerCase().includes(searchLower)
    );
  }

  const total = workspaces.length;
  const offset = filter.offset || 0;
  const limit = filter.limit || 20;

  workspaces = workspaces.slice(offset, offset + limit);

  return {
    workspaces,
    total,
    offset,
    limit
  };
}

/**
 * Generate a workspace preview
 */
export function generateWorkspacePreview(
  workspaceId: string,
  request: WorkspacePreviewRequest = {}
): WorkspacePreviewResult | null {
  const workspace = workspaceStore.get(workspaceId);
  if (!workspace) return null;

  // Find the template to preview
  const templateId = request.templateId || workspace.defaultPersonaTemplateId;
  const template = workspace.personaTemplates.find(t => t.templateId === templateId);
  if (!template) return null;

  // Get genre-specific rules summary
  const genreSpecificRules: string[] = [];
  const genreRules = workspace.qcConfig.genreRules;
  
  if (genreRules.drama) {
    genreSpecificRules.push(`Scene duration: ${genreRules.drama.minSceneDuration}-${genreRules.drama.maxSceneDuration}s`);
    genreSpecificRules.push(`Emotional beats: ${genreRules.drama.emotionalBeatsPerMinute}/min`);
  }
  if (genreRules.music) {
    genreSpecificRules.push(`Target loudness: ${genreRules.music.targetLoudness} LUFS`);
    genreSpecificRules.push(`Normalization: ${genreRules.music.normalizeEnabled ? 'enabled' : 'disabled'}`);
  }
  if (genreRules.comedy) {
    genreSpecificRules.push(`Punchline pause: ${genreRules.comedy.punchlinePause}s`);
    genreSpecificRules.push(`Max setup: ${genreRules.comedy.maxSetupDuration}s`);
  }
  if (genreRules.educational) {
    genreSpecificRules.push(`Max concepts: ${genreRules.educational.maxConceptsPerMinute}/min`);
    genreSpecificRules.push(`Min explanation: ${genreRules.educational.minExplanationDuration}s`);
  }

  const sampleText = request.sampleText || 'This is a sample caption for preview';

  return {
    workspaceId,
    templateId,
    styledTimeline: {
      captionStyle: template.captionStyle,
      overlays: template.overlays,
      transitions: template.transitions,
      sampleCaption: sampleText
    },
    qcRulesSummary: {
      genre: workspace.genre,
      maxCaptionLength: workspace.qcConfig.maxCaptionLength,
      maxDuration: workspace.qcConfig.maxShortFormDuration,
      warningKeywords: workspace.qcConfig.warningKeywords.length,
      genreSpecificRules
    }
  };
}

/**
 * Add a persona template to a workspace
 */
export function addPersonaTemplate(
  workspaceId: string,
  template: Omit<WorkspacePersonaTemplate, 'templateId'>
): WorkspacePersonaTemplate | null {
  const workspace = workspaceStore.get(workspaceId);
  if (!workspace) return null;

  const newTemplate: WorkspacePersonaTemplate = {
    ...template,
    templateId: generateTemplateId()
  };

  workspace.personaTemplates.push(newTemplate);
  workspace.updatedAt = new Date().toISOString();
  workspaceStore.set(workspaceId, workspace);

  return newTemplate;
}

/**
 * Remove a persona template from a workspace
 */
export function removePersonaTemplate(
  workspaceId: string,
  templateId: string
): boolean {
  const workspace = workspaceStore.get(workspaceId);
  if (!workspace) return false;

  const index = workspace.personaTemplates.findIndex(t => t.templateId === templateId);
  if (index === -1) return false;

  // Don't allow removing the last template
  if (workspace.personaTemplates.length === 1) return false;

  workspace.personaTemplates.splice(index, 1);

  // Update default if needed
  if (workspace.defaultPersonaTemplateId === templateId) {
    workspace.defaultPersonaTemplateId = workspace.personaTemplates[0].templateId;
  }

  workspace.updatedAt = new Date().toISOString();
  workspaceStore.set(workspaceId, workspace);

  return true;
}

/**
 * Clone a workspace
 */
export function cloneWorkspace(
  workspaceId: string,
  newName: string,
  createdBy: string = 'system'
): Workspace | null {
  const workspace = workspaceStore.get(workspaceId);
  if (!workspace) return null;

  const clonedId = generateWorkspaceId();
  const now = new Date().toISOString();

  // Clone templates with new IDs
  const clonedTemplates = workspace.personaTemplates.map(t => ({
    ...t,
    templateId: generateTemplateId()
  }));

  const clonedWorkspace: Workspace = {
    ...workspace,
    id: clonedId,
    name: newName,
    status: 'draft',
    personaTemplates: clonedTemplates,
    defaultPersonaTemplateId: clonedTemplates[0].templateId,
    createdAt: now,
    updatedAt: now,
    createdBy
  };

  workspaceStore.set(clonedId, clonedWorkspace);
  return clonedWorkspace;
}

/**
 * Apply genre QC rules to an episode
 */
export function applyGenreQCRules(
  workspaceId: string,
  episodeData: {
    duration: number;
    captions: Array<{ text: string; duration: number }>;
    sceneDurations?: number[];
    loudnessData?: { integrated: number; truePeak: number };
  }
): { 
  passed: boolean; 
  violations: string[]; 
  warnings: string[];
  genreChecks: Record<string, boolean>;
} {
  const workspace = workspaceStore.get(workspaceId);
  if (!workspace) {
    return { 
      passed: false, 
      violations: ['Workspace not found'], 
      warnings: [],
      genreChecks: {}
    };
  }

  const violations: string[] = [];
  const warnings: string[] = [];
  const genreChecks: Record<string, boolean> = {};
  const rules = workspace.qcConfig.genreRules;

  // Check drama pacing
  if (rules.drama && episodeData.sceneDurations) {
    const { minSceneDuration, maxSceneDuration } = rules.drama;
    const pacingViolations = episodeData.sceneDurations.filter(
      d => d < minSceneDuration || d > maxSceneDuration
    );
    genreChecks['dramaPacing'] = pacingViolations.length === 0;
    if (pacingViolations.length > 0) {
      violations.push(
        `${pacingViolations.length} scene(s) outside pacing range (${minSceneDuration}-${maxSceneDuration}s)`
      );
    }
  }

  // Check music loudness
  if (rules.music && episodeData.loudnessData) {
    const { targetLoudness, maxTruePeak } = rules.music;
    const loudnessOk = Math.abs(episodeData.loudnessData.integrated - targetLoudness) <= 2;
    const truePeakOk = episodeData.loudnessData.truePeak <= maxTruePeak;
    
    genreChecks['musicLoudness'] = loudnessOk;
    genreChecks['musicTruePeak'] = truePeakOk;
    
    if (!loudnessOk) {
      warnings.push(
        `Loudness ${episodeData.loudnessData.integrated} LUFS differs from target ${targetLoudness} LUFS`
      );
    }
    if (!truePeakOk) {
      violations.push(
        `True peak ${episodeData.loudnessData.truePeak} dBTP exceeds max ${maxTruePeak} dBTP`
      );
    }
  }

  // Check comedy timing (simplified - check caption spacing)
  if (rules.comedy) {
    genreChecks['comedyTiming'] = true; // Would require more complex analysis
  }

  // Check educational pacing
  if (rules.educational) {
    const conceptsPerMinute = episodeData.captions.length / (episodeData.duration / 60);
    const withinLimit = conceptsPerMinute <= rules.educational.maxConceptsPerMinute;
    genreChecks['educationalPacing'] = withinLimit;
    if (!withinLimit) {
      warnings.push(
        `Concept rate ${conceptsPerMinute.toFixed(1)}/min exceeds max ${rules.educational.maxConceptsPerMinute}/min`
      );
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
    genreChecks
  };
}

/**
 * Get all workspace IDs
 */
export function getAllWorkspaceIds(): string[] {
  return Array.from(workspaceStore.keys());
}

/**
 * Clear all workspaces (for testing)
 */
export function clearAllWorkspaces(): void {
  workspaceStore.clear();
}

/**
 * Get workspace count
 */
export function getWorkspaceCount(): number {
  return workspaceStore.size;
}

// Export the workspace manager as a namespace
export const WorkspaceManager = {
  create: createWorkspace,
  get: getWorkspace,
  update: updateWorkspace,
  delete: deleteWorkspace,
  list: listWorkspaces,
  preview: generateWorkspacePreview,
  addTemplate: addPersonaTemplate,
  removeTemplate: removePersonaTemplate,
  clone: cloneWorkspace,
  applyQCRules: applyGenreQCRules,
  getAllIds: getAllWorkspaceIds,
  clear: clearAllWorkspaces,
  count: getWorkspaceCount
};
