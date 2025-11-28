# Media Localization

This document describes SL18's media localization system for subtitles, dubbing, accessibility tracks, and multilingual delivery.

## Overview

The media localization system enables Waliin Studio content to reach global audiences through automated subtitle generation, AI-powered dubbing, and comprehensive accessibility support.

## Schema

- **Schema**: `schemas/media_localization.schema.json`
- **ID Pattern**: `loc-{identifier}`

## Components

### 1. Subtitles

#### Auto-Generation
| Engine | Languages | Features |
|--------|-----------|----------|
| Whisper | 97+ languages | Speaker diarization |
| Google Speech | 120+ languages | Real-time |
| Azure Speech | 75+ languages | Custom models |
| AWS Transcribe | 37 languages | Medical vocabulary |

#### Translation
| Engine | Quality | Languages |
|--------|---------|-----------|
| DeepL | Premium | 31 languages |
| Google Translate | Good | 130+ languages |
| Azure Translator | Good | 100+ languages |

#### Formats
| Format | Platforms | Features |
|--------|-----------|----------|
| WebVTT | HLS, Web, iOS, Android | Styling, regions |
| TTML | DASH, Smart TV | Rich formatting |
| SRT | Universal | Simple text |
| SCC | Broadcast | Closed captions |

#### Styling
```json
{
  "fontFamily": "Noto Sans",
  "fontSize": 24,
  "fontColor": "#FFFFFF",
  "backgroundColor": "#000000",
  "backgroundOpacity": 0.75,
  "position": "bottom_center",
  "edgeStyle": "drop_shadow"
}
```

#### QC Checks
| Check | Description | Threshold |
|-------|-------------|-----------|
| Timing accuracy | Sync with audio | ± 100ms |
| Reading speed | CPS limit | ≤ 21 CPS |
| Line length | Characters per line | ≤ 42 |
| Max lines | Lines on screen | ≤ 2 |

### 2. Dubbing

#### Workflow Types
| Type | Description | Use Case |
|------|-------------|----------|
| Traditional | Human voice actors | Premium content |
| AI Voice | Synthetic voices | Scale/speed |
| Hybrid | AI + human review | Balance |
| Voice Clone | Cloned actor voice | Consistency |

#### Voice Synthesis Engines
| Engine | Quality | Features |
|--------|---------|----------|
| ElevenLabs | Ultra realistic | Voice cloning |
| Google WaveNet | High | Multilingual |
| Azure Neural | High | SSML support |
| Amazon Polly | Good | Low cost |

#### Lip Sync Methods
| Method | Accuracy | Use Case |
|--------|----------|----------|
| Manual | 95%+ | Premium |
| Automated | 80-85% | Scale |
| AI-assisted | 85-90% | Balance |

#### Persona Alignment
```json
{
  "voiceMatching": {
    "gender": true,
    "age": true,
    "tone": true,
    "accent": true
  },
  "culturalAdaptation": {
    "nameLocalization": true,
    "idiomAdaptation": true,
    "honorifics": true
  }
}
```

#### Audio Mixing
| Standard | Target LUFS | Use Case |
|----------|-------------|----------|
| EBU R128 | -23 LUFS | Europe |
| ATSC A/85 | -24 LKFS | US |
| ARIB | -24 LUFS | Japan |

### 3. Accessibility

#### Closed Captions
| Format | Standard | Features |
|--------|----------|----------|
| CEA-608 | NTSC | Legacy support |
| CEA-708 | HD | Digital TV |
| WebVTT SDH | Web | Full features |

Features:
- Sound descriptions [DOOR SLAMS]
- Speaker identification (JOHN:)
- Music descriptions ♪ Upbeat music ♪

#### Audio Description
| Type | Description |
|------|-------------|
| Standard | Fits in natural pauses |
| Extended | Pauses content for AD |
| Audio Intro | Scene setup narration |

Generation:
- Manual scripting
- AI-assisted description
- Voice synthesis

#### Sign Language
| Language | Code | Display Mode |
|----------|------|--------------|
| ASL | American | PIP/Overlay |
| BSL | British | Side-by-side |
| LSF | French | PIP |

#### Reduced Motion
- Flash warnings
- Motion reduction variants

### 4. Track Management

#### Track Types
| Type | Description |
|------|-------------|
| `subtitle` | Text captions |
| `closed_caption` | SDH captions |
| `audio` | Dubbed audio |
| `audio_description` | AD track |
| `sign_language` | Sign interpretation |
| `commentary` | Director/actor commentary |

#### Track Status
| Status | Description |
|--------|-------------|
| `pending` | Awaiting processing |
| `processing` | In progress |
| `qc_pending` | Awaiting review |
| `approved` | QC passed |
| `published` | Live |
| `rejected` | Failed QC |

### 5. Glossary

#### Term Management
```json
{
  "termId": "term-sl18",
  "source": "SL18",
  "translations": {},
  "context": "Platform name",
  "doNotTranslate": true
}
```

#### Character Names
- Localized versions per language
- Pronunciation guides
- Regional variants

### 6. QC Workflow

#### Stages
| Stage | Type | Required |
|-------|------|----------|
| 1 | Automated QC | Yes |
| 2 | Native Speaker Review | Yes |
| 3 | Cultural Review | Yes |
| 4 | Final Approval | Yes |

#### Cultural Sensitivity
| Category | Description |
|----------|-------------|
| Religious | Religious references |
| Political | Political content |
| Gender | Gender representation |
| Racial | Cultural stereotypes |
| Regional taboos | Local sensitivities |

#### Thresholds
- Minimum QC score: 90/100
- Auto-reject threshold: 70/100
- Native review required: Yes

## Supported Languages

### Tier 1 (Full Support)
- English (en)
- Swahili (sw)
- Amharic (am)
- Arabic (ar)
- French (fr)
- Spanish (es)

### Tier 2 (Subtitles + AI Dub)
- Chinese (zh)
- Italian (it)
- Portuguese (pt)
- Oromifa (om)

## Metrics

| Metric | Description |
|--------|-------------|
| `languagesSupported` | Total languages |
| `tracksGenerated` | Total tracks created |
| `tracksApproved` | QC-approved tracks |
| `avgQcScore` | Average QC score |
| `translationAccuracy` | Translation quality |
| `culturalIssuesFound` | Sensitivity flags |

## Audit Events

| Event | Description |
|-------|-------------|
| `localization_job_created` | Job submitted |
| `subtitle_generated` | Subtitles created |
| `subtitle_translated` | Translation complete |
| `dubbing_completed` | Dubbing finished |
| `track_published` | Track live |
| `cultural_review_flagged` | Sensitivity issue |

## Example Configuration

```json
{
  "localizationId": "loc-waliin-multilingual",
  "version": "1.0.0",
  "name": "Waliin Studio Multilingual",
  "scope": {
    "level": "global",
    "languages": ["en", "sw", "am", "ar", "fr", "es"]
  },
  "subtitles": {
    "enabled": true,
    "generation": {
      "autoGeneration": {
        "enabled": true,
        "engine": "whisper"
      },
      "translation": {
        "enabled": true,
        "engine": "deepl"
      }
    }
  },
  "dubbing": {
    "enabled": true,
    "voiceSynthesis": {
      "engine": "eleven_labs",
      "emotionPreservation": true
    }
  },
  "status": "active"
}
```

## Related Documentation

- [Media Rendering](./media_rendering.md)
- [Distribution Pipeline](./distribution_pipeline.md)
- [Media Observability](./media_observability.md)
