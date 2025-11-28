# Audience Comments & Reactions - Community Engagement System

## Overview

The Audience Comments & Reactions system enables community engagement through threaded comments, emoji reactions, and moderation workflows. This creates a vibrant community around Waliin Studio content.

## Schema

**File:** `schemas/audience_comments.schema.json`

## Comment Structure

### Author Information

```json
{
  "author": {
    "userId": "user-12345",
    "displayName": "MovieFan2024",
    "avatarUrl": "https://...",
    "personaId": "persona-001",
    "badges": ["verified", "subscriber", "premium"],
    "memberSince": "2023-06-15T00:00:00Z",
    "isAnonymous": false
  }
}
```

### User Badges

| Badge | Description |
|-------|-------------|
| `verified` | Verified user account |
| `subscriber` | Active subscription |
| `premium` | Premium tier subscriber |
| `vip` | VIP member |
| `early_adopter` | Early platform adopter |
| `top_contributor` | High engagement contributor |
| `moderator` | Community moderator |

## Content Types

Comments can be attached to various content:

| Type | Description |
|------|-------------|
| `movie` | Full-length movie |
| `episode` | Series episode |
| `series` | Series page |
| `short_drama` | Short-form drama |
| `trailer` | Trailer/teaser |
| `behind_the_scenes` | BTS content |

## Comment Content

```json
{
  "content": {
    "text": "Amazing episode! The plot twist was incredible 🔥",
    "language": "en",
    "mentions": [
      { "userId": "user-67890", "displayName": "DramaLover", "startIndex": 0, "endIndex": 10 }
    ],
    "hashtags": ["WaliinStudio", "BestDrama"],
    "timestamp": 1245,
    "spoilerMarked": false,
    "attachments": [
      { "type": "gif", "url": "https://...", "altText": "Reaction GIF" }
    ]
  }
}
```

### Attachment Types

- `image` - Still images
- `gif` - Animated GIFs
- `sticker` - Platform stickers

## Reactions System

### Available Reactions

| Reaction | Emoji | Description |
|----------|-------|-------------|
| `like` | 👍 | General approval |
| `love` | ❤️ | Strong positive |
| `wow` | 😮 | Surprised |
| `sad` | 😢 | Empathy |
| `angry` | 😠 | Disapproval |
| `laugh` | 😂 | Funny |
| `fire` | 🔥 | Excellent/Hot |
| `heart_eyes` | 😍 | Love it |

### Reaction Tracking

```json
{
  "reactions": {
    "totalCount": 342,
    "breakdown": {
      "like": 180,
      "love": 95,
      "fire": 67
    },
    "userReaction": "love"
  }
}
```

## Threading

Comments support nested replies up to 5 levels deep:

```json
{
  "parentCommentId": "comment-parent-001",
  "threadDepth": 1
}
```

## Engagement Metrics

```json
{
  "engagement": {
    "replyCount": 28,
    "viewCount": 1520,
    "shareCount": 12,
    "reportCount": 0,
    "isPinned": true,
    "isHighlighted": true,
    "highlightReason": "top_comment"
  }
}
```

### Highlight Reasons

| Reason | Description |
|--------|-------------|
| `staff_pick` | Selected by staff |
| `top_comment` | Most engagement |
| `creator_response` | Creator's reply |
| `most_helpful` | Community voted helpful |

## Moderation System

### Moderation Status

| Status | Description |
|--------|-------------|
| `pending` | Awaiting review |
| `approved` | Approved for display |
| `rejected` | Rejected, not shown |
| `flagged` | Flagged for review |
| `hidden` | Hidden from public view |
| `deleted` | Soft deleted |

### Auto-Moderation

```json
{
  "autoModerationResult": {
    "passed": true,
    "flags": [],
    "confidenceScore": 0.98,
    "suggestedAction": "approve"
  }
}
```

### Auto-Moderation Flags

| Flag | Description |
|------|-------------|
| `profanity` | Profane language detected |
| `hate_speech` | Hate speech detected |
| `spam` | Spam content |
| `harassment` | Harassment detected |
| `adult_content` | Adult content |
| `violence` | Violent content |
| `misinformation` | False information |
| `personal_info` | PII exposed |
| `cultural_sensitivity` | Cultural sensitivity issue |

### Suggested Actions

| Action | Description |
|--------|-------------|
| `approve` | Auto-approve comment |
| `flag_review` | Flag for manual review |
| `auto_hide` | Automatically hide |
| `auto_delete` | Automatically delete |

### Manual Review

```json
{
  "manualReview": {
    "reviewedBy": "moderator-001",
    "reviewedAt": "2024-01-20T11:00:00Z",
    "decision": "approved",
    "reason": "False positive",
    "editedContent": null
  }
}
```

### User Reports

```json
{
  "reports": [
    {
      "reportId": "report-001",
      "reporterId": "user-67890",
      "reason": "spoiler",
      "details": "Contains major spoilers without marking",
      "reportedAt": "2024-01-20T12:00:00Z",
      "status": "pending"
    }
  ]
}
```

### Report Reasons

- `spam` - Spam or promotional
- `harassment` - Harassment/bullying
- `hate_speech` - Hate speech
- `misinformation` - False information
- `spoiler` - Unmarked spoilers
- `off_topic` - Off-topic content
- `inappropriate` - Inappropriate content
- `other` - Other issues

## Cultural Sensitivity

```json
{
  "culturalSensitivity": {
    "flagged": true,
    "regions": ["EA", "WA"],
    "sensitivityType": "religious",
    "reviewRequired": true
  }
}
```

### Sensitivity Types

| Type | Description |
|------|-------------|
| `religious` | Religious sensitivity |
| `political` | Political sensitivity |
| `social` | Social norms |
| `historical` | Historical sensitivity |
| `linguistic` | Language/dialect issues |

## Visibility Settings

```json
{
  "visibility": {
    "isPublic": true,
    "visibleToAuthor": true,
    "regionRestrictions": ["CN"],
    "ageRestricted": false
  }
}
```

## Sentiment Analysis

Comments are automatically analyzed for sentiment:

```json
{
  "sentimentAnalysis": {
    "sentiment": "very_positive",
    "sentimentScore": 0.92,
    "emotions": [
      { "emotion": "joy", "confidence": 0.85 },
      { "emotion": "anticipation", "confidence": 0.78 }
    ],
    "topics": ["plot", "suspense", "excitement"],
    "analyzedAt": "2024-01-20T10:30:00Z"
  }
}
```

### Emotion Types

- `joy` - Happiness, pleasure
- `sadness` - Grief, sorrow
- `anger` - Frustration, rage
- `fear` - Anxiety, worry
- `surprise` - Shock, wonder
- `disgust` - Dislike, aversion
- `anticipation` - Expectation
- `trust` - Confidence

## Insights Integration

```json
{
  "insightsIntegration": {
    "feedToAudienceInsights": true,
    "contributesToSentiment": true,
    "feedbackSignalWeight": 0.3
  }
}
```

## Timestamped Comments

Comments can be linked to specific moments in content:

```json
{
  "content": {
    "text": "This scene is amazing!",
    "timestamp": 1245
  }
}
```

This creates a "danmaku"-style experience where comments appear at the relevant moment.

## Audit Events

| Event | Description |
|-------|-------------|
| `comment_posted` | New comment posted |
| `comment_edited` | Comment edited |
| `comment_deleted` | Comment deleted |
| `comment_reported` | Comment reported |
| `comment_moderated` | Moderation action taken |
| `comment_approved` | Comment approved |
| `comment_rejected` | Comment rejected |
| `comment_hidden` | Comment hidden |
| `comment_pinned` | Comment pinned |
| `comment_highlighted` | Comment highlighted |
| `reaction_added` | Reaction added |
| `reaction_removed` | Reaction removed |
| `thread_created` | New thread started |
| `thread_replied` | Reply added to thread |

## API Examples

### Post Comment

```javascript
POST /api/comments
{
  "contentId": "episode-s01e05",
  "contentType": "episode",
  "text": "Amazing episode!",
  "spoilerMarked": false
}
```

### Add Reaction

```javascript
POST /api/comments/{commentId}/reactions
{
  "reactionType": "love"
}
```

### Report Comment

```javascript
POST /api/comments/{commentId}/report
{
  "reason": "spoiler",
  "details": "Contains major plot spoilers"
}
```

## Best Practices

1. **Moderation**: Enable auto-moderation with cultural sensitivity filters
2. **Response Time**: Aim for < 15 minute review times for flagged content
3. **Community Guidelines**: Clearly communicate commenting rules
4. **Spoiler Tags**: Encourage spoiler marking for plot discussions
5. **Positive Reinforcement**: Highlight top comments to encourage engagement
6. **Multi-language**: Support comments in multiple languages
7. **Accessibility**: Ensure comment system is accessible (WCAG 2.1 AA)
