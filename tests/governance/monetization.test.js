/**
 * SL18 Monetization Models & Subscription Tiers Test Suite
 * Phase 32: Subscription Tiers, Transactional Models, Ad Insertion, Regional Pricing, Monetization Analytics
 * 
 * Run: node tests/governance/monetization.test.js
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

// Test result tracking
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    failures.push({ name, error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertArrayIncludes(arr, value, message) {
  if (!arr.includes(value)) {
    throw new Error(message || `Array does not include ${value}`);
  }
}

function assertInRange(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(message || `Value ${value} not in range [${min}, ${max}]`);
  }
}

// Load JSON files
function loadJSON(path) {
  const fullPath = join(repoRoot, path);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${path}`);
  }
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

// Subscription Tier validation
function validateSubscriptionTier(data) {
  const required = ['tierId', 'franchiseId', 'tierName', 'pricing', 'features', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validTierNames = ['free', 'basic', 'standard', 'premium', 'vip', 'family', 'student', 'enterprise'];
  if (!validTierNames.includes(data.tierName)) {
    return { valid: false, error: 'tierName must be one of enum values' };
  }

  if (data.tierId.length < 5) {
    return { valid: false, error: 'tierId must be at least 5 characters' };
  }

  if (data.pricing.monthlyPrice < 0) {
    return { valid: false, error: 'monthlyPrice cannot be negative' };
  }

  const validStatuses = ['draft', 'active', 'deprecated', 'archived'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Transactional Model validation
function validateTransactionalModel(data) {
  const required = ['modelId', 'franchiseId', 'modelType', 'modelConfig', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validModelTypes = ['tvod', 'pvod', 'svod', 'avod', 'est', 'hybrid'];
  if (!validModelTypes.includes(data.modelType)) {
    return { valid: false, error: 'modelType must be one of enum values' };
  }

  const validStatuses = ['draft', 'active', 'paused', 'expired', 'archived'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Ad Configuration validation
function validateAdConfig(data) {
  const required = ['adConfigId', 'franchiseId', 'configType', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validConfigTypes = ['global', 'franchise', 'content', 'campaign'];
  if (!validConfigTypes.includes(data.configType)) {
    return { valid: false, error: 'configType must be one of enum values' };
  }

  const validStatuses = ['draft', 'active', 'paused', 'archived'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Regional Pricing validation
function validateRegionalPricing(data) {
  const required = ['pricingConfigId', 'franchiseId', 'configScope', 'baseCurrency', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validScopes = ['global', 'regional', 'country', 'franchise'];
  if (!validScopes.includes(data.configScope)) {
    return { valid: false, error: 'configScope must be one of enum values' };
  }

  const validStatuses = ['draft', 'active', 'paused', 'archived'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Monetization Analytics validation
function validateMonetizationAnalytics(data) {
  const required = ['analyticsId', 'franchiseId', 'periodStart', 'periodEnd', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validStatuses = ['collecting', 'processing', 'ready', 'stale', 'error'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Calculate MRR
function calculateMRR(subscribers, tierPrices) {
  let mrr = 0;
  for (const tier of subscribers) {
    mrr += tier.subscribers * (tierPrices[tier.tier] || 0);
  }
  return mrr;
}

// Calculate Churn Rate
function calculateChurnRate(cancelled, total) {
  if (total === 0) return 0;
  return (cancelled / total) * 100;
}

// Calculate ARPU
function calculateARPU(revenue, subscribers) {
  if (subscribers === 0) return 0;
  return revenue / subscribers;
}

// Calculate LTV
function calculateLTV(arpu, avgLifetimeMonths) {
  return arpu * avgLifetimeMonths;
}

// Calculate Ad CPM
function calculateCPM(revenue, impressions) {
  if (impressions === 0) return 0;
  return (revenue / impressions) * 1000;
}

// Calculate Fill Rate
function calculateFillRate(filled, total) {
  if (total === 0) return 0;
  return (filled / total) * 100;
}

// Apply PPP adjustment
function applyPPPAdjustment(basePrice, pppMultiplier) {
  return basePrice * pppMultiplier;
}

// ==================== TEST SUITE ====================

console.log('=== Phase 32: Monetization Models & Subscription Tiers Tests ===\n');

// Load test fixtures and schemas
const fixtures = loadJSON('tests/governance/fixtures/monetization.json');
const subscriptionTiersSchema = loadJSON('schemas/subscription_tiers.schema.json');
const transactionalModelsSchema = loadJSON('schemas/transactional_models.schema.json');
const adInsertionSchema = loadJSON('schemas/ad_insertion.schema.json');
const regionalPricingSchema = loadJSON('schemas/regional_pricing.schema.json');
const monetizationAnalyticsSchema = loadJSON('schemas/monetization_analytics.schema.json');
const auditLogSchema = loadJSON('schemas/audit_log.schema.json');

// ==================== SCHEMA STRUCTURE TESTS ====================
console.log('\n--- Schema Structure Tests ---');

test('Subscription Tiers schema has required properties', () => {
  assert(subscriptionTiersSchema.properties.tierId, 'tierId property exists');
  assert(subscriptionTiersSchema.properties.tierName, 'tierName property exists');
  assert(subscriptionTiersSchema.properties.pricing, 'pricing property exists');
  assert(subscriptionTiersSchema.properties.features, 'features property exists');
  assertArrayIncludes(subscriptionTiersSchema.required, 'tierId', 'tierId is required');
  assertArrayIncludes(subscriptionTiersSchema.required, 'pricing', 'pricing is required');
});

test('Subscription Tiers schema has valid tier name enum', () => {
  const tierEnum = subscriptionTiersSchema.properties.tierName.enum;
  assertArrayIncludes(tierEnum, 'free', 'free tier exists');
  assertArrayIncludes(tierEnum, 'basic', 'basic tier exists');
  assertArrayIncludes(tierEnum, 'standard', 'standard tier exists');
  assertArrayIncludes(tierEnum, 'premium', 'premium tier exists');
  assertArrayIncludes(tierEnum, 'vip', 'vip tier exists');
  assertArrayIncludes(tierEnum, 'family', 'family tier exists');
});

test('Transactional Models schema has required properties', () => {
  assert(transactionalModelsSchema.properties.modelId, 'modelId property exists');
  assert(transactionalModelsSchema.properties.modelType, 'modelType property exists');
  assert(transactionalModelsSchema.properties.modelConfig, 'modelConfig property exists');
  assertArrayIncludes(transactionalModelsSchema.required, 'modelId', 'modelId is required');
  assertArrayIncludes(transactionalModelsSchema.required, 'modelType', 'modelType is required');
});

test('Transactional Models schema has valid model type enum', () => {
  const modelEnum = transactionalModelsSchema.properties.modelType.enum;
  assertArrayIncludes(modelEnum, 'tvod', 'tvod model exists');
  assertArrayIncludes(modelEnum, 'pvod', 'pvod model exists');
  assertArrayIncludes(modelEnum, 'svod', 'svod model exists');
  assertArrayIncludes(modelEnum, 'avod', 'avod model exists');
  assertArrayIncludes(modelEnum, 'est', 'est model exists');
  assertArrayIncludes(modelEnum, 'hybrid', 'hybrid model exists');
});

test('Ad Insertion schema has required properties', () => {
  assert(adInsertionSchema.properties.adConfigId, 'adConfigId property exists');
  assert(adInsertionSchema.properties.configType, 'configType property exists');
  assert(adInsertionSchema.properties.ssaiConfig, 'ssaiConfig property exists');
  assert(adInsertionSchema.properties.adPlacements, 'adPlacements property exists');
  assert(adInsertionSchema.properties.targeting, 'targeting property exists');
});

test('Ad Insertion schema has SSAI provider enum', () => {
  const providerEnum = adInsertionSchema.properties.ssaiConfig.properties.provider.enum;
  assertArrayIncludes(providerEnum, 'aws_mediatailor', 'AWS MediaTailor supported');
  assertArrayIncludes(providerEnum, 'google_ad_manager', 'Google Ad Manager supported');
  assertArrayIncludes(providerEnum, 'freewheel', 'FreeWheel supported');
});

test('Regional Pricing schema has required properties', () => {
  assert(regionalPricingSchema.properties.pricingConfigId, 'pricingConfigId property exists');
  assert(regionalPricingSchema.properties.baseCurrency, 'baseCurrency property exists');
  assert(regionalPricingSchema.properties.regionalTiers, 'regionalTiers property exists');
  assert(regionalPricingSchema.properties.paymentGateways, 'paymentGateways property exists');
  assert(regionalPricingSchema.properties.taxCompliance, 'taxCompliance property exists');
});

test('Regional Pricing schema has payment gateway types', () => {
  const gatewayTypes = regionalPricingSchema.properties.paymentGateways.items.properties.gatewayType.enum;
  assertArrayIncludes(gatewayTypes, 'stripe', 'Stripe supported');
  assertArrayIncludes(gatewayTypes, 'paypal', 'PayPal supported');
  assertArrayIncludes(gatewayTypes, 'mpesa', 'M-Pesa supported');
  assertArrayIncludes(gatewayTypes, 'flutterwave', 'Flutterwave supported');
});

test('Monetization Analytics schema has required properties', () => {
  assert(monetizationAnalyticsSchema.properties.analyticsId, 'analyticsId property exists');
  assert(monetizationAnalyticsSchema.properties.subscriptionMetrics, 'subscriptionMetrics property exists');
  assert(monetizationAnalyticsSchema.properties.transactionMetrics, 'transactionMetrics property exists');
  assert(monetizationAnalyticsSchema.properties.adMetrics, 'adMetrics property exists');
  assert(monetizationAnalyticsSchema.properties.forecasting, 'forecasting property exists');
});

// ==================== SUBSCRIPTION TIER VALIDATION TESTS ====================
console.log('\n--- Subscription Tier Validation Tests ---');

test('Valid free tier passes validation', () => {
  const tier = fixtures.validSubscriptionTiers[0];
  const result = validateSubscriptionTier(tier);
  assert(result.valid, `Validation failed: ${result.error}`);
  assertEqual(tier.tierName, 'free', 'Tier is free');
  assertEqual(tier.pricing.monthlyPrice, 0, 'Free tier has zero price');
});

test('Valid premium tier passes validation', () => {
  const tier = fixtures.validSubscriptionTiers[1];
  const result = validateSubscriptionTier(tier);
  assert(result.valid, `Validation failed: ${result.error}`);
  assertEqual(tier.tierName, 'premium', 'Tier is premium');
  assert(tier.pricing.monthlyPrice > 0, 'Premium tier has positive price');
});

test('Premium tier has correct features', () => {
  const tier = fixtures.validSubscriptionTiers[1];
  assert(tier.features.contentAccess.fullCatalog, 'Full catalog access enabled');
  assert(tier.features.contentAccess.premiumContent, 'Premium content enabled');
  assertEqual(tier.features.streamingQuality.maxResolution, '4K', '4K streaming enabled');
  assert(tier.features.streamingQuality.hdr, 'HDR enabled');
  assert(tier.features.downloads.enabled, 'Downloads enabled');
  assertEqual(tier.features.profiles.maxProfiles, 6, '6 profiles allowed');
});

test('Free tier has ad-supported features', () => {
  const tier = fixtures.validSubscriptionTiers[0];
  assert(tier.features.ads.adSupported, 'Ads are supported');
  assertEqual(tier.features.ads.adFrequency, 'high', 'High ad frequency');
  assert(!tier.features.contentAccess.premiumContent, 'No premium content');
});

test('Invalid subscription tier fails validation', () => {
  const tier = fixtures.invalidSubscriptionTiers[0];
  const result = validateSubscriptionTier(tier);
  assert(!result.valid, 'Invalid tier should fail validation');
});

test('Regional pricing is applied correctly', () => {
  const tier = fixtures.validSubscriptionTiers[1];
  const kenyaPricing = tier.pricing.regionalPricing.find(p => p.country === 'KE');
  assert(kenyaPricing, 'Kenya pricing exists');
  assertEqual(kenyaPricing.currency, 'KES', 'Currency is KES');
  assert(kenyaPricing.monthlyPrice < tier.pricing.monthlyPrice * 200, 'PPP adjusted price is reasonable');
});

test('Retention offers are configured', () => {
  const tier = fixtures.validSubscriptionTiers[1];
  assert(tier.retention, 'Retention config exists');
  assert(tier.retention.retentionOffers.length > 0, 'Retention offers exist');
  const discountOffer = tier.retention.retentionOffers.find(o => o.offerType === 'discount');
  assert(discountOffer, 'Discount offer exists');
});

// ==================== TRANSACTIONAL MODEL VALIDATION TESTS ====================
console.log('\n--- Transactional Model Validation Tests ---');

test('Valid TVOD model passes validation', () => {
  const model = fixtures.validTransactionalModels[0];
  const result = validateTransactionalModel(model);
  assert(result.valid, `Validation failed: ${result.error}`);
  assertEqual(model.modelType, 'tvod', 'Model is TVOD');
});

test('Valid hybrid model passes validation', () => {
  const model = fixtures.validTransactionalModels[1];
  const result = validateTransactionalModel(model);
  assert(result.valid, `Validation failed: ${result.error}`);
  assertEqual(model.modelType, 'hybrid', 'Model is hybrid');
});

test('TVOD model has window management', () => {
  const model = fixtures.validTransactionalModels[0];
  assert(model.windowManagement, 'Window management exists');
  assert(model.windowManagement.windows.length >= 3, 'At least 3 windows defined');
  const pvodWindow = model.windowManagement.windows.find(w => w.windowType === 'pvod');
  assert(pvodWindow, 'PVOD window exists');
});

test('Window cascade rules are configured', () => {
  const model = fixtures.validTransactionalModels[0];
  assert(model.windowManagement.cascadeRules, 'Cascade rules exist');
  assert(model.windowManagement.cascadeRules.length > 0, 'At least one cascade rule');
});

test('Hybrid model has add-ons', () => {
  const model = fixtures.validTransactionalModels[1];
  assert(model.modelConfig.hybrid.addOns, 'Add-ons exist');
  assert(model.modelConfig.hybrid.addOns.length > 0, 'At least one add-on');
});

test('Invalid transactional model fails validation', () => {
  const model = fixtures.invalidTransactionalModels[0];
  const result = validateTransactionalModel(model);
  assert(!result.valid, 'Invalid model should fail validation');
});

// ==================== AD INSERTION VALIDATION TESTS ====================
console.log('\n--- Ad Insertion Validation Tests ---');

test('Valid ad configuration passes validation', () => {
  const config = fixtures.validAdConfigurations[0];
  const result = validateAdConfig(config);
  assert(result.valid, `Validation failed: ${result.error}`);
});

test('SSAI is configured correctly', () => {
  const config = fixtures.validAdConfigurations[0];
  assert(config.ssaiConfig.enabled, 'SSAI is enabled');
  assertEqual(config.ssaiConfig.provider, 'aws_mediatailor', 'Provider is AWS MediaTailor');
  assert(config.ssaiConfig.personalizedAds, 'Personalized ads enabled');
});

test('Ad placements are configured', () => {
  const config = fixtures.validAdConfigurations[0];
  assert(config.adPlacements.preRoll, 'Pre-roll exists');
  assert(config.adPlacements.midRoll, 'Mid-roll exists');
  assert(config.adPlacements.preRoll.enabled, 'Pre-roll is enabled');
  assertEqual(config.adPlacements.preRoll.maxDurationSeconds, 30, 'Pre-roll max 30 seconds');
});

test('Targeting is configured', () => {
  const config = fixtures.validAdConfigurations[0];
  assert(config.targeting.demographicTargeting.enabled, 'Demographic targeting enabled');
  assert(config.targeting.geoTargeting.enabled, 'Geo targeting enabled');
  assert(config.targeting.behavioralTargeting.enabled, 'Behavioral targeting enabled');
});

test('Frequency capping is configured', () => {
  const config = fixtures.validAdConfigurations[0];
  assert(config.frequencyCapping.enabled, 'Frequency capping enabled');
  assertEqual(config.frequencyCapping.maxImpressionsPerHour, 8, 'Max 8 impressions per hour');
});

test('Ad compliance is configured', () => {
  const config = fixtures.validAdConfigurations[0];
  assert(config.compliance.gdprCompliant, 'GDPR compliant');
  assert(config.compliance.coppaCompliant, 'COPPA compliant');
  assert(config.compliance.culturalSensitivityFilters, 'Cultural sensitivity filters enabled');
  assertArrayIncludes(config.compliance.adCategoriesBlocked, 'alcohol', 'Alcohol ads blocked');
});

test('Sponsorship is configured', () => {
  const config = fixtures.validAdConfigurations[0];
  assert(config.sponsorship.enabled, 'Sponsorship enabled');
  assert(config.sponsorship.sponsors.length > 0, 'At least one sponsor');
  assertEqual(config.sponsorship.sponsors[0].sponsorshipType, 'presenting', 'Presenting sponsor');
});

// ==================== REGIONAL PRICING VALIDATION TESTS ====================
console.log('\n--- Regional Pricing Validation Tests ---');

test('Valid regional pricing passes validation', () => {
  const pricing = fixtures.validRegionalPricing[0];
  const result = validateRegionalPricing(pricing);
  assert(result.valid, `Validation failed: ${result.error}`);
});

test('Regional tiers are configured', () => {
  const pricing = fixtures.validRegionalPricing[0];
  assert(pricing.regionalTiers.length >= 2, 'At least 2 regional tiers');
  const kenyaTier = pricing.regionalTiers.find(t => t.countries.includes('KE'));
  assert(kenyaTier, 'Kenya tier exists');
  assertEqual(kenyaTier.currency, 'KES', 'Kenya currency is KES');
});

test('PPP adjustment is applied', () => {
  const pricing = fixtures.validRegionalPricing[0];
  const kenyaTier = pricing.regionalTiers.find(t => t.countries.includes('KE'));
  assert(kenyaTier.pppMultiplier < 1, 'PPP multiplier is less than 1 for Kenya');
  assertInRange(kenyaTier.pppMultiplier, 0, 1, 'PPP multiplier in valid range');
});

test('Payment gateways are configured', () => {
  const pricing = fixtures.validRegionalPricing[0];
  assert(pricing.paymentGateways.length >= 2, 'At least 2 payment gateways');
  const mpesa = pricing.paymentGateways.find(g => g.gatewayType === 'mpesa');
  assert(mpesa, 'M-Pesa gateway exists');
  assertArrayIncludes(mpesa.paymentMethods, 'mobile_money', 'M-Pesa supports mobile money');
});

test('Tax compliance is configured', () => {
  const pricing = fixtures.validRegionalPricing[0];
  assert(pricing.taxCompliance.autoCalculateTax, 'Auto tax calculation enabled');
  assert(pricing.taxCompliance.taxRules.length > 0, 'Tax rules exist');
  const kenyaVAT = pricing.taxCompliance.taxRules.find(r => r.country === 'KE');
  assert(kenyaVAT, 'Kenya VAT rule exists');
  assertEqual(kenyaVAT.taxRate, 16, 'Kenya VAT rate is 16%');
});

test('Fraud detection is configured', () => {
  const pricing = fixtures.validRegionalPricing[0];
  assert(pricing.fraudDetection.enabled, 'Fraud detection enabled');
  assert(pricing.fraudDetection.checks.vpnDetection, 'VPN detection enabled');
  assert(pricing.fraudDetection.checks.deviceFingerprinting, 'Device fingerprinting enabled');
});

// ==================== MONETIZATION ANALYTICS VALIDATION TESTS ====================
console.log('\n--- Monetization Analytics Validation Tests ---');

test('Valid monetization analytics passes validation', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  const result = validateMonetizationAnalytics(analytics);
  assert(result.valid, `Validation failed: ${result.error}`);
});

test('Subscription metrics are calculated', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  assert(analytics.subscriptionMetrics.totalSubscribers > 0, 'Total subscribers > 0');
  assert(analytics.subscriptionMetrics.mrr > 0, 'MRR > 0');
  assert(analytics.subscriptionMetrics.arpu > 0, 'ARPU > 0');
  assertInRange(analytics.subscriptionMetrics.churnRate, 0, 100, 'Churn rate in valid range');
});

test('Tier breakdown is provided', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  assert(analytics.subscriptionMetrics.tierBreakdown.length >= 4, 'At least 4 tiers');
  const premiumTier = analytics.subscriptionMetrics.tierBreakdown.find(t => t.tier === 'premium');
  assert(premiumTier, 'Premium tier exists');
  assert(premiumTier.revenue > 0, 'Premium tier has revenue');
});

test('Transaction metrics are calculated', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  assert(analytics.transactionMetrics.totalTransactions > 0, 'Total transactions > 0');
  assert(analytics.transactionMetrics.totalRevenue > 0, 'Total revenue > 0');
});

test('Revenue by type is broken down', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  const revenueByType = analytics.transactionMetrics.revenueByType;
  assert(revenueByType.subscription > 0, 'Subscription revenue > 0');
  assert(revenueByType.ads > 0, 'Ad revenue > 0');
});

test('Ad metrics are calculated', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  assert(analytics.adMetrics.totalImpressions > 0, 'Total impressions > 0');
  assert(analytics.adMetrics.cpm > 0, 'CPM > 0');
  assertInRange(analytics.adMetrics.fillRate, 0, 100, 'Fill rate in valid range');
});

test('Content performance is tracked', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  assert(analytics.contentPerformance.length > 0, 'Content performance tracked');
  const topContent = analytics.contentPerformance[0];
  assert(topContent.revenue > 0, 'Top content has revenue');
  assertEqual(topContent.revenueRank, 1, 'Top content is rank 1');
});

test('Forecasting is provided', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  assert(analytics.forecasting.revenueProjection, 'Revenue projection exists');
  assert(analytics.forecasting.subscriberProjection, 'Subscriber projection exists');
  assert(analytics.forecasting.churnPrediction, 'Churn prediction exists');
});

// ==================== CALCULATION TESTS ====================
console.log('\n--- Monetization Calculation Tests ---');

test('MRR calculation is correct', () => {
  const tierPrices = { 'free': 0, 'basic': 4.99, 'standard': 9.99, 'premium': 14.99 };
  const subscribers = [
    { tier: 'free', subscribers: 45000 },
    { tier: 'basic', subscribers: 35000 },
    { tier: 'standard', subscribers: 30000 },
    { tier: 'premium', subscribers: 15000 }
  ];
  const mrr = calculateMRR(subscribers, tierPrices);
  assert(mrr > 0, 'MRR is positive');
  // Expected: 0 + 174650 + 299700 + 224850 = 699200
  assertInRange(mrr, 690000, 710000, 'MRR in expected range');
});

test('Churn rate calculation is correct', () => {
  const churnRate = calculateChurnRate(3200, 125000);
  assertInRange(churnRate, 2.5, 2.6, 'Churn rate is ~2.56%');
});

test('ARPU calculation is correct', () => {
  const arpu = calculateARPU(850000, 125000);
  assertEqual(arpu, 6.8, 'ARPU is $6.80');
});

test('LTV calculation is correct', () => {
  const ltv = calculateLTV(6.80, 12);
  assertEqual(ltv, 81.6, 'LTV is $81.60 for 12 months');
});

test('CPM calculation is correct', () => {
  const cpm = calculateCPM(180000, 45000000);
  assertEqual(cpm, 4, 'CPM is $4.00');
});

test('Fill rate calculation is correct', () => {
  const fillRate = calculateFillRate(92, 100);
  assertEqual(fillRate, 92, 'Fill rate is 92%');
});

test('PPP adjustment calculation is correct', () => {
  const adjustedPrice = applyPPPAdjustment(14.99, 0.35);
  assertInRange(adjustedPrice, 5.2, 5.3, 'PPP adjusted price is ~$5.25');
});

// ==================== AUDIT LOG TESTS ====================
console.log('\n--- Audit Log Integration Tests ---');

test('Audit log has monetization event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'subscription_created', 'subscription_created event exists');
  assertArrayIncludes(eventTypes, 'subscription_renewed', 'subscription_renewed event exists');
  assertArrayIncludes(eventTypes, 'subscription_cancelled', 'subscription_cancelled event exists');
  assertArrayIncludes(eventTypes, 'tier_upgraded', 'tier_upgraded event exists');
  assertArrayIncludes(eventTypes, 'tier_downgraded', 'tier_downgraded event exists');
});

test('Audit log has payment event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'payment_initiated', 'payment_initiated event exists');
  assertArrayIncludes(eventTypes, 'payment_completed', 'payment_completed event exists');
  assertArrayIncludes(eventTypes, 'payment_failed', 'payment_failed event exists');
  assertArrayIncludes(eventTypes, 'payment_refunded', 'payment_refunded event exists');
});

test('Audit log has ad event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'ad_served', 'ad_served event exists');
  assertArrayIncludes(eventTypes, 'ad_revenue_recorded', 'ad_revenue_recorded event exists');
});

// ==================== DOCUMENTATION TESTS ====================
console.log('\n--- Documentation Tests ---');

test('Subscription Tiers documentation exists', () => {
  assert(existsSync(join(repoRoot, 'Docs/subscription_tiers.md')), 'subscription_tiers.md exists');
});

test('Transactional Models documentation exists', () => {
  assert(existsSync(join(repoRoot, 'Docs/transactional_models.md')), 'transactional_models.md exists');
});

test('Ad Insertion documentation exists', () => {
  assert(existsSync(join(repoRoot, 'Docs/ad_insertion.md')), 'ad_insertion.md exists');
});

test('Regional Pricing documentation exists', () => {
  assert(existsSync(join(repoRoot, 'Docs/regional_pricing.md')), 'regional_pricing.md exists');
});

test('Monetization Analytics documentation exists', () => {
  assert(existsSync(join(repoRoot, 'Docs/monetization_analytics.md')), 'monetization_analytics.md exists');
});

// ==================== INTEGRATION TESTS ====================
console.log('\n--- Integration Tests ---');

test('Subscription tiers integrate with waliin customer schema', () => {
  const customerSchema = loadJSON('schemas/waliin_customer.schema.json');
  assert(customerSchema.properties.subscription, 'Customer schema has subscription property');
});

test('Ad insertion integrates with Phase 25 compliance', () => {
  const config = fixtures.validAdConfigurations[0];
  assert(config.compliance.culturalSensitivityFilters, 'Cultural sensitivity integrated');
});

test('Regional pricing integrates with Phase 30 distribution', () => {
  const pricing = fixtures.validRegionalPricing[0];
  assert(pricing.regionalTiers.some(t => t.region === 'EA'), 'East Africa region supported');
  assert(pricing.regionalTiers.some(t => t.region === 'EA'), 'Integration with Phase 30 distribution');
});

test('Monetization analytics feeds to Phase 17 personalization', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  assert(analytics.integrations.feedToPersonalization, 'Feeds to personalization engine');
});

test('Monetization analytics feeds to Phase 20 audience insights', () => {
  const analytics = fixtures.validMonetizationAnalytics[0];
  assert(analytics.integrations.feedToAudienceInsights, 'Feeds to audience insights');
});

// ==================== SUMMARY ====================
console.log('\n========================================');
console.log(`Phase 32 Tests Complete: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => {
    console.log(`  - ${f.name}: ${f.error}`);
  });
  process.exit(1);
}

process.exit(0);
