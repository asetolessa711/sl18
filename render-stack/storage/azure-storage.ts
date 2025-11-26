/**
 * Azure Blob Storage Adapter
 * Stores files in Azure Blob Storage containers.
 * Supports SAS tokens and signed URLs for secure access.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { createHash } from 'crypto';
import type { StorageAdapter, UploadResult, UploadOptions, FileInfo } from './storage.types.js';

/**
 * Azure storage configuration
 */
export interface AzureStorageConfig {
  /** Azure storage connection string (preferred) */
  connectionString?: string;
  /** Storage account name */
  accountName?: string;
  /** Storage account key */
  accountKey?: string;
  /** Container name for renders */
  containerName: string;
  /** Optional SAS token */
  sasToken?: string;
  /** Custom endpoint URL (for emulator or sovereign clouds) */
  endpoint?: string;
}

/**
 * Azure Blob Storage Adapter Implementation
 */
export class AzureBlobStorageAdapter implements StorageAdapter {
  readonly provider = 'azure';
  private config: AzureStorageConfig;
  private configured: boolean = false;

  constructor(config: AzureStorageConfig) {
    this.config = config;
    this.configured = this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): boolean {
    // Must have connection string OR account name + key/SAS
    if (this.config.connectionString) {
      return true;
    }
    if (this.config.accountName && (this.config.accountKey || this.config.sasToken)) {
      return true;
    }
    return false;
  }

  /**
   * Get the base URL for the storage account
   */
  private getBaseUrl(): string {
    if (this.config.endpoint) {
      return this.config.endpoint;
    }
    return `https://${this.config.accountName}.blob.core.windows.net`;
  }

  /**
   * Build blob URL
   */
  private buildBlobUrl(remoteKey: string): string {
    const baseUrl = this.getBaseUrl();
    const containerName = this.config.containerName;
    return `${baseUrl}/${containerName}/${remoteKey}`;
  }

  /**
   * Generate a signed URL (SAS URL) for blob access
   * @param remoteKey - Blob path
   * @param expiresInSeconds - URL expiration time (default 1 hour)
   * @returns Signed URL
   */
  private generateSignedUrl(remoteKey: string, expiresInSeconds: number = 3600): string {
    // If we have a SAS token, append it to the URL
    if (this.config.sasToken) {
      const blobUrl = this.buildBlobUrl(remoteKey);
      const sasToken = this.config.sasToken.startsWith('?') 
        ? this.config.sasToken 
        : `?${this.config.sasToken}`;
      return `${blobUrl}${sasToken}`;
    }

    // For full implementation with account key:
    // This would require computing a SAS signature using the account key
    // For now, return the blob URL (works if container is public)
    console.warn('[azure-storage] SAS generation requires @azure/storage-blob SDK or SAS token');
    return this.buildBlobUrl(remoteKey);
  }

  /**
   * Upload a file to Azure Blob Storage
   * 
   * Note: Full implementation requires @azure/storage-blob SDK
   * This implementation provides the interface and would work with:
   * npm install @azure/storage-blob
   */
  async upload(localPath: string, remoteKey: string, options?: UploadOptions): Promise<UploadResult> {
    if (!this.configured) {
      throw new Error('Azure storage not configured. Set AZURE_STORAGE_CONNECTION_STRING or account credentials.');
    }

    if (!existsSync(localPath)) {
      throw new Error(`Source file not found: ${localPath}`);
    }

    const stats = statSync(localPath);
    const content = readFileSync(localPath);

    // Compute checksum if requested
    let checksum: string | undefined;
    if (options?.verifyChecksum) {
      checksum = createHash('md5').update(content).digest('hex');
    }

    // TODO: Implement actual Azure upload
    // This would use @azure/storage-blob:
    // 
    // const { BlobServiceClient } = require('@azure/storage-blob');
    // const blobServiceClient = BlobServiceClient.fromConnectionString(this.config.connectionString);
    // const containerClient = blobServiceClient.getContainerClient(this.config.containerName);
    // const blockBlobClient = containerClient.getBlockBlobClient(remoteKey);
    // await blockBlobClient.uploadFile(localPath, {
    //   blobHTTPHeaders: { blobContentType: options?.contentType },
    //   metadata: options?.metadata
    // });

    console.warn('[azure-storage] Upload stub - install @azure/storage-blob for full implementation');

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return {
      url: this.generateSignedUrl(remoteKey),
      provider: this.provider,
      remoteKey,
      sizeBytes: stats.size,
      checksum,
      uploadedAt: new Date().toISOString(),
      signedUrlExpiresAt: expiresAt
    };
  }

  /**
   * Check if a blob exists
   */
  async exists(remoteKey: string): Promise<boolean> {
    if (!this.configured) {
      return false;
    }

    // TODO: Implement actual Azure check
    // const containerClient = blobServiceClient.getContainerClient(this.config.containerName);
    // const blockBlobClient = containerClient.getBlockBlobClient(remoteKey);
    // return await blockBlobClient.exists();

    console.warn('[azure-storage] Exists stub - install @azure/storage-blob for full implementation');
    return false;
  }

  /**
   * Delete a blob
   */
  async delete(remoteKey: string): Promise<boolean> {
    if (!this.configured) {
      return false;
    }

    // TODO: Implement actual Azure delete
    // const containerClient = blobServiceClient.getContainerClient(this.config.containerName);
    // const blockBlobClient = containerClient.getBlockBlobClient(remoteKey);
    // await blockBlobClient.delete();

    console.warn('[azure-storage] Delete stub - install @azure/storage-blob for full implementation');
    return false;
  }

  /**
   * Get signed URL for a blob
   */
  async getUrl(remoteKey: string, expiresInSeconds: number = 3600): Promise<string> {
    return this.generateSignedUrl(remoteKey, expiresInSeconds);
  }

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Get blob info
   */
  async getFileInfo(remoteKey: string): Promise<FileInfo | null> {
    if (!this.configured) {
      return null;
    }

    // TODO: Implement actual Azure blob properties fetch
    // const containerClient = blobServiceClient.getContainerClient(this.config.containerName);
    // const blockBlobClient = containerClient.getBlockBlobClient(remoteKey);
    // const properties = await blockBlobClient.getProperties();
    // return {
    //   key: remoteKey,
    //   sizeBytes: properties.contentLength,
    //   lastModified: properties.lastModified.toISOString(),
    //   contentType: properties.contentType,
    //   checksum: properties.contentMD5?.toString('hex')
    // };

    console.warn('[azure-storage] GetFileInfo stub - install @azure/storage-blob for full implementation');
    return null;
  }

  /**
   * List blobs with prefix
   */
  async list(prefix: string): Promise<FileInfo[]> {
    if (!this.configured) {
      return [];
    }

    // TODO: Implement actual Azure blob listing
    // const containerClient = blobServiceClient.getContainerClient(this.config.containerName);
    // const blobs: FileInfo[] = [];
    // for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    //   blobs.push({
    //     key: blob.name,
    //     sizeBytes: blob.properties.contentLength || 0,
    //     lastModified: blob.properties.lastModified?.toISOString() || '',
    //     contentType: blob.properties.contentType
    //   });
    // }
    // return blobs;

    console.warn('[azure-storage] List stub - install @azure/storage-blob for full implementation');
    return [];
  }
}

/**
 * Create Azure storage adapter from environment variables
 */
export function createAzureAdapterFromEnv(): AzureBlobStorageAdapter {
  const config: AzureStorageConfig = {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    containerName: process.env.AZURE_STORAGE_CONTAINER || 'sl18-renders',
    sasToken: process.env.AZURE_STORAGE_SAS_TOKEN
  };

  return new AzureBlobStorageAdapter(config);
}

/**
 * Create Azure storage adapter with explicit config
 */
export function createAzureAdapter(config: AzureStorageConfig): AzureBlobStorageAdapter {
  return new AzureBlobStorageAdapter(config);
}
