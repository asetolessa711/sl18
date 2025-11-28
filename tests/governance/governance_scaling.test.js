/**
 * Phase 18: Governance Scaling & Contributor Marketplace Tests
 * 
 * Tests for governance policies, contributor agreements, marketplace listings,
 * access control, and audit logging.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const governancePolicySchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/governance_policy.schema.json'), 'utf-8')
);
const contributorAgreementSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/contributor_agreement.schema.json'), 'utf-8')
);
const contributorMarketplaceSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/contributor_marketplace.schema.json'), 'utf-8')
);
const auditLogSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/audit_log.schema.json'), 'utf-8')
);

// Load fixtures
const fixtures = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/governance_scaling.json'), 'utf-8')
);

// Test counters
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
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

function assertIncludes(array, item, message) {
  if (!array.includes(item)) {
    throw new Error(message || `Array does not include ${item}`);
  }
}

function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// ==========================================
// Governance Policy Tests
// ==========================================

console.log('\n📋 Governance Policy Schema Tests\n');

test('Schema should have required governance policy fields', () => {
  const required = governancePolicySchema.required;
  assertIncludes(required, 'policyId', 'Missing policyId');
  assertIncludes(required, 'name', 'Missing name');
  assertIncludes(required, 'version', 'Missing version');
  assertIncludes(required, 'type', 'Missing type');
  assertIncludes(required, 'scope', 'Missing scope');
  assertIncludes(required, 'rules', 'Missing rules');
  assertIncludes(required, 'status', 'Missing status');
});

test('Policy types should include all governance categories', () => {
  const policyTypes = governancePolicySchema.properties.type.enum;
  assertIncludes(policyTypes, 'franchise_rules', 'Missing franchise_rules');
  assertIncludes(policyTypes, 'compliance', 'Missing compliance');
  assertIncludes(policyTypes, 'audit', 'Missing audit');
  assertIncludes(policyTypes, 'access_control', 'Missing access_control');
  assertIncludes(policyTypes, 'content_standards', 'Missing content_standards');
  assertIncludes(policyTypes, 'revenue_sharing', 'Missing revenue_sharing');
  assertIncludes(policyTypes, 'contributor_terms', 'Missing contributor_terms');
});

test('Policy scope levels should support global, region, franchise, contributor', () => {
  const scopeLevels = governancePolicySchema.properties.scope.properties.level.enum;
  assertIncludes(scopeLevels, 'global', 'Missing global scope');
  assertIncludes(scopeLevels, 'region', 'Missing region scope');
  assertIncludes(scopeLevels, 'franchise', 'Missing franchise scope');
  assertIncludes(scopeLevels, 'contributor', 'Missing contributor scope');
});

test('Valid policy fixture should have correct structure', () => {
  const policy = fixtures.validPolicies[0];
  assertEqual(policy.policyId, 'policy-content-global-001');
  assertEqual(policy.type, 'content_standards');
  assertEqual(policy.scope.level, 'global');
  assert(policy.rules.length >= 1, 'Policy should have at least one rule');
  assertEqual(policy.status, 'active');
});

test('Policy rules should have enforcement levels', () => {
  const enforcementLevels = governancePolicySchema.properties.rules.items.properties.enforcement.enum;
  assertIncludes(enforcementLevels, 'mandatory', 'Missing mandatory');
  assertIncludes(enforcementLevels, 'recommended', 'Missing recommended');
  assertIncludes(enforcementLevels, 'optional', 'Missing optional');
});

test('Policy rules should have action types', () => {
  const actionTypes = governancePolicySchema.properties.rules.items.properties.action.enum;
  assertIncludes(actionTypes, 'allow', 'Missing allow');
  assertIncludes(actionTypes, 'deny', 'Missing deny');
  assertIncludes(actionTypes, 'warn', 'Missing warn');
  assertIncludes(actionTypes, 'require_approval', 'Missing require_approval');
  assertIncludes(actionTypes, 'log_only', 'Missing log_only');
});

// ==========================================
// Access Control Tests
// ==========================================

console.log('\n🔐 Access Control Tests\n');

test('Schema should support role-based permissions', () => {
  const roles = governancePolicySchema.properties.accessControl.properties.roles.items.properties.role.enum;
  assertIncludes(roles, 'operator', 'Missing operator role');
  assertIncludes(roles, 'reviewer', 'Missing reviewer role');
  assertIncludes(roles, 'contributor', 'Missing contributor role');
  assertIncludes(roles, 'auditor', 'Missing auditor role');
  assertIncludes(roles, 'admin', 'Missing admin role');
  assertIncludes(roles, 'super_admin', 'Missing super_admin role');
});

test('Schema should define all necessary permissions', () => {
  const permissions = governancePolicySchema.properties.accessControl.properties.roles.items.properties.permissions.items.enum;
  assertIncludes(permissions, 'view_content', 'Missing view_content');
  assertIncludes(permissions, 'create_content', 'Missing create_content');
  assertIncludes(permissions, 'publish_content', 'Missing publish_content');
  assertIncludes(permissions, 'view_policies', 'Missing view_policies');
  assertIncludes(permissions, 'create_policies', 'Missing create_policies');
  assertIncludes(permissions, 'assign_roles', 'Missing assign_roles');
  assertIncludes(permissions, 'view_audit_logs', 'Missing view_audit_logs');
  assertIncludes(permissions, 'manage_contributors', 'Missing manage_contributors');
  assertIncludes(permissions, 'manage_marketplace', 'Missing manage_marketplace');
});

test('MFA requirement should be configurable per role', () => {
  const roleProps = governancePolicySchema.properties.accessControl.properties.roles.items.properties;
  assert(roleProps.mfaRequired, 'MFA requirement property should exist');
  assertEqual(roleProps.mfaRequired.type, 'boolean', 'MFA requirement should be boolean');
});

test('Valid policy should have access control configuration', () => {
  const policy = fixtures.validPolicies[0];
  assert(policy.accessControl, 'Policy should have accessControl');
  assert(policy.accessControl.roles.length >= 1, 'Should have at least one role defined');
  
  const adminRole = policy.accessControl.roles.find(r => r.role === 'admin');
  assert(adminRole, 'Should have admin role');
  assertEqual(adminRole.mfaRequired, true, 'Admin should require MFA');
});

test('Sensitive actions should be defined in policy', () => {
  const policy = fixtures.validPolicies[0];
  assert(policy.accessControl.sensitiveActions, 'Should have sensitive actions');
  assertIncludes(policy.accessControl.sensitiveActions, 'delete_content', 'Missing delete_content');
  assertIncludes(policy.accessControl.sensitiveActions, 'create_policies', 'Missing create_policies');
});

// ==========================================
// Compliance Tests
// ==========================================

console.log('\n📊 Compliance Tests\n');

test('Schema should support compliance frameworks', () => {
  const frameworks = governancePolicySchema.properties.complianceRequirements.properties.frameworks.items.enum;
  assertIncludes(frameworks, 'GDPR', 'Missing GDPR');
  assertIncludes(frameworks, 'CCPA', 'Missing CCPA');
  assertIncludes(frameworks, 'SOC2', 'Missing SOC2');
  assertIncludes(frameworks, 'ISO27001', 'Missing ISO27001');
  assertIncludes(frameworks, 'PCI-DSS', 'Missing PCI-DSS');
});

test('Data retention should be configurable', () => {
  const policy = fixtures.validPolicies[0];
  assert(policy.complianceRequirements.dataRetention, 'Should have data retention config');
  assert(policy.complianceRequirements.dataRetention.auditLogs >= 365, 'Audit logs should be retained at least 1 year');
  assert(policy.complianceRequirements.dataRetention.financialRecords >= 365, 'Financial records should be retained at least 1 year');
});

test('Audit frequency should be configurable', () => {
  const frequencies = governancePolicySchema.properties.auditRequirements.properties.frequency.enum;
  assertIncludes(frequencies, 'continuous', 'Missing continuous');
  assertIncludes(frequencies, 'daily', 'Missing daily');
  assertIncludes(frequencies, 'weekly', 'Missing weekly');
  assertIncludes(frequencies, 'monthly', 'Missing monthly');
});

test('Alert configuration should be defined', () => {
  const policy = fixtures.validPolicies[0];
  assert(policy.auditRequirements.alerts, 'Should have alert configuration');
  assertEqual(policy.auditRequirements.alerts.enabled, true, 'Alerts should be enabled');
  assert(policy.auditRequirements.alerts.channels.length >= 1, 'Should have at least one alert channel');
});

// ==========================================
// Contributor Agreement Tests
// ==========================================

console.log('\n📝 Contributor Agreement Tests\n');

test('Schema should have required contributor agreement fields', () => {
  const required = contributorAgreementSchema.required;
  assertIncludes(required, 'agreementId', 'Missing agreementId');
  assertIncludes(required, 'contributorId', 'Missing contributorId');
  assertIncludes(required, 'contributorType', 'Missing contributorType');
  assertIncludes(required, 'personalInfo', 'Missing personalInfo');
  assertIncludes(required, 'terms', 'Missing terms');
  assertIncludes(required, 'status', 'Missing status');
});

test('Contributor types should include all roles', () => {
  const types = contributorAgreementSchema.properties.contributorType.enum;
  assertIncludes(types, 'creator', 'Missing creator');
  assertIncludes(types, 'reviewer', 'Missing reviewer');
  assertIncludes(types, 'operator', 'Missing operator');
  assertIncludes(types, 'auditor', 'Missing auditor');
  assertIncludes(types, 'translator', 'Missing translator');
  assertIncludes(types, 'voice_artist', 'Missing voice_artist');
});

test('Valid contributor agreement should have correct structure', () => {
  const agreement = fixtures.validContributorAgreements[0];
  assertEqual(agreement.agreementId, 'contrib-agr-creator-001');
  assertEqual(agreement.contributorType, 'creator');
  assertEqual(agreement.status, 'active');
  assert(agreement.personalInfo.identityVerified, 'Identity should be verified');
});

test('Revenue share models should be supported', () => {
  const models = contributorAgreementSchema.properties.terms.properties.revenueShare.properties.model.enum;
  assertIncludes(models, 'percentage', 'Missing percentage');
  assertIncludes(models, 'flat_fee', 'Missing flat_fee');
  assertIncludes(models, 'tiered', 'Missing tiered');
  assertIncludes(models, 'hybrid', 'Missing hybrid');
});

test('Tiered revenue share should be configurable', () => {
  const agreement = fixtures.validContributorAgreements[0];
  assertEqual(agreement.terms.revenueShare.model, 'tiered');
  assert(agreement.terms.revenueShare.tiers.length >= 1, 'Should have tiers defined');
  
  const tier1 = agreement.terms.revenueShare.tiers[0];
  assertEqual(tier1.threshold, 0, 'First tier should start at 0');
  assert(tier1.percentage >= 0 && tier1.percentage <= 100, 'Percentage should be 0-100');
});

test('Intellectual property terms should be defined', () => {
  const agreement = fixtures.validContributorAgreements[0];
  assert(agreement.terms.intellectualProperty, 'Should have IP terms');
  assertEqual(agreement.terms.intellectualProperty.ownership, 'shared');
  assertEqual(agreement.terms.intellectualProperty.attribution, true);
});

test('Identity verification methods should be supported', () => {
  const methods = contributorAgreementSchema.properties.personalInfo.properties.verificationMethod.enum;
  assertIncludes(methods, 'government_id', 'Missing government_id');
  assertIncludes(methods, 'passport', 'Missing passport');
  assertIncludes(methods, 'video_verification', 'Missing video_verification');
  assertIncludes(methods, 'bank_verification', 'Missing bank_verification');
});

test('Payment methods should be supported', () => {
  const methods = contributorAgreementSchema.properties.paymentInfo.properties.method.enum;
  assertIncludes(methods, 'bank_transfer', 'Missing bank_transfer');
  assertIncludes(methods, 'paypal', 'Missing paypal');
  assertIncludes(methods, 'stripe', 'Missing stripe');
  assertIncludes(methods, 'wise', 'Missing wise');
  assertIncludes(methods, 'crypto', 'Missing crypto');
});

test('Agreement signatures should be tracked', () => {
  const agreement = fixtures.validContributorAgreements[0];
  assert(agreement.signatures.length >= 1, 'Should have at least one signature');
  
  const mainSig = agreement.signatures.find(s => s.documentType === 'main_agreement');
  assert(mainSig, 'Should have main agreement signature');
  assert(mainSig.signatureHash, 'Should have signature hash');
});

test('Franchise associations should be tracked', () => {
  const agreement = fixtures.validContributorAgreements[0];
  assert(agreement.franchiseAssociations.length >= 1, 'Should have franchise associations');
  
  const assoc = agreement.franchiseAssociations[0];
  assertEqual(assoc.role, 'creator');
  assertEqual(assoc.status, 'active');
});

// ==========================================
// Contributor Marketplace Tests
// ==========================================

console.log('\n🏪 Contributor Marketplace Tests\n');

test('Schema should have required marketplace fields', () => {
  const required = contributorMarketplaceSchema.required;
  assertIncludes(required, 'marketplaceId', 'Missing marketplaceId');
  assertIncludes(required, 'name', 'Missing name');
  assertIncludes(required, 'categories', 'Missing categories');
  assertIncludes(required, 'revenueModels', 'Missing revenueModels');
  assertIncludes(required, 'onboarding', 'Missing onboarding');
  assertIncludes(required, 'status', 'Missing status');
});

test('Valid marketplace should have correct structure', () => {
  const marketplace = fixtures.validMarketplace;
  assertEqual(marketplace.marketplaceId, 'mkt-africa-001');
  assertEqual(marketplace.status, 'active');
  assert(marketplace.categories.length >= 1, 'Should have categories');
  assert(marketplace.listings.length >= 1, 'Should have listings');
});

test('Marketplace categories should define contributor types', () => {
  const marketplace = fixtures.validMarketplace;
  const category = marketplace.categories[0];
  assert(category.categoryId, 'Category should have ID');
  assert(category.name, 'Category should have name');
  assert(category.contributorTypes.length >= 1, 'Category should have contributor types');
});

test('Marketplace listings should have required fields', () => {
  const listing = fixtures.validMarketplace.listings[0];
  assert(listing.listingId, 'Missing listingId');
  assert(listing.contributorId, 'Missing contributorId');
  assert(listing.title.length >= 10, 'Title should be at least 10 chars');
  assert(listing.description.length >= 50, 'Description should be at least 50 chars');
  assert(listing.skills.length >= 1, 'Should have at least one skill');
});

test('Listing pricing models should be supported', () => {
  const models = contributorMarketplaceSchema.properties.listings.items.properties.pricing.properties.model.enum;
  assertIncludes(models, 'hourly', 'Missing hourly');
  assertIncludes(models, 'per_project', 'Missing per_project');
  assertIncludes(models, 'revenue_share', 'Missing revenue_share');
  assertIncludes(models, 'hybrid', 'Missing hybrid');
});

test('Listing availability statuses should be defined', () => {
  const statuses = contributorMarketplaceSchema.properties.listings.items.properties.availability.properties.status.enum;
  assertIncludes(statuses, 'available', 'Missing available');
  assertIncludes(statuses, 'busy', 'Missing busy');
  assertIncludes(statuses, 'limited', 'Missing limited');
  assertIncludes(statuses, 'unavailable', 'Missing unavailable');
});

test('Listings should have ratings breakdown', () => {
  const listing = fixtures.validMarketplace.listings[0];
  assert(listing.ratings.average >= 0 && listing.ratings.average <= 5, 'Rating should be 0-5');
  assert(listing.ratings.count >= 0, 'Count should be non-negative');
  
  if (listing.ratings.breakdown) {
    assert(listing.ratings.breakdown.quality <= 5, 'Quality rating should be <= 5');
    assert(listing.ratings.breakdown.communication <= 5, 'Communication rating should be <= 5');
  }
});

test('Listings should support verifications', () => {
  const listing = fixtures.validMarketplace.listings[0];
  assert(listing.verifications, 'Should have verifications');
  assertEqual(listing.verifications.identity, true, 'Identity should be verified');
  assertEqual(listing.verifications.payment, true, 'Payment should be verified');
});

test('Revenue models should be configurable', () => {
  const marketplace = fixtures.validMarketplace;
  assert(marketplace.revenueModels.length >= 1, 'Should have revenue models');
  
  const model = marketplace.revenueModels[0];
  assert(model.modelId, 'Model should have ID');
  assert(model.defaultSplit, 'Model should have default split');
  
  const totalSplit = model.defaultSplit.contributorPercentage + 
                     model.defaultSplit.platformPercentage + 
                     model.defaultSplit.franchisePercentage;
  assertEqual(totalSplit, 100, 'Split should total 100%');
});

test('Onboarding steps should be defined', () => {
  const marketplace = fixtures.validMarketplace;
  assert(marketplace.onboarding.steps.length >= 1, 'Should have onboarding steps');
  
  const steps = marketplace.onboarding.steps;
  const orderedSteps = [...steps].sort((a, b) => a.order - b.order);
  assert(deepEqual(steps, orderedSteps), 'Steps should be in order');
});

test('Onboarding requirements should be configured', () => {
  const requirements = fixtures.validMarketplace.onboarding.requirements;
  assertEqual(requirements.identityVerification, true, 'Identity verification should be required');
  assertEqual(requirements.paymentVerification, true, 'Payment verification should be required');
  assertEqual(requirements.agreementSigned, true, 'Agreement should be required');
  assertEqual(requirements.qcAssessment, true, 'QC assessment should be required');
  assert(requirements.minimumQcScore >= 0, 'Minimum QC score should be defined');
});

test('Cross-promotion should be configurable', () => {
  const crossPromo = fixtures.validMarketplace.crossPromotion;
  assertEqual(crossPromo.enabled, true, 'Cross-promotion should be enabled');
  assert(crossPromo.formats.length >= 1, 'Should have promotion formats');
  assert(crossPromo.channels.length >= 1, 'Should have promotion channels');
  assert(crossPromo.eligibility.minimumRating >= 0, 'Should have minimum rating requirement');
});

test('Marketplace metrics should be tracked', () => {
  const metrics = fixtures.validMarketplace.metrics;
  assert(metrics.totalListings >= 0, 'Total listings should be tracked');
  assert(metrics.activeListings >= 0, 'Active listings should be tracked');
  assert(metrics.totalContributors >= 0, 'Total contributors should be tracked');
  assert(metrics.totalRevenue >= 0, 'Total revenue should be tracked');
  assert(metrics.averageRating >= 0 && metrics.averageRating <= 5, 'Average rating should be 0-5');
});

// ==========================================
// Governance Audit Events Tests
// ==========================================

console.log('\n📝 Governance Audit Events Tests\n');

test('Audit log should support governance event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'policy_created', 'Missing policy_created');
  assertIncludes(eventTypes, 'policy_updated', 'Missing policy_updated');
  assertIncludes(eventTypes, 'policy_activated', 'Missing policy_activated');
  assertIncludes(eventTypes, 'policy_violation_detected', 'Missing policy_violation_detected');
  assertIncludes(eventTypes, 'compliance_check_passed', 'Missing compliance_check_passed');
  assertIncludes(eventTypes, 'compliance_check_failed', 'Missing compliance_check_failed');
});

test('Audit log should support access control events', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'role_assigned', 'Missing role_assigned');
  assertIncludes(eventTypes, 'role_revoked', 'Missing role_revoked');
  assertIncludes(eventTypes, 'permission_granted', 'Missing permission_granted');
  assertIncludes(eventTypes, 'mfa_enabled', 'Missing mfa_enabled');
  assertIncludes(eventTypes, 'sensitive_action_attempted', 'Missing sensitive_action_attempted');
});

test('Audit log should support contributor events', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'contributor_registered', 'Missing contributor_registered');
  assertIncludes(eventTypes, 'contributor_verified', 'Missing contributor_verified');
  assertIncludes(eventTypes, 'contributor_agreement_signed', 'Missing contributor_agreement_signed');
  assertIncludes(eventTypes, 'contributor_suspended', 'Missing contributor_suspended');
  assertIncludes(eventTypes, 'contributor_terminated', 'Missing contributor_terminated');
});

test('Audit log should support marketplace events', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'listing_created', 'Missing listing_created');
  assertIncludes(eventTypes, 'listing_approved', 'Missing listing_approved');
  assertIncludes(eventTypes, 'listing_featured', 'Missing listing_featured');
  assertIncludes(eventTypes, 'marketplace_transaction_completed', 'Missing marketplace_transaction_completed');
  assertIncludes(eventTypes, 'marketplace_payout_completed', 'Missing marketplace_payout_completed');
});

test('Audit log should support governance categories', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'governance', 'Missing governance category');
  assertIncludes(categories, 'access_control', 'Missing access_control category');
  assertIncludes(categories, 'compliance', 'Missing compliance category');
  assertIncludes(categories, 'contributor', 'Missing contributor category');
  assertIncludes(categories, 'marketplace', 'Missing marketplace category');
});

test('Audit log should support new target types', () => {
  const targetTypes = auditLogSchema.properties.target.properties.type.enum;
  assertIncludes(targetTypes, 'policy', 'Missing policy target');
  assertIncludes(targetTypes, 'role', 'Missing role target');
  assertIncludes(targetTypes, 'permission', 'Missing permission target');
  assertIncludes(targetTypes, 'contributor', 'Missing contributor target');
  assertIncludes(targetTypes, 'listing', 'Missing listing target');
  assertIncludes(targetTypes, 'marketplace', 'Missing marketplace target');
});

test('Valid governance audit events should have correct structure', () => {
  const events = fixtures.governanceAuditEvents;
  assert(events.length >= 1, 'Should have audit events');
  
  const policyEvent = events.find(e => e.eventType === 'policy_created');
  assert(policyEvent, 'Should have policy_created event');
  assertEqual(policyEvent.category, 'governance');
  assertEqual(policyEvent.target.type, 'policy');
});

test('Marketplace transaction events should include financial details', () => {
  const events = fixtures.governanceAuditEvents;
  const txnEvent = events.find(e => e.eventType === 'marketplace_transaction_completed');
  assert(txnEvent, 'Should have transaction event');
  
  assert(txnEvent.details.metadata.amount > 0, 'Should have amount');
  assert(txnEvent.details.metadata.contributorShare > 0, 'Should have contributor share');
  assert(txnEvent.details.metadata.platformShare > 0, 'Should have platform share');
});

// ==========================================
// Integration Tests
// ==========================================

console.log('\n🔗 Integration Tests\n');

test('Policy rules should enforce QC thresholds from content standards', () => {
  const policy = fixtures.validPolicies[0];
  const qcRule = policy.rules.find(r => r.ruleId === 'qc-threshold');
  assert(qcRule, 'Should have QC threshold rule');
  assertEqual(qcRule.enforcement, 'mandatory', 'QC should be mandatory');
  assertEqual(qcRule.action, 'deny', 'Should deny below threshold');
});

test('Contributor agreements should reference franchise associations', () => {
  const agreement = fixtures.validContributorAgreements[0];
  const franchiseId = agreement.franchiseAssociations[0].franchiseId;
  assertEqual(franchiseId, 'kenya-001', 'Should reference valid franchise');
});

test('Marketplace listings should match contributor agreements', () => {
  const agreement = fixtures.validContributorAgreements[0];
  const listing = fixtures.validMarketplace.listings.find(
    l => l.contributorId === agreement.contributorId
  );
  assert(listing, 'Contributor should have marketplace listing');
  assertEqual(listing.contributorType, agreement.contributorType, 'Contributor types should match');
});

test('Revenue models should align with agreement terms', () => {
  const agreement = fixtures.validContributorAgreements[0];
  const marketplace = fixtures.validMarketplace;
  
  // Check that tiered model exists in marketplace
  const tieredModel = marketplace.revenueModels.find(m => m.splitType === 'tiered');
  assert(tieredModel, 'Marketplace should support tiered revenue');
  assertEqual(agreement.terms.revenueShare.model, 'tiered', 'Agreement should use tiered model');
});

test('Cross-promotion eligibility should match listing criteria', () => {
  const crossPromo = fixtures.validMarketplace.crossPromotion;
  const listing = fixtures.validMarketplace.listings[0];
  
  const eligible = listing.ratings.average >= crossPromo.eligibility.minimumRating &&
                   listing.verifications.identity === crossPromo.eligibility.verifiedOnly;
  assert(eligible, 'Featured listing should be eligible for cross-promotion');
});

// ==========================================
// Summary
// ==========================================

console.log('\n========================================');
console.log(`Phase 18 Tests Complete: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
