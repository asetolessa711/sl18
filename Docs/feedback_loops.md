# Feedback Loops Guide

## Overview

SL18's Feedback Loop Engine connects audience insights to adaptive actions across personalization, monetization, and quality control systems. Feedback loops enable automated responses to viewer behavior, ensuring content and pricing strategies evolve based on real engagement data.

## Schema Reference

- **Schema File**: `schemas/feedback_loop.schema.json`
- **Test Fixtures**: `tests/governance/fixtures/audience_insights.json`

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Audience       │────▶│  Feedback Loop   │────▶│  Target Systems │
│  Insights       │     │  Engine          │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │                         │
                              ▼                         ▼
                        ┌───────────┐          ┌─────────────────┐
                        │  Triggers │          │ Personalization │
                        └───────────┘          │ Pricing         │
                              │                │ QC Dashboard    │
                              ▼                │ Distribution    │
                        ┌───────────┐          │ Notifications   │
                        │  Actions  │          └─────────────────┘
                        └───────────┘
```

## Loop Types

### 1. Personalization Loop
Adjusts content recommendations based on viewer behavior:

```json
{
  "loopId": "loop-personalization-001",
  "loopType": "personalization",
  "triggers": [
    {
      "triggerId": "engagement-low",
      "triggerType": "engagement_threshold",
      "condition": {
        "metric": "engagementRate",
        "operator": "lt",
        "threshold": 10
      }
    }
  ],
  "actions": [
    {
      "actionType": "adjust_personalization",
      "parameters": {
        "targetSystem": "personalization_engine",
        "adjustmentType": "format_preference",
        "adjustmentValue": "short_form"
      }
    }
  ]
}
```

### 2. Monetization Loop
Manages pricing, retention, and upgrade triggers:

```json
{
  "loopType": "monetization",
  "triggers": [
    {
      "triggerType": "churn_risk",
      "condition": {
        "metric": "churnRiskScore",
        "operator": "gte",
        "threshold": 70
      }
    }
  ],
  "actions": [
    {
      "actionType": "trigger_retention",
      "parameters": {
        "adjustmentType": "discount_offer",
        "adjustmentValue": 20
      }
    }
  ]
}
```

### 3. QC Loop
Flags quality issues for review:

```json
{
  "loopType": "qc",
  "triggers": [
    {
      "triggerType": "sentiment_change",
      "condition": {
        "metric": "sentimentScore",
        "operator": "change_by",
        "threshold": -0.2
      }
    }
  ],
  "actions": [
    {
      "actionType": "flag_qc_review",
      "parameters": {
        "targetSystem": "qc_dashboard",
        "adjustmentType": "cultural_sensitivity_review"
      }
    }
  ]
}
```

### 4. Content Optimization Loop
Optimizes content based on retention and engagement:

```json
{
  "loopType": "content_optimization",
  "triggers": [
    {
      "triggerType": "retention_drop",
      "condition": {
        "metric": "completionRate",
        "operator": "lt",
        "threshold": 50
      }
    }
  ],
  "actions": [
    {
      "actionType": "generate_report",
      "parameters": {
        "targetSystem": "content_management",
        "adjustmentType": "pacing_analysis"
      }
    }
  ]
}
```

### 5. Distribution Loop
Adjusts distribution strategy based on channel performance:

```json
{
  "loopType": "distribution",
  "triggers": [
    {
      "triggerType": "regional_performance",
      "condition": {
        "metric": "regionalEngagementRate",
        "operator": "gt",
        "threshold": 25
      }
    }
  ],
  "actions": [
    {
      "actionType": "adjust_distribution",
      "parameters": {
        "targetSystem": "distribution_channel",
        "adjustmentType": "increase_frequency"
      }
    }
  ]
}
```

## Trigger Types

| Trigger Type | Description | Example Metric |
|--------------|-------------|----------------|
| `engagement_threshold` | Engagement rate crosses threshold | `engagementRate` |
| `sentiment_change` | Sentiment score changes significantly | `sentimentScore` |
| `retention_drop` | Completion rate falls below threshold | `completionRate` |
| `churn_risk` | Churn risk score exceeds threshold | `churnRiskScore` |
| `cultural_issue` | Cultural sensitivity concern detected | `culturalSensitivityScore` |
| `regional_performance` | Regional metrics diverge | `regionalEngagementRate` |
| `demographic_shift` | Audience demographics change | `demographicDistribution` |
| `binge_pattern` | Binge watching behavior detected | `bingeViewerPercentage` |
| `comparison_benchmark` | Performance vs benchmark | `benchmarkPercentile` |
| `time_based` | Scheduled evaluation | N/A |

## Trigger Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `gt` | Greater than | `engagementRate > 25` |
| `lt` | Less than | `completionRate < 50` |
| `gte` | Greater than or equal | `churnRisk >= 70` |
| `lte` | Less than or equal | `qualityScore <= 80` |
| `eq` | Equals | `status == 'error'` |
| `between` | In range | `score between 40 and 60` |
| `change_by` | Change from baseline | `sentiment changed by -0.2` |

## Action Types

### Personalization Actions
```javascript
adjust_personalization    // Modify recommendation weights
update_recommendations    // Refresh recommendation model
modify_content_style     // Adjust tone/pacing preferences
```

### Monetization Actions
```javascript
modify_pricing           // Adjust price or tier
trigger_retention        // Send discount/incentive
```

### QC Actions
```javascript
flag_qc_review           // Create QC ticket
pause_content            // Temporarily disable content
```

### Operational Actions
```javascript
notify_operator          // Send alert to team
generate_report          // Create analysis report
adjust_distribution      // Modify distribution settings
```

## Personalization Adjustments

### Rule-Based Adjustments

```json
{
  "personalizationAdjustments": {
    "enabled": true,
    "rules": [
      {
        "ruleId": "format-boost",
        "condition": {
          "signalType": "format_preference",
          "signalThreshold": 80
        },
        "adjustment": {
          "targetField": "recommendedFormat",
          "adjustmentType": "boost",
          "value": 1.5
        }
      }
    ],
    "feedbackToEngine": {
      "engineId": "engine-ke-001",
      "updateFrequency": "hourly",
      "learningRate": 0.15
    }
  }
}
```

### Adjustment Types
- `boost`: Multiply weight by value
- `demote`: Divide weight by value
- `replace`: Replace with new value
- `add_weight`: Add fixed weight
- `remove_weight`: Subtract fixed weight

### Target Fields
- `recommendedPersona`: Preferred host/narrator
- `recommendedFormat`: Content format
- `recommendedContentStyle`: Tone, pacing, visual style
- `adaptiveRendering`: Subtitle, caption, voice settings

## Monetization Signals

### Churn Risk Actions

```json
{
  "churnRiskActions": [
    {
      "riskLevel": "critical",
      "action": "personal_outreach",
      "validityPeriod": "7d"
    },
    {
      "riskLevel": "high",
      "action": "discount_offer",
      "discountPercentage": 25,
      "validityPeriod": "30d"
    },
    {
      "riskLevel": "medium",
      "action": "content_recommendation",
      "validityPeriod": "14d"
    }
  ]
}
```

### Retention Actions
- `discount_offer`: Percentage discount
- `tier_upgrade_prompt`: Suggest higher tier with incentive
- `loyalty_reward`: Special content or feature unlock
- `personal_outreach`: Direct communication
- `content_recommendation`: Personalized content push
- `feature_unlock`: Temporary premium access

### Upgrade Potential Actions

```json
{
  "upgradePotentialActions": [
    {
      "potentialLevel": "high",
      "suggestedTier": "premium",
      "incentive": "free_trial"
    },
    {
      "potentialLevel": "medium",
      "suggestedTier": "basic",
      "incentive": "discount"
    }
  ]
}
```

## QC Feedback

### Cultural Sensitivity Alerts

```json
{
  "culturalSensitivityAlerts": [
    {
      "alertId": "alert-001",
      "region": "SA",
      "issue": "Content tone inappropriate for region",
      "severity": "high",
      "suggestedAction": "Review content with regional QC team",
      "autoFlagged": true
    }
  ]
}
```

### Translation Quality Flags

```json
{
  "translationQualityFlags": [
    {
      "flagId": "flag-001",
      "language": "am",
      "qualityScore": 72,
      "issues": ["grammar_errors", "context_loss"],
      "suggestedReview": true
    }
  ]
}
```

### Persona Consistency Flags

```json
{
  "personaConsistencyFlags": [
    {
      "flagId": "flag-002",
      "personaId": "narrator-ke-001",
      "inconsistencyType": "voice_drift",
      "confidence": 82
    }
  ]
}
```

## Execution History

Track all loop executions:

```json
{
  "executionHistory": [
    {
      "executionId": "exec-001",
      "triggerId": "trigger-001",
      "actionId": "action-001",
      "executedAt": "2025-11-07T14:30:00Z",
      "result": "success",
      "details": "Personalization adjusted for low-engagement demographic",
      "impactMetrics": {
        "affectedViewers": 12500,
        "measurementPeriod": "24h",
        "engagementChange": 8.5,
        "revenueImpact": 250
      }
    }
  ]
}
```

### Result Types
- `success`: Action executed successfully
- `failure`: Action failed to execute
- `pending_approval`: Awaiting manual approval
- `skipped`: Skipped due to cooldown or rate limit
- `partial`: Partially executed

## Configuration

### Loop Configuration

```json
{
  "config": {
    "evaluationInterval": "1h",
    "autoExecute": true,
    "maxActionsPerHour": 10,
    "rollbackEnabled": true,
    "rollbackThreshold": -15
  }
}
```

- **evaluationInterval**: How often to check triggers (`5m`, `1h`, `24h`)
- **autoExecute**: Execute actions automatically or require approval
- **maxActionsPerHour**: Rate limit for actions
- **rollbackEnabled**: Auto-rollback on negative impact
- **rollbackThreshold**: Engagement drop percentage triggering rollback

### Trigger Configuration

```json
{
  "trigger": {
    "enabled": true,
    "cooldownPeriod": "6h",
    "priority": "high"
  }
}
```

- **enabled**: Activate/deactivate trigger
- **cooldownPeriod**: Minimum time between activations
- **priority**: `low`, `medium`, `high`, `critical`

### Action Configuration

```json
{
  "action": {
    "requiresApproval": true,
    "approvalRoles": ["qc_lead", "operator"],
    "enabled": true
  }
}
```

- **requiresApproval**: Require manual approval
- **approvalRoles**: Roles that can approve
- **enabled**: Activate/deactivate action

## Audit Events

All feedback loop operations are logged:

| Event | Category | Description |
|-------|----------|-------------|
| `feedback_loop_triggered` | feedback_loop | Trigger condition met |
| `feedback_loop_action_executed` | feedback_loop | Action executed |
| `feedback_loop_action_failed` | feedback_loop | Action failed |
| `feedback_loop_rollback` | feedback_loop | Action rolled back |
| `personalization_adjusted` | feedback_loop | Personalization changed |
| `monetization_signal_detected` | feedback_loop | Monetization signal found |
| `qc_feedback_generated` | feedback_loop | QC feedback created |
| `cultural_sensitivity_alert` | feedback_loop | Cultural issue flagged |
| `translation_quality_flagged` | feedback_loop | Translation issue found |
| `persona_consistency_flagged` | feedback_loop | Persona drift detected |
| `churn_action_triggered` | feedback_loop | Churn retention action |
| `upgrade_potential_detected` | feedback_loop | Upgrade opportunity found |

## Best Practices

1. **Set Appropriate Cooldowns**: Prevent trigger fatigue with adequate cooldown periods
2. **Use Sample Size Minimums**: Require sufficient data before triggering actions
3. **Enable Rollback**: Auto-rollback protects against negative impact
4. **Rate Limit Actions**: Prevent system overload with `maxActionsPerHour`
5. **Monitor Impact Metrics**: Track `engagementChange` and `revenueImpact`
6. **Require Approval for Critical Actions**: Use `requiresApproval` for high-impact changes
7. **Test in Learning Mode**: Use `status: "learning"` before activating loops

## Integration Points

### Phase 17: Personalization Engine
- Receives personalization adjustments
- Updates recommendation weights
- Applies adaptive rendering changes

### Phase 17: Adaptive Pricing
- Receives monetization signals
- Applies pricing adjustments
- Triggers retention actions

### Phase 16: Observability
- Monitors loop execution
- Detects anomalies in feedback patterns
- Generates incident reports

### Phase 19: Distribution
- Adjusts distribution frequency
- Modifies regional targeting
- Updates channel preferences

## Related Documentation

- [Audience Insights](./audience_insights.md) - Source data for feedback loops
- [Personalization](./personalization.md) - Personalization engine integration
- [Adaptive Monetization](./adaptive_monetization.md) - Pricing and retention
- [Observability](./observability.md) - Monitoring and anomaly detection
