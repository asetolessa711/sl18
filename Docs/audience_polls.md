# Audience Polls - Interactive Feedback System

## Overview

The Audience Polls system enables interactive viewer engagement through episode-level polls, sentiment sliders, and real-time voting within Waliin Studio productions. This transforms passive viewing into an active, community-driven experience.

## Schema

**File:** `schemas/audience_polls.schema.json`

## Poll Types

| Type | Description | Use Case |
|------|-------------|----------|
| `story_choice` | Viewers vote on story outcomes | "What should Amara do next?" |
| `character_vote` | Vote for favorite characters | "Who is your favorite character?" |
| `sentiment_slider` | Rate mood/intensity on a scale | "How intense was this episode?" |
| `prediction` | Predict future plot points | "Who do you think is the culprit?" |
| `rating` | Rate content quality | "Rate this episode 1-5 stars" |
| `feedback` | Open-ended feedback collection | Post-episode surveys |
| `trivia` | Test viewer knowledge | Interactive quizzes |
| `opinion` | General opinion polls | Community discussions |

## Configuration

### Poll Config Structure

```json
{
  "pollConfig": {
    "question": "What should happen next?",
    "questionLocalized": {
      "sw": "Nini kifanyike sasa?",
      "am": "ቀጥሎ ምን መሆን አለበት?"
    },
    "options": [
      {
        "optionId": "opt-1",
        "text": "Option A",
        "textLocalized": { "sw": "Chaguo A" },
        "imageUrl": "https://...",
        "personaId": "persona-001"
      }
    ],
    "allowMultipleChoices": false,
    "maxChoices": 1,
    "showResultsBeforeVoting": false,
    "showResultsAfterVoting": true,
    "anonymousVoting": true
  }
}
```

### Slider Configuration

```json
{
  "sliderConfig": {
    "minValue": 0,
    "maxValue": 100,
    "step": 1,
    "leftLabel": "Calm",
    "rightLabel": "Intense",
    "leftLabelLocalized": { "sw": "Tulivu" },
    "rightLabelLocalized": { "sw": "Kali" }
  }
}
```

## Display Settings

### Trigger Points

| Trigger | Description |
|---------|-------------|
| `episode_start` | Show at the beginning of episode |
| `in_episode` | Show at specific timestamp |
| `episode_end` | Show after episode completes |
| `detail_page` | Show on content detail page |
| `on_demand` | User-initiated poll viewing |
| `scheduled` | Timed poll campaigns |

### Position Options

- `overlay_top` - Top of video player
- `overlay_bottom` - Bottom of video player
- `overlay_center` - Center modal
- `sidebar` - Side panel
- `inline` - Embedded in content
- `fullscreen` - Full screen takeover

### Animation Options

- `slide_in` - Slide animation
- `fade_in` - Fade animation
- `bounce` - Bounce effect
- `none` - No animation

## Targeting

Polls can be targeted to specific audience segments:

```json
{
  "targeting": {
    "regions": ["EA", "WA"],
    "languages": ["en", "sw", "am"],
    "subscriptionTiers": ["premium", "vip"],
    "viewerSegments": ["binge_watchers", "new_viewers"],
    "minWatchProgress": 80
  }
}
```

## Results Tracking

### Option Results

```json
{
  "results": {
    "totalVotes": 15420,
    "uniqueVoters": 14890,
    "optionResults": [
      { "optionId": "opt-1", "voteCount": 7850, "percentage": 50.9 }
    ],
    "demographicBreakdown": {
      "byRegion": [
        { "region": "EA", "voteCount": 9250, "topChoice": "opt-1" }
      ]
    }
  }
}
```

### Slider Results

```json
{
  "sliderResults": {
    "average": 78.5,
    "median": 82,
    "mode": 85,
    "distribution": [
      { "rangeStart": 0, "rangeEnd": 25, "count": 425, "percentage": 5.0 }
    ]
  }
}
```

## Story Influence

Polls can influence story outcomes:

```json
{
  "storyInfluence": {
    "influenceEnabled": true,
    "outcomeMapping": [
      {
        "optionId": "opt-1",
        "outcomeId": "outcome-confrontation",
        "outcomeDescription": "Amara confronts her rival in episode 6"
      }
    ],
    "thresholdForOutcome": 40
  }
}
```

## Insights Integration

Polls feed into Phase 20 Audience Insights:

```json
{
  "insightsIntegration": {
    "feedToAudienceInsights": true,
    "sentimentTracking": true,
    "influencePersonalization": true,
    "personalizationWeight": 0.3
  }
}
```

## Moderation

Polls can require approval before publishing:

```json
{
  "moderation": {
    "requireApproval": true,
    "approvedBy": "operator-001",
    "approvedAt": "2024-01-20T10:00:00Z",
    "flaggedForReview": false
  }
}
```

## Poll Lifecycle

| Status | Description |
|--------|-------------|
| `draft` | Poll created, not yet scheduled |
| `scheduled` | Scheduled for future activation |
| `active` | Currently accepting votes |
| `paused` | Temporarily paused |
| `closed` | No longer accepting votes |
| `archived` | Historical record |

## Audit Events

| Event | Description |
|-------|-------------|
| `poll_created` | New poll created |
| `poll_updated` | Poll configuration updated |
| `poll_published` | Poll made active |
| `poll_voted` | User cast a vote |
| `poll_closed` | Poll closed for voting |
| `poll_archived` | Poll archived |
| `poll_results_calculated` | Results aggregated |
| `poll_story_outcome_triggered` | Story outcome triggered by vote |

## API Examples

### Create Poll

```javascript
POST /api/polls
{
  "franchiseId": "waliin-001",
  "contentId": "episode-s01e05",
  "pollType": "story_choice",
  "pollConfig": {
    "question": "What should Amara do next?",
    "options": [
      { "optionId": "opt-1", "text": "Confront rival" },
      { "optionId": "opt-2", "text": "Seek help" }
    ]
  },
  "displaySettings": {
    "triggerPoint": "in_episode",
    "triggerTimestamp": 1245
  }
}
```

### Submit Vote

```javascript
POST /api/polls/{pollId}/vote
{
  "optionId": "opt-1",
  "customerId": "customer-12345"
}
```

### Get Results

```javascript
GET /api/polls/{pollId}/results
```

## Best Practices

1. **Timing**: Place polls at natural story break points
2. **Relevance**: Ensure poll questions relate to current content
3. **Brevity**: Keep questions short and options clear
4. **Localization**: Always provide translations for target regions
5. **Story Impact**: Communicate when votes influence outcomes
6. **Results Sharing**: Show results to encourage participation
7. **Frequency**: Limit polls to 1-2 per episode to avoid fatigue
