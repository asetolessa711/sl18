# Waliin Studio Customer Management

This document describes the Waliin Studio customer profile system, managing accounts, subscriptions, watchlists, and personalization.

## Overview

The Customer system enables:
- **Profiles**: User accounts with preferences
- **Subscriptions**: Tier-based access with billing
- **Watchlists**: Save content for later
- **Watch History**: Track viewing progress
- **Downloads**: Offline viewing
- **Personalization**: AI-driven recommendations
- **Family Profiles**: Multiple profiles per account

## Schema: `waliin_customer.schema.json`

### Core Configuration

```json
{
  "customerId": "customer-waliin-001",
  "version": "1.0.0",
  "profile": {
    "displayName": "Abebe K.",
    "email": "abebe.k@example.com",
    "preferredLanguage": "am"
  },
  "subscription": {
    "tier": "premium",
    "status": "active"
  }
}
```

## Customer Profile

### Basic Information

| Field | Description |
|-------|-------------|
| `displayName` | Display name (2-50 chars) |
| `email` | Email address |
| `phoneNumber` | Phone number |
| `avatarUrl` | Profile picture URL |
| `preferredLanguage` | UI language preference |
| `contentLanguages` | Preferred content languages |
| `subtitleLanguage` | Default subtitle language |
| `country` | Customer country |
| `region` | Customer region |
| `timezone` | Customer timezone |

### Content Preferences

| Field | Description |
|-------|-------------|
| `dateOfBirth` | For age-appropriate content |
| `maturityRating` | kids, teen, adult |

## Subscription

### Subscription Tiers

| Tier | Description |
|------|-------------|
| `free` | Free tier with ads |
| `basic` | Basic subscription |
| `standard` | Standard features |
| `premium` | Premium features |
| `vip` | VIP access |
| `family` | Family plan |

### Subscription Status

| Status | Description |
|--------|-------------|
| `active` | Currently active |
| `trial` | Free trial period |
| `expired` | Subscription expired |
| `cancelled` | User cancelled |
| `paused` | Temporarily paused |
| `pending` | Awaiting payment |

### Billing Cycles

| Cycle | Description |
|-------|-------------|
| `monthly` | Monthly billing |
| `quarterly` | Every 3 months |
| `yearly` | Annual billing |
| `lifetime` | One-time payment |

### Payment Methods

| Method | Description |
|--------|-------------|
| `credit_card` | Credit card |
| `debit_card` | Debit card |
| `paypal` | PayPal |
| `mobile_money` | Mobile money (M-Pesa, etc.) |
| `bank_transfer` | Bank transfer |
| `crypto` | Cryptocurrency |

### Subscription Features

| Feature | Description |
|---------|-------------|
| `ad_free` | No advertisements |
| `hd_streaming` | HD quality streaming |
| `4k_streaming` | 4K UHD streaming |
| `downloads` | Offline downloads |
| `simultaneous_streams` | Multiple devices |
| `family_profiles` | Multiple profiles |
| `early_access` | Early content access |
| `exclusive_content` | Exclusive content |

## Watchlist

### Watchlist Item

```json
{
  "contentId": "content-movie-002",
  "contentType": "movie",
  "title": "Mountains of Gold",
  "posterUrl": "https://cdn.../poster.jpg",
  "addedAt": "2024-02-20T14:30:00Z",
  "priority": "high",
  "notifyOnRelease": true
}
```

### Priority Levels

| Priority | Description |
|----------|-------------|
| `high` | Watch soon |
| `normal` | Standard priority |
| `low` | Maybe later |

## Favorites

### Favorite Types

- **Content**: Favorite movies/shows
- **Personas**: Favorite AI personas
- **Genres**: Preferred genres
- **Creators**: Favorite directors/writers

## Watch History

### History Item

```json
{
  "contentId": "content-drama-001",
  "contentType": "short_drama",
  "title": "The Coffee Merchant",
  "watchedAt": "2024-02-28T20:00:00Z",
  "progress": {
    "percentage": 100,
    "position": 3600,
    "duration": 3600,
    "completed": true
  },
  "device": "smart_tv",
  "quality": "4k"
}
```

### Series Progress

```json
{
  "seriesProgress": {
    "seriesId": "series-001",
    "currentSeason": 1,
    "currentEpisode": 3,
    "episodesWatched": 3,
    "totalEpisodes": 12
  }
}
```

### Continue Watching

```json
{
  "continueWatching": [
    {
      "contentId": "content-series-001",
      "title": "Echoes of Addis",
      "progress": 65,
      "position": 1560,
      "lastWatchedAt": "2024-02-27T21:30:00Z"
    }
  ]
}
```

## Downloads

### Download Item

```json
{
  "contentId": "content-drama-001",
  "title": "The Coffee Merchant",
  "downloadedAt": "2024-02-20T08:00:00Z",
  "expiresAt": "2024-03-20T08:00:00Z",
  "quality": "hd",
  "fileSize": 1500,
  "device": "mobile",
  "status": "completed"
}
```

### Download Quality

| Quality | Description |
|---------|-------------|
| `sd` | Standard definition |
| `hd` | High definition (720p) |
| `fhd` | Full HD (1080p) |

### Download Status

| Status | Description |
|--------|-------------|
| `downloading` | In progress |
| `completed` | Download finished |
| `expired` | License expired |
| `error` | Download failed |

## Personalization

### Recommendation Settings

```json
{
  "recommendations": {
    "enabled": true,
    "algorithm": "hybrid",
    "excludeGenres": ["horror"],
    "excludeRatings": ["NC-17"],
    "preferNewReleases": true,
    "preferLocalContent": true
  }
}
```

### Algorithm Types

| Algorithm | Description |
|-----------|-------------|
| `collaborative` | Based on similar users |
| `content_based` | Based on content features |
| `hybrid` | Combination approach |

### Genre Affinities

```json
{
  "genreAffinities": [
    {
      "genre": "drama",
      "affinity": 0.95,
      "watchCount": 25,
      "completionRate": 88
    }
  ]
}
```

### Persona Affinities

```json
{
  "personaAffinities": [
    {
      "personaId": "persona-narrator-001",
      "affinity": 0.92,
      "interactions": 45
    }
  ]
}
```

### Watching Patterns

```json
{
  "watchingPatterns": {
    "preferredDays": ["friday", "saturday", "sunday"],
    "preferredHours": [19, 20, 21, 22],
    "bingeWatcher": true,
    "averageSessionLength": 90
  }
}
```

## Notifications

### Email Notifications

| Type | Description |
|------|-------------|
| `newReleases` | New content alerts |
| `watchlistReminders` | Watchlist updates |
| `recommendations` | Personalized suggestions |
| `accountUpdates` | Account changes |
| `promotions` | Marketing emails |

### Push Notifications

| Type | Description |
|------|-------------|
| `newEpisodes` | New episode alerts |
| `premieres` | Premiere notifications |
| `continueWatching` | Resume reminders |
| `socialActivity` | Social interactions |

## Devices

### Device Types

| Type | Description |
|------|-------------|
| `mobile` | Smartphone |
| `tablet` | Tablet device |
| `desktop` | Desktop/laptop |
| `smart_tv` | Smart TV |
| `streaming_device` | Roku, Fire TV, etc. |
| `gaming_console` | PlayStation, Xbox |

### Platforms

- iOS, Android, Web
- Roku, Fire TV, Apple TV, Android TV
- Samsung TV, LG TV
- PlayStation, Xbox

### Device Registration

```json
{
  "deviceId": "device-001",
  "deviceName": "Samsung TV",
  "deviceType": "smart_tv",
  "platform": "samsung_tv",
  "lastActive": "2024-02-28T22:00:00Z",
  "downloadEnabled": false
}
```

## Family Profiles

### Profile Configuration

```json
{
  "familyProfiles": {
    "enabled": true,
    "profiles": [
      {
        "profileId": "profile-main",
        "name": "Abebe",
        "isKids": false,
        "maturityRating": "adult",
        "preferredLanguage": "am"
      },
      {
        "profileId": "profile-kids",
        "name": "Kidist",
        "isKids": true,
        "maturityRating": "kids",
        "pin": "1234"
      }
    ]
  }
}
```

### Profile Limits

- Maximum 6 profiles per account
- Kids profiles have restricted content
- PIN protection for non-kids profiles

## Privacy Settings

### Privacy Options

| Setting | Description |
|---------|-------------|
| `dataCollection` | Allow data collection |
| `personalizedAds` | Show personalized ads |
| `watchHistoryShared` | Share watch history |
| `socialActivity` | Show social activity |
| `analyticsOptIn` | Participate in analytics |
| `gdprConsent` | GDPR consent given |

### Data Rights

| Action | Description |
|--------|-------------|
| `dataExportRequested` | Request data export |
| `deletionRequested` | Request account deletion |

## Account Status

### Status Options

| Status | Description |
|--------|-------------|
| `active` | Account active |
| `suspended` | Temporarily suspended |
| `deleted` | Account deleted |
| `pending_verification` | Awaiting verification |

### Verification Status

| Status | Description |
|--------|-------------|
| `unverified` | Not verified |
| `email_verified` | Email verified |
| `phone_verified` | Phone verified |
| `fully_verified` | Fully verified |

## Integration Points

- **Phase 17**: Personalization engine
- **Phase 20**: Audience insights
- **Phase 24**: Partner ecosystem (SSO)
- **Phase 25**: Payment compliance (KYC)
- **Phase 26**: Security (authentication)
