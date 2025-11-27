# Phase 15: Globalization & Monetization Documentation

This document describes the SL18 globalization and monetization layer implementation, enabling multilingual content pipelines and live payment integration.

## Overview

Phase 15 extends the governance layer (Phase 14) with:
- **Multilingual Integration**: Language packs, translations, and localized QC
- **Payment Integration**: Visa, Mastercard, PayPal, Stripe support
- **Workspace Provisioning**: Automatic setup after payment confirmation
- **Extended Audit Logging**: Payment and globalization event tracking

## Schema Files

| Schema | Location | Purpose |
|--------|----------|---------|
| Language Pack | `schemas/language_pack.schema.json` | Multilingual configuration |
| Payment Transaction | `schemas/payment_transaction.schema.json` | Payment records |
| Multilingual QC | `schemas/multilingual_qc.schema.json` | Translation QC validation |
| Workspace Config | `schemas/workspace_config.schema.json` | Workspace setup with languages |

## Multilingual Integration

### Language Pack Structure

```json
{
  "languageCode": "fr",
  "displayName": "French",
  "nativeName": "Français",
  "direction": "ltr",
  "scriptGeneration": {
    "enabled": true,
    "promptTemplate": "prompts/script_template_fr.txt",
    "toneGuidelines": ["Élégant", "Spirituel"]
  },
  "subtitles": {
    "enabled": true,
    "fontFamily": "Arial",
    "maxCharsPerLine": 40
  },
  "qcRules": {
    "translationAccuracyThreshold": 95,
    "nativeReviewerRequired": true
  },
  "status": "active"
}
```

### Supported Languages

| Code | Language | Direction | Native Reviewer |
|------|----------|-----------|-----------------|
| `en` | English | LTR | No |
| `fr` | French | LTR | Yes |
| `es` | Spanish | LTR | Yes |
| `ar` | Arabic | RTL | Yes |
| `zh-CN` | Chinese (Simplified) | LTR | Yes |

### Language Configuration at Setup

Workspace config supports multiple languages:

```json
{
  "workspaceId": "ws-kenya-001",
  "franchiseId": "kenya-001",
  "languages": ["en", "fr", "ar"],
  "primaryLanguage": "en",
  "translationSettings": {
    "autoTranslate": false,
    "requireHumanReview": true
  }
}
```

## Multilingual QC Dashboard

### QC Validation Criteria

1. **Translation Accuracy**: Score >= threshold (default 95%)
2. **Persona Consistency**: Tone, vocabulary, sign-off preserved
3. **Cultural Sensitivity**: No offensive or insensitive content
4. **Genre Rules**: Format-specific requirements met
5. **Subtitle QC**: Timing, length, readability checks

### QC Result States

| Status | Meaning | Publish Ready |
|--------|---------|---------------|
| `pending` | Awaiting review | No |
| `passed` | All checks passed | Yes |
| `failed` | One or more checks failed | No |
| `conditional` | Passed with required fixes | No |

### QC Record Example

```json
{
  "qcId": "mqc-2025-001",
  "sourceLanguage": "en",
  "targetLanguage": "fr",
  "translationAccuracy": {
    "score": 97,
    "threshold": 95,
    "passed": true
  },
  "personaConsistency": {
    "score": 98,
    "passed": true,
    "checks": {
      "toneMatch": true,
      "vocabularyMatch": true,
      "signOffPresent": true
    }
  },
  "overallResult": {
    "status": "passed",
    "publishReady": true
  }
}
```

## Payment Integration

### Supported Payment Gateways

| Gateway | Card Types | Status |
|---------|------------|--------|
| Stripe | Visa, Mastercard, Amex | Active |
| PayPal | PayPal Balance, Cards | Active |
| Bank Transfer | Direct Deposit | Active |

### Payment Transaction Schema

```json
{
  "transactionId": "txn-2025-001",
  "franchiseId": "kenya-001",
  "paymentGateway": "stripe",
  "paymentMethod": {
    "type": "credit_card",
    "lastFourDigits": "4242",
    "cardBrand": "visa"
  },
  "amount": {
    "value": 100.00,
    "currency": "USD",
    "fees": 3.20,
    "netAmount": 96.80
  },
  "transactionType": "registration_fee",
  "status": "completed"
}
```

### Transaction Types

| Type | Description |
|------|-------------|
| `registration_fee` | One-time franchise registration |
| `monthly_fee` | Recurring monthly charge |
| `payout` | Revenue distribution to partner |
| `refund` | Money returned to payer |
| `chargeback` | Disputed transaction |

### Payment Status Flow

```
pending → processing → completed
                    ↓
                 failed → (retry)
                    ↓
               refunded/disputed
```

### Fraud Detection

High-risk transactions are flagged for manual review:

```json
{
  "fraudDetection": {
    "riskScore": 75,
    "riskLevel": "high",
    "flagged": true,
    "signals": [
      "velocity_check_failed",
      "ip_mismatch",
      "card_country_mismatch"
    ]
  }
}
```

## Extended Registration Schema

Phase 15 adds payment and language fields to registration:

```json
{
  "franchiseId": "kenya-001",
  "registrationModel": "fee",
  "payment": {
    "paymentMethod": "stripe",
    "transactionId": "txn-2025-001",
    "paymentStatus": "completed",
    "amount": 100.00,
    "currency": "USD"
  },
  "languages": ["en", "sw"]
}
```

## Workspace Provisioning

### Provisioning Flow

```
Registration → Payment → Provisioning → Active
    ↓              ↓           ↓
 pending    pending_payment  provisioning
```

### Auto-Provisioning After Payment

1. Payment confirmed (`status: completed`)
2. Workspace status changes to `provisioning`
3. Drive folders created
4. Airtable records initialized
5. Language packs activated
6. Status changes to `active`

## Extended Audit Logging

### New Event Types

**Payment Events:**
- `payment_initiated`
- `payment_completed`
- `payment_failed`
- `payment_refunded`
- `payment_disputed`
- `fraud_detected`

**Globalization Events:**
- `workspace_provisioned`
- `language_pack_added`
- `language_pack_removed`
- `translation_submitted`
- `translation_approved`
- `translation_rejected`
- `multilingual_qc_passed`
- `multilingual_qc_failed`

### Audit Log Example

```json
{
  "logId": "audit-20251127-010",
  "timestamp": "2025-11-27T14:00:00Z",
  "eventType": "payment_completed",
  "category": "payment",
  "actor": {
    "type": "system",
    "id": "payment-processor"
  },
  "target": {
    "type": "payment",
    "id": "txn-2025-001",
    "franchiseId": "kenya-001"
  },
  "details": {
    "description": "Registration payment completed via Stripe",
    "metadata": {
      "amount": 100.00,
      "currency": "USD",
      "gateway": "stripe"
    }
  },
  "result": "success"
}
```

## Revenue Ledger Updates

Payment transactions integrate with revenue ledger:

- Registration fees logged as franchise income
- Payouts reference `transactionId` for reconciliation
- Refunds create adjustment entries
- Monthly reconciliation includes payment fees

## Test Coverage

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `governance.test.js` | 26 | Phase 14 governance |
| `globalization.test.js` | 32 | Phase 15 globalization |

### Run Tests

```bash
# Run all tests
npm test

# Run Phase 15 tests only
node tests/governance/globalization.test.js
```

## Success Criteria

- [x] Multilingual scripts and subtitles validated
- [x] Payment transactions logged and reconciled
- [x] Automatic workspace provisioning after payment
- [x] Fraud detection flags high-risk transactions
- [x] Multilingual QC enforces translation accuracy
- [x] Audit logs track all payment and globalization events

## Integration Points

### Airtable Tables

Extended tables for Phase 15:
- `Franchises`: Add `languages`, `payment_status` fields
- `Episodes`: Add `source_language`, `translations` fields
- `Payments`: New table for transaction records

### Make.com Scenarios

New scenarios:
- Payment webhook handler
- Workspace provisioning automation
- Multilingual content pipeline
- Translation QC workflow

## File Locations

| Artifact | Path |
|----------|------|
| Language Pack Schema | `schemas/language_pack.schema.json` |
| Payment Transaction Schema | `schemas/payment_transaction.schema.json` |
| Multilingual QC Schema | `schemas/multilingual_qc.schema.json` |
| Workspace Config Schema | `schemas/workspace_config.schema.json` |
| Phase 15 Tests | `tests/governance/globalization.test.js` |
| Test Fixtures | `tests/governance/fixtures/` |

---

*Version: 1.0*
*Phase: 15 - Globalization & Monetization*
*Last Updated: November 2025*
