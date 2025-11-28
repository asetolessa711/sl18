/**
 * SL18 Phase 26: Advanced Security & Threat Detection Tests
 * 
 * Tests for security framework schemas, threat detection, security observability, and response workflows
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
  const path = join(fixturesDir, 'security.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Validation functions
function validateSecurityFramework(framework) {
  const errors = [];
  
  // Required fields
  const required = ['frameworkId', 'version', 'name', 'scope', 'encryptionStandards', 'accessControl', 'status', 'createdAt', 'createdBy'];
  for (const field of required) {
    if (!(field in framework)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Framework ID pattern
  if (framework.frameworkId && !/^secfw-[a-z0-9-]+$/.test(framework.frameworkId)) {
    errors.push('Invalid frameworkId pattern');
  }
  
  // Version pattern
  if (framework.version && !/^\d+\.\d+\.\d+$/.test(framework.version)) {
    errors.push('Invalid version pattern');
  }
  
  // Scope validation
  if (framework.scope) {
    const validLevels = ['global', 'region', 'franchise', 'partner', 'service'];
    if (framework.scope.level && !validLevels.includes(framework.scope.level)) {
      errors.push(`Invalid scope level: ${framework.scope.level}`);
    }
  }
  
  // Status validation
  if (framework.status) {
    const validStatuses = ['active', 'suspended', 'maintenance', 'deprecated'];
    if (!validStatuses.includes(framework.status)) {
      errors.push(`Invalid status: ${framework.status}`);
    }
  }
  
  return errors;
}

function validateThreatDetection(detection) {
  const errors = [];
  
  // Required fields
  const required = ['detectionId', 'version', 'name', 'scope', 'threatCategories', 'detectionRules', 'responseWorkflows', 'status', 'createdAt', 'createdBy'];
  for (const field of required) {
    if (!(field in detection)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Detection ID pattern
  if (detection.detectionId && !/^threat-[a-z0-9-]+$/.test(detection.detectionId)) {
    errors.push('Invalid detectionId pattern');
  }
  
  // Status validation
  if (detection.status) {
    const validStatuses = ['active', 'suspended', 'maintenance', 'deprecated'];
    if (!validStatuses.includes(detection.status)) {
      errors.push(`Invalid status: ${detection.status}`);
    }
  }
  
  return errors;
}

function validateSecurityObservability(observability) {
  const errors = [];
  
  // Required fields
  const required = ['observabilityId', 'version', 'name', 'dashboards', 'incidentTracking', 'forensicLogging', 'status', 'createdAt', 'createdBy'];
  for (const field of required) {
    if (!(field in observability)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Observability ID pattern
  if (observability.observabilityId && !/^secobs-[a-z0-9-]+$/.test(observability.observabilityId)) {
    errors.push('Invalid observabilityId pattern');
  }
  
  // Status validation
  if (observability.status) {
    const validStatuses = ['active', 'suspended', 'maintenance', 'deprecated'];
    if (!validStatuses.includes(observability.status)) {
      errors.push(`Invalid status: ${observability.status}`);
    }
  }
  
  return errors;
}

// Calculation functions
function calculateThreatBlockRate(totalThreats, blockedThreats) {
  if (totalThreats === 0) return 0;
  return Math.round((blockedThreats / totalThreats) * 100 * 100) / 100;
}

function calculateFalsePositiveRate(totalAlerts, falsePositives) {
  if (totalAlerts === 0) return 0;
  return Math.round((falsePositives / totalAlerts) * 100 * 100) / 100;
}

function calculateMTTD(detectionTimes) {
  if (detectionTimes.length === 0) return 0;
  const sum = detectionTimes.reduce((a, b) => a + b, 0);
  return Math.round((sum / detectionTimes.length) * 100) / 100;
}

function calculateSecurityScore(components) {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const component of components) {
    totalScore += component.score * component.weight;
    totalWeight += component.weight;
  }
  
  return Math.round((totalScore / totalWeight) * 100) / 100;
}

// Run tests
console.log('\n=== Phase 26: Advanced Security & Threat Detection Tests ===\n');

// Schema file existence tests
console.log('--- Schema Existence Tests ---');

test('Security framework schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'security_framework.schema.json')));
});

test('Threat detection schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'threat_detection.schema.json')));
});

test('Security observability schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'security_observability.schema.json')));
});

test('Audit log schema file exists', () => {
  assertTrue(existsSync(join(schemasDir, 'audit_log.schema.json')));
});

// Schema structure tests
console.log('\n--- Security Framework Schema Tests ---');

const securityFrameworkSchema = loadSchema('security_framework.schema.json');
const threatDetectionSchema = loadSchema('threat_detection.schema.json');
const securityObservabilitySchema = loadSchema('security_observability.schema.json');
const auditLogSchema = loadSchema('audit_log.schema.json');
const fixtures = loadFixtures();

test('Security framework schema has required properties', () => {
  const required = securityFrameworkSchema.required;
  assertIncludes(required, 'frameworkId');
  assertIncludes(required, 'version');
  assertIncludes(required, 'name');
  assertIncludes(required, 'scope');
  assertIncludes(required, 'encryptionStandards');
  assertIncludes(required, 'accessControl');
  assertIncludes(required, 'status');
});

test('Security framework schema has encryption algorithms', () => {
  const algorithms = securityFrameworkSchema.properties.encryptionStandards.properties.dataAtRest.properties.algorithm.enum;
  assertIncludes(algorithms, 'AES-256-GCM');
  assertIncludes(algorithms, 'AES-256-CBC');
  assertIncludes(algorithms, 'ChaCha20-Poly1305');
});

test('Security framework schema has key management systems', () => {
  const systems = securityFrameworkSchema.properties.encryptionStandards.properties.dataAtRest.properties.keyManagement.enum;
  assertIncludes(systems, 'aws_kms');
  assertIncludes(systems, 'azure_keyvault');
  assertIncludes(systems, 'hashicorp_vault');
  assertIncludes(systems, 'hardware_hsm');
});

test('Security framework schema has TLS protocols', () => {
  const protocols = securityFrameworkSchema.properties.encryptionStandards.properties.dataInTransit.properties.protocol.enum;
  assertIncludes(protocols, 'TLS_1_3');
  assertIncludes(protocols, 'TLS_1_2');
  assertIncludes(protocols, 'mTLS');
});

test('Security framework schema has authentication methods', () => {
  const methods = securityFrameworkSchema.properties.accessControl.properties.authentication.properties.methods.items.enum;
  assertIncludes(methods, 'password');
  assertIncludes(methods, 'mfa_totp');
  assertIncludes(methods, 'mfa_push');
  assertIncludes(methods, 'biometric');
  assertIncludes(methods, 'hardware_key');
  assertIncludes(methods, 'sso_oidc');
});

test('Security framework schema has MFA contextual triggers', () => {
  const triggers = securityFrameworkSchema.properties.accessControl.properties.authentication.properties.mfaContextual.properties.triggers.items.enum;
  assertIncludes(triggers, 'new_device');
  assertIncludes(triggers, 'new_location');
  assertIncludes(triggers, 'high_risk_action');
  assertIncludes(triggers, 'failed_attempts');
});

test('Security framework schema has zero trust principles', () => {
  const principles = securityFrameworkSchema.properties.zeroTrust.properties.principles.items.enum;
  assertIncludes(principles, 'never_trust_always_verify');
  assertIncludes(principles, 'least_privilege');
  assertIncludes(principles, 'assume_breach');
  assertIncludes(principles, 'micro_segmentation');
});

test('Security framework schema has device compliance checks', () => {
  const checks = securityFrameworkSchema.properties.zeroTrust.properties.deviceTrust.properties.complianceChecks.items.enum;
  assertIncludes(checks, 'os_version');
  assertIncludes(checks, 'security_patches');
  assertIncludes(checks, 'antivirus');
  assertIncludes(checks, 'disk_encryption');
});

test('Security framework schema has credential vault providers', () => {
  const providers = securityFrameworkSchema.properties.credentialManagement.properties.vault.properties.provider.enum;
  assertIncludes(providers, 'hashicorp_vault');
  assertIncludes(providers, 'aws_secrets_manager');
  assertIncludes(providers, 'azure_keyvault');
  assertIncludes(providers, 'cyberark');
});

test('Security framework schema has compliance frameworks', () => {
  const frameworks = securityFrameworkSchema.properties.compliance.properties.frameworks.items.enum;
  assertIncludes(frameworks, 'SOC2');
  assertIncludes(frameworks, 'ISO27001');
  assertIncludes(frameworks, 'NIST_CSF');
  assertIncludes(frameworks, 'PCI_DSS');
  assertIncludes(frameworks, 'GDPR');
});

// Threat Detection schema tests
console.log('\n--- Threat Detection Schema Tests ---');

test('Threat detection schema has required properties', () => {
  const required = threatDetectionSchema.required;
  assertIncludes(required, 'detectionId');
  assertIncludes(required, 'version');
  assertIncludes(required, 'name');
  assertIncludes(required, 'scope');
  assertIncludes(required, 'threatCategories');
  assertIncludes(required, 'detectionRules');
  assertIncludes(required, 'responseWorkflows');
  assertIncludes(required, 'status');
});

test('Threat detection schema has threat category types', () => {
  const types = threatDetectionSchema.properties.threatCategories.items.properties.type.enum;
  assertIncludes(types, 'fraud');
  assertIncludes(types, 'account_takeover');
  assertIncludes(types, 'bot_abuse');
  assertIncludes(types, 'api_misuse');
  assertIncludes(types, 'insider_risk');
  assertIncludes(types, 'data_exfiltration');
  assertIncludes(types, 'brute_force');
  assertIncludes(types, 'dos_ddos');
});

test('Threat detection schema has detection rule types', () => {
  const types = threatDetectionSchema.properties.detectionRules.items.properties.type.enum;
  assertIncludes(types, 'threshold');
  assertIncludes(types, 'anomaly');
  assertIncludes(types, 'pattern');
  assertIncludes(types, 'correlation');
  assertIncludes(types, 'ml_model');
  assertIncludes(types, 'signature');
});

test('Threat detection schema has detection rule actions', () => {
  const actions = threatDetectionSchema.properties.detectionRules.items.properties.actions.items.enum;
  assertIncludes(actions, 'alert');
  assertIncludes(actions, 'block');
  assertIncludes(actions, 'throttle');
  assertIncludes(actions, 'quarantine');
  assertIncludes(actions, 'escalate');
  assertIncludes(actions, 'capture_evidence');
  assertIncludes(actions, 'revoke_session');
});

test('Threat detection schema has anomaly detection behavioral metrics', () => {
  const metrics = threatDetectionSchema.properties.anomalyDetection.properties.behavioral.properties.metrics.items.enum;
  assertIncludes(metrics, 'login_frequency');
  assertIncludes(metrics, 'session_duration');
  assertIncludes(metrics, 'action_patterns');
  assertIncludes(metrics, 'api_usage_patterns');
  assertIncludes(metrics, 'data_access_patterns');
});

test('Threat detection schema has ML model types', () => {
  const types = threatDetectionSchema.properties.mlModels.properties.models.items.properties.type.enum;
  assertIncludes(types, 'classification');
  assertIncludes(types, 'anomaly_detection');
  assertIncludes(types, 'neural_network');
  assertIncludes(types, 'ensemble');
});

test('Threat detection schema has ML model purposes', () => {
  const purposes = threatDetectionSchema.properties.mlModels.properties.models.items.properties.purpose.enum;
  assertIncludes(purposes, 'fraud_detection');
  assertIncludes(purposes, 'account_takeover');
  assertIncludes(purposes, 'bot_detection');
  assertIncludes(purposes, 'risk_scoring');
});

test('Threat detection schema has response workflow actions', () => {
  const actions = threatDetectionSchema.properties.responseWorkflows.items.properties.steps.items.properties.action.enum;
  assertIncludes(actions, 'block_request');
  assertIncludes(actions, 'throttle_rate');
  assertIncludes(actions, 'require_mfa');
  assertIncludes(actions, 'revoke_session');
  assertIncludes(actions, 'create_incident');
  assertIncludes(actions, 'capture_evidence');
  assertIncludes(actions, 'notify_security');
});

test('Threat detection schema has alerting channels', () => {
  const channels = threatDetectionSchema.properties.realTimeMonitoring.properties.alerting.properties.channels.items.enum;
  assertIncludes(channels, 'slack');
  assertIncludes(channels, 'pagerduty');
  assertIncludes(channels, 'email');
  assertIncludes(channels, 'webhook');
  assertIncludes(channels, 'sms');
});

// Security Observability schema tests
console.log('\n--- Security Observability Schema Tests ---');

test('Security observability schema has required properties', () => {
  const required = securityObservabilitySchema.required;
  assertIncludes(required, 'observabilityId');
  assertIncludes(required, 'version');
  assertIncludes(required, 'name');
  assertIncludes(required, 'dashboards');
  assertIncludes(required, 'incidentTracking');
  assertIncludes(required, 'forensicLogging');
  assertIncludes(required, 'status');
});

test('Security observability schema has dashboard types', () => {
  const types = securityObservabilitySchema.properties.dashboards.items.properties.type.enum;
  assertIncludes(types, 'security_overview');
  assertIncludes(types, 'threat_landscape');
  assertIncludes(types, 'incident_timeline');
  assertIncludes(types, 'compliance_status');
  assertIncludes(types, 'forensic_analysis');
  assertIncludes(types, 'real_time_threats');
});

test('Security observability schema has widget types', () => {
  const types = securityObservabilitySchema.properties.dashboards.items.properties.widgets.items.properties.type.enum;
  assertIncludes(types, 'metric');
  assertIncludes(types, 'chart');
  assertIncludes(types, 'table');
  assertIncludes(types, 'map');
  assertIncludes(types, 'timeline');
  assertIncludes(types, 'heatmap');
  assertIncludes(types, 'gauge');
});

test('Security observability schema has incident severity levels', () => {
  const levels = securityObservabilitySchema.properties.incidentTracking.properties.severityLevels.items.properties.level.enum;
  assertIncludes(levels, 'critical');
  assertIncludes(levels, 'high');
  assertIncludes(levels, 'medium');
  assertIncludes(levels, 'low');
});

test('Security observability schema has incident statuses', () => {
  const statuses = securityObservabilitySchema.properties.incidentTracking.properties.statuses.items.enum;
  assertIncludes(statuses, 'detected');
  assertIncludes(statuses, 'triaging');
  assertIncludes(statuses, 'investigating');
  assertIncludes(statuses, 'containing');
  assertIncludes(statuses, 'eradicating');
  assertIncludes(statuses, 'recovering');
  assertIncludes(statuses, 'closed');
});

test('Security observability schema has incident types', () => {
  const categories = securityObservabilitySchema.properties.incidentTracking.properties.incidentTypes.items.properties.category.enum;
  assertIncludes(categories, 'security');
  assertIncludes(categories, 'data_breach');
  assertIncludes(categories, 'fraud');
  assertIncludes(categories, 'unauthorized_access');
});

test('Security observability schema has forensic log categories', () => {
  const categories = securityObservabilitySchema.properties.forensicLogging.properties.logTypes.items.properties.category.enum;
  assertIncludes(categories, 'authentication');
  assertIncludes(categories, 'authorization');
  assertIncludes(categories, 'data_access');
  assertIncludes(categories, 'api_calls');
  assertIncludes(categories, 'security_events');
  assertIncludes(categories, 'admin_actions');
});

test('Security observability schema has storage types', () => {
  const types = securityObservabilitySchema.properties.forensicLogging.properties.storage.properties.type.enum;
  assertIncludes(types, 's3');
  assertIncludes(types, 'elasticsearch');
  assertIncludes(types, 'splunk');
  assertIncludes(types, 'datadog');
});

test('Security observability schema has chain of custody hash algorithms', () => {
  const algorithms = securityObservabilitySchema.properties.forensicLogging.properties.chainOfCustody.properties.hashAlgorithm.enum;
  assertIncludes(algorithms, 'SHA-256');
  assertIncludes(algorithms, 'SHA-384');
  assertIncludes(algorithms, 'SHA-512');
});

test('Security observability schema has report types', () => {
  const types = securityObservabilitySchema.properties.reporting.properties.scheduledReports.items.properties.type.enum;
  assertIncludes(types, 'executive_summary');
  assertIncludes(types, 'incident_report');
  assertIncludes(types, 'compliance_report');
  assertIncludes(types, 'vulnerability_report');
  assertIncludes(types, 'forensic_report');
});

test('Security observability schema has SIEM providers', () => {
  const providers = securityObservabilitySchema.properties.integrations.properties.siem.properties.provider.enum;
  assertIncludes(providers, 'splunk');
  assertIncludes(providers, 'elastic');
  assertIncludes(providers, 'datadog');
  assertIncludes(providers, 'azure_sentinel');
});

test('Security observability schema has threat intelligence feed types', () => {
  const types = securityObservabilitySchema.properties.integrations.properties.threatIntelligence.properties.feeds.items.properties.type.enum;
  assertIncludes(types, 'ip_reputation');
  assertIncludes(types, 'domain_reputation');
  assertIncludes(types, 'file_hash');
  assertIncludes(types, 'malware');
});

// Audit log tests
console.log('\n--- Audit Log Schema Tests ---');

test('Audit log schema has security event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'security_framework_created');
  assertIncludes(eventTypes, 'threat_detected');
  assertIncludes(eventTypes, 'threat_blocked');
  assertIncludes(eventTypes, 'incident_created');
});

test('Audit log schema has security categories', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'security');
  assertIncludes(categories, 'threat_detection');
  assertIncludes(categories, 'security_observability');
});

// Fixture validation tests
console.log('\n--- Security Framework Validation Tests ---');

test('Valid security framework passes validation', () => {
  const validFramework = fixtures.securityFrameworks.valid[0];
  const errors = validateSecurityFramework(validFramework);
  assertEqual(errors.length, 0, 'Expected no validation errors');
});

test('Security framework has global scope', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  assertEqual(framework.scope.level, 'global');
  assertTrue(framework.scope.services.length >= 4);
  assertTrue(framework.scope.regions.length >= 5);
});

test('Security framework has encryption standards', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  assertEqual(framework.encryptionStandards.dataAtRest.algorithm, 'AES-256-GCM');
  assertEqual(framework.encryptionStandards.dataAtRest.keyLength, 256);
  assertEqual(framework.encryptionStandards.dataInTransit.protocol, 'TLS_1_3');
  assertTrue(framework.encryptionStandards.fieldLevelEncryption.enabled);
});

test('Security framework has MFA configured', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  assertTrue(framework.accessControl.authentication.mfaRequired);
  assertTrue(framework.accessControl.authentication.mfaContextual.enabled);
  assertTrue(framework.accessControl.authentication.mfaContextual.triggers.length >= 3);
});

test('Security framework has password policy', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  const policy = framework.accessControl.authentication.passwordPolicy;
  assertTrue(policy.minLength >= 12);
  assertTrue(policy.requireUppercase);
  assertTrue(policy.requireLowercase);
  assertTrue(policy.requireNumbers);
  assertTrue(policy.requireSymbols);
  assertTrue(policy.expirationDays > 0);
});

test('Security framework has zero trust enabled', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  assertTrue(framework.zeroTrust.enabled);
  assertTrue(framework.zeroTrust.principles.length >= 5);
  assertTrue(framework.zeroTrust.networkSegmentation.enabled);
  assertTrue(framework.zeroTrust.deviceTrust.enabled);
  assertTrue(framework.zeroTrust.identityVerification.continuousAuth);
});

test('Security framework has credential management', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  assertTrue(framework.credentialManagement.vault.enabled);
  assertTrue(framework.credentialManagement.vault.autoRotation);
  assertTrue(framework.credentialManagement.apiKeys.rateLimiting.enabled);
});

test('Security framework has compliance certifications', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  assertTrue(framework.compliance.frameworks.length >= 3);
  assertTrue(framework.compliance.certifications.length >= 2);
  const soc2 = framework.compliance.certifications.find(c => c.name === 'SOC 2 Type II');
  assertTrue(soc2 !== undefined);
  assertEqual(soc2.status, 'active');
});

test('Security framework has metrics', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  assertTrue(framework.metrics.securityScore >= 90);
  assertTrue(framework.metrics.complianceScore >= 95);
  assertTrue(framework.metrics.meanTimeToDetect <= 30);
  assertTrue(framework.metrics.meanTimeToRespond <= 60);
});

// Threat Detection validation tests
console.log('\n--- Threat Detection Validation Tests ---');

test('Valid threat detection passes validation', () => {
  const validDetection = fixtures.threatDetection.valid[0];
  const errors = validateThreatDetection(validDetection);
  assertEqual(errors.length, 0, 'Expected no validation errors');
});

test('Threat detection has threat categories', () => {
  const detection = fixtures.threatDetection.valid[0];
  assertTrue(detection.threatCategories.length >= 5);
  const fraud = detection.threatCategories.find(c => c.type === 'fraud');
  assertTrue(fraud !== undefined);
  assertEqual(fraud.severity, 'critical');
  assertTrue(fraud.indicators.length >= 2);
});

test('Threat detection has detection rules', () => {
  const detection = fixtures.threatDetection.valid[0];
  assertTrue(detection.detectionRules.length >= 4);
  const velocityRule = detection.detectionRules.find(r => r.ruleId === 'rule-velocity-spike');
  assertTrue(velocityRule !== undefined);
  assertEqual(velocityRule.type, 'threshold');
  assertTrue(velocityRule.actions.includes('alert'));
});

test('Threat detection has anomaly detection enabled', () => {
  const detection = fixtures.threatDetection.valid[0];
  assertTrue(detection.anomalyDetection.enabled);
  assertTrue(detection.anomalyDetection.behavioral.enabled);
  assertTrue(detection.anomalyDetection.transactional.enabled);
  assertTrue(detection.anomalyDetection.network.enabled);
});

test('Threat detection has ML models', () => {
  const detection = fixtures.threatDetection.valid[0];
  assertTrue(detection.mlModels.enabled);
  assertTrue(detection.mlModels.models.length >= 3);
  const fraudModel = detection.mlModels.models.find(m => m.purpose === 'fraud_detection');
  assertTrue(fraudModel !== undefined);
  assertTrue(fraudModel.accuracy >= 0.95);
});

test('Threat detection has risk scoring', () => {
  const detection = fixtures.threatDetection.valid[0];
  assertTrue(detection.mlModels.riskScoring.enabled);
  assertTrue(detection.mlModels.riskScoring.factors.length >= 3);
  assertTrue(detection.mlModels.riskScoring.overallThresholds.block >= 80);
});

test('Threat detection has response workflows', () => {
  const detection = fixtures.threatDetection.valid[0];
  assertTrue(detection.responseWorkflows.length >= 2);
  const criticalWorkflow = detection.responseWorkflows.find(w => w.workflowId === 'wf-critical-threat');
  assertTrue(criticalWorkflow !== undefined);
  assertTrue(criticalWorkflow.steps.length >= 4);
  assertTrue(criticalWorkflow.escalation.enabled);
});

test('Threat detection has real-time monitoring', () => {
  const detection = fixtures.threatDetection.valid[0];
  assertTrue(detection.realTimeMonitoring.enabled);
  assertTrue(detection.realTimeMonitoring.streamProcessing.enabled);
  assertTrue(detection.realTimeMonitoring.alerting.enabled);
  assertTrue(detection.realTimeMonitoring.alerting.channels.length >= 3);
});

test('Threat detection has metrics', () => {
  const detection = fixtures.threatDetection.valid[0];
  assertTrue(detection.metrics.threatsDetected > 0);
  assertTrue(detection.metrics.threatsBlocked > 0);
  assertTrue(detection.metrics.truePositiveRate >= 95);
  assertTrue(detection.metrics.avgDetectionTime <= 5);
});

// Security Observability validation tests
console.log('\n--- Security Observability Validation Tests ---');

test('Valid security observability passes validation', () => {
  const validObs = fixtures.securityObservability.valid[0];
  const errors = validateSecurityObservability(validObs);
  assertEqual(errors.length, 0, 'Expected no validation errors');
});

test('Security observability has dashboards', () => {
  const obs = fixtures.securityObservability.valid[0];
  assertTrue(obs.dashboards.length >= 3);
  const overview = obs.dashboards.find(d => d.type === 'security_overview');
  assertTrue(overview !== undefined);
  assertTrue(overview.widgets.length >= 3);
});

test('Security observability has incident tracking', () => {
  const obs = fixtures.securityObservability.valid[0];
  assertTrue(obs.incidentTracking.enabled);
  assertTrue(obs.incidentTracking.severityLevels.length >= 4);
  const critical = obs.incidentTracking.severityLevels.find(l => l.level === 'critical');
  assertTrue(critical !== undefined);
  assertTrue(critical.responseTimeSla <= 5);
});

test('Security observability has forensic logging', () => {
  const obs = fixtures.securityObservability.valid[0];
  assertTrue(obs.forensicLogging.enabled);
  assertTrue(obs.forensicLogging.immutableLogs);
  assertTrue(obs.forensicLogging.storage.encryption);
  assertTrue(obs.forensicLogging.logTypes.length >= 4);
});

test('Security observability has chain of custody', () => {
  const obs = fixtures.securityObservability.valid[0];
  assertTrue(obs.forensicLogging.chainOfCustody.enabled);
  assertEqual(obs.forensicLogging.chainOfCustody.hashAlgorithm, 'SHA-256');
  assertTrue(obs.forensicLogging.chainOfCustody.timestamping);
  assertTrue(obs.forensicLogging.chainOfCustody.digitalSignature);
});

test('Security observability has KPIs', () => {
  const obs = fixtures.securityObservability.valid[0];
  assertTrue(obs.securityMetrics.kpis.length >= 4);
  const mttd = obs.securityMetrics.kpis.find(k => k.kpiId === 'kpi-mttd');
  assertTrue(mttd !== undefined);
  assertEqual(mttd.trending, 'lower_better');
});

test('Security observability has current metrics', () => {
  const obs = fixtures.securityObservability.valid[0];
  assertTrue(obs.securityMetrics.currentValues.securityScore >= 90);
  assertTrue(obs.securityMetrics.currentValues.mttd <= 15);
  assertTrue(obs.securityMetrics.currentValues.patchCompliance >= 95);
  assertTrue(obs.securityMetrics.currentValues.mfaAdoption >= 95);
});

test('Security observability has scheduled reports', () => {
  const obs = fixtures.securityObservability.valid[0];
  assertTrue(obs.reporting.scheduledReports.length >= 3);
  const weekly = obs.reporting.scheduledReports.find(r => r.schedule.frequency === 'weekly');
  assertTrue(weekly !== undefined);
  assertTrue(weekly.enabled);
});

test('Security observability has integrations', () => {
  const obs = fixtures.securityObservability.valid[0];
  assertTrue(obs.integrations.siem.enabled);
  assertTrue(obs.integrations.ticketing.enabled);
  assertTrue(obs.integrations.threatIntelligence.enabled);
  assertTrue(obs.integrations.threatIntelligence.feeds.length >= 2);
});

// Calculation tests
console.log('\n--- Calculation Tests ---');

test('Threat block rate calculation is correct', () => {
  const calc = fixtures.calculations.threatDetectionRate.example;
  const rate = calculateThreatBlockRate(calc.totalThreats, calc.blockedThreats);
  assertApproximatelyEqual(rate, calc.expectedBlockRate, 'Block rate mismatch');
});

test('False positive rate calculation is correct', () => {
  const calc = fixtures.calculations.falsePositiveRate.example;
  const rate = calculateFalsePositiveRate(calc.totalAlerts, calc.falsePositives);
  assertApproximatelyEqual(rate, calc.expectedFalsePositiveRate, 'False positive rate mismatch');
});

test('MTTD calculation is correct', () => {
  const calc = fixtures.calculations.meanTimeToDetect.example;
  const mttd = calculateMTTD(calc.detectionTimes);
  assertApproximatelyEqual(mttd, calc.expectedMTTD, 'MTTD mismatch');
});

test('Security score calculation is correct', () => {
  const calc = fixtures.calculations.securityScore.example;
  const score = calculateSecurityScore(calc.components);
  assertApproximatelyEqual(score, calc.expectedScore, 'Security score mismatch');
});

test('Zero threats returns zero block rate', () => {
  assertEqual(calculateThreatBlockRate(0, 0), 0);
});

test('Zero alerts returns zero false positive rate', () => {
  assertEqual(calculateFalsePositiveRate(0, 0), 0);
});

test('Empty detection times returns zero MTTD', () => {
  assertEqual(calculateMTTD([]), 0);
});

// Audit log validation tests
console.log('\n--- Audit Log Tests ---');

test('Security framework audit logs are valid', () => {
  const logs = fixtures.auditLogs.securityFramework;
  assertTrue(logs.length >= 3);
  
  const createdLog = logs.find(l => l.eventType === 'security_framework_created');
  assertTrue(createdLog !== undefined);
  assertEqual(createdLog.category, 'security');
});

test('Threat detection audit logs are valid', () => {
  const logs = fixtures.auditLogs.threatDetection;
  assertTrue(logs.length >= 3);
  
  const detectedLog = logs.find(l => l.eventType === 'threat_detected');
  assertTrue(detectedLog !== undefined);
  assertEqual(detectedLog.category, 'threat_detection');
  
  const blockedLog = logs.find(l => l.eventType === 'threat_blocked');
  assertTrue(blockedLog !== undefined);
});

test('Security observability audit logs are valid', () => {
  const logs = fixtures.auditLogs.securityObservability;
  assertTrue(logs.length >= 2);
  
  const dashboardLog = logs.find(l => l.eventType === 'security_dashboard_viewed');
  assertTrue(dashboardLog !== undefined);
  assertEqual(dashboardLog.category, 'security_observability');
});

// Invalid data tests
console.log('\n--- Invalid Data Tests ---');

test('Invalid security framework fails validation', () => {
  const invalidFramework = fixtures.securityFrameworks.invalid[0];
  const errors = validateSecurityFramework(invalidFramework);
  assertTrue(errors.length > 0, 'Expected validation errors');
});

test('Missing required fields are detected in security framework', () => {
  const invalidFramework = fixtures.securityFrameworks.invalid[1];
  const errors = validateSecurityFramework(invalidFramework);
  assertTrue(errors.some(e => e.includes('Missing required field')));
});

test('Invalid threat detection fails validation', () => {
  const invalidDetection = fixtures.threatDetection.invalid[0];
  const errors = validateThreatDetection(invalidDetection);
  assertTrue(errors.length > 0, 'Expected validation errors');
});

test('Invalid security observability fails validation', () => {
  const invalidObs = fixtures.securityObservability.invalid[0];
  const errors = validateSecurityObservability(invalidObs);
  assertTrue(errors.length > 0, 'Expected validation errors');
});

// Integration tests
console.log('\n--- Integration Tests ---');

test('Security framework integrates with threat detection', () => {
  const framework = fixtures.securityFrameworks.valid[0];
  const detection = fixtures.threatDetection.valid[0];
  
  // Verify that framework has zero trust and detection has ML models
  assertTrue(framework.zeroTrust.enabled);
  assertTrue(detection.mlModels.enabled);
  
  // Verify response workflows use framework roles
  const workflow = detection.responseWorkflows[0];
  assertTrue(workflow.escalation.path.length >= 2);
});

test('Threat detection integrates with observability', () => {
  const detection = fixtures.threatDetection.valid[0];
  const obs = fixtures.securityObservability.valid[0];
  
  // Verify detection has real-time monitoring
  assertTrue(detection.realTimeMonitoring.enabled);
  
  // Verify observability has threat dashboard
  const threatDashboard = obs.dashboards.find(d => d.type === 'threat_landscape');
  assertTrue(threatDashboard !== undefined);
});

test('Security observability integrates with incident tracking', () => {
  const obs = fixtures.securityObservability.valid[0];
  
  // Verify incident tracking has automation
  assertTrue(obs.incidentTracking.automation.autoCreate);
  assertTrue(obs.incidentTracking.automation.autoAssign);
  assertTrue(obs.incidentTracking.automation.autoEscalate);
  
  // Verify forensic logging has chain of custody
  assertTrue(obs.forensicLogging.chainOfCustody.enabled);
});

// Print summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
