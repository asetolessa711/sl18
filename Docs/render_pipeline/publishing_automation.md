# Publishing Automation Guide

This document describes the automated publishing system in the SL18 Render Stack, which handles distribution of approved episodes to external platforms (YouTube, Facebook, Instagram, TikTok).

## Overview

The publishing automation system provides:
- **Multi-platform support**: YouTube, Facebook, Instagram, TikTok
- **QC gating**: Only publish approved episodes
- **Job queue**: Retry support, priority ordering
- **Secrets management**: Token rotation tracking
- **Audit trail**: Full publishing history

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  QC Approval    │────▶│  Publishing     │────▶│  Platform       │
│  (Phase 4)      │     │  Queue          │     │  Adapters       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                       │
                               ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  History        │     │  YouTube/Meta/  │
                        │  Logging        │     │  FB/IG/TikTok   │
                        └─────────────────┘     └─────────────────┘
```

## REST API

### Trigger Publishing

```
POST /api/publish/:episodeId

Request Body:
{
  "platforms": ["youtube", "facebook", "instagram", "tiktok"],
  "metadata": {
    "title": "Episode Title",
    "description": "Video description",
    "tags": ["tag1", "tag2"],
    "privacyStatus": "public",
    "thumbnailPath": "/path/to/thumbnail.jpg",
    "playlistId": "PLxxx123",
    "madeForKids": false
  },
  "force": false,
  "actor": "Producer"
}

Response:
{
  "success": true,
  "episodeId": "test_001",
  "jobs": [
    {
      "id": "job_001",
      "platform": "youtube",
      "status": "queued",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "errors": [],
  "message": "Created 1 publishing job(s)"
}
```

### Get Publishing Status

```
GET /api/publish/:episodeId/status

Response:
{
  "episodeId": "test_001",
  "platforms": {
    "youtube": {
      "current": {
        "id": "job_001",
        "status": "completed",
        "progress": 100,
        "platformVideoId": "abc123",
        "platformUrl": "https://www.youtube.com/watch?v=abc123"
      },
      "history": [...]
    }
  }
}
```

### Get Queue Statistics

```
GET /api/publish/queue

Response:
{
  "stats": {
    "total": 10,
    "byStatus": {
      "pending": 2,
      "queued": 3,
      "uploading": 1,
      "processing": 0,
      "completed": 3,
      "failed": 1
    },
    "byPlatform": {
      "youtube": 7,
      "meta": 3,
      "tiktok": 0
    },
    "uploading": 1,
    "avgUploadTime": 150
  }
}
```

### Get Publishing History

```
GET /api/publish/history?limit=50&platform=youtube

Response:
{
  "history": [
    {
      "jobId": "job_001",
      "episodeId": "test_001",
      "platform": "youtube",
      "status": "completed",
      "platformVideoId": "abc123",
      "platformUrl": "https://www.youtube.com/watch?v=abc123",
      "publishedAt": "2024-01-15T12:00:00Z",
      "actor": "Producer"
    }
  ]
}
```

### Get Platform Configuration

```
GET /api/publish/config

Response:
{
  "platforms": {
    "youtube": {
      "configured": true,
      "rotation": {
        "lastRotatedAt": "2024-01-01T00:00:00Z",
        "rotationDueAt": "2024-04-01T00:00:00Z",
        "isOverdue": false,
        "daysUntilRotation": 30
      }
    },
    "meta": {
      "configured": true,
      "rotation": {...}
    },
    "facebook": {
      "configured": true,
      "rotation": {...}
    },
    "instagram": {
      "configured": true,
      "rotation": {...}
    },
    "tiktok": {
      "configured": false,
      "rotation": {...}
    }
  }
}
```

### Platform-Specific Publishing

#### Facebook

```
POST /api/publish/facebook/:episodeId

Request Body:
{
  "metadata": {
    "title": "Episode Title",
    "description": "Video description",
    "privacyStatus": "public",
    "custom": {
      "pageId": "optional_page_id"
    }
  }
}
```

#### Instagram

```
POST /api/publish/instagram/:episodeId

Request Body:
{
  "metadata": {
    "title": "Reel Title",
    "description": "Caption text",
    "tags": ["hashtag1", "hashtag2"],
    "custom": {
      "videoUrl": "https://storage.example.com/video.mp4",  // Required!
      "coverUrl": "https://storage.example.com/cover.jpg",
      "shareToFeed": true
    }
  }
}
```

**Note**: Instagram requires a publicly accessible video URL. Upload to storage first.

#### TikTok

```
POST /api/publish/tiktok/:episodeId

Request Body:
{
  "metadata": {
    "title": "Video title with #hashtags",
    "tags": ["trend1", "trend2"],
    "privacyStatus": "public",
    "custom": {
      "disableDuet": false,
      "disableComment": false,
      "disableStitch": false
    }
  }
}
```

### Get Platform-Specific Status

```
GET /api/publish/:platform/:episodeId/status

Example: GET /api/publish/instagram/test_001/status

Response:
{
  "episodeId": "test_001",
  "platform": "instagram",
  "current": {
    "id": "job_001",
    "status": "completed",
    "platformVideoId": "ig_123",
    "platformUrl": "https://www.instagram.com/reel/ig_123"
  },
  "history": [...]
}
```

### Get Platform-Specific History

```
GET /api/publish/:platform/history?limit=50

Example: GET /api/publish/tiktok/history

Response:
{
  "platform": "tiktok",
  "history": [...],
  "count": 10
}
```

### Cancel Publishing Job

```
DELETE /api/publish/:jobId

Response:
{
  "success": true,
  "jobId": "job_001",
  "message": "Publishing job cancelled"
}
```

### Approve Pending Job

```
POST /api/publish/:jobId/approve

Request Body:
{
  "approvedBy": "Producer"
}

Response:
{
  "success": true,
  "job": {
    "id": "job_001",
    "status": "queued",
    "queuedAt": "2024-01-15T11:00:00Z",
    "qcApproval": {
      "approvedAt": "2024-01-15T11:00:00Z",
      "approvedBy": "Producer"
    }
  }
}
```

## Platform Setup

### YouTube Setup

1. **Create OAuth 2.0 credentials** in Google Cloud Console
2. **Enable YouTube Data API v3**
3. **Configure environment variables**:

```env
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_ACCESS_TOKEN=your_access_token
YOUTUBE_REFRESH_TOKEN=your_refresh_token
YOUTUBE_SECRETS_LAST_ROTATED=2024-01-01T00:00:00Z
```

4. **Optional**: Save OAuth client secret to `config/youtube_client_secret.json`

### Meta (Facebook/Instagram) Setup

1. **Create Meta App** in Meta for Developers
2. **Request required permissions**:
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
3. **Configure environment variables**:

```env
META_ACCESS_TOKEN=your_access_token
META_PAGE_ID=your_facebook_page_id
META_IG_USER_ID=your_instagram_user_id
META_SECRETS_LAST_ROTATED=2024-01-01T00:00:00Z
```

### TikTok Setup

1. **Create TikTok Developer App** at developers.tiktok.com
2. **Request required scopes**:
   - `video.upload`
   - `video.publish`
3. **Configure environment variables**:

```env
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_ACCESS_TOKEN=your_access_token
TIKTOK_USERNAME=your_username
TIKTOK_SECRETS_LAST_ROTATED=2024-01-01T00:00:00Z
```

### Facebook Setup (Standalone)

If using Facebook separately from Meta adapter:

```env
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_APP_ID=your_app_id
FACEBOOK_SECRETS_LAST_ROTATED=2024-01-01T00:00:00Z
```

### Instagram Setup (Standalone)

If using Instagram separately:

```env
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_USER_ID=your_ig_user_id
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_SECRETS_LAST_ROTATED=2024-01-01T00:00:00Z
```

**Note**: Instagram requires a Business or Creator account linked to a Facebook Page.

## QC Gating

Publishing is gated by QC approval:

1. **Episode renders successfully**
2. **QC flags are evaluated**:
   - Caption length checks
   - Duration checks
   - Content warning keywords
3. **If `needsHumanReview` is true**, episode must be reviewed
4. **After approval**, publishing can proceed
5. **Force publish** option bypasses QC (use with caution)

### QC Approval Flow

```
Episode Rendered → QC Check → needsHumanReview?
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
         Review Required                          Auto-Approved
              │                                           │
              ▼                                           ▼
     POST /api/qc/episodes/:id/review          Ready for Publishing
              │
              ▼
       Publishing Queue
```

## Job Lifecycle

```
┌─────────┐   QC Approve   ┌─────────┐   Dequeue   ┌───────────┐
│ PENDING │───────────────▶│ QUEUED  │────────────▶│ UPLOADING │
└─────────┘                └─────────┘             └───────────┘
                                │                       │
                          Cancel │                      │
                                ▼                       ▼
                           (Deleted)            ┌───────────┐
                                                │PROCESSING │
                                                └───────────┘
                                                      │
                              ┌────────────┬──────────┴──────────┐
                              ▼            ▼                      ▼
                        ┌───────────┐ ┌─────────┐          ┌─────────┐
                        │ COMPLETED │ │  RETRY  │──────────│ FAILED  │
                        └───────────┘ └─────────┘          └─────────┘
                                           │                    │
                                           └────────────────────┘
                                             (if retries < max)
```

## Secrets Rotation

API tokens should be rotated every 90 days. The system tracks rotation status:

```env
YOUTUBE_SECRETS_LAST_ROTATED=2024-01-01T00:00:00Z
META_SECRETS_LAST_ROTATED=2024-01-01T00:00:00Z
```

The `/api/publish/config` endpoint returns rotation status:

```json
{
  "rotation": {
    "lastRotatedAt": "2024-01-01T00:00:00Z",
    "rotationDueAt": "2024-04-01T00:00:00Z",
    "isOverdue": false,
    "daysUntilRotation": 30
  }
}
```

**⚠️ Alerts are raised when rotation is overdue.**

## Retry Logic

Publishing jobs automatically retry on failure:

- **Default max retries**: 3
- **Backoff**: Exponential (5s, 10s, 20s)
- **Re-queue**: Failed jobs return to queue for retry
- **Final failure**: After max retries, job marked as failed

## Audit Trail

All publishing events are logged to `logs/publishing.jsonl`:

```jsonl
{"timestamp":"2024-01-15T12:00:00Z","jobId":"job_001","episodeId":"test_001","platform":"youtube","success":true,"videoId":"abc123","actor":"Producer"}
{"timestamp":"2024-01-15T12:05:00Z","jobId":"job_002","episodeId":"test_002","platform":"meta","success":false,"error":"Token expired","actor":"Producer"}
```

## Troubleshooting

### "QC not approved" Error

Episode requires human review. Use the QC API to review:

```
POST /api/qc/episodes/:episodeId/review
{
  "reviewedBy": "Operator",
  "approved": true
}
```

### "YouTube adapter not configured"

Set required environment variables:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_ACCESS_TOKEN` or `YOUTUBE_REFRESH_TOKEN`

### "Meta adapter not configured"

Set `META_ACCESS_TOKEN` environment variable.

### "Authentication failed"

Token may be expired. Refresh tokens or re-authenticate:
1. For YouTube: Run OAuth flow to get new tokens
2. For Meta: Generate new long-lived access token

### "Quota exceeded"

YouTube has daily upload limits. Wait until quota resets (Pacific time midnight) or request quota increase.

### "Max retries exceeded"

Check the error message for root cause:
- Network issues: Check connectivity
- API errors: Check credentials and quotas
- File issues: Verify render exists at `videoPath`

## Best Practices

1. **Always review QC flags** before publishing
2. **Rotate secrets** before they expire
3. **Monitor queue** for stuck jobs
4. **Keep thumbnails** under 2MB for YouTube
5. **Test with `privacyStatus: "private"`** before going public
6. **Log actor names** for audit trail

## Security Considerations

### Rate Limiting

For production deployments, consider adding rate limiting to the publish API endpoints to prevent abuse:

```typescript
// Example with express-rate-limit
import rateLimit from 'express-rate-limit';

const publishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 publish requests per window
  message: 'Too many publish requests, please try again later'
});

app.use('/api/publish', publishLimiter, publishRouter);
```

### API Key Security

- Store API credentials in environment variables, never in code
- Use `.env.local` for local development (ignored by git)
- Use Azure Key Vault or AWS Secrets Manager for production
- Rotate credentials every 90 days
