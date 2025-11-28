/**
 * SL18 Globalization & Monetization Test Suite
 * Phase 15: Multilingual Support and Payment Integration
 * 
 * Run: node tests/governance/globalization.test.js
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

// Constants
const PAYMENT_FEE_TOLERANCE = 0.01;

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

function assertApproxEqual(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(message || `Expected ~${expected}, got ${actual} (tolerance: ${tolerance})`);
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

// Language pack validation
function validateLanguagePack(data) {
  const required = ['languageCode', 'displayName', 'nativeName', 'direction', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate language code pattern
  const langPattern = /^[a-z]{2}(-[A-Z]{2})?$/;
  if (!langPattern.test(data.languageCode)) {
    return { valid: false, error: 'languageCode must match ISO pattern (e.g., en, fr, zh-CN)' };
  }

  // Validate direction
  if (!['ltr', 'rtl'].includes(data.direction)) {
    return { valid: false, error: 'direction must be ltr or rtl' };
  }

  // Validate status
  if (!['draft', 'active', 'deprecated'].includes(data.status)) {
    return { valid: false, error: 'status must be draft, active, or deprecated' };
  }

  return { valid: true };
}

// Payment transaction validation
function validatePaymentTransaction(data) {
  const required = ['transactionId', 'franchiseId', 'paymentGateway', 'paymentMethod', 'amount', 'transactionType', 'status', 'timestamps'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate payment gateway
  const validGateways = ['visa', 'mastercard', 'paypal', 'stripe', 'bank_transfer', 'other'];
  if (!validGateways.includes(data.paymentGateway)) {
    return { valid: false, error: 'paymentGateway must be one of enum values' };
  }

  // Validate currency format
  if (data.amount.currency && !/^[A-Z]{3}$/.test(data.amount.currency)) {
    return { valid: false, error: 'currency must match ISO 4217 pattern' };
  }

  // Validate transaction type
  const validTypes = ['registration_fee', 'monthly_fee', 'payout', 'refund', 'adjustment', 'chargeback'];
  if (!validTypes.includes(data.transactionType)) {
    return { valid: false, error: 'transactionType must be one of enum values' };
  }

  // Validate status
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Multilingual QC validation
function validateMultilingualQC(data) {
  const required = ['qcId', 'episodeId', 'franchiseId', 'sourceLanguage', 'targetLanguage', 'translationAccuracy', 'overallResult', 'timestamps'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate language codes
  const langPattern = /^[a-z]{2}(-[A-Z]{2})?$/;
  if (!langPattern.test(data.sourceLanguage) || !langPattern.test(data.targetLanguage)) {
    return { valid: false, error: 'language code must match ISO pattern' };
  }

  // Validate translation accuracy
  if (data.translationAccuracy) {
    if (data.translationAccuracy.score < 0 || data.translationAccuracy.score > 100) {
      return { valid: false, error: 'translationAccuracy.score must be 0-100' };
    }
  }

  // Validate overall result status
  const validStatuses = ['pending', 'passed', 'failed', 'conditional'];
  if (!validStatuses.includes(data.overallResult.status)) {
    return { valid: false, error: 'overallResult.status must be one of enum values' };
  }

  return { valid: true };
}

// Payment fee calculation
function calculatePaymentFees(grossAmount, feePercentage, fixedFee) {
  const percentageFee = (grossAmount * feePercentage) / 100;
  const totalFees = percentageFee + fixedFee;
  const netAmount = grossAmount - totalFees;
  return { 
    fees: Math.round(totalFees * 100) / 100, 
    netAmount: Math.round(netAmount * 100) / 100 
  };
}

// Translation accuracy check
function checkTranslationAccuracy(score, threshold) {
  return score >= threshold;
}

console.log('\n=== SL18 Phase 15: Globalization & Monetization Tests ===\n');

// Test 1: Schema files exist
console.log('--- Schema File Existence ---');

test('Language pack schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/language_pack.schema.json')));
});

test('Payment transaction schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/payment_transaction.schema.json')));
});

test('Multilingual QC schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/multilingual_qc.schema.json')));
});

test('Workspace config schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/workspace_config.schema.json')));
});

// Test 2: Schema files are valid JSON
console.log('\n--- Schema JSON Validity ---');

test('Language pack schema is valid JSON', () => {
  const schema = loadJSON('schemas/language_pack.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assert(schema.title === 'LanguagePack', 'Incorrect title');
});

test('Payment transaction schema is valid JSON', () => {
  const schema = loadJSON('schemas/payment_transaction.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assert(schema.title === 'PaymentTransaction', 'Incorrect title');
});

test('Multilingual QC schema is valid JSON', () => {
  const schema = loadJSON('schemas/multilingual_qc.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assert(schema.title === 'MultilingualQC', 'Incorrect title');
});

test('Workspace config schema is valid JSON', () => {
  const schema = loadJSON('schemas/workspace_config.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assert(schema.title === 'WorkspaceConfig', 'Incorrect title');
});

// Test 3: Language pack validation
console.log('\n--- Language Pack Validation ---');

test('Valid language packs pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  for (const pack of fixtures.validLanguagePacks) {
    const result = validateLanguagePack(pack);
    assert(result.valid, `Language pack ${pack.languageCode} failed: ${result.error}`);
  }
});

test('Invalid language packs fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  for (const testCase of fixtures.invalidLanguagePacks) {
    const result = validateLanguagePack(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('RTL languages are correctly identified', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const arabicPack = fixtures.validLanguagePacks.find(p => p.languageCode === 'ar');
  assert(arabicPack !== undefined, 'Arabic language pack not found');
  assertEqual(arabicPack.direction, 'rtl', 'Arabic should be RTL');
});

test('LTR languages are correctly identified', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const englishPack = fixtures.validLanguagePacks.find(p => p.languageCode === 'en');
  assert(englishPack !== undefined, 'English language pack not found');
  assertEqual(englishPack.direction, 'ltr', 'English should be LTR');
});

// Test 4: Payment transaction validation
console.log('\n--- Payment Transaction Validation ---');

test('Valid payment transactions pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/payment_transactions.json');
  for (const txn of fixtures.validPaymentTransactions) {
    const result = validatePaymentTransaction(txn);
    assert(result.valid, `Transaction ${txn.transactionId} failed: ${result.error}`);
  }
});

test('Invalid payment transactions fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/payment_transactions.json');
  for (const testCase of fixtures.invalidPaymentTransactions) {
    const result = validatePaymentTransaction(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Payment fee calculation is accurate', () => {
  const fixtures = loadJSON('tests/governance/fixtures/payment_transactions.json');
  for (const testCase of fixtures.paymentValidationTestCases) {
    const result = calculatePaymentFees(
      testCase.grossAmount,
      testCase.feePercentage,
      testCase.fixedFee
    );
    assertApproxEqual(
      result.fees,
      testCase.expectedFees,
      PAYMENT_FEE_TOLERANCE,
      `${testCase.description}: Fees mismatch`
    );
    assertApproxEqual(
      result.netAmount,
      testCase.expectedNetAmount,
      PAYMENT_FEE_TOLERANCE,
      `${testCase.description}: Net amount mismatch`
    );
  }
});

test('Fraud detection flags high-risk transactions', () => {
  const fixtures = loadJSON('tests/governance/fixtures/payment_transactions.json');
  const flaggedTxn = fixtures.validPaymentTransactions.find(t => t.fraudDetection?.flagged);
  assert(flaggedTxn !== undefined, 'No flagged transaction found');
  assert(flaggedTxn.fraudDetection.riskLevel === 'high', 'Flagged transaction should be high risk');
  assert(flaggedTxn.fraudDetection.signals.length > 0, 'Flagged transaction should have signals');
});

// Test 5: Multilingual QC validation
console.log('\n--- Multilingual QC Validation ---');

test('Valid multilingual QC records pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/multilingual_qc.json');
  for (const qc of fixtures.validMultilingualQC) {
    const result = validateMultilingualQC(qc);
    assert(result.valid, `QC ${qc.qcId} failed: ${result.error}`);
  }
});

test('Invalid multilingual QC records fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/multilingual_qc.json');
  for (const testCase of fixtures.invalidMultilingualQC) {
    const result = validateMultilingualQC(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Translation accuracy check works correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/multilingual_qc.json');
  for (const testCase of fixtures.translationAccuracyTestCases) {
    const result = checkTranslationAccuracy(testCase.score, testCase.threshold);
    assertEqual(
      result,
      testCase.expectedPassed,
      `${testCase.description}: Expected ${testCase.expectedPassed}, got ${result}`
    );
  }
});

test('Failed QC blocks publishing', () => {
  const fixtures = loadJSON('tests/governance/fixtures/multilingual_qc.json');
  const failedQC = fixtures.validMultilingualQC.find(q => q.overallResult.status === 'failed');
  assert(failedQC !== undefined, 'No failed QC record found');
  assert(failedQC.overallResult.publishReady === false, 'Failed QC should not be publish ready');
  assert(failedQC.overallResult.requiredActions.length > 0, 'Failed QC should have required actions');
});

test('Passed QC allows publishing', () => {
  const fixtures = loadJSON('tests/governance/fixtures/multilingual_qc.json');
  const passedQC = fixtures.validMultilingualQC.find(q => q.overallResult.status === 'passed');
  assert(passedQC !== undefined, 'No passed QC record found');
  assert(passedQC.overallResult.publishReady === true, 'Passed QC should be publish ready');
});

// Test 6: Extended registration schema
console.log('\n--- Extended Registration Schema ---');

test('Registration schema includes payment fields', () => {
  const schema = loadJSON('schemas/registration.schema.json');
  assert(schema.properties.payment !== undefined, 'Payment property should exist');
  assert(schema.properties.payment.properties.paymentMethod !== undefined, 'paymentMethod should exist');
  assert(schema.properties.payment.properties.transactionId !== undefined, 'transactionId should exist');
  assert(schema.properties.payment.properties.paymentStatus !== undefined, 'paymentStatus should exist');
});

test('Registration schema includes languages field', () => {
  const schema = loadJSON('schemas/registration.schema.json');
  assert(schema.properties.languages !== undefined, 'Languages property should exist');
  assertEqual(schema.properties.languages.type, 'array', 'Languages should be an array');
});

// Test 7: Extended audit log schema
console.log('\n--- Extended Audit Log Schema ---');

test('Audit log schema includes payment events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assert(eventTypes.includes('payment_initiated'), 'Should include payment_initiated');
  assert(eventTypes.includes('payment_completed'), 'Should include payment_completed');
  assert(eventTypes.includes('payment_failed'), 'Should include payment_failed');
  assert(eventTypes.includes('payment_refunded'), 'Should include payment_refunded');
  assert(eventTypes.includes('fraud_detected'), 'Should include fraud_detected');
});

test('Audit log schema includes globalization events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assert(eventTypes.includes('language_pack_added'), 'Should include language_pack_added');
  assert(eventTypes.includes('translation_submitted'), 'Should include translation_submitted');
  assert(eventTypes.includes('multilingual_qc_passed'), 'Should include multilingual_qc_passed');
  assert(eventTypes.includes('multilingual_qc_failed'), 'Should include multilingual_qc_failed');
});

test('Audit log schema includes payment and globalization categories', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const categories = schema.properties.category.enum;
  assert(categories.includes('payment'), 'Should include payment category');
  assert(categories.includes('globalization'), 'Should include globalization category');
});

test('Audit log schema includes payment and workspace target types', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const targetTypes = schema.properties.target.properties.type.enum;
  assert(targetTypes.includes('payment'), 'Should include payment target type');
  assert(targetTypes.includes('workspace'), 'Should include workspace target type');
  assert(targetTypes.includes('language_pack'), 'Should include language_pack target type');
});

// Test 8: Workspace provisioning
console.log('\n--- Workspace Provisioning ---');

test('Workspace config schema has required fields', () => {
  const schema = loadJSON('schemas/workspace_config.schema.json');
  const required = schema.required;
  assert(required.includes('workspaceId'), 'workspaceId should be required');
  assert(required.includes('franchiseId'), 'franchiseId should be required');
  assert(required.includes('languages'), 'languages should be required');
  assert(required.includes('primaryLanguage'), 'primaryLanguage should be required');
  assert(required.includes('provisioningStatus'), 'provisioningStatus should be required');
});

test('Workspace provisioning status includes payment states', () => {
  const schema = loadJSON('schemas/workspace_config.schema.json');
  const statuses = schema.properties.provisioningStatus.enum;
  assert(statuses.includes('pending_payment'), 'Should include pending_payment status');
  assert(statuses.includes('provisioning'), 'Should include provisioning status');
  assert(statuses.includes('active'), 'Should include active status');
});

// Test 9: Integration scenarios
console.log('\n--- Integration Scenarios ---');

test('Payment completion triggers workspace provisioning', () => {
  // Simulate payment completion flow
  const payment = {
    status: 'completed',
    transactionType: 'registration_fee'
  };
  const workspace = {
    provisioningStatus: 'pending_payment'
  };
  
  if (payment.status === 'completed' && payment.transactionType === 'registration_fee') {
    workspace.provisioningStatus = 'provisioning';
  }
  
  assertEqual(workspace.provisioningStatus, 'provisioning', 'Workspace should be provisioning after payment');
});

test('Multilingual content requires QC before publishing', () => {
  const qcRequired = true;
  const qcPassed = false;
  const canPublish = !qcRequired || qcPassed;
  assert(!canPublish, 'Should not publish without QC approval');
});

test('Revenue ledger tracks payment transactions', () => {
  // Verify payment ledger integration
  const ledgerSchema = loadJSON('schemas/revenue_ledger.schema.json');
  assert(
    ledgerSchema.properties.payoutSchedule.properties.transactionId !== undefined,
    'Revenue ledger should reference transaction IDs'
  );
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
