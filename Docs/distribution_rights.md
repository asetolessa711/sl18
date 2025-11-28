# Distribution Rights

This document describes the distribution rights management system in SL18, handling licensing, revenue share, geo-restrictions, and ad insertion for Waliin Studio content.

## Overview

Distribution rights management ensures content is properly licensed and monetized across all distribution channels. The system handles:

- License agreements and territories
- Revenue share models and payment terms
- Geo-restriction enforcement
- Ad insertion configuration
- Release window management

## License Types

| License Type | Description |
|-------------|-------------|
| `exclusive` | Sole distribution rights in territory |
| `non_exclusive` | Non-exclusive, can license to multiple partners |
| `co_exclusive` | Shared exclusivity with limited partners |
| `first_run` | First broadcast/premiere rights |
| `second_run` | Secondary distribution after first run |
| `library` | Catalog/library content licensing |

## Territory Management

### Territory Types

```json
{
  "territory": {
    "type": "regional",
    "regions": ["asia", "africa", "middle_east"],
    "countries": ["CN", "IN", "KE", "ET"],
    "excludedCountries": ["KP", "IR"]
  }
}
```

### Term Configuration

```json
{
  "term": {
    "startDate": "2024-01-01",
    "endDate": "2025-12-31",
    "autoRenewal": true,
    "renewalTerms": {
      "noticePeriodDays": 60,
      "maxRenewals": 3,
      "renewalDuration": 12
    }
  }
}
```

## Rights Categories

| Right | Description |
|-------|-------------|
| `streaming` | Online streaming rights |
| `download` | Download/offline viewing |
| `broadcast` | Linear TV broadcast |
| `shortForm` | Short-form clip distribution |
| `socialMedia` | Social media distribution |
| `editRights` | Right to edit/crop content |
| `subtitleCreation` | Right to create subtitles |
| `dubbingRights` | Right to create dubbed versions |

## Revenue Share Models

### Percentage Model

```json
{
  "model": "percentage",
  "splits": {
    "contentOwnerPercent": 55,
    "partnerPercent": 35,
    "platformPercent": 10
  }
}
```

### Tiered Model

Revenue splits that increase with performance:

```json
{
  "model": "tiered",
  "tieredRates": [
    {
      "tierName": "Base",
      "threshold": { "metric": "views", "minValue": 0, "maxValue": 1000000 },
      "contentOwnerPercent": 50,
      "partnerPercent": 40
    },
    {
      "tierName": "Growth",
      "threshold": { "metric": "views", "minValue": 1000001, "maxValue": 5000000 },
      "contentOwnerPercent": 55,
      "partnerPercent": 35
    },
    {
      "tierName": "Premium",
      "threshold": { "metric": "views", "minValue": 5000001 },
      "contentOwnerPercent": 60,
      "partnerPercent": 30
    }
  ]
}
```

### Minimum Guarantee

```json
{
  "minimumGuarantee": {
    "enabled": true,
    "amount": 50000,
    "currency": "USD",
    "period": "yearly",
    "recoupable": true
  }
}
```

### Performance Bonuses

```json
{
  "bonuses": [
    {
      "bonusType": "performance",
      "condition": "Views exceed 10 million in a month",
      "amount": 10000,
      "currency": "USD"
    },
    {
      "bonusType": "exclusivity",
      "condition": "Exclusive premiere rights",
      "amount": 5000,
      "currency": "USD"
    }
  ]
}
```

### Payment Terms

```json
{
  "paymentTerms": {
    "frequency": "monthly",
    "netDays": 30,
    "minimumPayout": 100,
    "currency": "USD",
    "paymentMethod": "wire_transfer"
  }
}
```

## Geo-Restrictions

### Configuration

```json
{
  "geoRestrictions": {
    "enabled": true,
    "defaultPolicy": "allow_listed",
    "allowedCountries": ["CN", "IN", "KE", "ET", "TZ"],
    "blockedCountries": ["KP", "IR", "CU", "SY"],
    "vpnDetection": {
      "enabled": true,
      "action": "block"
    },
    "proxyDetection": true
  }
}
```

### Region Rules

Apply different rules per region:

```json
{
  "regionRules": [
    {
      "region": "asia",
      "allowed": true,
      "startDate": "2024-01-01",
      "endDate": "2025-12-31",
      "contentRating": "TV-14",
      "restrictions": ["political_content_filtered"]
    },
    {
      "region": "middle_east",
      "allowed": true,
      "contentRating": "PG-13",
      "restrictions": ["cultural_sensitivity_enhanced"]
    }
  ]
}
```

## Ad Insertion

### Ad Configuration

```json
{
  "adInsertion": {
    "enabled": true,
    "adModel": "hybrid",
    "adTypes": ["pre_roll", "mid_roll", "rewarded"],
    "ssaiEnabled": true
  }
}
```

### Ad Frequency

```json
{
  "adFrequency": {
    "preRoll": {
      "enabled": true,
      "maxDurationSeconds": 15,
      "skipAfterSeconds": 5
    },
    "midRoll": {
      "enabled": true,
      "intervalSeconds": 300,
      "maxPerContent": 3,
      "minContentDurationSeconds": 600
    }
  }
}
```

### Ad Tiers

Different ad loads for user segments:

```json
{
  "adTiers": [
    {
      "tierName": "Free Users",
      "adLoad": 15,
      "adTypes": ["pre_roll", "mid_roll"],
      "targetCpm": 8
    },
    {
      "tierName": "Basic Subscribers",
      "adLoad": 5,
      "adTypes": ["pre_roll"],
      "targetCpm": 12
    }
  ]
}
```

### Ad Revenue Share

```json
{
  "adRevenueShare": {
    "contentOwnerPercent": 50,
    "partnerPercent": 40,
    "platformPercent": 10
  }
}
```

### Ad Restrictions

```json
{
  "adRestrictions": {
    "blockedCategories": ["gambling", "alcohol", "tobacco", "adult"],
    "competitorBlock": true,
    "brandSafetyLevel": "high"
  }
}
```

## Window Management

### Release Windows

```json
{
  "windows": [
    {
      "windowId": "window-premiere",
      "windowType": "premium_vod",
      "startDate": "2024-01-01",
      "endDate": "2024-03-31",
      "platforms": ["waliin_platform"],
      "territories": ["ET", "KE", "TZ"]
    },
    {
      "windowId": "window-svod",
      "windowType": "svod",
      "startDate": "2024-04-01",
      "endDate": "2024-09-30",
      "platforms": ["dramabox", "realshort"]
    },
    {
      "windowId": "window-avod",
      "windowType": "avod",
      "startDate": "2024-10-01",
      "platforms": ["all"]
    }
  ]
}
```

### Cascade Rules

Automatic window transitions:

```json
{
  "cascadeRules": [
    {
      "fromWindow": "window-premiere",
      "toWindow": "window-svod",
      "delayDays": 90
    },
    {
      "fromWindow": "window-svod",
      "toWindow": "window-avod",
      "delayDays": 180
    }
  ]
}
```

## Exclusivity & Holdback

### Exclusivity Configuration

```json
{
  "exclusivity": {
    "isExclusive": false,
    "exclusivityType": "window",
    "exclusivityWindow": {
      "startDate": "2024-01-01",
      "endDate": "2024-03-31",
      "durationDays": 90
    }
  }
}
```

### Holdback Periods

```json
{
  "holdback": {
    "enabled": true,
    "holdbackPeriodDays": 7,
    "holdbackPlatforms": ["youtube", "tiktok"],
    "afterPremiere": true
  }
}
```

## Compliance

```json
{
  "compliance": {
    "dataPrivacy": ["GDPR", "CCPA", "LGPD"],
    "contentRegulations": ["MPAA", "local_broadcasting_laws"],
    "copyrightClearance": true,
    "musicLicensing": true,
    "auditTrail": true
  }
}
```

## Rights Lifecycle

1. **Pending**: Rights agreement under negotiation
2. **Active**: Rights currently in effect
3. **Under Review**: Under compliance review
4. **Expired**: Rights term ended
5. **Suspended**: Temporarily suspended
6. **Terminated**: Agreement terminated

## Related Documentation

- [Distribution Connectors](./distribution_connectors.md)
- [Distribution Observability](./distribution_observability.md)
- [Payment Compliance](./payment_compliance.md)
- [Governance Suite](./governance_suite.md)
