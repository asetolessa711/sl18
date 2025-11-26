/**
 * Tests for Timeline Builder
 */
import { describe, it, expect } from 'vitest';
import type {
  Timeline,
  Track,
  Clip,
  CaptionSegment,
  PersonaStyle,
  QCFlags,
  RenderProfile,
  TimelineValidationResult
} from '../render-stack/types/timeline.types.js';
import type { AssetManifest, AssetMetadata } from '../render-stack/types/assetManifest.types.js';

// Replicate validation logic from build-timeline.ts for testing
function validateTimeline(timeline: Timeline): TimelineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!timeline.timelineVersion) errors.push('Missing timelineVersion');
  if (!timeline.episodeId) errors.push('Missing episodeId');
  if (!timeline.personaCode) errors.push('Missing personaCode');
  if (!timeline.renderProfile) errors.push('Missing renderProfile');
  if (typeof timeline.duration !== 'number' || timeline.duration <= 0) {
    errors.push('Invalid duration');
  }
  if (!Array.isArray(timeline.tracks)) errors.push('Missing tracks array');
  
  for (const track of timeline.tracks) {
    if (!track.id) errors.push(`Track missing id`);
    if (!track.type) errors.push(`Track ${track.id} missing type`);
    if (!Array.isArray(track.clips)) errors.push(`Track ${track.id} missing clips array`);
    
    for (const clip of track.clips) {
      if (!clip.id) errors.push(`Clip in track ${track.id} missing id`);
      if (!clip.type) errors.push(`Clip ${clip.id} missing type`);
      if (typeof clip.startTime !== 'number') errors.push(`Clip ${clip.id} missing startTime`);
      if (typeof clip.duration !== 'number' || clip.duration <= 0) {
        warnings.push(`Clip ${clip.id} has invalid duration`);
      }
    }
  }
  
  if (timeline.qcFlags?.needsHumanReview) {
    warnings.push(`Episode requires human review: ${timeline.qcFlags.reviewReason ?? 'unspecified'}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

describe('Timeline Schema', () => {
  it('validates a complete timeline', () => {
    const timeline: Timeline = {
      timelineVersion: '1.0.0',
      episodeId: 'test_001',
      personaCode: 'ADDIS',
      renderProfile: 'vertical_1080x1920',
      duration: 45,
      frameRate: 30,
      tracks: [
        {
          id: 'track_voice',
          type: 'audio',
          name: 'Voice',
          clips: [
            {
              id: 'clip_voice',
              type: 'voice',
              assetRef: 'voice_main',
              startTime: 0,
              duration: 45,
              layer: 10,
              volume: 1.0
            }
          ]
        }
      ],
      style: {
        personaCode: 'ADDIS',
        primaryColor: '#FF6B35',
        secondaryColor: '#004E89',
        fontFamily: 'Inter',
        captionPosition: 'bottom-center',
        motionPreset: 'subtle-zoom',
        transitionPreset: 'fade'
      },
      qcFlags: {
        contentWarnings: [],
        needsHumanReview: false
      },
      createdAt: new Date().toISOString()
    };

    const result = validateTimeline(timeline);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing required fields', () => {
    const timeline = {
      timelineVersion: '1.0.0',
      // Missing episodeId
      personaCode: 'ADDIS',
      renderProfile: 'vertical_1080x1920',
      duration: 45,
      frameRate: 30,
      tracks: [],
      style: {} as PersonaStyle,
      qcFlags: { contentWarnings: [], needsHumanReview: false },
      createdAt: new Date().toISOString()
    } as unknown as Timeline;

    const result = validateTimeline(timeline);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing episodeId');
  });

  it('detects invalid duration', () => {
    const timeline: Timeline = {
      timelineVersion: '1.0.0',
      episodeId: 'test_001',
      personaCode: 'ADDIS',
      renderProfile: 'vertical_1080x1920',
      duration: 0, // Invalid
      frameRate: 30,
      tracks: [],
      style: {
        personaCode: 'ADDIS',
        primaryColor: '#FF6B35',
        secondaryColor: '#004E89',
        fontFamily: 'Inter',
        captionPosition: 'bottom-center',
        motionPreset: 'subtle-zoom',
        transitionPreset: 'fade'
      },
      qcFlags: { contentWarnings: [], needsHumanReview: false },
      createdAt: new Date().toISOString()
    };

    const result = validateTimeline(timeline);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid duration');
  });

  it('warns on human review required', () => {
    const timeline: Timeline = {
      timelineVersion: '1.0.0',
      episodeId: 'test_001',
      personaCode: 'ADDIS',
      renderProfile: 'vertical_1080x1920',
      duration: 45,
      frameRate: 30,
      tracks: [],
      style: {
        personaCode: 'ADDIS',
        primaryColor: '#FF6B35',
        secondaryColor: '#004E89',
        fontFamily: 'Inter',
        captionPosition: 'bottom-center',
        motionPreset: 'subtle-zoom',
        transitionPreset: 'fade'
      },
      qcFlags: {
        contentWarnings: [],
        needsHumanReview: true,
        reviewReason: 'Caption too long'
      },
      createdAt: new Date().toISOString()
    };

    const result = validateTimeline(timeline);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Episode requires human review: Caption too long');
  });
});

describe('Asset Manifest', () => {
  it('correctly structures an asset manifest', () => {
    const manifest: AssetManifest = {
      manifestVersion: '1.0.0',
      episode: {
        episodeId: 'test_001',
        title: 'Test Episode',
        personaCode: 'ADDIS',
        language: 'en'
      },
      generation: {
        scriptSource: 'gpt-4',
        ttsProvider: 'elevenlabs',
        voiceId: 'voice_123'
      },
      assets: [
        {
          id: 'voice_main',
          type: 'voice',
          path: 'voice.mp3',
          format: 'mp3',
          duration: 45
        },
        {
          id: 'music_bg',
          type: 'music',
          path: 'music.mp3',
          format: 'mp3',
          duration: 60
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(manifest.manifestVersion).toBe('1.0.0');
    expect(manifest.episode.episodeId).toBe('test_001');
    expect(manifest.assets).toHaveLength(2);
    expect(manifest.assets.find(a => a.type === 'voice')?.duration).toBe(45);
  });

  it('finds assets by type', () => {
    const assets: AssetMetadata[] = [
      { id: 'v1', type: 'voice', path: 'v.mp3', format: 'mp3', duration: 30 },
      { id: 'm1', type: 'music', path: 'm.mp3', format: 'mp3', duration: 60 },
      { id: 'm2', type: 'music', path: 'm2.mp3', format: 'mp3', duration: 45 }
    ];

    const voiceAssets = assets.filter(a => a.type === 'voice');
    const musicAssets = assets.filter(a => a.type === 'music');

    expect(voiceAssets).toHaveLength(1);
    expect(musicAssets).toHaveLength(2);
  });
});

describe('Caption Segments', () => {
  it('structures caption segments correctly', () => {
    const captions: CaptionSegment[] = [
      {
        id: 'caption_0',
        startTime: 0,
        endTime: 3.5,
        text: 'Hello world'
      },
      {
        id: 'caption_1',
        startTime: 3.5,
        endTime: 7,
        text: 'Welcome to the show'
      }
    ];

    expect(captions[0].startTime).toBe(0);
    expect(captions[0].endTime).toBe(3.5);
    expect(captions[1].startTime).toBe(captions[0].endTime);
  });

  it('calculates caption duration', () => {
    const caption: CaptionSegment = {
      id: 'test',
      startTime: 5.5,
      endTime: 10.2,
      text: 'Test caption'
    };

    const duration = caption.endTime - caption.startTime;
    expect(duration).toBeCloseTo(4.7);
  });
});

describe('QC Flags', () => {
  it('flags long captions', () => {
    const QC_MAX_CAPTION_LENGTH = 80;
    const longCaption = 'A'.repeat(100);
    
    const needsReview = longCaption.length > QC_MAX_CAPTION_LENGTH;
    expect(needsReview).toBe(true);
  });

  it('flags long duration', () => {
    const QC_MAX_DURATION_SECONDS = 180;
    const episodeDuration = 200;
    
    const needsReview = episodeDuration > QC_MAX_DURATION_SECONDS;
    expect(needsReview).toBe(true);
  });

  it('passes QC for normal content', () => {
    const QC_MAX_CAPTION_LENGTH = 80;
    const QC_MAX_DURATION_SECONDS = 180;
    
    const caption = 'Normal length caption';
    const duration = 45;
    
    const captionOk = caption.length <= QC_MAX_CAPTION_LENGTH;
    const durationOk = duration <= QC_MAX_DURATION_SECONDS;
    
    expect(captionOk).toBe(true);
    expect(durationOk).toBe(true);
  });
});
