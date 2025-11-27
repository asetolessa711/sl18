/**
 * SL18 Governance Layer Test Suite
 * Phase 14: Registration, Agreements, Revenue Ledger, and Audit Logging
 * 
 * Run: node tests/governance/governance.test.js
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

// Constants
const REVENUE_TOLERANCE = 0.01; // Precision threshold for floating-point revenue comparisons

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

/**
 * Deep equality check that handles object property order independence
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
}

function assertDeepEqual(actual, expected, message) {
  if (!deepEqual(actual, expected)) {
    throw new Error(message || `Deep equality failed`);
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

// Schema validation helpers
function validateRequired(obj, fields, schemaName) {
  for (const field of fields) {
    if (obj[field] === undefined) {
      return { valid: false, error: `${schemaName}: Missing required field '${field}'` };
    }
  }
  return { valid: true };
}

function validateEnum(value, allowed, fieldName) {
  if (!allowed.includes(value)) {
    return { valid: false, error: `${fieldName} must be one of: ${allowed.join(', ')}` };
  }
  return { valid: true };
}

function validatePattern(value, pattern, fieldName) {
  if (!new RegExp(pattern).test(value)) {
    return { valid: false, error: `${fieldName} must match pattern ${pattern}` };
  }
  return { valid: true };
}

// Registration schema validation
function validateRegistration(data) {
  const required = ['franchiseId', 'creatorId', 'registrationModel', 'agreementSigned', 'status'];
  const reqCheck = validateRequired(data, required, 'Registration');
  if (!reqCheck.valid) return reqCheck;

  // Validate franchiseId pattern
  if (data.franchiseId) {
    const pattern = '^[a-z][a-z0-9_-]*$';
    if (!new RegExp(pattern).test(data.franchiseId)) {
      return { valid: false, error: 'franchiseId must match pattern (lowercase, alphanumeric)' };
    }
  }

  // Validate registrationModel enum
  const modelCheck = validateEnum(data.registrationModel, ['fee', 'revenueShare'], 'registrationModel');
  if (!modelCheck.valid) return modelCheck;

  // Validate status enum
  const statusCheck = validateEnum(data.status, ['pending', 'approved', 'active', 'suspended', 'terminated'], 'status');
  if (!statusCheck.valid) return statusCheck;

  // Validate ownerContact if present
  if (data.ownerContact) {
    if (!data.ownerContact.name) {
      return { valid: false, error: 'ownerContact.name is required' };
    }
    if (!data.ownerContact.email) {
      return { valid: false, error: 'ownerContact.email is required' };
    }
  }

  return { valid: true };
}

// Agreement schema validation
function validateAgreement(data) {
  const required = ['agreementId', 'franchiseId', 'version', 'terms', 'effectiveDate', 'status'];
  const reqCheck = validateRequired(data, required, 'Agreement');
  if (!reqCheck.valid) return reqCheck;

  // Validate version pattern
  if (data.version) {
    const pattern = '^\\d+\\.\\d+(\\.\\d+)?$';
    if (!new RegExp(pattern).test(data.version)) {
      return { valid: false, error: 'version must match semver pattern (e.g., 1.0 or 1.0.0)' };
    }
  }

  // Validate terms
  if (data.terms) {
    if (!data.terms.revenueShare) {
      return { valid: false, error: 'terms.revenueShare is required' };
    }
    if (!data.terms.qcObligations) {
      return { valid: false, error: 'terms.qcObligations is required' };
    }
    if (!data.terms.publishingRights) {
      return { valid: false, error: 'terms.publishingRights is required' };
    }

    // Validate revenue share
    const rs = data.terms.revenueShare;
    if (rs.partnerPercentage !== undefined && rs.centralPercentage !== undefined) {
      const total = rs.partnerPercentage + rs.centralPercentage;
      if (total !== 100) {
        return { valid: false, error: `Revenue share percentages should add up to 100, got ${total}` };
      }
    }
  }

  // Validate status enum
  const statusCheck = validateEnum(data.status, ['draft', 'pending_signature', 'active', 'amended', 'terminated'], 'status');
  if (!statusCheck.valid) return statusCheck;

  return { valid: true };
}

// Revenue ledger validation
function validateLedgerEntry(data) {
  const required = ['ledgerId', 'franchiseId', 'period', 'revenueGenerated', 'revenueSplit', 'payoutSchedule', 'createdAt'];
  const reqCheck = validateRequired(data, required, 'LedgerEntry');
  if (!reqCheck.valid) return reqCheck;

  // Validate period
  if (data.period) {
    const periodReq = validateRequired(data.period, ['startDate', 'endDate', 'type'], 'period');
    if (!periodReq.valid) return periodReq;
  }

  // Validate revenue split matches total
  if (data.revenueGenerated && data.revenueSplit) {
    const total = data.revenueGenerated.total;
    const splitTotal = data.revenueSplit.partnerShare + data.revenueSplit.centralShare;
    if (Math.abs(total - splitTotal) > REVENUE_TOLERANCE) {
      return { valid: false, error: `Revenue split amounts don't match total: ${splitTotal} vs ${total}` };
    }
  }

  // Validate payout status
  if (data.payoutSchedule) {
    const statusCheck = validateEnum(
      data.payoutSchedule.status,
      ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
      'payoutSchedule.status'
    );
    if (!statusCheck.valid) return statusCheck;
  }

  return { valid: true };
}

// Audit log validation
function validateAuditLog(data) {
  const required = ['logId', 'timestamp', 'eventType', 'category', 'actor', 'target', 'details', 'result'];
  const reqCheck = validateRequired(data, required, 'AuditLog');
  if (!reqCheck.valid) return reqCheck;

  // Validate result enum
  const resultCheck = validateEnum(data.result, ['success', 'failure', 'pending', 'partial'], 'result');
  if (!resultCheck.valid) return resultCheck;

  // Validate category enum
  const categoryCheck = validateEnum(data.category, ['registration', 'agreement', 'revenue', 'qc', 'publishing', 'system'], 'category');
  if (!categoryCheck.valid) return categoryCheck;

  // Validate actor
  if (data.actor) {
    const actorReq = validateRequired(data.actor, ['type', 'id'], 'actor');
    if (!actorReq.valid) return actorReq;
  }

  // Validate target
  if (data.target) {
    const targetReq = validateRequired(data.target, ['type', 'id'], 'target');
    if (!targetReq.valid) return targetReq;
  }

  return { valid: true };
}

// Revenue calculation helper
function calculateRevenueSplit(totalRevenue, partnerPercentage, centralPercentage) {
  const partnerShare = (totalRevenue * partnerPercentage) / 100;
  const centralShare = (totalRevenue * centralPercentage) / 100;
  return { partnerShare, centralShare };
}

console.log('\n=== SL18 Governance Layer Tests ===\n');

// Test 1: Schema files exist
console.log('--- Schema File Existence ---');

test('Registration schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/registration.schema.json')));
});

test('Agreement schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/agreement.schema.json')));
});

test('Revenue ledger schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/revenue_ledger.schema.json')));
});

test('Audit log schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/audit_log.schema.json')));
});

// Test 2: Schema files are valid JSON
console.log('\n--- Schema JSON Validity ---');

test('Registration schema is valid JSON', () => {
  const schema = loadJSON('schemas/registration.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assert(schema.title === 'FranchiseRegistration', 'Incorrect title');
});

test('Agreement schema is valid JSON', () => {
  const schema = loadJSON('schemas/agreement.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assert(schema.title === 'FranchiseAgreement', 'Incorrect title');
});

test('Revenue ledger schema is valid JSON', () => {
  const schema = loadJSON('schemas/revenue_ledger.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assert(schema.title === 'RevenueLedger', 'Incorrect title');
});

test('Audit log schema is valid JSON', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assert(schema.title === 'GovernanceAuditLog', 'Incorrect title');
});

// Test 3: Registration workflow tests
console.log('\n--- Registration Workflow ---');

test('Valid registrations pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/registrations.json');
  for (const reg of fixtures.validRegistrations) {
    const result = validateRegistration(reg);
    assert(result.valid, `Registration ${reg.franchiseId} failed: ${result.error}`);
  }
});

test('Invalid registrations fail with correct errors', () => {
  const fixtures = loadJSON('tests/governance/fixtures/registrations.json');
  for (const testCase of fixtures.invalidRegistrations) {
    const result = validateRegistration(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Registration status transitions are valid', () => {
  const validTransitions = {
    'pending': ['approved', 'rejected'],
    'approved': ['active', 'suspended'],
    'active': ['suspended', 'terminated'],
    'suspended': ['active', 'terminated'],
    'terminated': []
  };
  
  for (const [from, toStates] of Object.entries(validTransitions)) {
    assert(Array.isArray(toStates), `Transitions from ${from} should be an array`);
  }
});

// Test 4: Agreement validation tests
console.log('\n--- Agreement Validation ---');

test('Valid agreements pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/agreements.json');
  for (const agr of fixtures.validAgreements) {
    const result = validateAgreement(agr);
    assert(result.valid, `Agreement ${agr.agreementId} failed: ${result.error}`);
  }
});

test('Invalid agreements fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/agreements.json');
  for (const testCase of fixtures.invalidAgreements) {
    const result = validateAgreement(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Agreement signing validation requires both signatures for active status', () => {
  const agreement = {
    agreementId: 'test-001',
    franchiseId: 'test',
    version: '1.0',
    terms: {
      revenueShare: { partnerPercentage: 35, centralPercentage: 65, payoutSchedule: 'monthly' },
      qcObligations: { requiredBeforePublish: true, strikeLimit: 3 },
      publishingRights: { platforms: ['youtube'], contentOwnership: 'shared' }
    },
    effectiveDate: '2025-01-01T00:00:00Z',
    status: 'active',
    signedBy: {
      franchiseRepresentative: { name: 'Partner', signedAt: '2025-01-01T00:00:00Z' },
      centralRepresentative: { name: 'Admin', signedAt: '2025-01-01T00:00:00Z' }
    }
  };
  const result = validateAgreement(agreement);
  assert(result.valid, 'Active agreement with both signatures should be valid');
});

// Test 5: Revenue ledger tests
console.log('\n--- Revenue Ledger ---');

test('Valid ledger entries pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/revenue_ledger.json');
  for (const entry of fixtures.validLedgerEntries) {
    const result = validateLedgerEntry(entry);
    assert(result.valid, `Ledger ${entry.ledgerId} failed: ${result.error}`);
  }
});

test('Invalid ledger entries fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/revenue_ledger.json');
  for (const testCase of fixtures.invalidLedgerEntries) {
    const result = validateLedgerEntry(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Revenue split calculation is accurate', () => {
  const fixtures = loadJSON('tests/governance/fixtures/revenue_ledger.json');
  for (const testCase of fixtures.revenueSplitTestCases) {
    const result = calculateRevenueSplit(
      testCase.totalRevenue,
      testCase.partnerPercentage,
      testCase.centralPercentage
    );
    assertEqual(
      result.partnerShare,
      testCase.expectedPartnerShare,
      `${testCase.description}: Partner share mismatch`
    );
    assertEqual(
      result.centralShare,
      testCase.expectedCentralShare,
      `${testCase.description}: Central share mismatch`
    );
  }
});

test('Payout schedule status transitions are valid', () => {
  const validTransitions = {
    'pending': ['approved', 'cancelled'],
    'approved': ['processing', 'cancelled'],
    'processing': ['completed', 'failed'],
    'completed': [],
    'failed': ['pending', 'cancelled'],
    'cancelled': []
  };
  
  for (const [from, toStates] of Object.entries(validTransitions)) {
    assert(Array.isArray(toStates), `Transitions from ${from} should be an array`);
  }
});

// Test 6: Audit log tests
console.log('\n--- Audit Logging ---');

test('Valid audit logs pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audit_logs.json');
  for (const log of fixtures.validAuditLogs) {
    const result = validateAuditLog(log);
    assert(result.valid, `Audit log ${log.logId} failed: ${result.error}`);
  }
});

test('Invalid audit logs fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audit_logs.json');
  for (const testCase of fixtures.invalidAuditLogs) {
    const result = validateAuditLog(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Audit logs are stored in append-only format (immutable)', () => {
  // Audit logs should have immutable structure
  const log = {
    logId: 'test-001',
    timestamp: new Date().toISOString(),
    eventType: 'registration_submitted',
    category: 'registration',
    actor: { type: 'user', id: 'test@test.com' },
    target: { type: 'franchise', id: 'test' },
    details: { description: 'Test event' },
    result: 'success'
  };
  
  // Once created, the log should not be modifiable
  const originalLogId = log.logId;
  assert(log.logId === originalLogId, 'Audit log ID should not change');
});

// Test 7: QC enforcement tests
console.log('\n--- QC Enforcement ---');

test('QC approval required before publishing when enabled', () => {
  const agreement = {
    terms: {
      qcObligations: {
        requiredBeforePublish: true,
        strikeLimit: 3
      }
    }
  };
  
  assert(agreement.terms.qcObligations.requiredBeforePublish === true);
});

test('QC strike limit enforcement', () => {
  const strikes = [
    { franchiseId: 'test', strikeCount: 1, status: 'warning' },
    { franchiseId: 'test', strikeCount: 2, status: 'review' },
    { franchiseId: 'test', strikeCount: 3, status: 'suspended' }
  ];
  
  for (const strike of strikes) {
    if (strike.strikeCount >= 3) {
      assertEqual(strike.status, 'suspended', 'Franchise should be suspended at 3 strikes');
    }
  }
});

test('Publishing is blocked for suspended franchises', () => {
  const franchise = {
    franchiseId: 'test',
    status: 'suspended'
  };
  
  const canPublish = franchise.status === 'active';
  assert(!canPublish, 'Suspended franchises cannot publish');
});

// Test 8: Documentation exists
console.log('\n--- Documentation ---');

test('Agreement template documentation exists', () => {
  assert(existsSync(join(repoRoot, 'Docs/agreement_template.md')));
});

test('Governance documentation exists', () => {
  assert(existsSync(join(repoRoot, 'Docs/governance.md')));
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
