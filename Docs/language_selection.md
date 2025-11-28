# Language Selection & Dynamic Registry Guide

This guide covers configuring multilingual workspaces in SL18, including the dynamic language registry and selection panel.

## Overview

SL18 supports a growing list of languages through a dynamic registry system. Operators can:
- Select any available language at runtime
- Add new languages without code changes
- Toggle languages mid-workflow
- Track QC status per language

## Supported Languages

| Code | Language | Native Name | Direction | Region | Script |
|------|----------|-------------|-----------|--------|--------|
| `en` | English | English | LTR | Global | Latin |
| `fr` | French | Français | LTR | Europe | Latin |
| `es` | Spanish | Español | LTR | Global | Latin |
| `ar` | Arabic | العربية | RTL | Middle East | Arabic |
| `zh-CN` | Chinese (Simplified) | 简体中文 | LTR | Asia | Chinese |
| `it` | Italian | Italiano | LTR | Europe | Latin |
| `om` | Oromifa | Afaan Oromoo | LTR | Africa | Latin |
| `am` | Amharic | አማርኛ | LTR | Africa | Ethiopic |
| `sw` | Kiswahili | Kiswahili | LTR | Africa | Latin |
| `pt` | Portuguese | Português | LTR | Global | Latin |

### Locale Variations

Some languages have regional variants:

| Base | Variant | Region |
|------|---------|--------|
| `pt` | `pt-BR` | Brazil |
| `pt` | `pt-PT` | Portugal |
| `es` | `es-MX` | Mexico |
| `es` | `es-AR` | Argentina |
| `sw` | `sw-KE` | Kenya |
| `sw` | `sw-TZ` | Tanzania |
| `fr` | `fr-CA` | Canada |

## Language Registry

### Registry Structure

The language registry (`schemas/language_pack_registry.schema.json`) contains:

```json
{
  "registryVersion": "1.0.0",
  "lastUpdated": "2025-11-27T00:00:00Z",
  "languages": [
    {
      "code": "am",
      "displayName": "Amharic",
      "nativeName": "አማርኛ",
      "direction": "ltr",
      "region": "Africa",
      "scriptSystem": "ethiopic",
      "qcThresholds": {
        "translationAccuracy": 97,
        "personaConsistency": 92,
        "culturalSensitivity": 98
      },
      "fontRecommendations": ["Noto Sans Ethiopic", "Nyala"],
      "status": "available",
      "loadOnDemand": true
    }
  ],
  "defaultLanguage": "en"
}
```

### Adding New Languages

To add a new language:

1. Add entry to registry with required fields
2. Create language pack configuration
3. Add QC rules and thresholds
4. Create test fixtures
5. Run validation tests

**No code changes required** — the system loads packs dynamically.

## Language Selection Panel

### Panel Features

The selection panel provides:

- **Multi-select dropdown**: Choose multiple languages
- **Search bar**: Quick lookup by name or code
- **Primary/Secondary toggle**: Set language roles
- **Dynamic switching**: Change languages mid-workflow

### Panel Configuration

```json
{
  "panelId": "panel-001",
  "workspaceId": "ws-kenya-001",
  "selectedLanguages": [
    { "code": "en", "role": "primary", "enabledFor": ["scripts", "subtitles"] },
    { "code": "sw", "role": "secondary", "enabledFor": ["subtitles", "captions"] },
    { "code": "am", "role": "secondary", "enabledFor": ["subtitles"] }
  ],
  "primaryLanguage": "en",
  "searchConfig": {
    "enableSearch": true,
    "searchFields": ["code", "displayName", "nativeName"]
  },
  "dynamicSwitching": {
    "enabled": true,
    "allowedOperations": ["add_language", "remove_language", "change_primary"],
    "requireConfirmation": true
  },
  "qcDashboardIntegration": {
    "enabled": true,
    "showPerLanguageStatus": true,
    "sideBySideView": true
  }
}
```

### Search Functionality

Search supports:
- Language code: `sw`, `am`, `om`
- Display name: `Kiswahili`, `Amharic`
- Native name: `አማርኛ`, `Afaan Oromoo`
- Case-insensitive matching
- Partial matches

**Example searches:**
- Type "Italian" → shows `it`
- Type "አማርኛ" → shows `am`
- Type "oro" → shows `om`

## Dynamic Language Switching

### Mid-Workflow Operations

Operators can:

1. **Add language**: Include new language for content
2. **Remove language**: Exclude language from output
3. **Change primary**: Switch primary language
4. **Toggle content type**: Enable/disable for scripts, subtitles, etc.

### Switching Flow

```
Content in English → Add Amharic → Translate → QC → Publish both
                  ↓
        Switch subtitles to Italian mid-workflow
```

### Preservation

When switching languages:
- Previous work is preserved
- QC status is maintained
- Confirmation required (configurable)

## QC Dashboard Integration

### Per-Language Status

Dashboard shows:
- Translation accuracy score
- Persona consistency pass/fail
- Cultural sensitivity flags
- Overall QC status

### Side-by-Side View

Compare multilingual outputs:

| Aspect | English | Amharic | Kiswahili |
|--------|---------|---------|-----------|
| Translation | N/A | 97% ✓ | 95% ✓ |
| Persona | ✓ | ✓ | ✓ |
| Cultural | ✓ | ✓ | ✓ |
| Overall | Pass | Pass | Pass |

## Font Recommendations

### Script-Specific Fonts

| Script | Recommended Fonts |
|--------|-------------------|
| Latin | Arial, Roboto, Open Sans |
| Arabic | Amiri, Noto Sans Arabic, Cairo |
| Ethiopic | Noto Sans Ethiopic, Nyala, Abyssinica SIL |
| Chinese | Noto Sans SC, PingFang SC |

### Subtitle Configuration

Each language pack includes subtitle settings:

```json
{
  "subtitles": {
    "enabled": true,
    "fontFamily": "Noto Sans Ethiopic",
    "fontSize": 26,
    "maxCharsPerLine": 35,
    "maxLinesPerFrame": 2
  }
}
```

## QC Thresholds

### Default Thresholds

| Language | Translation | Persona | Cultural |
|----------|-------------|---------|----------|
| English | 95% | 90% | 95% |
| Amharic | 97% | 92% | 98% |
| Arabic | 98% | 95% | 98% |
| Oromifa | 95% | 90% | 98% |
| Kiswahili | 95% | 90% | 95% |

### Native Reviewer Requirements

Languages requiring native speaker review:
- Amharic (`am`)
- Oromifa (`om`)
- Kiswahili (`sw`)
- Arabic (`ar`)
- French (`fr`)
- Italian (`it`)

## TTS Voice Configuration

### Available Voices

Each language has TTS voice options:

```json
{
  "ttsVoices": [
    { "voiceId": "voice_am_001", "provider": "azure", "gender": "male", "style": "formal" }
  ]
}
```

### Supported Providers

- ElevenLabs
- Google Cloud TTS
- Azure Cognitive Services
- Amazon Polly

## Test Coverage

### Running Tests

```bash
# Run all language registry tests
node tests/governance/language_registry.test.js

# Run all globalization tests
npm run test:globalization
```

### Test Categories

- Schema validation
- Language pack validation
- Search functionality
- Dynamic loading
- QC thresholds
- Selection panel

## File Locations

| Artifact | Path |
|----------|------|
| Language Pack Schema | `schemas/language_pack.schema.json` |
| Registry Schema | `schemas/language_pack_registry.schema.json` |
| Selection Panel Schema | `schemas/language_selection_panel.schema.json` |
| Language Pack Fixtures | `tests/governance/fixtures/language_packs.json` |
| Registry Fixtures | `tests/governance/fixtures/language_registry.json` |
| Registry Tests | `tests/governance/language_registry.test.js` |

## Extending the Registry

### Adding a New Language

1. **Update registry fixture** (`language_registry.json`):
```json
{
  "code": "ha",
  "displayName": "Hausa",
  "nativeName": "Hausa",
  "direction": "ltr",
  "region": "Africa",
  "scriptSystem": "latin",
  "status": "available"
}
```

2. **Add language pack** (`language_packs.json`):
```json
{
  "languageCode": "ha",
  "displayName": "Hausa",
  "nativeName": "Hausa",
  "direction": "ltr",
  "qcRules": {
    "translationAccuracyThreshold": 95,
    "nativeReviewerRequired": true
  },
  "status": "active"
}
```

3. **Run tests** to validate:
```bash
npm test
```

---

*Version: 1.0*
*Phase: 15 Extended - Language Selection*
*Last Updated: November 2025*
