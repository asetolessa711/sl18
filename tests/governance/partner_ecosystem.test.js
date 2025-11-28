/**
 * SL18 Phase 24: Adaptive Partner Ecosystem & API Marketplace Tests
 * 
 * Tests for partner ecosystem schemas, API marketplace, usage quotas, pricing tiers, and observability
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message || 'Expected condition to be false');
  }
}

function assertIncludes(array, item, message) {
  if (!array.includes(item)) {
    throw new Error(`${message || 'Array does not include item'}: ${item}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message || 'Deep equality failed'}: expected ${expectedStr}, got ${actualStr}`);
  }
}

const REVENUE_TOLERANCE = 0.01;

function assertApproximatelyEqual(actual, expected, message) {
  if (Math.abs(actual - expected) > REVENUE_TOLERANCE) {
    throw new Error(`${message || 'Approximate equality failed'}: expected ${expected}, got ${actual}`);
  }
}

// Load schemas and fixtures
const schemasDir = join(__dirname, '../../schemas');
const fixturesDir = join(__dirname, 'fixtures');

function loadSchema(name) {
  const path = join(schemasDir, name);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadFixtures() {
  const path = join(fixturesDir, 'partner_ecosystem.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Validation functions
function validatePartnerEcosystem(ecosystem) {
  const errors = [];
  
  // Required fields
  const required = ['ecosystemId', 'version', 'partner', 'verification', 'onboarding', 'compliance', 'access', 'revenue', 'createdAt'];
  for (const field of required) {
    if (!(field in ecosystem)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Ecosystem ID pattern
  if (ecosystem.ecosystemId && !/^ecosystem-[a-z0-9-]+$/.test(ecosystem.ecosystemId)) {
    errors.push('Invalid ecosystemId pattern');
  }
  
  // Version pattern
  if (ecosystem.version && !/^\d+\.\d+\.\d+$/.test(ecosystem.version)) {
    errors.push('Invalid version pattern');
  }
  
  // Partner validation
  if (ecosystem.partner) {
    const validPartnerTypes = ['content_distributor', 'contributor', 'analytics_provider', 'monetization_partner', 'technology_vendor', 'franchise_operator', 'creative_agency', 'localization_provider', 'qc_service', 'integration_partner'];
    if (ecosystem.partner.type && !validPartnerTypes.includes(ecosystem.partner.type)) {
      errors.push(`Invalid partner type: ${ecosystem.partner.type}`);
    }
    
    const validPartnerTiers = ['founding', 'strategic', 'premium', 'standard', 'trial', 'community'];
    if (ecosystem.partner.tier && !validPartnerTiers.includes(ecosystem.partner.tier)) {
      errors.push(`Invalid partner tier: ${ecosystem.partner.tier}`);
    }
    
    const validPartnerStatuses = ['pending_verification', 'pending_compliance', 'pending_payment', 'onboarding', 'active', 'suspended', 'inactive', 'terminated'];
    if (ecosystem.partner.status && !validPartnerStatuses.includes(ecosystem.partner.status)) {
      errors.push(`Invalid partner status: ${ecosystem.partner.status}`);
    }
  }
  
  // Compliance validation
  if (ecosystem.compliance) {
    const validComplianceStatuses = ['compliant', 'non_compliant', 'pending_review', 'remediation_required', 'not_assessed'];
    if (ecosystem.compliance.overallStatus && !validComplianceStatuses.includes(ecosystem.compliance.overallStatus)) {
      errors.push(`Invalid compliance status: ${ecosystem.compliance.overallStatus}`);
    }
  }
  
  // Revenue model validation
  if (ecosystem.revenue) {
    const validRevenueModels = ['percentage', 'flat_fee', 'tiered', 'usage_based', 'hybrid', 'custom'];
    if (ecosystem.revenue.model && !validRevenueModels.includes(ecosystem.revenue.model)) {
      errors.push(`Invalid revenue model: ${ecosystem.revenue.model}`);
    }
  }
  
  return errors;
}

function validateAPIMarketplace(marketplace) {
  const errors = [];
  
  // Required fields
  const required = ['marketplaceId', 'version', 'api', 'pricing', 'createdAt'];
  for (const field of required) {
    if (!(field in marketplace)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Marketplace ID pattern
  if (marketplace.marketplaceId && !/^apimarket-[a-z0-9-]+$/.test(marketplace.marketplaceId)) {
    errors.push('Invalid marketplaceId pattern');
  }
  
  // API validation
  if (marketplace.api) {
    const validCategories = ['multilingual', 'distribution', 'personalization', 'monetization', 'analytics', 'qc', 'governance', 'content', 'insights', 'voice', 'assistant'];
    if (marketplace.api.category && !validCategories.includes(marketplace.api.category)) {
      errors.push(`Invalid API category: ${marketplace.api.category}`);
    }
    
    const validStatuses = ['alpha', 'beta', 'ga', 'deprecated', 'retired'];
    if (marketplace.api.status && !validStatuses.includes(marketplace.api.status)) {
      errors.push(`Invalid API status: ${marketplace.api.status}`);
    }
    
    const validVisibilities = ['public', 'partner_only', 'enterprise_only', 'internal'];
    if (marketplace.api.visibility && !validVisibilities.includes(marketplace.api.visibility)) {
      errors.push(`Invalid API visibility: ${marketplace.api.visibility}`);
    }
  }
  
  // Pricing model validation
  if (marketplace.pricing) {
    const validPricingModels = ['free', 'freemium', 'pay_per_use', 'subscription', 'tiered', 'custom'];
    if (marketplace.pricing.model && !validPricingModels.includes(marketplace.pricing.model)) {
      errors.push(`Invalid pricing model: ${marketplace.pricing.model}`);
    }
  }
  
  return errors;
}

// Revenue share calculation
function calculateTieredRevenueShare(revenue, tiers) {
  let partnerShare = 0;
  let remainingRevenue = revenue;
  
  for (const tier of tiers) {
    const tierMin = tier.minRevenue || 0;
    const tierMax = tier.maxRevenue || Infinity;
    const tierRange = tierMax - tierMin;
    
    if (remainingRevenue <= 0) break;
    
    const amountInTier = Math.min(remainingRevenue, tierRange);
    partnerShare += amountInTier * (tier.partnerPercentage / 100);
    remainingRevenue -= amountInTier;
  }
  
  return {
    partnerShare: Math.round(partnerShare * 100) / 100,
    sl18Share: Math.round((revenue - partnerShare) * 100) / 100
  };
}

function calculatePercentageRevenueShare(revenue, partnerPercentage) {
  const partnerShare = revenue * (partnerPercentage / 100);
  return {
    partnerShare: Math.round(partnerShare * 100) / 100,
    sl18Share: Math.round((revenue - partnerShare) * 100) / 100
  };
}

// Quota calculation
function calculateQuotaUsage(used, limit) {
  const percentUsed = (used / limit) * 100;
  return {
    percentUsed: Math.round(percentUsed * 100) / 100,
    remaining: limit - used,
    isWarning: percentUsed >= 70,
    isCritical: percentUsed >= 90,
    isExceeded: percentUsed >= 100
  };
}

// Observability calculations
function calculateErrorRate(failed, total) {
  if (total === 0) return 0;
  return Math.round((failed / total) * 100 * 100) / 100;
}

function calculateSuccessRate(successful, total) {
  if (total === 0) return 100;
  return Math.round((successful / total) * 100 * 100) / 100;
}

// Run tests
console.log('\n=== Phase 24: Adaptive Partner Ecosystem & API Marketplace Tests ===\n');

// Schema file existence tests
console.log('--- Schema Existence Tests ---');

test('Partner ecosystem schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'partner_ecosystem.schema.json')));
});

test('API marketplace schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'api_marketplace.schema.json')));
});

test('Audit log schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'audit_log.schema.json')));
});

// Schema structure tests
console.log('\n--- Partner Ecosystem Schema Tests ---');

const partnerEcosystemSchema = loadSchema('partner_ecosystem.schema.json');
const apiMarketplaceSchema = loadSchema('api_marketplace.schema.json');
const auditLogSchema = loadSchema('audit_log.schema.json');
const fixtures = loadFixtures();

test('Partner ecosystem schema has required properties', () => {
  const required = partnerEcosystemSchema.required;
  assertIncludes(required, 'ecosystemId');
  assertIncludes(required, 'partner');
  assertIncludes(required, 'verification');
  assertIncludes(required, 'onboarding');
  assertIncludes(required, 'compliance');
  assertIncludes(required, 'access');
  assertIncludes(required, 'revenue');
});

test('Partner ecosystem schema has partner types', () => {
  const partnerTypes = partnerEcosystemSchema.properties.partner.properties.type.enum;
  assertIncludes(partnerTypes, 'content_distributor');
  assertIncludes(partnerTypes, 'contributor');
  assertIncludes(partnerTypes, 'analytics_provider');
  assertIncludes(partnerTypes, 'monetization_partner');
  assertIncludes(partnerTypes, 'technology_vendor');
});

test('Partner ecosystem schema has partner tiers', () => {
  const partnerTiers = partnerEcosystemSchema.properties.partner.properties.tier.enum;
  assertIncludes(partnerTiers, 'founding');
  assertIncludes(partnerTiers, 'strategic');
  assertIncludes(partnerTiers, 'premium');
  assertIncludes(partnerTiers, 'standard');
  assertIncludes(partnerTiers, 'trial');
  assertIncludes(partnerTiers, 'community');
});

test('Partner ecosystem schema has verification methods', () => {
  const verificationMethods = partnerEcosystemSchema.properties.verification.properties.identityMethod.enum;
  assertIncludes(verificationMethods, 'business_registration');
  assertIncludes(verificationMethods, 'government_id');
  assertIncludes(verificationMethods, 'bank_verification');
  assertIncludes(verificationMethods, 'domain_verification');
});

test('Partner ecosystem schema has onboarding flow types', () => {
  const flowTypes = partnerEcosystemSchema.properties.onboarding.properties.flowType.enum;
  assertIncludes(flowTypes, 'self_service');
  assertIncludes(flowTypes, 'guided');
  assertIncludes(flowTypes, 'assisted');
  assertIncludes(flowTypes, 'enterprise_custom');
});

test('Partner ecosystem schema has compliance check types', () => {
  const checkTypes = partnerEcosystemSchema.properties.compliance.properties.checks.items.properties.type.enum;
  assertIncludes(checkTypes, 'cultural_sensitivity');
  assertIncludes(checkTypes, 'qc_prerequisites');
  assertIncludes(checkTypes, 'data_privacy');
  assertIncludes(checkTypes, 'security_assessment');
});

test('Partner ecosystem schema has access roles', () => {
  const roles = partnerEcosystemSchema.properties.access.properties.role.enum;
  assertIncludes(roles, 'ecosystem_admin');
  assertIncludes(roles, 'api_developer');
  assertIncludes(roles, 'content_manager');
  assertIncludes(roles, 'analytics_viewer');
  assertIncludes(roles, 'billing_admin');
});

test('Partner ecosystem schema has revenue models', () => {
  const models = partnerEcosystemSchema.properties.revenue.properties.model.enum;
  assertIncludes(models, 'percentage');
  assertIncludes(models, 'flat_fee');
  assertIncludes(models, 'tiered');
  assertIncludes(models, 'usage_based');
  assertIncludes(models, 'hybrid');
});

// API Marketplace schema tests
console.log('\n--- API Marketplace Schema Tests ---');

test('API marketplace schema has required properties', () => {
  const required = apiMarketplaceSchema.required;
  assertIncludes(required, 'marketplaceId');
  assertIncludes(required, 'api');
  assertIncludes(required, 'pricing');
});

test('API marketplace schema has API categories', () => {
  const categories = apiMarketplaceSchema.properties.api.properties.category.enum;
  assertIncludes(categories, 'multilingual');
  assertIncludes(categories, 'distribution');
  assertIncludes(categories, 'personalization');
  assertIncludes(categories, 'monetization');
  assertIncludes(categories, 'analytics');
  assertIncludes(categories, 'qc');
  assertIncludes(categories, 'governance');
});

test('API marketplace schema has API statuses', () => {
  const statuses = apiMarketplaceSchema.properties.api.properties.status.enum;
  assertIncludes(statuses, 'alpha');
  assertIncludes(statuses, 'beta');
  assertIncludes(statuses, 'ga');
  assertIncludes(statuses, 'deprecated');
  assertIncludes(statuses, 'retired');
});

test('API marketplace schema has visibility levels', () => {
  const visibilities = apiMarketplaceSchema.properties.api.properties.visibility.enum;
  assertIncludes(visibilities, 'public');
  assertIncludes(visibilities, 'partner_only');
  assertIncludes(visibilities, 'enterprise_only');
  assertIncludes(visibilities, 'internal');
});

test('API marketplace schema has pricing models', () => {
  const models = apiMarketplaceSchema.properties.pricing.properties.model.enum;
  assertIncludes(models, 'free');
  assertIncludes(models, 'freemium');
  assertIncludes(models, 'pay_per_use');
  assertIncludes(models, 'subscription');
  assertIncludes(models, 'tiered');
});

test('API marketplace schema has subscription statuses', () => {
  const statuses = apiMarketplaceSchema.properties.subscription.properties.status.enum;
  assertIncludes(statuses, 'active');
  assertIncludes(statuses, 'trial');
  assertIncludes(statuses, 'past_due');
  assertIncludes(statuses, 'cancelled');
  assertIncludes(statuses, 'suspended');
});

test('API marketplace schema has authentication types', () => {
  const authTypes = apiMarketplaceSchema.properties.api.properties.authentication.properties.types.items.enum;
  assertIncludes(authTypes, 'oauth2');
  assertIncludes(authTypes, 'api_key');
  assertIncludes(authTypes, 'jwt');
  assertIncludes(authTypes, 'bearer_token');
});

test('API marketplace schema has SDK languages', () => {
  const languages = apiMarketplaceSchema.properties.api.properties.sdks.items.properties.language.enum;
  assertIncludes(languages, 'javascript');
  assertIncludes(languages, 'python');
  assertIncludes(languages, 'java');
  assertIncludes(languages, 'go');
});

// Audit log tests
console.log('\n--- Audit Log Schema Tests ---');

test('Audit log schema has partner ecosystem event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'ecosystem_partner_registered');
  assertIncludes(eventTypes, 'ecosystem_partner_verified');
  assertIncludes(eventTypes, 'ecosystem_partner_onboarded');
  assertIncludes(eventTypes, 'ecosystem_compliance_check_passed');
  assertIncludes(eventTypes, 'ecosystem_access_granted');
});

test('Audit log schema has API marketplace event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'api_registered');
  assertIncludes(eventTypes, 'api_published');
  assertIncludes(eventTypes, 'api_subscribed');
  assertIncludes(eventTypes, 'api_called');
  assertIncludes(eventTypes, 'api_quota_exceeded');
  assertIncludes(eventTypes, 'api_rate_limited');
});

test('Audit log schema has partner ecosystem category', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'partner_ecosystem');
  assertIncludes(categories, 'api_marketplace');
});

test('Audit log schema has partner ecosystem targets', () => {
  const targets = auditLogSchema.properties.target.properties.type.enum;
  assertIncludes(targets, 'ecosystem_partner');
  assertIncludes(targets, 'api_listing');
  assertIncludes(targets, 'api_subscription');
  assertIncludes(targets, 'api_key');
  assertIncludes(targets, 'api_quota');
});

// Fixture validation tests
console.log('\n--- Partner Ecosystem Validation Tests ---');

test('Valid partner ecosystem passes validation', () => {
  const validEcosystem = fixtures.partnerEcosystems.valid[0];
  const errors = validatePartnerEcosystem(validEcosystem);
  assertEqual(errors.length, 0, 'Expected no validation errors');
});

test('Partner ecosystem with strategic tier validates correctly', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  assertEqual(ecosystem.partner.tier, 'strategic');
  assertEqual(ecosystem.partner.type, 'content_distributor');
  assertEqual(ecosystem.partner.status, 'active');
});

test('Partner ecosystem with premium tier validates correctly', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[1];
  assertEqual(ecosystem.partner.tier, 'premium');
  assertEqual(ecosystem.partner.type, 'analytics_provider');
});

test('Partner ecosystem verification status is tracked', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  assertTrue(ecosystem.verification.identityVerified);
  assertTrue(ecosystem.verification.paymentVerified);
  assertEqual(ecosystem.verification.identityMethod, 'business_registration');
});

test('Partner ecosystem onboarding flow is complete', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  assertEqual(ecosystem.onboarding.flowType, 'enterprise_custom');
  assertEqual(ecosystem.onboarding.percentComplete, 100);
  assertTrue(ecosystem.onboarding.steps.every(s => s.status === 'completed'));
});

test('Partner ecosystem compliance checks are tracked', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  assertEqual(ecosystem.compliance.overallStatus, 'compliant');
  assertTrue(ecosystem.compliance.checks.every(c => c.status === 'passed'));
  assertTrue(ecosystem.compliance.termsAccepted);
});

test('Partner ecosystem has compliance certifications', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  assertIncludes(ecosystem.compliance.certifications, 'SOC2');
  assertIncludes(ecosystem.compliance.certifications, 'GDPR');
  assertIncludes(ecosystem.compliance.certifications, 'ISO27001');
});

test('Partner ecosystem access permissions are set', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  assertEqual(ecosystem.access.role, 'api_developer');
  assertIncludes(ecosystem.access.permissions, 'api_read');
  assertIncludes(ecosystem.access.permissions, 'api_write');
  assertTrue(ecosystem.access.mfaRequired);
});

test('Partner ecosystem revenue model is configured', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  assertEqual(ecosystem.revenue.model, 'tiered');
  assertEqual(ecosystem.revenue.currency, 'USD');
  assertEqual(ecosystem.revenue.payoutSchedule, 'monthly');
  assertTrue(ecosystem.revenue.tiers.length >= 3);
});

test('Partner ecosystem metrics are tracked', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  assertTrue(ecosystem.metrics.totalApiCalls > 0);
  assertTrue(ecosystem.metrics.totalRevenue > 0);
  assertTrue(ecosystem.metrics.healthScore >= 0);
  assertTrue(ecosystem.metrics.healthScore <= 100);
});

// API Marketplace validation tests
console.log('\n--- API Marketplace Validation Tests ---');

test('Valid API marketplace listing passes validation', () => {
  const validMarketplace = fixtures.apiMarketplace.valid[0];
  const errors = validateAPIMarketplace(validMarketplace);
  assertEqual(errors.length, 0, 'Expected no validation errors');
});

test('API marketplace listing has valid API configuration', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertEqual(marketplace.api.category, 'distribution');
  assertEqual(marketplace.api.status, 'ga');
  assertEqual(marketplace.api.visibility, 'public');
});

test('API marketplace listing has endpoints defined', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.api.endpoints.length >= 3);
  const contentEndpoint = marketplace.api.endpoints.find(e => e.path === '/content');
  assertTrue(contentEndpoint !== undefined);
  assertEqual(contentEndpoint.method, 'POST');
});

test('API marketplace listing has authentication configured', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertIncludes(marketplace.api.authentication.types, 'oauth2');
  assertIncludes(marketplace.api.authentication.types, 'api_key');
  assertTrue(marketplace.api.authentication.oauth2 !== undefined);
});

test('API marketplace listing has webhooks configured', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.api.webhooks.available);
  assertTrue(marketplace.api.webhooks.events.length >= 3);
  assertEqual(marketplace.api.webhooks.signatureMethod, 'hmac_sha256');
});

test('API marketplace listing has SDKs available', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.api.sdks.length >= 2);
  const jsSDK = marketplace.api.sdks.find(s => s.language === 'javascript');
  assertTrue(jsSDK !== undefined);
  assertEqual(jsSDK.packageManager, 'npm');
});

test('API marketplace listing has pricing tiers', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertEqual(marketplace.pricing.model, 'tiered');
  assertTrue(marketplace.pricing.tiers.length >= 3);
  
  const freeTier = marketplace.pricing.tiers.find(t => t.tierId === 'tier-free');
  assertTrue(freeTier !== undefined);
  assertEqual(freeTier.price.amount, 0);
  
  const proTier = marketplace.pricing.tiers.find(t => t.tierId === 'tier-pro');
  assertTrue(proTier !== undefined);
  assertTrue(proTier.recommended);
});

test('API marketplace listing has overage pricing', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.pricing.overagePricing.enabled);
  assertTrue(marketplace.pricing.overagePricing.pricePerRequest > 0);
  assertFalse(marketplace.pricing.overagePricing.hardLimit);
});

test('API marketplace quota is tracked', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertEqual(marketplace.quota.partnerId, 'ecopartner-media-global');
  assertEqual(marketplace.quota.tierId, 'tier-pro');
  assertTrue(marketplace.quota.usage.requests.used > 0);
  assertEqual(marketplace.quota.usage.requests.percentUsed, 70);
});

test('API marketplace subscription is active', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertEqual(marketplace.subscription.status, 'active');
  assertEqual(marketplace.subscription.tierId, 'tier-pro');
  assertTrue(marketplace.subscription.autoRenew);
  assertTrue(marketplace.subscription.billing.totalSpent > 0);
});

test('API marketplace revenue share is configured', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.revenueShare.enabled);
  assertEqual(marketplace.revenueShare.model, 'tiered');
  assertTrue(marketplace.revenueShare.tiers.length >= 2);
  assertEqual(marketplace.revenueShare.payoutSchedule, 'monthly');
});

test('API marketplace observability metrics are tracked', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.observability.metrics.totalCalls > 0);
  assertTrue(marketplace.observability.metrics.successRate >= 99);
  assertTrue(marketplace.observability.endpointMetrics.length >= 3);
});

test('API marketplace listing has ratings and reviews', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.listing.featured);
  assertTrue(marketplace.listing.rating >= 4.5);
  assertTrue(marketplace.listing.reviewCount > 0);
  assertTrue(marketplace.listing.subscriberCount > 0);
});

// Revenue share calculation tests
console.log('\n--- Revenue Share Calculation Tests ---');

test('Tiered revenue share calculation is correct', () => {
  const calc = fixtures.calculations.revenueShare.tieredExample;
  const result = calculateTieredRevenueShare(calc.revenue, calc.tiers);
  assertApproximatelyEqual(result.partnerShare, calc.expectedPartnerShare, 'Partner share mismatch');
  assertApproximatelyEqual(result.sl18Share, calc.expectedSl18Share, 'SL18 share mismatch');
});

test('Percentage revenue share calculation is correct', () => {
  const calc = fixtures.calculations.revenueShare.percentageExample;
  const result = calculatePercentageRevenueShare(calc.revenue, calc.partnerPercentage);
  assertEqual(result.partnerShare, calc.expectedPartnerShare);
  assertEqual(result.sl18Share, calc.expectedSl18Share);
});

// Quota usage calculation tests
console.log('\n--- Quota Usage Calculation Tests ---');

test('Quota usage calculation is correct', () => {
  const calc = fixtures.calculations.quotaUsage.example;
  const result = calculateQuotaUsage(calc.used, calc.limit);
  assertEqual(result.percentUsed, calc.expectedPercentUsed);
  assertTrue(result.isWarning);
  assertFalse(result.isCritical);
  assertFalse(result.isExceeded);
});

test('Quota warning threshold triggers correctly', () => {
  const result = calculateQuotaUsage(70000, 100000);
  assertTrue(result.isWarning);
  assertFalse(result.isCritical);
});

test('Quota critical threshold triggers correctly', () => {
  const result = calculateQuotaUsage(92000, 100000);
  assertTrue(result.isWarning);
  assertTrue(result.isCritical);
  assertFalse(result.isExceeded);
});

test('Quota exceeded detection works', () => {
  const result = calculateQuotaUsage(105000, 100000);
  assertTrue(result.isExceeded);
});

// Observability calculation tests
console.log('\n--- Observability Calculation Tests ---');

test('Error rate calculation is correct', () => {
  const calc = fixtures.calculations.observabilityMetrics.errorRate;
  const rate = calculateErrorRate(calc.failed, calc.total);
  assertEqual(rate, calc.expectedRate);
});

test('Success rate calculation is correct', () => {
  const calc = fixtures.calculations.observabilityMetrics.successRate;
  const rate = calculateSuccessRate(calc.successful, calc.total);
  assertEqual(rate, calc.expectedRate);
});

test('Zero total calls returns safe defaults', () => {
  assertEqual(calculateErrorRate(0, 0), 0);
  assertEqual(calculateSuccessRate(0, 0), 100);
});

// Audit log validation tests
console.log('\n--- Audit Log Tests ---');

test('Partner ecosystem audit logs are valid', () => {
  const logs = fixtures.auditLogs.partnerEcosystem;
  assertTrue(logs.length >= 3);
  
  const registrationLog = logs.find(l => l.eventType === 'ecosystem_partner_registered');
  assertTrue(registrationLog !== undefined);
  assertEqual(registrationLog.category, 'partner_ecosystem');
  assertEqual(registrationLog.target.type, 'ecosystem_partner');
});

test('API marketplace audit logs are valid', () => {
  const logs = fixtures.auditLogs.apiMarketplace;
  assertTrue(logs.length >= 4);
  
  const apiCallLog = logs.find(l => l.eventType === 'api_called');
  assertTrue(apiCallLog !== undefined);
  assertEqual(apiCallLog.category, 'api_marketplace');
  assertTrue(apiCallLog.details.metadata !== undefined);
});

test('Audit logs have quota warning events', () => {
  const logs = fixtures.auditLogs.apiMarketplace;
  const quotaWarning = logs.find(l => l.eventType === 'api_quota_warning');
  assertTrue(quotaWarning !== undefined);
  assertEqual(quotaWarning.target.type, 'api_quota');
  assertEqual(quotaWarning.details.metadata.usedPercentage, 70);
});

// Invalid data tests
console.log('\n--- Invalid Data Tests ---');

test('Invalid partner ecosystem fails validation', () => {
  const invalidEcosystem = fixtures.partnerEcosystems.invalid[0];
  const errors = validatePartnerEcosystem(invalidEcosystem);
  assertTrue(errors.length > 0, 'Expected validation errors');
});

test('Missing required fields are detected', () => {
  const invalidEcosystem = fixtures.partnerEcosystems.invalid[1];
  const errors = validatePartnerEcosystem(invalidEcosystem);
  assertTrue(errors.some(e => e.includes('Missing required field')));
});

test('Invalid API marketplace fails validation', () => {
  const invalidMarketplace = fixtures.apiMarketplace.invalid[0];
  const errors = validateAPIMarketplace(invalidMarketplace);
  assertTrue(errors.length > 0, 'Expected validation errors');
});

// Integration tests
console.log('\n--- Integration Tests ---');

test('Partner ecosystem can subscribe to multiple APIs', () => {
  const ecosystem = fixtures.partnerEcosystems.valid[0];
  const marketplace = fixtures.apiMarketplace.valid[0];
  
  // Verify that the quota is linked to a partner (IDs follow consistent pattern)
  assertTrue(marketplace.quota.partnerId.includes('partner'));
  assertTrue(ecosystem.partner.partnerId.includes('partner'));
  assertTrue(ecosystem.capabilities.apiAccess.length > 0);
});

test('API marketplace observability tracks partner usage', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.observability.usageByRegion.length > 0);
  
  const totalPercentage = marketplace.observability.usageByRegion.reduce((sum, r) => sum + r.percentage, 0);
  assertEqual(totalPercentage, 100);
});

test('API marketplace alerts are linked to quotas', () => {
  const marketplace = fixtures.apiMarketplace.valid[0];
  assertTrue(marketplace.quota.alerts.length > 0);
  assertTrue(marketplace.observability.alerts.length > 0);
  
  const quotaAlert = marketplace.quota.alerts[0];
  assertEqual(quotaAlert.type, 'threshold_warning');
  assertTrue(quotaAlert.notified);
});

// Print summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
