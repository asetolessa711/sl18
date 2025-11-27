# Phase 12: Beta Test Preparation Guide

This guide provides all artifacts and instructions needed to execute Phase 11 Beta Tests for SL18's Autonomous Mode.

## 📁 Beta Test Artifacts

The following files are provided in the `beta-test/` directory:

| File | Description |
|------|-------------|
| `sample-shadow-logs.json` | Shadow publishing logs for 3 episodes in Fully AI mode |
| `sample-override-audit.json` | Operator override and rollback simulation logs |
| `grafana-queries.json` | Grafana dashboard queries for confidence monitoring |

## ⚙️ Configuration Verification

### 1. Verify autonomous.config.json

```bash
# Run configuration tests
npm test -- tests/autonomous.config.test.ts
```

Expected output: 41 tests passing

### 2. Key Configuration Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `defaultMode` | `humanAssisted` | Safe default for beta |
| `confidenceThresholds.qcPassRate` | `0.95` | 95% QC pass required for Fully AI |
| `confidenceThresholds.publishErrorRate` | `0.01` | <1% error rate required |
| `confidenceThresholds.aiAccuracy` | `0.90` | 90% AI accuracy required |
| `shadowPublishing.enabled` | `true` | Shadow mode active for calibration |
| `shadowPublishing.logRetentionDays` | `30` | Logs retained for 30 days |

## 🔍 Sample Shadow Publishing Logs

Three sample episodes are provided demonstrating different scenarios:

### Episode 1: EP-001-DRAMA (Publish)
- **Confidence**: 97%
- **QC Score**: 98%
- **Decision**: AI recommends publish to YouTube, Facebook, Instagram
- **Status**: Awaiting operator comparison

### Episode 2: EP-002-COMEDY (Publish - Matched)
- **Confidence**: 94%
- **QC Score**: 96%
- **Decision**: AI recommends publish
- **Operator Match**: 95% agreement

### Episode 3: EP-003-MUSIC (Hold - Matched)
- **Confidence**: 88%
- **QC Score**: 85% (below threshold)
- **Decision**: AI recommends hold for audio fixes
- **Operator Match**: 100% agreement

## 👩‍💻 Operator Override Scenarios

Five audit log entries demonstrate override workflows:

| Audit ID | Action | Mode | Outcome |
|----------|--------|------|---------|
| audit-001 | OVERRIDE_AI_DECISION | humanAssisted | Content held for revision |
| audit-002 | ROLLBACK_PUBLISH | humanAssisted | Video unlisted after update |
| audit-003 | APPROVE_AI_RECOMMENDATION | humanAssisted | Published to 3 platforms |
| audit-004 | REJECT_AI_STYLING | humanAssisted | Styling replaced per brand guidelines |
| audit-005 | EMERGENCY_OVERRIDE | fullyAI | Content quarantined for legal review |

## 📊 Grafana Dashboard Setup

### Importing Dashboard Queries

1. Open Grafana and create a new dashboard
2. Import panels from `grafana-queries.json`
3. Configure Prometheus data source

### Key Panels

| Panel | Purpose |
|-------|---------|
| Overall Confidence Score | Gauge showing current AI confidence |
| QC Pass Rate (30-day) | Stat showing rolling QC pass rate |
| Publishing Error Rate | Stat showing error rate (<1% target) |
| AI Accuracy Score | Gauge showing operator match rate |
| Confidence Score Trend | Time series with threshold lines |
| Publishing by Platform | Bar chart of successful publishes |
| Shadow vs Operator Decisions | Pie chart of match rate |
| Override Actions | Time series of operator interventions |

### Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| ConfidenceBelowThreshold | Confidence < 90% for 5m | Warning |
| HighPublishingErrorRate | Error rate > 1% for 10m | Critical |
| QCPassRateDrop | QC rate < 95% for 15m | Warning |
| AutonomousModeDisabled | Mode disabled | Info |

## 🧪 Running Beta QC Enforcement Tests

```bash
# Run all AI QC enforcement tests
npm test -- tests/beta-qc-enforcement.test.ts
```

### Test Coverage

- High Confidence Scenarios (≥95%)
- Medium Confidence Scenarios (85-95%)
- Low Confidence Scenarios (<85%)
- Mode-Specific Behavior
- Genre-Specific QC Rules
- Edge Cases and Error Handling
- Confidence Threshold Validation
- Shadow Publishing Comparison

## 📋 Pre-Beta Checklist

### Environment
- [ ] Latest commit includes `autonomous.config.json`
- [ ] All 374+ tests passing
- [ ] GitHub Actions workflows running
- [ ] Grafana dashboards deployed
- [ ] Alert rules configured

### Configuration
- [ ] Default mode set to `humanAssisted`
- [ ] Confidence thresholds at 95%/1%/90%
- [ ] Shadow publishing enabled
- [ ] Override/rollback enabled
- [ ] Audit logging at detailed level

### Operator Preparation
- [ ] Platform accounts authenticated (YouTube, Facebook, Instagram)
- [ ] Operators trained on mode switching
- [ ] Override/rollback procedures documented
- [ ] Emergency escalation path defined

### Test Data
- [ ] Sample episodes prepared for each genre
- [ ] Shadow logs ready for comparison
- [ ] QC check scenarios documented

## 🚀 Beta Test Execution Steps

### Day 1: Shadow Mode Calibration
1. Run 10 episodes through shadow publishing
2. Compare AI decisions with operator actions
3. Record match rates in Grafana

### Day 2-3: Human-Assisted Mode
1. Process 20 episodes in humanAssisted mode
2. Operators approve/modify AI recommendations
3. Track override frequency and reasons

### Day 4-5: Limited Fully AI Mode
1. Select 3 high-confidence episodes
2. Enable fullyAI mode for selected workspace
3. Monitor confidence scores and auto-publish
4. Practice rollback procedure

### Day 6-7: Review and Adjustment
1. Analyze all audit logs
2. Adjust confidence thresholds if needed
3. Document lessons learned
4. Prepare production rollout plan

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI-Operator Match Rate | ≥90% | Shadow comparison |
| QC Pass Rate | ≥95% | Grafana dashboard |
| Publishing Error Rate | <1% | Error logs |
| Operator Satisfaction | ≥4/5 | Survey |
| Override Frequency | <10% | Audit logs |

## 🆘 Troubleshooting

### Confidence Score Not Updating
- Check minimum sample size (50 required)
- Verify rolling window is 30 days
- Ensure metrics are being recorded

### Shadow Logs Not Appearing
- Verify `shadowPublishing.enabled: true`
- Check log retention settings
- Confirm episode workflow completed

### Grafana Dashboards Empty
- Verify Prometheus scrape config
- Check metrics endpoint `/api/system/metrics/prometheus`
- Confirm data source connection

## 📞 Support Contacts

- **Technical Issues**: Check `Docs/render_pipeline/` documentation
- **Configuration**: Review `render-stack/config/autonomous.config.json`
- **Audit Logs**: Query `/api/ai/audit` endpoint
