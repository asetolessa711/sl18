# Distribution Observability

This document describes the distribution observability system in SL18, providing partner metrics, syndication dashboards, error tracking, and compliance monitoring.

## Overview

Distribution observability enables operators to monitor and analyze content syndication across all partner platforms. The system provides:

- Real-time and historical partner metrics
- Syndication performance dashboards
- Error tracking and alerting
- Compliance monitoring
- Revenue analytics

## Partner Metrics

### Collection Configuration

```json
{
  "partnerMetrics": {
    "enabled": true,
    "collectionFrequency": "hourly",
    "retentionDays": 365
  }
}
```

### Performance Metrics

| Metric | Description |
|--------|-------------|
| `views` | Total content views |
| `uniqueViewers` | Unique viewer count |
| `watchTime` | Total watch time |
| `completionRate` | Percentage of content completed |
| `avgViewDuration` | Average view duration |
| `peakConcurrentViewers` | Maximum concurrent viewers |
| `startupTime` | Video startup latency |
| `rebufferRatio` | Rebuffering percentage |
| `playbackFailures` | Failed playback attempts |

### Engagement Metrics

| Metric | Description |
|--------|-------------|
| `likes` | Like/reaction count |
| `shares` | Share count |
| `comments` | Comment count |
| `saves` | Save/bookmark count |
| `followsGained` | New followers from content |
| `clickThroughRate` | CTR from recommendations |
| `conversionRate` | Subscription conversions |

### Monetization Metrics

| Metric | Description |
|--------|-------------|
| `grossRevenue` | Total revenue before deductions |
| `netRevenue` | Revenue after deductions |
| `revenuePerView` | RPV |
| `revenuePerUser` | ARPU |
| `adRevenue` | Revenue from ads |
| `subscriptionRevenue` | Subscription revenue |
| `cpm` | Cost per mille |
| `fillRate` | Ad fill rate |

## Syndication Dashboards

### Dashboard Types

| Dashboard | Purpose |
|-----------|---------|
| `overview` | High-level distribution performance |
| `partner_performance` | Individual partner metrics |
| `content_distribution` | Content-level analytics |
| `revenue_analytics` | Revenue breakdown and trends |
| `error_tracking` | Error and failure monitoring |
| `compliance_status` | Compliance and rights status |
| `real_time` | Live syndication monitoring |

### Widget Types

| Widget | Use Case |
|--------|----------|
| `kpi_card` | Key metric display |
| `line_chart` | Trends over time |
| `bar_chart` | Comparisons |
| `pie_chart` | Distribution breakdown |
| `table` | Detailed data |
| `map` | Geographic distribution |
| `heatmap` | Activity patterns |
| `funnel` | Conversion flows |
| `leaderboard` | Top performers |
| `status_grid` | Health status overview |

### Example Dashboard Configuration

```json
{
  "dashboards": [
    {
      "dashboardId": "dash-overview",
      "name": "Distribution Overview",
      "type": "overview",
      "widgets": [
        {
          "widgetId": "widget-total-views",
          "type": "kpi_card",
          "title": "Total Views",
          "metric": "views_total",
          "timeRange": "30d",
          "refreshInterval": 300
        },
        {
          "widgetId": "widget-partner-performance",
          "type": "bar_chart",
          "title": "Views by Partner",
          "dimensions": ["partner"],
          "timeRange": "7d"
        },
        {
          "widgetId": "widget-geo-distribution",
          "type": "map",
          "title": "Geographic Distribution",
          "dimensions": ["country"]
        }
      ],
      "refreshInterval": 300,
      "defaultTimeRange": "30d"
    }
  ]
}
```

## Error Tracking

### Error Categories

| Category | Description |
|----------|-------------|
| `api_error` | Partner API failures |
| `format_mismatch` | Content format issues |
| `metadata_error` | Metadata validation failures |
| `network_error` | Network connectivity issues |
| `auth_error` | Authentication failures |
| `rate_limit` | Rate limit exceeded |
| `validation_error` | Data validation failures |
| `content_error` | Content processing errors |
| `drm_error` | DRM licensing errors |
| `geo_block` | Geo-restriction violations |

### Severity Levels

- **Critical**: Immediate attention required, syndication blocked
- **High**: Significant impact, requires urgent resolution
- **Medium**: Moderate impact, should be resolved soon
- **Low**: Minor impact, can be scheduled for resolution
- **Info**: Informational, no action required

### Alert Thresholds

```json
{
  "alertThresholds": {
    "errorRatePercent": {
      "warning": 2,
      "critical": 5
    },
    "errorCountPerHour": {
      "warning": 50,
      "critical": 200
    },
    "consecutiveFailures": 3
  }
}
```

### Escalation Configuration

```json
{
  "escalation": [
    {
      "level": 1,
      "delayMinutes": 0,
      "channels": ["slack"],
      "recipients": ["#distribution-alerts"]
    },
    {
      "level": 2,
      "delayMinutes": 15,
      "channels": ["email", "slack"],
      "recipients": ["tech-lead@sl18.io"]
    },
    {
      "level": 3,
      "delayMinutes": 30,
      "channels": ["pagerduty"],
      "recipients": ["distribution-oncall"]
    }
  ]
}
```

## Alert Rules

### Alert Types

| Type | Description |
|------|-------------|
| `threshold` | Metric exceeds/falls below threshold |
| `anomaly` | Anomaly detection using ML |
| `trend` | Trend analysis alerts |
| `absence` | Missing data alerts |
| `composite` | Multiple conditions combined |

### Example Alert Rules

```json
{
  "alertRules": [
    {
      "ruleId": "alert-high-error-rate",
      "name": "High Error Rate",
      "type": "threshold",
      "metric": "error_rate",
      "condition": {
        "operator": "gt",
        "value": 5,
        "duration": "5m"
      },
      "severity": "critical",
      "channels": ["slack", "pagerduty"]
    },
    {
      "ruleId": "alert-revenue-drop",
      "name": "Revenue Drop",
      "type": "anomaly",
      "metric": "revenue",
      "severity": "high",
      "channels": ["email"]
    }
  ]
}
```

### Partner Health Alerts

```json
{
  "partnerHealthAlerts": {
    "apiLatency": {
      "warningMs": 2000,
      "criticalMs": 5000
    },
    "availability": {
      "warningPercent": 99,
      "criticalPercent": 95
    },
    "syndicationDelay": {
      "warningMinutes": 60,
      "criticalMinutes": 180
    }
  }
}
```

### Compliance Alerts

```json
{
  "complianceAlerts": {
    "rightsExpiring": {
      "daysBeforeWarning": 30,
      "daysBeforeCritical": 7
    },
    "geoViolation": true,
    "contentRatingViolation": true,
    "qcFailure": true
  }
}
```

## Reporting

### Scheduled Reports

| Report Type | Frequency | Contents |
|-------------|-----------|----------|
| `partner_summary` | Weekly | Partner performance overview |
| `revenue_breakdown` | Monthly | Detailed revenue analysis |
| `performance_digest` | Weekly | Performance metrics summary |
| `error_summary` | Daily | Error statistics |
| `compliance_audit` | Monthly | Compliance status |
| `content_analytics` | Weekly | Content-level metrics |

### Report Configuration

```json
{
  "scheduledReports": [
    {
      "reportId": "report-weekly-summary",
      "name": "Weekly Partner Summary",
      "type": "partner_summary",
      "frequency": "weekly",
      "recipients": ["partnerships@sl18.io"],
      "format": "pdf",
      "timezone": "UTC"
    }
  ]
}
```

## Integrations

### Datadog

```json
{
  "datadog": {
    "enabled": true,
    "metrics": true,
    "logs": true,
    "traces": true
  }
}
```

### Slack

```json
{
  "slack": {
    "enabled": true,
    "channels": {
      "alerts": "#distribution-alerts",
      "reports": "#distribution-reports",
      "errors": "#distribution-errors"
    }
  }
}
```

### PagerDuty

```json
{
  "pagerduty": {
    "enabled": true,
    "serviceName": "SL18 Distribution"
  }
}
```

## Audit Logging

```json
{
  "auditLogging": {
    "enabled": true,
    "events": [
      "connector_created",
      "syndication_started",
      "syndication_completed",
      "rights_granted",
      "revenue_recorded",
      "error_detected",
      "compliance_violation"
    ],
    "retentionDays": 365,
    "immutable": true,
    "exportEnabled": true
  }
}
```

## Best Practices

1. **Set Appropriate Thresholds**: Tune alert thresholds to avoid alert fatigue
2. **Use Escalation Paths**: Configure multi-level escalation for critical issues
3. **Monitor Revenue Trends**: Track revenue anomalies early
4. **Review Compliance Regularly**: Check rights expiration proactively
5. **Aggregate Errors**: Group similar errors to identify root causes
6. **Schedule Regular Reports**: Keep stakeholders informed

## Related Documentation

- [Distribution Connectors](./distribution_connectors.md)
- [Distribution Rights](./distribution_rights.md)
- [Infrastructure Monitoring](./infrastructure_monitoring.md)
- [Security Observability](./security_observability.md)
