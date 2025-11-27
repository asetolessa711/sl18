/**
 * Confidence Manager v1.0.0
 * Tracks and calculates confidence metrics across jobs for autonomous decision-making.
 * 
 * Key metrics:
 * - QC pass rate (target: ≥95%)
 * - Publishing error rate (target: <1%)
 * - AI decision accuracy (measured via shadow mode calibration)
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Confidence metric types
 */
export type ConfidenceMetricType = 
  | 'qc_pass_rate'
  | 'publishing_error_rate'
  | 'ai_decision_accuracy'
  | 'script_approval_rate'
  | 'styling_acceptance_rate';

/**
 * Confidence level
 */
export type ConfidenceLevel = 'insufficient' | 'low' | 'medium' | 'high' | 'autonomous';

/**
 * Confidence thresholds for autonomous mode
 */
export interface ConfidenceThresholds {
  /** Minimum QC pass rate for autonomous publishing (0-1) */
  qcPassRate: number;
  /** Maximum publishing error rate for autonomous mode (0-1) */
  maxPublishingErrorRate: number;
  /** Minimum AI decision accuracy for autonomous mode (0-1) */
  minAIAccuracy: number;
  /** Minimum number of samples required for confidence calculation */
  minSampleSize: number;
  /** Time window in days for metrics calculation */
  timeWindowDays: number;
}

/**
 * Default thresholds for autonomous mode
 */
export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  qcPassRate: 0.95,           // ≥95% QC pass rate
  maxPublishingErrorRate: 0.01, // <1% publishing error rate
  minAIAccuracy: 0.90,        // ≥90% AI decision accuracy
  minSampleSize: 50,          // Minimum 50 samples
  timeWindowDays: 30          // Last 30 days
};

/**
 * Metric data point
 */
export interface MetricDataPoint {
  /** Unique ID */
  id: string;
  /** Metric type */
  type: ConfidenceMetricType;
  /** Value (0-1 for rates) */
  value: number;
  /** Whether this was a success/pass */
  success: boolean;
  /** Content/episode ID */
  contentId?: string;
  /** Workspace ID */
  workspaceId?: string;
  /** Platform (for publishing metrics) */
  platform?: string;
  /** Timestamp */
  timestamp: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Aggregated confidence score
 */
export interface ConfidenceScore {
  /** Overall confidence level */
  level: ConfidenceLevel;
  /** Overall score (0-1) */
  score: number;
  /** Whether autonomous mode is recommended */
  autonomousReady: boolean;
  /** Individual metric scores */
  metrics: {
    qcPassRate: { value: number; passing: boolean; sampleSize: number };
    publishingErrorRate: { value: number; passing: boolean; sampleSize: number };
    aiDecisionAccuracy: { value: number; passing: boolean; sampleSize: number };
  };
  /** Reasons for current level */
  reasons: string[];
  /** Suggestions for improvement */
  suggestions: string[];
  /** Calculated at */
  calculatedAt: string;
  /** Time window used */
  timeWindowDays: number;
}

/**
 * In-memory storage for metrics
 */
const metricsStore: MetricDataPoint[] = [];
let currentThresholds: ConfidenceThresholds = { ...DEFAULT_CONFIDENCE_THRESHOLDS };

/**
 * Record a metric data point
 */
export function recordMetric(
  type: ConfidenceMetricType,
  success: boolean,
  options?: {
    contentId?: string;
    workspaceId?: string;
    platform?: string;
    value?: number;
    context?: Record<string, unknown>;
  }
): MetricDataPoint {
  const dataPoint: MetricDataPoint = {
    id: uuidv4(),
    type,
    value: options?.value ?? (success ? 1 : 0),
    success,
    contentId: options?.contentId,
    workspaceId: options?.workspaceId,
    platform: options?.platform,
    timestamp: new Date().toISOString(),
    context: options?.context
  };
  
  metricsStore.push(dataPoint);
  
  // Keep only last 10000 data points
  if (metricsStore.length > 10000) {
    metricsStore.splice(0, metricsStore.length - 10000);
  }
  
  return dataPoint;
}

/**
 * Record a QC result
 */
export function recordQCResult(passed: boolean, options?: { contentId?: string; workspaceId?: string }): void {
  recordMetric('qc_pass_rate', passed, options);
}

/**
 * Record a publishing result
 */
export function recordPublishingResult(
  success: boolean, 
  platform: string, 
  options?: { contentId?: string; workspaceId?: string }
): void {
  recordMetric('publishing_error_rate', success, { ...options, platform });
}

/**
 * Record AI decision vs operator decision (for calibration)
 */
export function recordAIDecisionAccuracy(
  aiDecisionMatched: boolean,
  options?: { contentId?: string; workspaceId?: string; context?: Record<string, unknown> }
): void {
  recordMetric('ai_decision_accuracy', aiDecisionMatched, options);
}

/**
 * Record script approval
 */
export function recordScriptApproval(approved: boolean, options?: { contentId?: string; workspaceId?: string }): void {
  recordMetric('script_approval_rate', approved, options);
}

/**
 * Record styling acceptance
 */
export function recordStylingAcceptance(accepted: boolean, options?: { contentId?: string; workspaceId?: string }): void {
  recordMetric('styling_acceptance_rate', accepted, options);
}

/**
 * Get metrics within time window
 */
function getMetricsInWindow(type: ConfidenceMetricType, days: number, workspaceId?: string): MetricDataPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();
  
  return metricsStore.filter(m => 
    m.type === type && 
    m.timestamp >= cutoffStr &&
    (!workspaceId || m.workspaceId === workspaceId)
  );
}

/**
 * Calculate rate from metrics
 */
function calculateRate(metrics: MetricDataPoint[]): { rate: number; sampleSize: number } {
  if (metrics.length === 0) {
    return { rate: 0, sampleSize: 0 };
  }
  
  const successes = metrics.filter(m => m.success).length;
  return {
    rate: successes / metrics.length,
    sampleSize: metrics.length
  };
}

/**
 * Get current thresholds
 */
export function getThresholds(): ConfidenceThresholds {
  return { ...currentThresholds };
}

/**
 * Set custom thresholds
 */
export function setThresholds(thresholds: Partial<ConfidenceThresholds>): ConfidenceThresholds {
  currentThresholds = { ...currentThresholds, ...thresholds };
  return { ...currentThresholds };
}

/**
 * Calculate confidence score
 */
export function calculateConfidence(workspaceId?: string): ConfidenceScore {
  const thresholds = getThresholds();
  const reasons: string[] = [];
  const suggestions: string[] = [];
  
  // Calculate QC pass rate
  const qcMetrics = getMetricsInWindow('qc_pass_rate', thresholds.timeWindowDays, workspaceId);
  const qcRate = calculateRate(qcMetrics);
  const qcPassing = qcRate.rate >= thresholds.qcPassRate && qcRate.sampleSize >= thresholds.minSampleSize;
  
  if (!qcPassing) {
    if (qcRate.sampleSize < thresholds.minSampleSize) {
      reasons.push(`Insufficient QC samples: ${qcRate.sampleSize}/${thresholds.minSampleSize} required`);
      suggestions.push('Process more episodes to build QC confidence');
    } else {
      reasons.push(`QC pass rate ${(qcRate.rate * 100).toFixed(1)}% below threshold ${thresholds.qcPassRate * 100}%`);
      suggestions.push('Review QC failures and improve content quality');
    }
  }
  
  // Calculate publishing error rate (we want low errors, so invert the check)
  const pubMetrics = getMetricsInWindow('publishing_error_rate', thresholds.timeWindowDays, workspaceId);
  const pubRate = calculateRate(pubMetrics);
  const publishingErrorRate = 1 - pubRate.rate; // Convert success rate to error rate
  const pubPassing = publishingErrorRate <= thresholds.maxPublishingErrorRate && pubRate.sampleSize >= thresholds.minSampleSize;
  
  if (!pubPassing) {
    if (pubRate.sampleSize < thresholds.minSampleSize) {
      reasons.push(`Insufficient publishing samples: ${pubRate.sampleSize}/${thresholds.minSampleSize} required`);
      suggestions.push('Publish more episodes to build publishing confidence');
    } else {
      reasons.push(`Publishing error rate ${(publishingErrorRate * 100).toFixed(1)}% exceeds threshold ${thresholds.maxPublishingErrorRate * 100}%`);
      suggestions.push('Review publishing failures and fix platform configuration');
    }
  }
  
  // Calculate AI decision accuracy
  const aiMetrics = getMetricsInWindow('ai_decision_accuracy', thresholds.timeWindowDays, workspaceId);
  const aiRate = calculateRate(aiMetrics);
  const aiPassing = aiRate.rate >= thresholds.minAIAccuracy && aiRate.sampleSize >= thresholds.minSampleSize;
  
  if (!aiPassing) {
    if (aiRate.sampleSize < thresholds.minSampleSize) {
      reasons.push(`Insufficient AI calibration samples: ${aiRate.sampleSize}/${thresholds.minSampleSize} required`);
      suggestions.push('Use shadow publishing to calibrate AI decisions');
    } else {
      reasons.push(`AI accuracy ${(aiRate.rate * 100).toFixed(1)}% below threshold ${thresholds.minAIAccuracy * 100}%`);
      suggestions.push('Review AI decisions that differed from operator choices');
    }
  }
  
  // Calculate overall score and level
  const allPassing = qcPassing && pubPassing && aiPassing;
  const hasSufficientData = 
    qcRate.sampleSize >= thresholds.minSampleSize &&
    pubRate.sampleSize >= thresholds.minSampleSize &&
    aiRate.sampleSize >= thresholds.minSampleSize;
  
  // Weighted average of metrics
  const overallScore = hasSufficientData
    ? (qcRate.rate * 0.4) + (pubRate.rate * 0.3) + (aiRate.rate * 0.3)
    : 0;
  
  let level: ConfidenceLevel;
  if (!hasSufficientData) {
    level = 'insufficient';
  } else if (allPassing && overallScore >= 0.95) {
    level = 'autonomous';
  } else if (overallScore >= 0.85) {
    level = 'high';
  } else if (overallScore >= 0.70) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  if (allPassing) {
    reasons.unshift('All confidence thresholds met');
  }
  
  return {
    level,
    score: overallScore,
    autonomousReady: allPassing,
    metrics: {
      qcPassRate: { value: qcRate.rate, passing: qcPassing, sampleSize: qcRate.sampleSize },
      publishingErrorRate: { value: publishingErrorRate, passing: pubPassing, sampleSize: pubRate.sampleSize },
      aiDecisionAccuracy: { value: aiRate.rate, passing: aiPassing, sampleSize: aiRate.sampleSize }
    },
    reasons,
    suggestions,
    calculatedAt: new Date().toISOString(),
    timeWindowDays: thresholds.timeWindowDays
  };
}

/**
 * Get metrics history for a specific type
 */
export function getMetricsHistory(
  type: ConfidenceMetricType,
  options?: {
    workspaceId?: string;
    days?: number;
    limit?: number;
  }
): MetricDataPoint[] {
  const days = options?.days ?? 30;
  const limit = options?.limit ?? 100;
  
  let metrics = getMetricsInWindow(type, days, options?.workspaceId);
  metrics.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  
  return metrics.slice(0, limit);
}

/**
 * Get all metrics summary
 */
export function getMetricsSummary(workspaceId?: string): {
  qc: { total: number; passed: number; rate: number };
  publishing: { total: number; succeeded: number; errorRate: number };
  aiAccuracy: { total: number; matched: number; rate: number };
  scripts: { total: number; approved: number; rate: number };
  styling: { total: number; accepted: number; rate: number };
} {
  const thresholds = getThresholds();
  
  const qcMetrics = getMetricsInWindow('qc_pass_rate', thresholds.timeWindowDays, workspaceId);
  const pubMetrics = getMetricsInWindow('publishing_error_rate', thresholds.timeWindowDays, workspaceId);
  const aiMetrics = getMetricsInWindow('ai_decision_accuracy', thresholds.timeWindowDays, workspaceId);
  const scriptMetrics = getMetricsInWindow('script_approval_rate', thresholds.timeWindowDays, workspaceId);
  const styleMetrics = getMetricsInWindow('styling_acceptance_rate', thresholds.timeWindowDays, workspaceId);
  
  return {
    qc: {
      total: qcMetrics.length,
      passed: qcMetrics.filter(m => m.success).length,
      rate: qcMetrics.length > 0 ? qcMetrics.filter(m => m.success).length / qcMetrics.length : 0
    },
    publishing: {
      total: pubMetrics.length,
      succeeded: pubMetrics.filter(m => m.success).length,
      errorRate: pubMetrics.length > 0 ? pubMetrics.filter(m => !m.success).length / pubMetrics.length : 0
    },
    aiAccuracy: {
      total: aiMetrics.length,
      matched: aiMetrics.filter(m => m.success).length,
      rate: aiMetrics.length > 0 ? aiMetrics.filter(m => m.success).length / aiMetrics.length : 0
    },
    scripts: {
      total: scriptMetrics.length,
      approved: scriptMetrics.filter(m => m.success).length,
      rate: scriptMetrics.length > 0 ? scriptMetrics.filter(m => m.success).length / scriptMetrics.length : 0
    },
    styling: {
      total: styleMetrics.length,
      accepted: styleMetrics.filter(m => m.success).length,
      rate: styleMetrics.length > 0 ? styleMetrics.filter(m => m.success).length / styleMetrics.length : 0
    }
  };
}

/**
 * Check if autonomous mode is allowed
 */
export function isAutonomousModeAllowed(workspaceId?: string): {
  allowed: boolean;
  confidence: ConfidenceScore;
  reason: string;
} {
  const confidence = calculateConfidence(workspaceId);
  
  return {
    allowed: confidence.autonomousReady,
    confidence,
    reason: confidence.autonomousReady 
      ? 'All confidence thresholds met for autonomous mode'
      : confidence.reasons.join('; ')
  };
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}

/**
 * Reset thresholds to default (for testing)
 */
export function resetThresholds(): void {
  currentThresholds = { ...DEFAULT_CONFIDENCE_THRESHOLDS };
}

/**
 * Seed metrics for testing (simulate historical data)
 */
export function seedMetricsForTesting(options: {
  qcPassRate: number;
  publishingSuccessRate: number;
  aiAccuracyRate: number;
  sampleSize: number;
}): void {
  const now = new Date();
  
  for (let i = 0; i < options.sampleSize; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000).toISOString(); // Hourly intervals
    
    // QC metrics
    metricsStore.push({
      id: uuidv4(),
      type: 'qc_pass_rate',
      value: Math.random() < options.qcPassRate ? 1 : 0,
      success: Math.random() < options.qcPassRate,
      timestamp
    });
    
    // Publishing metrics
    metricsStore.push({
      id: uuidv4(),
      type: 'publishing_error_rate',
      value: Math.random() < options.publishingSuccessRate ? 1 : 0,
      success: Math.random() < options.publishingSuccessRate,
      timestamp
    });
    
    // AI accuracy metrics
    metricsStore.push({
      id: uuidv4(),
      type: 'ai_decision_accuracy',
      value: Math.random() < options.aiAccuracyRate ? 1 : 0,
      success: Math.random() < options.aiAccuracyRate,
      timestamp
    });
  }
}
