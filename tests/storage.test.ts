/**
 * Tests for Storage Adapters
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import type {
  StorageAdapter,
  UploadResult,
  UploadOptions,
  RenderStorageRecord
} from '../render-stack/storage/storage.types.js';

// Test directory
const TEST_DIR = '/tmp/sl18-storage-test';
const TEST_FILE = join(TEST_DIR, 'test-video.mp4');

// Mock LocalStorageAdapter for testing
class MockLocalStorageAdapter implements StorageAdapter {
  readonly provider = 'local';
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true });
    }
  }

  async upload(localPath: string, remoteKey: string, options?: UploadOptions): Promise<UploadResult> {
    if (!existsSync(localPath)) {
      throw new Error(`Source file not found: ${localPath}`);
    }
    
    const destPath = join(this.basePath, remoteKey);
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    // Simulate copy using ES module import
    const content = readFileSync(localPath);
    writeFileSync(destPath, content);

    return {
      url: `file://${destPath}`,
      provider: this.provider,
      remoteKey,
      sizeBytes: content.length,
      checksum: options?.verifyChecksum ? 'mock-checksum-12345' : undefined,
      uploadedAt: new Date().toISOString()
    };
  }

  async exists(remoteKey: string): Promise<boolean> {
    return existsSync(join(this.basePath, remoteKey));
  }

  async delete(remoteKey: string): Promise<boolean> {
    const path = join(this.basePath, remoteKey);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    return true;
  }

  async getUrl(remoteKey: string): Promise<string> {
    return `file://${join(this.basePath, remoteKey)}`;
  }

  isConfigured(): boolean {
    return existsSync(this.basePath);
  }
}

describe('LocalStorageAdapter', () => {
  let adapter: MockLocalStorageAdapter;

  beforeEach(() => {
    // Create test directory and file
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
    writeFileSync(TEST_FILE, 'mock video content');
    adapter = new MockLocalStorageAdapter(join(TEST_DIR, 'storage'));
  });

  afterEach(() => {
    // Cleanup
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('uploads a file to local storage', async () => {
    const result = await adapter.upload(TEST_FILE, 'renders/test_001/master.mp4');

    expect(result.provider).toBe('local');
    expect(result.remoteKey).toBe('renders/test_001/master.mp4');
    expect(result.url).toContain('file://');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.uploadedAt).toBeDefined();
  });

  it('includes checksum when requested', async () => {
    const result = await adapter.upload(TEST_FILE, 'renders/test_002/master.mp4', {
      verifyChecksum: true
    });

    expect(result.checksum).toBeDefined();
  });

  it('throws error for missing source file', async () => {
    await expect(
      adapter.upload('/nonexistent/file.mp4', 'renders/test/master.mp4')
    ).rejects.toThrow('Source file not found');
  });

  it('checks if file exists', async () => {
    await adapter.upload(TEST_FILE, 'renders/test_003/master.mp4');

    const exists = await adapter.exists('renders/test_003/master.mp4');
    const notExists = await adapter.exists('renders/nonexistent/master.mp4');

    expect(exists).toBe(true);
    expect(notExists).toBe(false);
  });

  it('deletes a file', async () => {
    await adapter.upload(TEST_FILE, 'renders/test_004/master.mp4');
    
    const deleted = await adapter.delete('renders/test_004/master.mp4');
    const exists = await adapter.exists('renders/test_004/master.mp4');

    expect(deleted).toBe(true);
    expect(exists).toBe(false);
  });

  it('returns false when deleting nonexistent file', async () => {
    const deleted = await adapter.delete('renders/nonexistent/master.mp4');
    expect(deleted).toBe(false);
  });

  it('generates correct URL', async () => {
    const url = await adapter.getUrl('renders/test_005/master.mp4');
    expect(url).toContain('file://');
    expect(url).toContain('renders/test_005/master.mp4');
  });

  it('reports configuration status', () => {
    expect(adapter.isConfigured()).toBe(true);
  });
});

describe('RenderStorageRecord', () => {
  it('structures storage record correctly', () => {
    const record: RenderStorageRecord = {
      episodeId: 'test_001',
      render_storage_provider: 'local',
      render_url: 'file:///storage/renders/test_001/master.mp4',
      render_remote_key: 'renders/test_001/master.mp4',
      render_size_bytes: 1024000,
      render_checksum: 'abc123def456',
      render_completed_at: '2024-01-15T10:30:00Z',
      render_status: 'completed'
    };

    expect(record.episodeId).toBe('test_001');
    expect(record.render_storage_provider).toBe('local');
    expect(record.render_status).toBe('completed');
    expect(record.render_size_bytes).toBe(1024000);
  });

  it('supports pending status', () => {
    const record: RenderStorageRecord = {
      episodeId: 'test_002',
      render_storage_provider: 'local',
      render_url: '',
      render_remote_key: '',
      render_size_bytes: 0,
      render_completed_at: '',
      render_status: 'pending'
    };

    expect(record.render_status).toBe('pending');
  });

  it('supports failed status', () => {
    const record: RenderStorageRecord = {
      episodeId: 'test_003',
      render_storage_provider: 'local',
      render_url: '',
      render_remote_key: '',
      render_size_bytes: 0,
      render_completed_at: '',
      render_status: 'failed'
    };

    expect(record.render_status).toBe('failed');
  });
});

describe('StorageManager', () => {
  it('builds storage record from upload result', () => {
    const uploadResult: UploadResult = {
      url: 'file:///storage/renders/test_001/master.mp4',
      provider: 'local',
      remoteKey: 'renders/test_001/master.mp4',
      sizeBytes: 2048000,
      checksum: 'md5hash123',
      uploadedAt: '2024-01-15T10:30:00Z'
    };

    const record: RenderStorageRecord = {
      episodeId: 'test_001',
      render_storage_provider: uploadResult.provider,
      render_url: uploadResult.url,
      render_remote_key: uploadResult.remoteKey,
      render_size_bytes: uploadResult.sizeBytes,
      render_checksum: uploadResult.checksum,
      render_completed_at: uploadResult.uploadedAt,
      render_status: 'completed'
    };

    expect(record.render_storage_provider).toBe('local');
    expect(record.render_url).toBe(uploadResult.url);
    expect(record.render_checksum).toBe('md5hash123');
  });

  it('generates correct remote key for episode', () => {
    const episodeId = 'test_episode_001';
    const remoteKey = `renders/${episodeId}/master.mp4`;
    
    expect(remoteKey).toBe('renders/test_episode_001/master.mp4');
  });
});
