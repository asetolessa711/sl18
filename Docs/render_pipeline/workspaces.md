# Creative Workspaces Guide

Phase 9 of the SL18 Render Stack introduces **Creative Workspaces**, enabling genre-specific creative pipelines for different types of content.

## Overview

Workspaces allow operators to tailor rendering, styling, and QC rules for different content genres:

- **Drama** - Pacing thresholds and emotional beat detection
- **Music** - Loudness normalization and beat synchronization
- **Comedy** - Punchline timing and joke spacing
- **Educational** - Concept pacing and visual aid detection
- **Documentary** - Scene pacing for storytelling
- **News** - Information density rules
- **Lifestyle** - Casual pacing
- **Gaming** - Fast-paced editing
- **Custom** - User-defined rules

## Architecture

```
render-stack/workspaces/
├── workspace.types.ts      # Type definitions
├── workspace-manager.ts    # CRUD operations and QC logic
└── index.ts               # Module exports

apps/control-panel/backend/src/
└── workspace-api.ts        # REST API endpoints
```

## REST API

### Create Workspace

```http
POST /api/workspace
Content-Type: application/json

{
  "name": "Drama Series",
  "description": "Workspace for dramatic content",
  "genre": "drama",
  "tags": ["series", "long-form"]
}
```

**Response:**
```json
{
  "success": true,
  "workspace": {
    "id": "ws_1234567890_abc123",
    "name": "Drama Series",
    "genre": "drama",
    "status": "active",
    "personaTemplates": [...],
    "qcConfig": {...},
    "platformSettings": [...]
  }
}
```

### List Workspaces

```http
GET /api/workspace?genre=drama&status=active&limit=10
```

**Query Parameters:**
- `genre` - Filter by content genre
- `status` - Filter by status (active, draft, archived)
- `tags` - Filter by tags (comma-separated)
- `search` - Search by name or description
- `offset` - Pagination offset
- `limit` - Results per page

### Get Workspace

```http
GET /api/workspace/:id
```

### Update Workspace

```http
PUT /api/workspace/:id
Content-Type: application/json

{
  "name": "Updated Drama Series",
  "status": "active"
}
```

### Delete Workspace

```http
DELETE /api/workspace/:id
```

### Preview Workspace

```http
GET /api/workspace/:id/preview?sampleText=Hello%20World

# Or with POST for complex options:
POST /api/workspace/:id/preview
Content-Type: application/json

{
  "sampleText": "This is a sample caption",
  "templateId": "tmpl_abc123",
  "renderProfile": "vertical_1080x1920"
}
```

### Add Persona Template

```http
POST /api/workspace/:id/template
Content-Type: application/json

{
  "templateName": "Custom Style",
  "primaryColor": "#FF0000",
  "secondaryColor": "#0000FF",
  ...
}
```

### Remove Persona Template

```http
DELETE /api/workspace/:id/template/:templateId
```

### Clone Workspace

```http
POST /api/workspace/:id/clone
Content-Type: application/json

{
  "name": "Cloned Drama Series"
}
```

### Apply QC Rules

```http
POST /api/workspace/:id/qc-check
Content-Type: application/json

{
  "duration": 300,
  "captions": [
    { "text": "Scene 1 caption", "duration": 5 }
  ],
  "sceneDurations": [10, 30, 60],
  "loudnessData": {
    "integrated": -14,
    "truePeak": -1
  }
}
```

**Response:**
```json
{
  "success": true,
  "passed": true,
  "violations": [],
  "warnings": ["Loudness slightly off target"],
  "genreChecks": {
    "dramaPacing": true,
    "musicLoudness": true
  }
}
```

### Get Genre List

```http
GET /api/workspace/meta/genres
```

### Get Workspace Statistics

```http
GET /api/workspace/meta/stats
```

## Genre-Specific QC Rules

### Drama

| Rule | Default | Description |
|------|---------|-------------|
| `minSceneDuration` | 5s | Minimum scene length |
| `maxSceneDuration` | 120s | Maximum scene length |
| `emotionalBeatsPerMinute` | 2 | Target emotional beats |
| `dramaticPauseDuration` | 1.5s | Pause after dramatic moments |

### Music

| Rule | Default | Description |
|------|---------|-------------|
| `targetLoudness` | -14 LUFS | Target integrated loudness |
| `maxTruePeak` | -1 dBTP | Maximum true peak |
| `loudnessRange` | 8 LU | Acceptable loudness range |
| `normalizeEnabled` | true | Enable loudness normalization |
| `beatSensitivity` | 0.7 | Beat detection sensitivity (0-1) |

### Comedy

| Rule | Default | Description |
|------|---------|-------------|
| `punchlinePause` | 2s | Pause after punchline |
| `maxSetupDuration` | 30s | Maximum setup before punchline |
| `minJokeSpacing` | 5s | Minimum time between jokes |
| `detectLaughTrack` | true | Enable laugh track detection |

### Educational

| Rule | Default | Description |
|------|---------|-------------|
| `maxConceptsPerMinute` | 3 | Maximum new concepts per minute |
| `minExplanationDuration` | 10s | Minimum explanation per concept |
| `recapFrequency` | 5 | Recap every N minutes |
| `detectVisualAids` | true | Detect visual aid usage |

## Persona Templates

Each workspace can have multiple persona templates that define visual styling:

```typescript
interface WorkspacePersonaTemplate {
  templateId: string;
  templateName: string;
  primaryColor: string;           // Hex color
  secondaryColor: string;         // Hex color
  fontFamily: string;
  captionPosition: CaptionPosition;
  motionPreset: MotionPreset;
  transitionPreset: TransitionPreset;
  defaultRenderProfile?: RenderProfile;
  captionStyle: WorkspaceCaptionStyle;
  overlays: OverlayTemplate[];
  transitions: WorkspaceTransitions;
  audio: WorkspaceAudioConfig;
}
```

### Caption Styling

```typescript
interface WorkspaceCaptionStyle {
  fontFamily: string;
  fontSize: number;              // In pixels
  fontWeight: 'normal' | 'bold' | 'light';
  textColor: string;             // Hex color
  backgroundColor: string;       // RGBA color
  textShadow: boolean;
  position: CaptionPosition;
  animation: 'none' | 'fade' | 'typewriter' | 'bounce' | 'slide';
  maxCharsPerLine: number;
  maxLines: number;
}
```

### Audio Configuration

```typescript
interface WorkspaceAudioConfig {
  musicVolume: number;           // 0-1
  voiceVolume: number;           // 0-1
  sfxVolume: number;             // 0-1
  autoDucking: boolean;          // Lower music during voice
  duckingReduction: number;      // In dB
  musicFadeDuration: number;     // In seconds
}
```

## Platform Export Settings

Each workspace can configure platform-specific export settings:

```typescript
interface PlatformExportSettings {
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok';
  enabled: boolean;
  renderProfile: RenderProfile;
  maxDuration: number;           // In seconds
  autoThumbnails: boolean;
  defaultHashtags: string[];
  descriptionTemplate: string;   // Supports {{title}}, {{description}}, {{hashtags}}
}
```

## Example Workflows

### Creating a Drama Workspace

```javascript
// 1. Create workspace
const response = await fetch('/api/workspace', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Crime Drama Series',
    description: 'Workspace for crime drama episodes',
    genre: 'drama',
    tags: ['crime', 'thriller']
  })
});
const { workspace } = await response.json();

// 2. Preview with sample caption
const preview = await fetch(`/api/workspace/${workspace.id}/preview`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sampleText: 'The detective examined the evidence carefully.'
  })
});

// 3. Check QC rules for an episode
const qcResult = await fetch(`/api/workspace/${workspace.id}/qc-check`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    duration: 2400,  // 40 minutes
    captions: episodeCaptions,
    sceneDurations: [30, 45, 60, 90, 120]
  })
});
```

### Cloning and Customizing

```javascript
// Clone an existing workspace
const cloned = await fetch(`/api/workspace/${originalId}/clone`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Crime Drama - Season 2'
  })
});

// Update with new settings
const updated = await fetch(`/api/workspace/${clonedId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qcConfig: {
      maxShortFormDuration: 90,
      warningKeywords: ['violence', 'graphic']
    }
  })
});
```

## Integration with Render Pipeline

Workspaces integrate with the existing render pipeline:

1. **Timeline Building** - Apply persona template styling during `build-timeline`
2. **Rendering** - Use workspace audio config for mixing
3. **QC** - Apply genre-specific rules during QC checks
4. **Publishing** - Use platform settings for export

```typescript
// Example: Apply workspace styling to timeline
import { WorkspaceManager } from '../render-stack/workspaces';
import { buildTimeline } from '../render-stack/builder/build-timeline';

const workspace = WorkspaceManager.get(workspaceId);
const template = workspace.personaTemplates.find(
  t => t.templateId === workspace.defaultPersonaTemplateId
);

const timeline = await buildTimeline({
  episodeId,
  manifestPath,
  personaOverride: {
    primaryColor: template.primaryColor,
    secondaryColor: template.secondaryColor,
    fontFamily: template.fontFamily,
    captionPosition: template.captionStyle.position
  }
});
```

## Testing

Run workspace tests:

```bash
npm test -- tests/workspace.test.ts
```

Tests cover:
- Workspace CRUD operations
- Genre-specific QC rules
- Persona template management
- Cloning and preview functionality
- Platform settings

## Environment Variables

No additional environment variables required for workspaces. All configuration is stored in memory (or database in production).

## Troubleshooting

### Common Issues

1. **QC rules not applying** - Ensure the workspace genre matches the expected rule set
2. **Missing templates** - Every workspace must have at least one persona template
3. **Preview failing** - Check that the templateId exists in the workspace

### Debug Endpoints

```http
# Get workspace statistics
GET /api/workspace/meta/stats

# List all available genres
GET /api/workspace/meta/genres
```
