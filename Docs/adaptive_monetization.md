# SL18 Adaptive Monetization Guide

This document covers the adaptive monetization system introduced in Phase 17, enabling dynamic pricing, revenue optimization, and intelligent tier management.

## Overview

The adaptive monetization system provides AI-driven pricing adjustments based on viewer engagement, regional economics, and churn prediction. It integrates with the revenue ledger for transparent tracking and reporting.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Adaptive Monetization Engine                   │
├─────────────────────────────────────────────────────────────────┤
│  Viewer Tiers     │  Price Models      │  Revenue Optimization  │
│  ────────────     │  ────────────      │  ────────────────────  │
│  • Free           │  • Subscription    │  • Engagement Factors  │
│  • Basic          │  • Pay-per-view    │  • Churn Prediction    │
│  • Premium        │  • Freemium        │  • Regional Economics  │
│  • VIP            │  • Ad-supported    │  • Dynamic Adjustments │
│  • Enterprise     │  • Hybrid          │                        │
├─────────────────────────────────────────────────────────────────┤
│                    Revenue Ledger Integration                    │
│  • Transaction Tracking  • Payout Schedules  • Real-time Updates │
└─────────────────────────────────────────────────────────────────┘
```

## Viewer Tiers

### Tier Structure

| Tier | Features | Ads | Offline | Quality |
|------|----------|-----|---------|---------|
| Free | Basic content | Yes | No | SD |
| Basic | Extended content | Limited | No | HD |
| Premium | All content, early access | No | Yes | Full HD |
| VIP | Premium + exclusives | No | Yes | 4K |
| Enterprise | All + API, analytics | No | Yes | 4K |

### Tier Configuration Example
```json
{
  "viewerTier": {
    "tierId": "tier-premium-ke",
    "tierName": "premium",
    "tierFeatures": ["ad_free", "offline_access", "exclusive_content", "early_access"],
    "adsEnabled": false,
    "offlineAccess": true,
    "qualityLimit": "full_hd"
  }
}
```

## Price Models

### Subscription Model
Recurring payments for ongoing access:
```json
{
  "priceModel": {
    "type": "subscription",
    "basePrice": 500,
    "billingCycle": "monthly",
    "trialPeriod": {
      "enabled": true,
      "durationDays": 7,
      "trialTier": "premium"
    }
  }
}
```

**Billing Cycles**: one_time, daily, weekly, monthly, quarterly, yearly

### Pay-Per-View Model
One-time payments for individual content:
```json
{
  "priceModel": {
    "type": "pay_per_view",
    "basePrice": 2.99,
    "billingCycle": "one_time"
  }
}
```

### Freemium Model
Free tier with paid upgrades:
```json
{
  "priceModel": {
    "type": "freemium",
    "basePrice": 0,
    "billingCycle": "monthly"
  }
}
```

### Discounts
Configure promotional discounts:
```json
{
  "discounts": [
    {
      "discountId": "disc-annual-20",
      "type": "percentage",
      "value": 20,
      "conditions": { "minSubscriptionMonths": 12 },
      "validFrom": "2025-01-01T00:00:00Z",
      "validUntil": "2025-12-31T23:59:59Z"
    },
    {
      "discountId": "disc-referral-10",
      "type": "percentage",
      "value": 10,
      "conditions": { "referralCode": "FRIEND10" }
    }
  ]
}
```

**Discount Types**: percentage, fixed, bundle

## Revenue Optimization

### Engagement Factors
Weight engagement metrics for revenue optimization:
```json
{
  "engagementFactors": {
    "watchTimeWeight": 0.4,
    "interactionWeight": 0.3,
    "completionRateWeight": 0.3
  }
}
```

### Churn Prediction
AI-driven churn risk assessment and retention actions:
```json
{
  "churnPrediction": {
    "enabled": true,
    "riskScore": 45,
    "riskLevel": "medium",
    "retentionActions": [
      { "actionType": "tier_upgrade_prompt", "priority": 1, "description": "Prompt upgrade to basic tier" },
      { "actionType": "discount_offer", "priority": 2, "description": "Offer 50% off first month" }
    ],
    "lastAssessedAt": "2025-01-14T00:00:00Z"
  }
}
```

**Risk Levels**: low (<30), medium (30-60), high (60-85), critical (>85)

**Retention Actions**:
- `discount_offer` - Offer price reduction
- `content_recommendation` - Recommend engaging content
- `tier_upgrade_prompt` - Suggest tier upgrade
- `personal_outreach` - Trigger personal contact
- `loyalty_reward` - Award loyalty points/credits

### Regional Economics
Adjust pricing based on regional purchasing power:
```json
{
  "regionalEconomics": {
    "purchasingPowerIndex": 0.72,
    "localizedPricing": true,
    "priceAdjustmentFactor": 0.85,
    "lastUpdatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Calculation**: `adjustedPrice = basePrice × priceAdjustmentFactor`

Example:
- Base price: $10.00
- Purchasing Power Index: 0.45 (Ethiopia)
- Adjustment Factor: 0.55
- Adjusted Price: $5.50

### Dynamic Adjustments
Real-time pricing adjustments based on triggers:
```json
{
  "dynamicAdjustments": [
    {
      "adjustmentId": "adj-et-seasonal-001",
      "trigger": "seasonal",
      "adjustmentType": "bundle_offer",
      "value": 1,
      "appliedAt": "2025-01-07T00:00:00Z",
      "expiresAt": "2025-01-21T00:00:00Z",
      "reasoning": "New Year promotional bundle offer"
    }
  ]
}
```

**Triggers**: engagement_drop, churn_risk, competitive_pressure, seasonal, promotional

**Adjustment Types**: price_decrease, price_increase, tier_promotion, feature_unlock, bundle_offer

## Revenue Ledger Integration

### Configuration
```json
{
  "revenueLedgerIntegration": {
    "ledgerId": "ledger-kenya-001",
    "realTimeUpdates": true,
    "transactionTracking": {
      "enabled": true,
      "lastTransactionId": "txn-ke-20250115-001",
      "totalRevenue": 125000,
      "currency": "KES"
    }
  }
}
```

### Transaction Types
The following transactions are tracked in the revenue ledger:

| Transaction | Entry Type | Description |
|-------------|------------|-------------|
| New subscription | revenue | Initial subscription payment |
| Renewal | revenue | Recurring subscription payment |
| Tier upgrade | revenue | Price difference from upgrade |
| Tier downgrade | adjustment | Price difference from downgrade |
| Cancellation | churn | Lost future revenue |
| Refund | adjustment | Returned payment |

### Ledger Entry Example
```json
{
  "entryType": "revenue",
  "source": "subscription",
  "amount": 500,
  "currency": "KES",
  "transactionId": "txn-ke-20250115-001",
  "pricingId": "pricing-kenya-premium-001"
}
```

## Audit Logging

All monetization events are logged:

### Subscription Events
```json
{
  "eventType": "subscription_created",
  "category": "monetization",
  "target": { "type": "subscription", "id": "sub-ke-12345" },
  "details": {
    "description": "New premium subscription created",
    "metadata": { "tier": "premium", "price": 500, "currency": "KES" }
  }
}
```

### Pricing Adjustment Events
```json
{
  "eventType": "pricing_adjusted",
  "category": "monetization",
  "target": { "type": "pricing", "id": "pricing-kenya-premium-001" },
  "details": {
    "description": "Dynamic pricing adjustment applied",
    "previousValue": 500,
    "newValue": 400,
    "reason": "Churn risk mitigation"
  }
}
```

### Churn Events
```json
{
  "eventType": "churn_risk_detected",
  "category": "monetization",
  "target": { "type": "viewer", "id": "viewer-ke-12345" },
  "details": {
    "description": "High churn risk detected",
    "metadata": { "riskScore": 75, "riskLevel": "high" }
  }
}
```

## Configuration Examples

### Premium Subscription (Kenya)
```json
{
  "pricingId": "pricing-kenya-premium-001",
  "franchiseId": "kenya-001",
  "region": "KE",
  "currency": "KES",
  "viewerTier": {
    "tierId": "tier-premium-ke",
    "tierName": "premium",
    "tierFeatures": ["ad_free", "offline_access", "exclusive_content"],
    "adsEnabled": false,
    "offlineAccess": true,
    "qualityLimit": "full_hd"
  },
  "priceModel": {
    "type": "subscription",
    "basePrice": 500,
    "billingCycle": "monthly"
  },
  "revenueOptimization": { "enabled": true },
  "status": "active"
}
```

### Freemium with Upsell (Ethiopia)
```json
{
  "pricingId": "pricing-ethiopia-freemium-001",
  "franchiseId": "ethiopia-001",
  "region": "ET",
  "currency": "ETB",
  "viewerTier": {
    "tierId": "tier-free-et",
    "tierName": "free",
    "adsEnabled": true,
    "offlineAccess": false
  },
  "priceModel": {
    "type": "freemium",
    "basePrice": 0
  },
  "revenueOptimization": {
    "enabled": true,
    "churnPrediction": {
      "enabled": true,
      "retentionActions": [
        { "actionType": "tier_upgrade_prompt", "priority": 1 }
      ]
    }
  },
  "status": "active"
}
```

## Best Practices

1. **Regional Pricing**: Always enable localized pricing for emerging markets
2. **Churn Monitoring**: Set up alerts for risk scores above 60
3. **Discount Limits**: Cap discounts at 50% to protect revenue
4. **Trial Optimization**: Use 7-day trials for premium tiers
5. **Ledger Sync**: Enable real-time updates for accurate reporting

## Troubleshooting

### Revenue Discrepancies
- Verify ledger integration is enabled
- Check transaction tracking status
- Review dynamic adjustments applied

### Churn Prediction Issues
- Ensure engagement data is current
- Verify risk assessment timing
- Review retention action triggers

### Pricing Sync Failures
- Check regional economics configuration
- Verify currency codes are correct
- Review adjustment factor bounds (0.1-3.0)

## Metrics & KPIs

Track these key metrics:
- **MRR** (Monthly Recurring Revenue)
- **Churn Rate** (% of cancellations)
- **LTV** (Lifetime Value per viewer)
- **ARPU** (Average Revenue Per User)
- **Conversion Rate** (Free → Paid)
- **Upgrade Rate** (Basic → Premium)
