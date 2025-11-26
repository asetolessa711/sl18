/**
 * Storage Module Exports
 * Centralized exports for storage adapters and utilities.
 */

// Types
export type {
  StorageAdapter,
  UploadResult,
  UploadOptions,
  FileInfo,
  StorageConfig,
  RenderStorageRecord,
  StorageManagerStatus
} from './storage.types.js';

// Local Storage
export {
  LocalStorageAdapter,
  createLocalAdapter,
  getDefaultLocalAdapter,
  localStorageAdapter
} from './local-storage.js';

// Azure Storage
export type { AzureStorageConfig } from './azure-storage.js';
export {
  AzureBlobStorageAdapter,
  createAzureAdapter,
  createAzureAdapterFromEnv
} from './azure-storage.js';

// S3 Storage
export type { S3StorageConfig } from './s3-storage.js';
export {
  S3StorageAdapter,
  createS3Adapter,
  createS3AdapterFromEnv
} from './s3-storage.js';

// Storage Manager
export type { StorageProviderType } from './storage-manager.js';
export {
  StorageManager,
  getStorageManager,
  createStorageManager,
  storageManager
} from './storage-manager.js';
