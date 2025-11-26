# Control Panel Usage Guide

This guide covers the SL18 Control Panel UI and Airtable integration for operators and producers.

## Overview

The Control Panel provides visibility into the render pipeline without requiring code access:

- **Render Dashboard**: Queue status, job progress, and storage usage
- **QC Reports**: Episodes needing review, content warnings, and approval workflow
- **Persona Previews**: Visual styling for each persona/franchise
- **Airtable Sync**: Lightweight external tracking via Airtable

## Getting Started

### Starting the Control Panel

```bash
# From repository root
cd apps/control-panel/backend
npm install
npm run dev
```

The backend runs on `http://localhost:5178` by default.

### Frontend Development

```bash
cd apps/control-panel/frontend
npm install
npm run dev
```

The frontend opens at `http://localhost:5173`.

## Dashboard Features

### Render Queue

The render queue shows real-time status of all render jobs:

| Status | Description |
|--------|-------------|
| `queued` | Waiting to be processed |
| `rendering` | Currently being rendered |
| `completed` | Successfully rendered |
| `failed` | Render failed (check error) |

**Queue Stats Endpoint**: `GET /api/control-panel/queue`

```json
{
  "stats": {
    "queued": 5,
    "rendering": 2,
    "completed": 45,
    "failed": 3,
    "total": 55,
    "averageRenderTime": 180000
  },
  "fetchedAt": "2024-01-15T10:30:00Z"
}
```

### QC Dashboard

View QC flags and approve episodes for publishing:

**Get QC Details**: `GET /api/control-panel/qc/:episodeId`

```json
{
  "episodeId": "test_001",
  "qcFlags": {
    "needsHumanReview": true,
    "contentWarnings": ["explicit"],
    "reviewedAt": null,
    "reviewedBy": null
  },
  "personaCode": "ADDIS",
  "personaStyle": {
    "primaryColor": "#FFD700",
    "fontFamily": "Montserrat"
  },
  "renderStatus": {
    "status": "completed",
    "outputUrl": "/storage/renders/test_001/master.mp4"
  }
}
```

### Persona Previews

Preview persona styling before rendering:

**Get Preview**: `GET /api/control-panel/persona-preview/:code`

```json
{
  "preview": {
    "code": "ADDIS",
    "primaryColor": "#FFD700",
    "secondaryColor": "#FFFFFF",
    "fontFamily": "Montserrat",
    "captionPosition": "bottom",
    "motionPreset": "bounce",
    "transitionPreset": "fade",
    "sampleOverlay": "<div>...</div>"
  }
}
```

## Airtable Integration

### Configuration

Set these environment variables:

```bash
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_EPISODES_TABLE=Episodes
AIRTABLE_WEBHOOK_URL=https://hooks.example.com/webhook  # Optional
```

### Synced Fields

The following fields are synced to Airtable:

| SL18 Field | Airtable Field | Description |
|------------|----------------|-------------|
| renderStatus | `render_status` | queued/rendering/completed/failed |
| renderUrl | `render_url` | URL to rendered video |
| renderCompletedAt | `render_completed_at` | ISO timestamp |
| storageProvider | `render_storage_provider` | local/azure/s3 |
| needsHumanReview | `qc_needs_review` | Boolean |
| contentWarnings | `qc_content_warnings` | Comma-separated |
| reviewedAt | `qc_reviewed_at` | ISO timestamp |
| reviewedBy | `qc_reviewed_by` | Reviewer name |

### Triggering Sync

**Sync Episodes**: `POST /api/control-panel/airtable-sync`

```json
{
  "episodeIds": ["test_001", "test_002"],
  "syncType": "all"  // "all", "render", or "qc"
}
```

Response:
```json
{
  "total": 2,
  "succeeded": 2,
  "failed": 0,
  "results": [
    { "success": true, "episodeId": "test_001", "syncedAt": "..." },
    { "success": true, "episodeId": "test_002", "syncedAt": "..." }
  ]
}
```

### Checking Sync Status

**Get Status**: `GET /api/control-panel/airtable-sync/status`

```json
{
  "configured": true,
  "baseId": "app12345...",
  "table": "Episodes",
  "webhookConfigured": true
}
```

### Sync History

**Get History**: `GET /api/control-panel/airtable-sync/history?limit=50`

```json
{
  "history": [
    { "success": true, "episodeId": "test_001", "syncedAt": "2024-01-15T10:30:00Z" },
    { "success": false, "episodeId": "test_002", "error": "...", "syncedAt": "..." }
  ],
  "count": 2
}
```

## Webhooks

When configured, webhooks notify external systems of events:

### Events

| Event | Trigger |
|-------|---------|
| `render_completed` | Episode finished rendering |
| `render_failed` | Render failed |
| `qc_review_completed` | Episode reviewed by operator |

### Payload Format

```json
{
  "event": "render_completed",
  "episodeId": "test_001",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "renderUrl": "https://storage.example.com/test_001/master.mp4",
    "success": true
  }
}
```

## UI Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Home with quick actions |
| `/episodes` | Episode management |
| `/upload` | Upload queue |
| `/validate` | Run diagnostics |
| `/docs` | Documentation viewer |
| `/alerts` | Alert center |
| `/settings` | Admin settings |

## Troubleshooting

### Airtable Sync Fails

1. Check `AIRTABLE_API_KEY` is set and valid
2. Verify `AIRTABLE_BASE_ID` matches your base
3. Ensure the Episodes table has the expected fields
4. Check sync history for error details

### Queue Stats Empty

1. Verify renders directory exists: `renders/`
2. Check render status files: `renders/{episodeId}/render_status.json`
3. Ensure backend is running on correct port

### Persona Preview Missing

1. Verify persona styles file: `render-stack/config/persona_styles.json`
2. Check persona code matches (case-insensitive)

## API Reference

### Control Panel Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/control-panel/queue` | Queue statistics |
| GET | `/api/control-panel/qc/:episodeId` | QC details |
| GET | `/api/control-panel/render-dashboard` | Full dashboard data |
| GET | `/api/control-panel/persona-preview/:code` | Persona preview |
| POST | `/api/control-panel/airtable-sync` | Trigger sync |
| GET | `/api/control-panel/airtable-sync/status` | Sync config status |
| GET | `/api/control-panel/airtable-sync/history` | Sync history |

### QC Endpoints (existing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/qc/personas` | List personas |
| GET | `/api/qc/personas/:code` | Get persona |
| GET | `/api/qc/episodes` | List episodes |
| GET | `/api/qc/episodes/:episodeId` | Get episode |
| POST | `/api/qc/episodes/:episodeId/review` | Submit review |
| GET | `/api/qc/stats` | QC statistics |

## Best Practices

1. **Regular Syncs**: Sync to Airtable after each render completes
2. **QC Before Publish**: Only publish episodes with `needsHumanReview: false`
3. **Monitor Webhooks**: Set up alerts for `render_failed` events
4. **Review History**: Check sync history for failures before publishing
