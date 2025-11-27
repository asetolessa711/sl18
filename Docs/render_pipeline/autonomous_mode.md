# Autonomous Mode Guide

Phase 11 introduces autonomous publishing capabilities for SL18, allowing the system to operate with varying levels of AI autonomy while maintaining operator control.

## Overview

Autonomous mode enables SL18 to:
- **Track confidence metrics** to determine when autonomous operation is safe
- **Shadow publish** to calibrate AI decisions against operator choices
- **Auto-publish** to supported platforms when confidence thresholds are met
- **Override and rollback** for operator control over AI actions

## Operating Modes

SL18 supports three operating modes with specific behaviors for each workflow step:

| Step              | Human-Lead Mode                          | Human-Assisted Mode                          | Fully AI Mode                               |
|-------------------|------------------------------------------|----------------------------------------------|---------------------------------------------|
| Script Generation | Operator writes or edits; AI suggests    | AI drafts script; operator approves           | AI drafts and applies automatically         |
| Persona Styling   | Operator selects; AI suggests options    | AI pre-fills styling; operator confirms       | AI applies styling autonomously             |
| QC Checks         | Operator runs QC; AI flags issues        | AI runs QC + recommends fixes; operator approves | AI enforces QC pass/fail autonomously    |
| Publishing        | Manual publish/export by operator        | One-click publish after AI prep               | AI auto-publishes (API-enabled platforms)   |
| Confidence Use    | Not required                             | AI suggestions visible, operator decides      | Autonomous publishing only if thresholds met|
| Override Control  | Full operator control                    | Operator can override AI suggestions          | Operator can override or rollback AI actions|

## Confidence Thresholds

Autonomous mode requires meeting these thresholds (configurable):

| Metric                    | Default Threshold | Description                                      |
|---------------------------|-------------------|--------------------------------------------------|
| QC Pass Rate              | ≥95%              | Percentage of episodes passing QC                |
| Publishing Error Rate     | <1%               | Maximum acceptable publishing failures           |
| AI Decision Accuracy      | ≥90%              | AI decisions matching operator choices           |
| Minimum Sample Size       | 50                | Required data points for confidence calculation  |
| Time Window               | 30 days           | Rolling window for metrics                       |

### API: Get Confidence Score

```bash
GET /api/ai/confidence?workspaceId=optional
```

Response:
```json
{
  "confidence": {
    "level": "high",
    "score": 0.92,
    "autonomousReady": true,
    "metrics": {
      "qcPassRate": { "value": 0.97, "passing": true, "sampleSize": 150 },
      "publishingErrorRate": { "value": 0.005, "passing": true, "sampleSize": 100 },
      "aiDecisionAccuracy": { "value": 0.93, "passing": true, "sampleSize": 75 }
    },
    "reasons": ["All confidence thresholds met"],
    "suggestions": []
  },
  "autonomousAllowed": true
}
```

### API: Update Thresholds

```bash
PUT /api/ai/confidence/thresholds
Content-Type: application/json

{
  "qcPassRate": 0.90,
  "maxPublishingErrorRate": 0.02,
  "minAIAccuracy": 0.85
}
```

## Shadow Publishing

Shadow publishing allows AI to simulate publishing decisions without executing them. This enables calibration by comparing AI decisions to operator choices.

### Workflow

1. **Create shadow publish job**
   ```bash
   POST /api/ai/publish/shadow
   Content-Type: application/json

   {
     "episodeId": "ep_123",
     "platform": "youtube",
     "workspaceId": "ws_456",
     "actor": "operator@example.com"
   }
   ```

   Response:
   ```json
   {
     "jobId": "shadow_abc123",
     "episodeId": "ep_123",
     "platform": "youtube",
     "aiDecision": "publish",
     "confidenceScore": 0.85,
     "reasoning": [
       "Decision: PUBLISH - High confidence in content quality",
       "QC passed with score 92.5",
       "No QC issues detected"
     ],
     "qcResult": {
       "passed": true,
       "score": 92.5,
       "issues": []
     }
   }
   ```

2. **Compare with operator decision**
   ```bash
   POST /api/ai/publish/shadow/{jobId}/compare
   Content-Type: application/json

   {
     "operatorDecision": "publish",
     "operatorActor": "operator@example.com"
   }
   ```

   This records whether the AI decision matched the operator's choice, improving calibration accuracy.

3. **Review shadow results**
   ```bash
   GET /api/ai/publish/shadow?hasComparison=true
   ```

## Autonomous Publishing

When confidence thresholds are met, AI can publish autonomously to supported platforms.

### Supported Platforms

| Platform  | Autonomous | Notes                                    |
|-----------|------------|------------------------------------------|
| YouTube   | ✅ Yes     | Full API support                         |
| Facebook  | ✅ Yes     | Full API support                         |
| Instagram | ✅ Yes     | Requires Business/Creator account        |
| TikTok    | ❌ No      | Manual export only (no public API)       |

### API: Autonomous Publish

```bash
POST /api/ai/publish/auto
Content-Type: application/json

{
  "episodeId": "ep_123",
  "platforms": ["youtube", "facebook"],
  "metadata": {
    "title": "Episode Title",
    "description": "Episode description",
    "tags": ["tag1", "tag2"]
  },
  "workspaceId": "ws_456",
  "actor": "system"
}
```

Response (when confidence met):
```json
{
  "success": true,
  "jobs": [
    {
      "id": "auto_xyz789",
      "type": "autonomous",
      "episodeId": "ep_123",
      "platform": "youtube",
      "status": "published",
      "aiDecision": "publish",
      "confidenceScore": 0.88,
      "platformVideoId": "youtube_abc123",
      "platformUrl": "https://youtube.com/video/abc123"
    }
  ],
  "message": "Published to 2/2 platforms"
}
```

Response (when confidence not met):
```json
{
  "success": false,
  "jobs": [],
  "message": "Autonomous publishing not allowed: Insufficient QC samples: 25/50 required"
}
```

### Force Publish

Override confidence checks when necessary:

```bash
POST /api/ai/publish/auto
Content-Type: application/json

{
  "episodeId": "ep_123",
  "platforms": ["youtube"],
  "forcePublish": true
}
```

## Override and Rollback

Operators maintain full control over autonomous actions.

### Override AI Decision

Change an AI decision before or after execution:

```bash
POST /api/ai/publish/auto/{jobId}/override
Content-Type: application/json

{
  "newDecision": "hold",
  "overriddenBy": "operator@example.com",
  "reason": "Content requires manual review"
}
```

### Rollback Published Content

Remove content that was auto-published:

```bash
POST /api/ai/publish/rollback/{jobId}
Content-Type: application/json

{
  "rolledBackBy": "operator@example.com",
  "reason": "Content issue discovered post-publish"
}
```

## Operator Workflow

### Building Confidence

1. **Start in Human-Lead mode** - Operators drive all decisions
2. **Use shadow publishing** - Let AI simulate decisions alongside operator work
3. **Compare decisions** - Record whether AI matches operator choices
4. **Monitor metrics** - Watch confidence scores rise
5. **Enable autonomous mode** - When thresholds are met

### Daily Operations

1. **Check confidence dashboard**
   ```bash
   GET /api/ai/confidence
   ```

2. **Review autonomous jobs**
   ```bash
   GET /api/ai/publish/auto?status=published
   ```

3. **Check for issues needing rollback**
   ```bash
   GET /api/ai/publish/auto/audit?action=published
   ```

4. **Review shadow calibration**
   ```bash
   GET /api/ai/publish/shadow?hasComparison=false
   ```

## Monitoring

### Autonomous Stats

```bash
GET /api/ai/publish/auto/stats
```

Response:
```json
{
  "totalJobs": 500,
  "shadowJobs": 350,
  "autonomousJobs": 150,
  "byStatus": {
    "published": 140,
    "failed": 5,
    "rolled_back": 3,
    "overridden": 2
  },
  "publishSuccess": 140,
  "overrides": 2,
  "rollbacks": 3,
  "calibrationAccuracy": 0.94
}
```

### Audit Log

```bash
GET /api/ai/publish/auto/audit?limit=50
```

## Environment Variables

No additional environment variables required for autonomous mode. Uses existing AI and publishing configurations.

## Best Practices

1. **Gradual rollout** - Start with shadow mode before enabling autonomous
2. **Regular calibration** - Compare AI decisions weekly
3. **Monitor metrics** - Set alerts for confidence drops
4. **Quick rollback** - Have rollback procedures ready
5. **Platform-specific thresholds** - Consider separate thresholds per platform
6. **Time-of-day rules** - Consider limiting autonomous publishing to business hours

## Troubleshooting

### "Autonomous publishing not allowed"

Check confidence score:
```bash
GET /api/ai/confidence
```

Common causes:
- Insufficient sample size (need 50+ episodes)
- QC pass rate below 95%
- Publishing error rate above 1%
- AI accuracy below 90%

### Low calibration accuracy

Review shadow results that didn't match:
```bash
GET /api/ai/publish/shadow?hasComparison=true
```

Investigate why AI decisions differ from operator choices.

### High rollback rate

Review rollback reasons:
```bash
GET /api/ai/publish/auto/audit?action=rolled_back
```

Consider temporarily disabling autonomous mode until issues are resolved.

## API Reference

### Confidence Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/confidence` | Get confidence score |
| GET | `/api/ai/confidence/thresholds` | Get thresholds |
| PUT | `/api/ai/confidence/thresholds` | Update thresholds |
| GET | `/api/ai/confidence/metrics` | Get metrics summary |
| GET | `/api/ai/confidence/metrics/:type/history` | Get metrics history |
| POST | `/api/ai/confidence/record` | Record a metric |

### Shadow Publishing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/publish/shadow` | Create shadow job |
| GET | `/api/ai/publish/shadow` | List shadow results |
| GET | `/api/ai/publish/shadow/:jobId` | Get shadow result |
| POST | `/api/ai/publish/shadow/:jobId/compare` | Compare with operator |

### Autonomous Publishing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/publish/auto` | Create autonomous job |
| GET | `/api/ai/publish/auto` | List autonomous jobs |
| GET | `/api/ai/publish/auto/:jobId` | Get autonomous job |
| POST | `/api/ai/publish/auto/:jobId/override` | Override decision |
| POST | `/api/ai/publish/rollback/:jobId` | Rollback publish |
| GET | `/api/ai/publish/auto/audit` | Get audit log |
| GET | `/api/ai/publish/auto/stats` | Get statistics |
