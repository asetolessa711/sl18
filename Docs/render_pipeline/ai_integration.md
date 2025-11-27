# AI Integration Guide

## Overview

Phase 10 introduces AI-assisted creative and QC capabilities with configurable autonomy levels. The AI integration supports three operating modes that determine how AI tasks are handled:

- **Human-Lead**: Operators drive all decisions; AI provides suggestions only
- **Human-Assisted**: AI drafts content; operators review and approve before application
- **Fully AI**: AI generates, validates, and publishes autonomously

## Operating Modes

### Human-Lead Mode
Best for: High-stakes content, brand-sensitive material, new content types

| Feature | Behavior |
|---------|----------|
| Script Generation | AI suggests scripts, operator edits and applies manually |
| Styling | AI provides styling suggestions for review only |
| QC | AI flags issues, operator decides on all fixes |
| Publishing | Manual publish/export only |

### Human-Assisted Mode
Best for: Regular production content, established workflows

| Feature | Behavior |
|---------|----------|
| Script Generation | AI drafts complete scripts, operator reviews and approves |
| Styling | AI pre-applies high-confidence styling, operator confirms |
| QC | AI flags issues and recommends fixes, operator approves |
| Publishing | One-click publish after AI preparation and approval |

### Fully AI Mode
Best for: High-volume content, time-sensitive material, established templates

| Feature | Behavior |
|---------|----------|
| Script Generation | AI drafts and auto-applies scripts |
| Styling | AI auto-applies styling based on genre and persona |
| QC | AI enforces QC pass/fail autonomously |
| Publishing | Auto-publish to supported platforms (where APIs allow) |

## API Reference

### Mode Configuration

#### Get Current Mode
```http
GET /api/ai/mode?workspaceId=optional
```

Response:
```json
{
  "config": {
    "mode": "humanAssisted",
    "autoApplyThreshold": 0.85,
    "humanReviewRiskThreshold": 0.3,
    "autonomousPublishing": false,
    "maxAutoApprovalsPerHour": 50,
    "enabledFeatures": ["script_generation", "styling_suggestions", "qc_assistance"]
  },
  "behavior": {
    "name": "Human-Assisted",
    "description": "AI drafts content, operators approve before application."
  },
  "workspaceId": "global"
}
```

#### Set Mode Configuration
```http
PUT /api/ai/mode
Content-Type: application/json

{
  "workspaceId": "workspace-123",  // optional, defaults to global
  "mode": "humanAssisted",
  "autoApplyThreshold": 0.9,
  "enabledFeatures": ["script_generation", "qc_assistance"]
}
```

### Script Generation

#### Generate Script
```http
POST /api/ai/script
Content-Type: application/json

{
  "contentId": "episode-001",
  "genre": "comedy",
  "personaCode": "HABESHA_HUMOR",
  "topic": "Ethiopian coffee culture",
  "targetDuration": 120,
  "context": "Focus on traditional aspects",
  "workspaceId": "comedy-workspace",
  "modeOverride": "humanAssisted"  // optional
}
```

Response:
```json
{
  "requestId": "task-uuid",
  "status": "awaiting_approval",
  "script": {
    "text": "Full script text...",
    "segments": [
      {
        "id": "seg-1",
        "type": "intro",
        "text": "Welcome to today's episode...",
        "duration": 5,
        "speaker": "HABESHA_HUMOR",
        "visualNotes": "Title card with persona branding"
      }
    ],
    "estimatedDuration": 118,
    "wordCount": 450
  },
  "confidence": "high",
  "confidenceScore": 0.82,
  "suggestions": [
    {
      "id": "sug-1",
      "type": "engagement",
      "suggested": "Add a question to increase viewer engagement",
      "reason": "Questions increase comment engagement by 40%",
      "impact": 0.7
    }
  ],
  "autoApplied": false,
  "requiresApproval": true,
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

### Styling Suggestions

#### Generate Styling
```http
POST /api/ai/styling
Content-Type: application/json

{
  "contentId": "episode-001",
  "genre": "drama",
  "personaCode": "ADDIS",
  "targetPlatform": "youtube",
  "workspaceId": "drama-workspace"
}
```

Response:
```json
{
  "requestId": "task-uuid",
  "status": "completed",
  "styling": {
    "captions": {
      "fontFamily": "Inter",
      "fontSize": 24,
      "textColor": "#FFFFFF",
      "backgroundColor": "rgba(0,0,0,0.7)",
      "position": "bottom",
      "animation": "fade",
      "reasoning": "Drama content benefits from clean caption styling"
    },
    "colors": {
      "primary": "#8B0000",
      "secondary": "#2F4F4F",
      "accent": "#FFD700",
      "paletteName": "Drama Standard",
      "reasoning": "Colors optimized for drama content engagement"
    },
    "transitions": {
      "defaultTransition": "dissolve",
      "transitionDuration": 1.5,
      "reasoning": "Drama pacing prefers smooth transitions"
    }
  },
  "confidence": "high",
  "confidenceScore": 0.88,
  "preApplied": true,
  "requiresConfirmation": true
}
```

### QC Assistance

#### Perform QC Check
```http
POST /api/ai/qc
Content-Type: application/json

{
  "contentId": "episode-001",
  "genre": "comedy",
  "timeline": {
    "captions": [...],
    "tracks": [...]
  },
  "workspaceId": "comedy-workspace"
}
```

Response:
```json
{
  "requestId": "task-uuid",
  "status": "awaiting_approval",
  "passed": false,
  "score": 75,
  "issues": [
    {
      "id": "issue-1",
      "type": "caption_length",
      "severity": "warning",
      "description": "Caption exceeds 150 characters (168 chars)",
      "location": { "startTime": 45.5, "endTime": 50.2 },
      "autoFixable": true
    }
  ],
  "recommendedFixes": [
    {
      "id": "fix-1",
      "issueId": "issue-1",
      "type": "suggested",
      "description": "Split long caption into shorter segments",
      "action": {
        "operation": "split_caption",
        "parameters": { "captionId": "cap-12", "maxLength": 150 }
      },
      "confidence": "high",
      "applied": false
    }
  ],
  "riskLevel": "medium",
  "requiresHumanDecision": true
}
```

### Task Management

#### List Tasks
```http
GET /api/ai/tasks?type=script&status=awaiting_approval&limit=20
```

#### Get Task Details
```http
GET /api/ai/tasks/:taskId
```

#### Approve Task
```http
POST /api/ai/tasks/:taskId/approve
Content-Type: application/json

{
  "approvedBy": "operator@example.com"
}
```

#### Reject Task
```http
POST /api/ai/tasks/:taskId/reject
Content-Type: application/json

{
  "rejectedBy": "operator@example.com",
  "reason": "Content not appropriate for brand guidelines"
}
```

### Audit Log

#### Get Audit Log
```http
GET /api/ai/audit?taskId=optional&action=approved&limit=50
```

Response:
```json
{
  "entries": [
    {
      "id": "entry-uuid",
      "taskId": "task-uuid",
      "action": "approved",
      "actor": "operator@example.com",
      "timestamp": "2024-01-15T10:35:00Z",
      "details": {}
    }
  ],
  "count": 1
}
```

### Statistics

#### Get AI Stats
```http
GET /api/ai/stats
```

Response:
```json
{
  "totalTasks": 150,
  "byStatus": {
    "completed": 120,
    "approved": 15,
    "awaiting_approval": 10,
    "rejected": 5
  },
  "byType": {
    "script": 50,
    "styling": 60,
    "qc": 40
  },
  "byMode": {
    "humanLead": 20,
    "humanAssisted": 100,
    "fullyAI": 30
  },
  "autoApprovalRate": 0.65,
  "averageConfidence": 0.82
}
```

## Environment Variables

```bash
# AI Provider Configuration
OPENAI_API_KEY=sk-...          # OpenAI API key for GPT models
ANTHROPIC_API_KEY=sk-ant-...   # Anthropic API key (optional)

# AI Feature Flags
AI_DEFAULT_MODE=humanAssisted  # Default operating mode
AI_SCRIPT_ENABLED=true         # Enable script generation
AI_STYLING_ENABLED=true        # Enable styling suggestions
AI_QC_ENABLED=true             # Enable QC assistance

# Rate Limiting
AI_MAX_REQUESTS_PER_MINUTE=60  # Max AI requests per minute
AI_MAX_AUTO_APPROVALS_HOUR=50  # Max auto-approvals per hour
```

## Workspace Integration

AI mode can be configured per workspace:

```typescript
// Set drama workspace to human-lead (more oversight)
await setModeConfig('drama-workspace', { 
  mode: 'humanLead',
  enabledFeatures: ['qc_assistance', 'styling_suggestions']
});

// Set news workspace to fully-AI (speed priority)
await setModeConfig('news-workspace', { 
  mode: 'fullyAI',
  autonomousPublishing: true,
  maxAutoApprovalsPerHour: 100
});
```

## Confidence Thresholds

In Human-Assisted mode, AI tasks are auto-applied based on confidence:

| Confidence Score | Level | Auto-Apply |
|-----------------|-------|------------|
| ≥ 0.90 | Very High | Yes |
| ≥ 0.75 | High | Depends on threshold |
| ≥ 0.50 | Medium | No |
| < 0.50 | Low | No |

Default auto-apply threshold: `0.85`

## Operator Workflow

### Human-Lead Mode
1. Operator requests AI suggestions
2. AI generates options
3. Operator reviews all suggestions
4. Operator manually applies selected changes
5. Operator triggers publish/export

### Human-Assisted Mode
1. AI generates draft content
2. High-confidence items are pre-applied
3. Operator reviews pending approvals
4. Operator approves or rejects tasks
5. Approved content flows to publish queue

### Fully-AI Mode
1. AI generates content automatically
2. AI applies styling and runs QC
3. Passing content auto-publishes (where supported)
4. Operator monitors via dashboard
5. Can intervene for flagged items

## Safety Considerations

- **Risk-based override**: High-risk content always requires human review
- **Audit trail**: All AI actions are logged
- **Rate limiting**: Prevents runaway automation
- **Kill switch**: Mode can be changed to humanLead instantly
- **Content filtering**: Sensitive keywords trigger manual review

## Troubleshooting

### Task Stuck in "Processing"
- Check AI provider API status
- Verify API key is valid
- Check rate limits

### Low Confidence Scores
- Provide more context in requests
- Use genre-specific prompts
- Check persona configuration

### Auto-Apply Not Working
- Verify mode is not humanLead
- Check autoApplyThreshold setting
- Confirm feature is enabled

## Next Steps

- [ ] Connect to OpenAI/Anthropic APIs (currently mock implementation)
- [ ] Add content moderation integration
- [ ] Implement engagement prediction
- [ ] Add thumbnail generation
- [ ] Build Control Panel UI for mode selection
