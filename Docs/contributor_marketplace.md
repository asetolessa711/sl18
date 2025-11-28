# SL18 Contributor Marketplace Documentation

This document describes the SL18 Contributor Marketplace implementation (Phase 18), covering contributor onboarding, listings, revenue sharing, and cross-promotion.

## Overview

The Contributor Marketplace enables:
- **Contributor Registration**: Secure onboarding with identity/payment verification
- **Marketplace Listings**: Showcase skills, portfolios, and availability
- **Revenue Sharing**: Configurable splits with ledger integration
- **Cross-Promotion**: Multilingual previews, clips, and showcases
- **QC Enforcement**: Quality requirements before listing approval

## Schema Files

| Schema | Location | Purpose |
|--------|----------|---------|
| Contributor Agreement | `schemas/contributor_agreement.schema.json` | Contributor terms and conditions |
| Contributor Marketplace | `schemas/contributor_marketplace.schema.json` | Marketplace structure and listings |
| Governance Policy | `schemas/governance_policy.schema.json` | Platform-wide policies |
| Audit Log | `schemas/audit_log.schema.json` | Event logging |

## Contributor Types

| Type | Description |
|------|-------------|
| `creator` | Content creators (scripts, videos, posts) |
| `reviewer` | Content reviewers and QC specialists |
| `translator` | Multilingual translation services |
| `voice_artist` | TTS and voice-over talent |
| `editor` | Video/audio editing specialists |
| `qa_specialist` | Quality assurance testing |
| `operator` | Franchise operations management |
| `auditor` | Compliance and audit specialists |

## Contributor Onboarding

### Onboarding Steps

1. **Account Creation**
   - Email verification
   - Profile setup
   - Contributor type selection

2. **Identity Verification** (Required)
   - Government ID upload
   - Passport verification
   - Video verification
   - Bank verification

3. **Agreement Signing**
   - Review terms and conditions
   - Accept revenue share model
   - Sign NDA (if required)
   - Digital signature with timestamp

4. **Payment Setup**
   - Add payment method (bank, PayPal, Stripe, Wise, crypto)
   - Verify payment account
   - Set payout preferences

5. **QC Assessment** (Required for certain roles)
   - Complete skills assessment
   - Submit portfolio samples
   - Pass minimum QC score threshold

6. **Listing Approval**
   - Submit listing for review
   - Manual or automatic approval
   - Activation notification

### Onboarding Requirements

```json
{
  "identityVerification": true,
  "paymentVerification": true,
  "agreementSigned": true,
  "qcAssessment": true,
  "minimumQcScore": 85
}
```

## Contributor Agreements

### Agreement Structure

Each contributor signs an agreement covering:

#### Personal Information
- Full legal name
- Email address
- Country of residence
- Tax identification (encrypted)
- Identity verification status

#### Revenue Share Terms

| Model | Description |
|-------|-------------|
| `percentage` | Fixed percentage of revenue |
| `flat_fee` | Per-project or per-unit fee |
| `tiered` | Progressive percentages by threshold |
| `hybrid` | Combination of models |

Example tiered model:
```json
{
  "model": "tiered",
  "tiers": [
    { "threshold": 0, "percentage": 50 },
    { "threshold": 1000, "percentage": 55 },
    { "threshold": 5000, "percentage": 60 },
    { "threshold": 10000, "percentage": 65 }
  ],
  "minimumPayout": 50,
  "payoutCurrency": "USD",
  "payoutFrequency": "monthly"
}
```

#### Intellectual Property

| Ownership Model | Description |
|-----------------|-------------|
| `contributor` | Contributor retains ownership |
| `platform` | Platform owns all work |
| `shared` | Joint ownership |
| `work_for_hire` | Work for hire arrangement |

#### Exclusivity

- Scope: `platform`, `franchise`, `content_type`, `region`
- Duration: Specified in days
- Territories: List of exclusive regions

#### Termination

- Notice period (default: 30 days)
- Causes for immediate termination
- Post-termination content handling
- Pending revenue handling

### Agreement Lifecycle

```
pending_verification → pending_signature → active → (suspended) → (terminated/expired)
```

## Marketplace Listings

### Creating a Listing

1. **Basic Information**
   - Title (10-200 characters)
   - Description (50-2000 characters)
   - Category selection
   - Skills tags (1-20 skills)

2. **Language Proficiencies**
   ```json
   {
     "languages": [
       { "code": "en", "proficiency": "native" },
       { "code": "am", "proficiency": "fluent" },
       { "code": "sw", "proficiency": "advanced" }
     ]
   }
   ```

3. **Portfolio**
   - Sample uploads (video, audio, text, image)
   - External portfolio links
   - Work history summary

4. **Pricing**
   ```json
   {
     "model": "hybrid",
     "hourlyRate": 25.00,
     "projectMinimum": 100.00,
     "revenueSharePercentage": 40,
     "currency": "USD",
     "negotiable": true
   }
   ```

5. **Availability**
   - Status: `available`, `busy`, `limited`, `unavailable`
   - Hours per week
   - Response time
   - Timezone

### Listing Status

| Status | Description |
|--------|-------------|
| `pending_review` | Awaiting approval |
| `active` | Visible in marketplace |
| `featured` | Highlighted listing |
| `suspended` | Temporarily hidden |
| `inactive` | Contributor paused |

### Verification Badges

- **Identity Verified**: Passed ID verification
- **Payment Verified**: Payment method confirmed
- **Skills Verified**: Passed platform assessment
- **Top Rated**: High average rating

### Ratings

Ratings are collected on:
- Quality of work
- Communication
- Timeliness
- Professionalism

Average rating: 0-5 stars with count of reviews.

## Revenue Models

### Available Models

| Model | Description |
|-------|-------------|
| `70/30` | 70% contributor, 30% platform |
| `60/40` | 60% contributor, 40% platform |
| `50/50` | Equal split |
| `tiered` | Progressive based on revenue |
| `negotiated` | Custom per agreement |
| `performance_based` | Based on engagement metrics |

### Default Split Structure

```json
{
  "defaultSplit": {
    "contributorPercentage": 70,
    "platformPercentage": 20,
    "franchisePercentage": 10
  }
}
```

### Ledger Integration

Marketplace transactions integrate with the revenue ledger:
- Transaction initiated → ledger entry created
- Payment completed → contributor share calculated
- Payout scheduled → per payout frequency
- Payout completed → ledger updated

### Payout Schedule

| Frequency | Minimum Payout |
|-----------|----------------|
| Weekly | $20 |
| Biweekly | $35 |
| Monthly | $50 |
| Quarterly | $100 |

## Cross-Promotion

### Promotion Formats

| Format | Description | Max Duration |
|--------|-------------|--------------|
| `clip` | Short content clips | 60 seconds |
| `teaser` | Preview teasers | 30 seconds |
| `preview` | Sample previews | 90 seconds |
| `showcase` | Portfolio showcase | 120 seconds |

### Promotion Channels

- Marketplace homepage
- Category pages
- Search results
- Email campaigns
- Social media
- Partner sites

### Eligibility

To be featured in cross-promotion:
- Minimum rating: 4.0/5.0
- Minimum completed projects: 5
- Identity verified: Required
- Active status: Required

### Multilingual Previews

Showcases can be generated in multiple languages:
- English (en)
- French (fr)
- Spanish (es)
- Arabic (ar)
- Italian (it)
- Amharic (am)
- Kiswahili (sw)

## QC Requirements

### Listing Approval

Before a listing is approved:
1. Identity verification complete
2. Agreement signed
3. QC assessment passed (minimum 85%)
4. Portfolio reviewed
5. Description quality check

### Ongoing QC

Contributors must maintain:
- Minimum QC score: 85%
- Response rate: >80%
- On-time delivery: >90%
- Client satisfaction: >4.0/5.0

### QC Violations

| Violation | Action |
|-----------|--------|
| First offense | Warning |
| Second offense | Temporary suspension |
| Third offense | Review for termination |
| Policy violation | Immediate suspension |

## Audit Events

Marketplace actions generate audit events:

**Contributor Events:**
- `contributor_registered`
- `contributor_verified`
- `contributor_agreement_signed`
- `contributor_agreement_amended`
- `contributor_suspended`
- `contributor_reinstated`
- `contributor_terminated`

**Listing Events:**
- `listing_created`
- `listing_approved`
- `listing_featured`
- `listing_suspended`
- `listing_removed`

**Transaction Events:**
- `marketplace_transaction_initiated`
- `marketplace_transaction_completed`
- `marketplace_transaction_failed`
- `marketplace_payout_scheduled`
- `marketplace_payout_completed`

**Promotion Events:**
- `cross_promotion_created`
- `cross_promotion_approved`

## API Integration

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/marketplace/listings` | GET | List all listings |
| `/api/marketplace/listings` | POST | Create listing |
| `/api/marketplace/listings/:id` | GET | Get listing details |
| `/api/marketplace/listings/:id` | PUT | Update listing |
| `/api/marketplace/contributors` | GET | List contributors |
| `/api/marketplace/contributors/:id` | GET | Contributor profile |
| `/api/marketplace/transactions` | GET | Transaction history |
| `/api/marketplace/payouts` | GET | Payout history |

### Search Filters

- Contributor type
- Skills
- Languages
- Rating (minimum)
- Price range
- Availability
- Verification status
- Location/region

## Metrics

Marketplace metrics tracked:
- Total listings
- Active listings
- Total contributors
- Total transactions
- Total revenue
- Average rating
- Conversion rate
- Retention rate

## File Locations

| Artifact | Path |
|----------|------|
| Contributor Agreement Schema | `schemas/contributor_agreement.schema.json` |
| Marketplace Schema | `schemas/contributor_marketplace.schema.json` |
| Governance Policy Schema | `schemas/governance_policy.schema.json` |
| Audit Log Schema | `schemas/audit_log.schema.json` |
| Governance Tests | `tests/governance/governance_scaling.test.js` |
| Sample Data | `tests/governance/fixtures/` |

## Success Criteria

- [x] Contributor agreement schema validated
- [x] Marketplace schema validated
- [x] Onboarding flow defined with QC requirements
- [x] Revenue models configurable with ledger integration
- [x] Cross-promotion enabled with multilingual support
- [x] Audit events capture marketplace actions
- [x] Role-based access control for marketplace management
- [x] Test cases pass for all workflows

## Next Steps

1. Build marketplace UI components
2. Implement contributor onboarding flow
3. Integrate payment processing
4. Add search and filtering capabilities
5. Build rating and review system
6. Configure cross-promotion automation
7. Train operators on marketplace management

---

*Version: 1.0*
*Phase: 18 - Governance Scaling & Contributor Marketplace*
*Last Updated: November 2025*
