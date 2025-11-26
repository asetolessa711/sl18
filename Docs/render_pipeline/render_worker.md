# Render Worker Documentation

## Overview

The Render Worker is the ffmpeg-based component that consumes `timeline.json` files and produces rendered video files (`master.mp4`). It manages a job queue, handles concurrent rendering, and provides REST API endpoints for job management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      REST API                                │
│  POST /api/render              - Queue new job               │
│  GET /api/render/:jobId        - Get job status              │
│  GET /api/render/episode/:id/status - Get by episode         │
│  GET /api/render/queue         - Queue statistics            │
│  DELETE /api/render/:jobId     - Cancel queued job           │
│  POST /api/render/worker/start - Start worker                │
│  POST /api/render/worker/stop  - Stop worker                 │
│  GET /api/render/health        - Health check                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Render Queue                              │
│  - In-memory job queue (MVP)                                │
│  - Priority-based ordering (urgent > high > normal > low)   │
│  - Episode deduplication                                    │
│  - Job history retention                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Render Worker                             │
│  - Concurrent job processing (configurable)                 │
│  - Timeline → ffmpeg command builder                        │
│  - Progress tracking                                        │
│  - Timeout handling                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      ffmpeg                                  │
│  - Video composition                                        │
│  - Audio mixing                                             │
│  - Subtitle burning                                         │
│  - Output encoding                                          │
└─────────────────────────────────────────────────────────────┘
```

## Job Lifecycle

```
┌─────────┐    enqueue    ┌─────────┐    dequeue    ┌───────────┐
│  NEW    │ ───────────▶  │ QUEUED  │ ───────────▶  │ RENDERING │
└─────────┘               └─────────┘               └───────────┘
                               │                          │
                               │ cancel                   │
                               ▼                          │
                          ┌─────────┐                     │
                          │ DELETED │                     │
                          └─────────┘                     │
                                                          │
                    ┌─────────────────────────────────────┘
                    │
           success  │  failure
        ┌───────────┼───────────┐
        ▼                       ▼
  ┌───────────┐           ┌─────────┐
  │ COMPLETED │           │ FAILED  │
  └───────────┘           └─────────┘
```

## API Reference

### Queue a Render Job

```http
POST /api/render
Content-Type: application/json

{
  "episodeId": "test_001",
  "timelinePath": "timelines/test_001/timeline.json",  // optional
  "priority": "normal",  // low, normal, high, urgent
  "force": false,        // allow re-queue if job exists
  "callbackUrl": "https://...",  // optional webhook
  "actor": "operator@example.com"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "render_abc123",
    "episodeId": "test_001",
    "status": "queued",
    "priority": "normal",
    "progress": 0,
    "queuedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Render job queued for episode test_001"
}
```

### Get Job Status

```http
GET /api/render/render_abc123
```

**Response:**
```json
{
  "job": {
    "id": "render_abc123",
    "episodeId": "test_001",
    "status": "completed",
    "progress": 100,
    "outputPath": "renders/test_001/master.mp4",
    "renderUrl": "file://renders/test_001/master.mp4",
    "queuedAt": "2024-01-15T10:30:00Z",
    "startedAt": "2024-01-15T10:30:05Z",
    "completedAt": "2024-01-15T10:31:35Z",
    "renderDuration": 90
  }
}
```

### Get Job by Episode ID

```http
GET /api/render/episode/test_001/status
```

**Response:**
```json
{
  "job": { ... },
  "isComplete": true,
  "isFailed": false,
  "isProcessing": false
}
```

### Get Queue Status

```http
GET /api/render/queue
```

**Response:**
```json
{
  "stats": {
    "total": 15,
    "byStatus": {
      "queued": 3,
      "rendering": 1,
      "completed": 10,
      "failed": 1
    },
    "processing": 1,
    "avgRenderTime": 45.5
  },
  "queued": [...],
  "rendering": [...],
  "recentCompleted": [...],
  "recentFailed": [...],
  "workerRunning": true
}
```

### Cancel a Job

```http
DELETE /api/render/render_abc123
```

Only jobs in `queued` status can be cancelled.

### Health Check

```http
GET /api/render/health
```

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "queueAvailable": true,
  "workerAvailable": true,
  "workerRunning": true,
  "ffmpegAvailable": true,
  "queueStats": { ... }
}
```

## Configuration

The render worker can be configured via environment variables or constructor options:

| Option | Default | Description |
|--------|---------|-------------|
| `maxConcurrent` | 2 | Maximum parallel renders |
| `maxRenderTime` | 600 | Timeout in seconds (10 min) |
| `ffmpegPath` | `ffmpeg` | Path to ffmpeg binary |
| `outputDir` | `renders` | Output directory |
| `tempDir` | `renders/tmp` | Temp directory for intermediates |
| `defaultVideoCodec` | `libx264` | Video codec |
| `defaultAudioCodec` | `aac` | Audio codec |
| `defaultVideoBitrate` | `5M` | Video bitrate |
| `defaultAudioBitrate` | `192k` | Audio bitrate |

## ffmpeg Command Building

The worker builds ffmpeg commands based on timeline content:

### Basic Structure
```bash
ffmpeg -y \
  -loop 1 -t {duration} -i background.png \  # Background
  -i voice.mp3 \                              # Voice audio
  -i music.mp3 \                              # Music audio
  -filter_complex "..." \                     # Filters
  -c:v libx264 -preset medium -crf 23 \       # Video encoding
  -c:a aac -b:a 192k \                        # Audio encoding
  -r 30 -t {duration} \                       # Frame rate & duration
  -movflags +faststart \                      # Web optimization
  output.mp4
```

### Audio Mixing
```
[1:a]volume=1.0[a1];
[2:a]volume=0.3[a2];
[a1][a2]amix=inputs=2:duration=longest[aout]
```

### Subtitle Burning
```
[v]subtitles='captions.srt':force_style='FontSize=24,PrimaryColour=&HFFFFFF&'[vout]
```

## Usage Examples

### CLI: Build and Render

```bash
# 1. Build timeline
npx tsx render-stack/builder/build-timeline.ts \
  -e test_001 \
  -m assets/test_001/manifest.json

# 2. Queue render via API
curl -X POST http://localhost:5178/api/render \
  -H "Content-Type: application/json" \
  -d '{"episodeId": "test_001"}'

# 3. Check status
curl http://localhost:5178/api/render/episode/test_001/status
```

### Programmatic Usage

```typescript
import { renderQueue, renderWorker } from './render-stack/worker/index.js';

// Queue a job
const job = renderQueue.enqueue({
  episodeId: 'test_001',
  priority: 'high'
});

// Start processing (if not already)
renderWorker.startProcessing();

// Or render directly (blocking)
const result = await renderWorker.renderEpisode('test_001');
console.log(`Rendered to: ${result.outputPath}`);
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| "Timeline not found" | Missing timeline.json | Run build-timeline.ts first |
| "Job already queued" | Duplicate episode | Use `force: true` to re-queue |
| "ffmpeg exited with code 1" | ffmpeg failure | Check ffmpeg logs, asset paths |
| "Render timeout" | Exceeded maxRenderTime | Increase timeout or optimize |

### Logging

The worker logs structured events:
- `[render-queue] Enqueued job {jobId} for episode {episodeId}`
- `[render-worker] Starting job {jobId} for episode {episodeId}`
- `[render-worker] ffmpeg command: ...`
- `[render-worker] Completed job {jobId}: {outputPath}`
- `[render-worker] Job {jobId} failed: {error}`

## File Structure

```
render-stack/
├── worker/
│   ├── render-job.types.ts     # Job type definitions
│   ├── render-queue.ts         # In-memory job queue
│   ├── render-worker.ts        # ffmpeg-based worker
│   └── index.ts                # Module exports
└── ...

apps/control-panel/backend/src/
├── render-api.ts               # REST API routes
└── server.ts                   # Express app (imports render-api)

renders/                        # Output directory
├── {episodeId}/
│   └── master.mp4              # Rendered video
└── tmp/                        # Intermediate files
    └── {episodeId}_captions.srt
```

## Future Enhancements

- [ ] Airtable-backed job queue for persistence
- [ ] Redis queue for distributed workers
- [ ] GPU-accelerated encoding (NVENC)
- [ ] Remotion integration for complex motion graphics
- [ ] Cloud storage adapters (Azure Blob, S3)
- [ ] Webhook notifications on completion
- [ ] Retry logic for transient failures
