# Voice Control Guide

This document provides comprehensive guidance on configuring and using voice control in SL18.

## Overview

Voice control enables hands-free operation of SL18 through:

- **Wake word activation** ("Hey SL18")
- **Voice navigation** across panels and modules
- **Voice QC actions** (approve, reject, flag)
- **Multilingual voice recognition** (9+ languages)
- **Accessibility features** for operators with limited input capability

## Getting Started

### Enabling Voice Control

Voice control is disabled by default. To enable:

1. Navigate to **Settings > Accessibility > Voice Control**
2. Toggle **Enable Voice Control**
3. Grant microphone permissions when prompted
4. Optional: Enable biometric unlock for secure voice actions

```json
{
  "voiceControlId": "voice-001",
  "enabled": true,
  "status": "listening",
  "wakeWord": {
    "enabled": true,
    "phrase": "Hey SL18"
  }
}
```

### Microphone Setup

1. **Grant permissions**: Allow microphone access when prompted
2. **Test microphone**: Speak "Hey SL18" and wait for confirmation
3. **Adjust sensitivity**: Lower for noisy environments, higher for quiet

## Wake Word

### Activation

Say **"Hey SL18"** to activate voice control. The system will:

1. Play a confirmation sound (if enabled)
2. Show a visual indicator (pulsing microphone icon)
3. Begin listening for your command

### Alternative Wake Words

- "SL eighteen"
- "Hey assistant"

### Configuration

```json
{
  "wakeWord": {
    "enabled": true,
    "phrase": "Hey SL18",
    "alternatives": ["SL eighteen", "Hey assistant"],
    "sensitivity": 0.5,
    "confirmationSound": true,
    "visualIndicator": true
  }
}
```

## Voice Commands

### Navigation Commands

| Voice Command | Action |
|--------------|--------|
| "Show QC alerts" | Navigate to QC dashboard |
| "Open marketplace" | Navigate to contributor marketplace |
| "Go to insights" | Navigate to audience insights |
| "Take me to distribution" | Navigate to distribution panel |
| "Switch to Amharic" | Change workspace language |

### Alert Commands

| Voice Command | Action |
|--------------|--------|
| "Acknowledge alert" | Acknowledge current alert |
| "Dismiss this alert" | Dismiss current alert |
| "Show critical alerts only" | Filter to critical alerts |

### QC Commands (Require Confirmation)

| Voice Command | Confirmation | Action |
|--------------|--------------|--------|
| "Approve translation" | "Confirm approval?" | Approve current translation |
| "Reject this" | "Confirm rejection?" | Reject current QC item |
| "Flag persona inconsistency" | "Confirm flagging?" | Flag for review |

### Help Commands

| Voice Command | Action |
|--------------|--------|
| "Help" | Show available commands |
| "What can I say?" | List voice commands |
| "Repeat that" | Repeat last response |
| "Spell it out" | Spell the last response |

## Multilingual Voice Support

### Supported Languages

| Language | Code | Recognition | TTS |
|----------|------|-------------|-----|
| English | en | ✅ | ✅ |
| French | fr | ✅ | ✅ |
| Spanish | es | ✅ | ✅ |
| Arabic | ar | ✅ | ✅ |
| Chinese | zh | ✅ | ✅ |
| Italian | it | ✅ | ✅ |
| Amharic | am | ✅ | ✅ |
| Kiswahili | sw | ✅ | ✅ |
| Oromifa | om | ✅ | ✅ |

### Language-Specific Commands

Commands can be spoken in any supported language:

**Kiswahili:**
- "Onyesha makosa ya QC" (Show QC alerts)
- "Fungua dashibodi ya QC" (Open QC dashboard)

**Amharic:**
- "የጥራት ማሳወቂያዎችን አሳይ" (Show QC alerts)
- "የጥራት ዳሽቦርድ ክፈት" (Open QC dashboard)

### Configuration

```json
{
  "multilingualConfig": {
    "commandLanguages": [
      {
        "code": "en",
        "displayName": "English",
        "voiceId": "en-US-Neural2-D"
      },
      {
        "code": "sw",
        "displayName": "Kiswahili",
        "voiceId": "sw-KE-Standard-A",
        "commandMappings": {
          "show alerts": "onyesha tahadhari",
          "approve": "idhinisha"
        }
      },
      {
        "code": "am",
        "displayName": "Amharic",
        "nativeName": "አማርኛ",
        "voiceId": "am-ET-Standard-A"
      }
    ],
    "fallbackLanguage": "en",
    "mixedLanguageSupport": true,
    "rtlLanguageSupport": true
  }
}
```

## Speech Recognition

### Engine Options

| Engine | Features | Best For |
|--------|----------|----------|
| Native | Offline, low latency | Basic commands |
| Google | High accuracy, multilingual | Production use |
| Azure | Enterprise features | Large deployments |
| AWS | Scalable, customizable | AWS environments |
| Whisper | Open source, privacy | On-premise |

### Configuration

```json
{
  "recognition": {
    "engine": "google",
    "primaryLanguage": "en",
    "supportedLanguages": ["en", "sw", "am"],
    "autoDetectLanguage": true,
    "confidenceThreshold": 0.7,
    "noiseReduction": true,
    "echoCancellation": true
  }
}
```

### Confidence Thresholds

Commands are only executed when confidence exceeds the threshold:

- **0.9+**: High confidence - execute immediately
- **0.7-0.9**: Medium confidence - execute with visual confirmation
- **<0.7**: Low confidence - ask for clarification

## Speech Synthesis

### Voice Responses

The assistant responds verbally to:

- Confirm executed actions
- Report errors or failures
- Answer help queries
- Read alerts (optional)

### Configuration

```json
{
  "synthesis": {
    "enabled": true,
    "engine": "google",
    "voice": {
      "id": "en-US-Neural2-D",
      "name": "Neural Voice",
      "language": "en",
      "gender": "neutral"
    },
    "rate": 1,
    "pitch": 1,
    "volume": 1,
    "confirmActions": true,
    "readAlerts": false
  }
}
```

## Accessibility Features

### Speech-to-Text Input

Enable dictation for text fields:

1. Focus on any text input
2. Say "Start dictation"
3. Speak your text
4. Say "Stop dictation"

### Voice Navigation

Navigate UI elements by voice:

- "Next" / "Previous" - Move focus
- "Select" / "Press" - Activate focused element
- "Scroll down" / "Scroll up" - Scroll content

### Screen Reader Integration

Voice control integrates with screen readers:

- VoiceOver (iOS)
- TalkBack (Android)
- NVDA/JAWS (Desktop)

### Configuration

```json
{
  "accessibility": {
    "speechToTextEnabled": true,
    "voiceNavigationEnabled": true,
    "screenReaderIntegration": true,
    "dictationMode": false,
    "slowSpeechMode": false,
    "repeatEnabled": true,
    "spellingMode": true
  }
}
```

## Device Integration

### iOS Integration

- **Siri Shortcuts**: Create custom Siri commands for SL18 actions
- **CarPlay**: Use voice control while driving
- **AirPods**: Activate with tap gestures

### Android Integration

- **Google Assistant**: Link SL18 actions to Assistant routines
- **Bluetooth**: Support for Bluetooth headsets and car systems

### Configuration

```json
{
  "deviceIntegration": {
    "platform": "ios",
    "microphonePermission": "granted",
    "backgroundListening": false,
    "bluetoothMicSupport": true,
    "siriIntegration": true
  }
}
```

## Privacy & Security

### Data Handling

| Setting | Default | Description |
|---------|---------|-------------|
| Local Processing | Off | Process voice locally when possible |
| Recording Retention | None | Don't retain voice recordings |
| Transcript Retention | Session | Keep transcripts for current session |
| Anonymize Data | On | Remove identifying information |
| Share for Improvement | Off | Don't share voice data |

### Configuration

```json
{
  "privacy": {
    "localProcessing": false,
    "recordingRetention": "none",
    "transcriptRetention": "session",
    "anonymizeVoiceData": true,
    "shareVoiceDataForImprovement": false
  }
}
```

### Confirmation for Sensitive Actions

Actions that modify data require verbal confirmation:

```
Operator: "Approve all translations"
Assistant: "Are you sure you want to approve 5 translations?"
Operator: "Yes" / "Confirm"
Assistant: "5 translations approved."
```

## Troubleshooting

### Wake Word Not Detected

1. Check microphone permissions
2. Reduce background noise
3. Increase wake word sensitivity
4. Try alternative wake phrases

### Low Recognition Accuracy

1. Speak clearly and at moderate pace
2. Reduce background noise
3. Switch to a different recognition engine
4. Lower confidence threshold (with caution)

### Commands Not Executing

1. Verify command is supported
2. Check confirmation wasn't dismissed
3. Ensure proper context (correct panel/franchise)
4. Review command in history

## Audit Logging

All voice interactions are logged:

```json
{
  "eventType": "voice_command_executed",
  "category": "voice_control",
  "details": {
    "command": "approve translation",
    "recognizedText": "approve this translation",
    "confidence": 0.89,
    "language": "en",
    "confirmed": true
  }
}
```

## Related Documentation

- [AI Operator Assistant](./ai_operator_assistant.md)
- [Accessibility Guidelines](./cross_platform_ui.md)
- [Mobile Operator App](./mobile_operator_app.md)
