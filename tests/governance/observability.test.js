/**
 * SL18 Advanced Observability & Hybrid Formats Test Suite
 * Phase 16: Monitoring, Diagnostics, Anomaly Detection, and Serialized Workflows
 * 
 * Run: node tests/governance/observability.test.js
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

// Observability config validation
function validateObservabilityConfig(data) {
  const required = ['configId', 'dashboards', 'anomalyDetection', 'alerts'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate anomaly rules if present
  if (data.anomalyDetection?.rules) {
    const validTypes = ['qc_drop', 'fraud_spike', 'publishing_error', 'revenue_anomaly', 'latency_spike', 'error_rate'];
    for (const rule of data.anomalyDetection.rules) {
      if (!validTypes.includes(rule.type)) {
        return { valid: false, error: 'type must be one of enum values' };
      }
    }
  }

  return { valid: true };
}

// Incident report validation
function validateIncidentReport(data) {
  const required = ['incidentId', 'title', 'severity', 'status', 'category', 'timeline'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validSeverities = ['info', 'warning', 'critical'];
  if (!validSeverities.includes(data.severity)) {
    return { valid: false, error: 'severity must be one of enum values' };
  }

  const validStatuses = ['open', 'investigating', 'identified', 'resolved', 'closed'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Series workspace validation
function validateSeriesWorkspace(data) {
  const required = ['seriesId', 'franchiseId', 'title', 'format', 'episodes', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validFormats = ['serialized_drama', 'serialized_comedy', 'serialized_documentary', 'anthology', 'hybrid'];
  if (!validFormats.includes(data.format)) {
    return { valid: false, error: 'format must be one of enum values' };
  }

  return { valid: true };
}

// Hybrid pipeline validation
function validateHybridPipeline(data) {
  const required = ['pipelineId', 'franchiseId', 'name', 'pipelineType', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validTypes = ['short_form_only', 'serialized_only', 'hybrid'];
  if (!validTypes.includes(data.pipelineType)) {
    return { valid: false, error: 'pipelineType must be one of enum values' };
  }

  return { valid: true };
}

// Anomaly detection check
function checkAnomalyThreshold(rule, currentValue, baselineValue = null, stdDev = null) {
  if (!rule || !rule.threshold) {
    return false;
  }
  const { operator, value, deviationMultiplier } = rule.threshold;
  
  if (operator === 'deviation' && baselineValue !== null && stdDev !== null) {
    const deviation = Math.abs(currentValue - baselineValue) / stdDev;
    return deviation >= deviationMultiplier;
  }
  
  switch (operator) {
    case 'gt': return currentValue > value;
    case 'lt': return currentValue < value;
    case 'gte': return currentValue >= value;
    case 'lte': return currentValue <= value;
    case 'eq': return currentValue === value;
    default: return false;
  }
}

// Continuity check - validates persona tone consistency across episodes
function checkPersonaContinuity(persona, episode1, episode2) {
  // Compare episode tones - both should match the expected persona behavior
  if (!episode1 || !episode2) {
    return false;
  }
  return episode1.personaTone === episode2.personaTone;
}

// Plot continuity check
function checkPlotContinuity(plotThread, previousEpisode, currentEpisode) {
  // Resolved threads should not reappear as active
  if (previousEpisode.threadStatus === 'resolved' && currentEpisode.threadStatus === 'active') {
    return false;
  }
  return true;
}

console.log('\n=== SL18 Phase 16: Advanced Observability & Hybrid Formats Tests ===\n');

// Test 1: Schema files exist
console.log('--- Schema File Existence ---');

test('Observability schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/observability.schema.json')));
});

test('Incident report schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/incident_report.schema.json')));
});

test('Series workspace schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/series_workspace.schema.json')));
});

test('Hybrid publishing schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/hybrid_publishing.schema.json')));
});

// Test 2: Schema files are valid JSON
console.log('\n--- Schema JSON Validity ---');

test('Observability schema is valid JSON', () => {
  const schema = loadJSON('schemas/observability.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'ObservabilityConfig', 'Incorrect title');
});

test('Incident report schema is valid JSON', () => {
  const schema = loadJSON('schemas/incident_report.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'IncidentReport', 'Incorrect title');
});

test('Series workspace schema is valid JSON', () => {
  const schema = loadJSON('schemas/series_workspace.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'SeriesWorkspace', 'Incorrect title');
});

test('Hybrid publishing schema is valid JSON', () => {
  const schema = loadJSON('schemas/hybrid_publishing.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'HybridPublishing', 'Incorrect title');
});

// Test 3: Observability configuration validation
console.log('\n--- Observability Configuration ---');

test('Valid observability configs pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  for (const config of fixtures.validObservabilityConfigs) {
    const result = validateObservabilityConfig(config);
    assert(result.valid, `Config ${config.configId} failed: ${result.error}`);
  }
});

test('Invalid observability configs fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  for (const testCase of fixtures.invalidObservabilityConfigs) {
    const result = validateObservabilityConfig(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Observability config has anomaly detection rules', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const config = fixtures.validObservabilityConfigs[0];
  assert(config.anomalyDetection.rules.length >= 3, 'Should have multiple anomaly rules');
});

test('Observability config has alert channels', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const config = fixtures.validObservabilityConfigs[0];
  assert(config.alerts.channels.length >= 2, 'Should have multiple alert channels');
});

// Test 4: Anomaly detection tests
console.log('\n--- Anomaly Detection ---');

test('QC drop below threshold triggers alert', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const testCase = fixtures.anomalyDetectionTestCases[0];
  const triggered = checkAnomalyThreshold(testCase.rule, testCase.currentValue);
  assertEqual(triggered, testCase.expectedTrigger, testCase.description);
});

test('QC rate above threshold does not trigger', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const testCase = fixtures.anomalyDetectionTestCases[1];
  const triggered = checkAnomalyThreshold(testCase.rule, testCase.currentValue);
  assertEqual(triggered, testCase.expectedTrigger, testCase.description);
});

test('Fraud spike deviation triggers critical alert', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const testCase = fixtures.anomalyDetectionTestCases[2];
  const triggered = checkAnomalyThreshold(
    testCase.rule, 
    testCase.currentValue, 
    testCase.baselineValue, 
    testCase.standardDeviation
  );
  assertEqual(triggered, testCase.expectedTrigger, testCase.description);
});

test('Normal fraud attempts do not trigger', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const testCase = fixtures.anomalyDetectionTestCases[3];
  const triggered = checkAnomalyThreshold(
    testCase.rule, 
    testCase.currentValue, 
    testCase.baselineValue, 
    testCase.standardDeviation
  );
  assertEqual(triggered, testCase.expectedTrigger, testCase.description);
});

// Test 5: Incident report validation
console.log('\n--- Incident Reports ---');

test('Valid incident reports pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  for (const report of fixtures.validIncidentReports) {
    const result = validateIncidentReport(report);
    assert(result.valid, `Incident ${report.incidentId} failed: ${result.error}`);
  }
});

test('Incident report has root cause analysis', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const resolvedIncident = fixtures.validIncidentReports.find(i => i.status === 'resolved');
  assert(resolvedIncident.rootCauseAnalysis.completed === true, 'Resolved incident should have completed RCA');
  assert(resolvedIncident.rootCauseAnalysis.primaryCause !== undefined, 'Should have primary cause');
});

test('Incident report has suggested actions', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const incident = fixtures.validIncidentReports[0];
  assert(incident.suggestedActions.length > 0, 'Should have suggested actions');
  assert(incident.suggestedActions[0].priority !== undefined, 'Actions should have priority');
});

test('Incident report correlates events across systems', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const incident = fixtures.validIncidentReports[0];
  assert(incident.rootCauseAnalysis.correlatedEvents.length > 0, 'Should have correlated events');
  assert(incident.rootCauseAnalysis.correlatedEvents[0].correlationId !== undefined, 'Events should have correlation ID');
});

// Test 6: Series workspace validation
console.log('\n--- Series Workspace ---');

test('Valid series workspaces pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  for (const series of fixtures.validSeriesWorkspaces) {
    const result = validateSeriesWorkspace(series);
    assert(result.valid, `Series ${series.seriesId} failed: ${result.error}`);
  }
});

test('Invalid series workspaces fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  for (const testCase of fixtures.invalidSeriesWorkspaces) {
    const result = validateSeriesWorkspace(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Series workspace has persona profiles', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const series = fixtures.validSeriesWorkspaces[0];
  assert(series.personaProfile.primaryPersonas.length > 0, 'Should have primary personas');
  assert(series.personaProfile.primaryPersonas[0].voiceProfile !== undefined, 'Personas should have voice profile');
});

test('Series workspace has continuity notes', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const series = fixtures.validSeriesWorkspaces[0];
  assert(series.continuityNotes.plotThreads.length > 0, 'Should have plot threads');
  assert(series.continuityNotes.worldBuildingElements.length > 0, 'Should have world building elements');
});

test('Series workspace tracks episode continuity', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const series = fixtures.validSeriesWorkspaces[0];
  const episode2 = series.episodes.find(e => e.episodeNumber === 2);
  assert(episode2.previousEpisodeRef !== undefined, 'Episode should reference previous episode');
  assert(episode2.continuityNotes !== undefined, 'Episode should have continuity notes');
});

// Test 7: Persona continuity validation
console.log('\n--- Persona Continuity ---');

test('Persona consistency passes when voice profile matches', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const testCase = fixtures.continuityValidationTestCases[0];
  const result = checkPersonaContinuity(testCase.persona, testCase.episode1, testCase.episode2);
  assertEqual(result, testCase.expectedPassed, testCase.description);
});

test('Persona consistency fails when voice profile differs', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const testCase = fixtures.continuityValidationTestCases[1];
  const result = checkPersonaContinuity(testCase.persona, testCase.episode1, testCase.episode2);
  assertEqual(result, testCase.expectedPassed, testCase.description);
});

test('Plot continuity passes when threads are consistent', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const testCase = fixtures.continuityValidationTestCases[2];
  const result = checkPlotContinuity(testCase.plotThread, testCase.previousEpisode, testCase.currentEpisode);
  assertEqual(result, testCase.expectedPassed, testCase.description);
});

test('Plot continuity fails when resolved thread reappears', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const testCase = fixtures.continuityValidationTestCases[3];
  const result = checkPlotContinuity(testCase.plotThread, testCase.previousEpisode, testCase.currentEpisode);
  assertEqual(result, testCase.expectedPassed, testCase.description);
});

// Test 8: Hybrid pipeline validation
console.log('\n--- Hybrid Pipeline ---');

test('Valid hybrid pipelines pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  for (const pipeline of fixtures.validHybridPipelines) {
    const result = validateHybridPipeline(pipeline);
    assert(result.valid, `Pipeline ${pipeline.pipelineId} failed: ${result.error}`);
  }
});

test('Invalid hybrid pipelines fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  for (const testCase of fixtures.invalidHybridPipelines) {
    const result = validateHybridPipeline(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Hybrid pipeline has both short-form and serialized config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const hybridPipeline = fixtures.validHybridPipelines.find(p => p.pipelineType === 'hybrid');
  assert(hybridPipeline.shortFormConfig !== undefined, 'Should have shortFormConfig');
  assert(hybridPipeline.serializedConfig !== undefined, 'Should have serializedConfig');
  assert(hybridPipeline.shortFormConfig.enabled === true, 'Short-form should be enabled');
  assert(hybridPipeline.serializedConfig.enabled === true, 'Serialized should be enabled');
});

test('Hybrid pipeline has cross-promotion rules', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const hybridPipeline = fixtures.validHybridPipelines.find(p => p.pipelineType === 'hybrid');
  assert(hybridPipeline.hybridRules.crossPromotion.enabled === true, 'Cross-promotion should be enabled');
  assert(hybridPipeline.hybridRules.crossPromotion.teaserGeneration === true, 'Teaser generation should be enabled');
});

test('Hybrid pipeline enforces persona sharing', () => {
  const fixtures = loadJSON('tests/governance/fixtures/hybrid_formats.json');
  const hybridPipeline = fixtures.validHybridPipelines.find(p => p.pipelineType === 'hybrid');
  assert(hybridPipeline.hybridRules.personaSharing.enabled === true, 'Persona sharing should be enabled');
  assert(hybridPipeline.hybridRules.personaSharing.consistencyEnforced === true, 'Consistency should be enforced');
});

// Test 9: Extended audit log events
console.log('\n--- Extended Audit Log Events ---');

test('Audit log schema includes observability events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'anomaly_detected', 'Should include anomaly_detected');
  assertArrayIncludes(eventTypes, 'incident_created', 'Should include incident_created');
  assertArrayIncludes(eventTypes, 'alert_triggered', 'Should include alert_triggered');
  assertArrayIncludes(eventTypes, 'diagnostics_completed', 'Should include diagnostics_completed');
});

test('Audit log schema includes series events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'series_created', 'Should include series_created');
  assertArrayIncludes(eventTypes, 'episode_published', 'Should include episode_published');
  assertArrayIncludes(eventTypes, 'continuity_check_passed', 'Should include continuity_check_passed');
});

test('Audit log schema includes hybrid events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'hybrid_pipeline_started', 'Should include hybrid_pipeline_started');
  assertArrayIncludes(eventTypes, 'cross_format_qc_passed', 'Should include cross_format_qc_passed');
});

test('Audit log schema includes new categories', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const categories = schema.properties.category.enum;
  assertArrayIncludes(categories, 'observability', 'Should include observability category');
  assertArrayIncludes(categories, 'series', 'Should include series category');
  assertArrayIncludes(categories, 'hybrid', 'Should include hybrid category');
});

test('Audit log schema includes new target types', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const targetTypes = schema.properties.target.properties.type.enum;
  assertArrayIncludes(targetTypes, 'incident', 'Should include incident target type');
  assertArrayIncludes(targetTypes, 'series', 'Should include series target type');
  assertArrayIncludes(targetTypes, 'pipeline', 'Should include pipeline target type');
});

// Test 10: Dashboard configuration
console.log('\n--- Dashboard Configuration ---');

test('Multi-franchise dashboard view supported', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const config = fixtures.validObservabilityConfigs[0];
  const franchiseDash = config.dashboards.find(d => d.type === 'franchise_overview');
  assert(franchiseDash !== undefined, 'Should have franchise overview dashboard');
});

test('Language metrics dashboard supported', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const config = fixtures.validObservabilityConfigs[0];
  const langDash = config.dashboards.find(d => d.type === 'language_metrics');
  assert(langDash !== undefined, 'Should have language metrics dashboard');
});

test('Combined operations dashboard supported', () => {
  const fixtures = loadJSON('tests/governance/fixtures/observability.json');
  const config = fixtures.validObservabilityConfigs[0];
  const combinedDash = config.dashboards.find(d => d.type === 'combined');
  assert(combinedDash !== undefined, 'Should have combined dashboard');
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
