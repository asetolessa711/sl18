# Audience Personalization - Adaptive Experience System

## Overview

The Audience Personalization system provides personalized recommendations, adaptive UI, and tailored viewing experiences for Waliin Studio customers. This integrates with Phase 17 (Personalization Engine) and Phase 20 (Audience Insights).

## Schema

**File:** `schemas/audience_personalization.schema.json`

## Preference Tracking

### Genre Preferences

```json
{
  "preferences": {
    "genres": [
      {
        "genre": "drama",
        "affinity": 0.92,
        "explicitPreference": true,
        "viewCount": 45,
        "avgCompletionRate": 88.5,
        "lastWatched": "2024-01-20T22:30:00Z"
      }
    ]
  }
}
```

| Field | Description |
|-------|-------------|
| `affinity` | Score 0-1 based on viewing behavior |
| `explicitPreference` | User manually set preference |
| `viewCount` | Number of items watched in genre |
| `avgCompletionRate` | Average completion percentage |

### Persona Affinities

```json
{
  "personas": [
    {
      "personaId": "persona-amara",
      "personaName": "Amara",
      "affinity": 0.88,
      "interactionCount": 156,
      "favoriteContent": ["episode-s01e03", "episode-s01e05"]
    }
  ]
}
```

### Content Format Preferences

```json
{
  "contentFormats": {
    "shortDrama": 0.85,
    "movie": 0.65,
    "series": 0.90,
    "documentary": 0.35,
    "miniSeries": 0.70
  }
}
```

### Language Preferences

```json
{
  "languages": {
    "preferredAudio": ["sw", "en"],
    "preferredSubtitles": ["en"],
    "autoSelectSubtitles": true,
    "dubbingPreferred": false
  }
}
```

### Content Ratings

```json
{
  "contentRatings": {
    "maxRating": "TV-14",
    "excludeViolence": false,
    "excludeAdultThemes": true
  }
}
```

### Viewing Times

```json
{
  "viewingTimes": {
    "preferredDays": ["friday", "saturday", "sunday"],
    "preferredTimeSlots": ["evening", "late_night"],
    "avgSessionDuration": 95
  }
}
```

## Watching Patterns

```json
{
  "watchingPatterns": {
    "bingeWatcher": true,
    "avgEpisodesPerSession": 4.2,
    "skipIntro": true,
    "skipCredits": false,
    "watchesTrailers": true,
    "completionTendency": "high_completer",
    "rewatch": false,
    "devicePreference": "tv"
  }
}
```

### Completion Tendencies

| Tendency | Description |
|----------|-------------|
| `high_completer` | Completes 85%+ of content |
| `moderate_completer` | Completes 60-84% of content |
| `sampler` | Often samples but rarely completes |
| `abandoner` | Frequently abandons content early |

## Recommendations

### Algorithm Types

| Algorithm | Description |
|-----------|-------------|
| `collaborative_filtering` | Based on similar users |
| `content_based` | Based on content attributes |
| `hybrid` | Combination approach |
| `trending` | Popular/trending content |
| `editorial` | Curated by editors |

### For You Queue

```json
{
  "recommendations": {
    "algorithm": "hybrid",
    "forYouQueue": [
      {
        "contentId": "movie-waliin-003",
        "score": 0.94,
        "reason": "genre_match",
        "position": 1,
        "addedAt": "2024-01-20T00:00:00Z",
        "expiresAt": "2024-01-27T00:00:00Z"
      }
    ],
    "lastRefreshed": "2024-01-20T06:00:00Z",
    "refreshInterval": 6
  }
}
```

### Recommendation Reasons

| Reason | Description |
|--------|-------------|
| `genre_match` | Matches genre preferences |
| `persona_match` | Features favorite personas |
| `popular_in_region` | Popular in user's region |
| `similar_to_watched` | Similar to previously watched |
| `trending` | Currently trending |
| `new_release` | New content release |
| `editor_pick` | Editor's recommendation |
| `continue_watching` | Unfinished content |

### Continue Watching

```json
{
  "continueWatching": [
    {
      "contentId": "series-waliin-001",
      "episodeId": "episode-waliin-s01e06",
      "progress": 45.5,
      "lastWatched": "2024-01-19T22:30:00Z",
      "nextEpisodeId": "episode-waliin-s01e07"
    }
  ]
}
```

### Similar Content

```json
{
  "similarToWatched": [
    {
      "basedOnContentId": "movie-waliin-001",
      "recommendations": [
        { "contentId": "movie-waliin-003", "similarityScore": 0.87 }
      ]
    }
  ]
}
```

## Adaptive UI

### Hero Banner Personalization

```json
{
  "adaptiveUI": {
    "heroBanner": {
      "personalizedSelection": true,
      "preferredStyle": "action_focused",
      "autoplayTrailer": true
    }
  }
}
```

### Banner Styles

| Style | Description |
|-------|-------------|
| `action_focused` | Action/drama imagery |
| `character_focused` | Character-centric imagery |
| `mood_focused` | Atmospheric imagery |
| `default` | Standard selection |

### Category Ordering

```json
{
  "categoryOrder": [
    { "categoryId": "continue_watching", "position": 1, "weight": 1.0 },
    { "categoryId": "for_you", "position": 2, "weight": 0.95 },
    { "categoryId": "trending", "position": 3, "weight": 0.8 }
  ]
}
```

### Display Settings

```json
{
  "displayDensity": "normal",
  "thumbnailStyle": "adaptive",
  "showRatings": true,
  "showProgress": true
}
```

| Setting | Options |
|---------|---------|
| `displayDensity` | compact, normal, expanded |
| `thumbnailStyle` | poster, landscape, square, adaptive |

## Kids Mode

```json
{
  "kidsMode": {
    "enabled": true,
    "ageRange": "5-7",
    "allowedGenres": ["animation", "educational", "family"],
    "blockedContent": ["content-id-123"],
    "pinRequired": true,
    "watchTimeLimits": {
      "dailyLimit": 120,
      "sessionLimit": 45,
      "bedtimeHour": 20
    }
  }
}
```

### Age Ranges

- `0-4` - Toddlers
- `5-7` - Young children
- `8-12` - Pre-teens
- `13-17` - Teens

## Notification Preferences

```json
{
  "notificationPreferences": {
    "newReleases": true,
    "recommendedContent": true,
    "continueWatchingReminders": false,
    "pollsAndInteractive": true,
    "commentReplies": true,
    "frequency": "daily_digest"
  }
}
```

### Notification Frequency

| Frequency | Description |
|-----------|-------------|
| `realtime` | Immediate notifications |
| `daily_digest` | Daily summary |
| `weekly_digest` | Weekly summary |
| `never` | Disable notifications |

## Privacy Settings

```json
{
  "privacySettings": {
    "shareWatchHistory": false,
    "shareWithPartners": false,
    "personalizedAds": true,
    "analyticsOptIn": true
  }
}
```

## Engagement History

```json
{
  "engagementHistory": {
    "pollsParticipated": 28,
    "commentsPosted": 15,
    "reactionsGiven": 145,
    "contentRated": 32,
    "shareCount": 8,
    "engagementScore": 78.5,
    "engagementTier": "active"
  }
}
```

### Engagement Tiers

| Tier | Description | Score Range |
|------|-------------|-------------|
| `casual` | Occasional engagement | 0-25 |
| `engaged` | Regular engagement | 26-50 |
| `active` | High engagement | 51-75 |
| `superfan` | Top-tier engagement | 76-100 |

## Integration with Other Systems

### Phase 17 - Personalization Engine

```json
{
  "insightsIntegration": {
    "feedToPersonalizationEngine": true
  }
}
```

### Phase 20 - Audience Insights

```json
{
  "insightsIntegration": {
    "feedToAudienceInsights": true,
    "feedbackLoopEnabled": true
  }
}
```

## Personalization Lifecycle

| Status | Description |
|--------|-------------|
| `active` | Profile is active |
| `inactive` | Profile temporarily inactive |
| `suspended` | Profile suspended |
| `deleted` | Profile deleted |

## Audit Events

| Event | Description |
|-------|-------------|
| `audience_personalization_created` | New profile created |
| `audience_personalization_updated` | Profile updated |
| `preference_updated` | Preference changed |
| `recommendation_queue_refreshed` | Recommendations refreshed |
| `recommendation_served` | Recommendation shown |
| `continue_watching_updated` | Continue watching updated |
| `for_you_updated` | For You queue updated |
| `adaptive_ui_updated` | UI settings updated |
| `hero_banner_personalized` | Banner personalized |
| `category_order_personalized` | Categories reordered |
| `kids_mode_enabled` | Kids mode enabled |
| `kids_mode_disabled` | Kids mode disabled |
| `watch_time_limit_reached` | Watch time limit reached |

## API Examples

### Get Recommendations

```javascript
GET /api/personalization/{customerId}/recommendations
```

### Update Preferences

```javascript
PATCH /api/personalization/{customerId}/preferences
{
  "genres": [
    { "genre": "drama", "affinity": 0.95 }
  ]
}
```

### Toggle Kids Mode

```javascript
POST /api/personalization/{customerId}/kids-mode
{
  "enabled": true,
  "ageRange": "5-7",
  "pin": "1234"
}
```

## Best Practices

1. **Cold Start**: Use editorial picks for new users
2. **Diversity**: Include varied recommendations to avoid filter bubbles
3. **Transparency**: Show users why content is recommended
4. **Control**: Give users control over their preferences
5. **Privacy**: Respect privacy settings and data minimization
6. **Refresh**: Update recommendations frequently (every 6 hours)
7. **Testing**: A/B test recommendation algorithms
