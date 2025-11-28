# Distribution Connectors

This document describes the distribution connectors system in SL18, enabling syndication of Waliin Studio content to external partners like Drama Box, RealShort, Mini Drama, and OTT apps.

## Overview

Distribution connectors provide a standardized way to integrate with external content distribution platforms. Each connector handles:

- API integration with partner platforms
- Content metadata mapping and transformation
- Format conversion for partner requirements
- Syndication workflow automation
- Health monitoring and error handling

## Supported Partner Types

| Partner Type | Description | Examples |
|-------------|-------------|----------|
| `drama_box` | Drama Box platform integration | Drama Box Global, Drama Box Asia |
| `realshort` | RealShort platform integration | RealShort US, RealShort India |
| `mini_drama` | Mini Drama platform integration | Mini Drama China |
| `ott_app` | OTT application integration | Custom OTT apps |
| `streaming_service` | General streaming services | Partner streaming platforms |
| `social_platform` | Social media platforms | TikTok, Instagram Reels |
| `aggregator` | Content aggregators | Multi-platform distributors |
| `broadcaster` | Traditional broadcasters | TV networks |

## Partnership Tiers

- **Strategic**: Top-tier partners with premium integration, priority support, and custom features
- **Premium**: High-value partners with advanced features and dedicated support
- **Standard**: Standard integration with full feature access
- **Trial**: Trial period partners evaluating the platform
- **Community**: Community partners with basic integration

## API Configuration

### Authentication Types

```json
{
  "authType": "oauth2",
  "credentialRef": "vault://sl18/partners/dramabox/oauth",
  "scopes": ["content:write", "content:read", "analytics:read"]
}
```

Supported authentication methods:
- `oauth2` - OAuth 2.0 with token refresh
- `api_key` - API key authentication
- `bearer_token` - Bearer token authentication
- `jwt` - JSON Web Token authentication
- `hmac` - HMAC signature authentication
- `basic_auth` - Basic HTTP authentication

### Rate Limiting

```json
{
  "rateLimits": {
    "requestsPerMinute": 100,
    "requestsPerDay": 10000,
    "burstLimit": 20
  }
}
```

### Retry Policy

```json
{
  "retryPolicy": {
    "maxRetries": 3,
    "backoffMultiplier": 2,
    "initialDelayMs": 1000,
    "maxDelayMs": 30000,
    "retryableStatusCodes": [429, 500, 502, 503, 504]
  }
}
```

## Syndication Rules

### Content Filters

Filter content eligible for syndication:

```json
{
  "contentFilters": {
    "contentTypes": ["short_drama", "episode", "movie"],
    "genres": ["drama", "romance", "comedy"],
    "excludedGenres": ["horror", "adult"],
    "contentRatings": ["G", "PG", "PG-13", "TV-14"],
    "languages": ["en", "am", "sw", "zh"],
    "minimumQcScore": 85,
    "requiredQcPasses": ["technical", "content", "cultural"]
  }
}
```

### Metadata Mapping

Map SL18 metadata to partner format:

```json
{
  "metadataMapping": {
    "titleField": "title",
    "descriptionField": "synopsis",
    "genreMapping": {
      "drama": "DRAMA",
      "romance": "ROMANCE"
    },
    "customFields": [
      {
        "sourceField": "personas",
        "targetField": "cast_tags",
        "transform": "array_to_csv"
      }
    ]
  }
}
```

### Format Requirements

Specify video/audio format requirements:

```json
{
  "formatRequirements": {
    "videoFormats": [
      { "codec": "h264", "container": "mp4", "resolution": "1080p" }
    ],
    "aspectRatios": ["9:16", "16:9"],
    "audioFormats": [
      { "codec": "aac", "channels": "stereo", "sampleRate": 48000 }
    ],
    "subtitleFormats": ["srt", "vtt"],
    "maxDurationSeconds": 600,
    "minDurationSeconds": 60
  }
}
```

### Packaging Options

Automatic content packaging for short-form distribution:

```json
{
  "packagingOptions": {
    "generateTeasers": true,
    "teaserDurationSeconds": 30,
    "generateVerticalClips": true,
    "burnInSubtitles": false,
    "addWatermark": true,
    "watermarkPosition": "bottom_right"
  }
}
```

## Compliance Settings

### QC Requirements

```json
{
  "qcRequirements": {
    "technicalQc": true,
    "contentQc": true,
    "culturalQc": true,
    "personaQc": true,
    "translationQc": true,
    "minimumScore": 85
  }
}
```

### Cultural Sensitivity

```json
{
  "culturalSensitivity": {
    "enabled": true,
    "regions": ["asia", "africa", "middle_east"],
    "sensitivityLevels": ["medium", "high", "critical"],
    "blockOnViolation": true
  }
}
```

## Health Monitoring

### Health Checks

```json
{
  "healthMonitoring": {
    "healthCheckEnabled": true,
    "healthCheckInterval": 60,
    "alertThresholds": {
      "errorRatePercent": 5,
      "latencyMs": 3000,
      "availabilityPercent": 99.5
    }
  }
}
```

### Circuit Breaker

Automatic circuit breaker to prevent cascade failures:

```json
{
  "circuitBreaker": {
    "enabled": true,
    "failureThreshold": 5,
    "recoveryTimeSeconds": 60,
    "halfOpenRequests": 3
  }
}
```

## Webhook Integration

Receive real-time updates from partners:

```json
{
  "webhooks": {
    "enabled": true,
    "callbackUrl": "https://api.sl18.io/webhooks/dramabox",
    "events": [
      "content_published",
      "playback_started",
      "playback_completed",
      "monetization_event"
    ]
  }
}
```

## Connector Lifecycle

1. **Pending Setup**: Initial configuration
2. **Active**: Fully operational
3. **Maintenance**: Temporarily paused for maintenance
4. **Suspended**: Suspended due to issues
5. **Inactive**: Manually deactivated
6. **Deprecated**: Being phased out

## Related Documentation

- [Distribution Rights](./distribution_rights.md)
- [Distribution Observability](./distribution_observability.md)
- [Media Rendering](./media_rendering.md)
- [Partner Ecosystem](./partner_ecosystem.md)
