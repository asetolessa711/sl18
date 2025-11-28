# Transactional Models

This document describes the transactional monetization models in SL18 + Waliin Studio, including TVOD, PVOD, SVOD, AVOD, EST, and hybrid models.

## Overview

Transactional models enable flexible monetization beyond subscriptions:
- **TVOD**: Transactional Video on Demand (pay-per-view rentals)
- **PVOD**: Premium VOD (early access window)
- **SVOD**: Subscription VOD (included in subscription)
- **AVOD**: Ad-supported VOD (free with ads)
- **EST**: Electronic Sell-Through (digital purchase)
- **Hybrid**: Combination models

## Schema: `schemas/transactional_models.schema.json`

## Model Types

### TVOD (Transactional Video on Demand)

Rental access for a limited time period.

```json
{
  "tvod": {
    "enabled": true,
    "rentalPrice": 4.99,
    "rentalPeriodHours": 48,
    "hdUpchargePercentage": 20,
    "uhd4kUpchargePercentage": 50,
    "regionalPricing": [
      { "region": "EA", "currency": "KES", "rentalPrice": 200 }
    ]
  }
}
```

### PVOD (Premium VOD)

Early access before general release.

```json
{
  "pvod": {
    "enabled": true,
    "premiumPrice": 19.99,
    "earlyAccessDays": 14,
    "windowStart": "2024-02-01T00:00:00Z",
    "windowEnd": "2024-02-15T00:00:00Z",
    "includesDownload": false
  }
}
```

### SVOD (Subscription VOD)

Included in subscription tiers.

```json
{
  "svod": {
    "enabled": true,
    "includedInTiers": ["standard", "premium", "vip"],
    "svodWindowStart": "2024-05-01T00:00:00Z"
  }
}
```

### AVOD (Ad-supported VOD)

Free access with advertising.

```json
{
  "avod": {
    "enabled": true,
    "adLoadConfiguration": {
      "preRollEnabled": true,
      "preRollMaxSeconds": 30,
      "midRollEnabled": true,
      "midRollIntervalMinutes": 10
    },
    "adFreeTierUpgrade": "tier-standard-001"
  }
}
```

### EST (Electronic Sell-Through)

Permanent digital purchase.

```json
{
  "est": {
    "enabled": true,
    "purchasePrice": 14.99,
    "hdPurchasePrice": 17.99,
    "uhd4kPurchasePrice": 24.99,
    "includesDownload": true,
    "downloadRetentionDays": -1
  }
}
```

### Hybrid Models

Combination of base model with add-ons.

```json
{
  "hybrid": {
    "enabled": true,
    "baseModel": "svod",
    "addOns": [
      { "addOnType": "pvod", "price": 1.99, "description": "Watch next episode early" },
      { "addOnType": "ad_removal", "price": 2.99, "description": "Remove all ads" }
    ]
  }
}
```

## Window Management

### Windowing Strategy

Content moves through availability windows over time:

1. **Theatrical** (if applicable)
2. **PVOD** (Day 1-14): Premium early access
3. **TVOD** (Day 15-90): Rental availability
4. **SVOD** (Day 90+): Subscription availability
5. **AVOD** (Day 180+): Free with ads
6. **Library**: Permanent catalog

### Window Configuration

```json
{
  "windows": [
    {
      "windowId": "pvod-window",
      "windowType": "pvod",
      "priority": 1,
      "startDate": "2024-02-01T00:00:00Z",
      "daysAfterRelease": 0
    },
    {
      "windowId": "tvod-window",
      "windowType": "tvod",
      "priority": 2,
      "daysAfterRelease": 14
    }
  ],
  "cascadeRules": [
    {
      "fromWindow": "pvod-window",
      "toWindow": "tvod-window",
      "transitionType": "automatic"
    }
  ]
}
```

## Bundling

Bundle content for discounts:

```json
{
  "bundling": {
    "bundleEnabled": true,
    "bundleType": "season",
    "bundleDiscount": 25,
    "bundledContentIds": ["ep-001", "ep-002", "ep-003"]
  }
}
```

## Promotions

```json
{
  "promotions": [
    {
      "promotionId": "launch-discount",
      "promotionType": "discount",
      "value": 30,
      "promoCode": "LAUNCH30",
      "validFrom": "2024-01-01T00:00:00Z",
      "validUntil": "2024-01-31T23:59:59Z"
    }
  ]
}
```

## Revenue Settings

```json
{
  "revenueSettings": {
    "platformFeePercentage": 30,
    "creatorSplitPercentage": 70,
    "paymentProcessingFee": 2.9,
    "minimumPayout": 50
  }
}
```

## Integration Points

- **Phase 28**: Media distribution pipeline
- **Phase 29**: Waliin Studio content detail pages
- **Phase 30**: Short-form distribution
- **Phase 32**: Ad insertion, analytics

## API Events

| Event | Description |
|-------|-------------|
| `tvod_rental_started` | TVOD rental initiated |
| `tvod_rental_expired` | TVOD rental period ended |
| `pvod_purchase_completed` | PVOD early access purchased |
| `est_purchase_completed` | Digital purchase completed |
| `window_transition` | Content moved to new window |

## Best Practices

1. **Window Strategy**: Plan windows before release
2. **Regional Pricing**: Adjust for local markets
3. **Bundling**: Offer season bundles for series
4. **Promotions**: Time promotions with content launches
5. **Analytics**: Track revenue by model type
