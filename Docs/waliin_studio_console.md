# Waliin Studio Operator Console

This document describes the Waliin Studio operator/contributor console, providing tools for content upload, QC workflows, analytics, and distribution management.

## Overview

The Studio Console enables:
- **Upload Pipeline**: Content ingestion with wizards
- **QC Workflow**: Multi-stage quality control
- **Content Management**: Library, scheduling, versioning
- **Localization**: Subtitles, dubbing, translation
- **Analytics**: Dashboards and reporting
- **Monetization**: Pricing and revenue tracking
- **Distribution**: Channel management and geo-restrictions

## Schema: `waliin_studio_console.schema.json`

### Core Configuration

```json
{
  "consoleId": "console-waliin-operator",
  "version": "1.0.0",
  "name": "Waliin Studio Operator Console",
  "operatorContext": {
    "operatorId": "operator-content-001",
    "role": "content_manager",
    "permissions": ["upload_content", "review_qc", "view_analytics"]
  }
}
```

## Operator Context

### Operator Roles

| Role | Description |
|------|-------------|
| `studio_admin` | Full studio access |
| `content_manager` | Content operations |
| `qc_reviewer` | Quality control |
| `analytics_viewer` | Analytics only |
| `contributor` | External contributor |
| `partner` | Partner access |
| `franchise_owner` | Franchise management |

### Permissions

| Permission | Description |
|------------|-------------|
| `upload_content` | Upload new content |
| `review_qc` | Review QC submissions |
| `approve_content` | Approve for publishing |
| `publish_content` | Publish content |
| `view_analytics` | View analytics |
| `manage_users` | User management |
| `manage_monetization` | Pricing control |
| `manage_localization` | Localization control |
| `manage_distribution` | Distribution control |
| `admin_settings` | Admin access |

## Upload Pipeline

### Upload Methods

| Method | Description |
|--------|-------------|
| `direct_upload` | Browser upload |
| `s3_import` | Import from S3 |
| `url_import` | Import from URL |
| `cloud_storage` | Cloud storage import |
| `ftp_sftp` | FTP/SFTP transfer |

### Required Metadata

- Title, Synopsis, Genres, Rating
- Release date, Cast, Crew
- Poster, Backdrop, Trailer
- Subtitles, Audio tracks, Content warnings

### Auto Processing

| Process | Description |
|---------|-------------|
| `transcoding` | Video transcoding |
| `thumbnailGeneration` | Auto thumbnails |
| `trailerExtraction` | Extract trailer |
| `subtitleExtraction` | Extract subtitles |
| `qualityAnalysis` | Quality metrics |
| `contentDetection` | Content analysis |

### Content Wizard

Guided upload workflow:

1. **File Upload**: Upload video file
2. **Metadata Entry**: Add title, synopsis, etc.
3. **Cast & Crew**: Add cast/crew info
4. **Localization**: Add subtitles/audio
5. **Monetization**: Set pricing
6. **Preview**: Review before submit
7. **QC Submission**: Submit for review

### Validation Rules

```json
{
  "validation": {
    "videoQualityMinimum": "hd",
    "audioQualityMinimum": "stereo",
    "aspectRatios": ["16:9", "9:16", "1:1"],
    "durationMinimum": 60,
    "durationMaximum": 10800
  }
}
```

## QC Workflow

### QC Stages

| Stage | Description |
|-------|-------------|
| `technical_qc` | Technical quality check |
| `content_review` | Content appropriateness |
| `cultural_review` | Cultural sensitivity |
| `localization_qc` | Translation quality |
| `legal_compliance` | Legal review |
| `final_approval` | Final sign-off |

### Stage Configuration

```json
{
  "stageId": "stage-technical",
  "name": "Technical QC",
  "type": "technical_qc",
  "automated": true,
  "requiredApprovers": 0,
  "slaHours": 4,
  "escalationPath": ["qc-lead-001"],
  "checklistItems": [
    {
      "itemId": "check-video-quality",
      "label": "Video quality meets standards",
      "category": "video",
      "required": true
    }
  ]
}
```

### Automated QC Checks

| Check | Description |
|-------|-------------|
| `videoQuality` | Video quality analysis |
| `audioSync` | Audio synchronization |
| `subtitleSync` | Subtitle timing |
| `contentWarningDetection` | Content warnings |
| `duplicationCheck` | Duplicate detection |
| `copyrightScan` | Copyright check |
| `personaConsistency` | Persona consistency |
| `culturalSensitivity` | Cultural review |

### Review Queue

```json
{
  "reviewQueue": {
    "sortBy": "sla_deadline",
    "filters": ["content_type", "status", "priority"],
    "batchActions": true,
    "assignmentMode": "auto_expertise"
  }
}
```

### Assignment Modes

| Mode | Description |
|------|-------------|
| `manual` | Manual assignment |
| `auto_round_robin` | Round-robin auto |
| `auto_load_balance` | Load-balanced auto |
| `auto_expertise` | Expertise-based auto |

### Feedback Templates

Pre-defined feedback for common issues:

```json
{
  "templateId": "template-audio-issue",
  "name": "Audio Issue",
  "category": "audio",
  "message": "Audio quality does not meet standards.",
  "severity": "error"
}
```

## Content Management

### Content Library

```json
{
  "contentLibrary": {
    "viewModes": ["grid", "list", "table", "kanban"],
    "defaultView": "grid",
    "filters": ["status", "content_type", "genre", "rating"],
    "bulkActions": ["publish", "unpublish", "archive", "delete"]
  }
}
```

### View Modes

| Mode | Description |
|------|-------------|
| `grid` | Card grid view |
| `list` | List view |
| `table` | Data table view |
| `kanban` | Kanban board |

### Scheduling

| Feature | Description |
|---------|-------------|
| `calendarView` | Visual calendar |
| `releaseWindows` | Staggered releases |
| `premiereSupport` | Premiere events |
| `episodeScheduling` | Episode timing |
| `timezoneAware` | Timezone support |

### Version Control

| Feature | Description |
|---------|-------------|
| `trackChanges` | Change tracking |
| `rollback` | Version rollback |
| `compareVersions` | Version comparison |

## Localization Management

### Language Configuration

```json
{
  "languages": [
    { "code": "am", "name": "Amharic", "enabled": true, "primary": true },
    { "code": "en", "name": "English", "enabled": true, "primary": false },
    { "code": "sw", "name": "Kiswahili", "enabled": true, "primary": false }
  ]
}
```

### Subtitle Management

| Feature | Description |
|---------|-------------|
| `uploadFormats` | SRT, VTT, ASS, TTML |
| `autoGeneration` | AI subtitle generation |
| `aiTranslation` | AI translation |
| `qcRequired` | Require QC |
| `timingSync` | Auto timing sync |

### Dubbing Management

| Feature | Description |
|---------|-------------|
| `voiceSynthesis` | AI voice synthesis |
| `personaAlignment` | Match SL18 personas |
| `emotionPreservation` | Preserve emotions |
| `lipSyncSupport` | Lip sync |

### Metadata Localization

- Title translation
- Synopsis translation
- Tagline translation
- Keywords translation

## Analytics Dashboards

### Dashboard Types

| Type | Description |
|------|-------------|
| `overview` | Content overview |
| `content_performance` | Per-content metrics |
| `audience_insights` | Audience data |
| `revenue` | Revenue analytics |
| `engagement` | Engagement metrics |
| `retention` | Retention analysis |
| `geographic` | Geographic breakdown |
| `device_platform` | Device analytics |
| `qc_metrics` | QC performance |
| `upload_pipeline` | Upload metrics |

### Widget Types

| Type | Description |
|------|-------------|
| `kpi_card` | Single metric card |
| `line_chart` | Trend line chart |
| `bar_chart` | Bar chart |
| `pie_chart` | Pie chart |
| `table` | Data table |
| `map` | Geographic map |
| `funnel` | Funnel chart |
| `heatmap` | Heat map |
| `leaderboard` | Ranking list |

### Metrics

| Category | Examples |
|----------|----------|
| `views` | Total views, unique viewers |
| `engagement` | Engagement rate, completion |
| `revenue` | Total revenue, per-content |
| `retention` | Retention rate, churn |
| `quality` | QC pass rate |
| `performance` | Upload time, processing |

### Reporting

| Feature | Description |
|---------|-------------|
| `scheduledReports` | Automated reports |
| `customReports` | Custom report builder |
| `emailDelivery` | Email reports |
| `slackIntegration` | Slack notifications |

## Monetization Controls

### Access Models

| Model | Description |
|-------|-------------|
| `free` | Free content |
| `ad_supported` | AVOD |
| `subscription` | SVOD |
| `tvod` | Rental |
| `est` | Purchase |
| `premium` | Premium tier |

### Pricing Management

| Feature | Description |
|---------|-------------|
| `setContentPrice` | Set prices |
| `promotions` | Create promotions |
| `bundling` | Bundle content |
| `regionalPricing` | Regional prices |

### Revenue Tracking

| Feature | Description |
|---------|-------------|
| `realTimeRevenue` | Real-time updates |
| `revenueByContent` | Per-content revenue |
| `revenueByRegion` | Regional breakdown |
| `payoutTracking` | Payout status |

### Ad Management

| Feature | Description |
|---------|-------------|
| `adPlacements` | Pre-roll, mid-roll, post-roll |
| `adFrequency` | Ad frequency control |
| `adTargeting` | Audience targeting |

## Distribution Controls

### Distribution Channels

| Type | Description |
|------|-------------|
| `waliin_platform` | Waliin Studio platform |
| `partner_platform` | Partner platforms |
| `syndication` | Content syndication |
| `social_media` | Social platforms |
| `broadcast` | Traditional broadcast |

### Geo-Restrictions

```json
{
  "geoRestrictions": {
    "enabled": true,
    "defaultPolicy": "allow_all",
    "customRules": true
  }
}
```

### Release Windows

| Window | Description |
|--------|-------------|
| `theatrical` | Theatrical release |
| `premium_vod` | Premium VOD |
| `svod` | Subscription VOD |
| `avod` | Ad-supported VOD |
| `free` | Free release |

## Notifications

### Notification Channels

- In-app notifications
- Email notifications
- Slack integration
- Webhook notifications
- SMS (critical only)

### Event Types

| Event | Description |
|-------|-------------|
| `upload_completed` | Upload finished |
| `qc_feedback` | QC feedback received |
| `content_published` | Content published |
| `analytics_alert` | Analytics threshold |

## Audit Trail

### Configuration

```json
{
  "auditTrail": {
    "enabled": true,
    "retentionDays": 365,
    "exportEnabled": true,
    "searchEnabled": true,
    "realTimeView": true
  }
}
```

### Tracked Actions

- Content uploads
- QC decisions
- Publishing actions
- Configuration changes
- User access

## Integration Points

- **Phase 18**: Contributor marketplace
- **Phase 19**: Distribution channels
- **Phase 20**: Audience insights
- **Phase 25**: Governance compliance
- **Phase 28**: Media rendering pipeline
