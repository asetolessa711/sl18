# Global Distribution Guide

This document provides a comprehensive guide for configuring and managing global content distribution in SL18.

## Overview

SL18's distribution system enables content to be published across multiple platforms, regions, and formats. The system handles:

- **Multi-platform distribution** (YouTube, TikTok, Spotify, broadcasters, OTT)
- **Regional compliance** (localization, licensing, content restrictions)
- **Format adaptation** (video, audio, subtitles, captions)
- **Monetization integration** (ad-supported, subscription, transactional)
- **Analytics aggregation** (cross-platform performance tracking)

## Distribution Channels

### Channel Types

| Type | Description | Examples |
|------|-------------|----------|
| `streaming` | Video streaming platforms | YouTube, Netflix, Amazon Prime |
| `social_media` | Social media platforms | TikTok, Instagram, Facebook |
| `podcast` | Audio podcast platforms | Spotify, Apple Podcasts |
| `broadcast` | Traditional broadcasters | TV networks, radio stations |
| `ott` | Over-the-top services | Hulu, Disney+, Peacock |
| `syndication_network` | Syndication partners | News networks, content aggregators |

### Channel Configuration

```json
{
  "channelId": "channel-youtube-global",
  "name": "YouTube Global Distribution",
  "type": "streaming",
  "platform": {
    "name": "youtube",
    "apiVersion": "v3",
    "credentials": {
      "authType": "oauth2",
      "credentialRef": "vault://youtube/oauth-main",
      "scopes": ["youtube.upload", "youtube.readonly"]
    }
  },
  "status": "active"
}
```

### Supported Platforms

- **Video**: YouTube, TikTok, Instagram, Facebook, Netflix, Amazon Prime, Hulu, Disney+
- **Audio**: Spotify, Apple Podcasts, Google Podcasts
- **Custom**: API-based integrations for any platform

## Regional Distribution

### Geographic Compliance

Each region can have specific requirements:

```json
{
  "regions": [
    {
      "code": "KE",
      "name": "Kenya",
      "enabled": true,
      "compliance": ["local_broadcast_law"],
      "restrictions": []
    },
    {
      "code": "CN",
      "name": "China",
      "enabled": false,
      "restrictions": [
        {
          "type": "regulatory",
          "description": "Platform not available",
          "action": "block"
        }
      ]
    }
  ]
}
```

### Compliance Frameworks

- **GDPR** - EU data protection
- **CCPA** - California privacy
- **COPPA** - Children's privacy
- **LGPD** - Brazil data protection
- **Local broadcast laws** - Regional content regulations
- **Content rating boards** - Age ratings and classifications

### Restriction Actions

| Action | Description |
|--------|-------------|
| `block` | Prevent distribution to region |
| `modify` | Adapt content for region |
| `require_approval` | Manual review before distribution |
| `age_gate` | Apply age verification |

## Format Requirements

### Video Specifications

```json
{
  "video": {
    "supported": true,
    "codecs": ["h264", "h265", "vp9"],
    "resolutions": ["720p", "1080p", "4k"],
    "maxDuration": 43200,
    "aspectRatios": ["16:9", "9:16", "1:1"],
    "maxFileSizeMB": 256000
  }
}
```

### Platform-Specific Requirements

| Platform | Max Duration | Aspect Ratio | Max Size |
|----------|--------------|--------------|----------|
| YouTube | 12 hours | 16:9, 9:16, 1:1 | 256 GB |
| TikTok | 10 minutes | 9:16, 1:1 | 287 MB |
| Instagram | 60 minutes | 9:16, 1:1, 4:5 | 3.6 GB |
| Spotify | Unlimited | N/A (audio) | 200 MB |

### Subtitles and Captions

- **Formats**: SRT, VTT, ASS, DFXP, TTML
- **Burn-in**: Some platforms require burned-in subtitles
- **Closed Captions**: CEA-608, CEA-708, WebVTT

## Localization

### Language Support

SL18 supports multilingual distribution with:

- 13+ languages including African languages (Swahili, Amharic, Oromifa)
- RTL support for Arabic and Hebrew
- Translation QC validation
- Localized metadata (titles, descriptions, thumbnails)

### Localization Configuration

```json
{
  "localization": {
    "supportedLanguages": ["en", "es", "fr", "ar", "sw", "am"],
    "defaultLanguage": "en",
    "requiresLocalization": ["title", "description", "subtitles"],
    "translationQcRequired": true,
    "rtlSupport": true
  }
}
```

## Monetization

### Revenue Models

| Model | Description | Use Case |
|-------|-------------|----------|
| `ad_supported` | Revenue from advertisements | YouTube, TikTok |
| `subscription` | Paid subscription access | Netflix, Spotify Premium |
| `transactional` | Pay-per-view or purchase | iTunes, Amazon |
| `hybrid` | Combination of models | Hulu, Peacock |
| `licensed` | Licensing fee from platform | TV broadcasters |

### Revenue Share Configuration

```json
{
  "monetization": {
    "model": "ad_supported",
    "revenueShare": {
      "creatorPercentage": 55,
      "platformPercentage": 45,
      "franchisePercentage": 0
    },
    "minimumPayoutThreshold": 100,
    "payoutFrequency": "monthly"
  }
}
```

## Scheduling

### Publish Options

- **Immediate**: Publish as soon as content is ready
- **Scheduled**: Set specific date/time for publication
- **Windowed**: Optimal time slots for audience engagement

### Scheduling Configuration

```json
{
  "scheduling": {
    "immediatePublish": true,
    "scheduledPublish": true,
    "timezone": "Africa/Nairobi",
    "publishWindows": [
      {
        "dayOfWeek": "any",
        "startTime": "18:00",
        "endTime": "22:00"
      }
    ],
    "leadTimeHours": 1
  }
}
```

## Quality Control

### Pre-Distribution QC

Before content is distributed, the system validates:

1. **Technical Quality** - Resolution, encoding, audio levels
2. **Content Rating** - Age-appropriate classification
3. **Brand Safety** - Compliance with advertiser guidelines
4. **Copyright** - Rights verification
5. **Metadata Completeness** - Required fields populated

### QC Configuration

```json
{
  "qcRequirements": {
    "autoQc": true,
    "manualReviewRequired": false,
    "minimumQcScore": 85,
    "checks": [
      "technical_quality",
      "content_rating",
      "brand_safety",
      "copyright",
      "metadata_completeness"
    ]
  }
}
```

## Analytics

### Available Metrics

- **Views** - Total view count
- **Watch Time** - Total minutes watched
- **Engagement** - Likes, comments, shares
- **CTR** - Click-through rate
- **Retention** - Audience retention curves
- **Revenue** - Earnings per content

### Analytics Integration

```json
{
  "analytics": {
    "available": true,
    "metrics": ["views", "watch_time", "engagement", "revenue"],
    "reportingFrequency": "daily",
    "apiAccess": true
  }
}
```

## Workflow

### Distribution Process

1. **Content Preparation**
   - Encode content to required formats
   - Generate localized metadata
   - Create thumbnails and previews

2. **Pre-Flight Checks**
   - Run QC validation
   - Verify regional compliance
   - Check monetization eligibility

3. **Distribution**
   - Upload to target platforms
   - Set scheduling options
   - Configure monetization

4. **Post-Distribution**
   - Monitor upload status
   - Track analytics
   - Handle errors/retries

### Error Handling

| Error Type | Action |
|------------|--------|
| Upload Failed | Automatic retry (3 attempts) |
| Encoding Error | Re-encode and retry |
| Compliance Block | Flag for manual review |
| Rate Limited | Queue with backoff |

## Best Practices

### Content Optimization

1. **Create platform-specific edits** - 9:16 for TikTok, 16:9 for YouTube
2. **Optimize thumbnails** - High contrast, readable text
3. **Include captions** - Improve accessibility and engagement
4. **Test before bulk distribution** - Validate with single content first

### Regional Strategy

1. **Prioritize key markets** - Focus on high-engagement regions
2. **Respect local regulations** - Ensure compliance before launch
3. **Localize authentically** - Use native reviewers for translations
4. **Monitor regional performance** - Adjust strategy based on data

### Monetization Tips

1. **Enable all eligible formats** - Pre-roll, mid-roll, overlays
2. **Meet minimum requirements** - Duration, subscriber thresholds
3. **Track revenue by region** - Identify high-value markets
4. **Optimize for CPM** - Target premium advertiser categories

## API Reference

### Create Distribution Channel

```http
POST /api/v1/distribution/channels
Content-Type: application/json

{
  "name": "YouTube Africa",
  "type": "streaming",
  "platform": {
    "name": "youtube"
  },
  "regions": [
    { "code": "KE", "enabled": true }
  ]
}
```

### Start Distribution

```http
POST /api/v1/distribution/distribute
Content-Type: application/json

{
  "contentId": "EP-2025-156",
  "channelIds": ["channel-youtube-global", "channel-tiktok-africa"],
  "options": {
    "scheduled": false,
    "localize": true
  }
}
```

### Get Distribution Status

```http
GET /api/v1/distribution/status/{distributionId}
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Upload timeout | Increase chunk size, retry with backoff |
| Invalid format | Re-encode to platform requirements |
| Quota exceeded | Wait for quota reset, use multiple accounts |
| Region blocked | Check compliance, modify content |

### Support

For distribution issues, contact:
- **Technical Support**: distribution-support@sl18.io
- **Partner Relations**: partners@sl18.io
- **Compliance Questions**: compliance@sl18.io
