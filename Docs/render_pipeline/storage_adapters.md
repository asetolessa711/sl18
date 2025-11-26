# Storage Adapters Documentation

## Overview

The Storage Adapter system provides a unified interface for uploading rendered videos to various storage backends. This abstraction allows the render pipeline to seamlessly switch between local storage (development) and cloud storage (production) without code changes.

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Storage Manager                             │
│  - Adapter selection                                          │
│  - Upload convenience methods                                 │
│  - Storage record building                                    │
└───────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────┐ ┌───────────┐
    │ LocalStorage  │ │   Azure   │ │    S3     │
    │   Adapter     │ │  Adapter  │ │  Adapter  │
    │  (default)    │ │  (stub)   │ │  (stub)   │
    └───────────────┘ └───────────┘ └───────────┘
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────┐ ┌───────────┐
    │  Local File   │ │Azure Blob │ │  AWS S3   │
    │    System     │ │  Storage  │ │  Bucket   │
    └───────────────┘ └───────────┘ └───────────┘
```

## Interface

All storage adapters implement the `StorageAdapter` interface:

```typescript
interface StorageAdapter {
  readonly provider: string;
  
  upload(localPath: string, remoteKey: string, options?: UploadOptions): Promise<UploadResult>;
  exists(remoteKey: string): Promise<boolean>;
  delete(remoteKey: string): Promise<boolean>;
  getUrl(remoteKey: string, expiresIn?: number): Promise<string>;
  isConfigured(): boolean;
}
```

## Local Storage Adapter

Default adapter for development and single-server deployments.

### Configuration

```bash
# No configuration required - uses default path
# Files stored in: storage/renders/{episodeId}/master.mp4
```

### Usage

```typescript
import { localStorageAdapter } from './render-stack/storage/local-storage.js';

// Upload a rendered video
const result = await localStorageAdapter.upload(
  'renders/test_001/master.mp4',
  'renders/test_001/master.mp4',
  { verifyChecksum: true }
);

console.log(result.url);  // file:///storage/renders/test_001/master.mp4
```

### Features

- Zero configuration required
- Automatic directory creation
- MD5 checksum computation
- File streaming support

## Azure Blob Storage Adapter (Stub)

Cloud storage for production deployments using Azure.

### Configuration

```bash
# Required environment variables
AZURE_STORAGE_ACCOUNT_NAME=youraccount
AZURE_STORAGE_ACCOUNT_KEY=yourkey
AZURE_STORAGE_CONTAINER_NAME=sl18-renders

# Optional
AZURE_STORAGE_CDN_ENDPOINT=https://cdn.yourdomain.com
```

### Implementation Status

⚠️ **Stub implementation** - requires `@azure/storage-blob` package and implementation of upload logic.

### To Implement

1. Install SDK: `npm install @azure/storage-blob`
2. Implement `upload()` using `BlockBlobClient.uploadFile()`
3. Implement `exists()` using `BlockBlobClient.exists()`
4. Implement `delete()` using `BlockBlobClient.delete()`
5. Implement `getUrl()` using SAS token generation

## AWS S3 Adapter (Stub)

Cloud storage for production deployments using AWS.

### Configuration

```bash
# Required environment variables
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=yourkey
AWS_SECRET_ACCESS_KEY=yoursecret
AWS_S3_BUCKET_NAME=sl18-renders

# Optional
AWS_CLOUDFRONT_URL=https://d123.cloudfront.net
```

### Implementation Status

⚠️ **Stub implementation** - requires `@aws-sdk/client-s3` package and implementation of upload logic.

### To Implement

1. Install SDK: `npm install @aws-sdk/client-s3`
2. Implement `upload()` using `PutObjectCommand`
3. Implement `exists()` using `HeadObjectCommand`
4. Implement `delete()` using `DeleteObjectCommand`
5. Implement `getUrl()` using presigned URLs

## Storage Manager

Convenience class for managing multiple adapters.

### Usage

```typescript
import { storageManager } from './render-stack/storage/storage-manager.js';

// Upload a render (uses default provider)
const result = await storageManager.uploadRender(
  'renders/test_001/master.mp4',
  'test_001'
);

// Check if render exists
const exists = await storageManager.renderExists('test_001');

// Get render URL
const url = await storageManager.getRenderUrl('test_001');

// Delete render
await storageManager.deleteRender('test_001');

// Get status of all adapters
const status = storageManager.getStatus();
```

## REST API

### Get Storage Status

```http
GET /api/storage/status
```

**Response:**
```json
{
  "providers": ["local", "azure", "s3"],
  "status": {
    "local": { "configured": true, "isDefault": true },
    "azure": { "configured": false, "isDefault": false },
    "s3": { "configured": false, "isDefault": false }
  }
}
```

### Get Render Info

```http
GET /api/storage/render/:episodeId
```

**Response:**
```json
{
  "episodeId": "test_001",
  "url": "file:///storage/renders/test_001/master.mp4",
  "exists": true,
  "provider": "local"
}
```

### Delete Render

```http
DELETE /api/storage/render/:episodeId
```

**Response:**
```json
{
  "success": true,
  "episodeId": "test_001",
  "message": "Render deleted for episode test_001"
}
```

### Serve Render Files

Files in local storage are accessible via HTTP:

```
GET /storage/renders/{episodeId}/master.mp4
```

Supports range requests for video streaming.

## Airtable Integration

After a successful render and upload, update the episode record:

```typescript
// Fields to update in Airtable Episodes table
{
  render_status: 'completed',
  render_url: result.url,
  render_storage_provider: result.provider,
  render_completed_at: result.uploadedAt
}
```

### Required Airtable Fields

| Field | Type | Description |
|-------|------|-------------|
| `render_status` | Single select | pending, completed, failed |
| `render_url` | URL | Link to rendered video |
| `render_storage_provider` | Single select | local, azure, s3 |
| `render_completed_at` | Date/Time | Completion timestamp |

## Publishing Integration

The Upload Queue should check `render_status` before publishing:

```typescript
// Guard: prevent publishing incomplete renders
if (record.render_status !== 'completed') {
  throw new Error('Cannot publish: render not completed');
}

// Use render_url for upload
const videoUrl = record.render_url;
```

## File Structure

```
render-stack/
└── storage/
    ├── storage.types.ts      # Type definitions
    ├── local-storage.ts      # Local filesystem adapter
    ├── azure-storage.ts      # Azure Blob Storage adapter (stub)
    ├── s3-storage.ts         # AWS S3 adapter (stub)
    ├── storage-manager.ts    # Manager class
    └── index.ts              # Module exports

storage/
└── renders/
    └── {episodeId}/
        └── master.mp4        # Rendered video

apps/control-panel/backend/src/
└── storage-api.ts            # REST API routes
```

## Security Considerations

1. **Path Traversal Prevention**: All remote keys are sanitized to prevent `../` attacks
2. **Access Control**: Cloud adapters should use signed URLs with expiration
3. **Checksums**: Optional MD5 verification prevents corrupted uploads
4. **Secrets Management**: Cloud credentials stored in `.env`, never committed

## Future Enhancements

- [ ] Implement Azure Blob Storage adapter
- [ ] Implement AWS S3 adapter
- [ ] Add multipart upload for large files
- [ ] Add retry logic for transient failures
- [ ] Add CDN invalidation after upload
- [ ] Add storage quota monitoring
- [ ] Add automatic cleanup of old renders
