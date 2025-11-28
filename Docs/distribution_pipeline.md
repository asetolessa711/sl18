# Distribution Pipeline

This document describes SL18's media distribution pipeline for global content delivery, including streaming, CDN, DRM, and access control.

## Overview

The distribution pipeline enables adaptive streaming, secure playback, and global delivery of Waliin Studio content across all platforms and devices.

## Schema

- **Schema**: `schemas/distribution_pipeline.schema.json`
- **ID Pattern**: `dist-{identifier}`

## Components

### 1. Streaming

#### Protocols
| Protocol | Encryption | Use Case |
|----------|------------|----------|
| HLS | Sample-AES | Apple ecosystem |
| DASH | CENC | Android, browsers |
| Smooth | PlayReady | Xbox, Windows |
| Progressive | - | Downloads |

#### Adaptive Bitrate (ABR)
| Algorithm | Description |
|-----------|-------------|
| `bandwidth_estimation` | Network speed based |
| `buffer_based` | Buffer level based |
| `hybrid` | Combined approach |
| `ml_predictive` | ML-predicted quality |

#### Buffer Configuration
```json
{
  "minBufferSeconds": 15,
  "maxBufferSeconds": 60,
  "rebufferThreshold": 5
}
```

### 2. CDN

#### Providers
| Provider | Strengths | Regions |
|----------|-----------|---------|
| Cloudflare | Global edge, security | Worldwide |
| Akamai | Enterprise, media | Americas, APAC |
| Fastly | Low latency | Americas, EU |
| CloudFront | AWS integration | Global |

#### Multi-CDN Strategy
| Strategy | Description |
|----------|-------------|
| `weighted` | Traffic % allocation |
| `latency_based` | Lowest latency selection |
| `geo_based` | Region-specific routing |
| `failover` | Backup CDN on failure |
| `cost_optimized` | Minimize egress costs |

#### Caching Policy
```json
{
  "defaultTtl": 86400,
  "manifestTtl": 5,
  "segmentTtl": 3600,
  "bypassRules": ["/api/*", "/auth/*"]
}
```

#### Origin Shield
- Reduces origin load
- Centralized cache layer
- Regional shield locations

### 3. DRM

#### Providers
| Provider | Platforms | Security |
|----------|-----------|----------|
| Widevine | Android, Chrome, Firefox | L1, L2, L3 |
| FairPlay | iOS, Safari, Apple TV | Software |
| PlayReady | Edge, Xbox, Windows | SL150, SL2000 |

#### Key Management
```json
{
  "provider": "pallycon",
  "keyRotation": {
    "enabled": false,
    "interval": 60
  },
  "forensicWatermarking": {
    "enabled": true,
    "provider": "pallycon"
  }
}
```

#### Content Policies
| Tier | Max Resolution | Concurrent | Download |
|------|----------------|------------|----------|
| Free | 720p | 1 | No |
| Premium | 4K | 3 | Yes |
| Ultra | 4K HDR | 5 | Yes |

### 4. Access Control

#### Token Authentication
| Algorithm | Expiry | Features |
|-----------|--------|----------|
| JWT | 1 hour | Flexible claims |
| HMAC-SHA256 | 30 min | Simple validation |
| Signed URL | 4 hours | Direct access |

#### Geo-Restriction
```json
{
  "enabled": true,
  "mode": "blacklist",
  "countries": ["KP", "IR", "SY"],
  "vpnDetection": true,
  "proxyDetection": true
}
```

#### Device Limits
- Max registered devices: 5
- Supported types: mobile, tablet, desktop, smart_tv, streaming_device

#### Rate Limiting
- Requests per second: 100
- Burst size: 200

### 5. Offline Download

#### Download Profiles
| Profile | Resolution | Bitrate | Size/min |
|---------|------------|---------|----------|
| Low | 480p | 1 Mbps | 25 MB |
| Medium | 720p | 2.5 Mbps | 60 MB |
| High | 1080p | 5 Mbps | 120 MB |

#### Restrictions
```json
{
  "maxDownloads": 25,
  "expiryDays": 30,
  "requireWifi": true,
  "storageLimit": 50
}
```

### 6. Analytics

#### Providers
| Provider | Features |
|----------|----------|
| Conviva | QoE, engagement |
| Mux | Quality metrics, debugging |
| Youbora | Video analytics |
| Bitmovin | Playback analytics |

#### Event Tracking
- Play/pause/seek events
- Buffer events
- Quality changes
- Error tracking
- Ad events
- Completion tracking

## Metrics

| Metric | Description |
|--------|-------------|
| `totalStreams` | Total stream count |
| `concurrentPeak` | Peak concurrent viewers |
| `avgBitrate` | Average bitrate (kbps) |
| `avgStartupTime` | Time to first frame (s) |
| `rebufferRatio` | Rebuffer percentage |
| `errorRate` | Playback failure rate |
| `cdnHitRate` | CDN cache hit ratio |
| `bandwidthTB` | Total bandwidth delivered |

## Audit Events

| Event | Description |
|-------|-------------|
| `distribution_started` | Distribution began |
| `cdn_cache_purged` | Cache invalidated |
| `drm_license_issued` | License granted |
| `stream_started` | Playback started |
| `playback_error` | Playback failed |
| `offline_download_started` | Download initiated |

## Example Configuration

```json
{
  "pipelineId": "dist-waliin-global",
  "version": "1.0.0",
  "name": "Waliin Studio Global Distribution",
  "scope": {
    "level": "global",
    "platforms": ["web", "ios", "android", "smart_tv"]
  },
  "streaming": {
    "enabled": true,
    "adaptiveBitrate": {
      "algorithm": "hybrid",
      "minBitrate": 500,
      "maxBitrate": 20000
    }
  },
  "cdn": {
    "enabled": true,
    "multiCdn": {
      "enabled": true,
      "strategy": "latency_based"
    }
  },
  "drm": {
    "enabled": true,
    "providers": ["widevine", "fairplay", "playready"]
  },
  "status": "active"
}
```

## Related Documentation

- [Media Rendering](./media_rendering.md)
- [Media Localization](./media_localization.md)
- [Media Observability](./media_observability.md)
