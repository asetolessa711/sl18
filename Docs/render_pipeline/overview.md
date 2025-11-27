# SL18 Render Pipeline Overview

## Purpose

The SL18 Render Pipeline replaces CapCut as the primary render bottleneck, providing a deterministic, reproducible, and fully-owned video rendering system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI GENERATION LAYER                               │
│  Script → TTS → Music → Assets                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ Asset Manifest  │
                          │   manifest.json │
                          └─────────────────┘
                                    │
                                    ▼
                        ┌───────────────────┐
                        │  Timeline Builder │
                        │ build-timeline.ts │
                        └───────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   Timeline JSON │
                          │  timeline.json  │
                          └─────────────────┘
                                    │
                                    ▼
                        ┌───────────────────┐
                        │   Render Worker   │
                        │ render-worker.ts  │  ← ffmpeg
                        └───────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   master.mp4    │
                          └─────────────────┘
                                    │
                                    ▼
                        ┌───────────────────┐
                        │  Storage Adapter  │
                        └───────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PUBLISHING LAYER                                  │
│  YouTube │ Meta (IG/FB) │ TikTok Export                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Timeline Schema (`render-stack/types/`)

TypeScript definitions for the core data structures:
- `timeline.types.ts` - Timeline, Track, Clip, Caption, Styling, QC
- `assetManifest.types.ts` - Asset metadata and episode info

### 2. Timeline Builder (`render-stack/builder/`)

Converts asset manifests into structured timeline JSON:
- Parses SRT/VTT/JSON transcripts
- Applies persona styling
- Runs QC validation
- Outputs `timeline.json`

### 3. Render Worker (`render-stack/worker/`) [Phase 2]

Consumes timeline JSON and produces video:
- ffmpeg-based composition
- Audio mixing (voice + music)
- Caption burning
- Background motion effects

### 4. Storage Adapter (`render-stack/storage/`) [Phase 3]

Handles file uploads:
- LocalStorageAdapter (development)
- Azure/S3 adapters (production)
- Returns URL for publishing

### 5. Render API [Phase 2]

REST endpoints for job management:
- `POST /api/render` - Queue render job
- `GET /api/render/:episodeId/status` - Poll job state

## Directory Structure

```
render-stack/
├── types/
│   ├── timeline.types.ts       # Timeline schema definitions
│   ├── assetManifest.types.ts  # Asset manifest schema
│   └── index.ts                # Barrel export
├── builder/
│   └── build-timeline.ts       # Timeline builder CLI
├── worker/
│   └── render-worker.ts        # Render worker (Phase 2)
├── storage/
│   └── adapters/               # Storage adapters (Phase 3)
└── config/
    └── persona_styles.json     # Persona styling tokens

assets/
└── {episodeId}/
    ├── manifest.json           # Asset manifest
    ├── voice.mp3               # TTS audio
    ├── music.mp3               # Background music
    ├── background.png          # Background image
    └── transcript.srt          # Captions

timelines/
└── {episodeId}/
    └── timeline.json           # Built timeline

renders/
└── {episodeId}/
    └── master.mp4              # Final render
```

## Quick Start

### Build a Timeline

```bash
# Build timeline for test episode
npx tsx render-stack/builder/build-timeline.ts \
  --episodeId test_001 \
  --manifest assets/test_001/manifest.json
```

### View Output

Timeline is saved to `timelines/test_001/timeline.json`

## Render Profiles

| Profile | Resolution | Use Case |
|---------|-----------|----------|
| `vertical_1080x1920` | 9:16 | TikTok, Reels, Shorts |
| `horizontal_1920x1080` | 16:9 | YouTube |
| `square_1080x1080` | 1:1 | Instagram feed |

## Persona Styling

Configured in `render-stack/config/persona_styles.json`:

```json
{
  "ADDIS": {
    "personaCode": "ADDIS",
    "primaryColor": "#FF6B35",
    "secondaryColor": "#004E89",
    "fontFamily": "Inter",
    "captionPosition": "bottom-center",
    "motionPreset": "subtle-zoom",
    "transitionPreset": "fade"
  }
}
```

## QC Governance

Automatic checks flag episodes for human review:
- Caption length > 80 characters
- Duration > 180 seconds (3 minutes)
- Content warnings

QC flags are embedded in `timeline.json` and surfaced in the control panel.

## Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| 1 | Timeline Schema | ✅ Complete |
| 1 | Timeline Builder | ✅ Complete |
| 1 | Test Fixtures | ✅ Complete |
| 2 | Render Worker | 🔜 Next |
| 2 | Render API | 🔜 Next |
| 3 | Storage Adapter | ⏳ Planned |
| 3 | Publishing Integration | ⏳ Planned |
| 4 | Persona Styling UI | ⏳ Planned |
| 4 | QC Dashboard | ⏳ Planned |

## Related Documentation

- [Timeline Schema](./timeline_schema.md) - Detailed schema reference
- [Asset Manifest](./asset_manifest.md) - Asset manifest format
- [Render Worker](./render_worker.md) - Render implementation (Phase 2)
- [Storage Adapters](./storage_adapters.md) - Storage setup (Phase 3)

## Migration from CapCut

CapCut can remain as an optional backup for complex edits. The new pipeline:
1. Removes hard dependency on CapCut API
2. Makes renders deterministic and reproducible
3. Enables programmatic styling via persona tokens
4. Integrates governance via QC flags
