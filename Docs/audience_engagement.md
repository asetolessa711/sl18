# Audience Engagement Analytics - Community Metrics Dashboard

## Overview

The Audience Engagement Analytics system tracks poll participation, comment activity, reaction counts, and engagement heatmaps. It provides operators with dashboards to monitor community sentiment and interactivity across Waliin Studio content.

## Schema

**File:** `schemas/audience_engagement.schema.json`

## Poll Engagement Metrics

```json
{
  "pollEngagement": {
    "totalPolls": 3,
    "totalVotes": 24500,
    "uniqueVoters": 22100,
    "participationRate": 42.5,
    "avgVotesPerPoll": 8167,
    "pollBreakdown": [
      {
        "pollId": "poll-001",
        "pollType": "story_choice",
        "voteCount": 15420,
        "participationRate": 45.2,
        "avgTimeToVote": 8.5,
        "completionRate": 78.5
      }
    ],
    "topPerformingPolls": ["poll-001", "poll-003"],
    "pollTypePerformance": {
      "story_choice": 45.2,
      "sentiment_slider": 38.1,
      "character_vote": 52.0
    }
  }
}
```

### Poll Type Performance

Track which poll types drive the most engagement:

| Poll Type | Avg Participation |
|-----------|-------------------|
| `character_vote` | 52% |
| `story_choice` | 45% |
| `prediction` | 42% |
| `sentiment_slider` | 38% |
| `rating` | 35% |
| `feedback` | 25% |

## Comment Engagement Metrics

```json
{
  "commentEngagement": {
    "totalComments": 3420,
    "uniqueCommenters": 2850,
    "avgCommentsPerViewer": 0.066,
    "totalReplies": 1580,
    "avgThreadDepth": 1.8,
    "commentRate": 5.5,
    "topComments": [
      {
        "commentId": "comment-001",
        "reactionCount": 342,
        "replyCount": 28,
        "sentiment": "very_positive"
      }
    ],
    "moderationStats": {
      "totalFlagged": 45,
      "totalRemoved": 12,
      "flagRate": 1.3,
      "avgReviewTime": 15.5
    },
    "timestampedComments": {
      "count": 890,
      "hotspots": [
        { "timestamp": 1245, "commentCount": 156, "avgSentiment": 0.82 }
      ]
    }
  }
}
```

### Moderation Stats

Track moderation efficiency:

| Metric | Description | Target |
|--------|-------------|--------|
| `flagRate` | % of comments flagged | < 5% |
| `avgReviewTime` | Avg review time (minutes) | < 15 |
| `totalRemoved` | Comments removed | Varies |

### Timestamped Comment Hotspots

Identify moments that drive discussion:

```json
{
  "hotspots": [
    {
      "timestamp": 1245,
      "commentCount": 156,
      "avgSentiment": 0.82
    }
  ]
}
```

## Reaction Engagement Metrics

```json
{
  "reactionEngagement": {
    "totalReactions": 45200,
    "uniqueReactors": 28500,
    "reactionRate": 54.8,
    "reactionBreakdown": {
      "like": 18500,
      "love": 12300,
      "fire": 8200,
      "wow": 4100,
      "sad": 1500,
      "laugh": 600
    },
    "reactionTimeline": [
      {
        "timestamp": "2024-01-20T20:00:00Z",
        "count": 850,
        "topReaction": "fire"
      }
    ],
    "sentimentFromReactions": 0.78
  }
}
```

### Deriving Sentiment from Reactions

| Reaction | Sentiment Weight |
|----------|-----------------|
| `love` | +1.0 |
| `fire` | +0.8 |
| `heart_eyes` | +0.9 |
| `like` | +0.5 |
| `laugh` | +0.4 |
| `wow` | +0.2 |
| `sad` | -0.3 |
| `angry` | -0.8 |

## Regional Engagement

### Heatmap Data

```json
{
  "regionalEngagement": {
    "heatmapData": [
      {
        "region": "EA",
        "country": "KE",
        "city": "Nairobi",
        "engagementScore": 82.5,
        "pollParticipation": 48.2,
        "commentRate": 6.8,
        "reactionRate": 62.5,
        "viewerCount": 25000,
        "sentiment": 0.85
      }
    ],
    "topRegions": ["EA", "WA"],
    "lowEngagementRegions": [
      {
        "region": "SA",
        "engagementScore": 35.2,
        "suggestedAction": "Increase localization efforts"
      }
    ]
  }
}
```

### Cultural Sensitivity Alerts

```json
{
  "culturalSensitivityAlerts": [
    {
      "region": "EA",
      "alertType": "negative_sentiment_spike",
      "severity": "high",
      "description": "Negative sentiment spike in Kenya",
      "affectedViewers": 5000,
      "detectedAt": "2024-01-20T14:30:00Z"
    }
  ]
}
```

### Alert Types

| Type | Description |
|------|-------------|
| `negative_sentiment_spike` | Sudden increase in negative sentiment |
| `cultural_backlash` | Cultural sensitivity issue detected |
| `translation_issue` | Translation quality complaints |
| `persona_mismatch` | Persona alignment concerns |

## Overall Metrics

```json
{
  "overallMetrics": {
    "engagementScore": 78.5,
    "engagementTier": "high",
    "activeViewers": 32500,
    "passiveViewers": 19500,
    "engagementRatio": 62.5,
    "viralCoefficient": 0.15,
    "communityHealth": "thriving"
  }
}
```

### Engagement Tiers

| Tier | Score Range | Description |
|------|-------------|-------------|
| `viral` | 90-100 | Exceptional engagement |
| `high` | 70-89 | Strong engagement |
| `moderate` | 40-69 | Average engagement |
| `low` | 20-39 | Below average |
| `minimal` | 0-19 | Poor engagement |

### Community Health

| Status | Description |
|--------|-------------|
| `thriving` | Healthy, growing community |
| `healthy` | Stable, positive community |
| `stable` | Consistent engagement |
| `declining` | Engagement dropping |
| `critical` | Requires intervention |

### Engagement Score Calculation

```
engagementScore = (pollRate × 0.3) + (commentRate × 3) + (reactionRate × 0.4)
```

## Trend Analysis

```json
{
  "trendAnalysis": {
    "engagementTrend": "increasing",
    "trendPercentage": 12.5,
    "weekOverWeek": [
      {
        "week": "2024-W02",
        "engagementScore": 72.0,
        "pollParticipation": 38.5,
        "commentRate": 4.8,
        "reactionRate": 52.0
      }
    ],
    "seasonalPatterns": {
      "peakDays": ["friday", "saturday"],
      "peakHours": [20, 21, 22],
      "lowEngagementPeriods": ["monday_morning", "tuesday_morning"]
    },
    "anomalies": [
      {
        "timestamp": "2024-01-20T21:00:00Z",
        "metric": "reactionRate",
        "expectedValue": 55.0,
        "actualValue": 85.0,
        "deviation": 54.5,
        "possibleCause": "Viral scene moment"
      }
    ]
  }
}
```

### Trend Directions

| Trend | Description |
|-------|-------------|
| `increasing` | Engagement growing |
| `stable` | Engagement consistent |
| `decreasing` | Engagement declining |

## Alerts System

```json
{
  "alerts": {
    "activeAlerts": [
      {
        "alertId": "alert-001",
        "alertType": "engagement_spike",
        "severity": "info",
        "message": "Engagement spike detected for episode S01E05",
        "triggeredAt": "2024-01-20T21:00:00Z",
        "acknowledgedAt": null,
        "resolvedAt": null
      }
    ],
    "alertThresholds": {
      "engagementDropThreshold": 20,
      "moderationBacklogThreshold": 100,
      "sentimentShiftThreshold": 0.3
    }
  }
}
```

### Alert Types

| Type | Description | Severity |
|------|-------------|----------|
| `engagement_spike` | Unusual increase in engagement | info |
| `engagement_drop` | Significant drop in engagement | warning |
| `moderation_backlog` | Too many pending items | warning |
| `sentiment_shift` | Major sentiment change | warning/critical |
| `cultural_issue` | Cultural sensitivity detected | critical |
| `viral_content` | Content going viral | info |
| `spam_detected` | Spam wave detected | warning |

### Alert Severity Levels

| Level | Response Time | Escalation |
|-------|--------------|------------|
| `info` | Review within 24h | None |
| `warning` | Review within 4h | Team lead |
| `critical` | Immediate response | Management |

## Operator Dashboard

```json
{
  "operatorDashboard": {
    "widgets": [
      {
        "widgetId": "widget-kpi-engagement",
        "widgetType": "kpi_card",
        "title": "Engagement Score",
        "metric": "engagementScore",
        "position": { "row": 1, "col": 1, "width": 2, "height": 1 },
        "refreshInterval": 60
      },
      {
        "widgetId": "widget-chart-polls",
        "widgetType": "bar_chart",
        "title": "Poll Participation",
        "metric": "pollParticipation"
      },
      {
        "widgetId": "widget-heatmap-regional",
        "widgetType": "heatmap",
        "title": "Regional Engagement",
        "metric": "regionalEngagement"
      }
    ],
    "defaultView": "overview",
    "exportFormats": ["csv", "pdf", "xlsx", "json"]
  }
}
```

### Widget Types

| Type | Description |
|------|-------------|
| `kpi_card` | Single KPI metric |
| `line_chart` | Trend over time |
| `bar_chart` | Comparison chart |
| `pie_chart` | Distribution chart |
| `heatmap` | Geographic heatmap |
| `table` | Data table |
| `alert_list` | Active alerts |
| `comment_feed` | Live comment feed |

### Dashboard Views

| View | Description |
|------|-------------|
| `overview` | All metrics summary |
| `polls` | Poll-focused view |
| `comments` | Comment-focused view |
| `reactions` | Reaction-focused view |
| `regional` | Geographic analysis |
| `alerts` | Alert management |

## Insights Integration

```json
{
  "insightsIntegration": {
    "feedToAudienceInsights": true,
    "feedToFeedbackLoop": true,
    "triggerPersonalizationUpdate": true,
    "triggerContentOptimization": false
  }
}
```

### Integration Points

| System | Data Shared |
|--------|-------------|
| Phase 17 - Personalization | User preferences, engagement signals |
| Phase 20 - Audience Insights | Sentiment, retention, demographics |
| Phase 20 - Feedback Loop | Engagement triggers, actions |

## Data Quality

```json
{
  "dataQuality": {
    "completeness": 98.5,
    "reliability": "high",
    "sampleSize": 52000,
    "lastUpdated": "2024-01-21T06:00:00Z"
  }
}
```

### Reliability Levels

| Level | Description |
|-------|-------------|
| `high` | > 95% completeness, large sample |
| `medium` | 80-95% completeness |
| `low` | < 80% completeness |

## Audit Events

| Event | Description |
|-------|-------------|
| `engagement_analytics_collected` | Data collected |
| `engagement_analytics_processed` | Data processed |
| `engagement_score_calculated` | Score calculated |
| `engagement_tier_updated` | Tier changed |
| `engagement_alert_triggered` | Alert triggered |
| `engagement_alert_resolved` | Alert resolved |
| `regional_heatmap_updated` | Heatmap refreshed |
| `cultural_sensitivity_alert_triggered` | Sensitivity alert |
| `community_health_assessed` | Health assessed |
| `trend_analysis_completed` | Trend analyzed |
| `viral_content_detected` | Viral detection |
| `engagement_spike_detected` | Spike detected |
| `engagement_drop_detected` | Drop detected |
| `moderation_backlog_alert` | Backlog alert |
| `sentiment_shift_detected` | Sentiment shift |
| `operator_dashboard_viewed` | Dashboard access |
| `engagement_report_exported` | Report exported |

## API Examples

### Get Engagement Analytics

```javascript
GET /api/engagement/{contentId}?periodStart=2024-01-15&periodEnd=2024-01-21
```

### Get Regional Heatmap

```javascript
GET /api/engagement/{contentId}/regional
```

### Export Report

```javascript
POST /api/engagement/{contentId}/export
{
  "format": "pdf",
  "sections": ["polls", "comments", "reactions", "regional"]
}
```

### Acknowledge Alert

```javascript
POST /api/engagement/alerts/{alertId}/acknowledge
{
  "acknowledgedBy": "operator-001"
}
```

## Best Practices

1. **Real-time Monitoring**: Check dashboard every 2-4 hours during active content
2. **Alert Response**: Respond to critical alerts within 15 minutes
3. **Trend Tracking**: Review weekly trends for content planning
4. **Regional Focus**: Pay attention to low-engagement regions
5. **Cultural Sensitivity**: Act immediately on cultural sensitivity alerts
6. **Community Health**: Maintain "thriving" or "healthy" status
7. **Data-Driven**: Use insights to inform content decisions
