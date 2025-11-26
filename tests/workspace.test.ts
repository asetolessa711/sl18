/**
 * Workspace Tests
 * Tests for Phase 9: Creative Workspaces
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WorkspaceManager,
  ContentGenre,
  CreateWorkspaceRequest,
  DEFAULT_GENRE_QC_RULES,
  DEFAULT_WORKSPACE_QC_CONFIG
} from '../render-stack/workspaces';

describe('Workspace Types', () => {
  it('should export DEFAULT_GENRE_QC_RULES for all genres', () => {
    const genres: ContentGenre[] = [
      'drama', 'music', 'comedy', 'educational',
      'documentary', 'news', 'lifestyle', 'gaming', 'custom'
    ];
    
    for (const genre of genres) {
      expect(DEFAULT_GENRE_QC_RULES).toHaveProperty(genre);
    }
  });

  it('should export DEFAULT_WORKSPACE_QC_CONFIG with expected fields', () => {
    expect(DEFAULT_WORKSPACE_QC_CONFIG).toHaveProperty('maxCaptionLength');
    expect(DEFAULT_WORKSPACE_QC_CONFIG).toHaveProperty('maxShortFormDuration');
    expect(DEFAULT_WORKSPACE_QC_CONFIG).toHaveProperty('maxLongFormDuration');
    expect(DEFAULT_WORKSPACE_QC_CONFIG).toHaveProperty('warningKeywords');
    expect(DEFAULT_WORKSPACE_QC_CONFIG).toHaveProperty('genreRules');
    expect(DEFAULT_WORKSPACE_QC_CONFIG).toHaveProperty('autoApprove');
    expect(DEFAULT_WORKSPACE_QC_CONFIG).toHaveProperty('requiredApprovals');
  });

  it('should have drama genre rules with pacing thresholds', () => {
    const dramaRules = DEFAULT_GENRE_QC_RULES.drama;
    expect(dramaRules).toHaveProperty('drama');
    expect(dramaRules.drama).toHaveProperty('minSceneDuration');
    expect(dramaRules.drama).toHaveProperty('maxSceneDuration');
    expect(dramaRules.drama).toHaveProperty('emotionalBeatsPerMinute');
    expect(dramaRules.drama).toHaveProperty('dramaticPauseDuration');
  });

  it('should have music genre rules with loudness normalization', () => {
    const musicRules = DEFAULT_GENRE_QC_RULES.music;
    expect(musicRules).toHaveProperty('music');
    expect(musicRules.music).toHaveProperty('targetLoudness');
    expect(musicRules.music).toHaveProperty('maxTruePeak');
    expect(musicRules.music).toHaveProperty('loudnessRange');
    expect(musicRules.music).toHaveProperty('normalizeEnabled');
    expect(musicRules.music).toHaveProperty('beatSensitivity');
  });

  it('should have comedy genre rules with timing checks', () => {
    const comedyRules = DEFAULT_GENRE_QC_RULES.comedy;
    expect(comedyRules).toHaveProperty('comedy');
    expect(comedyRules.comedy).toHaveProperty('punchlinePause');
    expect(comedyRules.comedy).toHaveProperty('maxSetupDuration');
    expect(comedyRules.comedy).toHaveProperty('minJokeSpacing');
    expect(comedyRules.comedy).toHaveProperty('detectLaughTrack');
  });

  it('should have educational genre rules with concept pacing', () => {
    const educationalRules = DEFAULT_GENRE_QC_RULES.educational;
    expect(educationalRules).toHaveProperty('educational');
    expect(educationalRules.educational).toHaveProperty('maxConceptsPerMinute');
    expect(educationalRules.educational).toHaveProperty('minExplanationDuration');
    expect(educationalRules.educational).toHaveProperty('recapFrequency');
    expect(educationalRules.educational).toHaveProperty('detectVisualAids');
  });
});

describe('WorkspaceManager', () => {
  beforeEach(() => {
    // Clear all workspaces before each test
    WorkspaceManager.clear();
  });

  describe('create()', () => {
    it('should create a workspace with required fields', () => {
      const request: CreateWorkspaceRequest = {
        name: 'Drama Series',
        description: 'Workspace for dramatic content',
        genre: 'drama'
      };

      const workspace = WorkspaceManager.create(request);

      expect(workspace.id).toMatch(/^ws_\d+_[a-z0-9]+$/);
      expect(workspace.name).toBe('Drama Series');
      expect(workspace.description).toBe('Workspace for dramatic content');
      expect(workspace.genre).toBe('drama');
      expect(workspace.status).toBe('active');
      expect(workspace.createdBy).toBe('system');
      expect(workspace.personaTemplates.length).toBeGreaterThan(0);
    });

    it('should create a workspace with custom persona templates', () => {
      const request: CreateWorkspaceRequest = {
        name: 'Music Videos',
        description: 'Music video workspace',
        genre: 'music',
        personaTemplates: [{
          templateId: 'custom-template',
          templateName: 'Custom Music Style',
          primaryColor: '#FF0000',
          secondaryColor: '#0000FF',
          fontFamily: 'Arial',
          captionPosition: 'top-center',
          motionPreset: 'ken-burns',
          transitionPreset: 'crossfade',
          captionStyle: {
            fontFamily: 'Arial',
            fontSize: 48,
            fontWeight: 'bold',
            textColor: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            textShadow: true,
            position: 'bottom-center',
            animation: 'fade',
            maxCharsPerLine: 40,
            maxLines: 2
          },
          overlays: [],
          transitions: {
            defaultTransition: 'fade',
            transitionDuration: 0.5,
            sceneChangeTransition: 'crossfade',
            introTransition: 'fade',
            outroTransition: 'fade'
          },
          audio: {
            musicVolume: 0.8,
            voiceVolume: 1.0,
            sfxVolume: 0.5,
            autoDucking: false,
            duckingReduction: 10,
            musicFadeDuration: 2
          }
        }]
      };

      const workspace = WorkspaceManager.create(request);

      expect(workspace.personaTemplates).toHaveLength(1);
      expect(workspace.personaTemplates[0].templateName).toBe('Custom Music Style');
    });

    it('should apply genre-specific QC rules', () => {
      const dramaWorkspace = WorkspaceManager.create({
        name: 'Drama',
        description: 'Drama workspace',
        genre: 'drama'
      });

      expect(dramaWorkspace.qcConfig.genreRules).toHaveProperty('drama');
      expect(dramaWorkspace.qcConfig.genreRules.drama?.minSceneDuration).toBe(5);

      const musicWorkspace = WorkspaceManager.create({
        name: 'Music',
        description: 'Music workspace',
        genre: 'music'
      });

      expect(musicWorkspace.qcConfig.genreRules).toHaveProperty('music');
      expect(musicWorkspace.qcConfig.genreRules.music?.targetLoudness).toBe(-14);
    });

    it('should set default platform settings', () => {
      const workspace = WorkspaceManager.create({
        name: 'Test',
        description: 'Test workspace',
        genre: 'comedy'
      });

      expect(workspace.platformSettings).toHaveLength(4);
      
      const youtube = workspace.platformSettings.find(p => p.platform === 'youtube');
      expect(youtube).toBeDefined();
      expect(youtube?.enabled).toBe(true);

      const tiktok = workspace.platformSettings.find(p => p.platform === 'tiktok');
      expect(tiktok).toBeDefined();
      expect(tiktok?.renderProfile).toBe('vertical_1080x1920');
    });
  });

  describe('get()', () => {
    it('should retrieve an existing workspace', () => {
      const created = WorkspaceManager.create({
        name: 'Test',
        description: 'Test',
        genre: 'drama'
      });

      const retrieved = WorkspaceManager.get(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent workspace', () => {
      const result = WorkspaceManager.get('ws_nonexistent_123');
      expect(result).toBeNull();
    });
  });

  describe('update()', () => {
    it('should update workspace fields', () => {
      const workspace = WorkspaceManager.create({
        name: 'Original',
        description: 'Original description',
        genre: 'drama'
      });

      const updated = WorkspaceManager.update(workspace.id, {
        name: 'Updated',
        description: 'Updated description',
        status: 'draft'
      });

      expect(updated?.name).toBe('Updated');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.status).toBe('draft');
      expect(updated?.genre).toBe('drama'); // Unchanged
    });

    it('should return null for non-existent workspace', () => {
      const result = WorkspaceManager.update('ws_nonexistent_123', {
        name: 'New Name'
      });
      expect(result).toBeNull();
    });
  });

  describe('delete()', () => {
    it('should delete an existing workspace', () => {
      const workspace = WorkspaceManager.create({
        name: 'Test',
        description: 'Test',
        genre: 'drama'
      });

      expect(WorkspaceManager.delete(workspace.id)).toBe(true);
      expect(WorkspaceManager.get(workspace.id)).toBeNull();
    });

    it('should return false for non-existent workspace', () => {
      expect(WorkspaceManager.delete('ws_nonexistent_123')).toBe(false);
    });
  });

  describe('list()', () => {
    beforeEach(() => {
      // Create test workspaces
      WorkspaceManager.create({ name: 'Drama 1', description: 'D1', genre: 'drama' });
      WorkspaceManager.create({ name: 'Drama 2', description: 'D2', genre: 'drama' });
      WorkspaceManager.create({ name: 'Music 1', description: 'M1', genre: 'music' });
      WorkspaceManager.create({ name: 'Comedy 1', description: 'C1', genre: 'comedy', tags: ['funny'] });
    });

    it('should list all workspaces', () => {
      const result = WorkspaceManager.list();
      expect(result.total).toBe(4);
      expect(result.workspaces).toHaveLength(4);
    });

    it('should filter by genre', () => {
      const result = WorkspaceManager.list({ genre: 'drama' });
      expect(result.total).toBe(2);
      expect(result.workspaces.every(w => w.genre === 'drama')).toBe(true);
    });

    it('should filter by tags', () => {
      const result = WorkspaceManager.list({ tags: ['funny'] });
      expect(result.total).toBe(1);
      expect(result.workspaces[0].name).toBe('Comedy 1');
    });

    it('should search by name', () => {
      const result = WorkspaceManager.list({ search: 'Drama' });
      expect(result.total).toBe(2);
    });

    it('should support pagination', () => {
      const result = WorkspaceManager.list({ limit: 2, offset: 0 });
      expect(result.workspaces).toHaveLength(2);
      expect(result.total).toBe(4);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(0);
    });
  });

  describe('preview()', () => {
    it('should generate a workspace preview', () => {
      const workspace = WorkspaceManager.create({
        name: 'Test',
        description: 'Test',
        genre: 'drama'
      });

      const preview = WorkspaceManager.preview(workspace.id, {
        sampleText: 'Hello, world!'
      });

      expect(preview).not.toBeNull();
      expect(preview?.workspaceId).toBe(workspace.id);
      expect(preview?.styledTimeline.sampleCaption).toBe('Hello, world!');
      expect(preview?.qcRulesSummary.genre).toBe('drama');
    });

    it('should return null for non-existent workspace', () => {
      const result = WorkspaceManager.preview('ws_nonexistent_123');
      expect(result).toBeNull();
    });
  });

  describe('addTemplate() / removeTemplate()', () => {
    it('should add a persona template', () => {
      const workspace = WorkspaceManager.create({
        name: 'Test',
        description: 'Test',
        genre: 'drama'
      });

      const template = WorkspaceManager.addTemplate(workspace.id, {
        templateName: 'New Template',
        primaryColor: '#123456',
        secondaryColor: '#654321',
        fontFamily: 'Roboto',
        captionPosition: 'top-center',
        motionPreset: 'none',
        transitionPreset: 'none',
        captionStyle: {
          fontFamily: 'Roboto',
          fontSize: 36,
          fontWeight: 'normal',
          textColor: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          textShadow: false,
          position: 'top-center',
          animation: 'none',
          maxCharsPerLine: 50,
          maxLines: 3
        },
        overlays: [],
        transitions: {
          defaultTransition: 'none',
          transitionDuration: 0,
          sceneChangeTransition: 'none',
          introTransition: 'none',
          outroTransition: 'none'
        },
        audio: {
          musicVolume: 0.5,
          voiceVolume: 1.0,
          sfxVolume: 0.5,
          autoDucking: true,
          duckingReduction: 10,
          musicFadeDuration: 2
        }
      });

      expect(template).not.toBeNull();
      expect(template?.templateId).toBeDefined();
      expect(template?.templateName).toBe('New Template');

      const updated = WorkspaceManager.get(workspace.id);
      expect(updated?.personaTemplates).toHaveLength(2);
    });

    it('should remove a persona template', () => {
      const workspace = WorkspaceManager.create({
        name: 'Test',
        description: 'Test',
        genre: 'drama'
      });

      // Add a second template
      WorkspaceManager.addTemplate(workspace.id, {
        templateName: 'Second Template',
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        fontFamily: 'Arial',
        captionPosition: 'bottom-center',
        motionPreset: 'none',
        transitionPreset: 'none',
        captionStyle: {
          fontFamily: 'Arial',
          fontSize: 36,
          fontWeight: 'normal',
          textColor: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          textShadow: false,
          position: 'bottom-center',
          animation: 'none',
          maxCharsPerLine: 40,
          maxLines: 2
        },
        overlays: [],
        transitions: {
          defaultTransition: 'none',
          transitionDuration: 0,
          sceneChangeTransition: 'none',
          introTransition: 'none',
          outroTransition: 'none'
        },
        audio: {
          musicVolume: 0.5,
          voiceVolume: 1.0,
          sfxVolume: 0.5,
          autoDucking: true,
          duckingReduction: 10,
          musicFadeDuration: 2
        }
      });

      const ws = WorkspaceManager.get(workspace.id);
      expect(ws?.personaTemplates).toHaveLength(2);

      const secondTemplateId = ws?.personaTemplates[1].templateId;
      expect(WorkspaceManager.removeTemplate(workspace.id, secondTemplateId!)).toBe(true);

      const wsAfter = WorkspaceManager.get(workspace.id);
      expect(wsAfter?.personaTemplates).toHaveLength(1);
    });

    it('should not remove the last template', () => {
      const workspace = WorkspaceManager.create({
        name: 'Test',
        description: 'Test',
        genre: 'drama'
      });

      const templateId = workspace.personaTemplates[0].templateId;
      expect(WorkspaceManager.removeTemplate(workspace.id, templateId)).toBe(false);
    });
  });

  describe('clone()', () => {
    it('should clone a workspace', () => {
      const original = WorkspaceManager.create({
        name: 'Original',
        description: 'Original workspace',
        genre: 'drama',
        tags: ['test']
      });

      const cloned = WorkspaceManager.clone(original.id, 'Cloned Workspace');

      expect(cloned).not.toBeNull();
      expect(cloned?.id).not.toBe(original.id);
      expect(cloned?.name).toBe('Cloned Workspace');
      expect(cloned?.genre).toBe('drama');
      expect(cloned?.status).toBe('draft');
      expect(cloned?.personaTemplates[0].templateId).not.toBe(original.personaTemplates[0].templateId);
    });

    it('should return null for non-existent workspace', () => {
      const result = WorkspaceManager.clone('ws_nonexistent_123', 'Clone');
      expect(result).toBeNull();
    });
  });

  describe('applyQCRules()', () => {
    it('should check drama pacing rules', () => {
      const workspace = WorkspaceManager.create({
        name: 'Drama',
        description: 'Drama workspace',
        genre: 'drama'
      });

      const result = WorkspaceManager.applyQCRules(workspace.id, {
        duration: 300,
        captions: [{ text: 'Test', duration: 5 }],
        sceneDurations: [10, 30, 200] // 200s exceeds max of 120s
      });

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.genreChecks.dramaPacing).toBe(false);
    });

    it('should check music loudness rules', () => {
      const workspace = WorkspaceManager.create({
        name: 'Music',
        description: 'Music workspace',
        genre: 'music'
      });

      const result = WorkspaceManager.applyQCRules(workspace.id, {
        duration: 180,
        captions: [],
        loudnessData: {
          integrated: -14,
          truePeak: -1
        }
      });

      expect(result.passed).toBe(true);
      expect(result.genreChecks.musicLoudness).toBe(true);
      expect(result.genreChecks.musicTruePeak).toBe(true);
    });

    it('should fail loudness check with bad true peak', () => {
      const workspace = WorkspaceManager.create({
        name: 'Music',
        description: 'Music workspace',
        genre: 'music'
      });

      const result = WorkspaceManager.applyQCRules(workspace.id, {
        duration: 180,
        captions: [],
        loudnessData: {
          integrated: -14,
          truePeak: 0 // Exceeds max of -1 dBTP
        }
      });

      expect(result.passed).toBe(false);
      expect(result.genreChecks.musicTruePeak).toBe(false);
    });

    it('should check educational pacing rules', () => {
      const workspace = WorkspaceManager.create({
        name: 'Educational',
        description: 'Educational workspace',
        genre: 'educational'
      });

      // 10 captions in 60 seconds = 10/min (exceeds max of 3/min)
      const result = WorkspaceManager.applyQCRules(workspace.id, {
        duration: 60,
        captions: Array(10).fill({ text: 'Concept', duration: 5 })
      });

      expect(result.genreChecks.educationalPacing).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should pass with valid data', () => {
      const workspace = WorkspaceManager.create({
        name: 'Drama',
        description: 'Drama workspace',
        genre: 'drama'
      });

      const result = WorkspaceManager.applyQCRules(workspace.id, {
        duration: 300,
        captions: [{ text: 'Test', duration: 5 }],
        sceneDurations: [10, 30, 60, 90]
      });

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('utility methods', () => {
    it('should return all workspace IDs', () => {
      WorkspaceManager.create({ name: 'A', description: 'A', genre: 'drama' });
      WorkspaceManager.create({ name: 'B', description: 'B', genre: 'music' });

      const ids = WorkspaceManager.getAllIds();
      expect(ids).toHaveLength(2);
      expect(ids.every(id => id.startsWith('ws_'))).toBe(true);
    });

    it('should return workspace count', () => {
      expect(WorkspaceManager.count()).toBe(0);

      WorkspaceManager.create({ name: 'A', description: 'A', genre: 'drama' });
      WorkspaceManager.create({ name: 'B', description: 'B', genre: 'music' });

      expect(WorkspaceManager.count()).toBe(2);
    });

    it('should clear all workspaces', () => {
      WorkspaceManager.create({ name: 'A', description: 'A', genre: 'drama' });
      WorkspaceManager.create({ name: 'B', description: 'B', genre: 'music' });

      expect(WorkspaceManager.count()).toBe(2);

      WorkspaceManager.clear();

      expect(WorkspaceManager.count()).toBe(0);
    });
  });
});

describe('Genre-Specific Features', () => {
  beforeEach(() => {
    WorkspaceManager.clear();
  });

  it('should create drama workspace with correct default render profile', () => {
    const workspace = WorkspaceManager.create({
      name: 'Drama',
      description: 'Drama content',
      genre: 'drama'
    });

    expect(workspace.defaultRenderProfile).toBe('horizontal_1920x1080');
  });

  it('should create music workspace with vertical render profile', () => {
    const workspace = WorkspaceManager.create({
      name: 'Music',
      description: 'Music content',
      genre: 'music'
    });

    expect(workspace.defaultRenderProfile).toBe('vertical_1080x1920');
  });

  it('should create comedy workspace with vertical render profile', () => {
    const workspace = WorkspaceManager.create({
      name: 'Comedy',
      description: 'Comedy content',
      genre: 'comedy'
    });

    expect(workspace.defaultRenderProfile).toBe('vertical_1080x1920');
  });

  it('should create custom workspace with empty genre rules', () => {
    const workspace = WorkspaceManager.create({
      name: 'Custom',
      description: 'Custom content',
      genre: 'custom'
    });

    expect(workspace.qcConfig.genreRules).toEqual({});
  });
});
