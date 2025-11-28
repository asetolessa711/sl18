# Infrastructure Monitoring Guide

## Overview

SL18's infrastructure monitoring provides comprehensive observability through metrics collection, alerting, synthetic tests, dashboards, and SLA tracking. This guide covers configuration, best practices, and operational procedures.

## Metrics Collection

### Providers

| Provider | Use Case | Retention |
|----------|----------|-----------|
| Prometheus | Time-series metrics | 30 days |
| Datadog | APM, logs, traces | 90 days |
| CloudWatch | AWS infrastructure | 15 days |
| Azure Monitor | Azure resources | 30 days |

### Metric Types

| Type | Description | Example |
|------|-------------|---------|
| **Gauge** | Point-in-time value | CPU utilization |
| **Counter** | Cumulative value | Total requests |
| **Histogram** | Distribution of values | Latency percentiles |
| **Summary** | Pre-calculated quantiles | Request duration |

### Categories

- **Infrastructure**: CPU, memory, disk, network
- **Application**: Latency, errors, throughput
- **Business**: Active users, transactions, revenue
- **Security**: Failed logins, blocked requests
- **Cost**: Spend per service, resource utilization

### Core Metrics

```json
{
  "metrics": [
    {
      "name": "Service Uptime",
      "type": "gauge",
      "unit": "percent",
      "labels": ["service", "region"]
    },
    {
      "name": "Request Latency P99",
      "type": "histogram",
      "unit": "milliseconds",
      "labels": ["service", "endpoint"]
    },
    {
      "name": "Error Rate",
      "type": "counter",
      "unit": "percent",
      "labels": ["service", "error_code"]
    }
  ]
}
```

## Alerting

### Severity Levels

| Severity | Response Time | Notification | Examples |
|----------|---------------|--------------|----------|
| **Critical** | Immediate | PagerDuty + SMS | Service down, data loss |
| **High** | 15 minutes | PagerDuty | High error rate, latency |
| **Medium** | 1 hour | Slack | Elevated metrics |
| **Low** | 4 hours | Email | Minor issues |
| **Info** | Next day | Dashboard | Informational |

### Alert Configuration

```json
{
  "ruleId": "alert-high-error-rate",
  "name": "High Error Rate",
  "metric": "error_rate_5xx",
  "condition": {
    "operator": "gt",
    "threshold": 1,
    "duration": 300,
    "aggregation": "avg"
  },
  "severity": "critical",
  "notifications": {
    "channels": ["pagerduty", "slack"],
    "suppressDuplicates": 300
  }
}
```

### Notification Channels

- **PagerDuty**: Critical alerts, on-call rotation
- **Slack**: Team notifications, incident channels
- **Email**: Summary alerts, reports
- **SMS**: Escalations, critical issues
- **Webhook**: Custom integrations
- **Mobile Push**: Operator app alerts

### Auto-Remediation

| Action | Use Case | Max Attempts |
|--------|----------|--------------|
| Restart Service | Unresponsive service | 2 |
| Scale Up | High utilization | 1 |
| Failover | Regional issues | 1 |
| Clear Cache | Memory pressure | 2 |

### Escalation Policies

```json
{
  "policyId": "escalation-critical",
  "levels": [
    { "level": 1, "delay": 0, "channels": ["pagerduty"] },
    { "level": 2, "delay": 15, "channels": ["pagerduty", "phone"] },
    { "level": 3, "delay": 30, "channels": ["phone", "sms"] }
  ]
}
```

### Maintenance Windows

```json
{
  "windowId": "maint-weekly",
  "name": "Weekly Maintenance",
  "schedule": "0 2 * * 0",
  "duration": 120,
  "suppressAlerts": true
}
```

## Synthetic Tests

### Test Types

| Type | Purpose | Frequency |
|------|---------|-----------|
| **HTTP** | API health checks | 30 seconds |
| **Browser** | User journey tests | 5 minutes |
| **TCP** | Service connectivity | 60 seconds |
| **DNS** | DNS resolution | 5 minutes |
| **SSL** | Certificate validation | 1 hour |
| **gRPC** | Internal services | 30 seconds |

### HTTP Test Configuration

```json
{
  "testId": "synthetic-api-health",
  "type": "http",
  "endpoint": "https://api.sl18.io/health",
  "method": "GET",
  "assertions": [
    { "type": "status_code", "operator": "eq", "value": 200 },
    { "type": "response_time", "operator": "lt", "value": 500 }
  ],
  "locations": ["us-east-1", "eu-west-1", "ap-southeast-1"],
  "frequency": 30,
  "timeout": 10
}
```

### Assertion Types

| Type | Description | Example |
|------|-------------|---------|
| status_code | HTTP status | 200 |
| response_time | Duration in ms | < 500 |
| body_contains | Response content | "healthy" |
| header_contains | Header value | "hit" |
| json_path | JSON response value | $.status == "ok" |
| ssl_valid | Certificate valid | true |

### Multi-Step Tests

User journey testing for critical flows:

```json
{
  "steps": [
    { "action": "navigate", "target": "https://app.sl18.io" },
    { "action": "type", "target": "#search", "value": "drama" },
    { "action": "click", "target": "#search-btn" },
    { "action": "assert", "target": ".results", "value": "exists" }
  ]
}
```

### Test Locations

Global coverage from multiple regions:
- Americas: US East, US West, Brazil
- Europe: Ireland, Frankfurt, London
- Asia Pacific: Singapore, Tokyo, Sydney
- Middle East: Bahrain

## Dashboards

### Dashboard Types

| Type | Purpose | Audience |
|------|---------|----------|
| Infrastructure Overview | System health | SRE/Platform |
| Service Health | Per-service status | Dev teams |
| Incident Tracker | Active incidents | On-call |
| SLA Compliance | SLA status | Leadership |
| Capacity Planning | Resource trends | Platform |
| Cost Analysis | Cloud spend | Finance |

### Widget Types

- **Line Chart**: Time-series trends
- **Bar Chart**: Comparisons
- **Gauge**: Current values vs targets
- **Single Stat**: Key numbers
- **Table**: Detailed data
- **Heatmap**: Density visualization
- **Status Map**: Regional health
- **Topology**: Service dependencies

### Example Dashboard

```json
{
  "dashboardId": "dash-infra-overview",
  "name": "Infrastructure Overview",
  "widgets": [
    {
      "type": "gauge",
      "title": "Global Uptime",
      "metrics": ["service_uptime"],
      "thresholds": [
        { "value": 99.9, "color": "green" },
        { "value": 99.5, "color": "yellow" },
        { "value": 0, "color": "red" }
      ]
    },
    {
      "type": "line_chart",
      "title": "Request Latency",
      "metrics": ["latency_p50", "latency_p95", "latency_p99"]
    }
  ]
}
```

## SLA Tracking

### SLA Targets

| Service | Availability | P99 Latency | Error Rate |
|---------|--------------|-------------|------------|
| API Gateway | 99.95% | 500ms | 0.1% |
| Content Service | 99.9% | 1000ms | 0.5% |
| Distribution | 99.9% | 2000ms | 1.0% |

### Error Budget

```json
{
  "budgetId": "budget-api",
  "slaId": "sla-api-availability",
  "monthly": 21.6,
  "consumed": 4.3,
  "remaining": 17.3,
  "burnRate": 0.8
}
```

### SLA Status Levels

| Status | Description | Action |
|--------|-------------|--------|
| **Meeting** | Within targets | Continue monitoring |
| **At Risk** | Warning threshold | Investigate |
| **Breached** | Target exceeded | Incident response |

### Breach Notifications

Alert when error budget consumption exceeds:
- 70%: Warning to team
- 90%: Alert to leadership
- 100%: SLA breach declared

## Logging

### Providers

- Elasticsearch: Full-text search
- Splunk: Enterprise logging
- CloudWatch Logs: AWS native
- Loki: Cost-effective

### Log Levels

| Level | Use Case |
|-------|----------|
| DEBUG | Development troubleshooting |
| INFO | Normal operations |
| WARN | Potential issues |
| ERROR | Operation failures |
| FATAL | System critical |

### Structured Logging

```json
{
  "timestamp": "2024-11-28T04:00:00Z",
  "level": "INFO",
  "service": "api-gateway",
  "trace_id": "abc123",
  "message": "Request processed",
  "duration_ms": 45
}
```

## Distributed Tracing

### Providers

- Jaeger: Open source
- Zipkin: Lightweight
- Datadog APM: Enterprise
- AWS X-Ray: AWS native

### Configuration

```json
{
  "enabled": true,
  "provider": "datadog_apm",
  "samplingRate": 10,
  "propagation": ["w3c", "datadog"],
  "serviceMap": true
}
```

## Key Performance Indicators

| KPI | Target | Description |
|-----|--------|-------------|
| MTTD | < 5 min | Mean Time to Detect |
| MTTR | < 30 min | Mean Time to Resolve |
| MTTC | < 15 min | Mean Time to Contain |
| Availability | 99.95% | Service uptime |
| Error Rate | < 0.1% | Failed requests |

## Audit Events

| Event | Description |
|-------|-------------|
| `alert_triggered` | Alert fired |
| `alert_resolved` | Alert cleared |
| `auto_remediation_triggered` | Auto-fix attempted |
| `synthetic_test_failed` | Test failed |
| `sla_breached` | SLA target missed |

## Best Practices

1. **Alert on Symptoms, Not Causes**
   - Alert on user-facing issues
   - Avoid alert fatigue

2. **Use Multi-Window Alerts**
   - Combine short and long windows
   - Reduce false positives

3. **Test Alerts Regularly**
   - Verify notification delivery
   - Check runbook accuracy

4. **Review Dashboards Monthly**
   - Remove unused widgets
   - Add new relevant metrics

5. **Monitor Monitoring**
   - Alert on monitoring failures
   - Redundant collection paths
