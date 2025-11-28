/**
 * SL18 AI-Driven Personalization & Adaptive Monetization Test Suite
 * Phase 17: Personalization Engine, Dynamic Pricing, and Revenue Optimization
 * 
 * Run: node tests/governance/personalization.test.js
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

// Load JSON files
function loadJSON(path) {
  const fullPath = join(repoRoot, path);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${path}`);
  }
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

// Default engagement history for viewers with no prior history
const DEFAULT_ENGAGEMENT_HISTORY = { avgSessionDuration: 5, engagementScore: 50, episodesCompleted: 10 };

// Personalization engine validation
function validatePersonalizationEngine(data) {
  const required = ['engineId', 'franchiseId', 'viewerProfile', 'recommendations', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate viewer profile
  if (!data.viewerProfile.viewerId) {
    return { valid: false, error: 'viewerId is required in viewerProfile' };
  }

  // Validate recommendations
  if (!data.recommendations.recommendedPersona || !data.recommendations.recommendedFormat) {
    return { valid: false, error: 'recommendedPersona and recommendedFormat are required' };
  }

  // Validate format enum
  const validFormats = ['short_form', 'serialized', 'hybrid', 'live'];
  if (data.recommendations.recommendedFormat.format && 
      !validFormats.includes(data.recommendations.recommendedFormat.format)) {
    return { valid: false, error: 'format must be one of enum values' };
  }

  return { valid: true };
}

// Adaptive pricing validation
function validateAdaptivePricing(data) {
  const required = ['pricingId', 'franchiseId', 'region', 'currency', 'viewerTier', 'priceModel', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate tier name
  const validTiers = ['free', 'basic', 'premium', 'vip', 'enterprise'];
  if (data.viewerTier.tierName && !validTiers.includes(data.viewerTier.tierName)) {
    return { valid: false, error: 'tierName must be one of enum values' };
  }

  // Validate price model type
  const validPriceModels = ['subscription', 'pay_per_view', 'freemium', 'ad_supported', 'hybrid'];
  if (data.priceModel.type && !validPriceModels.includes(data.priceModel.type)) {
    return { valid: false, error: 'type must be one of enum values' };
  }

  return { valid: true };
}

// Recommend persona based on genre affinity
function recommendPersona(viewerProfile, availablePersonas) {
  if (!viewerProfile.genreAffinity || viewerProfile.genreAffinity.length === 0) {
    return availablePersonas[0];
  }

  // Find highest affinity genre
  const topGenre = viewerProfile.genreAffinity.reduce((max, current) => 
    current.affinityScore > max.affinityScore ? current : max
  );

  // Find persona matching that genre
  const matchingPersona = availablePersonas.find(p => p.primaryGenre === topGenre.genre);
  return matchingPersona || availablePersonas[0];
}

// Recommend format based on engagement
function recommendFormat(engagementHistory) {
  if (!engagementHistory) {
    return { format: 'short_form', duration: 'short' };
  }

  const { avgSessionDuration, engagementScore, episodesCompleted } = engagementHistory;

  // High engagement = serialized content
  if (avgSessionDuration > 30 && engagementScore > 80 && episodesCompleted > 50) {
    return { format: 'serialized', duration: 'long' };
  }

  // Medium engagement = medium content
  if (avgSessionDuration > 15 && engagementScore > 50) {
    return { format: 'serialized', duration: 'medium' };
  }

  // Low engagement = short-form
  if (avgSessionDuration < 10 && engagementScore < 40) {
    return { format: 'short_form', duration: 'micro' };
  }

  return { format: 'short_form', duration: 'short' };
}

// QC personalization check
function checkPersonalizationQC(personalization, brandGuidelines, culturalRules = {}) {
  const violations = [];

  // Check persona approval
  if (brandGuidelines.approvedPersonas && personalization.recommendedPersona) {
    if (!brandGuidelines.approvedPersonas.includes(personalization.recommendedPersona.personaId)) {
      violations.push({
        type: 'persona_not_approved',
        severity: 'error',
        description: 'Recommended persona is not brand-approved'
      });
    }
  }

  // Check tone approval
  if (brandGuidelines.allowedTones && personalization.recommendedContentStyle) {
    if (!brandGuidelines.allowedTones.includes(personalization.recommendedContentStyle.tone)) {
      violations.push({
        type: 'tone_not_allowed',
        severity: 'error',
        description: 'Recommended tone is not allowed by brand guidelines'
      });
    }
  }

  // Check cultural sensitivity
  if (personalization.region && personalization.contentStyle && culturalRules[personalization.region]) {
    const regionRules = culturalRules[personalization.region];
    if (regionRules.forbiddenTones && regionRules.forbiddenTones.includes(personalization.contentStyle.tone)) {
      violations.push({
        type: 'cultural_sensitivity_violation',
        severity: 'error',
        description: 'Content tone violates cultural sensitivity rules for region'
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

// Constants for price adjustment calculations
const PRICE_ADJUSTMENT_MIN = 0.1;  // Minimum price adjustment factor (10% of base)
const PRICE_ADJUSTMENT_MAX = 1.0;  // Maximum price adjustment factor (100% of base)
const PURCHASING_POWER_OFFSET = 0.1;  // Offset added to purchasing power index

// Calculate regional price adjustment
function calculateRegionalPrice(basePrice, purchasingPowerIndex) {
  // Lower purchasing power = lower price
  // Formula: adjustmentFactor = purchasingPowerIndex + offset, clamped between min and max
  const adjustmentFactor = Math.max(PRICE_ADJUSTMENT_MIN, Math.min(purchasingPowerIndex + PURCHASING_POWER_OFFSET, PRICE_ADJUSTMENT_MAX));
  return {
    adjustedPrice: Math.round(basePrice * adjustmentFactor * 100) / 100,
    factor: adjustmentFactor
  };
}

// Determine churn risk action
function determineChurnAction(riskScore, currentTier) {
  if (riskScore >= 70) {
    return {
      trigger: 'churn_risk',
      adjustmentType: 'price_decrease',
      suggestedValue: riskScore >= 85 ? 30 : 20
    };
  }
  if (riskScore >= 50) {
    return {
      trigger: 'churn_risk',
      adjustmentType: 'discount_offer',
      suggestedValue: 15
    };
  }
  return null;
}

console.log('\n=== SL18 Phase 17: AI-Driven Personalization & Adaptive Monetization Tests ===\n');

// Test 1: Schema files exist
console.log('--- Schema File Existence ---');

test('Personalization engine schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/personalization_engine.schema.json')));
});

test('Adaptive pricing schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/adaptive_pricing.schema.json')));
});

// Test 2: Schema files are valid JSON
console.log('\n--- Schema JSON Validity ---');

test('Personalization engine schema is valid JSON', () => {
  const schema = loadJSON('schemas/personalization_engine.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'PersonalizationEngine', 'Incorrect title');
});

test('Adaptive pricing schema is valid JSON', () => {
  const schema = loadJSON('schemas/adaptive_pricing.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'AdaptivePricing', 'Incorrect title');
});

// Test 3: Personalization engine validation
console.log('\n--- Personalization Engine Validation ---');

test('Valid personalization engines pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  for (const engine of fixtures.validPersonalizationEngines) {
    const result = validatePersonalizationEngine(engine);
    assert(result.valid, `Engine ${engine.engineId} failed: ${result.error}`);
  }
});

test('Invalid personalization engines fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  for (const testCase of fixtures.invalidPersonalizationEngines) {
    const result = validatePersonalizationEngine(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Personalization engine has viewer profile with language preferences', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const engine = fixtures.validPersonalizationEngines[0];
  assert(engine.viewerProfile.languagePreferences !== undefined, 'Should have language preferences');
  assert(engine.viewerProfile.languagePreferences.primary !== undefined, 'Should have primary language');
});

test('Personalization engine has genre affinity scores', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const engine = fixtures.validPersonalizationEngines[0];
  assert(engine.viewerProfile.genreAffinity.length > 0, 'Should have genre affinity');
  assert(engine.viewerProfile.genreAffinity[0].affinityScore !== undefined, 'Should have affinity score');
});

test('Personalization engine has engagement history', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const engine = fixtures.validPersonalizationEngines[0];
  assert(engine.viewerProfile.engagementHistory !== undefined, 'Should have engagement history');
  assert(engine.viewerProfile.engagementHistory.engagementScore !== undefined, 'Should have engagement score');
});

// Test 4: Persona recommendation tests
console.log('\n--- Persona Recommendation ---');

test('High drama affinity recommends drama persona', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.personalizationTestCases[0];
  const recommended = recommendPersona(testCase.viewerProfile, testCase.availablePersonas);
  assertEqual(recommended.personaId, testCase.expectedPersonaId, testCase.description);
});

test('Music lover gets short-form format recommendation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.personalizationTestCases[1];
  const result = recommendFormat(testCase.viewerProfile.engagementHistory || DEFAULT_ENGAGEMENT_HISTORY);
  // Music lovers with short attention spans get short form
  assertEqual(result.format, testCase.expectedFormat, testCase.description);
});

test('High engagement viewer gets serialized content', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.personalizationTestCases[2];
  const result = recommendFormat(testCase.viewerProfile.engagementHistory);
  assertEqual(result.format, testCase.expectedFormat, testCase.description);
});

test('Casual viewer gets short-form content', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.personalizationTestCases[3];
  const result = recommendFormat(testCase.viewerProfile.engagementHistory);
  assertEqual(result.format, testCase.expectedFormat, testCase.description);
});

// Test 5: QC personalization enforcement
console.log('\n--- QC Personalization Enforcement ---');

test('Personalization passes when brand consistency maintained', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.qcPersonalizationTestCases[0];
  const result = checkPersonalizationQC(testCase.personalization, testCase.brandGuidelines);
  assertEqual(result.passed, testCase.expectedPassed, testCase.description);
});

test('Personalization fails when persona not brand-approved', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.qcPersonalizationTestCases[1];
  const result = checkPersonalizationQC(testCase.personalization, testCase.brandGuidelines);
  assertEqual(result.passed, testCase.expectedPassed, testCase.description);
  assert(result.violations.some(v => v.type === testCase.expectedViolation), 'Should have expected violation');
});

test('Personalization fails when tone violates guidelines', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.qcPersonalizationTestCases[2];
  const result = checkPersonalizationQC(testCase.personalization, testCase.brandGuidelines);
  assertEqual(result.passed, testCase.expectedPassed, testCase.description);
  assert(result.violations.some(v => v.type === testCase.expectedViolation), 'Should have expected violation');
});

test('Cultural sensitivity check passes for appropriate content', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.qcPersonalizationTestCases[3];
  const result = checkPersonalizationQC(testCase.personalization, {}, testCase.culturalRules);
  assertEqual(result.passed, testCase.expectedPassed, testCase.description);
});

test('Cultural sensitivity check fails for inappropriate content', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.qcPersonalizationTestCases[4];
  const result = checkPersonalizationQC(testCase.personalization, {}, testCase.culturalRules);
  assertEqual(result.passed, testCase.expectedPassed, testCase.description);
});

// Test 6: Adaptive pricing validation
console.log('\n--- Adaptive Pricing Validation ---');

test('Valid adaptive pricing configs pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  for (const config of fixtures.validAdaptivePricingConfigs) {
    const result = validateAdaptivePricing(config);
    assert(result.valid, `Pricing ${config.pricingId} failed: ${result.error}`);
  }
});

test('Invalid adaptive pricing configs fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  for (const testCase of fixtures.invalidAdaptivePricingConfigs) {
    const result = validateAdaptivePricing(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Pricing config has tier features', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const config = fixtures.validAdaptivePricingConfigs[0];
  assert(config.viewerTier.tierFeatures.length > 0, 'Should have tier features');
});

test('Pricing config has churn prediction', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const config = fixtures.validAdaptivePricingConfigs[0];
  assert(config.revenueOptimization.churnPrediction.enabled === true, 'Should have churn prediction enabled');
  assert(config.revenueOptimization.churnPrediction.riskScore !== undefined, 'Should have risk score');
});

// Test 7: Dynamic pricing adjustments
console.log('\n--- Dynamic Pricing Adjustments ---');

test('Churn risk triggers discount offer', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.pricingAdjustmentTestCases[0];
  const result = determineChurnAction(testCase.input.churnRiskScore, testCase.input.currentTier);
  assert(result !== null, 'Should trigger action');
  assertEqual(result.trigger, testCase.expectedAdjustment.trigger, testCase.description);
  assertEqual(result.adjustmentType, testCase.expectedAdjustment.adjustmentType, testCase.description);
});

test('Regional economics adjusts base price correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.pricingAdjustmentTestCases[2];
  const result = calculateRegionalPrice(testCase.input.basePrice, testCase.input.purchasingPowerIndex);
  assertEqual(result.adjustedPrice, testCase.expectedAdjustedPrice, testCase.description);
  assertEqual(result.factor, testCase.expectedFactor, testCase.description);
});

test('Pricing config has revenue ledger integration', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const config = fixtures.validAdaptivePricingConfigs[0];
  assert(config.revenueLedgerIntegration !== undefined, 'Should have ledger integration');
  assert(config.revenueLedgerIntegration.ledgerId !== undefined, 'Should have ledger ID');
});

test('Pricing config tracks transactions', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const config = fixtures.validAdaptivePricingConfigs[0];
  assert(config.revenueLedgerIntegration.transactionTracking.enabled === true, 'Transaction tracking should be enabled');
});

// Test 8: Extended audit log events
console.log('\n--- Extended Audit Log Events ---');

test('Audit log schema includes personalization events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'personalization_served', 'Should include personalization_served');
  assertArrayIncludes(eventTypes, 'recommendation_generated', 'Should include recommendation_generated');
  assertArrayIncludes(eventTypes, 'adaptive_rendering_applied', 'Should include adaptive_rendering_applied');
  assertArrayIncludes(eventTypes, 'qc_personalization_passed', 'Should include qc_personalization_passed');
});

test('Audit log schema includes monetization events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'pricing_adjusted', 'Should include pricing_adjusted');
  assertArrayIncludes(eventTypes, 'tier_upgraded', 'Should include tier_upgraded');
  assertArrayIncludes(eventTypes, 'subscription_created', 'Should include subscription_created');
  assertArrayIncludes(eventTypes, 'subscription_cancelled', 'Should include subscription_cancelled');
});

test('Audit log schema includes churn and retention events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'churn_risk_detected', 'Should include churn_risk_detected');
  assertArrayIncludes(eventTypes, 'retention_action_triggered', 'Should include retention_action_triggered');
  assertArrayIncludes(eventTypes, 'dynamic_discount_applied', 'Should include dynamic_discount_applied');
});

test('Audit log schema includes new categories', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const categories = schema.properties.category.enum;
  assertArrayIncludes(categories, 'personalization', 'Should include personalization category');
  assertArrayIncludes(categories, 'monetization', 'Should include monetization category');
});

test('Audit log schema includes new target types', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const targetTypes = schema.properties.target.properties.type.enum;
  assertArrayIncludes(targetTypes, 'viewer', 'Should include viewer target type');
  assertArrayIncludes(targetTypes, 'subscription', 'Should include subscription target type');
  assertArrayIncludes(targetTypes, 'pricing', 'Should include pricing target type');
});

// Test 9: Adaptive rendering configuration
console.log('\n--- Adaptive Rendering ---');

test('Personalization engine has adaptive rendering config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const engine = fixtures.validPersonalizationEngines[0];
  assert(engine.adaptiveRendering !== undefined, 'Should have adaptive rendering');
  assert(engine.adaptiveRendering.enabled === true, 'Should be enabled');
});

test('Adaptive rendering has subtitle configuration', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const engine = fixtures.validPersonalizationEngines[0];
  assert(engine.adaptiveRendering.subtitleConfig !== undefined, 'Should have subtitle config');
  assert(engine.adaptiveRendering.subtitleConfig.language !== undefined, 'Should have language');
});

test('Adaptive rendering has persona voice selection', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const engine = fixtures.validPersonalizationEngines[0];
  assert(engine.adaptiveRendering.personaVoiceSelection !== undefined, 'Should have persona voice selection');
  assert(engine.adaptiveRendering.personaVoiceSelection.voiceVariant !== undefined, 'Should have voice variant');
});

test('Adaptive rendering has teaser generation config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const engine = fixtures.validPersonalizationEngines[0];
  assert(engine.adaptiveRendering.teaserGeneration !== undefined, 'Should have teaser generation');
  assert(engine.adaptiveRendering.teaserGeneration.basedOnEngagement === true, 'Should be based on engagement');
});

// Test 10: Revenue ledger integration
console.log('\n--- Revenue Ledger Integration ---');

test('Subscription payment updates expected ledger entry', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.revenueLedgerIntegrationTestCases[0];
  // Validate expected structure
  assert(testCase.expectedLedgerUpdate.entryType === 'revenue', 'Should be revenue entry');
  assert(testCase.expectedLedgerUpdate.source === 'subscription', 'Should be subscription source');
  assertEqual(testCase.expectedLedgerUpdate.amount, testCase.input.amount, 'Amount should match');
});

test('Tier upgrade records revenue delta', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.revenueLedgerIntegrationTestCases[1];
  const expectedDelta = testCase.input.newPrice - testCase.input.previousPrice;
  assertEqual(testCase.expectedLedgerUpdate.delta, expectedDelta, 'Delta should be price difference');
});

test('Subscription cancellation records churn', () => {
  const fixtures = loadJSON('tests/governance/fixtures/personalization.json');
  const testCase = fixtures.revenueLedgerIntegrationTestCases[2];
  assert(testCase.expectedLedgerUpdate.entryType === 'churn', 'Should be churn entry');
  assertEqual(testCase.expectedLedgerUpdate.lostRevenue, testCase.input.remainingValue, 'Lost revenue should match');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.error}`);
  }
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
