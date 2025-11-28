# Media Observability

This document describes SL18's media observability system for playback metrics, QoE monitoring, error tracking, and performance analytics.

## Overview

The media observability system provides real-time visibility into playback quality, error tracking, regional performance, and content analytics for Waliin Studio productions.

## Schema

- **Schema**: `schemas/media_observability.schema.json`
- **ID Pattern**: `mobs-{identifier}`

## Components

### 1. Playback Metrics

#### Analytics Providers
| Provider | Features | Use Case |
|----------|----------|----------|
| Conviva | QoE, engagement, AI insights | Enterprise |
| Mux | Quality, debugging, alerts | Developer-focused |
| Youbora | Video analytics, engagement | Comprehensive |
| Bitmovin Analytics | Player-specific metrics | Bitmovin users |

#### QoE Thresholds
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Startup Time | 2s | 3s | 5s |
| Rebuffer Ratio | 0.5% | 1% | 2% |
| Playback Failure | 0.1% | 0.5% | 1% |
| Primary Resolution | 90% | 80% | - |

#### Event Tracking
| Event | Properties |
|-------|------------|
| `play_request` | content_id, user_id, device, region |
| `play_start` | startup_time, initial_bitrate, resolution |
| `buffer_start` | buffer_time, bitrate, playhead |
| `quality_change` | from_bitrate, to_bitrate, reason |
| `error` | error_code, message, stack_trace |
| `complete` | watch_time, completion_percentage |

### 2. Error Tracking

#### Error Categories
| Category | Severity | Examples |
|----------|----------|----------|
| Network | High | Timeout, connection failed |
| DRM | Critical | License fail, key error |
| Decoder | Medium | Codec unsupported |
| CDN | Critical | 5xx errors |
| Manifest | High | Parse errors |
| Client | Medium | Player errors |

#### Error Response
```json
{
  "enabled": true,
  "threshold": 1,
  "channels": ["pagerduty", "slack"],
  "stackTraceCollection": true,
  "deviceInfo": true,
  "networkInfo": true
}
```

### 3. Region Heatmaps

#### Granularity Levels
| Level | Description |
|-------|-------------|
| `country` | Country-level aggregation |
| `region` | State/province level |
| `city` | City-level detail |
| `isp` | ISP-level breakdown |

#### Tracked Metrics
- Concurrent viewers
- Play attempts
- Error rate
- Average bitrate
- Rebuffer ratio
- Startup time
- Engagement score

#### Configuration
```json
{
  "enabled": true,
  "granularity": "city",
  "updateInterval": 5,
  "retention": 90
}
```

### 4. Content Analytics

#### Per-Title Metrics
| Metric | Description |
|--------|-------------|
| Views | Total play count |
| Unique Viewers | Distinct users |
| Avg Watch Time | Mean viewing duration |
| Completion Rate | % completed views |
| Peak Concurrent | Max simultaneous viewers |
| Total Watch Hours | Aggregate hours |
| Engagement Score | Composite metric |

#### Engagement Tracking
| Feature | Description |
|---------|-------------|
| Seek Heatmap | Where users seek |
| Replay Tracking | Rewatched segments |
| Drop-off Points | Exit locations |

#### Audience Retention
```json
{
  "enabled": true,
  "granularity": 5,
  "segments": [
    "new_users",
    "returning_users",
    "subscribers",
    "free_tier",
    "region",
    "device"
  ]
}
```

### 5. CDN Metrics

#### Tracked Metrics
| Metric | Description |
|--------|-------------|
| Cache Hit Ratio | % served from cache |
| Bandwidth | Data transferred |
| Requests | Request count |
| Latency P50/P95/P99 | Response latency |
| Error Rate | CDN errors |
| Throughput | Transfer speed |

#### Origin Metrics
- Shield hit ratio
- Origin latency
- Origin errors

### 6. Dashboards

#### Dashboard Types
| Type | Use Case |
|------|----------|
| `realtime` | Live monitoring |
| `qoe_overview` | Quality summary |
| `content_performance` | Title analytics |
| `error_analysis` | Error deep-dive |
| `cdn_health` | CDN performance |
| `regional_performance` | Geographic analysis |
| `engagement` | User behavior |

#### Widget Types
| Widget | Use Case |
|--------|----------|
| `counter` | Single value |
| `gauge` | Target comparison |
| `line_chart` | Time series |
| `bar_chart` | Comparisons |
| `pie_chart` | Distribution |
| `heatmap` | Density view |
| `table` | Detailed data |
| `map` | Geographic |
| `timeline` | Event sequence |

### 7. Alerting

#### Alert Rules
```json
{
  "ruleId": "alert-high-error",
  "name": "High Error Rate",
  "metric": "error_rate",
  "condition": {
    "operator": "gt",
    "threshold": 1,
    "duration": 300
  },
  "severity": "critical",
  "channels": ["pagerduty", "slack"],
  "runbook": "https://docs.sl18.io/runbooks/high-error-rate"
}
```

#### Severity Levels
| Severity | Response Time | Escalation |
|----------|---------------|------------|
| Critical | Immediate | PagerDuty + phone |
| High | 15 minutes | Slack + email |
| Medium | 1 hour | Slack |
| Low | 4 hours | Email |
| Info | - | Log only |

#### Notification Channels
- Slack
- PagerDuty
- Email
- SMS
- Mobile push
- Webhook

### 8. Reporting

#### Report Types
| Type | Frequency | Recipients |
|------|-----------|------------|
| Daily Summary | Daily | Ops team |
| Weekly QoE | Weekly | Leadership |
| Monthly Performance | Monthly | Executives |
| Content Report | Weekly | Content team |
| Error Report | On-demand | Engineering |

#### Formats
- PDF
- CSV
- Excel
- JSON

## Key Performance Indicators

### QoE Score
Composite score (0-100) based on:
- Startup time (25%)
- Rebuffer ratio (25%)
- Error rate (25%)
- Resolution quality (25%)

### Engagement Score
Based on:
- Watch time / content length
- Completion rate
- Return rate
- Interaction events

## Current Metrics

| Metric | Value |
|--------|-------|
| Concurrent Viewers | 12,456 |
| Peak Concurrent | 45,230 |
| Avg Startup Time | 1.8s |
| Rebuffer Ratio | 0.3% |
| Error Rate | 0.05% |
| CDN Hit Rate | 98.5% |
| QoE Score | 94.2 |

## Audit Events

| Event | Description |
|-------|-------------|
| `observability_alert_triggered` | Alert fired |
| `qoe_threshold_breached` | QoE degraded |
| `cdn_performance_degraded` | CDN issues |
| `error_spike_detected` | Error surge |
| `report_generated` | Report created |

## Example Configuration

```json
{
  "observabilityId": "mobs-waliin-production",
  "version": "1.0.0",
  "name": "Waliin Studio Media Observability",
  "scope": {
    "level": "global",
    "platforms": ["web", "ios", "android", "smart_tv"]
  },
  "playbackMetrics": {
    "enabled": true,
    "collection": {
      "provider": "mux",
      "samplingRate": 100,
      "beaconInterval": 10
    },
    "qoe": {
      "startupTime": {"target": 2, "critical": 5},
      "rebufferRatio": {"target": 0.5, "critical": 2}
    }
  },
  "alerting": {
    "enabled": true,
    "rules": [
      {
        "name": "High Error Rate",
        "metric": "error_rate",
        "threshold": 1,
        "severity": "critical"
      }
    ]
  },
  "status": "active"
}
```

## Related Documentation

- [Media Rendering](./media_rendering.md)
- [Distribution Pipeline](./distribution_pipeline.md)
- [Media Localization](./media_localization.md)
