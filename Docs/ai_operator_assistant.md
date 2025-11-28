# AI Operator Assistant Guide

This document provides comprehensive guidance on configuring and using the SL18 AI Operator Assistant.

## Overview

The AI Operator Assistant is an intelligent conversational interface embedded in the SL18 operator console and mobile app. It provides:

- **Natural language queries** for navigation and actions
- **Contextual guidance** with explanations and help
- **Proactive alerts** with suggested remediation
- **Intelligent recommendations** based on context and history
- **Voice interaction** support (see [Voice Control Guide](./voice_control.md))

## Getting Started

### Enabling the Assistant

The assistant is enabled by default for all operators. Configuration is managed per-operator:

```json
{
  "assistantId": "assistant-ops-001",
  "version": "1.0.0",
  "operatorId": "operator-001",
  "status": "active",
  "capabilities": {
    "naturalLanguageQueries": true,
    "contextualGuidance": true,
    "proactiveAlerts": true,
    "voiceInteraction": true
  }
}
```

### First Interaction

When you first access the assistant, it will offer an onboarding flow:

1. Welcome message introducing the assistant
2. Option to explore key modules (QC, Marketplace, Distribution)
3. Quick tour of available commands

## Supported Commands

### Navigation Commands

Navigate to any panel or module using natural language:

| Example Query | Action |
|--------------|--------|
| "Show me QC alerts" | Navigate to QC dashboard |
| "Go to marketplace" | Open contributor marketplace |
| "Take me to insights" | Navigate to audience insights |
| "Open distribution settings" | Navigate to distribution panel |
| "Switch to Amharic" | Change workspace language |

### Query Commands

Ask questions about metrics, status, and data:

| Example Query | Response |
|--------------|----------|
| "How many pending QC items?" | Count of pending items |
| "What's the engagement rate for Kenya?" | Regional engagement metrics |
| "Status of recent distributions" | Distribution pipeline status |

### Action Commands

Execute actions through natural language (some require confirmation):

| Example Query | Action | Confirmation |
|--------------|--------|--------------|
| "Approve all translations for episode 5" | Batch approval | Required |
| "Acknowledge this alert" | Dismiss alert | Not required |
| "Flag persona inconsistency" | Create QC flag | Required |
| "Trigger distribution to YouTube" | Start distribution | Required |

### Help Commands

Get contextual help and explanations:

| Example Query | Response |
|--------------|----------|
| "What does cultural sensitivity mean?" | Definition and context |
| "How do I configure pricing?" | Link to documentation |
| "Explain retention curves" | Metric explanation |

## Contextual Understanding

The assistant maintains context awareness:

### Current Context

```json
{
  "context": {
    "franchiseId": "kenya-001",
    "seriesId": "series-drama-001",
    "language": "en",
    "region": "africa-east",
    "panel": "qc_dashboard"
  }
}
```

### Recent Actions

The assistant tracks your last 10 actions to provide relevant suggestions:

```json
{
  "recentActions": [
    { "action": "view_alerts", "timestamp": "2025-01-15T10:00:00Z" },
    { "action": "switch_language", "timestamp": "2025-01-15T09:55:00Z" }
  ]
}
```

## Proactive Alerts

The assistant proactively notifies you about issues requiring attention:

### Alert Types

| Type | Description | Default Threshold |
|------|-------------|-------------------|
| Anomalies | QC drops, fraud spikes, publishing errors | Medium |
| QC Issues | Translation quality, persona consistency | Low |
| Cultural Sensitivity | Content flagged for cultural review | Low |
| Monetization | Pricing opportunities, churn risks | Medium |
| Retention Risks | Engagement drops, subscriber churn | Medium |

### Configuration

```json
{
  "proactiveAlerts": {
    "enabled": true,
    "alertTypes": {
      "anomalies": {
        "enabled": true,
        "threshold": "medium",
        "autoSuggestRemediation": true
      },
      "culturalSensitivity": {
        "enabled": true,
        "threshold": "low",
        "autoSuggestRemediation": true
      }
    },
    "notificationMode": "inline"
  }
}
```

### Example Proactive Alert

```
⚠️ QC Drop Detected

QC pass rate has dropped below 85% for Kiswahili translations 
in the last hour.

Suggested Remediation:
Review recent Kiswahili translations and check translator quality.

[View QC Dashboard] [Dismiss]
```

## Recommendation Engine

The assistant provides intelligent recommendations based on:

- **Current context** (70% weight by default)
- **Operator history** (30% weight by default)

### Recommendation Categories

1. **Navigation** - Suggested panels to visit
2. **QC Actions** - Items requiring review
3. **Monetization** - Revenue opportunities
4. **Personalization** - Content optimization
5. **Troubleshooting** - Issue resolution
6. **Optimization** - Workflow improvements

### Example Recommendation

```
📊 Recommendation: Review pending QC items

You have 5 pending QC items for the Kenya franchise that need attention.

Context match: 92%
Priority: High

[Go to QC Dashboard]
```

## Conversational Flows

The assistant supports multi-turn conversations for complex workflows:

### Onboarding Flow

```
Assistant: Welcome to SL18! I'm your AI assistant. Let me show you around.
           What would you like to explore first?
           
           [QC Dashboard] [Marketplace] [Skip tour]
           
Operator:  [Clicks QC Dashboard]