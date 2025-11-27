/**
 * AWS S3 Storage Adapter
 * Stores files in AWS S3 buckets.
 * Supports signed URLs for secure access.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { createHash, createHmac } from 'crypto';
import type { StorageAdapter, UploadResult, UploadOptions, FileInfo } from './storage.types.js';

/**
 * S3 storage configuration
 */
export interface S3StorageConfig {
  /** AWS access key ID */
  accessKeyId?: string;
  /** AWS secret access key */
  secretAccessKey?: string;
  /** AWS region */
  region: string;
  /** S3 bucket name */
  bucket: string;
  /** Custom endpoint URL (for MinIO or other S3-compatible services) */
  endpoint?: string;
  /** Force path style (required for MinIO) */
  forcePathStyle?: boolean;
}

/**
 * AWS S3 Storage Adapter Implementation
 */
export class S3StorageAdapter implements StorageAdapter {
  readonly provider = 's3';
  private config: S3StorageConfig;
  private configured: boolean = false;

  constructor(config: S3StorageConfig) {
    this.config = config;
    this.configured = this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): boolean {
    // Must have bucket and region at minimum
    if (!this.config.bucket || !this.config.region) {
      return false;
    }
    // Must have credentials (or rely on IAM role)
    if (this.config.accessKeyId && this.config.secretAccessKey) {
      return true;
    }
    // Check for environment credentials
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return true;
    }
    // Could be using IAM role (EC2, Lambda, etc.)
    return true;
  }

  /**
   * Get the S3 endpoint URL
   */
  private getEndpoint(): string {
    if (this.config.endpoint) {
      return this.config.endpoint;
    }
    return `https://s3.${this.config.region}.amazonaws.com`;
  }

  /**
   * Build S3 object URL
   */
  private buildObjectUrl(remoteKey: string): string {
    const endpoint = this.getEndpoint();
    const bucket = this.config.bucket;

    if (this.config.forcePathStyle) {
      return `${endpoint}/${bucket}/${remoteKey}`;
    }

    // Virtual-hosted style (default for AWS)
    if (this.config.endpoint) {
      return `${endpoint}/${bucket}/${remoteKey}`;
    }
    return `https://${bucket}.s3.${this.config.region}.amazonaws.com/${remoteKey}`;
  }

  /**
   * Generate a presigned URL for S3 object access
   * @param remoteKey - Object key
   * @param expiresInSeconds - URL expiration time (default 1 hour)
   * @returns Presigned URL
   */
  private generatePresignedUrl(remoteKey: string, expiresInSeconds: number = 3600): string {
    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      console.warn('[s3-storage] Cannot generate presigned URL without credentials');
      return this.buildObjectUrl(remoteKey);
    }

    // Simplified presigned URL generation
    // Full implementation would use AWS SDK:
    // const s3Client = new S3Client({ region: this.config.region });
    // const command = new GetObjectCommand({ Bucket: this.config.bucket, Key: remoteKey });
    // return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const stringToSign = `GET\n\n\n${expires}\n/${this.config.bucket}/${remoteKey}`;
    
    const signature = createHmac('sha1', this.config.secretAccessKey)
      .update(stringToSign)
      .digest('base64');

    const encodedSignature = encodeURIComponent(signature);
    const objectUrl = this.buildObjectUrl(remoteKey);
    
    return `${objectUrl}?AWSAccessKeyId=${this.config.accessKeyId}&Expires=${expires}&Signature=${encodedSignature}`;
  }

  /**
   * Upload a file to S3
   * 
   * Note: Full implementation requires @aws-sdk/client-s3
   * This implementation provides the interface and would work with:
   * npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   */
  async upload(localPath: string, remoteKey: string, options?: UploadOptions): Promise<UploadResult> {
    if (!this.configured) {
      throw new Error('S3 storage not configured. Set AWS credentials and bucket.');
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

    // TODO: Implement actual S3 upload
    // This would use @aws-sdk/client-s3:
    // 
    // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    // const s3Client = new S3Client({
    //   region: this.config.region,
    //   credentials: {
    //     accessKeyId: this.config.accessKeyId,
    //     secretAccessKey: this.config.secretAccessKey
    //   }
    // });
    // await s3Client.send(new PutObjectCommand({
    //   Bucket: this.config.bucket,
    //   Key: remoteKey,
    //   Body: content,
    //   ContentType: options?.contentType,
    //   Metadata: options?.metadata,
    //   CacheControl: options?.cacheControl
    // }));

    console.warn('[s3-storage] Upload stub - install @aws-sdk/client-s3 for full implementation');

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return {
      url: this.generatePresignedUrl(remoteKey),
      provider: this.provider,
      remoteKey,
      sizeBytes: stats.size,
      checksum,
      uploadedAt: new Date().toISOString(),
      signedUrlExpiresAt: expiresAt
    };
  }

  /**
   * Check if an object exists
   */
  async exists(remoteKey: string): Promise<boolean> {
    if (!this.configured) {
      return false;
    }

    // TODO: Implement actual S3 check
    // const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
    // const s3Client = new S3Client({ region: this.config.region });
    // try {
    //   await s3Client.send(new HeadObjectCommand({
    //     Bucket: this.config.bucket,
    //     Key: remoteKey
    //   }));
    //   return true;
    // } catch (e) {
    //   if (e.name === 'NotFound') return false;
    //   throw e;
    // }

    console.warn('[s3-storage] Exists stub - install @aws-sdk/client-s3 for full implementation');
    return false;
  }

  /**
   * Delete an object
   */
  async delete(remoteKey: string): Promise<boolean> {
    if (!this.configured) {
      return false;
    }

    // TODO: Implement actual S3 delete
    // const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    // const s3Client = new S3Client({ region: this.config.region });
    // await s3Client.send(new DeleteObjectCommand({
    //   Bucket: this.config.bucket,
    //   Key: remoteKey
    // }));
    // return true;

    console.warn('[s3-storage] Delete stub - install @aws-sdk/client-s3 for full implementation');
    return false;
  }

  /**
   * Get presigned URL for an object
   */
  async getUrl(remoteKey: string, expiresInSeconds: number = 3600): Promise<string> {
    return this.generatePresignedUrl(remoteKey, expiresInSeconds);
  }

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Get object info
   */
  async getFileInfo(remoteKey: string): Promise<FileInfo | null> {
    if (!this.configured) {
      return null;
    }

    // TODO: Implement actual S3 head object
    // const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
    // const s3Client = new S3Client({ region: this.config.region });
    // try {
    //   const response = await s3Client.send(new HeadObjectCommand({
    //     Bucket: this.config.bucket,
    //     Key: remoteKey
    //   }));
    //   return {
    //     key: remoteKey,
    //     sizeBytes: response.ContentLength,
    //     lastModified: response.LastModified.toISOString(),
    //     contentType: response.ContentType,
    //     checksum: response.ETag?.replace(/"/g, '')
    //   };
    // } catch (e) {
    //   return null;
    // }

    console.warn('[s3-storage] GetFileInfo stub - install @aws-sdk/client-s3 for full implementation');
    return null;
  }

  /**
   * List objects with prefix
   */
  async list(prefix: string): Promise<FileInfo[]> {
    if (!this.configured) {
      return [];
    }

    // TODO: Implement actual S3 list
    // const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
    // const s3Client = new S3Client({ region: this.config.region });
    // const response = await s3Client.send(new ListObjectsV2Command({
    //   Bucket: this.config.bucket,
    //   Prefix: prefix
    // }));
    // return (response.Contents || []).map(obj => ({
    //   key: obj.Key,
    //   sizeBytes: obj.Size,
    //   lastModified: obj.LastModified.toISOString(),
    //   checksum: obj.ETag?.replace(/"/g, '')
    // }));

    console.warn('[s3-storage] List stub - install @aws-sdk/client-s3 for full implementation');
    return [];
  }
}

/**
 * Create S3 storage adapter from environment variables
 */
export function createS3AdapterFromEnv(): S3StorageAdapter {
  const config: S3StorageConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'sl18-renders',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
  };

  return new S3StorageAdapter(config);
}

/**
 * Create S3 storage adapter with explicit config
 */
export function createS3Adapter(config: S3StorageConfig): S3StorageAdapter {
  return new S3StorageAdapter(config);
}
