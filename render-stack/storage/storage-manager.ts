/**
 * Storage Manager
 * Orchestrates multiple storage adapters and provides a unified interface.
 * Supports local, Azure, and S3 storage with automatic failover.
 */

import type { StorageAdapter, UploadResult, UploadOptions, StorageConfig, StorageManagerStatus, FileInfo } from './storage.types.js';
import { LocalStorageAdapter, createLocalAdapter } from './local-storage.js';
import { AzureBlobStorageAdapter, createAzureAdapterFromEnv } from './azure-storage.js';
import { S3StorageAdapter, createS3AdapterFromEnv } from './s3-storage.js';

export type StorageProviderType = 'local' | 'azure' | 's3';

/**
 * Storage Manager Class
 * Manages multiple storage adapters and routes operations.
 */
export class StorageManager {
  private adapters: Map<StorageProviderType, StorageAdapter> = new Map();
  private defaultProvider: StorageProviderType = 'local';

  constructor(config?: StorageConfig) {
    this.initializeAdapters(config);
  }

  /**
   * Initialize adapters based on configuration
   */
  private initializeAdapters(config?: StorageConfig): void {
    // Always initialize local adapter
    if (config?.local) {
      this.adapters.set('local', createLocalAdapter(config.local.basePath, config.local.baseUrl));
    } else {
      const basePath = process.env.LOCAL_STORAGE_PATH || './storage/renders';
      const baseUrl = process.env.LOCAL_STORAGE_URL || '/storage';
      this.adapters.set('local', createLocalAdapter(basePath, baseUrl));
    }

    // Try to initialize Azure adapter
    try {
      const azureAdapter = createAzureAdapterFromEnv();
      if (azureAdapter.isConfigured()) {
        this.adapters.set('azure', azureAdapter);
      }
    } catch (e) {
      console.log('[storage-manager] Azure adapter not configured');
    }

    // Try to initialize S3 adapter
    try {
      const s3Adapter = createS3AdapterFromEnv();
      if (s3Adapter.isConfigured()) {
        this.adapters.set('s3', s3Adapter);
      }
    } catch (e) {
      console.log('[storage-manager] S3 adapter not configured');
    }

    // Set default provider
    if (config?.defaultProvider) {
      this.defaultProvider = config.defaultProvider;
    } else if (process.env.STORAGE_PROVIDER) {
      this.defaultProvider = process.env.STORAGE_PROVIDER as StorageProviderType;
    }
  }

  /**
   * Get adapter for a provider
   */
  getAdapter(provider?: StorageProviderType): StorageAdapter {
    const providerName = provider || this.defaultProvider;
    const adapter = this.adapters.get(providerName);
    
    if (!adapter) {
      throw new Error(`Storage adapter not found: ${providerName}`);
    }

    return adapter;
  }

  /**
   * Get all available provider names
   */
  getAvailableProviders(): StorageProviderType[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get storage manager status
   */
  getStatus(): StorageManagerStatus {
    return {
      defaultProvider: this.defaultProvider,
      providers: {
        local: this.adapters.has('local') && this.adapters.get('local')!.isConfigured(),
        azure: this.adapters.has('azure') && this.adapters.get('azure')!.isConfigured(),
        s3: this.adapters.has('s3') && this.adapters.get('s3')!.isConfigured()
      },
      configured: this.adapters.size > 0
    };
  }

  /**
   * Upload a render to storage
   * @param episodeId - Episode identifier
   * @param localPath - Path to local render file
   * @param provider - Optional specific provider to use
   * @param options - Upload options
   */
  async uploadRender(
    episodeId: string, 
    localPath: string, 
    provider?: StorageProviderType,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const adapter = this.getAdapter(provider);
    const remoteKey = `renders/${episodeId}/master.mp4`;
    
    return adapter.upload(localPath, remoteKey, options);
  }

  /**
   * Check if a render exists
   */
  async renderExists(episodeId: string, provider?: StorageProviderType): Promise<boolean> {
    const adapter = this.getAdapter(provider);
    const remoteKey = `renders/${episodeId}/master.mp4`;
    
    return adapter.exists(remoteKey);
  }

  /**
   * Get URL for a render
   */
  async getRenderUrl(episodeId: string, provider?: StorageProviderType, expiresInSeconds?: number): Promise<string> {
    const adapter = this.getAdapter(provider);
    const remoteKey = `renders/${episodeId}/master.mp4`;
    
    return adapter.getUrl(remoteKey, expiresInSeconds);
  }

  /**
   * Delete a render
   */
  async deleteRender(episodeId: string, provider?: StorageProviderType): Promise<boolean> {
    const adapter = this.getAdapter(provider);
    const remoteKey = `renders/${episodeId}/master.mp4`;
    
    return adapter.delete(remoteKey);
  }

  /**
   * Get render file info
   */
  async getRenderInfo(episodeId: string, provider?: StorageProviderType): Promise<FileInfo | null> {
    const adapter = this.getAdapter(provider);
    const remoteKey = `renders/${episodeId}/master.mp4`;
    
    if (adapter.getFileInfo) {
      return adapter.getFileInfo(remoteKey);
    }
    
    // Fallback: check if exists
    const exists = await adapter.exists(remoteKey);
    if (!exists) return null;
    
    return {
      key: remoteKey,
      sizeBytes: 0,
      lastModified: new Date().toISOString()
    };
  }

  /**
   * List all renders
   */
  async listRenders(provider?: StorageProviderType): Promise<FileInfo[]> {
    const adapter = this.getAdapter(provider);
    
    if (adapter.list) {
      return adapter.list('renders/');
    }
    
    return [];
  }

  /**
   * Upload with failover
   * Tries default provider first, then falls back to others.
   */
  async uploadWithFailover(
    episodeId: string,
    localPath: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const providers = [this.defaultProvider, ...this.getAvailableProviders().filter(p => p !== this.defaultProvider)];
    
    let lastError: Error | null = null;
    
    for (const provider of providers) {
      try {
        const adapter = this.adapters.get(provider);
        if (!adapter || !adapter.isConfigured()) continue;
        
        console.log(`[storage-manager] Attempting upload to ${provider}`);
        const result = await this.uploadRender(episodeId, localPath, provider, options);
        console.log(`[storage-manager] Upload successful to ${provider}`);
        return result;
      } catch (e) {
        console.warn(`[storage-manager] Upload failed for ${provider}:`, e);
        lastError = e as Error;
      }
    }
    
    throw lastError || new Error('No storage adapters available');
  }

  /**
   * Replicate to multiple providers
   */
  async replicateRender(
    episodeId: string,
    localPath: string,
    providers: StorageProviderType[],
    options?: UploadOptions
  ): Promise<Map<StorageProviderType, UploadResult | Error>> {
    const results = new Map<StorageProviderType, UploadResult | Error>();
    
    await Promise.all(
      providers.map(async (provider) => {
        try {
          const result = await this.uploadRender(episodeId, localPath, provider, options);
          results.set(provider, result);
        } catch (e) {
          results.set(provider, e as Error);
        }
      })
    );
    
    return results;
  }
}

// Singleton instance
let _storageManager: StorageManager | null = null;

/**
 * Get the default storage manager instance
 */
export function getStorageManager(): StorageManager {
  if (!_storageManager) {
    _storageManager = new StorageManager();
  }
  return _storageManager;
}

/**
 * Create a new storage manager with custom config
 */
export function createStorageManager(config: StorageConfig): StorageManager {
  return new StorageManager(config);
}

// Default export
export const storageManager = getStorageManager();
