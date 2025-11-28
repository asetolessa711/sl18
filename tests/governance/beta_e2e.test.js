/**
 * Beta E2E Testing Tests for SL18 + Waliin Studio
 * Phase 33: Validates end-to-end testing framework for beta rollout
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test fixtures
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures/beta_e2e.json'), 'utf-8'));

// Load schema
const betaE2eSchema = JSON.parse(readFileSync(join(__dirname, '../../schemas/beta_e2e_testing.schema.json'), 'utf-8'));

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

// ============================================
// Beta E2E Testing Schema Tests
// ============================================

console.log('\n=== Beta E2E Testing Schema Tests ===\n');

test('Schema should have correct title and description', () => {
  assertEqual(betaE2eSchema.title, 'BetaE2ETesting');
  assert(betaE2eSchema.description.includes('Beta End-to-End'));
});

test('Schema should require testSuiteId, version, testPhase, and status', () => {
  assertIncludes(betaE2eSchema.required, 'testSuiteId');
  assertIncludes(betaE2eSchema.required, 'version');
  assertIncludes(betaE2eSchema.required, 'testPhase');
  assertIncludes(betaE2eSchema.required, 'status');
});

test('Schema should define testPhase enum with all phases', () => {
  const phases = betaE2eSchema.properties.testPhase.enum;
  assertIncludes(phases, 'pre_beta');
  assertIncludes(phases, 'internal_beta');
  assertIncludes(phases, 'closed_beta');
  assertIncludes(phases, 'open_beta');
  assertIncludes(phases, 'production_validation');
});

test('Schema should define status enum', () => {
  const statuses = betaE2eSchema.properties.status.enum;
  assertIncludes(statuses, 'draft');
  assertIncludes(statuses, 'active');
  assertIncludes(statuses, 'paused');
  assertIncludes(statuses, 'completed');
  assertIncludes(statuses, 'archived');
});

// ============================================
// Audience Flow Tests
// ============================================

console.log('\n=== Audience Flow Tests ===\n');

test('Schema should define audience flow action types', () => {
  const audienceFlowSteps = betaE2eSchema.properties.audienceFlows.properties.testScenarios.items.properties.steps.items.properties.action.enum;
  assertIncludes(audienceFlowSteps, 'signup');
  assertIncludes(audienceFlowSteps, 'login');
  assertIncludes(audienceFlowSteps, 'social_login');
  assertIncludes(audienceFlowSteps, 'view_personalized_home');
  assertIncludes(audienceFlowSteps, 'play_content');
  assertIncludes(audienceFlowSteps, 'vote_poll');
  assertIncludes(audienceFlowSteps, 'post_comment');
  assertIncludes(audienceFlowSteps, 'confirm_subscription');
  assertIncludes(audienceFlowSteps, 'enable_kids_mode');
});

test('Audience flow scenario should have valid structure', () => {
  const scenario = fixtures.audienceFlowScenarios[0];
  assert(scenario.scenarioId.startsWith('audience-'), 'Scenario ID should start with audience-');
  assert(scenario.steps.length > 0, 'Should have at least one step');
  assert(scenario.priority === 'critical' || scenario.priority === 'high', 'Should have valid priority');
});

test('Audience flow validations should include UI responsiveness checks', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.audienceFlows.validations;
  assert(validations.uiResponsiveness.maxLoadTimeMs === 3000, 'Max load time should be 3000ms');
  assert(validations.uiResponsiveness.checkAccessibility === true, 'Should check accessibility');
  assertEqual(validations.uiResponsiveness.wcagLevel, 'AA');
});

test('Audience flow validations should include personalization accuracy', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.audienceFlows.validations;
  assert(validations.personalizationAccuracy.minRelevanceScore === 0.7, 'Min relevance should be 0.7');
  assert(validations.personalizationAccuracy.validateRecommendations === true);
  assert(validations.personalizationAccuracy.validateHeroBanner === true);
});

test('Audience flow validations should include subscription enforcement', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.audienceFlows.validations;
  assert(validations.subscriptionEnforcement.validateTierAccess === true);
  assert(validations.subscriptionEnforcement.validateQualityRestrictions === true);
  assert(validations.subscriptionEnforcement.validateFeatureGating === true);
});

test('Audience flow validations should include funnel attribution', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.audienceFlows.validations;
  assert(validations.funnelAttribution.validateUtmCapture === true);
  assert(validations.funnelAttribution.validateConversionTracking === true);
  assert(validations.funnelAttribution.validateSocialAnalytics === true);
});

test('Signup to premium flow should have all required steps', () => {
  const scenario = fixtures.validTestSuites[0].audienceFlows.testScenarios[0];
  assertEqual(scenario.scenarioId, 'audience-signup-to-premium');
  assert(scenario.steps.length >= 10, 'Should have at least 10 steps');
  assertEqual(scenario.steps[0].action, 'signup');
  assertEqual(scenario.steps[9].action, 'confirm_subscription');
});

test('Social funnel flow should track UTM and attribution', () => {
  const scenario = fixtures.validTestSuites[0].audienceFlows.testScenarios[1];
  assertEqual(scenario.scenarioId, 'audience-social-funnel');
  assertEqual(scenario.steps[0].action, 'social_login');
  assert(scenario.steps[0].expectedResult.includes('UTM'), 'Should capture UTM parameters');
});

// ============================================
// Creator Flow Tests
// ============================================

console.log('\n=== Creator Flow Tests ===\n');

test('Schema should define creator flow action types', () => {
  const creatorFlowSteps = betaE2eSchema.properties.creatorFlows.properties.testScenarios.items.properties.steps.items.properties.action.enum;
  assertIncludes(creatorFlowSteps, 'login_creator');
  assertIncludes(creatorFlowSteps, 'access_studio_console');
  assertIncludes(creatorFlowSteps, 'start_upload');
  assertIncludes(creatorFlowSteps, 'complete_upload');
  assertIncludes(creatorFlowSteps, 'submit_for_qc');
  assertIncludes(creatorFlowSteps, 'pass_qc');
  assertIncludes(creatorFlowSteps, 'publish_content');
  assertIncludes(creatorFlowSteps, 'auto_publish_social');
  assertIncludes(creatorFlowSteps, 'view_analytics_dashboard');
});

test('Creator flow validations should include publishing workflows', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.creatorFlows.validations;
  assert(validations.publishingWorkflows.validateUploadIntegrity === true);
  assert(validations.publishingWorkflows.validateTranscoding === true);
  assert(validations.publishingWorkflows.validateFormatConversion === true);
  assert(validations.publishingWorkflows.supportedFormats.includes('9:16'), 'Should support 9:16 format');
});

test('Creator flow validations should include revenue attribution', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.creatorFlows.validations;
  assert(validations.revenueAttribution.validatePlatformReports === true);
  assert(validations.revenueAttribution.validateRevenueMatching === true);
  assertEqual(validations.revenueAttribution.tolerancePercent, 5);
});

test('Creator flow validations should include cross-platform sync', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.creatorFlows.validations;
  assert(validations.crossPlatformSync.validateYouTube === true);
  assert(validations.crossPlatformSync.validateFacebook === true);
  assert(validations.crossPlatformSync.validateInstagram === true);
  assert(validations.crossPlatformSync.validateTikTok === true);
});

test('Upload to publish flow should have complete journey', () => {
  const scenario = fixtures.validTestSuites[0].creatorFlows.testScenarios[0];
  assertEqual(scenario.scenarioId, 'creator-upload-to-publish');
  assert(scenario.steps.length >= 12, 'Should have at least 12 steps');
  assert(scenario.tags.includes('cross_platform'), 'Should be tagged as cross_platform');
});

// ============================================
// Monetization Flow Tests
// ============================================

console.log('\n=== Monetization Flow Tests ===\n');

test('Schema should define monetization flow action types', () => {
  const monetizationFlowSteps = betaE2eSchema.properties.monetizationFlows.properties.testScenarios.items.properties.steps.items.properties.action.enum;
  assertIncludes(monetizationFlowSteps, 'view_pricing');
  assertIncludes(monetizationFlowSteps, 'select_subscription');
  assertIncludes(monetizationFlowSteps, 'process_payment');
  assertIncludes(monetizationFlowSteps, 'verify_subscription_active');
  assertIncludes(monetizationFlowSteps, 'upgrade_subscription');
  assertIncludes(monetizationFlowSteps, 'cancel_subscription');
  assertIncludes(monetizationFlowSteps, 'verify_ad_insertion');
  assertIncludes(monetizationFlowSteps, 'track_ad_revenue');
});

test('Monetization flow validations should include payment security', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.monetizationFlows.validations;
  assert(validations.paymentSecurity.validatePciCompliance === true);
  assert(validations.paymentSecurity.validateEncryption === true);
  assert(validations.paymentSecurity.validateFraudDetection === true);
});

test('Monetization flow validations should include revenue dashboards', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.monetizationFlows.validations;
  assert(validations.revenueDashboards.validateRpmByRegion === true);
  assert(validations.revenueDashboards.validateCpmAccuracy === true);
  assertEqual(validations.revenueDashboards.tolerancePercent, 2);
});

test('Subscription lifecycle flow should test full lifecycle', () => {
  const scenario = fixtures.validTestSuites[0].monetizationFlows.testScenarios[0];
  assertEqual(scenario.scenarioId, 'monetization-subscription-lifecycle');
  assert(scenario.paymentGateways.includes('stripe'));
  assert(scenario.paymentGateways.includes('paypal'));
  assert(scenario.regions.includes('US'));
  assert(scenario.regions.includes('KE'));
});

test('Ad flow should test SSAI insertion and revenue tracking', () => {
  const scenario = fixtures.validTestSuites[0].monetizationFlows.testScenarios[1];
  assertEqual(scenario.scenarioId, 'monetization-ad-flow');
  const ssaiStep = scenario.steps.find(s => s.action === 'verify_ad_insertion');
  assert(ssaiStep.expectedResult.includes('SSAI'), 'Should verify SSAI');
});

test('Regional pricing flow should test multiple regions', () => {
  const scenario = fixtures.monetizationFlowScenarios[0];
  assertEqual(scenario.scenarioId, 'monetization-regional-pricing');
  assert(scenario.regions.includes('KE'), 'Should test Kenya');
  assert(scenario.regions.includes('ET'), 'Should test Ethiopia');
  assert(scenario.regions.includes('NG'), 'Should test Nigeria');
});

// ============================================
// Governance Flow Tests
// ============================================

console.log('\n=== Governance Flow Tests ===\n');

test('Schema should define governance flow action types', () => {
  const governanceFlowSteps = betaE2eSchema.properties.governanceFlows.properties.testScenarios.items.properties.steps.items.properties.action.enum;
  assertIncludes(governanceFlowSteps, 'post_comment');
  assertIncludes(governanceFlowSteps, 'trigger_auto_moderation');
  assertIncludes(governanceFlowSteps, 'flag_for_review');
  assertIncludes(governanceFlowSteps, 'cultural_sensitivity_check');
  assertIncludes(governanceFlowSteps, 'submit_copyright_claim');
  assertIncludes(governanceFlowSteps, 'verify_content_id');
  assertIncludes(governanceFlowSteps, 'add_sponsored_disclosure');
  assertIncludes(governanceFlowSteps, 'verify_disclosure_visible');
  assertIncludes(governanceFlowSteps, 'view_audit_log');
});

test('Governance flow validations should include Phase 25 integration', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.governanceFlows.validations;
  assert(validations.phase25Integration.validateGovernanceSuiteTriggers === true);
  assert(validations.phase25Integration.validateCulturalSensitivity === true);
  assert(validations.phase25Integration.validateComplianceFrameworks === true);
});

test('Governance flow validations should include audit log checks', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.governanceFlows.validations;
  assert(validations.auditLogs.validateCompleteness === true);
  assert(validations.auditLogs.validateTimestamps === true);
  assert(validations.auditLogs.validateActorCapture === true);
  assertEqual(validations.auditLogs.retentionDays, 365);
});

test('Moderation flow should test full escalation path', () => {
  const scenario = fixtures.validTestSuites[0].governanceFlows.testScenarios[0];
  assertEqual(scenario.scenarioId, 'governance-moderation-flow');
  assert(scenario.governanceSuite, 'Should reference governance suite');
  const culturalStep = scenario.steps.find(s => s.action === 'cultural_sensitivity_check');
  assert(culturalStep, 'Should include cultural sensitivity check');
});

test('Copyright flow should test Content ID and dispute resolution', () => {
  const scenario = fixtures.validTestSuites[0].governanceFlows.testScenarios[1];
  assertEqual(scenario.scenarioId, 'governance-copyright-flow');
  assert(scenario.steps.find(s => s.action === 'verify_content_id'), 'Should verify Content ID');
  assert(scenario.steps.find(s => s.action === 'dispute_claim'), 'Should test dispute');
  assert(scenario.steps.find(s => s.action === 'resolve_claim'), 'Should test resolution');
});

test('Disclosure flow should test all disclosure types', () => {
  const scenario = fixtures.governanceFlowScenarios[0];
  assertEqual(scenario.scenarioId, 'governance-disclosure-flow');
  assert(scenario.steps.find(s => s.action === 'add_sponsored_disclosure'));
  assert(scenario.steps.find(s => s.action === 'add_ai_generated_label'));
});

// ============================================
// Analytics Flow Tests
// ============================================

console.log('\n=== Analytics Flow Tests ===\n');

test('Schema should define analytics flow action types', () => {
  const analyticsFlowSteps = betaE2eSchema.properties.analyticsFlows.properties.testScenarios.items.properties.steps.items.properties.action.enum;
  assertIncludes(analyticsFlowSteps, 'track_funnel_awareness');
  assertIncludes(analyticsFlowSteps, 'track_funnel_interest');
  assertIncludes(analyticsFlowSteps, 'track_funnel_consideration');
  assertIncludes(analyticsFlowSteps, 'track_funnel_intent');
  assertIncludes(analyticsFlowSteps, 'track_funnel_purchase');
  assertIncludes(analyticsFlowSteps, 'track_funnel_retention');
  assertIncludes(analyticsFlowSteps, 'verify_attribution_last_click');
  assertIncludes(analyticsFlowSteps, 'trigger_feedback_loop');
  assertIncludes(analyticsFlowSteps, 'verify_churn_prediction');
});

test('Analytics flow validations should include funnel accuracy', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.analyticsFlows.validations;
  assert(validations.funnelAccuracy.validateStageProgression === true);
  assert(validations.funnelAccuracy.validateDropOffCalculation === true);
  assertEqual(validations.funnelAccuracy.tolerancePercent, 1);
});

test('Analytics flow validations should include attribution accuracy', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.analyticsFlows.validations;
  assert(validations.attributionAccuracy.validateModelConsistency === true);
  assert(validations.attributionAccuracy.validateCrossDeviceTracking === true);
});

test('Analytics flow validations should include feedback loop integration', () => {
  const validSuite = fixtures.validTestSuites[0];
  const validations = validSuite.analyticsFlows.validations;
  assert(validations.feedbackLoopIntegration.validatePhase17Integration === true);
  assert(validations.feedbackLoopIntegration.validatePhase20Integration === true);
  assert(validations.feedbackLoopIntegration.validateTriggerExecution === true);
});

test('Funnel tracking flow should test complete funnel', () => {
  const scenario = fixtures.validTestSuites[0].analyticsFlows.testScenarios[0];
  assertEqual(scenario.scenarioId, 'analytics-funnel-tracking');
  assert(scenario.steps.length >= 7, 'Should cover all funnel stages');
  assert(scenario.attributionModels.includes('last_click'));
  assert(scenario.attributionModels.includes('linear'));
});

test('Feedback loop flow should test Phase 17 and Phase 20 integration', () => {
  const scenario = fixtures.validTestSuites[0].analyticsFlows.testScenarios[1];
  assertEqual(scenario.scenarioId, 'analytics-feedback-loop');
  assert(scenario.steps.find(s => s.action === 'trigger_feedback_loop'));
  assert(scenario.steps.find(s => s.action === 'verify_personalization_adjustment'));
  assert(scenario.steps.find(s => s.action === 'verify_churn_prediction'));
});

test('Attribution models flow should test all models', () => {
  const scenario = fixtures.analyticsFlowScenarios[0];
  assertEqual(scenario.scenarioId, 'analytics-attribution-models');
  assert(scenario.attributionModels.length >= 4, 'Should test at least 4 attribution models');
});

// ============================================
// Infrastructure Validation Tests
// ============================================

console.log('\n=== Infrastructure Validation Tests ===\n');

test('Schema should define performance thresholds', () => {
  const thresholds = betaE2eSchema.properties.infrastructureValidation.properties.performanceThresholds.properties;
  assert(thresholds.pageLoadTimeMs);
  assert(thresholds.apiResponseTimeMs);
  assert(thresholds.videoStartTimeMs);
  assert(thresholds.maxRebufferRatio);
  assert(thresholds.uptime);
});

test('Infrastructure validation should have correct performance thresholds', () => {
  const validSuite = fixtures.validTestSuites[0];
  const thresholds = validSuite.infrastructureValidation.performanceThresholds;
  assertEqual(thresholds.pageLoadTimeMs, 3000);
  assertEqual(thresholds.apiResponseTimeMs, 500);
  assertEqual(thresholds.videoStartTimeMs, 2000);
  assertEqual(thresholds.maxRebufferRatio, 0.005);
  assertEqual(thresholds.uptime, 99.9);
});

test('Load test config should define concurrent users and duration', () => {
  const validSuite = fixtures.validTestSuites[0];
  const loadConfig = validSuite.infrastructureValidation.loadTestConfig;
  assert(loadConfig.enabled === true);
  assertEqual(loadConfig.concurrentUsers, 1000);
  assertEqual(loadConfig.rampUpMinutes, 5);
  assertEqual(loadConfig.steadyStateDurationMinutes, 30);
});

test('Chaos test config should define failure scenarios', () => {
  const validSuite = fixtures.validTestSuites[0];
  const chaosConfig = validSuite.infrastructureValidation.chaosTestConfig;
  assert(Array.isArray(chaosConfig.scenarios));
  assert(chaosConfig.scenarios.includes('region_failover'));
  assert(chaosConfig.scenarios.includes('cdn_failure'));
});

test('Performance results should track all key metrics', () => {
  const result = fixtures.performanceResults[0];
  assert(result.metrics.averagePageLoadTimeMs < 3000, 'Page load should be under threshold');
  assert(result.metrics.averageApiResponseTimeMs < 500, 'API response should be under threshold');
  assert(result.metrics.rebufferRatio < 0.005, 'Rebuffer should be under threshold');
  assert(result.thresholdsPassed === true);
});

// ============================================
// Test Execution Tests
// ============================================

console.log('\n=== Test Execution Tests ===\n');

test('Schema should define test environments', () => {
  const environments = betaE2eSchema.properties.testExecution.properties.environment.enum;
  assertIncludes(environments, 'development');
  assertIncludes(environments, 'staging');
  assertIncludes(environments, 'beta');
  assertIncludes(environments, 'production');
});

test('Test execution should configure parallel execution', () => {
  const validSuite = fixtures.validTestSuites[0];
  const parallel = validSuite.testExecution.parallelExecution;
  assert(parallel.enabled === true);
  assertEqual(parallel.maxParallelScenarios, 10);
});

test('Test execution should configure retry policy', () => {
  const validSuite = fixtures.validTestSuites[0];
  const retry = validSuite.testExecution.retryPolicy;
  assertEqual(retry.maxRetries, 3);
  assertEqual(retry.retryDelaySeconds, 5);
  assert(retry.retryOnlyFlaky === true);
});

test('Test execution should configure data management', () => {
  const validSuite = fixtures.validTestSuites[0];
  const data = validSuite.testExecution.dataManagement;
  assert(data.useTestData === true);
  assert(data.cleanupAfterRun === true);
  assert(data.isolateTestUsers === true);
  assert(data.snapshotEnabled === true);
});

test('Scheduled runs should include smoke, critical path, and regression', () => {
  const validSuite = fixtures.validTestSuites[0];
  const runs = validSuite.testExecution.scheduledRuns;
  const smoke = runs.find(r => r.name === 'Smoke Tests');
  const critical = runs.find(r => r.name === 'Critical Path Tests');
  const regression = runs.find(r => r.name === 'Full Regression');
  
  assert(smoke && smoke.schedule === 'hourly');
  assert(critical && critical.schedule === 'daily');
  assert(regression && regression.schedule === 'weekly');
});

test('Test execution results should track pass rate', () => {
  const result = fixtures.testExecutionResults[0];
  assertEqual(result.totalScenarios, 12);
  assertEqual(result.passed, 11);
  assertEqual(result.failed, 1);
  assert(result.passRate > 90, 'Pass rate should be above 90%');
});

// ============================================
// Reporting Tests
// ============================================

console.log('\n=== Reporting Tests ===\n');

test('Schema should define dashboard widgets', () => {
  const widgets = betaE2eSchema.properties.reporting.properties.dashboards.properties.widgets.items.enum;
  assertIncludes(widgets, 'pass_rate');
  assertIncludes(widgets, 'failure_breakdown');
  assertIncludes(widgets, 'flaky_tests');
  assertIncludes(widgets, 'execution_time');
  assertIncludes(widgets, 'trend_chart');
});

test('Reporting should configure notifications', () => {
  const validSuite = fixtures.validTestSuites[0];
  const notifications = validSuite.reporting.notifications;
  assert(notifications.channels.includes('slack'));
  assert(notifications.channels.includes('email'));
  assert(notifications.onFailure === true);
  assert(notifications.dailySummary === true);
});

test('Reporting should configure artifacts', () => {
  const validSuite = fixtures.validTestSuites[0];
  const artifacts = validSuite.reporting.artifacts;
  assert(artifacts.screenshots === true);
  assert(artifacts.videos === true);
  assert(artifacts.networkLogs === true);
  assert(artifacts.consoleLogs === true);
  assertEqual(artifacts.retentionDays, 30);
});

test('Reporting should support multiple export formats', () => {
  const validSuite = fixtures.validTestSuites[0];
  const formats = validSuite.reporting.exportFormats;
  assert(formats.includes('html'));
  assert(formats.includes('json'));
  assert(formats.includes('junit'));
});

// ============================================
// Beta Readiness Gates Tests
// ============================================

console.log('\n=== Beta Readiness Gates Tests ===\n');

test('Schema should define readiness gate statuses', () => {
  const statuses = betaE2eSchema.properties.betaReadinessGates.properties.gates.items.properties.status.enum;
  assertIncludes(statuses, 'not_started');
  assertIncludes(statuses, 'in_progress');
  assertIncludes(statuses, 'passed');
  assertIncludes(statuses, 'failed');
  assertIncludes(statuses, 'blocked');
});

test('Schema should define overall readiness levels', () => {
  const levels = betaE2eSchema.properties.betaReadinessGates.properties.overallReadiness.enum;
  assertIncludes(levels, 'not_ready');
  assertIncludes(levels, 'partially_ready');
  assertIncludes(levels, 'ready');
  assertIncludes(levels, 'ready_with_warnings');
});

test('Beta readiness gates should include all required gates', () => {
  const validSuite = fixtures.validTestSuites[0];
  const gates = validSuite.betaReadinessGates.gates;
  
  const audienceGate = gates.find(g => g.gateId === 'gate-audience-flows');
  const monetizationGate = gates.find(g => g.gateId === 'gate-monetization');
  const governanceGate = gates.find(g => g.gateId === 'gate-governance');
  const analyticsGate = gates.find(g => g.gateId === 'gate-analytics');
  const performanceGate = gates.find(g => g.gateId === 'gate-performance');
  
  assert(audienceGate && audienceGate.criteria.minPassRate === 100);
  assert(monetizationGate && monetizationGate.criteria.maxCriticalFailures === 0);
  assert(governanceGate, 'Should have governance gate');
  assert(analyticsGate && analyticsGate.criteria.minPassRate === 95);
  assert(performanceGate && performanceGate.criteria.minPassRate === 99);
});

test('Gates should require sign-off from required roles', () => {
  const validSuite = fixtures.validTestSuites[0];
  const signOff = validSuite.betaReadinessGates.signOffRequired;
  assert(signOff.includes('qa_lead'));
  assert(signOff.includes('product_manager'));
});

test('All gates passed should set readiness to ready', () => {
  const validSuite = fixtures.validTestSuites[0];
  const allGatesPassed = validSuite.betaReadinessGates.gates.every(g => g.status === 'passed');
  assert(allGatesPassed, 'All gates should be passed');
  assertEqual(validSuite.betaReadinessGates.overallReadiness, 'ready');
});

test('Gate criteria should enforce scenario tags', () => {
  const gates = fixtures.betaReadinessGates;
  const audienceGate = gates.find(g => g.gateId === 'gate-audience-flows');
  assert(audienceGate.criteria.requiredScenarioTags.includes('critical_path'));
});

// ============================================
// Validation Tests
// ============================================

console.log('\n=== Validation Tests ===\n');

test('Valid test suite should pass schema validation', () => {
  const validSuite = fixtures.validTestSuites[0];
  assert(validSuite.testSuiteId.startsWith('beta-e2e-'));
  assert(validSuite.version.match(/^\d+\.\d+\.\d+$/));
  assertIncludes(['pre_beta', 'internal_beta', 'closed_beta', 'open_beta', 'production_validation'], validSuite.testPhase);
  assertIncludes(['draft', 'active', 'paused', 'completed', 'archived'], validSuite.status);
});

test('Invalid test suite missing testSuiteId should fail', () => {
  const invalid = fixtures.invalidTestSuites[0];
  assert(invalid.description === 'Missing testSuiteId');
  assert(!invalid.data.testSuiteId);
});

test('Invalid test suite with wrong testSuiteId pattern should fail', () => {
  const invalid = fixtures.invalidTestSuites[1];
  assert(invalid.description === 'Invalid testSuiteId pattern');
  assert(!invalid.data.testSuiteId.startsWith('beta-e2e-'));
});

test('Invalid test suite with wrong testPhase should fail', () => {
  const invalid = fixtures.invalidTestSuites[2];
  assert(invalid.description === 'Invalid testPhase');
  assert(!['pre_beta', 'internal_beta', 'closed_beta', 'open_beta', 'production_validation'].includes(invalid.data.testPhase));
});

test('Invalid test suite with wrong status should fail', () => {
  const invalid = fixtures.invalidTestSuites[3];
  assert(invalid.description === 'Invalid status');
  assert(!['draft', 'active', 'paused', 'completed', 'archived'].includes(invalid.data.status));
});

// ============================================
// Summary
// ============================================

console.log('\n========================================');
console.log(`Beta E2E Testing Tests: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}

export { passed, failed };
