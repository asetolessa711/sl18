/**
 * SL18 Phase 25: Global Governance & Compliance Suite Tests
 * 
 * Tests for governance suite schemas, payment compliance, cultural QC, and enforcement workflows
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

const TOLERANCE = 0.01;

function assertApproximatelyEqual(actual, expected, message) {
  if (Math.abs(actual - expected) > TOLERANCE) {
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
  const path = join(fixturesDir, 'governance_suite.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Validation functions
function validateGovernanceSuite(suite) {
  const errors = [];
  
  // Required fields
  const required = ['suiteId', 'version', 'name', 'scope', 'policies', 'complianceRegistry', 'enforcement', 'status', 'createdAt', 'createdBy'];
  for (const field of required) {
    if (!(field in suite)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Suite ID pattern
  if (suite.suiteId && !/^govsuite-[a-z0-9-]+$/.test(suite.suiteId)) {
    errors.push('Invalid suiteId pattern');
  }
  
  // Version pattern
  if (suite.version && !/^\d+\.\d+\.\d+$/.test(suite.version)) {
    errors.push('Invalid version pattern');
  }
  
  // Scope validation
  if (suite.scope) {
    const validLevels = ['global', 'region', 'franchise', 'partner', 'contributor'];
    if (suite.scope.level && !validLevels.includes(suite.scope.level)) {
      errors.push(`Invalid scope level: ${suite.scope.level}`);
    }
  }
  
  // Status validation
  if (suite.status) {
    const validStatuses = ['active', 'suspended', 'maintenance', 'deprecated'];
    if (!validStatuses.includes(suite.status)) {
      errors.push(`Invalid status: ${suite.status}`);
    }
  }
  
  return errors;
}

function validatePaymentCompliance(compliance) {
  const errors = [];
  
  // Required fields
  const required = ['complianceId', 'version', 'entityType', 'entityId', 'kyc', 'aml', 'overallStatus', 'createdAt'];
  for (const field of required) {
    if (!(field in compliance)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Compliance ID pattern
  if (compliance.complianceId && !/^paycomp-[a-z0-9-]+$/.test(compliance.complianceId)) {
    errors.push('Invalid complianceId pattern');
  }
  
  // Entity type validation
  if (compliance.entityType) {
    const validEntityTypes = ['franchise', 'partner', 'contributor', 'creator', 'distributor'];
    if (!validEntityTypes.includes(compliance.entityType)) {
      errors.push(`Invalid entityType: ${compliance.entityType}`);
    }
  }
  
  // KYC status validation
  if (compliance.kyc && compliance.kyc.status) {
    const validKycStatuses = ['pending', 'in_progress', 'verified', 'failed', 'expired', 'exempt'];
    if (!validKycStatuses.includes(compliance.kyc.status)) {
      errors.push(`Invalid KYC status: ${compliance.kyc.status}`);
    }
  }
  
  // AML status validation
  if (compliance.aml && compliance.aml.status) {
    const validAmlStatuses = ['clear', 'flagged', 'blocked', 'under_review', 'pending'];
    if (!validAmlStatuses.includes(compliance.aml.status)) {
      errors.push(`Invalid AML status: ${compliance.aml.status}`);
    }
  }
  
  return errors;
}

function validateCulturalQC(qc) {
  const errors = [];
  
  // Required fields
  const required = ['qcId', 'version', 'scope', 'culturalRules', 'status', 'createdAt', 'createdBy'];
  for (const field of required) {
    if (!(field in qc)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // QC ID pattern
  if (qc.qcId && !/^culturalqc-[a-z0-9-]+$/.test(qc.qcId)) {
    errors.push('Invalid qcId pattern');
  }
  
  // Status validation
  if (qc.status) {
    const validStatuses = ['active', 'suspended', 'deprecated'];
    if (!validStatuses.includes(qc.status)) {
      errors.push(`Invalid status: ${qc.status}`);
    }
  }
  
  return errors;
}

// Calculation functions
function calculateComplianceScore(frameworkScores) {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const framework of frameworkScores) {
    totalScore += framework.score * framework.weight;
    totalWeight += framework.weight;
  }
  
  return Math.round((totalScore / totalWeight) * 100) / 100;
}

function calculatePassRate(totalChecks, passedChecks) {
  if (totalChecks === 0) return 0;
  return Math.round((passedChecks / totalChecks) * 100 * 100) / 100;
}

function calculateResolutionRate(totalViolations, resolvedViolations) {
  if (totalViolations === 0) return 100;
  return Math.round((resolvedViolations / totalViolations) * 100 * 100) / 100;
}

// Run tests
console.log('\n=== Phase 25: Global Governance & Compliance Suite Tests ===\n');

// Schema file existence tests
console.log('--- Schema Existence Tests ---');

test('Governance suite schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'governance_suite.schema.json')));
});

test('Payment compliance schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'payment_compliance.schema.json')));
});

test('Cultural QC schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'cultural_qc.schema.json')));
});

test('Audit log schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'audit_log.schema.json')));
});

// Schema structure tests
console.log('\n--- Governance Suite Schema Tests ---');

const governanceSuiteSchema = loadSchema('governance_suite.schema.json');
const paymentComplianceSchema = loadSchema('payment_compliance.schema.json');
const culturalQCSchema = loadSchema('cultural_qc.schema.json');
const auditLogSchema = loadSchema('audit_log.schema.json');
const fixtures = loadFixtures();

test('Governance suite schema has required properties', () => {
  const required = governanceSuiteSchema.required;
  assertIncludes(required, 'suiteId');
  assertIncludes(required, 'version');
  assertIncludes(required, 'name');
  assertIncludes(required, 'scope');
  assertIncludes(required, 'policies');
  assertIncludes(required, 'complianceRegistry');
  assertIncludes(required, 'enforcement');
  assertIncludes(required, 'status');
});

test('Governance suite schema has scope levels', () => {
  const levels = governanceSuiteSchema.properties.scope.properties.level.enum;
  assertIncludes(levels, 'global');
  assertIncludes(levels, 'region');
  assertIncludes(levels, 'franchise');
  assertIncludes(levels, 'partner');
  assertIncludes(levels, 'contributor');
});

test('Governance suite schema has policy types', () => {
  const policyTypes = governanceSuiteSchema.properties.policies.items.properties.type.enum;
  assertIncludes(policyTypes, 'content_standards');
  assertIncludes(policyTypes, 'monetization_rules');
  assertIncludes(policyTypes, 'contributor_terms');
  assertIncludes(policyTypes, 'data_privacy');
  assertIncludes(policyTypes, 'cultural_sensitivity');
  assertIncludes(policyTypes, 'qc_requirements');
});

test('Governance suite schema has enforcement roles', () => {
  const roles = governanceSuiteSchema.properties.enforcement.properties.roles.items.properties.role.enum;
  assertIncludes(roles, 'ecosystem_admin');
  assertIncludes(roles, 'compliance_officer');
  assertIncludes(roles, 'franchise_operator');
  assertIncludes(roles, 'content_reviewer');
  assertIncludes(roles, 'security_admin');
});

test('Governance suite schema has compliance frameworks', () => {
  const frameworks = governanceSuiteSchema.properties.complianceRegistry.properties.frameworks.items.properties.name.enum;
  assertIncludes(frameworks, 'GDPR');
  assertIncludes(frameworks, 'SOC2');
  assertIncludes(frameworks, 'ISO27001');
  assertIncludes(frameworks, 'PCI-DSS');
  assertIncludes(frameworks, 'CCPA');
});

test('Governance suite schema has violation categories', () => {
  const penalties = governanceSuiteSchema.properties.violations.properties.categories.items.properties.penalties.properties;
  assertTrue('firstOffense' in penalties);
  assertTrue('secondOffense' in penalties);
  assertTrue('thirdOffense' in penalties);
});

test('Governance suite schema has automated enforcement triggers', () => {
  const triggerTypes = governanceSuiteSchema.properties.enforcement.properties.automatedEnforcement.properties.triggers.items.properties.type.enum;
  assertIncludes(triggerTypes, 'policy_violation');
  assertIncludes(triggerTypes, 'compliance_failure');
  assertIncludes(triggerTypes, 'qc_failure');
  assertIncludes(triggerTypes, 'fraud_detection');
  assertIncludes(triggerTypes, 'cultural_issue');
});

// Payment Compliance schema tests
console.log('\n--- Payment Compliance Schema Tests ---');

test('Payment compliance schema has required properties', () => {
  const required = paymentComplianceSchema.required;
  assertIncludes(required, 'complianceId');
  assertIncludes(required, 'entityType');
  assertIncludes(required, 'entityId');
  assertIncludes(required, 'kyc');
  assertIncludes(required, 'aml');
  assertIncludes(required, 'overallStatus');
});

test('Payment compliance schema has KYC statuses', () => {
  const kycStatuses = paymentComplianceSchema.properties.kyc.properties.status.enum;
  assertIncludes(kycStatuses, 'pending');
  assertIncludes(kycStatuses, 'in_progress');
  assertIncludes(kycStatuses, 'verified');
  assertIncludes(kycStatuses, 'failed');
  assertIncludes(kycStatuses, 'expired');
});

test('Payment compliance schema has KYC document types', () => {
  const docTypes = paymentComplianceSchema.properties.kyc.properties.documents.items.properties.type.enum;
  assertIncludes(docTypes, 'government_id');
  assertIncludes(docTypes, 'passport');
  assertIncludes(docTypes, 'business_license');
  assertIncludes(docTypes, 'tax_id');
  assertIncludes(docTypes, 'bank_statement');
  assertIncludes(docTypes, 'beneficial_ownership');
});

test('Payment compliance schema has AML statuses', () => {
  const amlStatuses = paymentComplianceSchema.properties.aml.properties.status.enum;
  assertIncludes(amlStatuses, 'clear');
  assertIncludes(amlStatuses, 'flagged');
  assertIncludes(amlStatuses, 'blocked');
  assertIncludes(amlStatuses, 'under_review');
});

test('Payment compliance schema has sanctions lists', () => {
  const sanctionsLists = paymentComplianceSchema.properties.aml.properties.sanctions.properties.listsChecked.items.enum;
  assertIncludes(sanctionsLists, 'OFAC');
  assertIncludes(sanctionsLists, 'EU');
  assertIncludes(sanctionsLists, 'UN');
  assertIncludes(sanctionsLists, 'UK');
});

test('Payment compliance schema has tax form types', () => {
  const formTypes = paymentComplianceSchema.properties.taxCompliance.properties.taxForms.items.properties.formType.enum;
  assertIncludes(formTypes, 'W9');
  assertIncludes(formTypes, 'W8-BEN');
  assertIncludes(formTypes, 'W8-BEN-E');
  assertIncludes(formTypes, '1099');
});

test('Payment compliance schema has fraud detection signals', () => {
  const signalTypes = paymentComplianceSchema.properties.fraudDetection.properties.signals.items.properties.type.enum;
  assertIncludes(signalTypes, 'velocity_anomaly');
  assertIncludes(signalTypes, 'location_mismatch');
  assertIncludes(signalTypes, 'device_fingerprint');
  assertIncludes(signalTypes, 'behavioral_anomaly');
});

test('Payment compliance schema has payment methods', () => {
  const methods = paymentComplianceSchema.properties.paymentRules.properties.allowedMethods.items.enum;
  assertIncludes(methods, 'bank_transfer');
  assertIncludes(methods, 'paypal');
  assertIncludes(methods, 'stripe');
  assertIncludes(methods, 'wise');
});

// Cultural QC schema tests
console.log('\n--- Cultural QC Schema Tests ---');

test('Cultural QC schema has required properties', () => {
  const required = culturalQCSchema.required;
  assertIncludes(required, 'qcId');
  assertIncludes(required, 'version');
  assertIncludes(required, 'scope');
  assertIncludes(required, 'culturalRules');
  assertIncludes(required, 'status');
});

test('Cultural QC schema has rule categories', () => {
  const categories = culturalQCSchema.properties.culturalRules.items.properties.category.enum;
  assertIncludes(categories, 'religious_sensitivity');
  assertIncludes(categories, 'political_sensitivity');
  assertIncludes(categories, 'social_norms');
  assertIncludes(categories, 'regional_taboos');
  assertIncludes(categories, 'language_appropriateness');
  assertIncludes(categories, 'gender_representation');
});

test('Cultural QC schema has rule actions', () => {
  const actions = culturalQCSchema.properties.culturalRules.items.properties.action.enum;
  assertIncludes(actions, 'block');
  assertIncludes(actions, 'flag_review');
  assertIncludes(actions, 'warn');
  assertIncludes(actions, 'suggest_alternative');
  assertIncludes(actions, 'log_only');
});

test('Cultural QC schema has alert types', () => {
  const alertTypes = culturalQCSchema.properties.sensitivityAlerts.properties.alertTypes.items.properties.alertType.enum;
  assertIncludes(alertTypes, 'cultural_violation');
  assertIncludes(alertTypes, 'translation_quality');
  assertIncludes(alertTypes, 'persona_inconsistency');
  assertIncludes(alertTypes, 'audience_feedback');
});

test('Cultural QC schema has feedback loop triggers', () => {
  const sources = culturalQCSchema.properties.feedbackLoopIntegration.properties.triggers.items.properties.source.enum;
  assertIncludes(sources, 'audience_sentiment');
  assertIncludes(sources, 'engagement_drop');
  assertIncludes(sources, 'negative_feedback');
  assertIncludes(sources, 'manual_report');
});

test('Cultural QC schema has translation QC check types', () => {
  const checkTypes = culturalQCSchema.properties.translationQC.properties.checks.items.properties.type.enum;
  assertIncludes(checkTypes, 'automated');
  assertIncludes(checkTypes, 'human_review');
  assertIncludes(checkTypes, 'native_speaker');
  assertIncludes(checkTypes, 'back_translation');
});

test('Cultural QC schema has persona consistency checks', () => {
  const checkTypes = culturalQCSchema.properties.personaConsistency.properties.checks.items.properties.type.enum;
  assertIncludes(checkTypes, 'voice_tone');
  assertIncludes(checkTypes, 'vocabulary');
  assertIncludes(checkTypes, 'cultural_references');
  assertIncludes(checkTypes, 'brand_alignment');
});

test('Cultural QC schema has remediation workflow actions', () => {
  const actions = culturalQCSchema.properties.remediation.properties.workflows.items.properties.steps.items.properties.action.enum;
  assertIncludes(actions, 'notify_creator');
  assertIncludes(actions, 'request_revision');
  assertIncludes(actions, 'human_review');
  assertIncludes(actions, 'approve');
  assertIncludes(actions, 'reject');
  assertIncludes(actions, 'escalate');
});

// Audit log tests
console.log('\n--- Audit Log Schema Tests ---');

test('Audit log schema has governance suite event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'policy_created');
  assertIncludes(eventTypes, 'policy_updated');
  assertIncludes(eventTypes, 'policy_activated');
  assertIncludes(eventTypes, 'compliance_check_passed');
  assertIncludes(eventTypes, 'compliance_check_failed');
  assertIncludes(eventTypes, 'violation_detected');
});

test('Audit log schema has governance categories', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'governance');
  assertIncludes(categories, 'compliance');
  assertIncludes(categories, 'access_control');
});

// Fixture validation tests
console.log('\n--- Governance Suite Validation Tests ---');

test('Valid governance suite passes validation', () => {
  const validSuite = fixtures.governanceSuites.valid[0];
  const errors = validateGovernanceSuite(validSuite);
  assertEqual(errors.length, 0, 'Expected no validation errors');
});

test('Governance suite has global scope', () => {
  const suite = fixtures.governanceSuites.valid[0];
  assertEqual(suite.scope.level, 'global');
  assertTrue(suite.scope.regions.length >= 5);
  assertTrue(suite.scope.languages.length >= 5);
});

test('Governance suite has multiple policies', () => {
  const suite = fixtures.governanceSuites.valid[0];
  assertTrue(suite.policies.length >= 2);
  const contentPolicy = suite.policies.find(p => p.type === 'content_standards');
  assertTrue(contentPolicy !== undefined);
  assertEqual(contentPolicy.enforcement, 'mandatory');
});

test('Governance suite has compliance frameworks', () => {
  const suite = fixtures.governanceSuites.valid[0];
  assertTrue(suite.complianceRegistry.frameworks.length >= 2);
  const gdpr = suite.complianceRegistry.frameworks.find(f => f.name === 'GDPR');
  assertTrue(gdpr !== undefined);
  assertTrue(gdpr.required);
  assertTrue(gdpr.requirements.length >= 3);
});

test('Governance suite has enforcement roles', () => {
  const suite = fixtures.governanceSuites.valid[0];
  assertTrue(suite.enforcement.roles.length >= 3);
  const admin = suite.enforcement.roles.find(r => r.role === 'ecosystem_admin');
  assertTrue(admin !== undefined);
  assertTrue(admin.mfaRequired);
  assertTrue(admin.permissions.length >= 10);
});

test('Governance suite has automated enforcement', () => {
  const suite = fixtures.governanceSuites.valid[0];
  assertTrue(suite.enforcement.automatedEnforcement.enabled);
  assertTrue(suite.enforcement.automatedEnforcement.triggers.length >= 3);
  const hateSpeechTrigger = suite.enforcement.automatedEnforcement.triggers.find(t => t.triggerId === 'trigger-hate-speech');
  assertTrue(hateSpeechTrigger !== undefined);
  assertIncludes(hateSpeechTrigger.actions, 'block');
});

test('Governance suite has violation categories', () => {
  const suite = fixtures.governanceSuites.valid[0];
  assertTrue(suite.violations.categories.length >= 3);
  const hateSpeech = suite.violations.categories.find(c => c.categoryId === 'cat-hate-speech');
  assertTrue(hateSpeech !== undefined);
  assertEqual(hateSpeech.severity, 'critical');
  assertEqual(hateSpeech.penalties.thirdOffense, 'permanent_ban');
});

test('Governance suite has metrics', () => {
  const suite = fixtures.governanceSuites.valid[0];
  assertTrue(suite.metrics.complianceScore >= 90);
  assertTrue(suite.metrics.violationCount > 0);
  assertTrue(suite.metrics.resolvedViolations > 0);
  assertTrue(suite.metrics.auditCompletionRate === 100);
});

// Payment Compliance validation tests
console.log('\n--- Payment Compliance Validation Tests ---');

test('Valid payment compliance passes validation', () => {
  const validCompliance = fixtures.paymentCompliance.valid[0];
  const errors = validatePaymentCompliance(validCompliance);
  assertEqual(errors.length, 0, 'Expected no validation errors');
});

test('Payment compliance has verified KYC', () => {
  const compliance = fixtures.paymentCompliance.valid[0];
  assertEqual(compliance.kyc.status, 'verified');
  assertEqual(compliance.kyc.level, 'enhanced');
  assertTrue(compliance.kyc.documents.length >= 3);
  assertTrue(compliance.kyc.identityVerification.verified);
  assertTrue(compliance.kyc.businessVerification.verified);
});

test('Payment compliance has clear AML status', () => {
  const compliance = fixtures.paymentCompliance.valid[0];
  assertEqual(compliance.aml.status, 'clear');
  assertEqual(compliance.aml.riskLevel, 'low');
  assertTrue(compliance.aml.riskScore <= 20);
  assertTrue(compliance.aml.sanctions.listsChecked.length >= 4);
  assertEqual(compliance.aml.sanctions.hits, 0);
});

test('Payment compliance has tax compliance', () => {
  const compliance = fixtures.paymentCompliance.valid[0];
  assertEqual(compliance.taxCompliance.status, 'compliant');
  assertTrue(compliance.taxCompliance.taxIdVerified);
  assertTrue(compliance.taxCompliance.taxForms.length >= 1);
});

test('Payment compliance has payment rules', () => {
  const compliance = fixtures.paymentCompliance.valid[0];
  assertTrue(compliance.paymentRules.allowedMethods.length >= 4);
  assertTrue(compliance.paymentRules.allowedCurrencies.length >= 3);
  assertTrue(compliance.paymentRules.minimumPayout > 0);
  assertTrue(compliance.paymentRules.holdPeriod > 0);
});

test('Payment compliance has fraud detection', () => {
  const compliance = fixtures.paymentCompliance.valid[0];
  assertTrue(compliance.fraudDetection.enabled);
  assertEqual(compliance.fraudDetection.riskLevel, 'low');
  assertEqual(compliance.fraudDetection.blockedTransactions, 0);
  assertFalse(compliance.fraudDetection.manualReviewRequired);
});

test('Payment compliance has compliance checks', () => {
  const compliance = fixtures.paymentCompliance.valid[0];
  assertTrue(compliance.complianceChecks.length >= 2);
  const kycCheck = compliance.complianceChecks.find(c => c.type === 'kyc');
  assertTrue(kycCheck !== undefined);
  assertEqual(kycCheck.status, 'passed');
});

test('Payment compliance has overall status', () => {
  const compliance = fixtures.paymentCompliance.valid[0];
  assertEqual(compliance.overallStatus, 'compliant');
  assertTrue(compliance.complianceScore >= 95);
});

// Cultural QC validation tests
console.log('\n--- Cultural QC Validation Tests ---');

test('Valid cultural QC passes validation', () => {
  const validQC = fixtures.culturalQC.valid[0];
  const errors = validateCulturalQC(validQC);
  assertEqual(errors.length, 0, 'Expected no validation errors');
});

test('Cultural QC has scope defined', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertEqual(qc.scope.region, 'MEA');
  assertEqual(qc.scope.language, 'ar');
  assertEqual(qc.scope.contentType, 'all');
});

test('Cultural QC has rules defined', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.culturalRules.length >= 4);
  const religiousRule = qc.culturalRules.find(r => r.category === 'religious_sensitivity');
  assertTrue(religiousRule !== undefined);
  assertEqual(religiousRule.priority, 'critical');
  assertEqual(religiousRule.enforcement, 'mandatory');
});

test('Cultural QC has dashboard enabled', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.qcDashboard.enabled);
  assertTrue(qc.qcDashboard.views.length >= 2);
  assertTrue(qc.qcDashboard.metrics.passRate >= 80);
});

test('Cultural QC has sensitivity alerts', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.sensitivityAlerts.enabled);
  assertTrue(qc.sensitivityAlerts.alertTypes.length >= 3);
  const culturalAlert = qc.sensitivityAlerts.alertTypes.find(a => a.alertType === 'cultural_violation');
  assertTrue(culturalAlert !== undefined);
  assertEqual(culturalAlert.severity, 'high');
  assertTrue(culturalAlert.escalation.enabled);
});

test('Cultural QC has feedback loop integration', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.feedbackLoopIntegration.enabled);
  assertTrue(qc.feedbackLoopIntegration.triggers.length >= 3);
  assertTrue(qc.feedbackLoopIntegration.personalizationAdjustments.enabled);
});

test('Cultural QC has translation QC', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.translationQC.enabled);
  assertTrue(qc.translationQC.qualityThresholds.accuracy >= 90);
  assertTrue(qc.translationQC.nativeReviewerRequired);
  assertTrue(qc.translationQC.checks.length >= 3);
});

test('Cultural QC has persona consistency checks', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.personaConsistency.enabled);
  assertTrue(qc.personaConsistency.checks.length >= 3);
  assertTrue(qc.personaConsistency.crossEpisodeTracking);
  assertTrue(qc.personaConsistency.crossLanguageTracking);
});

test('Cultural QC has remediation workflows', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.remediation.enabled);
  assertTrue(qc.remediation.workflows.length >= 1);
  const workflow = qc.remediation.workflows[0];
  assertTrue(workflow.steps.length >= 4);
  assertTrue(workflow.sla > 0);
});

test('Cultural QC has checks performed', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.checks.length >= 2);
  const passedCheck = qc.checks.find(c => c.status === 'passed');
  assertTrue(passedCheck !== undefined);
  assertTrue(passedCheck.score >= 90);
});

test('Cultural QC has metrics', () => {
  const qc = fixtures.culturalQC.valid[0];
  assertTrue(qc.metrics.totalChecks > 0);
  assertTrue(qc.metrics.passedChecks > 0);
  assertTrue(qc.metrics.avgScore >= 80);
  assertTrue(qc.metrics.topViolationTypes.length >= 2);
});

// Calculation tests
console.log('\n--- Calculation Tests ---');

test('Compliance score calculation is correct', () => {
  const calc = fixtures.calculations.complianceScore.example;
  const score = calculateComplianceScore(calc.frameworkScores);
  assertApproximatelyEqual(score, calc.expectedOverallScore, 'Compliance score mismatch');
});

test('QC pass rate calculation is correct', () => {
  const calc = fixtures.calculations.qcPassRate.example;
  const rate = calculatePassRate(calc.totalChecks, calc.passedChecks);
  assertApproximatelyEqual(rate, calc.expectedPassRate, 'Pass rate mismatch');
});

test('Violation resolution rate calculation is correct', () => {
  const calc = fixtures.calculations.violationResolutionRate.example;
  const rate = calculateResolutionRate(calc.totalViolations, calc.resolvedViolations);
  assertApproximatelyEqual(rate, calc.expectedResolutionRate, 'Resolution rate mismatch');
});

test('Zero total checks returns zero pass rate', () => {
  assertEqual(calculatePassRate(0, 0), 0);
});

test('Zero violations returns 100% resolution rate', () => {
  assertEqual(calculateResolutionRate(0, 0), 100);
});

// Audit log validation tests
console.log('\n--- Audit Log Tests ---');

test('Governance suite audit logs are valid', () => {
  const logs = fixtures.auditLogs.governanceSuite;
  assertTrue(logs.length >= 3);
  
  const createdLog = logs.find(l => l.eventType === 'governance_suite_created');
  assertTrue(createdLog !== undefined);
  assertEqual(createdLog.category, 'governance_suite');
});

test('Payment compliance audit logs are valid', () => {
  const logs = fixtures.auditLogs.paymentCompliance;
  assertTrue(logs.length >= 2);
  
  const kycLog = logs.find(l => l.eventType === 'kyc_verified');
  assertTrue(kycLog !== undefined);
  assertEqual(kycLog.category, 'payment_compliance');
});

test('Cultural QC audit logs are valid', () => {
  const logs = fixtures.auditLogs.culturalQC;
  assertTrue(logs.length >= 2);
  
  const alertLog = logs.find(l => l.eventType === 'cultural_sensitivity_alert');
  assertTrue(alertLog !== undefined);
  assertEqual(alertLog.category, 'cultural_qc');
});

// Invalid data tests
console.log('\n--- Invalid Data Tests ---');

test('Invalid governance suite fails validation', () => {
  const invalidSuite = fixtures.governanceSuites.invalid[0];
  const errors = validateGovernanceSuite(invalidSuite);
  assertTrue(errors.length > 0, 'Expected validation errors');
});

test('Missing required fields are detected in governance suite', () => {
  const invalidSuite = fixtures.governanceSuites.invalid[1];
  const errors = validateGovernanceSuite(invalidSuite);
  assertTrue(errors.some(e => e.includes('Missing required field')));
});

test('Invalid payment compliance fails validation', () => {
  const invalidCompliance = fixtures.paymentCompliance.invalid[0];
  const errors = validatePaymentCompliance(invalidCompliance);
  assertTrue(errors.length > 0, 'Expected validation errors');
});

test('Invalid cultural QC fails validation', () => {
  const invalidQC = fixtures.culturalQC.invalid[0];
  const errors = validateCulturalQC(invalidQC);
  assertTrue(errors.length > 0, 'Expected validation errors');
});

// Integration tests
console.log('\n--- Integration Tests ---');

test('Governance suite integrates with payment compliance', () => {
  const suite = fixtures.governanceSuites.valid[0];
  const compliance = fixtures.paymentCompliance.valid[0];
  
  // Verify that the governance suite has policies for monetization
  const monetizationPolicy = suite.policies.find(p => p.type === 'monetization_rules');
  assertTrue(monetizationPolicy !== undefined);
  
  // Verify that payment compliance has KYC verified
  assertEqual(compliance.kyc.status, 'verified');
  assertEqual(compliance.overallStatus, 'compliant');
});

test('Governance suite integrates with cultural QC', () => {
  const suite = fixtures.governanceSuites.valid[0];
  const qc = fixtures.culturalQC.valid[0];
  
  // Verify that the governance suite has cultural sensitivity rules
  const globalRule = suite.complianceRegistry.globalRules.find(r => r.type === 'cultural_sensitivity');
  assertTrue(globalRule !== undefined);
  
  // Verify that cultural QC has sensitivity alerts
  assertTrue(qc.sensitivityAlerts.enabled);
});

test('Cultural QC feedback loop integrates with personalization', () => {
  const qc = fixtures.culturalQC.valid[0];
  
  // Verify feedback loop has personalization adjustments
  assertTrue(qc.feedbackLoopIntegration.personalizationAdjustments.enabled);
  assertIncludes(qc.feedbackLoopIntegration.personalizationAdjustments.adjustmentTypes, 'demote_content');
  assertIncludes(qc.feedbackLoopIntegration.personalizationAdjustments.adjustmentTypes, 'promote_alternatives');
});

// Print summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
