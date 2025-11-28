# Security Observability Guide

This guide covers the SL18 Security Observability platform for operators and partners, providing security dashboards, incident tracking, forensic logging, and security metrics.

## Overview

The Security Observability platform provides:
- Real-time security dashboards with customizable widgets
- Incident tracking with SLA enforcement
- Immutable forensic logging with chain of custody
- Security KPIs and trend analysis
- Integration with SIEM, ticketing, and threat intelligence feeds

## Security Dashboards

### Available Dashboards

| Dashboard | Purpose | Refresh Rate |
|-----------|---------|--------------|
| **Security Overview** | High-level security posture | 30s |
| **Threat Landscape** | Active threats and attack vectors | 60s |
| **Incident Tracker** | Open incidents and SLA status | 15s |
| **Compliance Status** | Framework compliance scores | 5min |
| **Forensic Analysis** | Log analysis and investigation | On-demand |
| **Real-Time Threats** | Live threat feed | 5s |

### Security Overview Dashboard

Widgets included:
- **Security Score** - Overall posture gauge (0-100)
- **Active Threats** - Count of unresolved threats
- **Threat Timeline** - 24-hour threat activity
- **Incidents by Severity** - Distribution chart

### Threat Landscape Dashboard

Widgets included:
- **Geographic Map** - Threat origin visualization
- **Threats by Category** - Bar chart breakdown
- **Attack Vectors** - Table of attack methods
- **Top Targeted Resources** - Most attacked endpoints

### Incident Tracker Dashboard

Widgets included:
- **Open Incidents** - List with status
- **MTTR Gauge** - Mean time to respond
- **Incident Trend** - Historical chart
- **SLA Compliance** - Pass/fail metrics

## Incident Tracking

### Severity Levels

| Level | Response SLA | Resolution SLA | Notification |
|-------|--------------|----------------|--------------|
| Critical | 5 min | 60 min | PagerDuty, Slack, Email, SMS |
| High | 15 min | 4 hours | Slack, Email |
| Medium | 60 min | 8 hours | Slack, Email |
| Low | 4 hours | 24 hours | Email |

### Incident Workflow

Status progression:
1. **Detected** - Threat identified
2. **Triaging** - Assessing severity and impact
3. **Investigating** - Root cause analysis
4. **Containing** - Limiting spread
5. **Eradicating** - Removing threat
6. **Recovering** - Restoring normal operations
7. **Closed** - Post-incident review complete

### Incident Types

| Type | Category | Playbook |
|------|----------|----------|
| Security Breach | Security | pb-security-breach |
| Data Breach | Data Breach | pb-data-breach |
| Fraud Incident | Fraud | pb-fraud |
| Unauthorized Access | Unauthorized | pb-unauthorized-access |

### Automation

Enabled by default:
- **Auto-Create**: Incidents created from threat detection
- **Auto-Assign**: Assigned to on-call security analyst
- **Auto-Escalate**: Escalated if SLA at risk
- **Auto-Close**: Closed after 30 days of inactivity

## Forensic Logging

### Log Types

| Type | Category | Retention |
|------|----------|-----------|
| Authentication Logs | authentication | 365 days |
| Data Access Logs | data_access | 365 days |
| API Audit Logs | api_calls | 180 days |
| Admin Actions Logs | admin_actions | 730 days |
| Security Events Logs | security_events | 730 days |

### Storage Configuration

```yaml
storage:
  type: elasticsearch
  retentionDays: 365
  encryption: true
  compression: true
```

### Chain of Custody

Forensic integrity ensured through:
- **Hash Algorithm**: SHA-256
- **Timestamping**: RFC 3161 compliant
- **Digital Signatures**: All logs signed
- **Immutability**: Write-once storage

### Log Correlation

Features:
- Cross-service correlation via correlationId
- Session tracking via sessionId
- User activity tracking via userId
- Request tracing via requestId

## Security Metrics

### Key Performance Indicators

| KPI | Description | Target | Trending |
|-----|-------------|--------|----------|
| Security Score | Overall posture | 90+ | Higher better |
| MTTD | Mean Time to Detect | 15 min | Lower better |
| MTTR | Mean Time to Respond | 30 min | Lower better |
| MTTC | Mean Time to Contain | 45 min | Lower better |
| Patch Compliance | Systems patched | 98% | Higher better |
| MFA Adoption | Users with MFA | 99% | Higher better |

### Current Metrics Example

```yaml
securityScore: 94
mttd: 12 minutes
mttr: 28 minutes
mttc: 45 minutes
incidentsOpen: 3
incidentsClosed: 127
vulnerabilitiesCritical: 0
vulnerabilitiesHigh: 3
patchCompliance: 98.5%
mfaAdoption: 99.2%
```

### Trend Analysis

Metrics tracked over time:
- Monthly security score progression
- MTTD improvements
- Incident volume trends
- Vulnerability remediation rates

## Reporting

### Scheduled Reports

| Report | Frequency | Recipients | Format |
|--------|-----------|------------|--------|
| Executive Summary | Weekly | CISO, CTO | PDF |
| Compliance Report | Monthly | Compliance, Audit | PDF |
| Vulnerability Report | Weekly | Security Team | HTML |

### Ad-Hoc Reports

Available templates:
- **Incident Report** - Detailed incident analysis
- **Forensic Report** - Log-based investigation

## Alerting

### Alert Channels

| Channel | Config |
|---------|--------|
| Slack | #security-alerts |
| PagerDuty | Service key integration |
| Email | security-team@sl18.com |
| In-App | Real-time notifications |

### Alert Rules

| Rule | Condition | Severity |
|------|-----------|----------|
| Critical Incident | `incident.severity == 'critical'` | Critical |
| Security Score Drop | `security_score < 80` | High |
| Vulnerability Found | `new_vulnerability.severity == 'critical'` | High |
| SLA Breach Risk | `incident.sla_at_risk == true` | Medium |

## Integrations

### SIEM Integration

```yaml
siem:
  enabled: true
  provider: elastic
  syncInterval: 30s
```

Supported SIEM providers:
- Splunk
- Elastic (ELK)
- Datadog
- Azure Sentinel
- QRadar
- CrowdStrike

### Ticketing Integration

```yaml
ticketing:
  enabled: true
  provider: jira
  autoCreate: true
  syncBidirectional: true
```

### Threat Intelligence

Active feeds:
- **IP Reputation** - AlienVault OTX
- **File Hashes** - VirusTotal
- **Domain Reputation** - Various sources
- **Vulnerability Data** - NVD, CVE

## Operator Actions

### Viewing Security Dashboards

1. Navigate to **Security > Dashboards**
2. Select a dashboard type
3. Use filters to narrow scope
4. Export data as needed

### Managing Incidents

1. Go to **Security > Incidents**
2. Click on an incident to view details
3. Update status and add notes
4. Assign to team members
5. Close when resolved

### Searching Forensic Logs

1. Navigate to **Security > Forensic Logs**
2. Enter search criteria
3. Select time range
4. Filter by log type
5. Export results for analysis

### Generating Reports

1. Go to **Security > Reports**
2. Select report type
3. Configure parameters
4. Generate and download

## Best Practices

1. **Review dashboards** at start of each day
2. **Acknowledge alerts** within SLA windows
3. **Document incidents** thoroughly for post-mortems
4. **Export forensic logs** before retention expiry
5. **Tune alert rules** to reduce noise
6. **Review SIEM correlation** weekly
7. **Update threat intel feeds** daily

## Related Documentation

- [Security Framework](./security_framework.md) - Security policies and access control
- [Threat Detection](./threat_detection.md) - Real-time threat monitoring
- [Governance Suite](./governance_suite.md) - Policy management
