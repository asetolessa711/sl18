# Payment Compliance Guide

The Payment Compliance module provides comprehensive KYC (Know Your Customer), AML (Anti-Money Laundering), tax compliance, and fraud detection capabilities for all payment-related activities in SL18.

## Overview

Payment compliance ensures that all entities processing payments meet regulatory requirements and security standards. The module supports:

- KYC verification at multiple levels
- AML screening and monitoring
- Tax compliance tracking
- Fraud detection and prevention
- Payment rule enforcement

## Entity Types

Payment compliance applies to the following entity types:

| Entity Type | Description |
|-------------|-------------|
| `franchise` | Franchise operations |
| `partner` | Ecosystem partners |
| `contributor` | Content contributors |
| `creator` | Content creators |
| `distributor` | Content distributors |

## KYC Verification

### Verification Levels

| Level | Requirements | Use Case |
|-------|--------------|----------|
| `basic` | Email, phone verification | Small payouts (<$600/year) |
| `standard` | Government ID, address proof | Regular payouts |
| `enhanced` | Business docs, beneficial ownership | High-value transactions |
| `enterprise` | Full due diligence, site visits | Strategic partners |

### Document Types

Supported KYC documents:

- `government_id` - Government-issued photo ID
- `passport` - International passport
- `business_license` - Business registration documents
- `tax_id` - Tax identification documents
- `bank_statement` - Bank account statements
- `utility_bill` - Proof of address
- `incorporation_docs` - Company incorporation documents
- `beneficial_ownership` - UBO documentation

### Identity Verification Methods

| Method | Description |
|--------|-------------|
| `document_scan` | Automated document scanning |
| `biometric` | Facial recognition matching |
| `video_call` | Live video verification |
| `third_party_api` | Third-party verification service |
| `manual` | Manual review by compliance team |

### Business Verification

For business entities, additional verification includes:

```json
{
  "businessType": "corporation",
  "registrationNumber": "12345678",
  "registrationCountry": "US",
  "beneficialOwners": [
    {
      "name": "John Smith",
      "ownershipPercentage": 60,
      "verified": true
    }
  ],
  "verified": true
}
```

## AML Compliance

### AML Status

| Status | Description |
|--------|-------------|
| `clear` | No issues detected |
| `flagged` | Under enhanced monitoring |
| `blocked` | Transactions blocked |
| `under_review` | Manual review required |
| `pending` | Initial screening pending |

### Risk Levels

| Risk Level | Score Range | Action |
|------------|-------------|--------|
| `low` | 0-25 | Standard monitoring |
| `medium` | 26-50 | Enhanced monitoring |
| `high` | 51-75 | Manual review required |
| `critical` | 76-100 | Transactions blocked |

### Sanctions Screening

The module screens against major sanctions lists:

- **OFAC** - US Treasury sanctions
- **EU** - European Union sanctions
- **UN** - United Nations sanctions
- **UK** - UK Treasury sanctions
- **AU** - Australian sanctions
- **Local** - Local regulatory lists

### PEP (Politically Exposed Person) Screening

| PEP Type | Description |
|----------|-------------|
| `current` | Currently holding political office |
| `former` | Previously held political office |
| `family_member` | Family member of PEP |
| `close_associate` | Close business associate of PEP |
| `none` | Not a PEP |

### Transaction Monitoring

Configurable thresholds for transaction monitoring:

```json
{
  "enabled": true,
  "thresholds": {
    "singleTransaction": 50000,
    "dailyTotal": 100000,
    "monthlyTotal": 500000
  },
  "flaggedTransactions": 0
}
```

## Tax Compliance

### Tax ID Types

| Type | Region |
|------|--------|
| `EIN` | US (Employer Identification Number) |
| `SSN` | US (Social Security Number) |
| `VAT` | EU (Value Added Tax) |
| `GST` | AU/IN (Goods and Services Tax) |
| `TIN` | Generic (Tax Identification Number) |

### Tax Forms

Supported tax forms:

- `W9` - US taxpayer identification
- `W8-BEN` - Non-US individual certificate
- `W8-BEN-E` - Non-US entity certificate
- `1099` - US income reporting
- `1042-S` - Non-US income reporting
- `VAT_registration` - EU VAT registration
- `local_form` - Country-specific forms

### Withholding Configuration

```json
{
  "required": true,
  "rate": 24,
  "treatyBenefits": true,
  "treatyCountry": "UK"
}
```

## Fraud Detection

### Risk Scoring

Fraud risk is assessed on a 0-100 scale based on multiple signals:

| Signal Type | Description |
|-------------|-------------|
| `velocity_anomaly` | Unusual transaction velocity |
| `location_mismatch` | IP/location inconsistencies |
| `device_fingerprint` | Suspicious device patterns |
| `behavioral_anomaly` | Unusual user behavior |
| `pattern_match` | Known fraud patterns |
| `third_party_alert` | External fraud alerts |

### Automated Actions

Based on fraud risk level:

| Risk Level | Action |
|------------|--------|
| `low` | Log and monitor |
| `medium` | Flag for review |
| `high` | Hold transaction |
| `critical` | Block transaction |

## Payment Rules

### Allowed Payment Methods

- `bank_transfer` - Direct bank transfers
- `paypal` - PayPal payments
- `stripe` - Stripe payments
- `wise` - Wise (TransferWise)
- `payoneer` - Payoneer payments
- `check` - Paper checks
- `crypto` - Cryptocurrency
- `wire` - Wire transfers

### Velocity Limits

Configure transaction velocity limits:

```json
{
  "dailyLimit": 100000,
  "weeklyLimit": 300000,
  "monthlyLimit": 1000000
}
```

### Payment Restrictions

| Restriction Type | Description |
|------------------|-------------|
| `country_block` | Blocked countries |
| `currency_block` | Blocked currencies |
| `method_block` | Blocked payment methods |
| `amount_limit` | Amount restrictions |
| `kyc_required` | KYC verification required |
| `manual_review` | Manual review required |

## Compliance Checks

### Check Types

| Check Type | Description |
|------------|-------------|
| `kyc` | KYC verification check |
| `aml` | AML screening check |
| `sanctions` | Sanctions list check |
| `pep` | PEP screening check |
| `tax` | Tax compliance check |
| `fraud` | Fraud assessment |
| `velocity` | Velocity limit check |
| `threshold` | Transaction threshold check |

### Check Status

| Status | Description |
|--------|-------------|
| `passed` | Check passed successfully |
| `failed` | Check failed |
| `pending` | Check in progress |
| `review_required` | Manual review needed |
| `exempted` | Exempted from check |

## Violation Tracking

### Violation Types

- `kyc_failure` - KYC verification failed
- `aml_flag` - AML screening flagged
- `sanctions_hit` - Sanctions list match
- `fraud_detection` - Fraud detected
- `velocity_breach` - Velocity limit exceeded
- `threshold_breach` - Transaction threshold exceeded
- `tax_non_compliance` - Tax compliance issue

### Violation Actions

| Action | Description |
|--------|-------------|
| `none` | Log only |
| `warning` | Issue warning |
| `payout_hold` | Hold payouts |
| `account_freeze` | Freeze account |
| `account_termination` | Terminate account |

## API Reference

### Check Payment Compliance

```javascript
GET /api/payment-compliance/{entityType}/{entityId}
```

### Submit KYC Documents

```javascript
POST /api/payment-compliance/{entityId}/kyc/documents
{
  "documentType": "business_license",
  "file": "<base64-encoded-file>",
  "metadata": {
    "issuingCountry": "US",
    "expiryDate": "2025-12-31"
  }
}
```

### Trigger AML Screening

```javascript
POST /api/payment-compliance/{entityId}/aml/screen
```

### Update Payment Rules

```javascript
PUT /api/payment-compliance/{entityId}/rules
{
  "allowedMethods": ["bank_transfer", "paypal", "stripe"],
  "minimumPayout": 100,
  "payoutSchedule": "monthly"
}
```

## Best Practices

1. **Verify Early**: Complete KYC verification before enabling payouts
2. **Regular Screening**: Schedule periodic AML rescreening
3. **Monitor Thresholds**: Set appropriate transaction thresholds
4. **Document Everything**: Maintain complete audit trails
5. **Stay Updated**: Keep sanctions lists and compliance rules current
6. **Train Staff**: Ensure compliance team understands procedures

## Regulatory Compliance

The module supports compliance with:

- Bank Secrecy Act (BSA)
- USA PATRIOT Act
- EU Anti-Money Laundering Directives
- FATF Recommendations
- Local regulatory requirements

## Integration

Payment compliance integrates with:
- **Phase 15 (Monetization)**: Payment processing compliance
- **Phase 18 (Marketplace)**: Contributor payment verification
- **Phase 19 (Distribution)**: Partner payment compliance
- **Phase 24 (Partner Ecosystem)**: Partner verification
