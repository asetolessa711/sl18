# Regional Pricing

This document describes the regional pricing system in SL18 + Waliin Studio, including geo-based pricing, payment gateways, tax compliance, and fraud detection.

## Overview

The regional pricing system enables:
- **PPP Pricing**: Purchasing Power Parity adjusted pricing
- **Local Currencies**: Support for regional currencies
- **Payment Gateways**: Local payment methods (M-Pesa, Flutterwave)
- **Tax Compliance**: VAT, GST, and local tax handling
- **Fraud Detection**: VPN/proxy detection, risk scoring

## Schema: `schemas/regional_pricing.schema.json`

## Regional Tiers

### PPP Adjustment

Pricing is adjusted based on local purchasing power:

| Region | Countries | PPP Multiplier | Affordability Index |
|--------|-----------|----------------|---------------------|
| North America | US, CA | 1.0 | 1.0 |
| Europe | UK, DE, FR | 0.95 | 0.9 |
| East Africa | KE, ET, TZ, UG | 0.35 | 0.4 |
| West Africa | NG, GH | 0.40 | 0.45 |
| South Asia | IN, PK, BD | 0.30 | 0.35 |

### Configuration Example

```json
{
  "regionalTiers": [
    {
      "tierId": "tier-ea-kenya",
      "region": "EA",
      "countries": ["KE"],
      "currency": "KES",
      "exchangeRate": 155.5,
      "exchangeRateSource": "live_api",
      "pppMultiplier": 0.35,
      "affordabilityIndex": 0.4,
      "subscriptionPricing": {
        "free": { "monthly": 0, "annual": 0 },
        "basic": { "monthly": 199, "annual": 1999 },
        "standard": { "monthly": 399, "annual": 3999 },
        "premium": { "monthly": 599, "annual": 5999 }
      },
      "tvodPricing": {
        "rentalPrice": 150,
        "hdUpcharge": 30,
        "uhd4kUpcharge": 75
      }
    }
  ]
}
```

## Payment Gateways

### Supported Gateways

| Gateway | Type | Regions | Payment Methods |
|---------|------|---------|-----------------|
| Stripe | Global | All | Cards, Bank |
| PayPal | Global | All | PayPal, Cards |
| M-Pesa | Mobile | EA | Mobile Money |
| Flutterwave | Africa | EA, WA | Cards, Mobile |
| Razorpay | India | SA | Cards, UPI |
| Apple Pay | Global | All | Apple Wallet |
| Google Pay | Global | All | Google Wallet |

### Gateway Configuration

```json
{
  "paymentGateways": [
    {
      "gatewayId": "gateway-mpesa",
      "gatewayType": "mpesa",
      "gatewayName": "M-Pesa Kenya",
      "supportedRegions": ["EA"],
      "supportedCountries": ["KE"],
      "supportedCurrencies": ["KES"],
      "paymentMethods": ["mobile_money"],
      "processingFeePercentage": 1.5,
      "settlementDays": 2,
      "priority": 1,
      "enabled": true
    }
  ]
}
```

## Tax Compliance

### Tax Types
- **VAT**: Value Added Tax (EU, Africa)
- **GST**: Goods and Services Tax (India, Australia)
- **Sales Tax**: US state taxes
- **Digital Services Tax**: UK, France, etc.
- **Withholding Tax**: Creator payments

### Tax Configuration

```json
{
  "taxCompliance": {
    "autoCalculateTax": true,
    "taxProvider": "avalara",
    "defaultTaxBehavior": "inclusive",
    "taxRules": [
      {
        "ruleId": "vat-ke",
        "country": "KE",
        "taxType": "vat",
        "taxRate": 16,
        "taxName": "Kenya VAT",
        "applicableTo": ["subscription", "tvod"]
      },
      {
        "ruleId": "vat-et",
        "country": "ET",
        "taxType": "vat",
        "taxRate": 15,
        "taxName": "Ethiopia VAT"
      }
    ],
    "vatValidation": {
      "enabled": true,
      "reverseChargeEnabled": true
    }
  }
}
```

### Tax Providers
- Avalara
- TaxJar
- Stripe Tax
- Manual

## Fraud Detection

### Risk Scoring

```json
{
  "fraudDetection": {
    "enabled": true,
    "provider": "stripe_radar",
    "riskThresholds": {
      "block": 85,
      "review": 60,
      "allow": 30
    }
  }
}
```

### Fraud Checks

```json
{
  "checks": {
    "vpnDetection": true,
    "proxyDetection": true,
    "velocityChecks": true,
    "cardBinChecks": true,
    "addressVerification": true,
    "deviceFingerprinting": true
  }
}
```

### Providers
- Stripe Radar
- Sift
- Forter
- Signifyd
- Custom

## Currency Conversion

```json
{
  "currencyConversion": {
    "provider": "openexchangerates",
    "updateFrequency": "daily",
    "markupPercentage": 1,
    "roundingStrategy": "psychological",
    "fallbackRates": {
      "KES": 155.5,
      "ETB": 56.5,
      "NGN": 1550
    }
  }
}
```

### Rounding Strategies
- **Nearest**: Round to nearest unit
- **Up**: Always round up
- **Down**: Always round down
- **Psychological**: Round to .99

## Promotional Pricing

```json
{
  "promotionalPricing": {
    "enabled": true,
    "campaigns": [
      {
        "campaignId": "launch-ea",
        "campaignName": "East Africa Launch",
        "campaignType": "launch",
        "discountType": "percentage",
        "discountValue": 50,
        "applicableRegions": ["EA"],
        "promoCode": "LAUNCH50",
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-03-31T23:59:59Z"
      }
    ]
  }
}
```

## Integration Points

- **Phase 25**: Payment compliance (KYC/AML)
- **Phase 26**: Security fraud detection
- **Phase 30**: Distribution regional restrictions
- **Phase 32**: Subscription tiers, analytics

## API Events

| Event | Description |
|-------|-------------|
| `pricing_config_created` | Regional pricing created |
| `exchange_rate_updated` | Currency rate updated |
| `tax_calculated` | Tax amount calculated |
| `fraud_check_passed` | Fraud check cleared |
| `fraud_check_failed` | Fraud check blocked |
| `vpn_detected` | VPN usage detected |
| `gateway_selected` | Payment gateway selected |

## Best Practices

1. **PPP Pricing**: Always use PPP for emerging markets
2. **Local Payment**: Prioritize local payment methods
3. **Tax Compliance**: Auto-calculate taxes per region
4. **Fraud Prevention**: Enable all fraud checks
5. **Currency Updates**: Update exchange rates daily
6. **Promotional Timing**: Align campaigns with local events
