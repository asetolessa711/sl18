# Cloud Storage Setup

This document describes how to configure Azure Blob Storage and AWS S3 for the SL18 render pipeline.

## Storage Providers

SL18 supports three storage providers:

| Provider | Use Case | Status |
|----------|----------|--------|
| Local | Development, single server | ✅ Full |
| Azure | Production (Azure cloud) | ✅ Full |
| S3 | Production (AWS cloud) | ✅ Full |

## Local Storage

Default for development. No configuration required.

### Configuration

```bash
# Optional: customize paths
export LOCAL_STORAGE_PATH="./storage/renders"
export LOCAL_STORAGE_URL="/storage"
```

### File Location

Renders are stored at:
```
{repo}/storage/renders/{episodeId}/master.mp4
```

## Azure Blob Storage

### Prerequisites

1. Azure Storage Account
2. Container created (e.g., `sl18-renders`)
3. Access credentials (connection string or SAS token)

### Configuration

#### Option 1: Connection String (Recommended)

```bash
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=sl18storage;AccountKey=xxx;EndpointSuffix=core.windows.net"
export AZURE_STORAGE_CONTAINER="sl18-renders"
```

#### Option 2: Account Key

```bash
export AZURE_STORAGE_ACCOUNT_NAME="sl18storage"
export AZURE_STORAGE_ACCOUNT_KEY="your-account-key"
export AZURE_STORAGE_CONTAINER="sl18-renders"
```

#### Option 3: SAS Token

```bash
export AZURE_STORAGE_ACCOUNT_NAME="sl18storage"
export AZURE_STORAGE_SAS_TOKEN="?sv=2021-06-08&ss=b&srt=sco&sp=rwdlacx..."
export AZURE_STORAGE_CONTAINER="sl18-renders"
```

### Azure Portal Setup

1. **Create Storage Account**
   - Go to Azure Portal → Storage Accounts → Create
   - Choose Standard performance, StorageV2
   - Select your region

2. **Create Container**
   - Open storage account → Containers → + Container
   - Name: `sl18-renders`
   - Access level: Private (unless public access needed)

3. **Get Connection String**
   - Storage Account → Access keys → Connection string
   - Copy and set as `AZURE_STORAGE_CONNECTION_STRING`

4. **Generate SAS Token (Optional)**
   - Storage Account → Shared access signature
   - Configure permissions: Read, Write, Delete, List
   - Set expiry date
   - Generate and copy token

### Blob Structure

```
sl18-renders/
├── renders/
│   ├── episode_001/
│   │   └── master.mp4
│   ├── episode_002/
│   │   └── master.mp4
│   └── ...
```

### Signed URLs

Azure adapter generates SAS-signed URLs for secure access:

```typescript
const url = await azureAdapter.getUrl('renders/episode_001/master.mp4', 3600);
// Returns: https://sl18storage.blob.core.windows.net/sl18-renders/renders/episode_001/master.mp4?sv=...
```

## AWS S3

### Prerequisites

1. AWS Account
2. S3 Bucket created
3. IAM credentials with S3 access

### Configuration

```bash
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_REGION="us-east-1"
export S3_BUCKET="sl18-renders"

# Optional: for S3-compatible services (MinIO, etc.)
export S3_ENDPOINT="https://minio.example.com"
export S3_FORCE_PATH_STYLE="true"
```

### AWS Console Setup

1. **Create S3 Bucket**
   - Go to S3 → Create bucket
   - Name: `sl18-renders`
   - Region: Choose closest to your users
   - Block all public access (recommended)

2. **Create IAM User**
   - IAM → Users → Add user
   - Enable programmatic access
   - Attach policy: `AmazonS3FullAccess` or custom policy

3. **Custom IAM Policy (Least Privilege)**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::sl18-renders",
        "arn:aws:s3:::sl18-renders/*"
      ]
    }
  ]
}
```

### Bucket Structure

```
sl18-renders/
├── renders/
│   ├── episode_001/
│   │   └── master.mp4
│   ├── episode_002/
│   │   └── master.mp4
│   └── ...
```

### Presigned URLs

S3 adapter generates presigned URLs for secure access:

```typescript
const url = await s3Adapter.getUrl('renders/episode_001/master.mp4', 3600);
// Returns: https://sl18-renders.s3.us-east-1.amazonaws.com/renders/episode_001/master.mp4?AWSAccessKeyId=...
```

## Storage Manager

The storage manager orchestrates multiple adapters:

```typescript
import { storageManager } from './render-stack/storage';

// Upload with default provider
await storageManager.uploadRender('episode_001', '/path/to/render.mp4');

// Upload to specific provider
await storageManager.uploadRender('episode_001', '/path/to/render.mp4', 'azure');

// Upload with failover
await storageManager.uploadWithFailover('episode_001', '/path/to/render.mp4');

// Replicate to multiple providers
await storageManager.replicateRender('episode_001', '/path/to/render.mp4', ['local', 'azure', 's3']);
```

### Provider Priority

Set default provider:

```bash
export STORAGE_PROVIDER="azure"  # Options: local, azure, s3
```

### Failover Behavior

If the default provider fails, the manager tries other configured providers:

1. Default provider (e.g., Azure)
2. Fallback 1 (e.g., S3)
3. Fallback 2 (e.g., Local)

## API Endpoints

### Storage Status

```bash
GET /api/storage/status

# Response
{
  "providers": ["local", "azure"],
  "status": {
    "local": true,
    "azure": true,
    "s3": false
  },
  "defaultProvider": "azure"
}
```

### Get Render URL

```bash
GET /api/storage/render/episode_001

# Response
{
  "episodeId": "episode_001",
  "url": "https://sl18storage.blob.core.windows.net/...",
  "exists": true,
  "provider": "azure"
}
```

### Delete Render

```bash
DELETE /api/storage/render/episode_001

# Response
{
  "success": true,
  "message": "Render deleted for episode episode_001"
}
```

## Security Best Practices

### Credentials

1. **Never commit credentials** to source control
2. Use environment variables or secret managers
3. Rotate keys regularly
4. Track rotation dates in `.env`

```bash
# .env.example
AZURE_STORAGE_CONNECTION_STRING=
AZURE_SECRETS_LAST_ROTATED=2024-01-15
AWS_ACCESS_KEY_ID=
AWS_SECRETS_LAST_ROTATED=2024-01-15
```

### Access Control

1. **Azure**: Use RBAC and private containers
2. **S3**: Use IAM policies with least privilege
3. **Signed URLs**: Set short expiration times (1 hour default)

### Checksums

Enable checksum verification for uploads:

```typescript
await storageManager.uploadRender('episode_001', '/path/to/render.mp4', 'azure', {
  verifyChecksum: true
});
```

## Monitoring

### Metrics to Track

| Metric | Description |
|--------|-------------|
| upload_duration | Time to upload render |
| upload_size_bytes | Size of uploaded file |
| upload_failures | Count of failed uploads |
| storage_cost | Estimated storage cost |

### Logging

Storage operations emit structured logs:

```
[storage-manager] Attempting upload to azure
[azure-storage] Upload started: renders/episode_001/master.mp4
[azure-storage] Upload completed: 1.2MB in 3.5s
[storage-manager] Upload successful to azure
```

## Troubleshooting

### Azure Issues

**"Storage not configured" error:**
- Check `AZURE_STORAGE_CONNECTION_STRING` is set
- Verify container exists

**"Access denied" error:**
- Check account key is valid
- Verify container permissions

### S3 Issues

**"Credentials not found" error:**
- Check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Verify IAM user has S3 permissions

**"Bucket does not exist" error:**
- Verify `S3_BUCKET` matches actual bucket name
- Check region matches bucket location

### General Issues

**Uploads timing out:**
- Check network connectivity
- Increase timeout settings
- Verify file size limits

## Related Documentation

- [Render Worker](./render_worker.md)
- [E2E Testing](./e2e_testing.md)
- [Storage Adapters API](./storage_adapters.md)
