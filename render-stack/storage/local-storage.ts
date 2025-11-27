/**
 * Local Storage Adapter
 * Stores files on the local filesystem.
 * Used for development and single-server deployments.
 */

import { existsSync, mkdirSync, copyFileSync, unlinkSync, statSync, readdirSync, readFileSync } from 'fs';
import { join, dirname, extname, resolve } from 'path';
import { createHash } from 'crypto';
import type { StorageAdapter, UploadResult, UploadOptions, FileInfo } from './storage.types.js';

/**
 * Content type mapping for common extensions
 */
const CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.srt': 'application/x-subrip'
};

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

/**
 * Compute MD5 checksum of a file
 */
function computeChecksum(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash('md5').update(content).digest('hex');
}

/**
 * Local Storage Adapter Implementation
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly provider = 'local';
  private basePath: string;
  private baseUrl: string;

  constructor(basePath: string, baseUrl?: string) {
    this.basePath = resolve(basePath);
    this.baseUrl = baseUrl || `file://${this.basePath}`;

    // Ensure base directory exists
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }
  }

  /**
   * Upload a file to local storage
   */
  async upload(localPath: string, remoteKey: string, options?: UploadOptions): Promise<UploadResult> {
    if (!existsSync(localPath)) {
      throw new Error(`Source file not found: ${localPath}`);
    }

    const destPath = join(this.basePath, remoteKey);
    const destDir = dirname(destPath);

    // Create destination directory if needed
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    // Copy file
    copyFileSync(localPath, destPath);

    // Get file stats
    const stats = statSync(destPath);

    // Compute checksum if requested
    let checksum: string | undefined;
    if (options?.verifyChecksum) {
      checksum = computeChecksum(destPath);
    }

    return {
      url: this.buildUrl(remoteKey),
      provider: this.provider,
      remoteKey,
      sizeBytes: stats.size,
      checksum,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Check if a file exists
   */
  async exists(remoteKey: string): Promise<boolean> {
    const filePath = join(this.basePath, remoteKey);
    return existsSync(filePath) && statSync(filePath).isFile();
  }

  /**
   * Delete a file
   */
  async delete(remoteKey: string): Promise<boolean> {
    const filePath = join(this.basePath, remoteKey);
    
    if (!existsSync(filePath)) {
      return false;
    }

    try {
      unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get URL for a file
   */
  async getUrl(remoteKey: string): Promise<string> {
    return this.buildUrl(remoteKey);
  }

  /**
   * Build URL from remote key
   */
  private buildUrl(remoteKey: string): string {
    if (this.baseUrl.startsWith('file://')) {
      return `file://${join(this.basePath, remoteKey)}`;
    }
    // HTTP URL (e.g., when served via Express)
    return `${this.baseUrl.replace(/\/$/, '')}/${remoteKey}`;
  }

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean {
    return existsSync(this.basePath);
  }

  /**
   * Get file info
   */
  async getFileInfo(remoteKey: string): Promise<FileInfo | null> {
    const filePath = join(this.basePath, remoteKey);
    
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const stats = statSync(filePath);
      if (!stats.isFile()) {
        return null;
      }

      return {
        key: remoteKey,
        sizeBytes: stats.size,
        lastModified: stats.mtime.toISOString(),
        contentType: getContentType(filePath)
      };
    } catch {
      return null;
    }
  }

  /**
   * List files in a directory
   */
  async list(prefix: string): Promise<FileInfo[]> {
    const dirPath = join(this.basePath, prefix);
    
    if (!existsSync(dirPath)) {
      return [];
    }

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      const files: FileInfo[] = [];

      for (const entry of entries) {
        if (entry.isFile()) {
          const key = join(prefix, entry.name);
          const filePath = join(this.basePath, key);
          const stats = statSync(filePath);

          files.push({
            key,
            sizeBytes: stats.size,
            lastModified: stats.mtime.toISOString(),
            contentType: getContentType(filePath)
          });
        }
      }

      return files;
    } catch {
      return [];
    }
  }
}

/**
 * Default local storage adapter instance
 * Points to storage/renders/ in the repo root
 */
let _defaultAdapter: LocalStorageAdapter | null = null;

export function getDefaultLocalAdapter(): LocalStorageAdapter {
  if (!_defaultAdapter) {
    // Default to storage/renders in current working directory
    const basePath = join(process.cwd(), 'storage', 'renders');
    const baseUrl = '/storage'; // Served via Express middleware
    _defaultAdapter = new LocalStorageAdapter(basePath, baseUrl);
  }
  return _defaultAdapter;
}

/**
 * Create a local storage adapter with custom path
 */
export function createLocalAdapter(basePath: string, baseUrl?: string): LocalStorageAdapter {
  return new LocalStorageAdapter(basePath, baseUrl);
}

// Default export for convenience
export const localStorageAdapter = getDefaultLocalAdapter();
