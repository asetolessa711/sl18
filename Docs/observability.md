# Advanced Observability Guide

This guide covers SL18's advanced monitoring, diagnostics, and anomaly detection capabilities.

## Overview

Phase 16 introduces comprehensive observability features:
- **Multi-franchise dashboards** with per-language, per-region, and per-revenue views
- **Anomaly detection** for QC drops, fraud spikes, and publishing errors
- **Root cause analysis** with correlation IDs across systems
- **Automated incident reports** with suggested operator actions
- **Tiered alerts** with escalation and notification channels

## Schema Files

| Schema | Location | Purpose |
|--------|----------|---------|
| Observability Config | `schemas/observability.schema.json` | Monitoring and alert configuration |
| Incident Report | `schemas/incident_report.schema.json` | Automated incident documentation |

## Dashboards

### Dashboard Types

| Type | Description |
|------|-------------|
| `franchise_overview` | Multi-franchise performance comparison |
| `language_metrics` | Per-language content and QC metrics |
| `region_metrics` | Regional performance breakdown |
| `revenue_stream` | Revenue and payment tracking |
| `qc_metrics` | Quality control pass rates |
| `publishing_health` | Publishing pipeline status |
| `combined` | Unified operations view |

### Dashboard Configuration

```json
{
  "dashboardId": "dash-combined",
  "name": "Combined Operations View",
  "type": "combined",
  "refreshInterval": 30,
  "widgets": [
    {
      "widgetId": "widget-001",
      "type": "metric_card",
      "dataSource": "franchise_count"
    },
    {
      "widgetId": "widget-002",
      "type": "line_chart",
      "dataSource": "revenue_trend"
    }
  ]
}
```

### Widget Types

- `metric_card` — Single value display
- `line_chart` — Time series trends
- `bar_chart` — Comparisons
- `pie_chart` — Distribution
- `table` — Detailed data
- `heatmap` — Activity patterns
- `alert_feed` — Live alert stream

## Anomaly Detection

### Rule Types

| Type | Description | Typical Severity |
|------|-------------|------------------|
| `qc_drop` | QC pass rate below threshold | Warning |
| `fraud_spike` | Unusual fraud attempt pattern | Critical |
| `publishing_error` | High error rate in publishing | Critical |
| `revenue_anomaly` | Unexpected revenue patterns | Warning |
| `latency_spike` | Pipeline latency increase | Warning |
| `error_rate` | General error rate spike | Warning |

### Threshold Configuration

```json
{
  "ruleId": "rule-fraud-spike",
  "name": "Fraud Attempt Spike",
  "type": "fraud_spike",
  "threshold": {
    "metric": "fraud_attempts",
    "operator": "deviation",
    "deviationMultiplier": 3,
    "windowMinutes": 30
  },
  "severity": "critical",
  "enabled": true
}
```

### Threshold Operators

| Operator | Description |
|----------|-------------|
| `gt` | Greater than value |
| `lt` | Less than value |
| `gte` | Greater than or equal |
| `lte` | Less than or equal |
| `eq` | Equal to value |
| `deviation` | Standard deviation from baseline |

### Detection Example

```
Fraud attempts baseline: 5/hour
Standard deviation: 2
Current: 15/hour
Deviation: (15-5)/2 = 5 standard deviations
Threshold: 3 standard deviations
Result: TRIGGERED - Critical alert
```

## Diagnostics Layer

### Root Cause Analysis

The diagnostics layer provides:
1. **Correlation ID tracking** across all events
2. **Event chain reconstruction** for incident analysis
3. **Cross-system correlation** (payment, multilingual, QC events)
4. **Automated root cause suggestions**

```json
{
  "rootCauseAnalysis": {
    "completed": true,
    "primaryCause": "Translation accuracy threshold misconfigured",
    "contributingFactors": [
      "Recent language pack update",
      "QC threshold not adjusted for dialect"
    ],
    "correlatedEvents": [
      {
        "eventId": "audit-001",
        "eventType": "language_pack_added",
        "correlationId": "corr-001"
      }
    ]
  }
}
```

### Correlation Tracking

Events are linked by `correlationId`:

```
language_pack_added (corr-001)
    ↓
multilingual_qc_failed (corr-001)
    ↓
incident_created (corr-001)
    ↓
alert_triggered (corr-001)
```

## Incident Reports

### Incident Structure

```json
{
  "incidentId": "inc-2025-001",
  "title": "QC Pass Rate Drop Below Threshold",
  "severity": "warning",
  "status": "resolved",
  "category": "qc_failure",
  "scope": {
    "franchises": ["kenya-001"],
    "languages": ["sw"],
    "episodeCount": 3
  },
  "timeline": {
    "detectedAt": "2025-02-01T10:00:00Z",
    "resolvedAt": "2025-02-01T11:00:00Z"
  }
}
```

### Incident Categories

| Category | Description |
|----------|-------------|
| `qc_failure` | Quality control failures |
| `payment_issue` | Payment processing problems |
| `publishing_error` | Publishing pipeline errors |
| `fraud_alert` | Fraud detection triggers |
| `system_error` | System-level failures |
| `performance_degradation` | Performance issues |
| `data_inconsistency` | Data integrity problems |

### Status Flow

```
open → investigating → identified → resolved → closed
```

### Suggested Actions

```json
{
  "suggestedActions": [
    {
      "actionId": "action-001",
      "priority": "immediate",
      "description": "Review and adjust QC thresholds",
      "category": "remediation",
      "automated": false,
      "status": "pending"
    }
  ]
}
```

### Action Priorities

| Priority | Response Time |
|----------|---------------|
| `immediate` | Act now |
| `high` | Within 1 hour |
| `medium` | Within 4 hours |
| `low` | Within 24 hours |

### Action Categories

- `remediation` — Fix the issue
- `prevention` — Prevent recurrence
- `monitoring` — Improve visibility
- `communication` — Notify stakeholders

## Alerts & Notifications

### Alert Channels

```json
{
  "channels": [
    {
      "channelId": "channel-email",
      "type": "email",
      "severities": ["warning", "critical"]
    },
    {
      "channelId": "channel-slack",
      "type": "slack",
      "severities": ["critical"]
    },
    {
      "channelId": "channel-dashboard",
      "type": "dashboard",
      "severities": ["info", "warning", "critical"]
    }
  ]
}
```

### Channel Types

- `email` — Email notifications
- `slack` — Slack webhook
- `webhook` — Custom HTTP endpoint
- `sms` — SMS alerts
- `dashboard` — In-dashboard alerts

### Alert Escalation

```json
{
  "escalation": {
    "enabled": true,
    "rules": [
      {
        "fromSeverity": "warning",
        "toSeverity": "critical",
        "afterMinutes": 30,
        "condition": "unacknowledged"
      }
    ]
  }
}
```

### Quiet Hours

```json
{
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "06:00",
    "timezone": "Africa/Nairobi",
    "exceptCritical": true
  }
}
```

## Operator Summary

Incident reports include operator-friendly summaries:

```json
{
  "operatorSummary": {
    "impactDescription": "3 episodes failed QC due to threshold mismatch",
    "technicalDetails": "Language pack sw v1.2 introduced stricter defaults",
    "remediationSteps": [
      "1. Navigate to QC settings",
      "2. Adjust translation threshold to 92%",
      "3. Re-run QC pipeline"
    ],
    "preventionRecommendations": [
      "Add threshold compatibility check to language pack updates"
    ]
  }
}
```

## Extended Audit Events

### Observability Events

- `anomaly_detected` — Anomaly rule triggered
- `incident_created` — New incident opened
- `incident_acknowledged` — Incident acknowledged
- `incident_resolved` — Incident resolved
- `incident_closed` — Incident closed
- `alert_triggered` — Alert sent
- `alert_escalated` — Alert severity increased
- `alert_resolved` — Alert cleared
- `diagnostics_started` — RCA started
- `diagnostics_completed` — RCA completed

### Audit Log Example

```json
{
  "logId": "audit-obs-001",
  "timestamp": "2025-02-01T10:00:00Z",
  "eventType": "anomaly_detected",
  "category": "observability",
  "actor": {
    "type": "system",
    "id": "anomaly-detector"
  },
  "target": {
    "type": "alert",
    "id": "alert-qc-001",
    "franchiseId": "kenya-001"
  },
  "details": {
    "description": "QC pass rate dropped below 80%",
    "metadata": {
      "ruleId": "rule-qc-drop",
      "currentValue": 75,
      "threshold": 80
    }
  },
  "result": "success",
  "correlationId": "corr-001"
}
```

## Best Practices

### Threshold Tuning

1. Start with conservative thresholds
2. Monitor for false positives
3. Adjust based on baseline data
4. Use deviation-based detection for variable metrics

### Alert Fatigue Prevention

1. Use tiered severities appropriately
2. Configure quiet hours
3. Set up escalation rules
4. Review and tune regularly

### Incident Response

1. Acknowledge promptly
2. Use correlation IDs to trace root cause
3. Document actions in incident report
4. Implement prevention recommendations

## File Locations

| Artifact | Path |
|----------|------|
| Observability Schema | `schemas/observability.schema.json` |
| Incident Report Schema | `schemas/incident_report.schema.json` |
| Test Fixtures | `tests/governance/fixtures/observability.json` |
| Tests | `tests/governance/observability.test.js` |

---

*Version: 1.0*
*Phase: 16 - Advanced Observability*
*Last Updated: November 2025*
