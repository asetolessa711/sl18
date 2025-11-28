/**
 * Phase 30: Short-Form Distribution Ecosystem Tests
 * Tests for distribution connectors, rights management, and observability schemas
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const distributionConnectorsSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/distribution_connectors.schema.json'), 'utf8')
);
const distributionRightsSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/distribution_rights.schema.json'), 'utf8')
);
const distributionObservabilitySchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/distribution_observability.schema.json'), 'utf8')
);
const auditLogSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/audit_log.schema.json'), 'utf8')
);

// Load fixtures
const fixtures = JSON.parse(
  readFileSync(join(__dirname, './fixtures/short_form_distribution.json'), 'utf8')
);

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
    throw new Error(message || `Expected array to include ${item}`);
  }
}

console.log('\n=== Phase 30: Short-Form Distribution Ecosystem Tests ===\n');

// ============== Distribution Connectors Schema Tests ==============

console.log('--- Distribution Connectors Schema Tests ---');

test('Connectors schema has required fields', () => {
  assert(distributionConnectorsSchema.required.includes('connectorId'), 'Missing connectorId');
  assert(distributionConnectorsSchema.required.includes('version'), 'Missing version');
  assert(distributionConnectorsSchema.required.includes('name'), 'Missing name');
  assert(distributionConnectorsSchema.required.includes('partnerInfo'), 'Missing partnerInfo');
  assert(distributionConnectorsSchema.required.includes('apiConfiguration'), 'Missing apiConfiguration');
  assert(distributionConnectorsSchema.required.includes('syndicationRules'), 'Missing syndicationRules');
  assert(distributionConnectorsSchema.required.includes('status'), 'Missing status');
});

test('Connector ID pattern validation', () => {
  const pattern = new RegExp(distributionConnectorsSchema.properties.connectorId.pattern);
  assert(pattern.test('connector-dramabox-global'), 'Valid ID should match');
  assert(!pattern.test('invalid-id'), 'Invalid ID should not match');
});

test('Partner types include short-form platforms', () => {
  const types = distributionConnectorsSchema.properties.partnerInfo.properties.partnerType.enum;
  assertIncludes(types, 'drama_box', 'Missing drama_box type');
  assertIncludes(types, 'realshort', 'Missing realshort type');
  assertIncludes(types, 'mini_drama', 'Missing mini_drama type');
  assertIncludes(types, 'ott_app', 'Missing ott_app type');
  assertIncludes(types, 'streaming_service', 'Missing streaming_service type');
});

test('Partnership tiers are defined', () => {
  const tiers = distributionConnectorsSchema.properties.partnerInfo.properties.tier.enum;
  assertIncludes(tiers, 'strategic', 'Missing strategic tier');
  assertIncludes(tiers, 'premium', 'Missing premium tier');
  assertIncludes(tiers, 'standard', 'Missing standard tier');
  assertIncludes(tiers, 'trial', 'Missing trial tier');
});

test('API authentication types are comprehensive', () => {
  const authTypes = distributionConnectorsSchema.properties.apiConfiguration.properties.authType.enum;
  assertIncludes(authTypes, 'oauth2', 'Missing oauth2');
  assertIncludes(authTypes, 'api_key', 'Missing api_key');
  assertIncludes(authTypes, 'bearer_token', 'Missing bearer_token');
  assertIncludes(authTypes, 'jwt', 'Missing jwt');
  assertIncludes(authTypes, 'hmac', 'Missing hmac');
});

test('API endpoint purposes are defined', () => {
  const endpointSchema = distributionConnectorsSchema.properties.apiConfiguration.properties.endpoints.items;
  const purposes = endpointSchema.properties.purpose.enum;
  assertIncludes(purposes, 'content_upload', 'Missing content_upload');
  assertIncludes(purposes, 'content_update', 'Missing content_update');
  assertIncludes(purposes, 'content_delete', 'Missing content_delete');
  assertIncludes(purposes, 'status_check', 'Missing status_check');
  assertIncludes(purposes, 'analytics_fetch', 'Missing analytics_fetch');
});

test('Webhook events are defined', () => {
  const events = distributionConnectorsSchema.properties.apiConfiguration.properties.webhooks.properties.events.items.enum;
  assertIncludes(events, 'content_published', 'Missing content_published event');
  assertIncludes(events, 'playback_started', 'Missing playback_started event');
  assertIncludes(events, 'playback_completed', 'Missing playback_completed event');
  assertIncludes(events, 'monetization_event', 'Missing monetization_event');
});

test('Syndication content types include short-form', () => {
  const contentTypes = distributionConnectorsSchema.properties.syndicationRules.properties.contentFilters.properties.contentTypes.items.enum;
  assertIncludes(contentTypes, 'short_drama', 'Missing short_drama');
  assertIncludes(contentTypes, 'episode', 'Missing episode');
  assertIncludes(contentTypes, 'movie', 'Missing movie');
  assertIncludes(contentTypes, 'trailer', 'Missing trailer');
  assertIncludes(contentTypes, 'teaser', 'Missing teaser');
});

test('Video formats support short-form requirements', () => {
  const formatSchema = distributionConnectorsSchema.properties.syndicationRules.properties.formatRequirements.properties;
  assert(formatSchema.aspectRatios, 'Missing aspectRatios');
  const aspectRatios = formatSchema.aspectRatios.items.enum;
  assertIncludes(aspectRatios, '9:16', 'Missing 9:16 aspect ratio (vertical/short-form)');
  assertIncludes(aspectRatios, '16:9', 'Missing 16:9 aspect ratio');
});

test('Packaging options support short-form generation', () => {
  const packaging = distributionConnectorsSchema.properties.syndicationRules.properties.packagingOptions.properties;
  assert(packaging.generateTeasers !== undefined, 'Missing generateTeasers');
  assert(packaging.generateVerticalClips !== undefined, 'Missing generateVerticalClips');
  assert(packaging.teaserDurationSeconds !== undefined, 'Missing teaserDurationSeconds');
});

test('Compliance settings are comprehensive', () => {
  const compliance = distributionConnectorsSchema.properties.complianceSettings.properties;
  assert(compliance.qcRequirements, 'Missing qcRequirements');
  assert(compliance.culturalSensitivity, 'Missing culturalSensitivity');
  assert(compliance.contentModeration, 'Missing contentModeration');
  assert(compliance.auditLogging, 'Missing auditLogging');
});

test('Health monitoring with circuit breaker', () => {
  const health = distributionConnectorsSchema.properties.healthMonitoring.properties;
  assert(health.healthCheckEnabled !== undefined, 'Missing healthCheckEnabled');
  assert(health.circuitBreaker, 'Missing circuitBreaker');
  assert(health.alertThresholds, 'Missing alertThresholds');
});

test('Connector statuses are defined', () => {
  const statuses = distributionConnectorsSchema.properties.status.enum;
  assertIncludes(statuses, 'active', 'Missing active status');
  assertIncludes(statuses, 'inactive', 'Missing inactive status');
  assertIncludes(statuses, 'maintenance', 'Missing maintenance status');
  assertIncludes(statuses, 'suspended', 'Missing suspended status');
});

test('Fixture: Connector data is valid', () => {
  const connector = fixtures.distributionConnector;
  assert(connector.connectorId === 'connector-dramabox-global', 'Invalid connectorId');
  assert(connector.partnerInfo.partnerType === 'drama_box', 'Partner type should be drama_box');
  assert(connector.status === 'active', 'Status should be active');
});

test('Fixture: API configuration is complete', () => {
  const api = fixtures.distributionConnector.apiConfiguration;
  assert(api.baseUrl.startsWith('https://'), 'API URL should be HTTPS');
  assert(api.authType === 'oauth2', 'Should use oauth2');
  assert(api.endpoints.length >= 4, 'Should have at least 4 endpoints');
  assert(api.webhooks.enabled === true, 'Webhooks should be enabled');
});

test('Fixture: Syndication rules are configured', () => {
  const rules = fixtures.distributionConnector.syndicationRules;
  assert(rules.approvalRequired === true, 'Approval should be required');
  assert(rules.contentFilters.contentTypes.includes('short_drama'), 'Should include short_drama');
  assert(rules.formatRequirements.aspectRatios.includes('9:16'), 'Should support vertical format');
});

test('Fixture: Health monitoring is enabled', () => {
  const health = fixtures.distributionConnector.healthMonitoring;
  assert(health.healthCheckEnabled === true, 'Health check should be enabled');
  assert(health.circuitBreaker.enabled === true, 'Circuit breaker should be enabled');
});

// ============== Distribution Rights Schema Tests ==============

console.log('\n--- Distribution Rights Schema Tests ---');

test('Rights schema has required fields', () => {
  assert(distributionRightsSchema.required.includes('rightsId'), 'Missing rightsId');
  assert(distributionRightsSchema.required.includes('version'), 'Missing version');
  assert(distributionRightsSchema.required.includes('contentScope'), 'Missing contentScope');
  assert(distributionRightsSchema.required.includes('licensing'), 'Missing licensing');
  assert(distributionRightsSchema.required.includes('revenueShare'), 'Missing revenueShare');
  assert(distributionRightsSchema.required.includes('status'), 'Missing status');
});

test('Rights ID pattern validation', () => {
  const pattern = new RegExp(distributionRightsSchema.properties.rightsId.pattern);
  assert(pattern.test('rights-waliin-dramabox-global'), 'Valid ID should match');
  assert(!pattern.test('invalid'), 'Invalid ID should not match');
});

test('License types are comprehensive', () => {
  const types = distributionRightsSchema.properties.licensing.properties.licenseType.enum;
  assertIncludes(types, 'exclusive', 'Missing exclusive');
  assertIncludes(types, 'non_exclusive', 'Missing non_exclusive');
  assertIncludes(types, 'co_exclusive', 'Missing co_exclusive');
  assertIncludes(types, 'first_run', 'Missing first_run');
  assertIncludes(types, 'library', 'Missing library');
});

test('Territory types are defined', () => {
  const types = distributionRightsSchema.properties.licensing.properties.territory.properties.type.enum;
  assertIncludes(types, 'worldwide', 'Missing worldwide');
  assertIncludes(types, 'regional', 'Missing regional');
  assertIncludes(types, 'country_specific', 'Missing country_specific');
});

test('Rights categories include short-form', () => {
  const rights = distributionRightsSchema.properties.licensing.properties.rights.properties;
  assert(rights.streaming !== undefined, 'Missing streaming rights');
  assert(rights.shortForm !== undefined, 'Missing shortForm rights');
  assert(rights.socialMedia !== undefined, 'Missing socialMedia rights');
  assert(rights.download !== undefined, 'Missing download rights');
});

test('Revenue share models are defined', () => {
  const models = distributionRightsSchema.properties.revenueShare.properties.model.enum;
  assertIncludes(models, 'percentage', 'Missing percentage');
  assertIncludes(models, 'flat_fee', 'Missing flat_fee');
  assertIncludes(models, 'tiered', 'Missing tiered');
  assertIncludes(models, 'hybrid', 'Missing hybrid');
  assertIncludes(models, 'minimum_guarantee', 'Missing minimum_guarantee');
});

test('Revenue split fields are defined', () => {
  const splits = distributionRightsSchema.properties.revenueShare.properties.splits.properties;
  assert(splits.contentOwnerPercent !== undefined, 'Missing contentOwnerPercent');
  assert(splits.partnerPercent !== undefined, 'Missing partnerPercent');
  assert(splits.platformPercent !== undefined, 'Missing platformPercent');
});

test('Payment terms are comprehensive', () => {
  const terms = distributionRightsSchema.properties.revenueShare.properties.paymentTerms.properties;
  assert(terms.frequency, 'Missing payment frequency');
  assert(terms.netDays !== undefined, 'Missing netDays');
  assert(terms.minimumPayout !== undefined, 'Missing minimumPayout');
  assert(terms.paymentMethod, 'Missing paymentMethod');
});

test('Geo-restrictions are configurable', () => {
  const geo = distributionRightsSchema.properties.geoRestrictions.properties;
  assert(geo.enabled !== undefined, 'Missing enabled');
  assert(geo.defaultPolicy, 'Missing defaultPolicy');
  assert(geo.allowedCountries, 'Missing allowedCountries');
  assert(geo.blockedCountries, 'Missing blockedCountries');
  assert(geo.vpnDetection, 'Missing vpnDetection');
});

test('Ad insertion options are defined', () => {
  const ads = distributionRightsSchema.properties.adInsertion.properties;
  assert(ads.enabled !== undefined, 'Missing enabled');
  assert(ads.adModel, 'Missing adModel');
  assert(ads.adTypes, 'Missing adTypes');
  assert(ads.adFrequency, 'Missing adFrequency');
  assert(ads.adRevenueShare, 'Missing adRevenueShare');
});

test('Ad types include short-form options', () => {
  const types = distributionRightsSchema.properties.adInsertion.properties.adTypes.items.enum;
  assertIncludes(types, 'pre_roll', 'Missing pre_roll');
  assertIncludes(types, 'mid_roll', 'Missing mid_roll');
  assertIncludes(types, 'rewarded', 'Missing rewarded');
});

test('Window management supports release windows', () => {
  const windows = distributionRightsSchema.properties.windowManagement.properties;
  assert(windows.windows, 'Missing windows array');
  assert(windows.cascadeRules, 'Missing cascadeRules');
});

test('Window types are defined', () => {
  const windowSchema = distributionRightsSchema.properties.windowManagement.properties.windows.items;
  const types = windowSchema.properties.windowType.enum;
  assertIncludes(types, 'premium_vod', 'Missing premium_vod');
  assertIncludes(types, 'svod', 'Missing svod');
  assertIncludes(types, 'avod', 'Missing avod');
  assertIncludes(types, 'tvod', 'Missing tvod');
  assertIncludes(types, 'free', 'Missing free');
});

test('Rights statuses are defined', () => {
  const statuses = distributionRightsSchema.properties.status.enum;
  assertIncludes(statuses, 'active', 'Missing active');
  assertIncludes(statuses, 'pending', 'Missing pending');
  assertIncludes(statuses, 'expired', 'Missing expired');
  assertIncludes(statuses, 'terminated', 'Missing terminated');
});

test('Fixture: Rights data is valid', () => {
  const rights = fixtures.distributionRights;
  assert(rights.rightsId === 'rights-waliin-dramabox-global', 'Invalid rightsId');
  assert(rights.licensing.licenseType === 'non_exclusive', 'License type should be non_exclusive');
  assert(rights.status === 'active', 'Status should be active');
});

test('Fixture: Territory configuration is complete', () => {
  const territory = fixtures.distributionRights.licensing.territory;
  assert(territory.type === 'regional', 'Territory type should be regional');
  assert(territory.regions.length >= 3, 'Should have at least 3 regions');
  assert(territory.countries.length >= 5, 'Should have at least 5 countries');
});

test('Fixture: Revenue share has tiered rates', () => {
  const revenue = fixtures.distributionRights.revenueShare;
  assert(revenue.model === 'tiered', 'Model should be tiered');
  assert(revenue.tieredRates.length >= 3, 'Should have at least 3 tiers');
  assert(revenue.minimumGuarantee.enabled === true, 'Minimum guarantee should be enabled');
});

test('Fixture: Geo-restrictions are properly configured', () => {
  const geo = fixtures.distributionRights.geoRestrictions;
  assert(geo.enabled === true, 'Geo restrictions should be enabled');
  assert(geo.allowedCountries.length >= 10, 'Should have at least 10 allowed countries');
  assert(geo.vpnDetection.action === 'block', 'VPN should be blocked');
});

test('Fixture: Ad insertion is configured', () => {
  const ads = fixtures.distributionRights.adInsertion;
  assert(ads.enabled === true, 'Ads should be enabled');
  assert(ads.adModel === 'hybrid', 'Ad model should be hybrid');
  assert(ads.ssaiEnabled === true, 'SSAI should be enabled');
});

test('Fixture: Window management has cascade rules', () => {
  const windows = fixtures.distributionRights.windowManagement;
  assert(windows.windows.length >= 3, 'Should have at least 3 windows');
  assert(windows.cascadeRules.length >= 2, 'Should have at least 2 cascade rules');
});

// ============== Distribution Observability Schema Tests ==============

console.log('\n--- Distribution Observability Schema Tests ---');

test('Observability schema has required fields', () => {
  assert(distributionObservabilitySchema.required.includes('observabilityId'), 'Missing observabilityId');
  assert(distributionObservabilitySchema.required.includes('version'), 'Missing version');
  assert(distributionObservabilitySchema.required.includes('name'), 'Missing name');
  assert(distributionObservabilitySchema.required.includes('scope'), 'Missing scope');
  assert(distributionObservabilitySchema.required.includes('partnerMetrics'), 'Missing partnerMetrics');
  assert(distributionObservabilitySchema.required.includes('status'), 'Missing status');
});

test('Observability ID pattern validation', () => {
  const pattern = new RegExp(distributionObservabilitySchema.properties.observabilityId.pattern);
  assert(pattern.test('dist-obs-global-001'), 'Valid ID should match');
  assert(!pattern.test('invalid'), 'Invalid ID should not match');
});

test('Scope levels are defined', () => {
  const levels = distributionObservabilitySchema.properties.scope.properties.level.enum;
  assertIncludes(levels, 'global', 'Missing global');
  assertIncludes(levels, 'partner', 'Missing partner');
  assertIncludes(levels, 'connector', 'Missing connector');
  assertIncludes(levels, 'content', 'Missing content');
});

test('Metric categories are comprehensive', () => {
  const metricSchema = distributionObservabilitySchema.properties.partnerMetrics.properties.metrics.items;
  const categories = metricSchema.properties.category.enum;
  assertIncludes(categories, 'performance', 'Missing performance');
  assertIncludes(categories, 'engagement', 'Missing engagement');
  assertIncludes(categories, 'monetization', 'Missing monetization');
  assertIncludes(categories, 'quality', 'Missing quality');
  assertIncludes(categories, 'health', 'Missing health');
});

test('Metric types are defined', () => {
  const metricSchema = distributionObservabilitySchema.properties.partnerMetrics.properties.metrics.items;
  const types = metricSchema.properties.type.enum;
  assertIncludes(types, 'counter', 'Missing counter');
  assertIncludes(types, 'gauge', 'Missing gauge');
  assertIncludes(types, 'histogram', 'Missing histogram');
});

test('Performance metrics are configurable', () => {
  const perf = distributionObservabilitySchema.properties.partnerMetrics.properties.performanceMetrics.properties;
  assert(perf.views !== undefined, 'Missing views');
  assert(perf.watchTime !== undefined, 'Missing watchTime');
  assert(perf.completionRate !== undefined, 'Missing completionRate');
  assert(perf.rebufferRatio !== undefined, 'Missing rebufferRatio');
});

test('Engagement metrics are configurable', () => {
  const eng = distributionObservabilitySchema.properties.partnerMetrics.properties.engagementMetrics.properties;
  assert(eng.likes !== undefined, 'Missing likes');
  assert(eng.shares !== undefined, 'Missing shares');
  assert(eng.clickThroughRate !== undefined, 'Missing clickThroughRate');
});

test('Monetization metrics are configurable', () => {
  const mon = distributionObservabilitySchema.properties.partnerMetrics.properties.monetizationMetrics.properties;
  assert(mon.grossRevenue !== undefined, 'Missing grossRevenue');
  assert(mon.adRevenue !== undefined, 'Missing adRevenue');
  assert(mon.cpm !== undefined, 'Missing cpm');
});

test('Dashboard types are defined', () => {
  const dashSchema = distributionObservabilitySchema.properties.syndicationDashboards.properties.dashboards.items;
  const types = dashSchema.properties.type.enum;
  assertIncludes(types, 'overview', 'Missing overview');
  assertIncludes(types, 'partner_performance', 'Missing partner_performance');
  assertIncludes(types, 'error_tracking', 'Missing error_tracking');
  assertIncludes(types, 'real_time', 'Missing real_time');
});

test('Widget types are comprehensive', () => {
  const widgetSchema = distributionObservabilitySchema.properties.syndicationDashboards.properties.dashboards.items.properties.widgets.items;
  const types = widgetSchema.properties.type.enum;
  assertIncludes(types, 'kpi_card', 'Missing kpi_card');
  assertIncludes(types, 'line_chart', 'Missing line_chart');
  assertIncludes(types, 'bar_chart', 'Missing bar_chart');
  assertIncludes(types, 'map', 'Missing map');
  assertIncludes(types, 'heatmap', 'Missing heatmap');
  assertIncludes(types, 'status_grid', 'Missing status_grid');
});

test('Error categories cover syndication failures', () => {
  const errorSchema = distributionObservabilitySchema.properties.errorTracking.properties.errorCategories.items;
  const categories = errorSchema.properties.category.enum;
  assertIncludes(categories, 'api_error', 'Missing api_error');
  assertIncludes(categories, 'format_mismatch', 'Missing format_mismatch');
  assertIncludes(categories, 'auth_error', 'Missing auth_error');
  assertIncludes(categories, 'rate_limit', 'Missing rate_limit');
  assertIncludes(categories, 'geo_block', 'Missing geo_block');
});

test('Error severities are defined', () => {
  const errorSchema = distributionObservabilitySchema.properties.errorTracking.properties.errorCategories.items;
  const severities = errorSchema.properties.severity.enum;
  assertIncludes(severities, 'critical', 'Missing critical');
  assertIncludes(severities, 'high', 'Missing high');
  assertIncludes(severities, 'medium', 'Missing medium');
  assertIncludes(severities, 'low', 'Missing low');
});

test('Notification channels are defined', () => {
  const channels = distributionObservabilitySchema.properties.errorTracking.properties.notifications.properties.channels.items.enum;
  assertIncludes(channels, 'email', 'Missing email');
  assertIncludes(channels, 'slack', 'Missing slack');
  assertIncludes(channels, 'pagerduty', 'Missing pagerduty');
  assertIncludes(channels, 'webhook', 'Missing webhook');
});

test('Alert rule types are defined', () => {
  const ruleSchema = distributionObservabilitySchema.properties.alerts.properties.alertRules.items;
  const types = ruleSchema.properties.type.enum;
  assertIncludes(types, 'threshold', 'Missing threshold');
  assertIncludes(types, 'anomaly', 'Missing anomaly');
  assertIncludes(types, 'trend', 'Missing trend');
  assertIncludes(types, 'absence', 'Missing absence');
});

test('Compliance alerts are configurable', () => {
  const compliance = distributionObservabilitySchema.properties.alerts.properties.complianceAlerts.properties;
  assert(compliance.rightsExpiring, 'Missing rightsExpiring');
  assert(compliance.geoViolation !== undefined, 'Missing geoViolation');
  assert(compliance.qcFailure !== undefined, 'Missing qcFailure');
});

test('Report types are defined', () => {
  const reportSchema = distributionObservabilitySchema.properties.reporting.properties.scheduledReports.items;
  const types = reportSchema.properties.type.enum;
  assertIncludes(types, 'partner_summary', 'Missing partner_summary');
  assertIncludes(types, 'revenue_breakdown', 'Missing revenue_breakdown');
  assertIncludes(types, 'error_summary', 'Missing error_summary');
});

test('Integrations are configurable', () => {
  const integrations = distributionObservabilitySchema.properties.integrations.properties;
  assert(integrations.datadog, 'Missing datadog integration');
  assert(integrations.slack, 'Missing slack integration');
  assert(integrations.pagerduty, 'Missing pagerduty integration');
  assert(integrations.grafana, 'Missing grafana integration');
});

test('Fixture: Observability data is valid', () => {
  const obs = fixtures.distributionObservability;
  assert(obs.observabilityId === 'dist-obs-global-001', 'Invalid observabilityId');
  assert(obs.scope.level === 'global', 'Scope should be global');
  assert(obs.status === 'active', 'Status should be active');
});

test('Fixture: Partner metrics are configured', () => {
  const metrics = fixtures.distributionObservability.partnerMetrics;
  assert(metrics.enabled === true, 'Metrics should be enabled');
  assert(metrics.metrics.length >= 5, 'Should have at least 5 custom metrics');
  assert(metrics.performanceMetrics.views === true, 'Views tracking should be enabled');
});

test('Fixture: Dashboards are comprehensive', () => {
  const dashboards = fixtures.distributionObservability.syndicationDashboards;
  assert(dashboards.enabled === true, 'Dashboards should be enabled');
  assert(dashboards.dashboards.length >= 4, 'Should have at least 4 dashboards');
  assert(dashboards.dashboards.some(d => d.type === 'real_time'), 'Should have real-time dashboard');
});

test('Fixture: Error tracking is configured', () => {
  const errors = fixtures.distributionObservability.errorTracking;
  assert(errors.enabled === true, 'Error tracking should be enabled');
  assert(errors.errorCategories.length >= 5, 'Should have at least 5 error categories');
  assert(errors.notifications.escalation.length >= 3, 'Should have at least 3 escalation levels');
});

test('Fixture: Alerts are configured', () => {
  const alerts = fixtures.distributionObservability.alerts;
  assert(alerts.enabled === true, 'Alerts should be enabled');
  assert(alerts.alertRules.length >= 3, 'Should have at least 3 alert rules');
  assert(alerts.complianceAlerts.rightsExpiring.daysBeforeWarning > 0, 'Should have rights expiring warning');
});

test('Fixture: Scheduled reports are configured', () => {
  const reports = fixtures.distributionObservability.reporting.scheduledReports;
  assert(reports.length >= 3, 'Should have at least 3 scheduled reports');
  assert(reports.some(r => r.frequency === 'weekly'), 'Should have weekly report');
  assert(reports.some(r => r.frequency === 'monthly'), 'Should have monthly report');
});

// ============== Audit Log Integration Tests ==============

console.log('\n--- Audit Log Integration Tests ---');

test('Audit log has distribution connector events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'connector_created', 'Missing connector_created');
  assertIncludes(events, 'connector_updated', 'Missing connector_updated');
  assertIncludes(events, 'connector_activated', 'Missing connector_activated');
  assertIncludes(events, 'connector_deactivated', 'Missing connector_deactivated');
});

test('Audit log has syndication events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'syndication_job_created', 'Missing syndication_job_created');
  assertIncludes(events, 'syndication_job_started', 'Missing syndication_job_started');
  assertIncludes(events, 'syndication_job_completed', 'Missing syndication_job_completed');
  assertIncludes(events, 'syndication_job_failed', 'Missing syndication_job_failed');
});

test('Audit log has rights management events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'rights_agreement_created', 'Missing rights_agreement_created');
  assertIncludes(events, 'rights_agreement_activated', 'Missing rights_agreement_activated');
  assertIncludes(events, 'rights_agreement_expired', 'Missing rights_agreement_expired');
  assertIncludes(events, 'license_granted', 'Missing license_granted');
  assertIncludes(events, 'license_revoked', 'Missing license_revoked');
});

test('Audit log has revenue events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'revenue_share_calculated', 'Missing revenue_share_calculated');
  assertIncludes(events, 'partner_payout_completed', 'Missing partner_payout_completed');
  assertIncludes(events, 'minimum_guarantee_applied', 'Missing minimum_guarantee_applied');
});

test('Audit log has geo-restriction events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'geo_restriction_enforced', 'Missing geo_restriction_enforced');
  assertIncludes(events, 'geo_violation_detected', 'Missing geo_violation_detected');
  assertIncludes(events, 'vpn_detected', 'Missing vpn_detected');
});

test('Audit log has ad events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'ad_insertion_configured', 'Missing ad_insertion_configured');
  assertIncludes(events, 'ad_served', 'Missing ad_served');
  assertIncludes(events, 'ad_revenue_recorded', 'Missing ad_revenue_recorded');
});

test('Audit log has observability events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'partner_metrics_collected', 'Missing partner_metrics_collected');
  assertIncludes(events, 'syndication_error_detected', 'Missing syndication_error_detected');
  assertIncludes(events, 'syndication_alert_triggered', 'Missing syndication_alert_triggered');
});

test('Audit log has distribution categories', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'distribution_connectors', 'Missing distribution_connectors category');
  assertIncludes(categories, 'distribution_rights', 'Missing distribution_rights category');
  assertIncludes(categories, 'distribution_observability', 'Missing distribution_observability category');
});

test('Audit log has distribution target types', () => {
  const targets = auditLogSchema.properties.target.properties.type.enum;
  assertIncludes(targets, 'distribution_connector', 'Missing distribution_connector target');
  assertIncludes(targets, 'syndication_job', 'Missing syndication_job target');
  assertIncludes(targets, 'rights_agreement', 'Missing rights_agreement target');
  assertIncludes(targets, 'partner_metrics', 'Missing partner_metrics target');
});

test('Fixture: Audit log entry is valid', () => {
  const log = fixtures.auditLog;
  assert(log.logId === 'log-syndication-001', 'Invalid logId');
  assert(log.eventType === 'syndication_job_completed', 'Should be syndication_job_completed event');
  assert(log.category === 'distribution_connectors', 'Should be distribution_connectors category');
  assert(log.result === 'success', 'Result should be success');
});

// ============== Summary ==============

console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
