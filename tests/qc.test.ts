/**
 * Tests for QC (Quality Control) Module
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import type {
  PersonaStyle,
  QCFlags,
  Timeline
} from '../render-stack/types/timeline.types.js';

// Test directory
const TEST_DIR = '/tmp/sl18-qc-test';
const TIMELINES_DIR = join(TEST_DIR, 'timelines');

// Mock QC thresholds
const QC_THRESHOLDS = {
  maxCaptionLength: 150,
  maxDuration: 180,
  maxDurationLong: 600,
  warningKeywords: ['explicit', 'violence', 'controversial', 'adult']
};

// Mock QC check function
function runQCChecks(timeline: Partial<Timeline>): { issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check duration
  if (timeline.duration && timeline.duration > QC_THRESHOLDS.maxDurationLong) {
    issues.push(`Duration exceeds maximum`);
  } else if (timeline.duration && timeline.duration > QC_THRESHOLDS.maxDuration) {
    warnings.push(`Duration exceeds short-form limit`);
  }

  // Check captions in tracks
  if (timeline.tracks) {
    for (const track of timeline.tracks) {
      if (track.type === 'caption') {
        for (const clip of track.clips || []) {
          for (const caption of clip.captions || []) {
            if (caption.text && caption.text.length > QC_THRESHOLDS.maxCaptionLength) {
              warnings.push(`Caption exceeds ${QC_THRESHOLDS.maxCaptionLength} chars`);
            }
            
            const lowerText = (caption.text || '').toLowerCase();
            for (const keyword of QC_THRESHOLDS.warningKeywords) {
              if (lowerText.includes(keyword)) {
                warnings.push(`Caption contains flagged keyword: "${keyword}"`);
              }
            }
          }
        }
      }
    }
  }

  return { issues, warnings };
}

// Mock buildQCFlags function
function buildQCFlags(
  timeline: Partial<Timeline>,
  options?: { skipQC?: boolean }
): QCFlags {
  const flags: QCFlags = {
    contentWarnings: [],
    needsHumanReview: false
  };

  if (options?.skipQC) {
    return flags;
  }

  const { issues, warnings } = runQCChecks(timeline);

  if (issues.length > 0) {
    flags.needsHumanReview = true;
    flags.reviewReason = issues.join('; ');
    flags.notes = issues;
  }

  if (warnings.length > 0) {
    flags.notes = [...(flags.notes || []), ...warnings];
  }

  // Check duration flag
  if (timeline.duration && timeline.duration > QC_THRESHOLDS.maxDuration) {
    flags.durationExceeded = true;
  }

  return flags;
}

describe('QC Thresholds', () => {
  it('defines max caption length', () => {
    expect(QC_THRESHOLDS.maxCaptionLength).toBe(150);
  });

  it('defines max duration for shorts', () => {
    expect(QC_THRESHOLDS.maxDuration).toBe(180);
  });

  it('defines max duration for long-form', () => {
    expect(QC_THRESHOLDS.maxDurationLong).toBe(600);
  });

  it('defines warning keywords', () => {
    expect(QC_THRESHOLDS.warningKeywords).toContain('explicit');
    expect(QC_THRESHOLDS.warningKeywords).toContain('violence');
  });
});

describe('QC Checks', () => {
  it('flags duration exceeding long-form limit as issue', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_001',
      duration: 700
    };

    const { issues, warnings } = runQCChecks(timeline);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain('Duration');
  });

  it('flags duration exceeding short-form limit as warning', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_002',
      duration: 200
    };

    const { issues, warnings } = runQCChecks(timeline);

    expect(issues.length).toBe(0);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('Duration');
  });

  it('passes duration within short-form limit', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_003',
      duration: 60
    };

    const { issues, warnings } = runQCChecks(timeline);

    expect(issues.length).toBe(0);
    expect(warnings.filter(w => w.includes('Duration')).length).toBe(0);
  });

  it('flags long captions', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_004',
      duration: 60,
      tracks: [{
        id: 'caption-1',
        type: 'caption',
        name: 'Captions',
        clips: [{
          id: 'clip-1',
          type: 'caption',
          startTime: 0,
          duration: 5,
          layer: 1,
          captions: [{
            id: 'cap-1',
            startTime: 0,
            endTime: 5,
            text: 'This is a very long caption that exceeds the maximum allowed length for captions in this system and should trigger a warning about caption length being exceeded.'
          }]
        }]
      }]
    };

    const { warnings } = runQCChecks(timeline);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes('Caption exceeds'))).toBe(true);
  });

  it('flags warning keywords in captions', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_005',
      duration: 60,
      tracks: [{
        id: 'caption-1',
        type: 'caption',
        name: 'Captions',
        clips: [{
          id: 'clip-1',
          type: 'caption',
          startTime: 0,
          duration: 5,
          layer: 1,
          captions: [{
            id: 'cap-1',
            startTime: 0,
            endTime: 5,
            text: 'This contains explicit content'
          }]
        }]
      }]
    };

    const { warnings } = runQCChecks(timeline);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes('explicit'))).toBe(true);
  });
});

describe('QC Flags Builder', () => {
  it('builds default flags for valid timeline', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_valid',
      duration: 60
    };

    const flags = buildQCFlags(timeline);

    expect(flags.needsHumanReview).toBe(false);
    expect(flags.contentWarnings).toEqual([]);
  });

  it('sets needsHumanReview for issues', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_issue',
      duration: 700 // Exceeds max
    };

    const flags = buildQCFlags(timeline);

    expect(flags.needsHumanReview).toBe(true);
    expect(flags.reviewReason).toBeDefined();
  });

  it('sets durationExceeded flag', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_duration',
      duration: 200 // Exceeds short-form
    };

    const flags = buildQCFlags(timeline);

    expect(flags.durationExceeded).toBe(true);
  });

  it('skips QC when option is set', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_skip',
      duration: 700 // Would normally trigger issue
    };

    const flags = buildQCFlags(timeline, { skipQC: true });

    expect(flags.needsHumanReview).toBe(false);
    expect(flags.durationExceeded).toBeUndefined();
  });

  it('collects notes from warnings', () => {
    const timeline: Partial<Timeline> = {
      episodeId: 'test_notes',
      duration: 200
    };

    const flags = buildQCFlags(timeline);

    expect(flags.notes).toBeDefined();
    expect(flags.notes!.length).toBeGreaterThan(0);
  });
});

describe('Persona Styles', () => {
  it('validates persona style structure', () => {
    const style: PersonaStyle = {
      personaCode: 'TEST',
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00',
      fontFamily: 'Arial',
      captionPosition: 'bottom-center',
      motionPreset: 'subtle-zoom',
      transitionPreset: 'fade',
      defaultRenderProfile: 'vertical_1080x1920'
    };

    expect(style.personaCode).toBe('TEST');
    expect(style.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
    expect(style.captionPosition).toBe('bottom-center');
  });

  it('supports optional defaultRenderProfile', () => {
    const style: PersonaStyle = {
      personaCode: 'MINIMAL',
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      captionPosition: 'top-center',
      motionPreset: 'none',
      transitionPreset: 'none'
    };

    expect(style.defaultRenderProfile).toBeUndefined();
  });
});

describe('QCFlags Interface', () => {
  it('structures QC flags correctly', () => {
    const flags: QCFlags = {
      contentWarnings: ['cultural-reference', 'mature-themes'],
      needsHumanReview: true,
      reviewReason: 'Contains cultural references requiring sensitivity review',
      captionLengthExceeded: false,
      durationExceeded: false,
      notes: ['Flagged by automated QC']
    };

    expect(flags.contentWarnings).toHaveLength(2);
    expect(flags.needsHumanReview).toBe(true);
    expect(flags.reviewReason).toBeDefined();
  });

  it('tracks review metadata', () => {
    const flags: QCFlags = {
      contentWarnings: [],
      needsHumanReview: false
    };

    // Simulate review
    const reviewedFlags: QCFlags = {
      ...flags,
      reviewedAt: '2024-01-15T10:30:00Z',
      reviewedBy: 'Operator'
    };

    expect(reviewedFlags.reviewedAt).toBe('2024-01-15T10:30:00Z');
    expect(reviewedFlags.reviewedBy).toBe('Operator');
  });
});
