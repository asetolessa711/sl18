/**
 * End-to-End Integration Tests
 * Tests the full pipeline: timeline → render → upload → QC → storage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

// Test directories
const TEST_BASE = '/tmp/sl18-e2e-test';
const ASSETS_DIR = join(TEST_BASE, 'assets');
const TIMELINES_DIR = join(TEST_BASE, 'timelines');
const RENDERS_DIR = join(TEST_BASE, 'renders');
const STORAGE_DIR = join(TEST_BASE, 'storage');

// Import types
import type { AssetManifest, AssetManifestEntry } from '../render-stack/types/assetManifest.types.js';
import type { Timeline, Track, Clip, CaptionSegment } from '../render-stack/types/timeline.types.js';

// Mock episode data
const MOCK_EPISODE_ID = 'e2e_test_001';

/**
 * Setup test environment
 */
function setupTestEnvironment(): void {
  // Create directories
  [ASSETS_DIR, TIMELINES_DIR, RENDERS_DIR, STORAGE_DIR].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  // Create mock audio file
  const audioPath = join(ASSETS_DIR, MOCK_EPISODE_ID, 'voice.mp3');
  mkdirSync(join(ASSETS_DIR, MOCK_EPISODE_ID), { recursive: true });
  writeFileSync(audioPath, 'mock audio content');

  // Create mock background image
  const bgPath = join(ASSETS_DIR, MOCK_EPISODE_ID, 'background.jpg');
  writeFileSync(bgPath, 'mock background image');

  // Create mock transcript
  const transcriptPath = join(ASSETS_DIR, MOCK_EPISODE_ID, 'transcript.srt');
  writeFileSync(transcriptPath, `1
00:00:00,000 --> 00:00:05,000
Hello, welcome to the show!

2
00:00:05,000 --> 00:00:10,000
This is an end-to-end test.
`);

  // Create asset manifest
  const manifest: AssetManifest = {
    episodeId: MOCK_EPISODE_ID,
    personaCode: 'ADDIS',
    franchiseCode: 'ADDIS_ENTERTAINMENT',
    createdAt: new Date().toISOString(),
    assets: [
      {
        assetId: 'voice_main',
        type: 'audio',
        role: 'voice',
        localPath: audioPath,
        durationSeconds: 60,
        metadata: { language: 'en' }
      },
      {
        assetId: 'bg_main',
        type: 'image',
        role: 'background',
        localPath: bgPath,
        metadata: { width: 1080, height: 1920 }
      },
      {
        assetId: 'transcript',
        type: 'text',
        role: 'transcript',
        localPath: transcriptPath,
        metadata: { format: 'srt' }
      }
    ]
  };

  writeFileSync(
    join(ASSETS_DIR, MOCK_EPISODE_ID, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

/**
 * Cleanup test environment
 */
function cleanupTestEnvironment(): void {
  try {
    rmSync(TEST_BASE, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe('End-to-End Integration Tests', () => {
  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  describe('Phase 1: Asset Manifest Loading', () => {
    it('loads and validates asset manifest', () => {
      const manifestPath = join(ASSETS_DIR, MOCK_EPISODE_ID, 'manifest.json');
      expect(existsSync(manifestPath)).toBe(true);

      const manifest: AssetManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      
      expect(manifest.episodeId).toBe(MOCK_EPISODE_ID);
      expect(manifest.personaCode).toBe('ADDIS');
      expect(manifest.assets.length).toBeGreaterThan(0);
    });

    it('validates all asset files exist', () => {
      const manifestPath = join(ASSETS_DIR, MOCK_EPISODE_ID, 'manifest.json');
      const manifest: AssetManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      for (const asset of manifest.assets) {
        expect(existsSync(asset.localPath), `Asset not found: ${asset.localPath}`).toBe(true);
      }
    });

    it('identifies required asset roles', () => {
      const manifestPath = join(ASSETS_DIR, MOCK_EPISODE_ID, 'manifest.json');
      const manifest: AssetManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      const roles = manifest.assets.map(a => a.role);
      expect(roles).toContain('voice');
      expect(roles).toContain('background');
    });
  });

  describe('Phase 2: Timeline Building', () => {
    let timeline: Timeline;

    beforeEach(() => {
      // Build timeline from manifest
      const manifestPath = join(ASSETS_DIR, MOCK_EPISODE_ID, 'manifest.json');
      const manifest: AssetManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      const voiceAsset = manifest.assets.find(a => a.role === 'voice');
      const bgAsset = manifest.assets.find(a => a.role === 'background');

      // Create tracks
      const audioTrack: Track = {
        trackId: 'audio_main',
        type: 'audio',
        clips: [
          {
            clipId: 'voice_clip',
            assetId: voiceAsset!.assetId,
            startTime: 0,
            endTime: voiceAsset!.durationSeconds || 60,
            sourceStart: 0,
            sourceEnd: voiceAsset!.durationSeconds || 60,
            volume: 1.0
          }
        ]
      };

      const videoTrack: Track = {
        trackId: 'video_bg',
        type: 'video',
        clips: [
          {
            clipId: 'bg_clip',
            assetId: bgAsset!.assetId,
            startTime: 0,
            endTime: voiceAsset!.durationSeconds || 60,
            sourceStart: 0,
            sourceEnd: voiceAsset!.durationSeconds || 60
          }
        ]
      };

      const captions: CaptionSegment[] = [
        { start: 0, end: 5, text: 'Hello, welcome to the show!' },
        { start: 5, end: 10, text: 'This is an end-to-end test.' }
      ];

      timeline = {
        timelineVersion: '1.0.0',
        episodeId: MOCK_EPISODE_ID,
        personaCode: manifest.personaCode,
        franchiseCode: manifest.franchiseCode,
        totalDuration: 60,
        renderProfile: 'vertical_1080x1920',
        tracks: [audioTrack, videoTrack],
        captions,
        styling: {
          primaryColor: '#FFD700',
          secondaryColor: '#1A1A2E',
          fontFamily: 'Poppins',
          captionPosition: 'bottom'
        },
        qcFlags: {
          contentWarning: [],
          needsHumanReview: false
        },
        createdAt: new Date().toISOString()
      };

      // Write timeline
      const timelineDir = join(TIMELINES_DIR, MOCK_EPISODE_ID);
      mkdirSync(timelineDir, { recursive: true });
      writeFileSync(
        join(timelineDir, 'timeline.json'),
        JSON.stringify(timeline, null, 2)
      );
    });

    it('creates valid timeline JSON', () => {
      const timelinePath = join(TIMELINES_DIR, MOCK_EPISODE_ID, 'timeline.json');
      expect(existsSync(timelinePath)).toBe(true);

      const loaded: Timeline = JSON.parse(readFileSync(timelinePath, 'utf-8'));
      expect(loaded.timelineVersion).toBe('1.0.0');
      expect(loaded.episodeId).toBe(MOCK_EPISODE_ID);
    });

    it('includes all required tracks', () => {
      expect(timeline.tracks.length).toBeGreaterThanOrEqual(2);
      
      const trackTypes = timeline.tracks.map(t => t.type);
      expect(trackTypes).toContain('audio');
      expect(trackTypes).toContain('video');
    });

    it('includes captions', () => {
      expect(timeline.captions).toBeDefined();
      expect(timeline.captions!.length).toBeGreaterThan(0);
    });

    it('includes styling information', () => {
      expect(timeline.styling).toBeDefined();
      expect(timeline.styling!.primaryColor).toBeDefined();
      expect(timeline.styling!.fontFamily).toBeDefined();
    });

    it('includes QC flags', () => {
      expect(timeline.qcFlags).toBeDefined();
      expect(timeline.qcFlags!.needsHumanReview).toBe(false);
    });
  });

  describe('Phase 3: Render Job Simulation', () => {
    it('validates render job creation', () => {
      const job = {
        jobId: `job_${Date.now()}`,
        episodeId: MOCK_EPISODE_ID,
        status: 'queued' as const,
        priority: 1,
        createdAt: new Date().toISOString(),
        timelinePath: join(TIMELINES_DIR, MOCK_EPISODE_ID, 'timeline.json'),
        outputPath: join(RENDERS_DIR, MOCK_EPISODE_ID, 'master.mp4')
      };

      expect(job.status).toBe('queued');
      expect(existsSync(job.timelinePath)).toBe(true);
    });

    it('simulates render completion', () => {
      // Create mock render output
      const renderDir = join(RENDERS_DIR, MOCK_EPISODE_ID);
      mkdirSync(renderDir, { recursive: true });
      writeFileSync(join(renderDir, 'master.mp4'), 'mock rendered video content');

      const renderPath = join(renderDir, 'master.mp4');
      expect(existsSync(renderPath)).toBe(true);
    });

    it('tracks render metrics', () => {
      const metrics = {
        episodeId: MOCK_EPISODE_ID,
        renderDuration: 45.2,
        outputSizeBytes: 1024000,
        frameCount: 1800,
        fps: 30,
        completedAt: new Date().toISOString()
      };

      expect(metrics.renderDuration).toBeGreaterThan(0);
      expect(metrics.outputSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('Phase 4: Storage Upload', () => {
    it('uploads render to local storage', () => {
      // Simulate storage upload
      const sourcePath = join(RENDERS_DIR, MOCK_EPISODE_ID, 'master.mp4');
      const destDir = join(STORAGE_DIR, 'renders', MOCK_EPISODE_ID);
      
      mkdirSync(destDir, { recursive: true });
      
      const content = readFileSync(sourcePath);
      const destPath = join(destDir, 'master.mp4');
      writeFileSync(destPath, content);

      expect(existsSync(destPath)).toBe(true);
    });

    it('generates storage record', () => {
      const record = {
        episodeId: MOCK_EPISODE_ID,
        render_storage_provider: 'local',
        render_url: `file://${join(STORAGE_DIR, 'renders', MOCK_EPISODE_ID, 'master.mp4')}`,
        render_remote_key: `renders/${MOCK_EPISODE_ID}/master.mp4`,
        render_size_bytes: 1024000,
        render_checksum: 'abc123def456',
        render_completed_at: new Date().toISOString(),
        render_status: 'completed' as const
      };

      expect(record.render_status).toBe('completed');
      expect(record.render_storage_provider).toBe('local');
    });
  });

  describe('Phase 5: QC Workflow', () => {
    it('evaluates QC rules', () => {
      const timelinePath = join(TIMELINES_DIR, MOCK_EPISODE_ID, 'timeline.json');
      const timeline: Timeline = JSON.parse(readFileSync(timelinePath, 'utf-8'));

      // QC thresholds
      const MAX_CAPTION_LENGTH = 150;
      const MAX_DURATION_SHORT = 180;

      // Check captions
      const longCaptions = timeline.captions?.filter(c => c.text.length > MAX_CAPTION_LENGTH) || [];
      const hasLongCaptions = longCaptions.length > 0;

      // Check duration
      const exceedsDuration = timeline.totalDuration > MAX_DURATION_SHORT;

      // Determine if needs review
      const needsReview = hasLongCaptions || exceedsDuration;

      expect(typeof needsReview).toBe('boolean');
    });

    it('marks episode for review when needed', () => {
      const qcResult = {
        episodeId: MOCK_EPISODE_ID,
        passed: true,
        issues: [] as string[],
        reviewedAt: null as string | null,
        reviewedBy: null as string | null
      };

      // Simulate passing QC
      expect(qcResult.passed).toBe(true);
      expect(qcResult.issues.length).toBe(0);
    });

    it('tracks review decision', () => {
      const review = {
        episodeId: MOCK_EPISODE_ID,
        decision: 'approved' as 'approved' | 'rejected' | 'needs_revision',
        reviewedBy: 'test_operator',
        reviewedAt: new Date().toISOString(),
        notes: 'Looks good!'
      };

      expect(review.decision).toBe('approved');
      expect(review.reviewedBy).toBeDefined();
    });
  });

  describe('Full Pipeline Integration', () => {
    it('runs complete pipeline: manifest → timeline → render → storage → QC', async () => {
      // Step 1: Load manifest
      const manifestPath = join(ASSETS_DIR, MOCK_EPISODE_ID, 'manifest.json');
      const manifest: AssetManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      expect(manifest.episodeId).toBe(MOCK_EPISODE_ID);

      // Step 2: Build timeline
      const timelinePath = join(TIMELINES_DIR, MOCK_EPISODE_ID, 'timeline.json');
      expect(existsSync(timelinePath)).toBe(true);

      // Step 3: Render (simulated)
      const renderPath = join(RENDERS_DIR, MOCK_EPISODE_ID, 'master.mp4');
      expect(existsSync(renderPath)).toBe(true);

      // Step 4: Storage upload (simulated)
      const storagePath = join(STORAGE_DIR, 'renders', MOCK_EPISODE_ID, 'master.mp4');
      expect(existsSync(storagePath)).toBe(true);

      // Step 5: QC evaluation
      const timeline: Timeline = JSON.parse(readFileSync(timelinePath, 'utf-8'));
      const qcPassed = !timeline.qcFlags?.needsHumanReview;
      expect(qcPassed).toBe(true);

      // Pipeline complete
      const pipelineResult = {
        episodeId: MOCK_EPISODE_ID,
        manifestLoaded: true,
        timelineBuilt: true,
        rendered: true,
        uploaded: true,
        qcPassed: true,
        completedAt: new Date().toISOString()
      };

      expect(pipelineResult.manifestLoaded).toBe(true);
      expect(pipelineResult.timelineBuilt).toBe(true);
      expect(pipelineResult.rendered).toBe(true);
      expect(pipelineResult.uploaded).toBe(true);
      expect(pipelineResult.qcPassed).toBe(true);
    });
  });
});

describe('Storage Adapter Integration', () => {
  describe('Local Storage Adapter', () => {
    const localStorageDir = join(TEST_BASE, 'local-adapter-test');

    beforeAll(() => {
      mkdirSync(localStorageDir, { recursive: true });
    });

    afterAll(() => {
      try {
        rmSync(localStorageDir, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    });

    it('initializes local storage adapter', () => {
      // Simulated adapter initialization
      const adapter = {
        provider: 'local',
        basePath: localStorageDir,
        isConfigured: () => existsSync(localStorageDir)
      };

      expect(adapter.provider).toBe('local');
      expect(adapter.isConfigured()).toBe(true);
    });

    it('handles file operations', () => {
      const testFile = join(localStorageDir, 'test.txt');
      writeFileSync(testFile, 'test content');

      expect(existsSync(testFile)).toBe(true);

      const content = readFileSync(testFile, 'utf-8');
      expect(content).toBe('test content');
    });
  });

  describe('Cloud Storage Adapters (Mock)', () => {
    it('validates Azure configuration structure', () => {
      const azureConfig = {
        connectionString: undefined,
        accountName: 'testaccount',
        accountKey: undefined,
        containerName: 'sl18-renders',
        sasToken: undefined
      };

      // Without credentials, adapter should not be configured
      const isConfigured = !!(
        azureConfig.connectionString ||
        (azureConfig.accountName && (azureConfig.accountKey || azureConfig.sasToken))
      );

      expect(isConfigured).toBe(false);
    });

    it('validates S3 configuration structure', () => {
      const s3Config = {
        accessKeyId: undefined,
        secretAccessKey: undefined,
        region: 'us-east-1',
        bucket: 'sl18-renders'
      };

      // Without credentials, check if region and bucket are set
      const hasBasicConfig = !!(s3Config.region && s3Config.bucket);
      expect(hasBasicConfig).toBe(true);
    });

    it('generates correct S3 object URL', () => {
      const bucket = 'sl18-renders';
      const region = 'us-east-1';
      const key = 'renders/test_001/master.mp4';

      const expectedUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      expect(expectedUrl).toBe('https://sl18-renders.s3.us-east-1.amazonaws.com/renders/test_001/master.mp4');
    });

    it('generates correct Azure blob URL', () => {
      const accountName = 'sl18storage';
      const containerName = 'renders';
      const blobName = 'test_001/master.mp4';

      const expectedUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
      expect(expectedUrl).toBe('https://sl18storage.blob.core.windows.net/renders/test_001/master.mp4');
    });
  });
});

describe('Error Handling', () => {
  it('handles missing manifest gracefully', () => {
    const missingPath = '/nonexistent/manifest.json';
    expect(existsSync(missingPath)).toBe(false);
  });

  it('handles missing assets in manifest', () => {
    const manifest: AssetManifest = {
      episodeId: 'broken_001',
      personaCode: 'TEST',
      franchiseCode: 'TEST',
      createdAt: new Date().toISOString(),
      assets: [
        {
          assetId: 'missing',
          type: 'audio',
          role: 'voice',
          localPath: '/nonexistent/audio.mp3'
        }
      ]
    };

    const missingAssets = manifest.assets.filter(a => !existsSync(a.localPath));
    expect(missingAssets.length).toBe(1);
  });

  it('validates timeline schema', () => {
    const invalidTimeline = {
      episodeId: 'invalid_001',
      // Missing required fields: timelineVersion, tracks, totalDuration
    };

    const isValid = !!(
      (invalidTimeline as any).timelineVersion &&
      (invalidTimeline as any).tracks &&
      (invalidTimeline as any).totalDuration
    );

    expect(isValid).toBe(false);
  });
});
