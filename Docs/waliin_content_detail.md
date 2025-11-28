# Waliin Studio Content Detail Pages

This document describes the Waliin Studio content detail page system, providing rich movie/episode information, engagement metrics, and monetization features.

## Overview

The Content Detail system enables:
- **Content Information**: Synopsis, cast/crew, runtime, ratings
- **Media Assets**: Posters, backdrops, trailers, thumbnails
- **Localization**: Subtitles, dubbed audio, audio descriptions
- **Engagement**: Views, ratings, comments, retention curves
- **Monetization**: Access models, pricing, geo-restrictions
- **Recommendations**: Similar content, personalized suggestions

## Schema: `waliin_content_detail.schema.json`

### Core Configuration

```json
{
  "contentDetailId": "detail-waliin-drama-001",
  "version": "1.0.0",
  "contentType": "short_drama",
  "contentInfo": {
    "contentId": "content-waliin-drama-001",
    "title": "The Coffee Merchant",
    "synopsis": "A gripping tale of ambition...",
    "genres": ["drama", "romance", "historical"]
  }
}
```

## Content Types

| Type | Description |
|------|-------------|
| `movie` | Feature-length film |
| `series` | Multi-episode series |
| `episode` | Individual episode |
| `short_drama` | Short-form drama |
| `mini_series` | Limited series |
| `special` | Special programming |
| `documentary` | Documentary content |

## Content Information

### Basic Information

| Field | Description |
|-------|-------------|
| `title` | Primary title |
| `titleLocalized` | Localized titles by language |
| `originalTitle` | Original language title |
| `synopsis` | Full description |
| `shortSynopsis` | Preview description (≤300 chars) |
| `tagline` | Marketing tagline |

### Genres

- Drama, Comedy, Thriller, Romance, Action
- Horror, Documentary, Musical, Family
- Sci-Fi, Fantasy, Historical, Slice of Life
- Mystery, Crime

### Content Ratings

| Rating | Description |
|--------|-------------|
| `G` | General audiences |
| `PG` | Parental guidance |
| `PG-13` | Parents strongly cautioned |
| `R` | Restricted |
| `TV-Y` | All children |
| `TV-Y7` | Directed to older children |
| `TV-G` | General audience |
| `TV-PG` | Parental guidance suggested |
| `TV-14` | Parents strongly cautioned |
| `TV-MA` | Mature audiences only |

### Content Advisories

- Violence, Language, Sexual content
- Drug use, Smoking, Horror themes
- Flashing lights

### Release Information

```json
{
  "releaseDate": "2024-02-15",
  "premiereDate": "2024-02-14T20:00:00Z",
  "year": 2024,
  "country": "ET",
  "region": "africa",
  "productionCompany": "Waliin Studio Productions"
}
```

### Series Information (for episodes)

```json
{
  "seriesId": "series-001",
  "seriesTitle": "Echoes of Addis",
  "seasonNumber": 1,
  "episodeNumber": 3,
  "totalSeasons": 2,
  "totalEpisodes": 24
}
```

## Cast and Crew

### Cast

```json
{
  "personId": "person-actor-001",
  "name": "Meron Getnet",
  "role": "Lead Actor",
  "character": "Selam",
  "profileImage": "https://cdn.../cast/meron.jpg",
  "featured": true,
  "sortOrder": 1
}
```

### Crew Roles

| Role | Description |
|------|-------------|
| `director` | Film director |
| `writer` | Screenwriter |
| `producer` | Producer |
| `executive_producer` | Executive producer |
| `cinematographer` | Director of photography |
| `editor` | Film editor |
| `composer` | Music composer |
| `costume_designer` | Costume designer |
| `production_designer` | Production designer |

### Personas (SL18 AI Personas)

```json
{
  "personaId": "persona-narrator-001",
  "name": "Storyteller Abebe",
  "description": "Traditional Ethiopian storyteller",
  "voiceArtist": "Dawit Wolde",
  "characteristics": ["warm", "wise", "poetic"]
}
```

## Media Assets

| Asset | Description |
|-------|-------------|
| `posterUrl` | Primary poster (portrait) |
| `posterVerticalUrl` | Vertical poster |
| `backdropUrl` | Landscape backdrop |
| `logoUrl` | Title treatment/logo |
| `trailerUrl` | Full trailer |
| `teaserUrl` | Short teaser |
| `thumbnails` | Scene thumbnails |
| `gallery` | Still images |

## Localization

### Subtitle Types

| Type | Description |
|------|-------------|
| `full` | Complete subtitles |
| `forced` | Forced narrative only |
| `sdh` | Subtitles for deaf/hard-of-hearing |
| `cc` | Closed captions |

### Dubbed Audio Types

| Type | Description |
|------|-------------|
| `full_dub` | Complete dubbing |
| `voice_over` | Voice-over narration |

### Audio Descriptions

For visually impaired audiences, describing visual elements.

## Engagement Metrics

### Core Metrics

| Metric | Description |
|--------|-------------|
| `viewCount` | Total views |
| `uniqueViewers` | Unique viewer count |
| `likes` | Like count |
| `shares` | Share count |
| `comments` | Comment count |
| `averageRating` | 0-10 rating |
| `completionRate` | % who finished |

### Retention Curve

Audience retention data points:

```json
{
  "retentionCurve": [
    { "timestamp": 0, "retention": 100 },
    { "timestamp": 300, "retention": 95 },
    { "timestamp": 900, "retention": 88 }
  ]
}
```

### Peak Moments

```json
{
  "peakMoments": [
    { "timestamp": 1200, "type": "rewatch", "count": 5400 },
    { "timestamp": 2400, "type": "share", "count": 3200 }
  ]
}
```

Peak moment types: `rewatch`, `share`, `screenshot`, `pause`

### Trending Status

```json
{
  "trending": {
    "isTrending": true,
    "rank": 3,
    "category": "drama",
    "region": "africa"
  }
}
```

## Monetization

### Access Models

| Model | Description |
|-------|-------------|
| `free` | Free to watch |
| `ad_supported` | Free with ads (AVOD) |
| `subscription` | Subscription required (SVOD) |
| `tvod` | Transactional rental |
| `est` | Electronic sell-through (purchase) |
| `premium` | Premium tier only |
| `exclusive` | Platform exclusive |

### Subscription Tiers

| Tier | Description |
|------|-------------|
| `free` | Free tier |
| `basic` | Basic subscription |
| `standard` | Standard subscription |
| `premium` | Premium subscription |
| `vip` | VIP subscription |

### Transactional Pricing

```json
{
  "transactionalPrice": {
    "rentPrice": 2.99,
    "buyPrice": 9.99,
    "currency": "USD",
    "rentalPeriod": 48
  }
}
```

### Promotions

| Type | Description |
|------|-------------|
| `free_trial` | Free trial period |
| `discount` | Percentage discount |
| `bundle` | Bundle pricing |
| `early_access` | Early access offer |

### Geo-Restrictions

```json
{
  "geoRestrictions": {
    "allowedCountries": ["ET", "KE", "TZ", "US"],
    "blockedCountries": [],
    "licensingWindows": [
      {
        "region": "africa",
        "startDate": "2024-02-15",
        "endDate": "2025-02-15"
      }
    ]
  }
}
```

## Recommendations

### Types

| Type | Description |
|------|-------------|
| `similarContent` | Similar by genre/theme |
| `becauseYouWatched` | Based on watch history |
| `fromSameCreator` | Same director/writer |
| `nextInSeries` | Next episode |
| `relatedPersonas` | Related persona content |

## Player Configuration

### Skip Features

```json
{
  "skipIntro": {
    "enabled": true,
    "startTime": 0,
    "endTime": 30
  },
  "skipCredits": {
    "enabled": true,
    "startTime": 3480
  }
}
```

### Chapters

```json
{
  "chapters": [
    {
      "title": "Introduction",
      "startTime": 0,
      "thumbnail": "https://cdn.../chapter-1.jpg"
    }
  ]
}
```

### Quality Options

- Auto, 4K, 1080p, 720p, 480p

## Social Features

### Available Features

| Feature | Description |
|---------|-------------|
| `commentsEnabled` | Comment section |
| `ratingsEnabled` | User ratings |
| `sharingEnabled` | Social sharing |
| `watchPartyEnabled` | Watch together |

### Social Sharing Platforms

- Twitter, Facebook, WhatsApp
- Telegram, Copy Link

### Reviews

```json
{
  "reviews": {
    "enabled": true,
    "requireVerifiedWatch": true,
    "moderationEnabled": true
  }
}
```

## Content Status

### Status Options

| Status | Description |
|--------|-------------|
| `draft` | In development |
| `scheduled` | Scheduled for release |
| `published` | Live and available |
| `hidden` | Hidden from browse |
| `archived` | Archived |

### QC Status

| Status | Description |
|--------|-------------|
| `pending` | Awaiting QC |
| `approved` | QC passed |
| `rejected` | QC failed |
| `requires_changes` | Needs revision |

## Integration Points

- **Phase 15**: Language packs for localization
- **Phase 17**: Personalization for recommendations
- **Phase 20**: Audience insights for metrics
- **Phase 25**: Governance for compliance
- **Phase 28**: Media pipeline for streaming
