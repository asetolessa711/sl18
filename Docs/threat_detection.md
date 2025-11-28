# Threat Detection Guide

This guide covers the SL18 Threat Detection Engine for operators and partners, providing real-time anomaly detection, ML-based risk scoring, and automated response workflows.

## Overview

The Threat Detection Engine provides:
- Real-time behavioral and transactional anomaly detection
- ML-powered risk scoring and pattern recognition
- Automated response workflows with escalation
- Multi-channel alerting and notification
- Forensic evidence capture

## Threat Categories

### Critical Threats

| Category | Description | Response |
|----------|-------------|----------|
| **Fraud** | Financial fraud attempts | Block, capture evidence, notify |
| **Account Takeover** | Unauthorized account access | Block, revoke session, alert |

### High Severity Threats

| Category | Description | Response |
|----------|-------------|----------|
| **Bot Abuse** | Automated bot traffic | Throttle, alert |
| **API Misuse** | API quota/policy violations | Throttle, warn |
| **Insider Risk** | Suspicious internal activity | Alert, escalate |
| **Data Exfiltration** | Unauthorized data extraction | Block, capture evidence |

### Other Threats Monitored

- Credential stuffing
- Brute force attacks
- Injection attacks
- XSS attacks
- DDoS attempts
- Privilege escalation

## Detection Rules

### Rule Types

1. **Threshold** - Trigger when metric exceeds limit
2. **Anomaly** - Trigger on deviation from baseline
3. **Pattern** - Trigger on known attack patterns
4. **Correlation** - Trigger on multiple related events
5. **ML Model** - Trigger based on ML predictions
6. **Signature** - Trigger on known threat signatures

### Example Rules

#### Transaction Velocity Spike
```yaml
ruleId: rule-velocity-spike
type: threshold
condition:
  metric: transaction_count
  operator: gt
  value: 10
  timeWindow: 60s
severity: high
actions: [alert, throttle, notify]
```

#### Credential Stuffing Detection
```yaml
ruleId: rule-credential-stuffing
type: pattern
condition:
  metric: failed_logins_same_ip
  operator: gt
  value: 5
  timeWindow: 60s
severity: critical
actions: [block, alert, capture_evidence, notify]
```

## Anomaly Detection

### Behavioral Anomalies

Monitored metrics:
- Login frequency
- Session duration
- Action patterns
- API usage patterns
- Data access patterns
- Time of activity

Configuration:
- **Baseline Period**: 30 days
- **Sensitivity**: High

### Transactional Anomalies

Monitored metrics:
- Transaction velocity
- Transaction amount
- Payment method changes
- Geographic spread

Thresholds:
- **Velocity Limit**: 50 transactions/hour
- **Amount Limit**: $10,000 per transaction
- **Daily Limit**: $50,000

### Network Anomalies

Monitored metrics:
- Request rate
- Bandwidth usage
- Connection patterns
- Geographic anomalies

## ML Models

### Active Models

| Model | Purpose | Accuracy |
|-------|---------|----------|
| Fraud Detection NN | Financial fraud | 97% |
| Account Takeover Classifier | ATO detection | 95% |
| Bot Detection Ensemble | Bot traffic | 92% |

### Risk Scoring

Risk factors with weights:
- Transaction Velocity (25%)
- Behavioral Anomaly (30%)
- Device Trust (20%)
- Geographic Risk (25%)

Action thresholds:
- **Block**: Risk Score ≥ 90
- **MFA Required**: Risk Score ≥ 70
- **Alert**: Risk Score ≥ 50
- **Log Only**: Risk Score ≥ 30

## Response Workflows

### Critical Threat Response

When critical threats are detected:

1. **Block Request** - Immediate block
2. **Capture Evidence** - Preserve forensic data
3. **Create Incident** - Auto-create incident ticket
4. **Notify Security** - Alert via PagerDuty + Slack
5. **Require MFA** - Step-up authentication for active sessions

**Escalation Path**: Security Analyst → Security Admin → CISO

**SLA**: 
- Response: 5 minutes
- Resolution: 60 minutes

### High Threat Response

When high-severity threats are detected:

1. **Throttle Rate** - Reduce by 50%
2. **Log Forensic** - Capture detailed logs
3. **Create Incident** - Create ticket
4. **Notify Security** - Alert via Slack + Email

**Escalation Path**: Security Analyst → Security Admin

**SLA**:
- Response: 15 minutes
- Resolution: 4 hours

## Real-Time Monitoring

### Stream Processing

- **Engine**: Kafka Streams
- **Latency Target**: 100ms
- **Real-time correlation**: Enabled

### Alerting Channels

| Severity | Channels |
|----------|----------|
| Critical | PagerDuty, Slack, Email |
| High | Slack, Email |
| Medium | Slack, In-App |
| Low | In-App |

### Quiet Hours

- **Enabled**: 10 PM - 7 AM
- **Critical Bypass**: Yes (critical alerts always sent)

## Metrics

Key metrics tracked:
- Threats Detected
- Threats Blocked
- False Positives
- True Positive Rate (target: 95%+)
- Avg Detection Time (target: < 5s)
- Avg Response Time (target: < 30s)
- Active Incidents

## Operator Actions

### Viewing Threat Dashboard

1. Navigate to **Security > Threat Detection**
2. View **Threat Landscape** for overview
3. Check **Active Threats** widget
4. Review **Attack Vectors** table

### Managing Detection Rules

1. Go to **Security > Detection Rules**
2. Select a rule to view/edit
3. Adjust thresholds as needed
4. Test rule before enabling

### Investigating Threats

1. Click on a threat in the dashboard
2. View **Indicators** and risk score
3. Review **Timeline** of events
4. Check **Related Threats**
5. Take action (Block, Allow, Escalate)

### Reviewing Response Workflows

1. Navigate to **Security > Response Workflows**
2. View workflow execution history
3. Check SLA compliance
4. Adjust workflow steps if needed

## Best Practices

1. **Review false positives** weekly to tune rules
2. **Update ML models** quarterly
3. **Test response workflows** monthly
4. **Adjust thresholds** based on baseline changes
5. **Monitor detection latency** for real-time threats
6. **Maintain escalation contacts** up to date

## Related Documentation

- [Security Framework](./security_framework.md) - Security policies and access control
- [Security Observability](./security_observability.md) - Dashboards and incident tracking
- [Partner Integrations](./partner_integrations.md) - Partner security requirements
