# Subscription Tiers

This document describes the subscription tier system in SL18 + Waliin Studio, enabling flexible monetization with tiered access, regional pricing, and retention features.

## Overview

The subscription tier system provides:
- **Flexible Tiers**: Free, Basic, Standard, Premium, VIP, Family, Student, Enterprise
- **Feature Access Control**: Content, streaming quality, downloads, profiles, ads
- **Regional Pricing**: PPP-adjusted pricing with local currencies
- **Retention Tools**: Churn prediction, retention offers, winback campaigns

## Tier Configuration

### Schema: `schemas/subscription_tiers.schema.json`

### Tier Levels

| Tier | Price (USD) | Content | Quality | Downloads | Profiles | Ads |
|------|-------------|---------|---------|-----------|----------|-----|
| Free | $0 | Limited | 720p | No | 1 | Yes |
| Basic | $4.99 | Full | 720p | 5 | 2 | Reduced |
| Standard | $9.99 | Full | 1080p | 15 | 4 | No |
| Premium | $14.99 | Full + Exclusive | 4K HDR | 25 | 6 | No |
| VIP | $24.99 | Full + Early Access | 8K | Unlimited | 8 | No |
| Family | $19.99 | Full | 4K | 20 | 6 + Kids | No |

### Feature Access

```json
{
  "features": {
    "contentAccess": {
      "fullCatalog": true,
      "premiumContent": true,
      "exclusivePreviews": true,
      "earlyAccess": true,
      "earlyAccessDays": 7
    },
    "streamingQuality": {
      "maxResolution": "4K",
      "hdr": true,
      "dolbyAtmos": true,
      "simultaneousStreams": 4
    },
    "downloads": {
      "enabled": true,
      "maxDownloads": 25,
      "downloadQuality": "ultra",
      "offlineRetentionDays": 30
    },
    "profiles": {
      "maxProfiles": 6,
      "kidsMode": true
    },
    "ads": {
      "adSupported": false
    }
  }
}
```

## Regional Pricing

### PPP Adjustment
Pricing is adjusted based on Purchasing Power Parity (PPP) to make subscriptions accessible globally:

| Region | PPP Multiplier | Example Premium Price |
|--------|----------------|----------------------|
| US/EU | 1.0 | $14.99 |
| East Africa | 0.35 | ~$5.25 (in local currency) |
| West Africa | 0.40 | ~$6.00 |
| South Asia | 0.30 | ~$4.50 |

### Example Regional Configuration

```json
{
  "regionalPricing": [
    {
      "region": "EA",
      "country": "KE",
      "currency": "KES",
      "monthlyPrice": 599,
      "annualPrice": 5999,
      "pppAdjustment": 0.35
    }
  ]
}
```

## Retention Features

### Churn Prediction
- Risk threshold monitoring
- At-risk subscriber identification
- Revenue-at-risk calculations

### Retention Offers
- Discount offers (10-50% off)
- Free month extensions
- Tier extension trials
- Exclusive content unlocks

### Winback Campaigns
- Automated emails for churned subscribers
- Special return offers
- Content recommendations

## Upgrade/Downgrade Rules

- **Prorate on Upgrade**: Credit remaining days to new tier
- **Downgrade at Period End**: Effective at next billing cycle
- **Minimum Commitment**: Optional commitment periods

## Integration Points

- **Phase 17**: Adaptive pricing based on personalization signals
- **Phase 20**: Audience insights for churn prediction
- **Phase 29**: Waliin Customer profiles
- **Phase 32**: Monetization analytics

## API Events

| Event | Description |
|-------|-------------|
| `subscription_created` | New subscription started |
| `subscription_renewed` | Subscription renewed |
| `subscription_cancelled` | Subscription cancelled |
| `tier_upgraded` | Subscriber upgraded tier |
| `tier_downgraded` | Subscriber downgraded tier |
| `trial_started` | Free trial started |
| `trial_converted` | Trial converted to paid |

## Best Practices

1. **Pricing Strategy**: Use PPP to maximize accessibility
2. **Feature Gating**: Clear value differentiation between tiers
3. **Retention**: Proactive offers before churn occurs
4. **A/B Testing**: Test pricing and features by region
5. **Compliance**: Ensure pricing meets local regulations
