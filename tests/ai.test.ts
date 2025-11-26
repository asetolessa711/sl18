/**
 * AI Integration Tests
 * Tests for Phase 10: AI Integration with Operating Modes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getModeConfig,
  setModeConfig,
  getGlobalModeConfig,
  setGlobalModeConfig,
  generateScript,
  generateStyling,
  performQCCheck,
  approveTask,
  rejectTask,
  getTask,
  listTasks,
  getAuditLog,
  getModeBehavior,
  getAvailableModes,
  getAIStats,
  clearAllTasks,
  clearModeConfigs
} from '../render-stack/ai/ai-manager';
import {
  DEFAULT_AI_MODE_CONFIG,
  MODE_BEHAVIORS,
  type AIOperatingMode,
  type AIModeConfig
} from '../render-stack/ai/ai.types';

describe('AI Integration', () => {
  beforeEach(() => {
    clearAllTasks();
    clearModeConfigs();
  });

  describe('Mode Configuration', () => {
    it('should return default mode config when none set', () => {
      const config = getModeConfig();
      expect(config.mode).toBe(DEFAULT_AI_MODE_CONFIG.mode);
      expect(config.enabledFeatures).toEqual(DEFAULT_AI_MODE_CONFIG.enabledFeatures);
    });

    it('should set and get workspace-specific mode config', () => {
      const workspaceId = 'workspace-123';
      const updated = setModeConfig(workspaceId, { mode: 'humanLead' });
      
      expect(updated.mode).toBe('humanLead');
      
      const retrieved = getModeConfig(workspaceId);
      expect(retrieved.mode).toBe('humanLead');
    });

    it('should set and get global mode config', () => {
      const updated = setGlobalModeConfig({ mode: 'fullyAI', autonomousPublishing: true });
      
      expect(updated.mode).toBe('fullyAI');
      expect(updated.autonomousPublishing).toBe(true);
      
      const global = getGlobalModeConfig();
      expect(global.mode).toBe('fullyAI');
    });

    it('should inherit from global when workspace config not set', () => {
      setGlobalModeConfig({ mode: 'fullyAI' });
      
      const workspaceConfig = getModeConfig('unset-workspace');
      expect(workspaceConfig.mode).toBe('fullyAI');
    });

    it('should override global with workspace-specific config', () => {
      setGlobalModeConfig({ mode: 'fullyAI' });
      setModeConfig('workspace-456', { mode: 'humanLead' });
      
      expect(getModeConfig('workspace-456').mode).toBe('humanLead');
      expect(getGlobalModeConfig().mode).toBe('fullyAI');
    });
  });

  describe('Mode Behaviors', () => {
    it('should return correct behavior for humanLead', () => {
      const behavior = getModeBehavior('humanLead');
      expect(behavior.name).toBe('Human-Lead');
      expect(behavior.description).toContain('Operators drive');
    });

    it('should return correct behavior for humanAssisted', () => {
      const behavior = getModeBehavior('humanAssisted');
      expect(behavior.name).toBe('Human-Assisted');
      expect(behavior.description).toContain('AI drafts');
    });

    it('should return correct behavior for fullyAI', () => {
      const behavior = getModeBehavior('fullyAI');
      expect(behavior.name).toBe('Fully AI');
      expect(behavior.description).toContain('autonomously');
    });

    it('should list all available modes', () => {
      const modes = getAvailableModes();
      expect(modes).toHaveLength(3);
      expect(modes.map(m => m.mode)).toEqual(['humanLead', 'humanAssisted', 'fullyAI']);
    });
  });

  describe('Script Generation', () => {
    it('should generate script in humanLead mode (requires approval)', async () => {
      setGlobalModeConfig({ mode: 'humanLead' });
      
      const result = await generateScript({
        contentId: 'content-001',
        genre: 'comedy',
        personaCode: 'COMEDIAN_1',
        topic: 'Funny cats',
        targetDuration: 60
      });
      
      expect(result.requestId).toBeDefined();
      expect(result.status).toBe('awaiting_approval');
      expect(result.autoApplied).toBe(false);
      expect(result.requiresApproval).toBe(true);
      expect(result.script).toBeDefined();
      expect(result.script?.segments).toHaveLength(4);
    });

    it('should generate script in fullyAI mode (auto-applied)', async () => {
      setGlobalModeConfig({ mode: 'fullyAI' });
      
      const result = await generateScript({
        contentId: 'content-002',
        genre: 'educational',
        personaCode: 'TEACHER_1',
        topic: 'Math basics',
        targetDuration: 120
      });
      
      expect(result.status).toBe('completed');
      expect(result.autoApplied).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });

    it('should use mode override when provided', async () => {
      setGlobalModeConfig({ mode: 'fullyAI' });
      
      const result = await generateScript({
        contentId: 'content-003',
        genre: 'drama',
        personaCode: 'ACTOR_1',
        topic: 'Love story',
        targetDuration: 180,
        modeOverride: 'humanLead'
      });
      
      expect(result.autoApplied).toBe(false);
      expect(result.requiresApproval).toBe(true);
    });

    it('should include suggestions for improvement', async () => {
      const result = await generateScript({
        contentId: 'content-004',
        genre: 'music',
        personaCode: 'DJ_1',
        topic: 'Electronic beats',
        targetDuration: 90
      });
      
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Styling Generation', () => {
    it('should generate styling suggestions', async () => {
      const result = await generateStyling({
        contentId: 'content-005',
        genre: 'comedy',
        personaCode: 'COMEDIAN_2'
      });
      
      expect(result.styling).toBeDefined();
      expect(result.styling?.captions).toBeDefined();
      expect(result.styling?.colors).toBeDefined();
      expect(result.styling?.typography).toBeDefined();
    });

    it('should apply genre-specific colors', async () => {
      const dramaResult = await generateStyling({
        contentId: 'content-006',
        genre: 'drama',
        personaCode: 'ACTOR_2'
      });
      
      const comedyResult = await generateStyling({
        contentId: 'content-007',
        genre: 'comedy',
        personaCode: 'COMEDIAN_3'
      });
      
      expect(dramaResult.styling?.colors.primary).not.toBe(comedyResult.styling?.colors.primary);
    });

    it('should pre-apply in humanAssisted mode with high confidence', async () => {
      setGlobalModeConfig({ mode: 'humanAssisted', autoApplyThreshold: 0.8 });
      
      const result = await generateStyling({
        contentId: 'content-008',
        genre: 'music',
        personaCode: 'DJ_2'
      });
      
      // Confidence is 0.88 in mock, above threshold
      expect(result.preApplied).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });
  });

  describe('QC Check', () => {
    it('should perform QC check and return results', async () => {
      const result = await performQCCheck({
        contentId: 'content-009',
        genre: 'drama',
        timeline: {
          captions: [
            { id: '1', text: 'Short caption', startTime: 0, endTime: 3 }
          ]
        }
      });
      
      expect(result.requestId).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.riskLevel).toBeDefined();
    });

    it('should flag long captions', async () => {
      const longCaption = 'A'.repeat(200);
      const result = await performQCCheck({
        contentId: 'content-010',
        genre: 'comedy',
        timeline: {
          captions: [
            { id: '1', text: longCaption, startTime: 0, endTime: 5 }
          ]
        }
      });
      
      expect(result.issues.some(i => i.type === 'caption_length')).toBe(true);
    });

    it('should auto-enforce in fullyAI mode', async () => {
      setGlobalModeConfig({ mode: 'fullyAI' });
      
      const result = await performQCCheck({
        contentId: 'content-011',
        genre: 'educational',
        timeline: {}
      });
      
      expect(result.autoEnforced).toBe(true);
      expect(result.requiresHumanDecision).toBe(false);
    });

    it('should require human decision in humanLead mode', async () => {
      setGlobalModeConfig({ mode: 'humanLead' });
      
      const result = await performQCCheck({
        contentId: 'content-012',
        genre: 'news',
        timeline: {}
      });
      
      expect(result.autoEnforced).toBe(false);
      expect(result.requiresHumanDecision).toBe(true);
    });
  });

  describe('Task Management', () => {
    it('should create and retrieve tasks', async () => {
      const result = await generateScript({
        contentId: 'content-013',
        genre: 'comedy',
        personaCode: 'TEST',
        topic: 'Test topic',
        targetDuration: 30
      });
      
      const task = getTask(result.requestId);
      expect(task).toBeDefined();
      expect(task?.type).toBe('script');
      expect(task?.contentId).toBe('content-013');
    });

    it('should list tasks with filters', async () => {
      await generateScript({ contentId: 'c1', genre: 'comedy', personaCode: 'P1', topic: 'T1', targetDuration: 30 });
      await generateStyling({ contentId: 'c2', genre: 'drama', personaCode: 'P2' });
      await performQCCheck({ contentId: 'c3', genre: 'music', timeline: {} });
      
      const allTasks = listTasks();
      expect(allTasks.total).toBe(3);
      
      const scriptTasks = listTasks({ type: 'script' });
      expect(scriptTasks.total).toBe(1);
      
      const stylingTasks = listTasks({ type: 'styling' });
      expect(stylingTasks.total).toBe(1);
    });

    it('should approve pending tasks', async () => {
      setGlobalModeConfig({ mode: 'humanLead' });
      
      const result = await generateScript({
        contentId: 'content-014',
        genre: 'drama',
        personaCode: 'ACTOR',
        topic: 'Approval test',
        targetDuration: 60
      });
      
      expect(result.status).toBe('awaiting_approval');
      
      const approved = approveTask(result.requestId, 'test-user');
      expect(approved?.status).toBe('approved');
      expect(approved?.approvedBy).toBe('test-user');
    });

    it('should reject pending tasks', async () => {
      setGlobalModeConfig({ mode: 'humanLead' });
      
      const result = await generateScript({
        contentId: 'content-015',
        genre: 'comedy',
        personaCode: 'COMIC',
        topic: 'Rejection test',
        targetDuration: 45
      });
      
      const rejected = rejectTask(result.requestId, 'reviewer', 'Not appropriate');
      expect(rejected?.status).toBe('rejected');
      expect(rejected?.rejectedReason).toBe('Not appropriate');
    });

    it('should not approve already completed tasks', async () => {
      setGlobalModeConfig({ mode: 'fullyAI' });
      
      const result = await generateScript({
        contentId: 'content-016',
        genre: 'music',
        personaCode: 'DJ',
        topic: 'Already done',
        targetDuration: 30
      });
      
      expect(result.status).toBe('completed');
      
      const approveResult = approveTask(result.requestId, 'user');
      expect(approveResult).toBeNull();
    });
  });

  describe('Audit Log', () => {
    it('should record task creation', async () => {
      await generateScript({
        contentId: 'content-017',
        genre: 'documentary',
        personaCode: 'NARRATOR',
        topic: 'Audit test',
        targetDuration: 60
      });
      
      const log = getAuditLog({ action: 'created' });
      expect(log.length).toBeGreaterThan(0);
      expect(log[0].action).toBe('created');
    });

    it('should record task approval', async () => {
      setGlobalModeConfig({ mode: 'humanLead' });
      
      const result = await generateScript({
        contentId: 'content-018',
        genre: 'lifestyle',
        personaCode: 'HOST',
        topic: 'Lifestyle tips',
        targetDuration: 90
      });
      
      approveTask(result.requestId, 'approver-1');
      
      const log = getAuditLog({ taskId: result.requestId, action: 'approved' });
      expect(log.length).toBe(1);
      expect(log[0].actor).toBe('approver-1');
    });

    it('should filter audit log by actor', async () => {
      setGlobalModeConfig({ mode: 'humanLead' });
      
      const r1 = await generateScript({ contentId: 'c19', genre: 'news', personaCode: 'P1', topic: 'T1', targetDuration: 30 });
      const r2 = await generateScript({ contentId: 'c20', genre: 'gaming', personaCode: 'P2', topic: 'T2', targetDuration: 30 });
      
      approveTask(r1.requestId, 'alice');
      approveTask(r2.requestId, 'bob');
      
      const aliceLog = getAuditLog({ actor: 'alice' });
      expect(aliceLog.length).toBe(1);
      
      const bobLog = getAuditLog({ actor: 'bob' });
      expect(bobLog.length).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should return empty stats initially', () => {
      const stats = getAIStats();
      expect(stats.totalTasks).toBe(0);
    });

    it('should track tasks by type and status', async () => {
      setGlobalModeConfig({ mode: 'humanAssisted' });
      
      await generateScript({ contentId: 'c21', genre: 'comedy', personaCode: 'P1', topic: 'T1', targetDuration: 30 });
      await generateStyling({ contentId: 'c22', genre: 'drama', personaCode: 'P2' });
      await performQCCheck({ contentId: 'c23', genre: 'music', timeline: {} });
      
      const stats = getAIStats();
      expect(stats.totalTasks).toBe(3);
      expect(stats.byType.script).toBe(1);
      expect(stats.byType.styling).toBe(1);
      expect(stats.byType.qc).toBe(1);
    });

    it('should track by mode', async () => {
      setGlobalModeConfig({ mode: 'humanLead' });
      await generateScript({ contentId: 'c24', genre: 'comedy', personaCode: 'P1', topic: 'T1', targetDuration: 30 });
      
      setGlobalModeConfig({ mode: 'fullyAI' });
      await generateScript({ contentId: 'c25', genre: 'drama', personaCode: 'P2', topic: 'T2', targetDuration: 30 });
      
      const stats = getAIStats();
      expect(stats.byMode.humanLead).toBe(1);
      expect(stats.byMode.fullyAI).toBe(1);
    });

    it('should calculate auto-approval rate', async () => {
      setGlobalModeConfig({ mode: 'fullyAI' });
      await generateScript({ contentId: 'c26', genre: 'comedy', personaCode: 'P1', topic: 'T1', targetDuration: 30 });
      await generateScript({ contentId: 'c27', genre: 'drama', personaCode: 'P2', topic: 'T2', targetDuration: 30 });
      
      const stats = getAIStats();
      expect(stats.autoApprovalRate).toBe(1); // All auto-applied in fullyAI mode
    });
  });

  describe('Integration with Workspaces', () => {
    it('should use workspace-specific mode for AI operations', async () => {
      // Set different modes for different workspaces
      setModeConfig('workspace-drama', { mode: 'humanLead' });
      setModeConfig('workspace-news', { mode: 'fullyAI' });
      
      const dramaResult = await generateScript({
        contentId: 'c28',
        genre: 'drama',
        personaCode: 'ACTOR',
        topic: 'Drama content',
        targetDuration: 120,
        workspaceId: 'workspace-drama'
      });
      
      const newsResult = await generateScript({
        contentId: 'c29',
        genre: 'news',
        personaCode: 'ANCHOR',
        topic: 'Breaking news',
        targetDuration: 60,
        workspaceId: 'workspace-news'
      });
      
      expect(dramaResult.autoApplied).toBe(false);
      expect(newsResult.autoApplied).toBe(true);
    });
  });
});
