/**
 * Autonomous Manager v1.0.0
 * Manages autonomous publishing with shadow mode for calibration.
 * 
 * Features:
 * - Shadow publishing: AI simulates decisions without executing
 * - Autonomous publishing: AI publishes when confidence thresholds are met
 * - Override and rollback controls for operators
 * - Full audit trail for all autonomous actions
 */

import { v4 as uuidv4 } from 'uuid';
import { PublishingPlatform, PublishingMetadata, PublishingJobStatus } from '../publishing/publishing.types';
import { 
  calculateConfidence, 
  isAutonomousModeAllowed, 
  recordPublishingResult,
  recordAIDecisionAccuracy,
  ConfidenceScore 
} from './confidence-manager';
import { getModeConfig, AIOperatingMode } from './ai.types';

/**
 * Autonomous job types
 */
export type AutonomousJobType = 'shadow' | 'autonomous';

/**
 * Autonomous job status
 */
export type AutonomousJobStatus = 
  | 'pending'
  | 'simulating'
  | 'simulated'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'rolled_back'
  | 'overridden';

/**
 * Shadow publishing result
 */
export interface ShadowPublishResult {
  /** Job ID */
  jobId: string;
  /** Episode ID */
  episodeId: string;
  /** Platform */
  platform: PublishingPlatform;
  /** AI's decision */
  aiDecision: 'publish' | 'hold' | 'reject';
  /** Confidence score for decision */
  confidenceScore: number;
  /** AI's reasoning */
  reasoning: string[];
  /** Simulated metadata that would be used */
  simulatedMetadata: PublishingMetadata;
  /** QC check result */
  qcResult: {
    passed: boolean;
    score: number;
    issues: string[];
  };
  /** Whether this matches what operator would likely do */
  matchesOperatorPattern?: boolean;
  /** Simulated at */
  simulatedAt: string;
  /** Comparison with actual operator decision (if available) */
  operatorComparison?: {
    operatorDecision: 'publish' | 'hold' | 'reject';
    matched: boolean;
    comparedAt: string;
  };
}

/**
 * Autonomous publish request
 */
export interface AutonomousPublishRequest {
  /** Episode ID to publish */
  episodeId: string;
  /** Target platforms */
  platforms: PublishingPlatform[];
  /** Metadata (if not auto-generated) */
  metadata?: PublishingMetadata;
  /** Override confidence check */
  forcePublish?: boolean;
  /** Workspace ID */
  workspaceId?: string;
  /** Actor initiating the request */
  actor?: string;
}

/**
 * Autonomous publish job
 */
export interface AutonomousJob {
  /** Unique ID */
  id: string;
  /** Job type */
  type: AutonomousJobType;
  /** Episode ID */
  episodeId: string;
  /** Platform */
  platform: PublishingPlatform;
  /** Status */
  status: AutonomousJobStatus;
  /** Metadata used */
  metadata: PublishingMetadata;
  /** AI decision */
  aiDecision: 'publish' | 'hold' | 'reject';
  /** Confidence score */
  confidenceScore: number;
  /** AI reasoning */
  reasoning: string[];
  /** Workspace ID */
  workspaceId?: string;
  /** Created at */
  createdAt: string;
  /** Updated at */
  updatedAt: string;
  /** Completed at */
  completedAt?: string;
  /** Platform video ID (if published) */
  platformVideoId?: string;
  /** Platform URL (if published) */
  platformUrl?: string;
  /** Error if failed */
  error?: string;
  /** Actor who initiated */
  actor?: string;
  /** Override info */
  override?: {
    overriddenBy: string;
    overriddenAt: string;
    reason: string;
    originalDecision: 'publish' | 'hold' | 'reject';
    newDecision: 'publish' | 'hold' | 'reject';
  };
  /** Rollback info */
  rollback?: {
    rolledBackBy: string;
    rolledBackAt: string;
    reason: string;
    platformVideoId: string;
  };
}

/**
 * Autonomous audit entry
 */
export interface AutonomousAuditEntry {
  /** Entry ID */
  id: string;
  /** Job ID */
  jobId: string;
  /** Action type */
  action: 'created' | 'simulated' | 'published' | 'failed' | 'overridden' | 'rolled_back' | 'calibrated';
  /** Actor */
  actor: string;
  /** Timestamp */
  timestamp: string;
  /** Details */
  details?: Record<string, unknown>;
}

/**
 * In-memory storage
 */
const autonomousJobs: Map<string, AutonomousJob> = new Map();
const shadowResults: Map<string, ShadowPublishResult> = new Map();
const autonomousAuditLog: AutonomousAuditEntry[] = [];

/**
 * Add autonomous audit entry
 */
function addAuditEntry(
  jobId: string, 
  action: AutonomousAuditEntry['action'], 
  actor: string, 
  details?: Record<string, unknown>
): void {
  const entry: AutonomousAuditEntry = {
    id: uuidv4(),
    jobId,
    action,
    actor,
    timestamp: new Date().toISOString(),
    details
  };
  autonomousAuditLog.push(entry);
  
  // Keep last 1000 entries
  if (autonomousAuditLog.length > 1000) {
    autonomousAuditLog.splice(0, autonomousAuditLog.length - 1000);
  }
}

/**
 * Generate AI metadata based on content
 * In production, this would use actual content analysis
 */
function generateAIMetadata(episodeId: string, platform: PublishingPlatform): PublishingMetadata {
  return {
    title: `Episode ${episodeId} - Auto-generated`,
    description: `Automatically generated description for episode ${episodeId}`,
    tags: ['sl18', 'auto-published', platform],
    privacyStatus: 'public',
    madeForKids: false,
    personaCode: 'ADDIS',
    custom: {
      autoGenerated: true,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Simulate QC check for shadow publishing
 */
function simulateQCCheck(episodeId: string): { passed: boolean; score: number; issues: string[] } {
  // In production, this would use actual QC logic
  const score = 80 + Math.random() * 20; // 80-100
  const issues: string[] = [];
  
  if (score < 85) {
    issues.push('Caption length warning on segment 3');
  }
  if (score < 90) {
    issues.push('Consider pacing adjustment in intro');
  }
  
  return {
    passed: score >= 75,
    score,
    issues
  };
}

/**
 * Make AI decision for publishing
 */
function makeAIDecision(
  qcResult: { passed: boolean; score: number; issues: string[] },
  confidenceScore: ConfidenceScore
): { decision: 'publish' | 'hold' | 'reject'; reasoning: string[]; score: number } {
  const reasoning: string[] = [];
  let decisionScore = 0.5; // Base score
  
  // Factor in QC result
  if (qcResult.passed) {
    decisionScore += 0.3;
    reasoning.push(`QC passed with score ${qcResult.score.toFixed(1)}`);
  } else {
    decisionScore -= 0.3;
    reasoning.push(`QC failed with score ${qcResult.score.toFixed(1)}`);
  }
  
  // Factor in overall confidence
  if (confidenceScore.autonomousReady) {
    decisionScore += 0.2;
    reasoning.push('System confidence thresholds met');
  } else {
    reasoning.push(`System confidence not met: ${confidenceScore.reasons[0] || 'Unknown reason'}`);
  }
  
  // Factor in QC issues
  if (qcResult.issues.length === 0) {
    decisionScore += 0.1;
    reasoning.push('No QC issues detected');
  } else {
    reasoning.push(`${qcResult.issues.length} QC issues detected`);
  }
  
  // Make decision
  let decision: 'publish' | 'hold' | 'reject';
  if (decisionScore >= 0.8) {
    decision = 'publish';
    reasoning.unshift('Decision: PUBLISH - High confidence in content quality');
  } else if (decisionScore >= 0.5) {
    decision = 'hold';
    reasoning.unshift('Decision: HOLD - Recommend human review');
  } else {
    decision = 'reject';
    reasoning.unshift('Decision: REJECT - Content quality concerns');
  }
  
  return { decision, reasoning, score: decisionScore };
}

/**
 * Create shadow publish job (simulates AI decision without executing)
 */
export async function createShadowPublish(
  episodeId: string,
  platform: PublishingPlatform,
  options?: {
    workspaceId?: string;
    metadata?: PublishingMetadata;
    actor?: string;
  }
): Promise<ShadowPublishResult> {
  const jobId = uuidv4();
  const now = new Date().toISOString();
  
  // Get or generate metadata
  const metadata = options?.metadata ?? generateAIMetadata(episodeId, platform);
  
  // Simulate QC check
  const qcResult = simulateQCCheck(episodeId);
  
  // Get confidence score
  const confidenceScore = calculateConfidence(options?.workspaceId);
  
  // Make AI decision
  const aiDecision = makeAIDecision(qcResult, confidenceScore);
  
  // Create job record
  const job: AutonomousJob = {
    id: jobId,
    type: 'shadow',
    episodeId,
    platform,
    status: 'simulated',
    metadata,
    aiDecision: aiDecision.decision,
    confidenceScore: aiDecision.score,
    reasoning: aiDecision.reasoning,
    workspaceId: options?.workspaceId,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
    actor: options?.actor ?? 'system'
  };
  
  autonomousJobs.set(jobId, job);
  
  // Create shadow result
  const result: ShadowPublishResult = {
    jobId,
    episodeId,
    platform,
    aiDecision: aiDecision.decision,
    confidenceScore: aiDecision.score,
    reasoning: aiDecision.reasoning,
    simulatedMetadata: metadata,
    qcResult,
    simulatedAt: now
  };
  
  shadowResults.set(jobId, result);
  
  addAuditEntry(jobId, 'simulated', options?.actor ?? 'system', {
    decision: aiDecision.decision,
    confidence: aiDecision.score,
    qcPassed: qcResult.passed
  });
  
  return result;
}

/**
 * Compare shadow result with operator decision (for calibration)
 */
export function compareShadowWithOperator(
  shadowJobId: string,
  operatorDecision: 'publish' | 'hold' | 'reject',
  operatorActor: string
): ShadowPublishResult | null {
  const result = shadowResults.get(shadowJobId);
  if (!result) return null;
  
  const matched = result.aiDecision === operatorDecision;
  
  result.operatorComparison = {
    operatorDecision,
    matched,
    comparedAt: new Date().toISOString()
  };
  
  // Record for calibration
  recordAIDecisionAccuracy(matched, {
    contentId: result.episodeId,
    context: {
      aiDecision: result.aiDecision,
      operatorDecision,
      platform: result.platform
    }
  });
  
  addAuditEntry(shadowJobId, 'calibrated', operatorActor, {
    aiDecision: result.aiDecision,
    operatorDecision,
    matched
  });
  
  return result;
}

/**
 * Create autonomous publish job
 */
export async function createAutonomousPublish(
  request: AutonomousPublishRequest
): Promise<{ success: boolean; jobs: AutonomousJob[]; message: string }> {
  const jobs: AutonomousJob[] = [];
  const now = new Date().toISOString();
  
  // Check if autonomous mode is allowed
  if (!request.forcePublish) {
    const autonomousCheck = isAutonomousModeAllowed(request.workspaceId);
    if (!autonomousCheck.allowed) {
      return {
        success: false,
        jobs: [],
        message: `Autonomous publishing not allowed: ${autonomousCheck.reason}`
      };
    }
  }
  
  for (const platform of request.platforms) {
    // Skip TikTok for autonomous (manual only)
    if (platform === 'tiktok') {
      continue;
    }
    
    const jobId = uuidv4();
    const metadata = request.metadata ?? generateAIMetadata(request.episodeId, platform);
    const qcResult = simulateQCCheck(request.episodeId);
    const confidenceScore = calculateConfidence(request.workspaceId);
    const aiDecision = makeAIDecision(qcResult, confidenceScore);
    
    // For autonomous, only proceed if decision is 'publish'
    if (aiDecision.decision !== 'publish' && !request.forcePublish) {
      const job: AutonomousJob = {
        id: jobId,
        type: 'autonomous',
        episodeId: request.episodeId,
        platform,
        status: 'failed',
        metadata,
        aiDecision: aiDecision.decision,
        confidenceScore: aiDecision.score,
        reasoning: aiDecision.reasoning,
        workspaceId: request.workspaceId,
        createdAt: now,
        updatedAt: now,
        completedAt: now,
        actor: request.actor ?? 'system',
        error: `AI decision was '${aiDecision.decision}', not 'publish'`
      };
      
      autonomousJobs.set(jobId, job);
      jobs.push(job);
      
      addAuditEntry(jobId, 'created', request.actor ?? 'system', {
        decision: aiDecision.decision,
        aborted: true
      });
      
      continue;
    }
    
    // Simulate successful publish (in production, this would call actual publishing)
    const job: AutonomousJob = {
      id: jobId,
      type: 'autonomous',
      episodeId: request.episodeId,
      platform,
      status: 'published',
      metadata,
      aiDecision: aiDecision.decision,
      confidenceScore: aiDecision.score,
      reasoning: aiDecision.reasoning,
      workspaceId: request.workspaceId,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      actor: request.actor ?? 'system',
      platformVideoId: `${platform}_${uuidv4().slice(0, 8)}`,
      platformUrl: `https://${platform}.com/video/${uuidv4().slice(0, 8)}`
    };
    
    autonomousJobs.set(jobId, job);
    jobs.push(job);
    
    // Record success for confidence tracking
    recordPublishingResult(true, platform, {
      contentId: request.episodeId,
      workspaceId: request.workspaceId
    });
    
    addAuditEntry(jobId, 'published', request.actor ?? 'system', {
      platform,
      videoId: job.platformVideoId
    });
  }
  
  const successCount = jobs.filter(j => j.status === 'published').length;
  
  return {
    success: successCount > 0,
    jobs,
    message: `Published to ${successCount}/${request.platforms.length} platforms`
  };
}

/**
 * Override an autonomous decision
 */
export function overrideAutonomousJob(
  jobId: string,
  newDecision: 'publish' | 'hold' | 'reject',
  overriddenBy: string,
  reason: string
): AutonomousJob | null {
  const job = autonomousJobs.get(jobId);
  if (!job) return null;
  
  const originalDecision = job.aiDecision;
  const now = new Date().toISOString();
  
  job.override = {
    overriddenBy,
    overriddenAt: now,
    reason,
    originalDecision,
    newDecision
  };
  
  job.status = 'overridden';
  job.updatedAt = now;
  job.aiDecision = newDecision;
  
  // Record for calibration
  recordAIDecisionAccuracy(originalDecision === newDecision, {
    contentId: job.episodeId,
    context: {
      aiDecision: originalDecision,
      operatorDecision: newDecision,
      overrideReason: reason
    }
  });
  
  addAuditEntry(jobId, 'overridden', overriddenBy, {
    originalDecision,
    newDecision,
    reason
  });
  
  return job;
}

/**
 * Rollback a published job
 */
export function rollbackAutonomousJob(
  jobId: string,
  rolledBackBy: string,
  reason: string
): AutonomousJob | null {
  const job = autonomousJobs.get(jobId);
  if (!job || job.status !== 'published' || !job.platformVideoId) return null;
  
  const now = new Date().toISOString();
  
  job.rollback = {
    rolledBackBy,
    rolledBackAt: now,
    reason,
    platformVideoId: job.platformVideoId
  };
  
  job.status = 'rolled_back';
  job.updatedAt = now;
  
  // Record failure for confidence tracking
  recordPublishingResult(false, job.platform, {
    contentId: job.episodeId,
    workspaceId: job.workspaceId
  });
  
  addAuditEntry(jobId, 'rolled_back', rolledBackBy, {
    videoId: job.platformVideoId,
    reason
  });
  
  return job;
}

/**
 * Get autonomous job by ID
 */
export function getAutonomousJob(jobId: string): AutonomousJob | null {
  return autonomousJobs.get(jobId) ?? null;
}

/**
 * Get shadow result by ID
 */
export function getShadowResult(jobId: string): ShadowPublishResult | null {
  return shadowResults.get(jobId) ?? null;
}

/**
 * List autonomous jobs
 */
export function listAutonomousJobs(filters?: {
  type?: AutonomousJobType;
  status?: AutonomousJobStatus;
  episodeId?: string;
  workspaceId?: string;
  platform?: PublishingPlatform;
  limit?: number;
  offset?: number;
}): { jobs: AutonomousJob[]; total: number } {
  let jobs = Array.from(autonomousJobs.values());
  
  if (filters?.type) {
    jobs = jobs.filter(j => j.type === filters.type);
  }
  if (filters?.status) {
    jobs = jobs.filter(j => j.status === filters.status);
  }
  if (filters?.episodeId) {
    jobs = jobs.filter(j => j.episodeId === filters.episodeId);
  }
  if (filters?.workspaceId) {
    jobs = jobs.filter(j => j.workspaceId === filters.workspaceId);
  }
  if (filters?.platform) {
    jobs = jobs.filter(j => j.platform === filters.platform);
  }
  
  jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  
  const total = jobs.length;
  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? 50;
  
  return {
    jobs: jobs.slice(offset, offset + limit),
    total
  };
}

/**
 * List shadow results
 */
export function listShadowResults(filters?: {
  episodeId?: string;
  platform?: PublishingPlatform;
  decision?: 'publish' | 'hold' | 'reject';
  hasOperatorComparison?: boolean;
  limit?: number;
}): ShadowPublishResult[] {
  let results = Array.from(shadowResults.values());
  
  if (filters?.episodeId) {
    results = results.filter(r => r.episodeId === filters.episodeId);
  }
  if (filters?.platform) {
    results = results.filter(r => r.platform === filters.platform);
  }
  if (filters?.decision) {
    results = results.filter(r => r.aiDecision === filters.decision);
  }
  if (filters?.hasOperatorComparison !== undefined) {
    results = results.filter(r => 
      filters.hasOperatorComparison 
        ? r.operatorComparison !== undefined 
        : r.operatorComparison === undefined
    );
  }
  
  results.sort((a, b) => b.simulatedAt.localeCompare(a.simulatedAt));
  
  return results.slice(0, filters?.limit ?? 50);
}

/**
 * Get autonomous audit log
 */
export function getAutonomousAuditLog(filters?: {
  jobId?: string;
  action?: AutonomousAuditEntry['action'];
  actor?: string;
  limit?: number;
}): AutonomousAuditEntry[] {
  let entries = [...autonomousAuditLog];
  
  if (filters?.jobId) {
    entries = entries.filter(e => e.jobId === filters.jobId);
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
 * Get autonomous mode statistics
 */
export function getAutonomousStats(): {
  totalJobs: number;
  shadowJobs: number;
  autonomousJobs: number;
  byStatus: Record<AutonomousJobStatus, number>;
  byPlatform: Record<string, number>;
  publishSuccess: number;
  overrides: number;
  rollbacks: number;
  calibrationAccuracy: number;
} {
  const jobs = Array.from(autonomousJobs.values());
  const results = Array.from(shadowResults.values());
  
  const byStatus: Record<AutonomousJobStatus, number> = {
    pending: 0,
    simulating: 0,
    simulated: 0,
    publishing: 0,
    published: 0,
    failed: 0,
    rolled_back: 0,
    overridden: 0
  };
  
  const byPlatform: Record<string, number> = {};
  let publishSuccess = 0;
  let overrides = 0;
  let rollbacks = 0;
  
  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
    byPlatform[job.platform] = (byPlatform[job.platform] ?? 0) + 1;
    
    if (job.status === 'published') publishSuccess++;
    if (job.override) overrides++;
    if (job.rollback) rollbacks++;
  }
  
  // Calculate calibration accuracy
  const calibrated = results.filter(r => r.operatorComparison);
  const matched = calibrated.filter(r => r.operatorComparison?.matched);
  const calibrationAccuracy = calibrated.length > 0 ? matched.length / calibrated.length : 0;
  
  return {
    totalJobs: jobs.length,
    shadowJobs: jobs.filter(j => j.type === 'shadow').length,
    autonomousJobs: jobs.filter(j => j.type === 'autonomous').length,
    byStatus,
    byPlatform,
    publishSuccess,
    overrides,
    rollbacks,
    calibrationAccuracy
  };
}

/**
 * Clear all data (for testing)
 */
export function clearAutonomousData(): void {
  autonomousJobs.clear();
  shadowResults.clear();
  autonomousAuditLog.length = 0;
}
