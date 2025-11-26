# Timeline Schema Documentation

## Overview

The Timeline Schema defines the contract between the AI generation layer and the SL18 render worker. A `timeline.json` file describes the complete structure of an episode including tracks, clips, captions, styling, and QC flags.

## Schema Version

Current version: `1.0.0`

The `timelineVersion` field ensures compatibility between timeline builders and render workers.

## Core Concepts

### Timeline

The root document containing all episode rendering information:

```typescript
interface Timeline {
  timelineVersion: string;    // Schema version (e.g., "1.0.0")
  episodeId: string;          // Unique episode identifier
  personaCode: string;        // Persona for styling lookup
  franchiseId?: string;       // Optional franchise identifier
  renderProfile: RenderProfile; // Output format/aspect ratio
  duration: number;           // Total duration in seconds
  frameRate: number;          // Output frame rate (default: 30)
  tracks: Track[];            // Array of tracks
  style: PersonaStyle;        // Styling tokens
  qcFlags: QCFlags;           // Governance flags
  createdAt: string;          // ISO timestamp
  notes?: string;             // Debug notes
  assetManifestPath?: string; // Reference to source manifest
}
```

### Render Profiles

Supported output formats:

| Profile | Resolution | Aspect | Use Case |
|---------|-----------|--------|----------|
| `vertical_1080x1920` | 1080×1920 | 9:16 | TikTok, Reels, Shorts |
| `horizontal_1920x1080` | 1920×1080 | 16:9 | YouTube standard |
| `square_1080x1080` | 1080×1080 | 1:1 | Instagram feed |

### Tracks

Tracks organize clips by type:

```typescript
interface Track {
  id: string;           // Unique track identifier
  type: TrackType;      // 'video' | 'audio' | 'caption' | 'overlay'
  name: string;         // Human-readable name
  clips: Clip[];        // Clips on this track
  volume?: number;      // Track-level volume multiplier
  muted?: boolean;      // Whether track is muted
}
```

### Clips

Individual media elements on a track:

```typescript
interface Clip {
  id: string;                    // Unique clip identifier
  type: ClipType;                // Type of content
  assetRef?: string;             // Reference to asset in manifest
  startTime: number;             // Start position (seconds)
  duration: number;              // Length (seconds)
  layer: number;                 // Z-index (higher = on top)
  volume?: number;               // Volume for audio (0.0-1.0)
  captions?: CaptionSegment[];   // For caption clips
  transitionIn?: TransitionPreset;
  transitionOut?: TransitionPreset;
  motion?: MotionPreset;
  meta?: Record<string, unknown>;
}
```

**Clip Types:**
- `background` - Static or video background
- `voice` - TTS audio
- `music` - Background music
- `sfx` - Sound effects
- `caption` - Text overlay/subtitle
- `image` - Static image overlay
- `transition` - Transition effect

### Caption Segments

Timed text for subtitles:

```typescript
interface CaptionSegment {
  id: string;        // Segment identifier
  startTime: number; // Start time (seconds)
  endTime: number;   // End time (seconds)
  text: string;      // Caption text
  speaker?: string;  // Optional speaker ID
  words?: CaptionWord[]; // Word-level timing
}
```

### Persona Styling

Visual style tokens resolved at build time:

```typescript
interface PersonaStyle {
  personaCode: string;
  primaryColor: string;         // Hex color
  secondaryColor: string;       // Hex color
  fontFamily: string;           // Font name
  captionPosition: CaptionPosition;
  motionPreset: MotionPreset;
  transitionPreset: TransitionPreset;
  defaultRenderProfile?: RenderProfile;
}
```

Styles are configured in `render-stack/config/persona_styles.json`.

### QC Flags

Governance and review indicators:

```typescript
interface QCFlags {
  contentWarnings: string[];      // e.g., ["mature themes"]
  needsHumanReview: boolean;      // Requires manual approval
  reviewReason?: string;          // Why review is needed
  captionLengthExceeded?: boolean;
  durationExceeded?: boolean;
  notes?: string[];               // Additional QC notes
}
```

**Automatic QC Checks:**
- Caption length > 80 characters → `needsHumanReview`
- Duration > 180 seconds → `needsHumanReview`

## Example Timeline

```json
{
  "timelineVersion": "1.0.0",
  "episodeId": "test_001",
  "personaCode": "ADDIS",
  "franchiseId": "SL18_CORE",
  "renderProfile": "vertical_1080x1920",
  "duration": 42.5,
  "frameRate": 30,
  "tracks": [
    {
      "id": "track_video",
      "type": "video",
      "name": "Background",
      "clips": [
        {
          "id": "clip_background",
          "type": "background",
          "assetRef": "bg_gradient",
          "startTime": 0,
          "duration": 42.5,
          "layer": 0,
          "motion": "subtle-zoom"
        }
      ]
    },
    {
      "id": "track_voice",
      "type": "audio",
      "name": "Voice",
      "clips": [
        {
          "id": "clip_voice",
          "type": "voice",
          "assetRef": "voice_main",
          "startTime": 0,
          "duration": 42.5,
          "layer": 10,
          "volume": 1.0
        }
      ]
    },
    {
      "id": "track_captions",
      "type": "caption",
      "name": "Captions",
      "clips": [
        {
          "id": "clip_captions",
          "type": "caption",
          "startTime": 0,
          "duration": 42.5,
          "layer": 20,
          "captions": [
            {
              "id": "caption_0",
              "startTime": 0,
              "endTime": 3.5,
              "text": "When your Ethiopian auntie discovers ChatGPT"
            }
          ]
        }
      ]
    }
  ],
  "style": {
    "personaCode": "ADDIS",
    "primaryColor": "#FF6B35",
    "secondaryColor": "#004E89",
    "fontFamily": "Inter",
    "captionPosition": "bottom-center",
    "motionPreset": "subtle-zoom",
    "transitionPreset": "fade"
  },
  "qcFlags": {
    "contentWarnings": [],
    "needsHumanReview": false
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "assetManifestPath": "assets/test_001/manifest.json"
}
```

## Building Timelines

Use the timeline builder CLI:

```bash
# Build timeline for an episode
npx tsx render-stack/builder/build-timeline.ts \
  --episodeId test_001 \
  --manifest assets/test_001/manifest.json

# With custom render profile
npx tsx render-stack/builder/build-timeline.ts \
  -e test_001 \
  -m assets/test_001/manifest.json \
  --profile horizontal_1920x1080

# Skip QC validation
npx tsx render-stack/builder/build-timeline.ts \
  -e test_001 \
  -m assets/test_001/manifest.json \
  --skip-qc
```

Output is written to `timelines/{episodeId}/timeline.json`.

## Asset Manifest

The timeline builder consumes an asset manifest that describes available media:

```json
{
  "manifestVersion": "1.0.0",
  "episode": {
    "episodeId": "test_001",
    "title": "Test Episode",
    "personaCode": "ADDIS",
    "language": "en"
  },
  "generation": {
    "scriptSource": "gpt-4",
    "ttsProvider": "elevenlabs",
    "voiceId": "voice_id_here"
  },
  "assets": [
    {
      "id": "voice_main",
      "type": "voice",
      "path": "voice.mp3",
      "format": "mp3",
      "duration": 42.5
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Integration Points

1. **AI Generation** → Asset Manifest → Timeline Builder
2. **Timeline Builder** → Timeline JSON → Render Worker
3. **Render Worker** → master.mp4 → Storage Adapter → Publishing

## Versioning

When making breaking changes:
1. Increment `timelineVersion` in the schema
2. Update `TIMELINE_SCHEMA_VERSION` constant
3. Add migration logic to render worker if needed
4. Document changes in this file

## Related Files

- `render-stack/types/timeline.types.ts` - TypeScript definitions
- `render-stack/types/assetManifest.types.ts` - Manifest types
- `render-stack/builder/build-timeline.ts` - Builder implementation
- `render-stack/config/persona_styles.json` - Persona styling
