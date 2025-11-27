# SL18 Franchise Agreement Template

This document serves as the template for digital franchise agreements in the SL18 platform. All agreements must conform to the schema defined in `schemas/agreement.schema.json`.

## 1. Parties

### 1.1 Central Operations ("SL18 Central")
- **Entity**: SL18 Central Operations
- **Contact**: ops@sl18.africa
- **Role**: Platform operator, brand guardian, automation provider

### 1.2 Franchise Partner ("Partner")
- **Franchise ID**: `{{franchiseId}}`
- **Display Name**: `{{displayName}}`
- **Country**: `{{country}}`
- **Representative**: `{{ownerContact.name}}`
- **Contact Email**: `{{ownerContact.email}}`

---

## 2. Financial Terms

### 2.1 Registration Fees
| Fee Type | Amount | Due Date |
|----------|--------|----------|
| Registration Fee | $`{{terms.fees.registrationFee}}` | Upon approval |
| Monthly Fee | $`{{terms.fees.monthlyFee}}` | 1st of each month |

### 2.2 Revenue Share
| Party | Percentage | Notes |
|-------|------------|-------|
| Partner | `{{terms.revenueShare.partnerPercentage}}`% | Net of platform fees |
| SL18 Central | `{{terms.revenueShare.centralPercentage}}`% | Covers automation, support, brand |

**Payout Terms:**
- **Schedule**: `{{terms.revenueShare.payoutSchedule}}`
- **Minimum Threshold**: $`{{terms.revenueShare.payoutThreshold}}`
- **Payment Method**: Bank transfer or approved digital payment

---

## 3. Quality Control Obligations

### 3.1 Pre-Publishing Requirements
- QC approval **required before publish**: `{{terms.qcObligations.requiredBeforePublish}}`
- QC turnaround time: `{{terms.qcObligations.qcTurnaroundHours}}` hours maximum
- Strike limit before suspension: `{{terms.qcObligations.strikeLimit}}` strikes

### 3.2 QC Criteria
All content must meet the following criteria before publishing:

1. **Persona Alignment**: Content matches persona voice, tone, and cultural guardrails
2. **Audio Quality**: Clear TTS audio, balanced music levels, no distortion
3. **Visual Standards**: Correct resolution (1080x1920), branded overlays present
4. **Caption Accuracy**: Captions match spoken content, properly timed
5. **Platform Compliance**: Content adheres to platform community guidelines
6. **Brand Safety**: No controversial topics, offensive content, or policy violations

### 3.3 Strike System
| Strike Count | Action |
|--------------|--------|
| 1 | Warning + required QC retraining |
| 2 | 48-hour publishing pause + review |
| 3+ | Franchise suspension pending review |

---

## 4. Publishing Rights

### 4.1 Authorized Platforms
Partner may publish content on:
- [ ] YouTube Shorts
- [ ] Instagram Reels
- [ ] Facebook Reels
- [ ] TikTok

*Platforms must be explicitly enabled in agreement terms.*

### 4.2 Content Ownership
- **Ownership Model**: `{{terms.publishingRights.contentOwnership}}`
- **Exclusive Territory**: `{{terms.publishingRights.exclusiveTerritory}}`

**Ownership Definitions:**
- `shared`: Both parties retain rights to content
- `franchise`: Partner owns content, grants license to SL18
- `central`: SL18 Central owns content, grants usage rights to Partner

### 4.3 Brand Usage
- Partner must use approved SL18 branding elements
- Custom overlays require central approval before use
- Partner retains rights to locally-relevant creative elements

---

## 5. Override and Rollback Rules

### 5.1 Central Override Authority
- **Override Allowed**: `{{terms.overrideRules.centralCanOverride}}`
- **Notice Period**: `{{terms.overrideRules.overrideNoticeHours}}` hours

**Valid Override Reasons:**
- Platform policy violation
- Brand safety concern
- Legal/compliance issue
- Urgent quality failure
- Partner non-responsiveness (>24h)

### 5.2 Content Rollback
- **Rollback Allowed**: `{{terms.rollbackRules.allowRollback}}`
- **Rollback Window**: `{{terms.rollbackRules.rollbackWindowHours}}` hours after publish
- **Approval Required**: `{{terms.rollbackRules.requiresApproval}}`

**Rollback Triggers:**
- QC failure discovered post-publish
- Platform community guideline strike
- Partner request (within window)
- Legal/compliance requirement

---

## 6. Operational Requirements

### 6.1 Partner Responsibilities
1. Maintain Airtable access and update episode records
2. Review and QC content within specified turnaround time
3. Report platform issues within 1 hour of discovery
4. Attend weekly sync meetings with SL18 Central
5. Rotate credentials as instructed (minimum monthly for TikTok)
6. Maintain local backup of published content

### 6.2 SL18 Central Responsibilities
1. Maintain automation infrastructure (Make.com, CapCut, APIs)
2. Provide 24-hour response for critical issues
3. Process revenue payouts per schedule
4. Quarterly performance reviews and feedback
5. Credential rotation support and secure storage
6. Documentation and SOP updates

---

## 7. Term and Termination

### 7.1 Agreement Term
- **Effective Date**: `{{effectiveDate}}`
- **Expiration Date**: `{{expirationDate}}` (null = indefinite)
- **Renewal**: Automatic unless terminated with 30 days notice

### 7.2 Termination Conditions
Either party may terminate with cause for:
- Material breach (30 days to cure)
- Three or more QC strikes within 90 days
- Non-payment for 60+ days
- Platform account termination
- Illegal activity

### 7.3 Post-Termination
- Final revenue reconciliation within 45 days
- Content archival and handoff per ownership terms
- Credential revocation within 24 hours
- Non-compete period: 6 months for same-market personas

---

## 8. Signatures

### Franchise Representative
- **Name**: ________________________
- **Title**: ________________________
- **Date**: ________________________
- **Signature Hash**: `{{signedBy.franchiseRepresentative.signatureHash}}`

### SL18 Central Representative
- **Name**: ________________________
- **Title**: ________________________
- **Date**: ________________________
- **Signature Hash**: `{{signedBy.centralRepresentative.signatureHash}}`

---

## Appendix A: Default Agreement Values

For franchises using the standard agreement model:

```json
{
  "terms": {
    "fees": {
      "registrationFee": 0,
      "monthlyFee": 0,
      "currency": "USD"
    },
    "revenueShare": {
      "partnerPercentage": 35,
      "centralPercentage": 65,
      "payoutThreshold": 50,
      "payoutSchedule": "monthly"
    },
    "qcObligations": {
      "requiredBeforePublish": true,
      "qcTurnaroundHours": 24,
      "strikeLimit": 3,
      "qcCriteria": [
        "Persona alignment verified",
        "Audio quality acceptable",
        "Visual standards met",
        "Caption accuracy confirmed",
        "Platform compliance checked"
      ]
    },
    "publishingRights": {
      "platforms": ["youtube", "instagram", "facebook", "tiktok"],
      "exclusiveTerritory": null,
      "contentOwnership": "shared"
    },
    "overrideRules": {
      "centralCanOverride": true,
      "overrideNoticeHours": 0,
      "overrideReasons": [
        "Platform policy violation",
        "Brand safety concern",
        "Legal compliance",
        "Partner non-response"
      ]
    },
    "rollbackRules": {
      "allowRollback": true,
      "rollbackWindowHours": 48,
      "requiresApproval": false
    }
  }
}
```

---

## Appendix B: Amendment Process

1. Either party proposes amendment in writing
2. 7-day review period for non-urgent changes
3. Both parties must sign amendment document
4. Amendment logged in agreement audit trail
5. Updated terms effective per amendment date

---

*Template Version: 1.0*
*Last Updated: November 2025*
*Schema Reference: schemas/agreement.schema.json*
