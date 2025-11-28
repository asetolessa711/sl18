/**
 * Beta Cohort Playbook Tests
 * Phase 33 Addendum: Validates cohort structure, readiness gates, feedback loops, and CEO dashboard
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schema = JSON.parse(readFileSync(join(__dirname, '../../schemas/beta_cohort_playbook.schema.json'), 'utf8'));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures/beta_cohort.json'), 'utf8'));

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
  assert(schema.title === 'BetaCohortPlaybook', 'Title mismatch');
});

test('Schema has playbook ID pattern', () => {
  assert(schema.properties.playbookId.pattern === '^beta-cohort-[a-z0-9-]+$', 'Playbook ID pattern mismatch');
});

test('Schema has version pattern', () => {
  assert(schema.properties.version.pattern === '^\\d+\\.\\d+\\.\\d+$', 'Version pattern mismatch');
});

test('Schema requires playbookId, version, playbookName, cohortStructure, readinessGates, status', () => {
  const required = schema.required;
  assert(required.includes('playbookId'), 'Missing playbookId');
  assert(required.includes('version'), 'Missing version');
  assert(required.includes('playbookName'), 'Missing playbookName');
  assert(required.includes('cohortStructure'), 'Missing cohortStructure');
  assert(required.includes('readinessGates'), 'Missing readinessGates');
  assert(required.includes('status'), 'Missing status');
});

// ============ Cohort Structure Tests ============

test('Cohort structure has phases array', () => {
  assert(schema.properties.cohortStructure.properties.phases.type === 'array', 'Phases should be array');
});

test('Cohort phases have valid names enum', () => {
  const nameEnum = schema.properties.cohortStructure.properties.phases.items.properties.name.enum;
  assert(nameEnum.includes('internal_beta'), 'Missing internal_beta');
  assert(nameEnum.includes('closed_beta'), 'Missing closed_beta');
  assert(nameEnum.includes('open_beta'), 'Missing open_beta');
  assert(nameEnum.includes('production_validation'), 'Missing production_validation');
});

test('Cohort phase has audience configuration', () => {
  const audienceProps = schema.properties.cohortStructure.properties.phases.items.properties.audience.properties;
  assert(audienceProps.type, 'Missing audience type');
  assert(audienceProps.targetSize, 'Missing targetSize');
  assert(audienceProps.regionalDiversity, 'Missing regionalDiversity');
  assert(audienceProps.inviteOnly, 'Missing inviteOnly');
});

test('Audience types include all valid options', () => {
  const typeEnum = schema.properties.cohortStructure.properties.phases.items.properties.audience.properties.type.enum;
  fixtures.validAudienceTypes.forEach(t => {
    assert(typeEnum.includes(t), `Missing audience type: ${t}`);
  });
});

test('Test focus areas include all required options', () => {
  const focusEnum = schema.properties.cohortStructure.properties.phases.items.properties.testFocus.items.enum;
  fixtures.validTestFocusAreas.forEach(f => {
    assert(focusEnum.includes(f), `Missing test focus: ${f}`);
  });
});

test('Cohort phase has feedback loop configuration', () => {
  const feedbackLoop = schema.properties.cohortStructure.properties.phases.items.properties.feedbackLoop.properties;
  assert(feedbackLoop.channels, 'Missing feedback channels');
  assert(feedbackLoop.frequency, 'Missing frequency');
  assert(feedbackLoop.escalationPath, 'Missing escalationPath');
});

test('Feedback channels include all valid options', () => {
  const channelsEnum = schema.properties.cohortStructure.properties.phases.items.properties.feedbackLoop.properties.channels.items.enum;
  fixtures.validFeedbackChannels.forEach(c => {
    assert(channelsEnum.includes(c), `Missing feedback channel: ${c}`);
  });
});

test('Cohort phase has entry gates and exit criteria', () => {
  const phaseProps = schema.properties.cohortStructure.properties.phases.items.properties;
  assert(phaseProps.entryGates, 'Missing entryGates');
  assert(phaseProps.exitCriteria, 'Missing exitCriteria');
});

test('Gate statuses include all valid options', () => {
  const statusEnum = schema.properties.cohortStructure.properties.phases.items.properties.entryGates.items.properties.status.enum;
  fixtures.validGateStatuses.forEach(s => {
    assert(statusEnum.includes(s), `Missing gate status: ${s}`);
  });
});

test('Exit criteria has operator enum', () => {
  const operatorEnum = schema.properties.cohortStructure.properties.phases.items.properties.exitCriteria.items.properties.operator.enum;
  assert(operatorEnum.includes('>='), 'Missing >=');
  assert(operatorEnum.includes('<='), 'Missing <=');
  assert(operatorEnum.includes('=='), 'Missing ==');
});

// ============ Readiness Gates Tests ============

test('Readiness gates has all categories', () => {
  const gates = schema.properties.readinessGates.properties;
  assert(gates.technical, 'Missing technical gates');
  assert(gates.governance, 'Missing governance gates');
  assert(gates.monetization, 'Missing monetization gates');
  assert(gates.analytics, 'Missing analytics gates');
  assert(gates.marketing, 'Missing marketing gates');
  assert(gates.overallReadiness, 'Missing overallReadiness');
});

test('Overall readiness has valid states', () => {
  const statesEnum = schema.properties.readinessGates.properties.overallReadiness.enum;
  fixtures.validReadinessStates.forEach(s => {
    assert(statesEnum.includes(s), `Missing readiness state: ${s}`);
  });
});

test('Technical gates have default configuration', () => {
  const techGates = schema.properties.readinessGates.properties.technical.properties.gates.default;
  assert(techGates.length >= 4, 'Should have at least 4 default technical gates');
  assert(techGates.some(g => g.name.includes('E2E')), 'Should have E2E test gate');
  assert(techGates.some(g => g.name.includes('Infrastructure')), 'Should have infrastructure gate');
});

test('Governance gates have default configuration', () => {
  const govGates = schema.properties.readinessGates.properties.governance.properties.gates.default;
  assert(govGates.length >= 4, 'Should have at least 4 default governance gates');
  assert(govGates.some(g => g.name.includes('Moderation')), 'Should have moderation gate');
  assert(govGates.some(g => g.name.includes('Copyright')), 'Should have copyright gate');
});

test('Monetization gates have default configuration', () => {
  const monGates = schema.properties.readinessGates.properties.monetization.properties.gates.default;
  assert(monGates.length >= 5, 'Should have at least 5 default monetization gates');
  assert(monGates.some(g => g.name.includes('Payment')), 'Should have payment gate');
  assert(monGates.some(g => g.name.includes('Fraud')), 'Should have fraud detection gate');
});

test('Analytics gates have default configuration', () => {
  const analyticsGates = schema.properties.readinessGates.properties.analytics.properties.gates.default;
  assert(analyticsGates.length >= 4, 'Should have at least 4 default analytics gates');
  assert(analyticsGates.some(g => g.name.includes('Funnel')), 'Should have funnel tracking gate');
  assert(analyticsGates.some(g => g.name.includes('Attribution')), 'Should have attribution gate');
});

test('Marketing gates have default configuration', () => {
  const mktGates = schema.properties.readinessGates.properties.marketing.properties.gates.default;
  assert(mktGates.length >= 4, 'Should have at least 4 default marketing gates');
  assert(mktGates.some(g => g.name.includes('Social')), 'Should have social accounts gate');
  assert(mktGates.some(g => g.name.includes('Campaign')), 'Should have campaign calendar gate');
});

// ============ Feedback Collection Tests ============

test('Feedback collection has channels array', () => {
  assert(schema.properties.feedbackCollection.properties.channels.type === 'array', 'Channels should be array');
});

test('Feedback channel types are comprehensive', () => {
  const typeEnum = schema.properties.feedbackCollection.properties.channels.items.properties.type.enum;
  assert(typeEnum.includes('survey'), 'Missing survey');
  assert(typeEnum.includes('forum'), 'Missing forum');
  assert(typeEnum.includes('in_app'), 'Missing in_app');
  assert(typeEnum.includes('analytics'), 'Missing analytics');
  assert(typeEnum.includes('social_listening'), 'Missing social_listening');
});

test('Feedback collection has analysis config', () => {
  const analysisConfig = schema.properties.feedbackCollection.properties.analysisConfig.properties;
  assert(analysisConfig.sentimentAnalysis, 'Missing sentimentAnalysis');
  assert(analysisConfig.categoryTagging, 'Missing categoryTagging');
  assert(analysisConfig.trendDetection, 'Missing trendDetection');
  assert(analysisConfig.anomalyAlerts, 'Missing anomalyAlerts');
});

test('Escalation rules have severity levels', () => {
  const severityEnum = schema.properties.feedbackCollection.properties.escalationRules.items.properties.severity.enum;
  fixtures.validIssueSeverities.forEach(s => {
    assert(severityEnum.includes(s), `Missing severity: ${s}`);
  });
});

// ============ Issue Tracking Tests ============

test('Issue tracking has categories', () => {
  const categoriesDefault = schema.properties.issueTracking.properties.categories.default;
  // Check that the core categories are present
  assert(categoriesDefault.includes('critical_bug'), 'Missing critical_bug');
  assert(categoriesDefault.includes('high_bug'), 'Missing high_bug');
  assert(categoriesDefault.includes('medium_bug'), 'Missing medium_bug');
  assert(categoriesDefault.includes('security_issue'), 'Missing security_issue');
  assert(categoriesDefault.includes('monetization_issue'), 'Missing monetization_issue');
  assert(categoriesDefault.includes('governance_issue'), 'Missing governance_issue');
});

test('Issue tracking has SLA configuration', () => {
  const sla = schema.properties.issueTracking.properties.slaByCategory.properties;
  assert(sla.critical_bug, 'Missing critical_bug SLA');
  assert(sla.security_issue, 'Missing security_issue SLA');
  assert(sla.monetization_issue, 'Missing monetization_issue SLA');
});

test('Critical bug SLA is aggressive', () => {
  const criticalSla = schema.properties.issueTracking.properties.slaByCategory.properties.critical_bug.properties;
  assert(criticalSla.responseMinutes.default <= 15, 'Critical response should be ≤15 min');
  assert(criticalSla.resolutionHours.default <= 4, 'Critical resolution should be ≤4 hours');
});

test('Security issue SLA is most aggressive', () => {
  const securitySla = schema.properties.issueTracking.properties.slaByCategory.properties.security_issue.properties;
  assert(securitySla.responseMinutes.default <= 15, 'Security response should be ≤15 min');
  assert(securitySla.resolutionHours.default <= 2, 'Security resolution should be ≤2 hours');
});

test('Issue tracking has triage workflow', () => {
  const triage = schema.properties.issueTracking.properties.triageWorkflow.properties;
  assert(triage.autoCategorizationEnabled, 'Missing autoCategorizationEnabled');
  assert(triage.dailyTriageMeeting, 'Missing dailyTriageMeeting');
  assert(triage.triageOwner, 'Missing triageOwner');
});

// ============ CEO Dashboard Tests ============

test('CEO dashboard has widgets', () => {
  const widgets = schema.properties.ceoDashboard.properties.widgets.default;
  assert(widgets.length >= 8, 'Should have at least 8 default widgets');
});

test('CEO dashboard widget types are valid', () => {
  const typeEnum = schema.properties.ceoDashboard.properties.widgets.items.properties.type.enum;
  fixtures.validDashboardWidgetTypes.forEach(t => {
    assert(typeEnum.includes(t), `Missing widget type: ${t}`);
  });
});

test('CEO dashboard has progress tracker widget', () => {
  const widgets = schema.properties.ceoDashboard.properties.widgets.default;
  assert(widgets.some(w => w.type === 'progress_tracker'), 'Should have progress tracker');
});

test('CEO dashboard has revenue trend widget', () => {
  const widgets = schema.properties.ceoDashboard.properties.widgets.default;
  assert(widgets.some(w => w.name.includes('Revenue')), 'Should have revenue widget');
});

test('CEO dashboard has critical issues widget', () => {
  const widgets = schema.properties.ceoDashboard.properties.widgets.default;
  assert(widgets.some(w => w.name.includes('Critical')), 'Should have critical issues widget');
});

test('CEO dashboard has daily briefing', () => {
  const briefing = schema.properties.ceoDashboard.properties.dailyBriefing.properties;
  assert(briefing.enabled, 'Missing enabled');
  assert(briefing.deliveryTime, 'Missing deliveryTime');
  assert(briefing.deliveryChannels, 'Missing deliveryChannels');
  assert(briefing.includeMetrics, 'Missing includeMetrics');
});

test('CEO escalation alerts are configured', () => {
  const alerts = schema.properties.ceoDashboard.properties.escalationAlerts.properties;
  assert(alerts.enabled, 'Missing enabled');
  assert(alerts.alertTypes, 'Missing alertTypes');
  assert(alerts.channels, 'Missing channels');
});

test('CEO escalation includes SMS and Slack', () => {
  const channels = schema.properties.ceoDashboard.properties.escalationAlerts.properties.channels.default;
  assert(channels.includes('sms'), 'Should include SMS');
  assert(channels.includes('slack'), 'Should include Slack');
});

// ============ Team Assignments Tests ============

test('Team assignments has roles array', () => {
  assert(schema.properties.teamAssignments.properties.roles.type === 'array', 'Roles should be array');
});

test('Default roles include CEO', () => {
  const roles = schema.properties.teamAssignments.properties.roles.default;
  assert(roles.some(r => r.title === 'CEO'), 'Should have CEO role');
});

test('Default roles include QA Lead', () => {
  const roles = schema.properties.teamAssignments.properties.roles.default;
  assert(roles.some(r => r.title === 'QA Lead'), 'Should have QA Lead role');
});

test('Default roles include Product Manager', () => {
  const roles = schema.properties.teamAssignments.properties.roles.default;
  assert(roles.some(r => r.title === 'Product Manager'), 'Should have Product Manager role');
});

test('Roles have escalation levels', () => {
  const roles = schema.properties.teamAssignments.properties.roles.default;
  roles.forEach(r => {
    assert(typeof r.escalationLevel === 'number', `${r.title} should have escalationLevel`);
  });
});

test('CEO has highest escalation level', () => {
  const roles = schema.properties.teamAssignments.properties.roles.default;
  const ceoRole = roles.find(r => r.title === 'CEO');
  const maxLevel = Math.max(...roles.map(r => r.escalationLevel));
  assert(ceoRole.escalationLevel === maxLevel, 'CEO should have highest escalation level');
});

test('Communication channels are configured', () => {
  const channels = schema.properties.teamAssignments.properties.communicationChannels.properties;
  assert(channels.primary, 'Missing primary channel');
  assert(channels.escalation, 'Missing escalation channel');
  assert(channels.documentation, 'Missing documentation channel');
});

// ============ Integrations Tests ============

test('Integrations include E2E testing schema', () => {
  const e2e = schema.properties.integrations.properties.e2eTesting.properties;
  assert(e2e.schemaRef, 'Missing schemaRef');
  assert(e2e.syncEnabled, 'Missing syncEnabled');
});

test('Integrations include campaign calendar schema', () => {
  const calendar = schema.properties.integrations.properties.campaignCalendar.properties;
  assert(calendar.schemaRef, 'Missing schemaRef');
  assert(calendar.syncEnabled, 'Missing syncEnabled');
});

test('Integrations include social analytics schema', () => {
  const social = schema.properties.integrations.properties.socialAnalytics.properties;
  assert(social.schemaRef, 'Missing schemaRef');
});

test('Integrations include monetization analytics schema', () => {
  const mon = schema.properties.integrations.properties.monetizationAnalytics.properties;
  assert(mon.schemaRef, 'Missing schemaRef');
});

test('Airtable integration is configured', () => {
  const airtable = schema.properties.integrations.properties.airtable.properties;
  assert(airtable.enabled, 'Missing enabled');
  assert(airtable.tables, 'Missing tables');
});

test('Slack integration is configured', () => {
  const slack = schema.properties.integrations.properties.slack.properties;
  assert(slack.enabled, 'Missing enabled');
  assert(slack.channels, 'Missing channels');
});

test('Jira integration is configured', () => {
  const jira = schema.properties.integrations.properties.jira.properties;
  assert(jira.enabled, 'Missing enabled');
  assert(jira.issueTypes, 'Missing issueTypes');
});

// ============ Fixture Validation Tests ============

test('Valid playbook fixture has correct structure', () => {
  const playbook = fixtures.validPlaybook;
  assert(playbook.playbookId.match(/^beta-cohort-[a-z0-9-]+$/), 'Invalid playbookId format');
  assert(playbook.version.match(/^\d+\.\d+\.\d+$/), 'Invalid version format');
  assert(playbook.cohortStructure.phases.length > 0, 'Should have phases');
});

test('Valid playbook with all phases has 4 phases', () => {
  const playbook = fixtures.validPlaybookWithAllPhases;
  assert(playbook.cohortStructure.phases.length === 4, 'Should have 4 phases');
});

test('Phases are in correct order', () => {
  const phases = fixtures.validPlaybookWithAllPhases.cohortStructure.phases;
  const orders = phases.map(p => p.order);
  assert(orders[0] === 1 && orders[1] === 2 && orders[2] === 3 && orders[3] === 4, 'Phases should be in order 1-4');
});

test('Valid playbook has CEO dashboard configuration', () => {
  const playbook = fixtures.validPlaybookWithAllPhases;
  assert(playbook.ceoDashboard.enabled === true, 'CEO dashboard should be enabled');
  assert(playbook.ceoDashboard.widgets.length >= 2, 'Should have widgets');
});

test('Valid playbook has team assignments', () => {
  const playbook = fixtures.validPlaybookWithAllPhases;
  assert(playbook.teamAssignments.roles.length >= 2, 'Should have roles');
  assert(playbook.teamAssignments.roles.some(r => r.title === 'CEO'), 'Should have CEO');
});

test('Valid playbook has integrations', () => {
  const playbook = fixtures.validPlaybookWithAllPhases;
  assert(playbook.integrations.e2eTesting.syncEnabled === true, 'E2E sync should be enabled');
  assert(playbook.integrations.airtable.enabled === true, 'Airtable should be enabled');
});

test('Sample metrics have realistic values', () => {
  const metrics = fixtures.sampleMetrics;
  assert(metrics.internalBeta.flowCompletionRate >= 90, 'Flow completion should be high');
  assert(metrics.closedBeta.npsScore >= 40, 'NPS should be positive');
  assert(metrics.openBeta.uptime >= 99.9, 'Uptime should be high');
});

// ============ Default Values Tests ============

test('Default cohort phases are configured', () => {
  const defaultPhases = schema.properties.cohortStructure.properties.phases.default;
  assert(defaultPhases.length === 4, 'Should have 4 default phases');
  assert(defaultPhases[0].name === 'internal_beta', 'First phase should be internal_beta');
  assert(defaultPhases[3].name === 'production_validation', 'Last phase should be production_validation');
});

test('Internal beta default has correct audience size', () => {
  const internalPhase = schema.properties.cohortStructure.properties.phases.default[0];
  assert(internalPhase.audience.targetSize === 50, 'Internal beta should target 50 users');
  assert(internalPhase.audience.maxSize === 100, 'Internal beta max should be 100');
});

test('Closed beta default has correct audience size', () => {
  const closedPhase = schema.properties.cohortStructure.properties.phases.default[1];
  assert(closedPhase.audience.targetSize === 500, 'Closed beta should target 500 users');
  assert(closedPhase.audience.maxSize === 1000, 'Closed beta max should be 1000');
});

test('Open beta default has correct audience size', () => {
  const openPhase = schema.properties.cohortStructure.properties.phases.default[2];
  assert(openPhase.audience.targetSize === 10000, 'Open beta should target 10000 users');
  assert(openPhase.audience.maxSize === 25000, 'Open beta max should be 25000');
});

test('Production validation default has correct audience size', () => {
  const prodPhase = schema.properties.cohortStructure.properties.phases.default[3];
  assert(prodPhase.audience.targetSize === 100000, 'Production should target 100000 users');
});

test('Default feedback channels are configured correctly', () => {
  const channels = schema.properties.feedbackCollection.properties.channels.default;
  assert(channels.length >= 7, 'Should have at least 7 default channels');
  assert(channels.some(c => c.type === 'survey'), 'Should have survey channel');
  assert(channels.some(c => c.type === 'analytics'), 'Should have analytics channel');
});

test('Default escalation rules are configured', () => {
  const rules = schema.properties.feedbackCollection.properties.escalationRules.default;
  assert(rules.length >= 4, 'Should have at least 4 default escalation rules');
  assert(rules.some(r => r.trigger.includes('Critical bug')), 'Should have critical bug rule');
  assert(rules.some(r => r.trigger.includes('Payment')), 'Should have payment rule');
});

// Summary
console.log(`\nBeta Cohort Playbook Tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
