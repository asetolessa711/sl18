/**
 * AI Manager v1.0.0
 * Central manager for AI integration with operating mode support.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AIOperatingMode,
  AIModeConfig,
  AITask,
  AITaskStatus,
  AIAuditEntry,
  AIScriptRequest,
  AIScriptResult,
  AIScriptSegment,
  AIScriptSuggestion,
  AIStylingRequest,
  AIStylingResult,
  AIQCRequest,
  AIQCResult,
  AIQCIssue,
  AIQCFix,
  AIConfidenceLevel,
  DEFAULT_AI_MODE_CONFIG,
  MODE_BEHAVIORS
} from './ai.types';
import { ContentGenre, DEFAULT_GENRE_QC_RULES } from '../workspaces/workspace.types';

/**
 * In-memory storage for AI tasks and audit log
 */
const aiTasks: Map<string, AITask> = new Map();
const auditLog: AIAuditEntry[] = [];
const modeConfigs: Map<string, AIModeConfig> = new Map();

/**
 * Get mode configuration for a workspace or global default
 */
export function getModeConfig(workspaceId?: string): AIModeConfig {
  if (workspaceId && modeConfigs.has(workspaceId)) {
    return modeConfigs.get(workspaceId)!;
  }
  if (modeConfigs.has('global')) {
    return modeConfigs.get('global')!;
  }
  return { ...DEFAULT_AI_MODE_CONFIG };
}

/**
 * Set mode configuration for a workspace
 */
export function setModeConfig(workspaceId: string, config: Partial<AIModeConfig>): AIModeConfig {
  const existing = getModeConfig(workspaceId);
  const updated: AIModeConfig = {
    ...existing,
    ...config,
    enabledFeatures: config.enabledFeatures ?? existing.enabledFeatures
  };
  modeConfigs.set(workspaceId, updated);
  return updated;
}

/**
 * Get global mode configuration
 */
export function getGlobalModeConfig(): AIModeConfig {
  return getModeConfig('global');
}

/**
 * Set global mode configuration
 */
export function setGlobalModeConfig(config: Partial<AIModeConfig>): AIModeConfig {
  return setModeConfig('global', config);
}

/**
 * Add audit log entry
 */
function addAuditEntry(taskId: string, action: AIAuditEntry['action'], actor: string, details?: Record<string, any>): void {
  const entry: AIAuditEntry = {
    id: uuidv4(),
    taskId,
    action,
    actor,
    timestamp: new Date().toISOString(),
    details
  };
  auditLog.push(entry);
  
  // Keep audit log to last 1000 entries
  if (auditLog.length > 1000) {
    auditLog.splice(0, auditLog.length - 1000);
  }
}

/**
 * Create an AI task
 */
function createTask(type: AITask['type'], contentId: string, workspaceId: string | undefined, mode: AIOperatingMode): AITask {
  const now = new Date().toISOString();
  const task: AITask = {
    id: uuidv4(),
    type,
    contentId,
    workspaceId,
    mode,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };
  aiTasks.set(task.id, task);
  addAuditEntry(task.id, 'created', 'system', { type, contentId, mode });
  return task;
}

/**
 * Update task status
 */
function updateTaskStatus(taskId: string, status: AITaskStatus, result?: any, error?: string): AITask | null {
  const task = aiTasks.get(taskId);
  if (!task) return null;
  
  task.status = status;
  task.updatedAt = new Date().toISOString();
  if (result) task.result = result;
  if (error) task.error = error;
  if (status === 'completed' || status === 'approved' || status === 'rejected' || status === 'failed') {
    task.completedAt = task.updatedAt;
  }
  
  return task;
}

/**
 * Convert confidence score to level
 */
function scoreToConfidenceLevel(score: number): AIConfidenceLevel {
  if (score >= 0.9) return 'very_high';
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

/**
 * Determine behavior based on mode
 */
function determineBehavior(mode: AIOperatingMode, confidenceScore: number, config: AIModeConfig): {
  autoApply: boolean;
  requiresApproval: boolean;
} {
  switch (mode) {
    case 'humanLead':
      return { autoApply: false, requiresApproval: true };
    case 'humanAssisted':
      const threshold = config.autoApplyThreshold ?? 0.85;
      return {
        autoApply: confidenceScore >= threshold,
        requiresApproval: confidenceScore < threshold
      };
    case 'fullyAI':
      return { autoApply: true, requiresApproval: false };
    default:
      return { autoApply: false, requiresApproval: true };
  }
}

/**
 * Generate AI script
 * This is a mock implementation - in production, this would call an LLM API
 */
export async function generateScript(request: AIScriptRequest): Promise<AIScriptResult> {
  const config = getModeConfig(request.workspaceId);
  const mode = request.modeOverride ?? config.mode;
  const task = createTask('script', request.contentId, request.workspaceId, mode);
  
  addAuditEntry(task.id, 'processing', 'system', { request });
  updateTaskStatus(task.id, 'processing');
  
  // Mock AI generation - in production, call OpenAI/Anthropic API
  const segments: AIScriptSegment[] = [
    {
      id: uuidv4(),
      type: 'intro',
      text: `Welcome to today's ${request.genre} content about ${request.topic}!`,
      duration: 5,
      speaker: request.personaCode,
      visualNotes: 'Title card with persona branding',
      audioCues: ['intro_music', 'sound_effect']
    },
    {
      id: uuidv4(),
      type: 'main',
      text: `Let me share some insights about ${request.topic}. This is the main content section where we dive deep into the subject matter.`,
      duration: request.targetDuration * 0.7,
      speaker: request.personaCode,
      visualNotes: 'B-roll footage, graphics as needed'
    },
    {
      id: uuidv4(),
      type: 'callout',
      text: 'Key takeaway: Remember this important point!',
      duration: 8,
      speaker: request.personaCode,
      visualNotes: 'Highlight graphic'
    },
    {
      id: uuidv4(),
      type: 'outro',
      text: 'Thanks for watching! Like and subscribe for more content.',
      duration: 5,
      speaker: request.personaCode,
      visualNotes: 'End card with social links',
      audioCues: ['outro_music']
    }
  ];
  
  const suggestions: AIScriptSuggestion[] = [
    {
      id: uuidv4(),
      type: 'engagement',
      segmentId: segments[1].id,
      suggested: 'Add a question to increase viewer engagement',
      reason: 'Questions increase comment engagement by 40%',
      impact: 0.7
    },
    {
      id: uuidv4(),
      type: 'pacing',
      suggested: 'Consider adding a mid-roll hook at the 30% mark',
      reason: 'Improves retention for longer content',
      impact: 0.5
    }
  ];
  
  const confidenceScore = 0.82;
  const behavior = determineBehavior(mode, confidenceScore, config);
  
  const result: AIScriptResult = {
    requestId: task.id,
    status: behavior.autoApply ? 'completed' : 'awaiting_approval',
    script: {
      text: segments.map(s => s.text).join('\n\n'),
      segments,
      estimatedDuration: segments.reduce((sum, s) => sum + s.duration, 0),
      wordCount: segments.map(s => s.text).join(' ').split(/\s+/).length
    },
    confidence: scoreToConfidenceLevel(confidenceScore),
    confidenceScore,
    suggestions,
    autoApplied: behavior.autoApply,
    requiresApproval: behavior.requiresApproval,
    generatedAt: new Date().toISOString(),
    modelUsed: 'gpt-4-turbo-preview (mock)'
  };
  
  updateTaskStatus(task.id, result.status, result);
  addAuditEntry(task.id, behavior.autoApply ? 'auto_applied' : 'completed', 'system', {
    confidence: result.confidence,
    autoApplied: behavior.autoApply
  });
  
  return result;
}

/**
 * Generate AI styling suggestions
 */
export async function generateStyling(request: AIStylingRequest): Promise<AIStylingResult> {
  const config = getModeConfig(request.workspaceId);
  const mode = request.modeOverride ?? config.mode;
  const task = createTask('styling', request.contentId, request.workspaceId, mode);
  
  addAuditEntry(task.id, 'processing', 'system', { request });
  updateTaskStatus(task.id, 'processing');
  
  // Mock AI styling generation
  const genreColors: Record<ContentGenre, { primary: string; secondary: string; accent: string }> = {
    drama: { primary: '#8B0000', secondary: '#2F4F4F', accent: '#FFD700' },
    music: { primary: '#1E90FF', secondary: '#FF1493', accent: '#00FF7F' },
    comedy: { primary: '#FF6347', secondary: '#FFD700', accent: '#00CED1' },
    educational: { primary: '#4169E1', secondary: '#32CD32', accent: '#FF8C00' },
    documentary: { primary: '#2E8B57', secondary: '#8B4513', accent: '#DAA520' },
    news: { primary: '#DC143C', secondary: '#191970', accent: '#FFFFFF' },
    lifestyle: { primary: '#FF69B4', secondary: '#98FB98', accent: '#DDA0DD' },
    gaming: { primary: '#9400D3', secondary: '#00FF00', accent: '#FF4500' },
    custom: { primary: '#333333', secondary: '#666666', accent: '#999999' }
  };
  
  const colors = genreColors[request.genre] ?? genreColors.custom;
  
  const confidenceScore = 0.88;
  const behavior = determineBehavior(mode, confidenceScore, config);
  
  const result: AIStylingResult = {
    requestId: task.id,
    status: behavior.autoApply ? 'completed' : 'awaiting_approval',
    styling: {
      captions: {
        fontFamily: request.genre === 'comedy' ? 'Comic Sans MS' : 'Inter',
        fontSize: 24,
        fontWeight: 'bold',
        textColor: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        position: 'bottom',
        animation: request.genre === 'comedy' ? 'bounce' : 'fade',
        reasoning: `${request.genre} content benefits from ${request.genre === 'comedy' ? 'playful' : 'clean'} caption styling`
      },
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        background: '#000000',
        text: '#FFFFFF',
        paletteName: `${request.genre.charAt(0).toUpperCase() + request.genre.slice(1)} Standard`,
        reasoning: `Colors optimized for ${request.genre} content engagement`
      },
      typography: {
        headingFont: 'Montserrat',
        bodyFont: 'Open Sans',
        accentFont: 'Roboto Mono',
        reasoning: 'Professional font pairing for broad platform compatibility'
      },
      transitions: {
        defaultTransition: request.genre === 'drama' ? 'dissolve' : 'cut',
        sceneChangeTransition: 'fade',
        transitionDuration: request.genre === 'drama' ? 1.5 : 0.5,
        reasoning: `${request.genre} pacing prefers ${request.genre === 'drama' ? 'smooth' : 'quick'} transitions`
      },
      overlays: {
        overlays: [
          { type: 'watermark', position: { x: 0.95, y: 0.05 }, timing: 'always', opacity: 0.3 },
          { type: 'lower-third', position: { x: 0.05, y: 0.85 }, timing: 'intro', opacity: 1 }
        ],
        reasoning: 'Standard overlay placement for brand visibility'
      }
    },
    confidence: scoreToConfidenceLevel(confidenceScore),
    confidenceScore,
    preApplied: behavior.autoApply && mode !== 'humanLead',
    requiresConfirmation: mode === 'humanAssisted' || mode === 'humanLead',
    generatedAt: new Date().toISOString()
  };
  
  updateTaskStatus(task.id, result.status, result);
  addAuditEntry(task.id, behavior.autoApply ? 'auto_applied' : 'completed', 'system', {
    confidence: result.confidence,
    preApplied: result.preApplied
  });
  
  return result;
}

/**
 * Perform AI QC check
 */
export async function performQCCheck(request: AIQCRequest): Promise<AIQCResult> {
  const config = getModeConfig(request.workspaceId);
  const mode = request.modeOverride ?? config.mode;
  const task = createTask('qc', request.contentId, request.workspaceId, mode);
  
  addAuditEntry(task.id, 'processing', 'system', { request });
  updateTaskStatus(task.id, 'processing');
  
  // Mock QC analysis
  const issues: AIQCIssue[] = [];
  const fixes: AIQCFix[] = [];
  
  // Simulate finding issues based on genre rules
  const genreRules = DEFAULT_GENRE_QC_RULES[request.genre];
  
  // Example: Check caption length
  if (request.timeline?.captions) {
    for (const caption of request.timeline.captions) {
      if (caption.text && caption.text.length > 150) {
        const issue: AIQCIssue = {
          id: uuidv4(),
          type: 'caption_length',
          severity: 'warning',
          description: `Caption exceeds 150 characters (${caption.text.length} chars)`,
          location: { startTime: caption.startTime, endTime: caption.endTime },
          autoFixable: true
        };
        issues.push(issue);
        
        fixes.push({
          id: uuidv4(),
          issueId: issue.id,
          type: mode === 'fullyAI' ? 'automatic' : 'suggested',
          description: 'Split long caption into shorter segments',
          action: {
            operation: 'split_caption',
            parameters: { captionId: caption.id, maxLength: 150 }
          },
          confidence: 'high',
          applied: mode === 'fullyAI'
        });
      }
    }
  }
  
  // Example: Check pacing for drama
  if (request.genre === 'drama' && genreRules?.drama) {
    const issue: AIQCIssue = {
      id: uuidv4(),
      type: 'pacing',
      severity: 'warning',
      description: 'Consider adding dramatic pauses for emotional impact',
      autoFixable: false
    };
    issues.push(issue);
  }
  
  const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 15));
  const passed = score >= 70;
  const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical';
  
  const autoEnforce = mode === 'fullyAI';
  const requiresHuman = mode === 'humanLead' || (mode === 'humanAssisted' && riskLevel !== 'low');
  
  const result: AIQCResult = {
    requestId: task.id,
    status: autoEnforce ? 'completed' : 'awaiting_approval',
    passed,
    score,
    issues,
    recommendedFixes: fixes,
    autoEnforced: autoEnforce,
    requiresHumanDecision: requiresHuman,
    riskLevel,
    checkedAt: new Date().toISOString()
  };
  
  updateTaskStatus(task.id, result.status, result);
  addAuditEntry(task.id, autoEnforce ? 'auto_applied' : 'completed', 'system', {
    passed,
    score,
    issueCount: issues.length,
    autoEnforced: autoEnforce
  });
  
  return result;
}

/**
 * Approve an AI task
 */
export function approveTask(taskId: string, approvedBy: string): AITask | null {
  const task = aiTasks.get(taskId);
  if (!task || task.status !== 'awaiting_approval') return null;
  
  const now = new Date().toISOString();
  task.status = 'approved';
  task.approvedBy = approvedBy;
  task.approvedAt = now;
  task.updatedAt = now;
  task.completedAt = now;
  
  addAuditEntry(taskId, 'approved', approvedBy);
  return task;
}

/**
 * Reject an AI task
 */
export function rejectTask(taskId: string, rejectedBy: string, reason: string): AITask | null {
  const task = aiTasks.get(taskId);
  if (!task || task.status !== 'awaiting_approval') return null;
  
  const now = new Date().toISOString();
  task.status = 'rejected';
  task.rejectedReason = reason;
  task.updatedAt = now;
  task.completedAt = now;
  
  addAuditEntry(taskId, 'rejected', rejectedBy, { reason });
  return task;
}

/**
 * Get a task by ID
 */
export function getTask(taskId: string): AITask | null {
  return aiTasks.get(taskId) ?? null;
}

/**
 * List tasks with optional filters
 */
export function listTasks(filters?: {
  contentId?: string;
  workspaceId?: string;
  type?: AITask['type'];
  status?: AITaskStatus;
  mode?: AIOperatingMode;
  limit?: number;
  offset?: number;
}): { tasks: AITask[]; total: number } {
  let tasks = Array.from(aiTasks.values());
  
  if (filters?.contentId) {
    tasks = tasks.filter(t => t.contentId === filters.contentId);
  }
  if (filters?.workspaceId) {
    tasks = tasks.filter(t => t.workspaceId === filters.workspaceId);
  }
  if (filters?.type) {
    tasks = tasks.filter(t => t.type === filters.type);
  }
  if (filters?.status) {
    tasks = tasks.filter(t => t.status === filters.status);
  }
  if (filters?.mode) {
    tasks = tasks.filter(t => t.mode === filters.mode);
  }
  
  tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  
  const total = tasks.length;
  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? 50;
  
  return {
    tasks: tasks.slice(offset, offset + limit),
    total
  };
}

/**
 * Get audit log entries
 */
export function getAuditLog(filters?: {
  taskId?: string;
  action?: AIAuditEntry['action'];
  actor?: string;
  limit?: number;
}): AIAuditEntry[] {
  let entries = [...auditLog];
  
  if (filters?.taskId) {
    entries = entries.filter(e => e.taskId === filters.taskId);
  }
  if (filters?.action) {
    entries = entries.filter(e => e.action === filters.action);
  }
  if (filters?.actor) {
    entries = entries.filter(e => e.actor === filters.actor);
  }
  
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return entries.slice(0, filters?.limit ?? 100);
}

/**
 * Get mode behavior description
 */
export function getModeBehavior(mode: AIOperatingMode): typeof MODE_BEHAVIORS[AIOperatingMode] {
  return MODE_BEHAVIORS[mode];
}

/**
 * Get available modes
 */
export function getAvailableModes(): { mode: AIOperatingMode; behavior: typeof MODE_BEHAVIORS[AIOperatingMode] }[] {
  return [
    { mode: 'humanLead', behavior: MODE_BEHAVIORS.humanLead },
    { mode: 'humanAssisted', behavior: MODE_BEHAVIORS.humanAssisted },
    { mode: 'fullyAI', behavior: MODE_BEHAVIORS.fullyAI }
  ];
}

/**
 * Get AI integration statistics
 */
export function getAIStats(): {
  totalTasks: number;
  byStatus: Record<AITaskStatus, number>;
  byType: Record<string, number>;
  byMode: Record<AIOperatingMode, number>;
  autoApprovalRate: number;
  averageConfidence: number;
} {
  const tasks = Array.from(aiTasks.values());
  
  const byStatus: Record<AITaskStatus, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    awaiting_approval: 0,
    approved: 0,
    rejected: 0,
    failed: 0
  };
  
  const byType: Record<string, number> = {};
  const byMode: Record<AIOperatingMode, number> = {
    humanLead: 0,
    humanAssisted: 0,
    fullyAI: 0
  };
  
  let autoApplied = 0;
  let totalConfidence = 0;
  let confidenceCount = 0;
  
  for (const task of tasks) {
    byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
    byType[task.type] = (byType[task.type] ?? 0) + 1;
    byMode[task.mode] = (byMode[task.mode] ?? 0) + 1;
    
    if (task.result?.autoApplied || task.result?.autoEnforced || task.result?.preApplied) {
      autoApplied++;
    }
    if (task.result?.confidenceScore) {
      totalConfidence += task.result.confidenceScore;
      confidenceCount++;
    }
  }
  
  return {
    totalTasks: tasks.length,
    byStatus,
    byType,
    byMode,
    autoApprovalRate: tasks.length > 0 ? autoApplied / tasks.length : 0,
    averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0
  };
}

/**
 * Clear all tasks (for testing)
 */
export function clearAllTasks(): void {
  aiTasks.clear();
  auditLog.length = 0;
}

/**
 * Clear mode configs (for testing)
 */
export function clearModeConfigs(): void {
  modeConfigs.clear();
}
