/**
 * Autonomous Mode Configuration Tests
 * Tests for autonomous.config.json validation and integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Load the configuration file
const configPath = path.join(__dirname, '..', 'render-stack', 'config', 'autonomous.config.json');

describe('Autonomous Mode Configuration', () => {
  let config: any;

  beforeEach(() => {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configContent);
  });

  describe('Configuration File Structure', () => {
    it('should have autonomousConfig root property', () => {
      expect(config).toHaveProperty('autonomousConfig');
    });

    it('should have a valid defaultMode', () => {
      expect(config.autonomousConfig.defaultMode).toBe('humanAssisted');
    });

    it('should define all three operating modes', () => {
      const modes = config.autonomousConfig.modes;
      expect(modes).toHaveProperty('humanLead');
      expect(modes).toHaveProperty('humanAssisted');
      expect(modes).toHaveProperty('fullyAI');
    });
  });

  describe('Human-Lead Mode Configuration', () => {
    it('should have correct humanLead mode settings', () => {
      const mode = config.autonomousConfig.modes.humanLead;
      expect(mode.description).toBe('Operator drives, AI suggests');
      expect(mode.scriptGeneration).toBe('suggest-only');
      expect(mode.styling).toBe('suggest-only');
      expect(mode.qcChecks).toBe('flag-only');
      expect(mode.publishing).toBe('manual');
    });
  });

  describe('Human-Assisted Mode Configuration', () => {
    it('should have correct humanAssisted mode settings', () => {
      const mode = config.autonomousConfig.modes.humanAssisted;
      expect(mode.description).toBe('AI drafts, operator approves');
      expect(mode.scriptGeneration).toBe('draft-with-approval');
      expect(mode.styling).toBe('pre-fill-with-confirmation');
      expect(mode.qcChecks).toBe('recommend-fixes');
      expect(mode.publishing).toBe('operator-confirm');
    });
  });

  describe('Fully AI Mode Configuration', () => {
    it('should have correct fullyAI mode settings', () => {
      const mode = config.autonomousConfig.modes.fullyAI;
      expect(mode.description).toBe('AI auto-generates and publishes');
      expect(mode.scriptGeneration).toBe('auto-apply');
      expect(mode.styling).toBe('auto-apply');
      expect(mode.qcChecks).toBe('auto-enforce');
      expect(mode.publishing).toBe('auto-publish');
    });

    it('should have confidence thresholds for fullyAI mode', () => {
      const thresholds = config.autonomousConfig.modes.fullyAI.confidenceThresholds;
      expect(thresholds.qcPassRate).toBe(0.95);
      expect(thresholds.publishErrorRate).toBe(0.01);
      expect(thresholds.aiAccuracy).toBe(0.9);
    });

    it('should require QC pass rate >= 95%', () => {
      const qcPassRate = config.autonomousConfig.modes.fullyAI.confidenceThresholds.qcPassRate;
      expect(qcPassRate).toBeGreaterThanOrEqual(0.95);
    });

    it('should require publish error rate < 1%', () => {
      const errorRate = config.autonomousConfig.modes.fullyAI.confidenceThresholds.publishErrorRate;
      expect(errorRate).toBeLessThanOrEqual(0.01);
    });
  });

  describe('Confidence Settings', () => {
    it('should have confidence settings defined', () => {
      expect(config.autonomousConfig.confidenceSettings).toBeDefined();
    });

    it('should have minimum samples requirement', () => {
      expect(config.autonomousConfig.confidenceSettings.minimumSamples).toBe(50);
    });

    it('should have rolling window in days', () => {
      expect(config.autonomousConfig.confidenceSettings.rollingWindowDays).toBe(30);
    });

    it('should have default thresholds matching fullyAI thresholds', () => {
      const defaults = config.autonomousConfig.confidenceSettings.defaultThresholds;
      const fullyAI = config.autonomousConfig.modes.fullyAI.confidenceThresholds;
      expect(defaults.qcPassRate).toBe(fullyAI.qcPassRate);
      expect(defaults.publishErrorRate).toBe(fullyAI.publishErrorRate);
    });
  });

  describe('Shadow Publishing Configuration', () => {
    it('should have shadow publishing enabled', () => {
      expect(config.autonomousConfig.shadowPublishing.enabled).toBe(true);
    });

    it('should retain shadow logs for 30 days', () => {
      expect(config.autonomousConfig.shadowPublishing.logRetentionDays).toBe(30);
    });

    it('should define comparison metrics', () => {
      const metrics = config.autonomousConfig.shadowPublishing.comparisonMetrics;
      expect(metrics).toContain('publishDecision');
      expect(metrics).toContain('metadataMatch');
      expect(metrics).toContain('timingAccuracy');
    });
  });

  describe('Platform Support Configuration', () => {
    it('should have platform support defined', () => {
      expect(config.autonomousConfig.platformSupport).toBeDefined();
    });

    it('should support autonomous YouTube publishing', () => {
      expect(config.autonomousConfig.platformSupport.youtube.autonomous).toBe(true);
      expect(config.autonomousConfig.platformSupport.youtube.apiIntegration).toBe(true);
    });

    it('should support autonomous Facebook publishing', () => {
      expect(config.autonomousConfig.platformSupport.facebook.autonomous).toBe(true);
      expect(config.autonomousConfig.platformSupport.facebook.apiIntegration).toBe(true);
    });

    it('should support autonomous Instagram publishing', () => {
      expect(config.autonomousConfig.platformSupport.instagram.autonomous).toBe(true);
      expect(config.autonomousConfig.platformSupport.instagram.apiIntegration).toBe(true);
    });

    it('should NOT support autonomous TikTok publishing', () => {
      expect(config.autonomousConfig.platformSupport.tiktok.autonomous).toBe(false);
      expect(config.autonomousConfig.platformSupport.tiktok.apiIntegration).toBe(false);
    });

    it('should have TikTok note about manual export', () => {
      expect(config.autonomousConfig.platformSupport.tiktok.note).toContain('Manual export only');
    });
  });

  describe('Override Configuration', () => {
    it('should have override enabled', () => {
      expect(config.autonomousConfig.override.enabled).toBe(true);
    });

    it('should have rollback endpoint defined', () => {
      expect(config.autonomousConfig.override.rollbackEndpoint).toBe('/api/publish/rollback/:jobId');
    });

    it('should have override endpoint defined', () => {
      expect(config.autonomousConfig.override.overrideEndpoint).toBe('/api/ai/publish/auto/:id/override');
    });

    it('should require reason for override', () => {
      expect(config.autonomousConfig.override.requireReason).toBe(true);
    });
  });

  describe('Audit Configuration', () => {
    it('should have audit enabled', () => {
      expect(config.autonomousConfig.audit.enabled).toBe(true);
    });

    it('should have audit log endpoint', () => {
      expect(config.autonomousConfig.audit.logEndpoint).toBe('/api/ai/audit');
    });

    it('should retain audit logs for 90 days', () => {
      expect(config.autonomousConfig.audit.retentionDays).toBe(90);
    });

    it('should have detailed log level', () => {
      expect(config.autonomousConfig.audit.logLevel).toBe('detailed');
    });
  });

  describe('Feature Flags', () => {
    it('should have feature flags defined', () => {
      expect(config.autonomousConfig.featureFlags).toBeDefined();
    });

    it('should have autonomous publishing enabled', () => {
      expect(config.autonomousConfig.featureFlags.enableAutonomousPublishing).toBe(true);
    });

    it('should have shadow publishing enabled', () => {
      expect(config.autonomousConfig.featureFlags.enableShadowPublishing).toBe(true);
    });

    it('should have confidence tracking enabled', () => {
      expect(config.autonomousConfig.featureFlags.enableConfidenceTracking).toBe(true);
    });

    it('should have rollback enabled', () => {
      expect(config.autonomousConfig.featureFlags.enableRollback).toBe(true);
    });

    it('should have override enabled', () => {
      expect(config.autonomousConfig.featureFlags.enableOverride).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should be valid JSON', () => {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      expect(() => JSON.parse(configContent)).not.toThrow();
    });

    it('should not have undefined values', () => {
      const checkUndefined = (obj: any, path: string = ''): void => {
        for (const key in obj) {
          const value = obj[key];
          const currentPath = path ? `${path}.${key}` : key;
          if (value === undefined) {
            throw new Error(`Undefined value at ${currentPath}`);
          }
          if (typeof value === 'object' && value !== null) {
            checkUndefined(value, currentPath);
          }
        }
      };
      expect(() => checkUndefined(config)).not.toThrow();
    });

    it('should have all threshold values between 0 and 1', () => {
      const thresholds = config.autonomousConfig.modes.fullyAI.confidenceThresholds;
      for (const [key, value] of Object.entries(thresholds)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });
  });
});

describe('Configuration Loading', () => {
  it('should be loadable as a module', async () => {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    expect(config.autonomousConfig).toBeDefined();
  });

  it('should have consistent mode behaviors', () => {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    const modes = config.autonomousConfig.modes;
    
    // Verify mode progression (more autonomy from humanLead -> humanAssisted -> fullyAI)
    expect(modes.humanLead.publishing).toBe('manual');
    expect(modes.humanAssisted.publishing).toBe('operator-confirm');
    expect(modes.fullyAI.publishing).toBe('auto-publish');
  });
});
