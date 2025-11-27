/**
 * Storage Types and Interfaces
 * Defines the contract for storage adapters supporting local, Azure, and S3.
 */

/**
 * Upload options for storage operations
 */
export interface UploadOptions {
  /** Whether to compute and verify checksum */
  verifyChecksum?: boolean;
  /** Content type override */
  contentType?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
  /** Cache control header */
  cacheControl?: string;
}

/**
 * Result of an upload operation
 */
export interface UploadResult {
  /** Public or signed URL to access the file */
  url: string;
  /** Storage provider name */
  provider: string;
  /** Remote path/key in storage */
  remoteKey: string;
  /** File size in bytes */
  sizeBytes: number;
  /** MD5 or other checksum if computed */
  checksum?: string;
  /** ISO timestamp of upload completion */
  uploadedAt: string;
  /** Signed URL expiration (for cloud providers) */
  signedUrlExpiresAt?: string;
}

/**
 * Storage adapter interface
 * All storage providers must implement this interface.
 */
export interface StorageAdapter {
  /** Provider identifier (local, azure, s3) */
  readonly provider: string;

  /**
   * Upload a file to storage
   * @param localPath - Path to local file
   * @param remoteKey - Destination path in storage
   * @param options - Upload options
   * @returns Upload result with URL and metadata
   */
  upload(localPath: string, remoteKey: string, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Check if a file exists in storage
   * @param remoteKey - Path in storage
   * @returns true if file exists
   */
  exists(remoteKey: string): Promise<boolean>;

  /**
   * Delete a file from storage
   * @param remoteKey - Path in storage
   * @returns true if deleted, false if not found
   */
  delete(remoteKey: string): Promise<boolean>;

  /**
   * Get URL for a file (signed URL for cloud providers)
   * @param remoteKey - Path in storage
   * @param expiresInSeconds - URL expiration time (for cloud providers)
   * @returns URL to access the file
   */
  getUrl(remoteKey: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Check if the adapter is properly configured
   * @returns true if ready to use
   */
  isConfigured(): boolean;

  /**
   * Get file info (size, modified date)
   * @param remoteKey - Path in storage
   * @returns File info or null if not found
   */
  getFileInfo?(remoteKey: string): Promise<FileInfo | null>;

  /**
   * List files in a directory
   * @param prefix - Path prefix to list
   * @returns Array of file info
   */
  list?(prefix: string): Promise<FileInfo[]>;
}

/**
 * File information
 */
export interface FileInfo {
  key: string;
  sizeBytes: number;
  lastModified: string;
  contentType?: string;
  checksum?: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Default provider to use */
  defaultProvider: 'local' | 'azure' | 's3';
  
  /** Local storage configuration */
  local?: {
    basePath: string;
    baseUrl?: string;
  };

  /** Azure Blob Storage configuration */
  azure?: {
    connectionString?: string;
    accountName?: string;
    accountKey?: string;
    containerName: string;
    sasToken?: string;
  };

  /** AWS S3 configuration */
  s3?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region: string;
    bucket: string;
    endpoint?: string;
  };
}

/**
 * Render storage record for Airtable integration
 * Matches Airtable field naming convention
 */
export interface RenderStorageRecord {
  episodeId: string;
  render_storage_provider: string;
  render_url: string;
  render_remote_key: string;
  render_size_bytes: number;
  render_checksum?: string;
  render_completed_at: string;
  render_status: 'pending' | 'completed' | 'failed';
  /** Signed URL expiration for cloud storage */
  render_url_expires_at?: string;
}

/**
 * Storage manager status
 */
export interface StorageManagerStatus {
  defaultProvider: string;
  providers: {
    local: boolean;
    azure: boolean;
    s3: boolean;
  };
  configured: boolean;
}
