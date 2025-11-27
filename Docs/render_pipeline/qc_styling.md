# QC & Persona Styling Documentation

## Overview

The QC (Quality Control) system provides automated validation of timelines and content before publishing. It integrates with persona styling to ensure visual consistency and flags episodes that require human review.

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Timeline Builder                           │
│  - Applies persona styles                                     │
│  - Runs QC checks                                            │
│  - Sets needsHumanReview flag                                │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                    QC API                                     │
│  - Persona style lookup                                      │
│  - Episode QC status                                         │
│  - Review workflow                                           │
│  - Statistics dashboard                                      │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                    Control Panel                              │
│  - QC Dashboard view                                         │
│  - Persona style preview                                     │
│  - Review approval workflow                                  │
└───────────────────────────────────────────────────────────────┘
```

## Persona Styles

### Configuration File

Persona styles are configured in `render-stack/config/persona_styles.json`:

```json
{
  "ADDIS": {
    "personaCode": "ADDIS",
    "primaryColor": "#FF6B35",
    "secondaryColor": "#004E89",
    "fontFamily": "Inter",
    "captionPosition": "bottom-center",
    "motionPreset": "subtle-zoom",
    "transitionPreset": "fade",
    "defaultRenderProfile": "vertical_1080x1920"
  }
}
```

### Style Properties

| Property | Type | Description |
|----------|------|-------------|
| `personaCode` | string | Unique identifier (matches Airtable) |
| `primaryColor` | hex | Brand color for accents |
| `secondaryColor` | hex | Secondary/background color |
| `fontFamily` | string | Font for captions |
| `captionPosition` | enum | Where captions appear |
| `motionPreset` | enum | Background motion style |
| `transitionPreset` | enum | Scene transitions |
| `defaultRenderProfile` | enum | Default aspect ratio |

### Caption Positions

- `bottom-center` - Standard subtitle position
- `top-center` - Upper third
- `middle-center` - Center screen
- `bottom-left` - Lower left
- `bottom-right` - Lower right

### Motion Presets

- `none` - Static background
- `subtle-zoom` - Slow zoom in/out
- `ken-burns` - Pan and zoom
- `parallax` - Layered movement

### Transition Presets

- `none` - Hard cut
- `fade` - Fade to black
- `crossfade` - Dissolve between scenes
- `slide-left` / `slide-right` - Slide transition
- `zoom-in` / `zoom-out` - Zoom transition

## QC Flags

### Flag Properties

```typescript
interface QCFlags {
  contentWarnings: string[];      // e.g., ['cultural-reference']
  needsHumanReview: boolean;      // Requires operator approval
  reviewReason?: string;          // Why review is needed
  captionLengthExceeded?: boolean;
  durationExceeded?: boolean;
  notes?: string[];               // Audit trail
  reviewedAt?: string;            // When reviewed
  reviewedBy?: string;            // Who reviewed
}
```

### Automatic Checks

| Check | Threshold | Action |
|-------|-----------|--------|
| Caption length | 150 chars | Warning |
| Short-form duration | 180s (3 min) | Warning |
| Long-form duration | 600s (10 min) | Issue (blocks) |
| Flagged keywords | explicit, violence, etc. | Warning |

### Content Warnings

Predefined content warning categories:
- `cultural-reference` - May need cultural sensitivity review
- `mature-themes` - Adult themes
- `strong-language` - Explicit language
- `violence` - Violent content
- `controversial` - Potentially divisive topics

## REST API

### List Personas

```http
GET /api/qc/personas
```

**Response:**
```json
{
  "personas": [
    {
      "code": "ADDIS",
      "primaryColor": "#FF6B35",
      "secondaryColor": "#004E89",
      "fontFamily": "Inter",
      ...
    }
  ],
  "count": 3
}
```

### Get Persona Style

```http
GET /api/qc/personas/ADDIS
```

**Response:**
```json
{
  "persona": {
    "personaCode": "ADDIS",
    "primaryColor": "#FF6B35",
    ...
  }
}
```

### List Episodes with QC

```http
GET /api/qc/episodes?needsReview=true&persona=ADDIS&limit=50
```

**Response:**
```json
{
  "episodes": [
    {
      "episodeId": "test_001",
      "personaCode": "ADDIS",
      "qcFlags": {
        "needsHumanReview": true,
        "reviewReason": "Duration exceeds limit"
      },
      "style": { ... }
    }
  ],
  "count": 5,
  "total": 12
}
```

### Get Episode QC Info

```http
GET /api/qc/episodes/test_001
```

**Response:**
```json
{
  "episode": {
    "episodeId": "test_001",
    "personaCode": "ADDIS",
    "duration": 95,
    "qcFlags": { ... },
    "style": { ... }
  },
  "additionalFlags": {
    "issues": [],
    "warnings": ["Caption exceeds 150 chars"]
  },
  "thresholds": {
    "maxCaptionLength": 150,
    "maxDuration": 180
  }
}
```

### Review Episode

```http
POST /api/qc/episodes/test_001/review
Content-Type: application/json

{
  "reviewedBy": "Operator",
  "notes": "Reviewed and approved for publishing",
  "approved": true
}
```

**Response:**
```json
{
  "success": true,
  "episodeId": "test_001",
  "qcFlags": {
    "needsHumanReview": false,
    "reviewedAt": "2024-01-15T10:30:00Z",
    "reviewedBy": "Operator"
  },
  "message": "Episode approved"
}
```

### Get QC Statistics

```http
GET /api/qc/stats
```

**Response:**
```json
{
  "stats": {
    "total": 50,
    "needsReview": 5,
    "reviewed": 45,
    "captionLengthExceeded": 3,
    "durationExceeded": 2,
    "byPersona": {
      "ADDIS": 20,
      "HABESHA_HUMOR": 15,
      "TECH_TALK": 15
    },
    "byRenderProfile": {
      "vertical_1080x1920": 40,
      "horizontal_1920x1080": 10
    },
    "recentReviews": [
      {
        "episodeId": "test_001",
        "reviewedAt": "2024-01-15T10:30:00Z",
        "reviewedBy": "Operator"
      }
    ]
  },
  "thresholds": { ... }
}
```

## Workflow

### Standard QC Flow

```
┌─────────────────┐
│ Build Timeline  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Run QC Checks  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│ Pass  │ │ Flagged   │
└───┬───┘ └─────┬─────┘
    │           │
    ▼           ▼
┌───────┐ ┌───────────┐
│ Render│ │  Review   │
└───────┘ │  Queue    │
          └─────┬─────┘
                │
                ▼
          ┌───────────┐
          │  Operator │
          │  Reviews  │
          └─────┬─────┘
                │
        ┌───────┴───────┐
        ▼               ▼
    ┌───────┐       ┌───────┐
    │Approve│       │Reject │
    └───┬───┘       └───┬───┘
        │               │
        ▼               ▼
    ┌───────┐       ┌───────┐
    │ Render│       │ Edit  │
    └───────┘       └───────┘
```

### Operator SOP

1. **Check QC Dashboard** - View episodes needing review
2. **Review Episode** - Open episode details, review flags
3. **Make Decision**:
   - **Approve**: Clear `needsHumanReview`, episode proceeds
   - **Reject**: Add notes, request edits
4. **Add Notes** - Document rationale for future reference

## Control Panel Integration

### QC Dashboard View

The control panel includes a QC dashboard at `/qc` showing:

- Episodes requiring review (sorted by priority)
- Quick filters by persona, render profile
- Review actions (approve, reject, add note)
- Statistics summary

### Episode Card

Each episode shows:
- Persona styling preview (colors, fonts)
- QC flags with visual indicators
- Duration and render profile
- Review status and history

### Persona Style Preview

When viewing episodes:
- Color swatches for primary/secondary
- Font family sample
- Caption position indicator
- Motion/transition preset labels

## File Structure

```
render-stack/
├── config/
│   └── persona_styles.json     # Persona configurations
├── types/
│   └── timeline.types.ts       # QCFlags, PersonaStyle types
└── builder/
    └── build-timeline.ts       # QC check integration

apps/control-panel/backend/src/
└── qc-api.ts                   # QC REST endpoints

Docs/render_pipeline/
└── qc_styling.md               # This documentation

timelines/
└── {episodeId}/
    └── timeline.json           # Contains qcFlags
```

## Security Considerations

1. **Review Audit Trail**: All reviews are logged with timestamp and actor
2. **Content Warnings**: Flagged content requires explicit approval
3. **Threshold Validation**: QC thresholds cannot be overridden without admin access
4. **Notes Persistence**: Review notes are permanent, cannot be deleted

## Future Enhancements

- [ ] AI-assisted content moderation
- [ ] Custom QC rules per franchise
- [ ] Batch review workflow
- [ ] Style preview rendering
- [ ] Caption mockup generator
- [ ] Integration with content moderation APIs
- [ ] Real-time QC during timeline building
