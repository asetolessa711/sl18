# Ad Insertion

This document describes the advertising and sponsorship system in SL18 + Waliin Studio, including SSAI, targeting, compliance, and revenue tracking.

## Overview

The ad insertion system provides:
- **SSAI**: Server-Side Ad Insertion for seamless playback
- **Targeting**: Demographic, geo, behavioral, contextual targeting
- **Sponsorship**: Brand integrations and presenting sponsors
- **Compliance**: GDPR, COPPA, cultural sensitivity filters

## Schema: `schemas/ad_insertion.schema.json`

## SSAI Configuration

Server-Side Ad Insertion provides seamless ad delivery:

```json
{
  "ssaiConfig": {
    "enabled": true,
    "provider": "aws_mediatailor",
    "adServerUrl": "https://ads.example.com/vast",
    "manifestManipulation": true,
    "beaconTracking": true,
    "personalizedAds": true,
    "fallbackAdEnabled": true
  }
}
```

### Supported Providers
- AWS MediaTailor
- Google Ad Manager
- Brightcove
- SpringServe
- FreeWheel
- Custom

## Ad Placements

### Pre-Roll
Ads before content starts:

```json
{
  "preRoll": {
    "enabled": true,
    "maxDurationSeconds": 30,
    "maxAdCount": 2,
    "skipAfterSeconds": 5,
    "skipEnabled": true
  }
}
```

### Mid-Roll
Ads during content:

```json
{
  "midRoll": {
    "enabled": true,
    "intervalMinutes": 10,
    "maxDurationSeconds": 60,
    "maxAdCount": 3,
    "naturalBreakDetection": true,
    "cuePoints": [
      { "timestamp": 600, "adDuration": 30 },
      { "timestamp": 1200, "adDuration": 45 }
    ]
  }
}
```

### Rewarded Ads
Viewer-initiated ads for rewards:

```json
{
  "rewarded": {
    "enabled": true,
    "rewardType": "unlock_content",
    "rewardValue": 1,
    "requiredWatchPercentage": 100
  }
}
```

## Targeting

### Demographic Targeting

```json
{
  "demographicTargeting": {
    "enabled": true,
    "ageGroups": ["18-24", "25-34", "35-44"],
    "genders": ["male", "female"]
  }
}
```

### Geo Targeting

```json
{
  "geoTargeting": {
    "enabled": true,
    "regions": ["EA", "WA"],
    "countries": ["KE", "ET", "NG"],
    "cities": ["Nairobi", "Lagos"]
  }
}
```

### Behavioral Targeting

```json
{
  "behavioralTargeting": {
    "enabled": true,
    "genreAffinities": ["drama", "thriller"],
    "watchingPatterns": ["binge_watcher", "primetime_only"],
    "contentPreferences": ["short_form", "series"]
  }
}
```

### Contextual Targeting

```json
{
  "contextualTargeting": {
    "enabled": true,
    "contentGenre": ["drama"],
    "contentRating": ["TV-14"],
    "mood": ["dramatic", "thriller"]
  }
}
```

## Sponsorship

### Presenting Sponsors

```json
{
  "sponsorship": {
    "enabled": true,
    "sponsors": [
      {
        "sponsorId": "sponsor-001",
        "sponsorName": "Safaricom",
        "sponsorshipType": "presenting",
        "placements": [
          {
            "placementType": "intro_card",
            "duration": 5,
            "assetUrl": "https://cdn.example.com/sponsor-intro.mp4"
          }
        ],
        "revenueModel": "flat_fee"
      }
    ]
  }
}
```

### Sponsorship Types
- **Presenting**: "Brought to you by..."
- **Exclusive**: Solo sponsor for content
- **Branded Content**: Integrated brand story
- **Product Placement**: In-content integration
- **Banner**: On-screen overlay

## Frequency Capping

Prevent ad fatigue:

```json
{
  "frequencyCapping": {
    "enabled": true,
    "maxImpressionsPerHour": 8,
    "maxImpressionsPerDay": 40,
    "maxSameAdPerSession": 2,
    "cooldownMinutes": 30
  }
}
```

## Compliance

### Privacy Compliance

```json
{
  "compliance": {
    "gdprCompliant": true,
    "coppaCompliant": true,
    "ccpaCompliant": true,
    "consentRequired": true,
    "noPersonalizedAdsOption": true
  }
}
```

### Cultural Sensitivity

```json
{
  "compliance": {
    "culturalSensitivityFilters": true,
    "adCategoriesBlocked": [
      "alcohol",
      "tobacco",
      "gambling",
      "adult",
      "political",
      "weapons"
    ]
  }
}
```

## Revenue Tracking

```json
{
  "revenueTracking": {
    "trackImpressions": true,
    "trackClicks": true,
    "trackCompletions": true,
    "trackRevenue": true,
    "cpmFloor": 3.0,
    "fillRateTarget": 90
  }
}
```

### Key Metrics
- **CPM**: Cost per thousand impressions
- **Fill Rate**: Percentage of ad requests filled
- **CTR**: Click-through rate
- **Viewability**: Percentage of viewable impressions
- **Completion Rate**: Percentage of ads watched to completion

## Integration Points

- **Phase 25**: Cultural sensitivity governance
- **Phase 28**: Media distribution pipeline
- **Phase 29**: Waliin showcase (banner ads)
- **Phase 32**: Monetization analytics

## API Events

| Event | Description |
|-------|-------------|
| `ad_config_created` | Ad configuration created |
| `ad_served` | Ad impression served |
| `ad_clicked` | Ad click recorded |
| `ad_completed` | Ad watched to completion |
| `ad_revenue_recorded` | Revenue recorded |
| `sponsor_impression` | Sponsor placement shown |

## Best Practices

1. **Ad Load**: Balance revenue with user experience
2. **Natural Breaks**: Use AI to detect scene breaks for mid-roll
3. **Frequency**: Cap frequency to prevent fatigue
4. **Targeting**: Use contextual + behavioral for relevance
5. **Compliance**: Always respect user consent preferences
6. **Cultural Sensitivity**: Block inappropriate categories by region
