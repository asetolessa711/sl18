# Social Media Connectors

## Overview

The Social Connectors module provides a unified interface for managing Waliin Studio's presence across multiple social media platforms. This includes YouTube, Facebook, Instagram, TikTok, and the native Waliin platform.

## Schema

**File:** `schemas/social_connectors.schema.json`

## Features

### Platform Accounts

#### YouTube
- **Purpose:** Shorts, trailers, full episodes, behind-the-scenes, live streams, community engagement
- **Content Types:** short, teaser, trailer, highlight, full_episode, behind_scenes, live_stream, community_post
- **Monetization:** ads, super_chat, super_thanks, memberships, shopping, brand_connect
- **Integration:** References `youtube_integration.schema.json` for detailed YouTube config

#### Facebook
- **Purpose:** Premieres, polls, discussions, reels, stories, events, live broadcasts
- **Content Types:** reel, story, post_image, post_video, poll, event, live_stream, premiere
- **Monetization:** ad_breaks, fan_subscriptions, branded_content, stars, shops
- **Features:** Page + Group management for community building

#### Instagram
- **Purpose:** Reels, stories, carousels, highlights, behind-the-scenes, live
- **Content Types:** reel, story, carousel, single_image, single_video, live, igtv
- **Monetization:** branded_content, affiliate_links, shops, badges, subscriptions
- **Features:** Business account integration for insights

#### TikTok
- **Purpose:** Trend challenges, highlights, duets, stitches, live, series
- **Content Types:** video, duet, stitch, live, photo_carousel, series
- **Monetization:** creator_fund, brand_partnerships, live_gifts, tips, series_subscriptions, shop
- **Features:** Trend participation and viral content strategies

#### Waliin Native
- **Purpose:** Showcase, streaming, polls, subscriptions, downloads, community
- **Content Types:** full_episode, series, movie, short_drama, exclusive, premiere
- **Monetization:** subscriptions, tvod, avod, pvod, est, downloads
- **Features:** Primary destination for premium content

### Unified Branding

```json
{
  "branding": {
    "studioName": "Waliin Studio",
    "tagline": "Together through stories",
    "primaryHashtags": ["#WaliinTogether", "#WaliinStudio", "#ShortDrama", "#PoweredBySL18"],
    "secondaryHashtags": ["#AfricanDrama", "#EthiopianDrama", "#OromoDrama", "#KenyanDrama"],
    "colorPalette": {
      "primary": "#FF6B35",
      "secondary": "#2E4057",
      "accent": "#FFD700"
    }
  }
}
```

### Interlinking Strategy

#### Bio Links
- Linktree integration for unified link management
- Primary destination: Waliin Native platform
- Cross-platform linking enabled

#### Cross-Platform Links
- YouTube → Waliin Studio premium tier
- Facebook → Waliin Studio
- Instagram → Waliin Studio
- TikTok → Waliin Studio
- Waliin → Social platforms for engagement

#### End Screens
- Primary CTA: Subscribe to Waliin Studio
- Secondary CTA: Watch more content
- Platform-specific configurations

#### Pinned Comments
- Template-based comments with Waliin links
- Premium tier CTA included
- Enabled on YouTube and Facebook

#### Community Sync
- Synchronized polls across platforms
- Coordinated announcements
- Teaser cross-posting

### Hashtag Strategy

#### Maximum Hashtags by Platform
| Platform | Max Hashtags |
|----------|-------------|
| YouTube | 15 |
| Instagram | 30 |
| TikTok | 5 |
| Facebook | 10 |

### Publishing Workflows

#### Cross-Post Rules
```json
{
  "crossPostRules": [
    {
      "sourceContent": "short",
      "sourcePlatform": "youtube",
      "targetPlatforms": ["instagram", "tiktok", "facebook"],
      "adaptFormat": true,
      "delayMinutes": 30
    }
  ]
}
```

#### Approval Workflow
1. Content created
2. Review by content_manager or social_media_manager
3. Cultural sensitivity check (Phase 25 integration)
4. Final approval
5. Scheduled/published

### Monetization

#### Platform Revenue Tracking
- **YouTube:** Ads, memberships, Super Chat, Super Thanks, shopping, brand deals
- **Facebook:** Ad breaks, fan subscriptions, branded content, stars, shops
- **Instagram:** Branded content, affiliate links, shops, badges, subscriptions
- **TikTok:** Creator fund, brand partnerships, live gifts, tips, series, shop
- **Waliin Native:** Subscriptions, TVOD, AVOD, download sales

#### Funnel Conversions
- Track conversions from each social platform to Waliin
- Conversion goals: subscription, tvod_purchase, signup, trial_start, download
- Attribution tracking enabled

### Governance

#### Cultural Sensitivity
- Phase 25 Governance integration enabled
- Cultural review required before publishing
- Blocked categories configurable

#### Content Guidelines
- Brand voice: inspirational
- Required disclosures: sponsored content, paid partnerships, affiliate links, AI-generated content

#### Copyright Compliance
- Content ID registration enabled
- Music and image licensing required
- Claim monitoring active

#### Access Control
- **Publishing roles:** social_media_manager, content_manager, marketing_lead, ceo
- **Approval roles:** social_media_manager, content_manager, marketing_lead, ceo
- **Analytics roles:** social_media_manager, content_manager, marketing_lead, ceo, analyst

## Example Configuration

```json
{
  "connectorId": "social-waliin-studio-main",
  "version": "1.0.0",
  "branding": {
    "studioName": "Waliin Studio",
    "tagline": "Together through stories",
    "primaryHashtags": ["#WaliinTogether", "#WaliinStudio"]
  },
  "platforms": {
    "youtube": {
      "enabled": true,
      "channelId": "UCxxxxxxxxxxxxxxxxxxxxxxx",
      "channelHandle": "@WaliinStudio",
      "purpose": ["shorts", "trailers", "full_episodes", "live_streams"]
    },
    "facebook": {
      "enabled": true,
      "pageId": "123456789",
      "pageName": "Waliin Studio",
      "groupId": "987654321",
      "groupName": "Waliin Studio Community"
    },
    "instagram": {
      "enabled": true,
      "accountHandle": "@waliinstudio",
      "purpose": ["reels", "stories", "carousels", "highlights"]
    },
    "tiktok": {
      "enabled": true,
      "accountHandle": "@waliinstudio",
      "purpose": ["trend_challenges", "highlights", "duets", "live"]
    },
    "waliinNative": {
      "enabled": true,
      "baseUrl": "https://waliin.studio",
      "premiumUrl": "https://waliin.studio/premium"
    }
  },
  "interlinking": {
    "enabled": true,
    "strategy": {
      "bioLinks": {
        "enabled": true,
        "primaryDestination": "waliin_native"
      },
      "crossPlatformLinks": {
        "youtubeToWaliin": true,
        "facebookToWaliin": true,
        "instagramToWaliin": true,
        "tiktokToWaliin": true
      }
    }
  },
  "status": "active"
}
```

## Integration Points

- **YouTube Integration:** `schemas/youtube_integration.schema.json`
- **Phase 25 Governance:** Cultural sensitivity filters
- **Phase 32 Monetization:** Revenue tracking alignment
- **Social Analytics:** `schemas/social_analytics.schema.json`
- **Campaign Calendar:** `schemas/campaign_calendar.schema.json`

## Audit Events

- `social_connector_created`
- `social_connector_updated`
- `social_platform_connected`
- `social_content_published`
- `social_content_cross_posted`
- `social_engagement_tracked`
- `social_follower_milestone`
- `social_viral_content_detected`
- `social_approval_requested`
- `social_approval_granted`
