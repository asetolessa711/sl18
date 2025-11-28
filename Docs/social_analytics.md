# Social Analytics

## Overview

The Social Analytics module provides cross-platform metrics ingestion, dashboards, funnel tracking, and reporting for Waliin Studio's social media presence.

## Schema

**File:** `schemas/social_analytics.schema.json`

## Features

### Metrics Collection

#### YouTube Metrics
- **Discovery:** impressions, ctr, views, unique_viewers, watch_time, subscriber_gained, subscriber_lost
- **Engagement:** average_view_duration, average_percentage_viewed, likes, dislikes, comments, shares, saves
- **Monetization:** estimated_revenue, rpm, cpm, ad_impressions, monetized_playbacks, membership_revenue, super_chat_revenue
- **Funnel:** card_clicks, end_screen_clicks, annotations_clicks

#### Facebook Metrics
- **Page:** page_fans, page_fan_adds, page_fan_removes, page_impressions, page_reach
- **Content:** post_impressions, post_reach, post_engagements, post_reactions, post_comments, post_shares
- **Video:** page_video_views, page_video_view_time
- **Revenue:** ad_break_earnings, fan_subscription_revenue, stars_revenue

#### Instagram Metrics
- **Profile:** followers_count, follows_count, media_count, profile_views, website_clicks
- **Content:** impressions, reach, engagement, saved, video_views
- **Reels:** reel_plays, reel_comments, reel_likes, reel_shares, reel_saves
- **Stories:** story_impressions, story_reach, story_replies, story_taps_forward, story_exits

#### TikTok Metrics
- **Profile:** followers_count, following_count, likes_count, video_count, profile_views
- **Video:** video_views, comments, shares, favorites, average_watch_time, full_video_watched
- **Revenue:** creator_fund_earnings, live_gift_earnings, tips_earnings

#### Waliin Native Metrics
- **Users:** active_users, new_signups, subscribers, trials_started, trials_converted
- **Content:** views, watch_time, completion_rate, downloads
- **Revenue:** subscription_revenue, tvod_revenue, avod_revenue, download_revenue, mrr, arr, arpu, ltv

### Cross-Platform KPIs

#### Reach
- Total reach across all platforms
- Unique reach (deduplicated)
- Reach by platform breakdown
- Reach growth percentage

#### Engagement
- Total engagements
- Engagement rate calculation
- Engagement by platform
- Top engaging content identification

#### Audience
- Total followers across platforms
- Follower growth tracking
- Demographic breakdown:
  - Age groups (13-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+)
  - Gender split
  - Top countries

#### Conversions
- Total conversions tracked
- Conversion rate calculation
- Conversions by source platform
- Conversion types: signups, trials, subscriptions, TVOD purchases, downloads
- Conversion value tracking

#### Revenue
- Total revenue across platforms
- Revenue by platform
- Revenue by type: ads, subscriptions, transactions, tips/gifts, brand deals
- Revenue growth percentage

### Funnel Tracking

#### UTM Tracking
- Automatic UTM parameter generation
- Source tracking: youtube, facebook, instagram, tiktok
- Medium tracking: video, short, story, post, bio

#### Funnel Stages
1. **Awareness:** impressions, reach, views (YouTube, TikTok, Instagram)
2. **Interest:** engagement, follows, saves (YouTube, Facebook, Instagram)
3. **Consideration:** link_clicks, site_visits, video_completions (YouTube, Waliin)
4. **Intent:** signups, trial_starts, cart_adds (Waliin)
5. **Purchase:** subscriptions, transactions, revenue (Waliin)
6. **Retention:** retention_rate, repeat_purchases, ltv (Waliin)

#### Attribution Models
- **Last Click:** Credit to last touchpoint
- **First Click:** Credit to first touchpoint
- **Linear:** Equal credit distribution
- **Time Decay:** More recent = more credit
- **Position Based:** 40/20/40 split
- **Data Driven:** ML-based attribution

### Regional Insights

- Top performing regions
- RPM by region (YouTube, Facebook)
- ARPU by region (Waliin)
- Dominant platform by region
- Regional pricing alignment with SL18 Phase 32

### Content Performance

#### Top Performing Content
- Cross-platform view aggregation
- Engagement rate ranking
- Revenue attribution
- Conversion tracking

#### Content Type Performance
| Content Type | Avg Views | Avg Engagement | Avg Conversions |
|--------------|-----------|----------------|-----------------|
| short | - | - | - |
| teaser | - | - | - |
| trailer | - | - | - |
| highlight | - | - | - |
| full_episode | - | - | - |
| behind_scenes | - | - | - |
| poll | - | - | - |
| announcement | - | - | - |

#### Viral Content Detection
- Viral score calculation
- Peak views tracking
- Share rate analysis

### Dashboards

#### Overview Dashboard
- **Widgets:** total_reach, total_engagement, total_followers, total_revenue
- **Trends:** reach_trend, engagement_trend, follower_trend, revenue_trend
- **Breakdown:** platform_breakdown, top_content, recent_posts, alerts
- **Refresh:** Every 15 minutes

#### Platform Dashboards
- YouTube-specific metrics and charts
- Facebook-specific metrics and charts
- Instagram-specific metrics and charts
- TikTok-specific metrics and charts

#### Funnel Dashboard
- Funnel visualization
- Conversion rates by stage
- Attribution analysis
- Source breakdown
- Conversion value tracking

#### Campaign Dashboard
- Active campaigns overview
- Campaign performance metrics
- Milestone tracker
- Calendar view
- Budget tracker

### Alerting

#### Alert Types
- **Performance:** reach_spike, reach_drop, engagement_spike, engagement_drop
- **Milestones:** follower_milestone, revenue_milestone
- **Content:** viral_content, negative_sentiment
- **Compliance:** copyright_claim, policy_violation
- **Funnel:** conversion_drop, funnel_bottleneck
- **Campaign:** campaign_milestone

#### Notification Channels
- Email
- Slack
- Push notifications
- SMS
- Operator console

### Reporting

#### Scheduled Reports
- **Daily:** Quick performance summary
- **Weekly:** Detailed platform breakdown
- **Monthly:** Full analytics review
- **Quarterly:** Strategic analysis

#### Executive Report
- Highlights: total_reach, engagement_rate, conversions, revenue
- Top content summary
- AI-generated recommendations
- Format: PDF, XLSX

#### Export Formats
- PDF
- XLSX
- CSV
- JSON
- Google Sheets integration

## Example Configuration

```json
{
  "analyticsId": "analytics-social-waliin-main",
  "version": "1.0.0",
  "connectorRef": "social-waliin-studio-main",
  "metricsCollection": {
    "enabled": true,
    "syncIntervalMinutes": 60,
    "platforms": {
      "youtube": {
        "enabled": true,
        "metrics": ["views", "watch_time", "subscribers", "estimated_revenue", "card_clicks"]
      },
      "facebook": {
        "enabled": true,
        "metrics": ["page_fans", "post_engagements", "page_video_views"]
      },
      "instagram": {
        "enabled": true,
        "metrics": ["followers_count", "reel_plays", "story_reach"]
      },
      "tiktok": {
        "enabled": true,
        "metrics": ["followers_count", "video_views", "shares"]
      },
      "waliinNative": {
        "enabled": true,
        "metrics": ["subscribers", "mrr", "arpu", "churn_rate"]
      }
    }
  },
  "funnelTracking": {
    "enabled": true,
    "attributionModel": "last_click",
    "attributionWindow": {
      "clickWindowDays": 30,
      "viewWindowDays": 7
    }
  },
  "dashboards": {
    "overviewDashboard": {
      "enabled": true,
      "refreshIntervalMinutes": 15
    }
  },
  "alerting": {
    "enabled": true,
    "alertTypes": [
      {
        "type": "follower_milestone",
        "enabled": true,
        "notificationChannels": ["slack", "email"]
      }
    ]
  },
  "status": "active"
}
```

## Integration Points

- **Social Connectors:** `schemas/social_connectors.schema.json`
- **Campaign Calendar:** `schemas/campaign_calendar.schema.json`
- **Phase 20 Audience Insights:** Data alignment
- **Phase 32 Monetization:** Revenue reconciliation
- **SL18 Regional Pricing:** Geographic alignment

## Audit Events

- `social_analytics_synced`
- `social_analytics_exported`
- `social_report_generated`
- `social_alert_triggered`
- `social_alert_resolved`
- `social_dashboard_viewed`
- `social_conversion_tracked`
- `social_funnel_click_tracked`
