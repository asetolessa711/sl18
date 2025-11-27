# Hybrid Serialized Formats Guide

This guide covers SL18's support for serialized content (multi-episode arcs) and hybrid publishing pipelines that combine serialized and short-form content.

## Overview

Phase 16 introduces:
- **Series workspaces** for multi-episode arcs with persona continuity
- **Hybrid publishing** mixing serialized drama with short-form comedy/music
- **Continuity enforcement** across episodes
- **Cross-format QC** for persona consistency

## Schema Files

| Schema | Location | Purpose |
|--------|----------|---------|
| Series Workspace | `schemas/series_workspace.schema.json` | Multi-episode arc management |
| Hybrid Publishing | `schemas/hybrid_publishing.schema.json` | Combined pipeline configuration |

## Series Workspace

### Structure

```json
{
  "seriesId": "series-drama-001",
  "franchiseId": "kenya-001",
  "title": "The Nairobi Chronicles",
  "format": "serialized_drama",
  "seasonInfo": {
    "seasonNumber": 1,
    "totalSeasons": 3,
    "episodesPerSeason": 10
  },
  "episodes": [...],
  "personaProfile": {...},
  "continuityNotes": {...},
  "qcRequirements": {...},
  "status": "active"
}
```

### Series Formats

| Format | Description |
|--------|-------------|
| `serialized_drama` | Dramatic narrative across episodes |
| `serialized_comedy` | Comedy series with running storylines |
| `serialized_documentary` | Documentary series |
| `anthology` | Standalone episodes with shared theme |
| `hybrid` | Mix of serialized and standalone |

### Episode Structure

```json
{
  "episodeId": "ep-s1-e02",
  "seasonNumber": 1,
  "episodeNumber": 2,
  "title": "First Investor",
  "synopsis": "The team meets their first potential investor",
  "duration": 1180,
  "status": "published",
  "continuityNotes": "Reference to launch event from E01",
  "previousEpisodeRef": "ep-s1-e01",
  "languages": ["en", "sw"],
  "publishedAt": "2025-01-22T18:00:00Z"
}
```

### Episode Status Flow

```
planned → scripting → production → post_production → qc → ready → published
```

## Persona Profiles

### Primary Personas

Personas that appear throughout the series:

```json
{
  "primaryPersonas": [
    {
      "personaId": "persona-amara",
      "name": "Amara Okonkwo",
      "role": "Lead Founder",
      "firstAppearance": {
        "seasonNumber": 1,
        "episodeNumber": 1
      },
      "characteristics": ["Ambitious", "Optimistic", "Tech-savvy"],
      "voiceProfile": {
        "voiceId": "voice-amara-001",
        "tone": "Confident and warm",
        "speechPatterns": ["Uses tech jargon", "Ends sentences with 'you know?'"]
      }
    }
  ]
}
```

### Recurring Personas

Personas that appear in multiple (but not all) episodes:

```json
{
  "recurringPersonas": [
    {
      "personaId": "persona-investor",
      "name": "Mr. Obi",
      "episodeAppearances": ["ep-s1-e02", "ep-s1-e03", "ep-s1-e05"]
    }
  ]
}
```

### Continuity Rules

Rules that enforce persona consistency:

```json
{
  "continuityRules": [
    {
      "ruleId": "rule-amara-speech",
      "personaId": "persona-amara",
      "rule": "Must maintain consistent use of tech startup vocabulary",
      "enforceAcrossEpisodes": true
    },
    {
      "ruleId": "rule-kofi-tone",
      "personaId": "persona-kofi",
      "rule": "Never raises voice unless extreme situation",
      "enforceAcrossEpisodes": true
    }
  ]
}
```

## Continuity Tracking

### Plot Threads

Track ongoing storylines:

```json
{
  "plotThreads": [
    {
      "threadId": "thread-funding",
      "description": "Search for Series A funding",
      "status": "active",
      "introducedIn": "ep-s1-e01"
    },
    {
      "threadId": "thread-competitor",
      "description": "Rival company stealing ideas",
      "status": "active",
      "introducedIn": "ep-s1-e02"
    }
  ]
}
```

### Thread Status

| Status | Description |
|--------|-------------|
| `active` | Ongoing storyline |
| `resolved` | Storyline concluded |
| `abandoned` | Storyline dropped |

### World Building Elements

Track recurring locations, items, concepts:

```json
{
  "worldBuildingElements": [
    {
      "elementId": "elem-office",
      "type": "location",
      "name": "The Hub",
      "description": "Co-working space in Westlands",
      "firstMention": "ep-s1-e01"
    }
  ]
}
```

### Element Types

- `location` — Places
- `item` — Objects
- `concept` — Ideas, terms
- `relationship` — Character connections
- `event` — Past events

### Timeline Events

Track in-story chronology:

```json
{
  "timelineEvents": [
    {
      "eventId": "event-launch",
      "description": "Startup officially launched",
      "episodeId": "ep-s1-e01",
      "inStoryDate": "January 2025"
    }
  ]
}
```

## QC Requirements

### Series-Level QC

```json
{
  "qcRequirements": {
    "personaContinuityCheck": true,
    "plotContinuityCheck": true,
    "crossEpisodeReview": true,
    "minimumContinuityScore": 90
  }
}
```

### Continuity Checks

| Check | Description |
|-------|-------------|
| `personaContinuityCheck` | Verify persona voice/behavior consistency |
| `plotContinuityCheck` | Verify plot threads are consistent |
| `crossEpisodeReview` | Review episode in context of previous |

### Continuity Score

Episodes receive a continuity score (0-100):
- **90-100**: Excellent continuity
- **80-89**: Good, minor issues
- **70-79**: Acceptable, needs review
- **<70**: Fails continuity check

## Hybrid Publishing

### Pipeline Types

| Type | Description |
|------|-------------|
| `short_form_only` | Only short-form content |
| `serialized_only` | Only serialized content |
| `hybrid` | Both formats combined |

### Hybrid Pipeline Configuration

```json
{
  "pipelineId": "pipeline-hybrid-001",
  "franchiseId": "kenya-001",
  "name": "Kenya Hybrid Content Pipeline",
  "pipelineType": "hybrid",
  "shortFormConfig": {...},
  "serializedConfig": {...},
  "hybridRules": {...},
  "qcEnforcement": {...}
}
```

### Short-Form Configuration

```json
{
  "shortFormConfig": {
    "enabled": true,
    "contentTypes": ["comedy_skit", "news_commentary", "promotional"],
    "maxDuration": 60,
    "platforms": ["tiktok", "instagram_reels", "youtube_shorts"],
    "publishingSchedule": {
      "frequency": "daily",
      "preferredTimes": ["09:00", "12:00", "18:00"],
      "timezone": "Africa/Nairobi"
    }
  }
}
```

### Short-Form Content Types

- `comedy_skit` — Comedy sketches
- `music_clip` — Music content
- `news_commentary` — News/opinion
- `educational` — Educational content
- `promotional` — Promotional clips

### Serialized Configuration

```json
{
  "serializedConfig": {
    "enabled": true,
    "seriesIds": ["series-drama-001"],
    "contentTypes": ["drama", "documentary"],
    "episodeDuration": {
      "min": 600,
      "max": 1800
    },
    "platforms": ["youtube"],
    "releaseSchedule": {
      "frequency": "weekly",
      "releaseDay": "friday",
      "releaseTime": "18:00",
      "timezone": "Africa/Nairobi"
    }
  }
}
```

### Release Frequencies

| Frequency | Description |
|-----------|-------------|
| `weekly` | Once per week |
| `biweekly` | Every two weeks |
| `monthly` | Once per month |
| `season_drop` | All episodes at once |

## Hybrid Rules

### Cross-Promotion

```json
{
  "crossPromotion": {
    "enabled": true,
    "clipFromSeries": true,
    "teaserGeneration": true
  }
}
```

- **clipFromSeries**: Generate short clips from series episodes
- **teaserGeneration**: Auto-generate teasers for upcoming episodes

### Persona Sharing

```json
{
  "personaSharing": {
    "enabled": true,
    "consistencyEnforced": true
  }
}
```

Same personas can appear in both short-form and serialized content with consistency enforcement.

### Workflow Integration

```json
{
  "workflowIntegration": {
    "sharedAssetLibrary": true,
    "unifiedQC": true,
    "separatePipelines": false
  }
}
```

- **sharedAssetLibrary**: Assets shared between formats
- **unifiedQC**: Single QC process for both
- **separatePipelines**: Run independently (for isolation)

## Cross-Format QC

### QC Enforcement

```json
{
  "qcEnforcement": {
    "shortFormQC": {
      "enabled": true,
      "rules": ["audio_quality", "video_quality", "content_guidelines"]
    },
    "serializedQC": {
      "enabled": true,
      "personaContinuity": true,
      "plotContinuity": true,
      "rules": ["continuity_check", "pacing", "narrative_structure"]
    },
    "crossFormatQC": {
      "enabled": true,
      "personaConsistency": true,
      "brandConsistency": true
    }
  }
}
```

### Cross-Format Checks

| Check | Description |
|-------|-------------|
| `personaConsistency` | Same persona behaves consistently across formats |
| `brandConsistency` | Brand voice/style consistent |

## Extended Audit Events

### Series Events

- `series_created` — New series workspace created
- `series_updated` — Series metadata updated
- `episode_created` — New episode added
- `episode_published` — Episode published
- `continuity_check_passed` — Episode passed continuity QC
- `continuity_check_failed` — Episode failed continuity QC

### Hybrid Events

- `hybrid_pipeline_started` — Hybrid pipeline initiated
- `hybrid_pipeline_completed` — Pipeline run completed
- `cross_format_qc_passed` — Cross-format QC passed
- `cross_format_qc_failed` — Cross-format QC failed

## Best Practices

### Continuity Management

1. Document all persona characteristics
2. Track plot threads from introduction
3. Use previous episode references
4. Review in context of full series

### Hybrid Workflow

1. Establish shared asset library
2. Define persona behavior across formats
3. Use unified QC process
4. Plan cross-promotion schedule

### QC for Serialized Content

1. Set appropriate continuity score thresholds
2. Enable cross-episode review
3. Document continuity rules explicitly
4. Track deviations for series bible updates

## Test Coverage

### Running Tests

```bash
# Run all Phase 16 tests
node tests/governance/observability.test.js

# Run full test suite
npm test
```

### Test Categories

- Series workspace validation
- Hybrid pipeline validation
- Persona continuity checks
- Plot continuity checks
- Cross-format QC

## File Locations

| Artifact | Path |
|----------|------|
| Series Workspace Schema | `schemas/series_workspace.schema.json` |
| Hybrid Publishing Schema | `schemas/hybrid_publishing.schema.json` |
| Test Fixtures | `tests/governance/fixtures/hybrid_formats.json` |
| Tests | `tests/governance/observability.test.js` |

---

*Version: 1.0*
*Phase: 16 - Hybrid Serialized Formats*
*Last Updated: November 2025*
