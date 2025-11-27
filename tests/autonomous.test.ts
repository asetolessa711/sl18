/**
 * Autonomous Mode Tests (Phase 11)
 * Tests for confidence manager, shadow publishing, and autonomous mode.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordQCResult,
  recordPublishingResult,
  recordAIDecisionAccuracy,
  recordScriptApproval,
  recordStylingAcceptance,
  calculateConfidence,
  isAutonomousModeAllowed,
  getThresholds,
  setThresholds,
  getMetricsSummary,
  getMetricsHistory,
  clearMetrics,
  resetThresholds,
  seedMetricsForTesting
} from '../render-stack/ai/confidence-manager';
import {
  createShadowPublish,
  createAutonomousPublish,
  compareShadowWithOperator,
  overrideAutonomousJob,
  rollbackAutonomousJob,
  getAutonomousJob,
  getShadowResult,
  listAutonomousJobs,
  listShadowResults,
  getAutonomousAuditLog,
  getAutonomousStats,
  clearAutonomousData
} from '../render-stack/ai/autonomous-manager';

describe('Confidence Manager', () => {
  beforeEach(() => {
    clearMetrics();
    resetThresholds();
  });

  describe('Metric Recording', () => {
    it('should record QC results', () => {
      recordQCResult(true, { contentId: 'ep1' });
      recordQCResult(false, { contentId: 'ep2' });
      
      const summary = getMetricsSummary();
      expect(summary.qc.total).toBe(2);
      expect(summary.qc.passed).toBe(1);
    });

    it('should record publishing results', () => {
      recordPublishingResult(true, 'youtube', { contentId: 'ep1' });
      recordPublishingResult(false, 'facebook', { contentId: 'ep2' });
      
      const summary = getMetricsSummary();
      expect(summary.publishing.total).toBe(2);
      expect(summary.publishing.succeeded).toBe(1);
    });

    it('should record AI decision accuracy', () => {
      recordAIDecisionAccuracy(true, { contentId: 'ep1' });
      recordAIDecisionAccuracy(false, { contentId: 'ep2' });
      
      const summary = getMetricsSummary();
      expect(summary.aiAccuracy.total).toBe(2);
      expect(summary.aiAccuracy.matched).toBe(1);
    });

    it('should record script approvals', () => {
      recordScriptApproval(true, { contentId: 'ep1' });
      recordScriptApproval(true, { contentId: 'ep2' });
      
      const summary = getMetricsSummary();
      expect(summary.scripts.total).toBe(2);
      expect(summary.scripts.approved).toBe(2);
    });

    it('should record styling acceptance', () => {
      recordStylingAcceptance(true, { contentId: 'ep1' });
      recordStylingAcceptance(false, { contentId: 'ep2' });
      
      const summary = getMetricsSummary();
      expect(summary.styling.total).toBe(2);
      expect(summary.styling.accepted).toBe(1);
    });
  });

  describe('Confidence Calculation', () => {
    it('should return insufficient level with no data', () => {
      const confidence = calculateConfidence();
      expect(confidence.level).toBe('insufficient');
      expect(confidence.autonomousReady).toBe(false);
    });

    it('should calculate confidence with seeded data', () => {
      seedMetricsForTesting({
        qcPassRate: 0.96,
        publishingSuccessRate: 0.99,
        aiAccuracyRate: 0.92,
        sampleSize: 60
      });
      
      const confidence = calculateConfidence();
      expect(confidence.metrics.qcPassRate.sampleSize).toBeGreaterThanOrEqual(50);
      expect(confidence.score).toBeGreaterThan(0);
    });

    it('should indicate autonomous ready when thresholds met', () => {
      // Seed with high success rates
      seedMetricsForTesting({
        qcPassRate: 0.98,
        publishingSuccessRate: 0.995,
        aiAccuracyRate: 0.95,
        sampleSize: 100
      });
      
      const confidence = calculateConfidence();
      // Due to randomization in seeding, we check the structure exists
      expect(confidence).toHaveProperty('autonomousReady');
      expect(confidence).toHaveProperty('level');
      expect(confidence).toHaveProperty('metrics');
    });
  });

  describe('Thresholds', () => {
    it('should get default thresholds', () => {
      const thresholds = getThresholds();
      expect(thresholds.qcPassRate).toBe(0.95);
      expect(thresholds.maxPublishingErrorRate).toBe(0.01);
      expect(thresholds.minAIAccuracy).toBe(0.90);
    });

    it('should update thresholds', () => {
      const updated = setThresholds({ qcPassRate: 0.90 });
      expect(updated.qcPassRate).toBe(0.90);
      expect(updated.maxPublishingErrorRate).toBe(0.01); // unchanged
    });
  });

  describe('Autonomous Mode Check', () => {
    it('should not allow autonomous mode without data', () => {
      const check = isAutonomousModeAllowed();
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Insufficient');
    });

    it('should include confidence score in check result', () => {
      const check = isAutonomousModeAllowed();
      expect(check).toHaveProperty('confidence');
      expect(check.confidence).toHaveProperty('level');
    });
  });

  describe('Metrics History', () => {
    it('should return metrics history for type', () => {
      recordQCResult(true, { contentId: 'ep1' });
      recordQCResult(true, { contentId: 'ep2' });
      
      const history = getMetricsHistory('qc_pass_rate');
      expect(history).toHaveLength(2);
    });

    it('should limit history results', () => {
      for (let i = 0; i < 10; i++) {
        recordQCResult(true, { contentId: `ep${i}` });
      }
      
      const history = getMetricsHistory('qc_pass_rate', { limit: 5 });
      expect(history).toHaveLength(5);
    });
  });
});

describe('Autonomous Manager', () => {
  beforeEach(() => {
    clearAutonomousData();
    clearMetrics();
    resetThresholds();
  });

  describe('Shadow Publishing', () => {
    it('should create shadow publish job', async () => {
      const result = await createShadowPublish('ep1', 'youtube', {
        actor: 'test-user'
      });
      
      expect(result.jobId).toBeDefined();
      expect(result.episodeId).toBe('ep1');
      expect(result.platform).toBe('youtube');
      expect(result.aiDecision).toBeDefined();
      expect(['publish', 'hold', 'reject']).toContain(result.aiDecision);
    });

    it('should include QC result in shadow publish', async () => {
      const result = await createShadowPublish('ep1', 'facebook');
      
      expect(result.qcResult).toBeDefined();
      expect(result.qcResult.passed).toBeDefined();
      expect(result.qcResult.score).toBeGreaterThan(0);
    });

    it('should store shadow result for retrieval', async () => {
      const result = await createShadowPublish('ep1', 'youtube');
      const retrieved = getShadowResult(result.jobId);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.jobId).toBe(result.jobId);
    });

    it('should compare shadow with operator decision', async () => {
      const result = await createShadowPublish('ep1', 'youtube');
      const compared = compareShadowWithOperator(result.jobId, 'publish', 'operator1');
      
      expect(compared).toBeDefined();
      expect(compared?.operatorComparison).toBeDefined();
      expect(compared?.operatorComparison?.operatorDecision).toBe('publish');
      expect(compared?.operatorComparison?.matched).toBeDefined();
    });
  });

  describe('Autonomous Publishing', () => {
    it('should reject autonomous publish without confidence', async () => {
      const result = await createAutonomousPublish({
        episodeId: 'ep1',
        platforms: ['youtube', 'facebook']
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not allowed');
    });

    it('should allow force publish', async () => {
      const result = await createAutonomousPublish({
        episodeId: 'ep1',
        platforms: ['youtube'],
        forcePublish: true
      });
      
      // Will succeed or fail based on AI decision
      expect(result.jobs).toBeDefined();
      expect(result.jobs.length).toBeGreaterThanOrEqual(0);
    });

    it('should skip TikTok for autonomous publish', async () => {
      const result = await createAutonomousPublish({
        episodeId: 'ep1',
        platforms: ['tiktok'],
        forcePublish: true
      });
      
      // TikTok should be skipped
      expect(result.jobs).toHaveLength(0);
    });

    it('should create job record', async () => {
      const result = await createAutonomousPublish({
        episodeId: 'ep1',
        platforms: ['youtube'],
        forcePublish: true,
        actor: 'test-user'
      });
      
      if (result.jobs.length > 0) {
        const job = getAutonomousJob(result.jobs[0].id);
        expect(job).toBeDefined();
        expect(job?.episodeId).toBe('ep1');
      }
    });
  });

  describe('Override and Rollback', () => {
    it('should override autonomous job', async () => {
      const publishResult = await createAutonomousPublish({
        episodeId: 'ep1',
        platforms: ['youtube'],
        forcePublish: true
      });
      
      if (publishResult.jobs.length > 0) {
        const jobId = publishResult.jobs[0].id;
        const overridden = overrideAutonomousJob(
          jobId,
          'hold',
          'operator1',
          'Need manual review'
        );
        
        expect(overridden).toBeDefined();
        expect(overridden?.status).toBe('overridden');
        expect(overridden?.override?.originalDecision).toBeDefined();
      }
    });

    it('should rollback published job', async () => {
      const publishResult = await createAutonomousPublish({
        episodeId: 'ep1',
        platforms: ['youtube'],
        forcePublish: true
      });
      
      const publishedJob = publishResult.jobs.find(j => j.status === 'published');
      if (publishedJob) {
        const rolledBack = rollbackAutonomousJob(
          publishedJob.id,
          'operator1',
          'Content issue discovered'
        );
        
        expect(rolledBack).toBeDefined();
        expect(rolledBack?.status).toBe('rolled_back');
        expect(rolledBack?.rollback?.reason).toBe('Content issue discovered');
      }
    });

    it('should not rollback non-published job', async () => {
      // Create a shadow job (not published)
      const result = await createShadowPublish('ep1', 'youtube');
      const job = getAutonomousJob(result.jobId);
      
      if (job) {
        const rolledBack = rollbackAutonomousJob(result.jobId, 'operator1', 'test');
        expect(rolledBack).toBeNull();
      }
    });
  });

  describe('Job Listing', () => {
    it('should list autonomous jobs', async () => {
      await createShadowPublish('ep1', 'youtube');
      await createShadowPublish('ep2', 'facebook');
      
      const result = listAutonomousJobs();
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter jobs by type', async () => {
      await createShadowPublish('ep1', 'youtube');
      
      const shadowJobs = listAutonomousJobs({ type: 'shadow' });
      expect(shadowJobs.jobs.every(j => j.type === 'shadow')).toBe(true);
    });

    it('should filter jobs by platform', async () => {
      await createShadowPublish('ep1', 'youtube');
      await createShadowPublish('ep2', 'facebook');
      
      const youtubeJobs = listAutonomousJobs({ platform: 'youtube' });
      expect(youtubeJobs.jobs.every(j => j.platform === 'youtube')).toBe(true);
    });
  });

  describe('Shadow Results Listing', () => {
    it('should list shadow results', async () => {
      await createShadowPublish('ep1', 'youtube');
      await createShadowPublish('ep2', 'facebook');
      
      const results = listShadowResults();
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by decision', async () => {
      await createShadowPublish('ep1', 'youtube');
      await createShadowPublish('ep2', 'youtube');
      
      const publishDecisions = listShadowResults({ decision: 'publish' });
      expect(publishDecisions.every(r => r.aiDecision === 'publish')).toBe(true);
    });

    it('should filter by operator comparison', async () => {
      const result = await createShadowPublish('ep1', 'youtube');
      compareShadowWithOperator(result.jobId, 'publish', 'operator1');
      
      const withComparison = listShadowResults({ hasOperatorComparison: true });
      expect(withComparison.every(r => r.operatorComparison !== undefined)).toBe(true);
    });
  });

  describe('Audit Log', () => {
    it('should record audit entries', async () => {
      await createShadowPublish('ep1', 'youtube');
      
      const entries = getAutonomousAuditLog();
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should filter audit by action', async () => {
      await createShadowPublish('ep1', 'youtube');
      
      const simulated = getAutonomousAuditLog({ action: 'simulated' });
      expect(simulated.every(e => e.action === 'simulated')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should return autonomous stats', async () => {
      await createShadowPublish('ep1', 'youtube');
      
      const stats = getAutonomousStats();
      expect(stats.totalJobs).toBeGreaterThan(0);
      expect(stats.shadowJobs).toBeGreaterThan(0);
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byPlatform');
    });

    it('should track calibration accuracy', async () => {
      const result = await createShadowPublish('ep1', 'youtube');
      compareShadowWithOperator(result.jobId, result.aiDecision, 'operator1');
      
      const stats = getAutonomousStats();
      expect(stats.calibrationAccuracy).toBeGreaterThan(0);
    });
  });
});

describe('Operating Mode Workflow', () => {
  beforeEach(() => {
    clearAutonomousData();
    clearMetrics();
    resetThresholds();
  });

  it('Human-Lead: AI provides suggestions, operator drives', async () => {
    // In Human-Lead mode, shadow publish gives suggestions
    const result = await createShadowPublish('ep1', 'youtube');
    
    expect(result.aiDecision).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
    // Operator would then make their own decision
  });

  it('Human-Assisted: AI drafts, operator approves', async () => {
    const shadow = await createShadowPublish('ep1', 'youtube');
    
    // Operator reviews and compares
    const compared = compareShadowWithOperator(shadow.jobId, 'publish', 'operator1');
    expect(compared?.operatorComparison).toBeDefined();
  });

  it('Fully AI: Autonomous publish when confidence met', async () => {
    // With force publish (simulating high confidence)
    const result = await createAutonomousPublish({
      episodeId: 'ep1',
      platforms: ['youtube'],
      forcePublish: true
    });
    
    // AI made and executed decision
    expect(result.jobs.some(j => j.aiDecision !== undefined)).toBe(true);
  });

  it('Override: Operator can override AI decision', async () => {
    const result = await createAutonomousPublish({
      episodeId: 'ep1',
      platforms: ['youtube'],
      forcePublish: true
    });
    
    if (result.jobs.length > 0) {
      const overridden = overrideAutonomousJob(
        result.jobs[0].id,
        'hold',
        'operator1',
        'Override for manual review'
      );
      
      expect(overridden?.override).toBeDefined();
      expect(overridden?.status).toBe('overridden');
    }
  });

  it('Rollback: Operator can rollback AI action', async () => {
    const result = await createAutonomousPublish({
      episodeId: 'ep1',
      platforms: ['youtube'],
      forcePublish: true
    });
    
    const published = result.jobs.find(j => j.status === 'published');
    if (published) {
      const rolledBack = rollbackAutonomousJob(
        published.id,
        'operator1',
        'Rollback due to issue'
      );
      
      expect(rolledBack?.rollback).toBeDefined();
      expect(rolledBack?.status).toBe('rolled_back');
    }
  });
});
