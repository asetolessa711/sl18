/**
 * CEO Beta Dashboard Tests
 * Validates the CEO Beta Rollout Dashboard Blueprint with 8 sections and daily usage flow
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schema = JSON.parse(readFileSync(join(__dirname, '../../schemas/ceo_beta_dashboard.schema.json'), 'utf8'));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures/ceo_dashboard.json'), 'utf8'));

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
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ============ Schema Structure Tests ============

test('Schema has correct title', () => {
  assert(schema.title === 'CEOBetaDashboard', 'Title mismatch');
});

test('Schema has dashboard ID pattern', () => {
  assert(schema.properties.dashboardId.pattern === '^ceo-dashboard-[a-z0-9-]+$', 'Dashboard ID pattern mismatch');
});

test('Schema has version pattern', () => {
  assert(schema.properties.version.pattern === '^\\d+\\.\\d+\\.\\d+$', 'Version pattern mismatch');
});

test('Schema requires dashboardId, version, dashboardName, sections, dailyUsageFlow, status', () => {
  const required = schema.required;
  assert(required.includes('dashboardId'), 'Missing required dashboardId');
  assert(required.includes('version'), 'Missing required version');
  assert(required.includes('dashboardName'), 'Missing required dashboardName');
  assert(required.includes('sections'), 'Missing required sections');
  assert(required.includes('dailyUsageFlow'), 'Missing required dailyUsageFlow');
  assert(required.includes('status'), 'Missing required status');
});

// ============ Dashboard Sections Tests ============

test('Schema has 8 dashboard sections', () => {
  const sections = schema.properties.sections.properties;
  const sectionCount = Object.keys(sections).length;
  assert(sectionCount === 8, `Expected 8 sections, got ${sectionCount}`);
});

test('Schema has cohortOverview section', () => {
  assert(schema.properties.sections.properties.cohortOverview, 'Missing cohortOverview section');
});

test('Schema has audienceFlows section', () => {
  assert(schema.properties.sections.properties.audienceFlows, 'Missing audienceFlows section');
});

test('Schema has creatorFlows section', () => {
  assert(schema.properties.sections.properties.creatorFlows, 'Missing creatorFlows section');
});

test('Schema has monetization section', () => {
  assert(schema.properties.sections.properties.monetization, 'Missing monetization section');
});

test('Schema has governance section', () => {
  assert(schema.properties.sections.properties.governance, 'Missing governance section');
});

test('Schema has analyticsAttribution section', () => {
  assert(schema.properties.sections.properties.analyticsAttribution, 'Missing analyticsAttribution section');
});

test('Schema has infrastructure section', () => {
  assert(schema.properties.sections.properties.infrastructure, 'Missing infrastructure section');
});

test('Schema has campaignCalendar section', () => {
  assert(schema.properties.sections.properties.campaignCalendar, 'Missing campaignCalendar section');
});

// ============ Section Structure Tests ============

test('Each section has metrics, visuals, alerts arrays', () => {
  const sections = schema.properties.sections.properties;
  for (const [name, section] of Object.entries(sections)) {
    assert(section.properties.metrics, `${name} missing metrics`);
    assert(section.properties.visuals, `${name} missing visuals`);
    assert(section.properties.alerts, `${name} missing alerts`);
  }
});

test('Cohort Overview has timeline_bar and heatmap visuals', () => {
  const visuals = schema.properties.sections.properties.cohortOverview.properties.visuals.default;
  const types = visuals.map(v => v.type);
  assert(types.includes('timeline_bar'), 'Missing timeline_bar visual');
  assert(types.includes('heatmap'), 'Missing heatmap visual');
});

test('Audience Flows has funnel visual', () => {
  const visuals = schema.properties.sections.properties.audienceFlows.properties.visuals.default;
  const types = visuals.map(v => v.type);
  assert(types.includes('funnel'), 'Missing funnel visual');
});

test('Monetization has stacked_bar and heatmap visuals', () => {
  const visuals = schema.properties.sections.properties.monetization.properties.visuals.default;
  const types = visuals.map(v => v.type);
  assert(types.includes('stacked_bar'), 'Missing stacked_bar visual');
  assert(types.includes('heatmap'), 'Missing heatmap visual');
});

test('Governance has scorecard visual', () => {
  const visuals = schema.properties.sections.properties.governance.properties.visuals.default;
  const types = visuals.map(v => v.type);
  assert(types.includes('scorecard'), 'Missing scorecard visual');
});

test('Infrastructure has gauge visual', () => {
  const visuals = schema.properties.sections.properties.infrastructure.properties.visuals.default;
  const types = visuals.map(v => v.type);
  assert(types.includes('gauge'), 'Missing gauge visual');
});

test('Campaign Calendar has calendar_timeline visual', () => {
  const visuals = schema.properties.sections.properties.campaignCalendar.properties.visuals.default;
  const types = visuals.map(v => v.type);
  assert(types.includes('calendar_timeline'), 'Missing calendar_timeline visual');
});

// ============ Daily Usage Flow Tests ============

test('Schema has dailyUsageFlow with 4 periods', () => {
  const flow = schema.properties.dailyUsageFlow.properties;
  assert(flow.morningReview, 'Missing morningReview');
  assert(flow.middayCheckIn, 'Missing middayCheckIn');
  assert(flow.eveningWrapUp, 'Missing eveningWrapUp');
  assert(flow.weeklyDeepDive, 'Missing weeklyDeepDive');
});

test('Morning review defaults to 07:00', () => {
  const time = schema.properties.dailyUsageFlow.properties.morningReview.properties.time.default;
  assert(time === '07:00', `Expected 07:00, got ${time}`);
});

test('Midday check-in defaults to 12:00', () => {
  const time = schema.properties.dailyUsageFlow.properties.middayCheckIn.properties.time.default;
  assert(time === '12:00', `Expected 12:00, got ${time}`);
});

test('Evening wrap-up defaults to 18:00', () => {
  const time = schema.properties.dailyUsageFlow.properties.eveningWrapUp.properties.time.default;
  assert(time === '18:00', `Expected 18:00, got ${time}`);
});

test('Weekly deep dive defaults to Monday', () => {
  const day = schema.properties.dailyUsageFlow.properties.weeklyDeepDive.properties.day.default;
  assert(day === 'Monday', `Expected Monday, got ${day}`);
});

test('Each flow period has tasks with priority', () => {
  const flow = schema.properties.dailyUsageFlow.properties;
  for (const [name, period] of Object.entries(flow)) {
    assert(period.properties.tasks, `${name} missing tasks`);
    const taskProps = period.properties.tasks.items.properties;
    assert(taskProps.priority, `${name} tasks missing priority`);
  }
});

// ============ Alert Configuration Tests ============

test('Schema has alert configuration', () => {
  assert(schema.properties.alertConfiguration, 'Missing alertConfiguration');
});

test('Alert configuration has CEO escalation channels', () => {
  assert(schema.properties.alertConfiguration.properties.ceoEscalationChannels, 'Missing ceoEscalationChannels');
});

test('Alert configuration has daily digest', () => {
  assert(schema.properties.alertConfiguration.properties.dailyDigest, 'Missing dailyDigest');
});

test('Daily digest includes required metrics', () => {
  const metrics = schema.properties.alertConfiguration.properties.dailyDigest.properties.includeMetrics.default;
  assert(metrics.includes('dau'), 'Missing dau metric');
  assert(metrics.includes('revenue'), 'Missing revenue metric');
  assert(metrics.includes('nps'), 'Missing nps metric');
});

test('Alert prioritization has 4 severity levels', () => {
  const priorities = schema.properties.alertConfiguration.properties.alertPrioritization.default;
  assert(priorities.length === 4, `Expected 4 priorities, got ${priorities.length}`);
});

test('Critical alerts have 15 minute response time', () => {
  const priorities = schema.properties.alertConfiguration.properties.alertPrioritization.default;
  const critical = priorities.find(p => p.severity === 'critical');
  assert(critical.responseTimeMinutes === 15, 'Critical response time should be 15 minutes');
});

// ============ Fixture Validation Tests ============

test('Valid dashboard fixture has correct ID pattern', () => {
  const id = fixtures.validDashboard.dashboardId;
  assert(id.startsWith('ceo-dashboard-'), 'Dashboard ID should start with ceo-dashboard-');
});

test('Valid dashboard fixture has 8 sections', () => {
  const sections = Object.keys(fixtures.validDashboard.sections);
  assert(sections.length === 8, `Expected 8 sections, got ${sections.length}`);
});

test('Valid dashboard fixture has daily usage flow', () => {
  assert(fixtures.validDashboard.dailyUsageFlow, 'Missing dailyUsageFlow');
  assert(fixtures.validDashboard.dailyUsageFlow.morningReview, 'Missing morningReview');
  assert(fixtures.validDashboard.dailyUsageFlow.middayCheckIn, 'Missing middayCheckIn');
  assert(fixtures.validDashboard.dailyUsageFlow.eveningWrapUp, 'Missing eveningWrapUp');
  assert(fixtures.validDashboard.dailyUsageFlow.weeklyDeepDive, 'Missing weeklyDeepDive');
});

test('Valid dashboard fixture has alert configuration', () => {
  assert(fixtures.validDashboard.alertConfiguration, 'Missing alertConfiguration');
  assert(fixtures.validDashboard.alertConfiguration.ceoEscalationChannels, 'Missing escalation channels');
});

test('Valid dashboard fixture has integrations', () => {
  assert(fixtures.validDashboard.integrations, 'Missing integrations');
  assert(fixtures.validDashboard.integrations.betaCohortPlaybook, 'Missing betaCohortPlaybook integration');
});

test('Valid dashboard fixture has access control', () => {
  assert(fixtures.validDashboard.accessControl, 'Missing accessControl');
  assert(fixtures.validDashboard.accessControl.mfaRequired === true, 'MFA should be required');
});

// ============ Visual Types Tests ============

test('Fixtures define all visual types', () => {
  const types = fixtures.visualTypes;
  assert(types.length >= 15, `Expected at least 15 visual types, got ${types.length}`);
  assert(types.includes('timeline_bar'), 'Missing timeline_bar');
  assert(types.includes('heatmap'), 'Missing heatmap');
  assert(types.includes('funnel'), 'Missing funnel');
  assert(types.includes('gauge'), 'Missing gauge');
});

// ============ Metrics Tests ============

test('Cohort metrics include user counts and engagement', () => {
  const metrics = fixtures.testMetrics.cohortMetrics;
  assert(metrics.includes('cohort-users-internal'), 'Missing internal users metric');
  assert(metrics.includes('cohort-engagement-rate'), 'Missing engagement rate metric');
});

test('Monetization metrics include revenue by tier and ad RPM', () => {
  const metrics = fixtures.testMetrics.monetizationMetrics;
  assert(metrics.includes('subscription-revenue-premium'), 'Missing premium revenue metric');
  assert(metrics.includes('ad-rpm-global'), 'Missing ad RPM metric');
});

test('Infrastructure metrics include latency and error rate', () => {
  const metrics = fixtures.testMetrics.infrastructureMetrics;
  assert(metrics.includes('response-latency-p99'), 'Missing P99 latency metric');
  assert(metrics.includes('error-rate'), 'Missing error rate metric');
});

test('Analytics metrics include full funnel stages', () => {
  const metrics = fixtures.testMetrics.analyticsMetrics;
  assert(metrics.includes('funnel-awareness'), 'Missing awareness stage');
  assert(metrics.includes('funnel-purchase'), 'Missing purchase stage');
  assert(metrics.includes('funnel-retention'), 'Missing retention stage');
});

test('Analytics metrics include all 5 attribution models', () => {
  const metrics = fixtures.testMetrics.analyticsMetrics;
  assert(metrics.includes('attribution-last-click'), 'Missing last click');
  assert(metrics.includes('attribution-first-click'), 'Missing first click');
  assert(metrics.includes('attribution-linear'), 'Missing linear');
  assert(metrics.includes('attribution-time-decay'), 'Missing time decay');
  assert(metrics.includes('attribution-data-driven'), 'Missing data driven');
});

// ============ Integration Tests ============

test('Schema has 7 integrations', () => {
  const integrations = schema.properties.integrations.properties;
  const count = Object.keys(integrations).length;
  assert(count === 7, `Expected 7 integrations, got ${count}`);
});

test('Integrations include Beta Cohort Playbook', () => {
  assert(schema.properties.integrations.properties.betaCohortPlaybook, 'Missing betaCohortPlaybook');
});

test('Integrations include Beta E2E Testing', () => {
  assert(schema.properties.integrations.properties.betaE2ETesting, 'Missing betaE2ETesting');
});

test('Integrations include Campaign Calendar', () => {
  assert(schema.properties.integrations.properties.campaignCalendar, 'Missing campaignCalendar');
});

test('Integrations include Monetization Analytics', () => {
  assert(schema.properties.integrations.properties.monetizationAnalytics, 'Missing monetizationAnalytics');
});

test('Integrations include Infrastructure Monitoring', () => {
  assert(schema.properties.integrations.properties.infrastructureMonitoring, 'Missing infrastructureMonitoring');
});

test('Integrations include Governance Suite', () => {
  assert(schema.properties.integrations.properties.governanceSuite, 'Missing governanceSuite');
});

// ============ Access Control Tests ============

test('Schema has access control configuration', () => {
  assert(schema.properties.accessControl, 'Missing accessControl');
});

test('Access control includes authorized roles', () => {
  const roles = schema.properties.accessControl.properties.authorizedRoles.default;
  assert(roles.includes('ceo'), 'CEO should be authorized');
  assert(roles.includes('cto'), 'CTO should be authorized');
});

test('Access control includes read-only roles', () => {
  const roles = schema.properties.accessControl.properties.readOnlyRoles.default;
  assert(roles.includes('product_manager'), 'PM should have read-only access');
});

test('Access control requires MFA by default', () => {
  const mfa = schema.properties.accessControl.properties.mfaRequired.default;
  assert(mfa === true, 'MFA should be required by default');
});

test('Access control has session timeout', () => {
  const timeout = schema.properties.accessControl.properties.sessionTimeoutMinutes.default;
  assert(timeout === 30, 'Session timeout should be 30 minutes');
});

// ============ Status Tests ============

test('Schema has status field', () => {
  assert(schema.properties.status, 'Missing status field');
});

test('Status field has valid enum values', () => {
  const statuses = schema.properties.status.enum;
  assert(statuses.includes('draft'), 'Missing draft status');
  assert(statuses.includes('active'), 'Missing active status');
  assert(statuses.includes('paused'), 'Missing paused status');
  assert(statuses.includes('archived'), 'Missing archived status');
});

// ============ Threshold Tests ============

test('Infrastructure metrics have warning and critical thresholds', () => {
  const metrics = schema.properties.sections.properties.infrastructure.properties.metrics.default;
  const latencyMetric = metrics.find(m => m.metricId === 'response-latency-p99');
  assert(latencyMetric.threshold.warning === 500, 'P99 warning threshold should be 500ms');
  assert(latencyMetric.threshold.critical === 1000, 'P99 critical threshold should be 1000ms');
});

test('Error rate has correct thresholds', () => {
  const metrics = schema.properties.sections.properties.infrastructure.properties.metrics.default;
  const errorMetric = metrics.find(m => m.metricId === 'error-rate');
  assert(errorMetric.threshold.warning === 1, 'Error rate warning should be 1%');
  assert(errorMetric.threshold.critical === 2, 'Error rate critical should be 2%');
});

// ============ Summary ============

console.log('\n========================================');
console.log(`CEO Beta Dashboard Tests: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
