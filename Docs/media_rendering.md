# Media Rendering Pipeline

This document describes SL18's media rendering pipeline for Waliin Studio productions, covering video ingest, transcoding, packaging, and optimization.

## Overview

The media rendering pipeline enables SL18 to produce, encode, and package short-form dramas, movies, and series episodes at scale for global delivery.

## Schema

- **Schema**: `schemas/media_rendering.schema.json`
- **ID Pattern**: `render-{identifier}`

## Pipeline Stages

### 1. Ingest Pipeline

#### Sources
| Source Type | Description | Use Case |
|-------------|-------------|----------|
| `direct_upload` | Browser/API upload | Manual submissions |
| `s3` | S3 bucket integration | Bulk asset import |
| `gcs` | Google Cloud Storage | GCP workflows |
| `capcut_export` | CapCut export integration | SL18 editor output |
| `studio_link` | Studio system link | Production workflows |

#### Accepted Formats
- **Production**: ProRes, DNxHD, MXF, RAW
- **Delivery**: MP4, MOV, AVI, MKV, WebM

#### Preprocessing
- Deinterlacing
- Denoising
- Color correction
- Audio normalization
- Frame rate conversion

#### Quality Analysis
| Metric | Description | Threshold |
|--------|-------------|-----------|
| VMAF | Video quality score | ≥ 85 |
| PSNR | Peak signal-to-noise ratio | ≥ 40 dB |
| SSIM | Structural similarity | ≥ 0.95 |
| Bitrate Consistency | Encoding quality | ± 10% |

### 2. Transcoding

#### Video Codecs
| Codec | Profile | Use Case |
|-------|---------|----------|
| H.264 | High | Wide compatibility |
| H.265/HEVC | Main10 | 4K/HDR content |
| VP9 | - | Web browsers |
| AV1 | Main | Next-gen streaming |

#### Audio Codecs
| Codec | Channels | Use Case |
|-------|----------|----------|
| AAC | Stereo | Standard audio |
| AC-3 | 5.1 | Surround sound |
| E-AC-3 | 7.1/Atmos | Premium audio |
| Opus | Stereo | Low-latency |

#### Rendition Ladder
| Rendition | Resolution | Bitrate | Device Target |
|-----------|------------|---------|---------------|
| 4K UHD | 3840x2160 | 15-20 Mbps | Smart TV |
| Full HD | 1920x1080 | 4-8 Mbps | Desktop |
| HD Ready | 1280x720 | 2-4 Mbps | Tablet |
| SD | 854x480 | 1-2 Mbps | Mobile |
| Vertical | 1080x1920 | 2.5-5 Mbps | Short-form |

#### Optimizations
- **Per-title Encoding**: Content-specific bitrate optimization
- **Two-pass Encoding**: Higher quality at lower bitrates
- **Scene Detection**: Intelligent keyframe placement
- **HDR→SDR Tone Mapping**: HDR content for SDR displays

### 3. Packaging

#### Formats
| Format | DRM Support | Use Case |
|--------|-------------|----------|
| HLS | FairPlay | Apple devices |
| DASH | Widevine, PlayReady | Android, browsers |
| CMAF | All | Unified packaging |
| Smooth Streaming | PlayReady | Xbox, Windows |

#### Encryption
```json
{
  "enabled": true,
  "drm": ["widevine", "fairplay", "playready"],
  "keyRotation": false,
  "segmentDuration": 6
}
```

#### Low-Latency Streaming
- Target latency: 3 seconds
- Part duration: 0.5 seconds
- LL-HLS/LL-DASH support

### 4. Thumbnails & Trailers

#### Thumbnail Generation
- Interval: 10 seconds
- Formats: JPG, WebP, AVIF
- Sprite sheets for scrubbing
- AI-powered selection

#### Poster Generation
- Sizes: Small (300x450), Medium (600x900), Large (1200x1800)
- AI-generated options

#### Auto Trailer Generation
| Algorithm | Description |
|-----------|-------------|
| `highlight_detection` | Find key moments |
| `scene_analysis` | Story structure |
| `ai_summary` | ML-based highlights |

#### Short-form Teasers
- Platforms: TikTok, Instagram Reels, YouTube Shorts
- Durations: 15s, 30s, 60s

## Storage

### Primary Storage
```json
{
  "provider": "s3",
  "bucket": "sl18-media-production",
  "region": "us-east-1",
  "storageClass": "standard"
}
```

### Replication
- Multi-region: US, EU, APAC
- Automatic sync

### Lifecycle Policy
| Stage | Duration | Storage Class |
|-------|----------|---------------|
| Hot | 0-30 days | Standard |
| Warm | 31-90 days | Intelligent Tiering |
| Archive | 91-365 days | Glacier |
| Delete | > 7 years | - |

## Scheduling

### Priority Queues
| Queue | Max Concurrent | Timeout | Use Case |
|-------|----------------|---------|----------|
| Realtime | 10 | 60 min | Live content |
| Standard | 50 | 240 min | Regular processing |
| Batch | 100 | Overnight | Bulk operations |

## Metrics

| Metric | Description |
|--------|-------------|
| `jobsCompleted` | Total completed jobs |
| `jobsFailed` | Failed job count |
| `avgTranscodeTime` | Average processing time |
| `avgQualityScore` | Average VMAF score |
| `storageUsed` | Total storage in TB |

## Audit Events

| Event | Description |
|-------|-------------|
| `rendering_job_created` | New job submitted |
| `rendering_job_completed` | Job finished |
| `transcode_started` | Transcoding began |
| `quality_check_passed` | QC passed |
| `thumbnail_generated` | Thumbnails created |
| `trailer_generated` | Trailer created |

## Example Configuration

```json
{
  "renderingId": "render-waliin-production",
  "version": "1.0.0",
  "name": "Waliin Studio Production Pipeline",
  "scope": {
    "level": "global",
    "contentTypes": ["short_drama", "movie", "series_episode"]
  },
  "transcoding": {
    "enabled": true,
    "engine": "mediaconvert",
    "optimizations": {
      "perTitleEncoding": true,
      "twoPassEncoding": true
    }
  },
  "status": "active"
}
```

## Related Documentation

- [Distribution Pipeline](./distribution_pipeline.md)
- [Media Localization](./media_localization.md)
- [Media Observability](./media_observability.md)
