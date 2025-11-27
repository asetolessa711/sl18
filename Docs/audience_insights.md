# Audience Insights Guide

## Overview

SL18's Audience Insights system collects, analyzes, and surfaces engagement metrics, sentiment analysis, retention curves, and demographic breakdowns from global distribution channels. This data feeds into the Feedback Loop Engine (see [Feedback Loops](./feedback_loops.md)) to enable adaptive personalization and monetization.

## Schema Reference

- **Schema File**: `schemas/audience_insights.schema.json`
- **Test Fixtures**: `tests/governance/fixtures/audience_insights.json`

## Key Components

### 1. Engagement Metrics

Track viewer interactions and watch patterns:

```json
{
  "engagementMetrics": {
    "totalViews": 125000,
    "uniqueViewers": 87500,
    "avgWatchTime": 420,
    "completionRate": 72.5,
    "interactions": {
      "likes": 8500,
      "shares": 2100,
      "comments": 1850
    },
    "engagementRate": 12.8,
    "bingePatterns": {
      "avgEpisodesPerSession": 2.4,
      "bingeViewerCount": 15000,
      "bingePercentage": 17.1
    }
  }
}
```

**Engagement Rate Calculation**:
```javascript
engagementRate = ((likes + shares + comments) / totalViews) * 100
```

**Engagement Classification**:
- `viral`: ≥25% engagement rate
- `high_engagement`: ≥15% engagement rate
- `moderate_engagement`: ≥5% engagement rate
- `low_engagement`: <5% engagement rate

### 2. Sentiment Analysis

Analyze viewer reactions and cultural sentiment:

```json
{
  "sentimentAnalysis": {
    "overallSentiment": "positive",
    "sentimentScore": 0.72,
    "sentimentBreakdown": {
      "positiveCount": 1450,
      "neutralCount": 280,
      "negativeCount": 120
    },
    "topPositiveThemes": [
      { "theme": "storytelling", "count": 520 },
      { "theme": "characters", "count": 380 }
    ],
    "topNegativeThemes": [
      { "theme": "pacing", "count": 45 }
    ],
    "culturalReactions": [
      { "region": "KE", "sentiment": "very_positive" },
      { "region": "NG", "sentiment": "positive" }
    ]
  }
}
```

**Sentiment Score Range**: -1.0 (very negative) to +1.0 (very positive)

**Sentiment Classification**:
- `very_positive`: ≥0.6
- `positive`: ≥0.3
- `neutral`: ≥-0.3
- `negative`: ≥-0.6
- `very_negative`: <-0.6

### 3. Retention Curves

Track viewer retention throughout content:

```json
{
  "retentionCurves": {
    "curveType": "quartile",
    "dataPoints": [
      { "position": 0, "retentionPercentage": 100 },
      { "position": 25, "retentionPercentage": 85 },
      { "position": 50, "retentionPercentage": 78 },
      { "position": 75, "retentionPercentage": 74 },
      { "position": 100, "retentionPercentage": 72.5 }
    ],
    "dropOffPoints": [
      {
        "position": 12,
        "dropPercentage": 8,
        "reason": "pacing_issue",
        "suggestedAction": "Tighten intro segment"
      }
    ],
    "peakMoments": [
      {
        "position": 65,
        "engagementSpike": 1.4,
        "peakType": "emotional_peak"
      }
    ]
  }
}
```

**Curve Types**:
- `second_by_second`: Granular tracking for short-form
- `minute_by_minute`: Standard for medium content
- `quartile`: 25% intervals
- `decile`: 10% intervals

**Drop-off Reasons**:
- `natural_end`: Expected content conclusion
- `content_quality`: Quality issues
- `pacing_issue`: Too slow/fast
- `ad_break`: Advertisement interruption
- `technical_issue`: Buffering, playback errors
- `external_distraction`: Viewer context

### 4. Demographic Breakdown

Segment audience by region, age, language, and device:

```json
{
  "demographicBreakdown": {
    "byRegion": [
      {
        "region": "Africa",
        "country": "KE",
        "viewerCount": 45000,
        "viewerPercentage": 36,
        "avgWatchTime": 480,
        "engagementRate": 15.2
      }
    ],
    "byAgeGroup": [
      {
        "ageGroup": "18-24",
        "viewerCount": 48000,
        "viewerPercentage": 38.4,
        "engagementRate": 16.5
      }
    ],
    "byLanguage": [
      {
        "language": "en",
        "viewerCount": 75000,
        "viewerPercentage": 60,
        "subtitleUsage": 25
      }
    ],
    "byDevice": [
      {
        "deviceType": "mobile",
        "viewerCount": 87500,
        "viewerPercentage": 70,
        "avgWatchTime": 380
      }
    ]
  }
}
```

### 5. Feedback Signals

Signals extracted for personalization, monetization, and QC:

```json
{
  "feedbackSignals": {
    "personalizationSignals": [
      {
        "signalType": "format_preference",
        "signalValue": "serialized",
        "confidence": 85,
        "sampleSize": 12000
      }
    ],
    "monetizationSignals": [
      {
        "signalType": "upgrade_potential",
        "signalValue": "high",
        "confidence": 72
      }
    ],
    "qcSignals": [
      {
        "signalType": "translation_quality_issue",
        "severity": "medium",
        "affectedRegions": ["ET"],
        "description": "Amharic subtitles have grammar errors"
      }
    ]
  }
}
```

**Personalization Signal Types**:
- `persona_preference`: Preferred persona/host
- `format_preference`: Short-form vs serialized
- `duration_preference`: Micro, short, medium, long
- `tone_preference`: Casual, formal, humorous
- `genre_preference`: Drama, comedy, etc.

**Monetization Signal Types**:
- `churn_risk`: Likelihood of subscription cancellation
- `upgrade_potential`: Likelihood of tier upgrade
- `price_sensitivity`: Response to pricing changes
- `ad_tolerance`: Acceptance of ad-supported content

**QC Signal Types**:
- `cultural_sensitivity_issue`: Regional cultural concerns
- `translation_quality_issue`: Subtitle/caption quality
- `persona_consistency_issue`: Voice/style drift
- `technical_quality_issue`: Audio/video quality

## Data Quality Tracking

Every insight includes quality metrics:

```json
{
  "dataQuality": {
    "completeness": 98.5,
    "reliability": "high",
    "sampleSize": 125000,
    "lastUpdated": "2025-11-08T06:00:00Z"
  }
}
```

- **Completeness**: Percentage of expected data points collected
- **Reliability**: `high`, `medium`, `low` based on data consistency
- **Sample Size**: Number of data points in the analysis

## Integration with Distribution Channels

Audience insights integrate with Phase 19 distribution channels:

1. **YouTube**: Views, likes, comments, watch time, demographics
2. **TikTok**: Views, shares, completion rate, trending signals
3. **Spotify**: Listens, completion rate, playlist adds
4. **Broadcasters**: Ratings, reach, audience share
5. **OTT Platforms**: Subscription metrics, binge patterns

## Operator Dashboard Views

### Real-Time Metrics
- Live view counts and engagement
- Trending content alerts
- Regional performance heatmaps

### Weekly Reports
- Comparative analysis vs previous content
- Genre benchmark percentiles
- Demographic shifts

### Alert Triggers
- Sudden sentiment drops
- Unusual drop-off patterns
- Cultural sensitivity flags

## Audit Events

All insight operations are logged:

| Event | Category | Description |
|-------|----------|-------------|
| `insight_collected` | audience_insights | Raw data collected |
| `insight_processed` | audience_insights | Analysis completed |
| `insight_ready` | audience_insights | Insight available |
| `engagement_metrics_updated` | audience_insights | Metrics refreshed |
| `sentiment_analysis_completed` | audience_insights | Sentiment analyzed |
| `retention_curve_generated` | audience_insights | Retention data ready |
| `demographic_breakdown_updated` | audience_insights | Demographics refreshed |

## Best Practices

1. **Set Minimum Sample Sizes**: Require sufficient data before triggering actions
2. **Use Confidence Scores**: Only act on high-confidence signals
3. **Monitor Data Quality**: Check completeness before making decisions
4. **Cross-Reference Regions**: Compare regional performance for cultural insights
5. **Track Peak Moments**: Identify shareable moments for promotion

## Related Documentation

- [Feedback Loops](./feedback_loops.md) - Adaptive actions based on insights
- [Personalization](./personalization.md) - AI-driven content personalization
- [Adaptive Monetization](./adaptive_monetization.md) - Dynamic pricing
- [Distribution](./distribution.md) - Global distribution channels
