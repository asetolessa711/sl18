# SL18 AI-Driven Personalization Guide

This document covers the AI-driven personalization engine introduced in Phase 17, enabling personalized creative experiences for viewers while maintaining franchise continuity.

## Overview

The personalization engine delivers tailored content experiences based on viewer profiles, preferences, and engagement patterns. It integrates with QC enforcement to ensure personalized content maintains brand and persona consistency.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Personalization Engine                        │
├─────────────────────────────────────────────────────────────────┤
│  Viewer Profile    │  Recommendation    │  Adaptive Rendering   │
│  ───────────────   │  ─────────────     │  ─────────────────    │
│  • Demographics    │  • Persona         │  • Subtitles          │
│  • Language Prefs  │  • Format          │  • Captions           │
│  • Genre Affinity  │  • Content Style   │  • Voice Selection    │
│  • Engagement      │  • Confidence      │  • Teaser Generation  │
├─────────────────────────────────────────────────────────────────┤
│                      QC Enforcement Layer                        │
│  • Brand Continuity  • Persona Continuity  • Cultural Sensitivity│
└─────────────────────────────────────────────────────────────────┘
```

## Viewer Profile

The viewer profile captures all data needed for personalization:

### Demographics
- **region**: ISO country code (e.g., "KE", "ET", "US")
- **ageGroup**: Age bracket for content filtering
- **timezone**: For optimal content scheduling

### Language Preferences
```json
{
  "primary": "sw",
  "secondary": ["en"],
  "subtitlePreference": "primary",
  "captionPreference": "auto"
}
```

### Genre Affinity
Tracks viewer preferences across content genres:
```json
{
  "genreAffinity": [
    { "genre": "drama", "affinityScore": 85, "watchCount": 42 },
    { "genre": "comedy", "affinityScore": 72, "watchCount": 28 }
  ]
}
```

### Engagement History
```json
{
  "totalWatchTime": 1250,
  "avgSessionDuration": 22.5,
  "engagementScore": 78,
  "interactionPatterns": {
    "likesGiven": 156,
    "commentsPosted": 23,
    "sharesCompleted": 12,
    "episodesCompleted": 45
  }
}
```

## Recommendation Engine

### Persona Recommendation
The engine selects the optimal persona based on:
1. Genre affinity scores
2. Previous persona interactions
3. Engagement patterns

```json
{
  "recommendedPersona": {
    "personaId": "persona-amina",
    "confidenceScore": 94,
    "reasoning": "High affinity for drama genre and previous positive interactions"
  }
}
```

### Format Recommendation
Content format is determined by engagement patterns:

| Engagement Level | Session Duration | Format | Duration |
|-----------------|------------------|--------|----------|
| High | >30 min | serialized | long |
| Medium | 15-30 min | serialized | medium |
| Low | <10 min | short_form | micro/short |

### Content Style Recommendation
```json
{
  "recommendedContentStyle": {
    "tone": "dramatic",
    "pacing": "moderate",
    "visualStyle": "cinematic",
    "confidenceScore": 82
  }
}
```

**Tone Options**: casual, formal, humorous, dramatic, educational, inspirational  
**Pacing Options**: slow, moderate, fast  
**Visual Style Options**: minimal, vibrant, cinematic, animated

## Adaptive Rendering

### Dynamic Subtitles
Configure subtitles based on viewer preferences:
```json
{
  "subtitleConfig": {
    "language": "sw",
    "fontSize": "medium",
    "position": "bottom",
    "style": "standard"
  }
}
```

### Persona Voice Selection
Select region-appropriate voice variants:
```json
{
  "personaVoiceSelection": {
    "personaId": "persona-amina",
    "voiceVariant": "amina-sw-ke",
    "language": "sw",
    "adjustedForRegion": true
  }
}
```

### Personalized Teaser Generation
Generate engagement-based teasers:
```json
{
  "teaserGeneration": {
    "enabled": true,
    "style": "cliffhanger",
    "duration": 15,
    "basedOnEngagement": true
  }
}
```

**Teaser Styles**: highlight, summary, cliffhanger, character_focus

## QC Enforcement

The personalization engine includes QC checks to prevent brand/persona drift:

### Brand Continuity Check
Ensures recommended personas and content styles align with franchise guidelines:
```json
{
  "brandGuidelines": {
    "approvedPersonas": ["persona-amina", "persona-jabari"],
    "allowedTones": ["dramatic", "inspirational", "educational"]
  }
}
```

### Persona Continuity Check
Validates that personalized content maintains consistent persona behavior across episodes.

### Cultural Sensitivity Check
Region-specific validation for cultural appropriateness:
```json
{
  "culturalRules": {
    "KE": { "forbiddenTones": ["controversial", "offensive"] },
    "SA": { "forbiddenTones": ["controversial", "sensitive_topics"] }
  }
}
```

### QC Result Structure
```json
{
  "lastQcResult": {
    "passed": true,
    "checkedAt": "2025-01-15T14:34:00Z",
    "violations": []
  }
}
```

When violations occur:
```json
{
  "violations": [
    {
      "type": "persona_not_approved",
      "severity": "error",
      "description": "Recommended persona is not brand-approved"
    }
  ]
}
```

## Integration Points

### With Language Registry (Phase 15 Extended)
The personalization engine uses the language registry to:
- Validate language preferences
- Select appropriate TTS voices
- Apply correct font configurations

### With Observability (Phase 16)
Personalization events are tracked:
- `personalization_served`
- `recommendation_generated`
- `adaptive_rendering_applied`
- `qc_personalization_passed/failed`

### With Revenue Ledger
Personalization impacts revenue through:
- Increased engagement → higher retention
- Personalized upsell recommendations
- Content affinity tracking for monetization

## Audit Logging

All personalization actions are logged:

```json
{
  "logId": "log-pe-20250115-001",
  "eventType": "personalization_served",
  "category": "personalization",
  "actor": { "type": "system", "id": "personalization-engine" },
  "target": { "type": "viewer", "id": "viewer-ke-12345" },
  "details": {
    "description": "Personalized content served to viewer",
    "metadata": {
      "personaId": "persona-amina",
      "format": "serialized",
      "language": "sw"
    }
  },
  "result": "success"
}
```

## Configuration Example

Complete personalization engine configuration:

```json
{
  "engineId": "pe-kenya-001-v001",
  "franchiseId": "kenya-001",
  "viewerProfile": {
    "viewerId": "viewer-ke-12345",
    "demographics": { "region": "KE", "ageGroup": "25-34" },
    "languagePreferences": { "primary": "sw", "secondary": ["en"] },
    "genreAffinity": [{ "genre": "drama", "affinityScore": 85 }],
    "engagementHistory": { "engagementScore": 78 }
  },
  "recommendations": {
    "recommendedPersona": { "personaId": "persona-amina", "confidenceScore": 94 },
    "recommendedFormat": { "format": "serialized", "confidenceScore": 88 },
    "generatedAt": "2025-01-15T14:35:00Z"
  },
  "adaptiveRendering": { "enabled": true },
  "qcEnforcement": { "enabled": true, "brandContinuityCheck": true },
  "status": "active"
}
```

## Best Practices

1. **Start with High Confidence**: Only apply personalization when confidence scores exceed 70%
2. **Respect QC**: Never bypass QC checks for personalization
3. **Monitor Drift**: Track persona consistency metrics over time
4. **Cultural Awareness**: Always validate against regional cultural rules
5. **Fallback Strategy**: Have default recommendations when data is insufficient

## Troubleshooting

### Low Confidence Scores
- Check if viewer has sufficient engagement history
- Verify genre affinity data is populated
- Ensure persona preferences are tracked

### QC Failures
- Review brand guidelines for approved personas/tones
- Check cultural sensitivity rules for viewer region
- Validate content against franchise standards

### Recommendation Mismatch
- Verify genre affinity scores are current
- Check if engagement patterns have changed
- Review persona interaction history
