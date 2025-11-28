# Campaign Calendar

## Overview

The Campaign Calendar module provides comprehensive campaign planning, scheduling, content pipeline management, and milestone tracking for Waliin Studio's global social media presence. This is designed to be directly usable by the Waliin CEO when preparing for launch.

## Schema

**File:** `schemas/campaign_calendar.schema.json`

## CEO Launch Preparation Guide

### Quick Start for Launch

1. **Review Launch Phases** - Ensure all phases are configured
2. **Set Key Milestones** - Define measurable targets
3. **Plan Campaigns** - Schedule awareness, engagement, and conversion campaigns
4. **Assign Team** - Ensure all roles are filled
5. **Configure Premieres** - Schedule content releases
6. **Enable Notifications** - Stay informed of progress

## Features

### Launch Phases

Pre-configured phases for CEO launch preparation:

#### 1. Pre-Launch Phase
- **Objectives:** Build anticipation, grow initial audience, establish brand presence
- **Key Activities:**
  - Platform account setup
  - Initial content creation
  - Teaser releases
  - Community building
- **Target KPIs:** Followers, initial engagement

#### 2. Soft Launch Phase
- **Objectives:** Test systems, gather feedback, refine content
- **Key Activities:**
  - Limited content release
  - Beta audience engagement
  - Analytics validation
  - Workflow testing
- **Target KPIs:** Engagement rate, system stability

#### 3. Launch Phase
- **Objectives:** Maximum awareness, rapid growth, conversion activation
- **Key Activities:**
  - Full content release
  - Cross-platform promotion
  - Influencer partnerships
  - Press coverage
- **Target KPIs:** Reach, subscribers, initial revenue

#### 4. Growth Phase
- **Objectives:** Sustain momentum, optimize performance, expand reach
- **Key Activities:**
  - Content cadence optimization
  - A/B testing
  - Regional expansion
  - Partnership development
- **Target KPIs:** Subscriber growth, revenue growth, retention

#### 5. Scaling Phase
- **Objectives:** Scale operations, diversify content, maximize revenue
- **Key Activities:**
  - Additional content verticals
  - New market entry
  - Team expansion
  - Infrastructure scaling
- **Target KPIs:** Multi-market KPIs, operational efficiency

### Campaign Types

| Campaign Type | Purpose | Typical Duration |
|--------------|---------|------------------|
| **launch** | Platform/product launch | 2-4 weeks |
| **premiere** | Content release promotion | 1-2 weeks |
| **awareness** | Brand awareness building | Ongoing |
| **engagement** | Community engagement | Ongoing |
| **conversion** | Subscriber/customer acquisition | 1-4 weeks |
| **seasonal** | Holiday/event content | 1-2 weeks |
| **promotional** | Special offers | 1 week |
| **partnership** | Brand collaboration | 2-4 weeks |
| **community** | Community building | Ongoing |
| **milestone** | Achievement celebration | 1-3 days |

### Campaign Structure

```json
{
  "campaignId": "launch-2024-q1",
  "name": "Waliin Studio Grand Launch",
  "type": "launch",
  "status": "scheduled",
  "startDate": "2024-03-01T00:00:00Z",
  "endDate": "2024-03-31T23:59:59Z",
  "platforms": ["youtube", "facebook", "instagram", "tiktok", "waliin_native"],
  "objectives": [
    { "metric": "reach", "target": 1000000 },
    { "metric": "followers", "target": 50000 },
    { "metric": "subscribers", "target": 5000 },
    { "metric": "revenue", "target": 10000 }
  ],
  "budget": {
    "total": 50000,
    "currency": "USD",
    "allocated": {
      "content_production": 20000,
      "paid_promotion": 20000,
      "influencer": 8000,
      "tools": 2000
    }
  }
}
```

### Content Cadence

#### Weekly Targets by Platform

| Platform | Shorts/Reels | Long-form | Stories | Community | Live |
|----------|-------------|-----------|---------|-----------|------|
| **YouTube** | 5 | 2 | - | 3 | Monthly |
| **Facebook** | 3 | - | 7 | 5 | Weekly |
| **Instagram** | 5 | - | 14 | - | Monthly |
| **TikTok** | 7 | - | - | - | Weekly |

#### Content Mix (Recommended)
- **Entertainment:** 40%
- **Educational:** 20%
- **Promotional:** 20%
- **Community:** 10%
- **Behind-the-scenes:** 10%

#### Optimal Posting Times (East Africa Timezone)
| Platform | Best Days | Best Times (EAT) |
|----------|-----------|------------------|
| **YouTube** | Tue, Thu, Sat | 6pm, 8pm |
| **Facebook** | Wed, Fri, Sat | 1pm, 7pm |
| **Instagram** | Mon, Wed, Fri | 11am, 7pm, 9pm |
| **TikTok** | Daily | 7pm, 9pm, 10pm |

### Milestones

#### Milestone Types
- **follower_milestone:** Total followers across platforms
- **subscriber_milestone:** Waliin Studio subscribers
- **view_milestone:** Total video views
- **revenue_milestone:** Revenue targets
- **content_milestone:** Content production targets
- **launch_milestone:** Launch phase completion
- **partnership_milestone:** Partner agreements
- **award_milestone:** Recognition achievements

#### Celebration Plans
Configurable celebration for each milestone:
- Cross-platform celebration content
- Community engagement activities
- Press release option
- Thank you content

### Premiere Calendar

Structure for content premieres:

```json
{
  "premiereId": "premiere-drama-001",
  "contentTitle": "Seeds of Tomorrow",
  "contentType": "series",
  "premiereDate": "2024-03-15T18:00:00Z",
  "platform": "waliin_native",
  "promotionPlan": {
    "teaserReleaseDate": "2024-02-15",
    "trailerReleaseDate": "2024-03-01",
    "countdownStart": "2024-03-08",
    "socialBlitz": [
      {
        "platform": "youtube",
        "contentTypes": ["short", "trailer"],
        "frequency": "daily",
        "startDate": "2024-03-08",
        "endDate": "2024-03-15"
      }
    ],
    "liveEvents": [
      {
        "eventType": "premiere_watch_party",
        "platform": "youtube",
        "date": "2024-03-15T18:00:00Z"
      }
    ]
  }
}
```

### Special Events

Track and plan content for:
- **Holidays:** Regional and international
- **Cultural Events:** Local celebrations
- **Industry Events:** Film festivals, awards
- **Company Anniversaries:** Milestones
- **Partnership Launches:** Brand collaborations
- **Community Events:** Fan meetups, Q&As

### Approval Workflow

Default 3-stage approval:

1. **Content Review** (24h SLA)
   - Approvers: content_manager
   - Check: Quality, brand alignment

2. **Cultural Review** (24h SLA)
   - Approvers: cultural_reviewer
   - Check: Phase 25 cultural sensitivity

3. **Final Approval** (12h SLA)
   - Approvers: social_media_manager, ceo
   - Check: Final sign-off

### Team Assignments

#### Required Roles for Launch
| Role | Responsibility |
|------|---------------|
| **CEO** | Strategic oversight, final approvals |
| **Marketing Lead** | Campaign strategy, budget |
| **Social Media Manager** | Day-to-day operations, publishing |
| **Content Manager** | Content quality, pipeline |
| **Content Creator** | Content production |
| **Video Editor** | Video post-production |
| **Designer** | Graphics, thumbnails |
| **Copywriter** | Captions, copy |
| **Community Manager** | Engagement, responses |
| **Analyst** | Performance tracking |
| **Cultural Reviewer** | Cultural sensitivity |

### Notifications

#### Trigger Events
- `content_scheduled` - Content scheduled for publishing
- `content_published` - Content successfully published
- `approval_needed` - Content awaiting approval
- `approval_complete` - Approval granted
- `milestone_approaching` - Milestone target near
- `milestone_achieved` - Milestone reached
- `campaign_starting` - Campaign about to begin
- `campaign_ending` - Campaign ending soon
- `premiere_reminder` - Premiere date approaching
- `deadline_approaching` - Content deadline near
- `deadline_missed` - Deadline exceeded

### Integrations

#### Airtable
- Content calendar sync
- Campaign tracking
- Milestone management

#### Slack
- Real-time notifications
- Approval workflows
- Team coordination

#### Google Calendar
- Event synchronization
- Team scheduling

## Example Calendar Configuration

```json
{
  "calendarId": "calendar-waliin-2024",
  "version": "1.0.0",
  "calendarSettings": {
    "name": "Waliin Studio Global Campaign Calendar",
    "timezone": "Africa/Addis_Ababa",
    "startDate": "2024-01-01"
  },
  "launchPhases": [
    {
      "phaseId": "phase-prelaunch",
      "phaseName": "pre_launch",
      "startDate": "2024-01-01",
      "endDate": "2024-02-28",
      "objectives": [
        "Build initial audience",
        "Create content backlog",
        "Test publishing workflows"
      ],
      "targetKPIs": {
        "followers": 10000,
        "reach": 100000
      },
      "status": "active"
    },
    {
      "phaseId": "phase-launch",
      "phaseName": "launch",
      "startDate": "2024-03-01",
      "endDate": "2024-03-31",
      "objectives": [
        "Maximum awareness",
        "Rapid growth",
        "Convert to subscribers"
      ],
      "targetKPIs": {
        "followers": 50000,
        "subscribers": 5000,
        "revenue": 10000
      },
      "status": "planning"
    }
  ],
  "contentCadence": {
    "weeklyTargets": {
      "youtube": { "shorts": 5, "longForm": 2, "communityPosts": 3 },
      "facebook": { "reels": 3, "posts": 5, "stories": 7 },
      "instagram": { "reels": 5, "posts": 3, "stories": 14, "carousels": 2 },
      "tiktok": { "videos": 7, "live": 1 }
    },
    "contentMix": {
      "entertainment": 40,
      "educational": 20,
      "promotional": 20,
      "community": 10,
      "behindScenes": 10
    }
  },
  "status": "active"
}
```

## Integration Points

- **Social Connectors:** `schemas/social_connectors.schema.json`
- **Social Analytics:** `schemas/social_analytics.schema.json`
- **YouTube Integration:** `schemas/youtube_integration.schema.json`
- **Phase 25 Governance:** Cultural review workflow
- **Airtable:** Content and campaign management

## Audit Events

- `calendar_created`
- `calendar_updated`
- `calendar_phase_started`
- `calendar_phase_completed`
- `campaign_created`
- `campaign_activated`
- `campaign_completed`
- `campaign_milestone_achieved`
- `calendar_premiere_scheduled`
- `calendar_premiere_completed`
- `calendar_notification_sent`
