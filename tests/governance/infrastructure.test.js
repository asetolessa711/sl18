/**
 * Phase 27: Infrastructure Resilience & Disaster Recovery Tests
 * Tests for infrastructure resilience, disaster recovery, and monitoring schemas
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const infrastructureResilienceSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/infrastructure_resilience.schema.json'), 'utf8')
);
const disasterRecoverySchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/disaster_recovery.schema.json'), 'utf8')
);
const infrastructureMonitoringSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/infrastructure_monitoring.schema.json'), 'utf8')
);
const auditLogSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/audit_log.schema.json'), 'utf8')
);

// Load fixtures
const fixtures = JSON.parse(
  readFileSync(join(__dirname, './fixtures/infrastructure.json'), 'utf8')
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

console.log('\n=== Phase 27: Infrastructure Resilience & Disaster Recovery Tests ===\n');

// ============================================
// Infrastructure Resilience Schema Tests
// ============================================

console.log('--- Infrastructure Resilience Schema Tests ---\n');

test('Infrastructure resilience schema has required properties', () => {
  assert(infrastructureResilienceSchema.properties.resilienceId, 'Missing resilienceId');
  assert(infrastructureResilienceSchema.properties.version, 'Missing version');
  assert(infrastructureResilienceSchema.properties.name, 'Missing name');
  assert(infrastructureResilienceSchema.properties.scope, 'Missing scope');
  assert(infrastructureResilienceSchema.properties.multiRegion, 'Missing multiRegion');
  assert(infrastructureResilienceSchema.properties.failover, 'Missing failover');
  assert(infrastructureResilienceSchema.properties.loadBalancing, 'Missing loadBalancing');
  assert(infrastructureResilienceSchema.properties.scaling, 'Missing scaling');
  assert(infrastructureResilienceSchema.properties.status, 'Missing status');
});

test('Resilience ID follows correct pattern', () => {
  const pattern = new RegExp(infrastructureResilienceSchema.properties.resilienceId.pattern);
  assert(pattern.test('infra-sl18-production'), 'Pattern should match valid resilience ID');
  assert(!pattern.test('invalid-id'), 'Pattern should not match invalid ID');
});

test('Scope levels are properly defined', () => {
  const levels = infrastructureResilienceSchema.properties.scope.properties.level.enum;
  assert(levels.includes('global'), 'Missing global scope');
  assert(levels.includes('region'), 'Missing region scope');
  assert(levels.includes('zone'), 'Missing zone scope');
  assert(levels.includes('cluster'), 'Missing cluster scope');
  assert(levels.includes('service'), 'Missing service scope');
});

test('Multi-region topology types are defined', () => {
  const topologies = infrastructureResilienceSchema.properties.multiRegion.properties.topology.enum;
  assert(topologies.includes('active_active'), 'Missing active_active topology');
  assert(topologies.includes('active_passive'), 'Missing active_passive topology');
  assert(topologies.includes('active_hot_standby'), 'Missing active_hot_standby topology');
  assert(topologies.includes('multi_master'), 'Missing multi_master topology');
});

test('Cloud providers are properly enumerated', () => {
  const providers = infrastructureResilienceSchema.properties.multiRegion.properties.regions.items.properties.provider.enum;
  assert(providers.includes('aws'), 'Missing AWS provider');
  assert(providers.includes('azure'), 'Missing Azure provider');
  assert(providers.includes('gcp'), 'Missing GCP provider');
  assert(providers.includes('on_premise'), 'Missing on_premise provider');
  assert(providers.includes('hybrid'), 'Missing hybrid provider');
});

test('Region roles are properly defined', () => {
  const roles = infrastructureResilienceSchema.properties.multiRegion.properties.regions.items.properties.role.enum;
  assert(roles.includes('primary'), 'Missing primary role');
  assert(roles.includes('secondary'), 'Missing secondary role');
  assert(roles.includes('hot_standby'), 'Missing hot_standby role');
  assert(roles.includes('disaster_recovery'), 'Missing disaster_recovery role');
});

test('Data replication modes are defined', () => {
  const modes = infrastructureResilienceSchema.properties.multiRegion.properties.dataReplication.properties.mode.enum;
  assert(modes.includes('synchronous'), 'Missing synchronous mode');
  assert(modes.includes('asynchronous'), 'Missing asynchronous mode');
  assert(modes.includes('eventual'), 'Missing eventual mode');
});

test('DNS routing strategies are properly enumerated', () => {
  const strategies = infrastructureResilienceSchema.properties.multiRegion.properties.dnsRouting.properties.strategy.enum;
  assert(strategies.includes('latency_based'), 'Missing latency_based strategy');
  assert(strategies.includes('geolocation'), 'Missing geolocation strategy');
  assert(strategies.includes('weighted'), 'Missing weighted strategy');
  assert(strategies.includes('failover'), 'Missing failover strategy');
});

test('Failover modes are defined', () => {
  const modes = infrastructureResilienceSchema.properties.failover.properties.mode.enum;
  assert(modes.includes('automatic'), 'Missing automatic failover');
  assert(modes.includes('manual'), 'Missing manual failover');
  assert(modes.includes('semi_automatic'), 'Missing semi_automatic failover');
});

test('Failover trigger conditions are properly defined', () => {
  const conditions = infrastructureResilienceSchema.properties.failover.properties.triggers.items.properties.condition.enum;
  assert(conditions.includes('health_check_failure'), 'Missing health_check_failure condition');
  assert(conditions.includes('latency_threshold'), 'Missing latency_threshold condition');
  assert(conditions.includes('error_rate_threshold'), 'Missing error_rate_threshold condition');
  assert(conditions.includes('region_outage'), 'Missing region_outage condition');
});

test('Load balancing algorithms are defined', () => {
  const algorithms = infrastructureResilienceSchema.properties.loadBalancing.properties.algorithm.enum;
  assert(algorithms.includes('round_robin'), 'Missing round_robin algorithm');
  assert(algorithms.includes('least_connections'), 'Missing least_connections algorithm');
  assert(algorithms.includes('least_response_time'), 'Missing least_response_time algorithm');
});

test('Scaling metrics are properly enumerated', () => {
  const metrics = infrastructureResilienceSchema.properties.scaling.properties.horizontal.properties.metrics.items.properties.name.enum;
  assert(metrics.includes('cpu'), 'Missing cpu metric');
  assert(metrics.includes('memory'), 'Missing memory metric');
  assert(metrics.includes('requests_per_second'), 'Missing requests_per_second metric');
});

test('Predictive scaling algorithms are defined', () => {
  const algorithms = infrastructureResilienceSchema.properties.scaling.properties.predictive.properties.algorithm.enum;
  assert(algorithms.includes('time_series'), 'Missing time_series algorithm');
  assert(algorithms.includes('ml_forecast'), 'Missing ml_forecast algorithm');
});

test('Edge node providers are enumerated', () => {
  const providers = infrastructureResilienceSchema.properties.edgeNodes.properties.provider.enum;
  assert(providers.includes('cloudflare'), 'Missing cloudflare provider');
  assert(providers.includes('fastly'), 'Missing fastly provider');
  assert(providers.includes('akamai'), 'Missing akamai provider');
  assert(providers.includes('cloudfront'), 'Missing cloudfront provider');
});

test('Service discovery providers are defined', () => {
  const providers = infrastructureResilienceSchema.properties.serviceDiscovery.properties.provider.enum;
  assert(providers.includes('consul'), 'Missing consul provider');
  assert(providers.includes('kubernetes'), 'Missing kubernetes provider');
  assert(providers.includes('etcd'), 'Missing etcd provider');
});

test('Resilience status values are defined', () => {
  const statuses = infrastructureResilienceSchema.properties.status.enum;
  assert(statuses.includes('active'), 'Missing active status');
  assert(statuses.includes('degraded'), 'Missing degraded status');
  assert(statuses.includes('failover_in_progress'), 'Missing failover_in_progress status');
  assert(statuses.includes('maintenance'), 'Missing maintenance status');
});

// ============================================
// Disaster Recovery Schema Tests
// ============================================

console.log('\n--- Disaster Recovery Schema Tests ---\n');

test('Disaster recovery schema has required properties', () => {
  assert(disasterRecoverySchema.properties.planId, 'Missing planId');
  assert(disasterRecoverySchema.properties.version, 'Missing version');
  assert(disasterRecoverySchema.properties.name, 'Missing name');
  assert(disasterRecoverySchema.properties.objectives, 'Missing objectives');
  assert(disasterRecoverySchema.properties.backupPolicy, 'Missing backupPolicy');
  assert(disasterRecoverySchema.properties.recoveryProcedures, 'Missing recoveryProcedures');
  assert(disasterRecoverySchema.properties.playbooks, 'Missing playbooks');
  assert(disasterRecoverySchema.properties.chaosTesting, 'Missing chaosTesting');
});

test('DR plan ID follows correct pattern', () => {
  const pattern = new RegExp(disasterRecoverySchema.properties.planId.pattern);
  assert(pattern.test('dr-sl18-production'), 'Pattern should match valid DR plan ID');
  assert(!pattern.test('invalid-plan'), 'Pattern should not match invalid ID');
});

test('RTO tier classifications are defined', () => {
  const tiers = disasterRecoverySchema.properties.objectives.properties.rto.properties.tier.enum;
  assert(tiers.includes('critical'), 'Missing critical RTO tier');
  assert(tiers.includes('high'), 'Missing high RTO tier');
  assert(tiers.includes('medium'), 'Missing medium RTO tier');
  assert(tiers.includes('low'), 'Missing low RTO tier');
});

test('RPO tier classifications are defined', () => {
  const tiers = disasterRecoverySchema.properties.objectives.properties.rpo.properties.tier.enum;
  assert(tiers.includes('zero'), 'Missing zero RPO tier');
  assert(tiers.includes('near_zero'), 'Missing near_zero RPO tier');
  assert(tiers.includes('short'), 'Missing short RPO tier');
});

test('Backup types are properly defined', () => {
  const types = disasterRecoverySchema.properties.backupPolicy.properties.schedules.items.properties.type.enum;
  assert(types.includes('full'), 'Missing full backup type');
  assert(types.includes('incremental'), 'Missing incremental backup type');
  assert(types.includes('differential'), 'Missing differential backup type');
  assert(types.includes('continuous'), 'Missing continuous backup type');
  assert(types.includes('snapshot'), 'Missing snapshot backup type');
});

test('Backup frequencies are enumerated', () => {
  const frequencies = disasterRecoverySchema.properties.backupPolicy.properties.schedules.items.properties.frequency.enum;
  assert(frequencies.includes('continuous'), 'Missing continuous frequency');
  assert(frequencies.includes('hourly'), 'Missing hourly frequency');
  assert(frequencies.includes('daily'), 'Missing daily frequency');
  assert(frequencies.includes('weekly'), 'Missing weekly frequency');
});

test('Backup target types are defined', () => {
  const types = disasterRecoverySchema.properties.backupPolicy.properties.targets.items.properties.type.enum;
  assert(types.includes('database'), 'Missing database target type');
  assert(types.includes('object_storage'), 'Missing object_storage target type');
  assert(types.includes('configuration'), 'Missing configuration target type');
  assert(types.includes('secrets'), 'Missing secrets target type');
});

test('Backup validation methods are defined', () => {
  const methods = disasterRecoverySchema.properties.backupPolicy.properties.validation.properties.methods.items.enum;
  assert(methods.includes('checksum'), 'Missing checksum validation');
  assert(methods.includes('restore_test'), 'Missing restore_test validation');
  assert(methods.includes('integrity_check'), 'Missing integrity_check validation');
});

test('Recovery scenarios are properly enumerated', () => {
  const scenarios = disasterRecoverySchema.properties.recoveryProcedures.items.properties.scenario.enum;
  assert(scenarios.includes('region_outage'), 'Missing region_outage scenario');
  assert(scenarios.includes('zone_outage'), 'Missing zone_outage scenario');
  assert(scenarios.includes('database_corruption'), 'Missing database_corruption scenario');
  assert(scenarios.includes('ransomware_attack'), 'Missing ransomware_attack scenario');
  assert(scenarios.includes('data_breach'), 'Missing data_breach scenario');
  assert(scenarios.includes('complete_site_loss'), 'Missing complete_site_loss scenario');
});

test('Recovery step responsible parties are defined', () => {
  const parties = disasterRecoverySchema.properties.recoveryProcedures.items.properties.steps.items.properties.responsible.enum;
  assert(parties.includes('automation'), 'Missing automation responsible party');
  assert(parties.includes('on_call_engineer'), 'Missing on_call_engineer responsible party');
  assert(parties.includes('platform_team'), 'Missing platform_team responsible party');
  assert(parties.includes('security_team'), 'Missing security_team responsible party');
});

test('Playbook automation levels are defined', () => {
  const levels = disasterRecoverySchema.properties.playbooks.items.properties.automationLevel.enum;
  assert(levels.includes('fully_automated'), 'Missing fully_automated level');
  assert(levels.includes('semi_automated'), 'Missing semi_automated level');
  assert(levels.includes('manual_approval'), 'Missing manual_approval level');
  assert(levels.includes('manual'), 'Missing manual level');
});

test('Escalation channels are properly enumerated', () => {
  const channels = disasterRecoverySchema.properties.playbooks.items.properties.escalation.properties.levels.items.properties.channels.items.enum;
  assert(channels.includes('email'), 'Missing email channel');
  assert(channels.includes('sms'), 'Missing sms channel');
  assert(channels.includes('slack'), 'Missing slack channel');
  assert(channels.includes('pagerduty'), 'Missing pagerduty channel');
  assert(channels.includes('phone'), 'Missing phone channel');
});

test('Chaos testing providers are defined', () => {
  const providers = disasterRecoverySchema.properties.chaosTesting.properties.provider.enum;
  assert(providers.includes('chaos_monkey'), 'Missing chaos_monkey provider');
  assert(providers.includes('gremlin'), 'Missing gremlin provider');
  assert(providers.includes('litmus'), 'Missing litmus provider');
  assert(providers.includes('chaos_mesh'), 'Missing chaos_mesh provider');
});

test('Chaos experiment types are properly enumerated', () => {
  const types = disasterRecoverySchema.properties.chaosTesting.properties.experiments.items.properties.type.enum;
  assert(types.includes('instance_termination'), 'Missing instance_termination experiment');
  assert(types.includes('network_partition'), 'Missing network_partition experiment');
  assert(types.includes('latency_injection'), 'Missing latency_injection experiment');
  assert(types.includes('disk_failure'), 'Missing disk_failure experiment');
  assert(types.includes('region_failover'), 'Missing region_failover experiment');
});

test('Chaos experiment scopes are defined', () => {
  const scopes = disasterRecoverySchema.properties.chaosTesting.properties.experiments.items.properties.scope.enum;
  assert(scopes.includes('single_instance'), 'Missing single_instance scope');
  assert(scopes.includes('percentage'), 'Missing percentage scope');
  assert(scopes.includes('availability_zone'), 'Missing availability_zone scope');
  assert(scopes.includes('region'), 'Missing region scope');
});

test('Data protection tiers are defined', () => {
  const tiers = disasterRecoverySchema.properties.dataProtection.properties.classification.items.properties.tier.enum;
  assert(tiers.includes('critical'), 'Missing critical data tier');
  assert(tiers.includes('high'), 'Missing high data tier');
  assert(tiers.includes('medium'), 'Missing medium data tier');
  assert(tiers.includes('low'), 'Missing low data tier');
});

test('Compliance frameworks for DR are defined', () => {
  const frameworks = disasterRecoverySchema.properties.compliance.properties.frameworks.items.enum;
  assert(frameworks.includes('ISO22301'), 'Missing ISO22301 framework');
  assert(frameworks.includes('SOC2'), 'Missing SOC2 framework');
  assert(frameworks.includes('NIST'), 'Missing NIST framework');
});

test('DR plan status values are defined', () => {
  const statuses = disasterRecoverySchema.properties.status.enum;
  assert(statuses.includes('active'), 'Missing active status');
  assert(statuses.includes('testing'), 'Missing testing status');
  assert(statuses.includes('recovery_in_progress'), 'Missing recovery_in_progress status');
});

// ============================================
// Infrastructure Monitoring Schema Tests
// ============================================

console.log('\n--- Infrastructure Monitoring Schema Tests ---\n');

test('Infrastructure monitoring schema has required properties', () => {
  assert(infrastructureMonitoringSchema.properties.monitoringId, 'Missing monitoringId');
  assert(infrastructureMonitoringSchema.properties.metricsCollection, 'Missing metricsCollection');
  assert(infrastructureMonitoringSchema.properties.alerting, 'Missing alerting');
  assert(infrastructureMonitoringSchema.properties.syntheticTests, 'Missing syntheticTests');
  assert(infrastructureMonitoringSchema.properties.dashboards, 'Missing dashboards');
  assert(infrastructureMonitoringSchema.properties.slaTracking, 'Missing slaTracking');
});

test('Monitoring ID follows correct pattern', () => {
  const pattern = new RegExp(infrastructureMonitoringSchema.properties.monitoringId.pattern);
  assert(pattern.test('mon-sl18-production'), 'Pattern should match valid monitoring ID');
  assert(!pattern.test('invalid-mon'), 'Pattern should not match invalid ID');
});

test('Metrics providers are properly enumerated', () => {
  const providers = infrastructureMonitoringSchema.properties.metricsCollection.properties.providers.items.properties.type.enum;
  assert(providers.includes('prometheus'), 'Missing prometheus provider');
  assert(providers.includes('datadog'), 'Missing datadog provider');
  assert(providers.includes('cloudwatch'), 'Missing cloudwatch provider');
  assert(providers.includes('azure_monitor'), 'Missing azure_monitor provider');
});

test('Metric types are defined', () => {
  const types = infrastructureMonitoringSchema.properties.metricsCollection.properties.metrics.items.properties.type.enum;
  assert(types.includes('gauge'), 'Missing gauge metric type');
  assert(types.includes('counter'), 'Missing counter metric type');
  assert(types.includes('histogram'), 'Missing histogram metric type');
  assert(types.includes('summary'), 'Missing summary metric type');
});

test('Metric categories are properly enumerated', () => {
  const categories = infrastructureMonitoringSchema.properties.metricsCollection.properties.metrics.items.properties.category.enum;
  assert(categories.includes('infrastructure'), 'Missing infrastructure category');
  assert(categories.includes('application'), 'Missing application category');
  assert(categories.includes('business'), 'Missing business category');
  assert(categories.includes('security'), 'Missing security category');
});

test('Alert severity levels are defined', () => {
  const severities = infrastructureMonitoringSchema.properties.alerting.properties.rules.items.properties.severity.enum;
  assert(severities.includes('critical'), 'Missing critical severity');
  assert(severities.includes('high'), 'Missing high severity');
  assert(severities.includes('medium'), 'Missing medium severity');
  assert(severities.includes('low'), 'Missing low severity');
  assert(severities.includes('info'), 'Missing info severity');
});

test('Alert notification channels are properly enumerated', () => {
  const channels = infrastructureMonitoringSchema.properties.alerting.properties.rules.items.properties.notifications.properties.channels.items.enum;
  assert(channels.includes('email'), 'Missing email channel');
  assert(channels.includes('slack'), 'Missing slack channel');
  assert(channels.includes('pagerduty'), 'Missing pagerduty channel');
  assert(channels.includes('webhook'), 'Missing webhook channel');
  assert(channels.includes('mobile_push'), 'Missing mobile_push channel');
});

test('Auto-remediation actions are defined', () => {
  const actions = infrastructureMonitoringSchema.properties.alerting.properties.rules.items.properties.autoRemediation.properties.action.enum;
  assert(actions.includes('restart_service'), 'Missing restart_service action');
  assert(actions.includes('scale_up'), 'Missing scale_up action');
  assert(actions.includes('failover'), 'Missing failover action');
  assert(actions.includes('clear_cache'), 'Missing clear_cache action');
});

test('Synthetic test types are properly enumerated', () => {
  const types = infrastructureMonitoringSchema.properties.syntheticTests.properties.tests.items.properties.type.enum;
  assert(types.includes('http'), 'Missing http test type');
  assert(types.includes('api'), 'Missing api test type');
  assert(types.includes('browser'), 'Missing browser test type');
  assert(types.includes('tcp'), 'Missing tcp test type');
  assert(types.includes('dns'), 'Missing dns test type');
  assert(types.includes('ssl'), 'Missing ssl test type');
});

test('Synthetic test assertion types are defined', () => {
  const types = infrastructureMonitoringSchema.properties.syntheticTests.properties.tests.items.properties.assertions.items.properties.type.enum;
  assert(types.includes('status_code'), 'Missing status_code assertion');
  assert(types.includes('response_time'), 'Missing response_time assertion');
  assert(types.includes('body_contains'), 'Missing body_contains assertion');
  assert(types.includes('ssl_valid'), 'Missing ssl_valid assertion');
});

test('Multi-step test actions are defined', () => {
  const actions = infrastructureMonitoringSchema.properties.syntheticTests.properties.multiStepTests.items.properties.steps.items.properties.action.enum;
  assert(actions.includes('navigate'), 'Missing navigate action');
  assert(actions.includes('click'), 'Missing click action');
  assert(actions.includes('type'), 'Missing type action');
  assert(actions.includes('assert'), 'Missing assert action');
});

test('Dashboard types are properly enumerated', () => {
  const types = infrastructureMonitoringSchema.properties.dashboards.items.properties.type.enum;
  assert(types.includes('infrastructure_overview'), 'Missing infrastructure_overview dashboard');
  assert(types.includes('service_health'), 'Missing service_health dashboard');
  assert(types.includes('incident_tracker'), 'Missing incident_tracker dashboard');
  assert(types.includes('sla_compliance'), 'Missing sla_compliance dashboard');
  assert(types.includes('capacity_planning'), 'Missing capacity_planning dashboard');
});

test('Dashboard widget types are defined', () => {
  const types = infrastructureMonitoringSchema.properties.dashboards.items.properties.widgets.items.properties.type.enum;
  assert(types.includes('line_chart'), 'Missing line_chart widget');
  assert(types.includes('bar_chart'), 'Missing bar_chart widget');
  assert(types.includes('gauge'), 'Missing gauge widget');
  assert(types.includes('table'), 'Missing table widget');
  assert(types.includes('status_map'), 'Missing status_map widget');
});

test('SLA status values are defined', () => {
  const statuses = infrastructureMonitoringSchema.properties.slaTracking.properties.slas.items.properties.currentStatus.properties.status.enum;
  assert(statuses.includes('meeting'), 'Missing meeting SLA status');
  assert(statuses.includes('at_risk'), 'Missing at_risk SLA status');
  assert(statuses.includes('breached'), 'Missing breached SLA status');
});

test('Logging providers are properly enumerated', () => {
  const providers = infrastructureMonitoringSchema.properties.logging.properties.providers.items.properties.type.enum;
  assert(providers.includes('elasticsearch'), 'Missing elasticsearch provider');
  assert(providers.includes('splunk'), 'Missing splunk provider');
  assert(providers.includes('cloudwatch_logs'), 'Missing cloudwatch_logs provider');
  assert(providers.includes('loki'), 'Missing loki provider');
});

test('Tracing providers are defined', () => {
  const providers = infrastructureMonitoringSchema.properties.tracing.properties.provider.enum;
  assert(providers.includes('jaeger'), 'Missing jaeger provider');
  assert(providers.includes('zipkin'), 'Missing zipkin provider');
  assert(providers.includes('datadog_apm'), 'Missing datadog_apm provider');
  assert(providers.includes('xray'), 'Missing xray provider');
});

test('Monitoring status values are defined', () => {
  const statuses = infrastructureMonitoringSchema.properties.status.enum;
  assert(statuses.includes('active'), 'Missing active monitoring status');
  assert(statuses.includes('degraded'), 'Missing degraded monitoring status');
  assert(statuses.includes('maintenance'), 'Missing maintenance monitoring status');
});

// ============================================
// Fixture Validation Tests
// ============================================

console.log('\n--- Fixture Validation Tests ---\n');

test('Infrastructure resilience fixture has valid structure', () => {
  const resilience = fixtures.infrastructureResilience;
  assert(resilience.resilienceId === 'infra-sl18-production-global', 'Invalid resilience ID');
  assert(resilience.multiRegion.enabled === true, 'Multi-region should be enabled');
  assert(resilience.multiRegion.topology === 'active_active', 'Invalid topology');
  assert(resilience.multiRegion.regions.length === 3, 'Should have 3 regions');
});

test('Infrastructure resilience fixture has valid failover config', () => {
  const failover = fixtures.infrastructureResilience.failover;
  assert(failover.enabled === true, 'Failover should be enabled');
  assert(failover.mode === 'automatic', 'Failover mode should be automatic');
  assert(failover.triggers.length >= 3, 'Should have at least 3 failover triggers');
  assert(failover.failoverTime.target === 60, 'Target failover time should be 60 seconds');
});

test('Infrastructure resilience fixture has valid scaling config', () => {
  const scaling = fixtures.infrastructureResilience.scaling;
  assert(scaling.horizontal.enabled === true, 'Horizontal scaling should be enabled');
  assert(scaling.horizontal.minInstances >= 1, 'Min instances should be at least 1');
  assert(scaling.predictive.enabled === true, 'Predictive scaling should be enabled');
  assert(scaling.burstCapacity.enabled === true, 'Burst capacity should be enabled');
});

test('Infrastructure resilience fixture meets SLA targets', () => {
  const sla = fixtures.infrastructureResilience.sla;
  assert(sla.targetUptime >= 99.9, 'Target uptime should be at least 99.9%');
  assert(sla.latencyTargets.p99 <= 1000, 'P99 latency target should be under 1000ms');
});

test('Disaster recovery fixture has valid structure', () => {
  const dr = fixtures.disasterRecovery;
  assert(dr.planId === 'dr-sl18-production', 'Invalid DR plan ID');
  assert(dr.objectives.rto.target <= 15, 'RTO target should be 15 minutes or less');
  assert(dr.objectives.rpo.target <= 5, 'RPO target should be 5 minutes or less');
});

test('Disaster recovery fixture has valid backup policy', () => {
  const backup = fixtures.disasterRecovery.backupPolicy;
  assert(backup.enabled === true, 'Backup policy should be enabled');
  assert(backup.schedules.length >= 4, 'Should have at least 4 backup schedules');
  assert(backup.validation.enabled === true, 'Backup validation should be enabled');
  assert(backup.immutability.enabled === true, 'Immutability should be enabled');
});

test('Disaster recovery fixture has valid recovery procedures', () => {
  const procedures = fixtures.disasterRecovery.recoveryProcedures;
  assert(procedures.length >= 2, 'Should have at least 2 recovery procedures');
  assert(procedures[0].scenario === 'region_outage', 'First procedure should be for region outage');
  assert(procedures[0].priority === 1, 'Region outage should be priority 1');
  assert(procedures[0].steps.length >= 4, 'Should have at least 4 recovery steps');
});

test('Disaster recovery fixture has valid chaos testing config', () => {
  const chaos = fixtures.disasterRecovery.chaosTesting;
  assert(chaos.enabled === true, 'Chaos testing should be enabled');
  assert(chaos.provider === 'gremlin', 'Chaos provider should be gremlin');
  assert(chaos.experiments.length >= 3, 'Should have at least 3 chaos experiments');
  assert(chaos.schedule.gameDay.enabled === true, 'Game day should be enabled');
});

test('Infrastructure monitoring fixture has valid structure', () => {
  const monitoring = fixtures.infrastructureMonitoring;
  assert(monitoring.monitoringId === 'mon-sl18-production', 'Invalid monitoring ID');
  assert(monitoring.metricsCollection.enabled === true, 'Metrics collection should be enabled');
  assert(monitoring.alerting.enabled === true, 'Alerting should be enabled');
});

test('Infrastructure monitoring fixture has valid alerting rules', () => {
  const rules = fixtures.infrastructureMonitoring.alerting.rules;
  assert(rules.length >= 3, 'Should have at least 3 alert rules');
  const criticalRules = rules.filter(r => r.severity === 'critical');
  assert(criticalRules.length >= 2, 'Should have at least 2 critical rules');
});

test('Infrastructure monitoring fixture has valid synthetic tests', () => {
  const tests = fixtures.infrastructureMonitoring.syntheticTests.tests;
  assert(tests.length >= 3, 'Should have at least 3 synthetic tests');
  assert(tests.some(t => t.type === 'http'), 'Should have HTTP synthetic tests');
  assert(tests.some(t => t.type === 'ssl'), 'Should have SSL synthetic tests');
});

test('Infrastructure monitoring fixture has valid SLA tracking', () => {
  const slas = fixtures.infrastructureMonitoring.slaTracking.slas;
  assert(slas.length >= 2, 'Should have at least 2 SLAs');
  assert(slas.every(s => s.currentStatus.status === 'meeting'), 'All SLAs should be meeting');
  assert(slas[0].targets.availability >= 99.9, 'API availability target should be at least 99.9%');
});

test('Infrastructure monitoring fixture has valid dashboards', () => {
  const dashboards = fixtures.infrastructureMonitoring.dashboards;
  assert(dashboards.length >= 2, 'Should have at least 2 dashboards');
  assert(dashboards.some(d => d.type === 'infrastructure_overview'), 'Should have infrastructure overview dashboard');
  assert(dashboards.some(d => d.type === 'sla_compliance'), 'Should have SLA compliance dashboard');
});

// ============================================
// Audit Log Event Tests
// ============================================

console.log('\n--- Audit Log Event Tests ---\n');

test('Infrastructure audit log events are defined in fixtures', () => {
  const events = fixtures.auditLogEvents;
  assert(events.includes('resilience_config_created'), 'Missing resilience_config_created event');
  assert(events.includes('failover_triggered'), 'Missing failover_triggered event');
  assert(events.includes('failover_completed'), 'Missing failover_completed event');
  assert(events.includes('scaling_triggered'), 'Missing scaling_triggered event');
  assert(events.includes('circuit_breaker_opened'), 'Missing circuit_breaker_opened event');
});

test('DR audit log events are defined in fixtures', () => {
  const events = fixtures.auditLogEvents;
  assert(events.includes('dr_plan_created'), 'Missing dr_plan_created event');
  assert(events.includes('backup_completed'), 'Missing backup_completed event');
  assert(events.includes('recovery_started'), 'Missing recovery_started event');
  assert(events.includes('chaos_experiment_started'), 'Missing chaos_experiment_started event');
  assert(events.includes('game_day_completed'), 'Missing game_day_completed event');
});

test('Monitoring audit log events are defined in fixtures', () => {
  const events = fixtures.auditLogEvents;
  assert(events.includes('alert_triggered'), 'Missing alert_triggered event');
  assert(events.includes('alert_resolved'), 'Missing alert_resolved event');
  assert(events.includes('auto_remediation_triggered'), 'Missing auto_remediation_triggered event');
  assert(events.includes('synthetic_test_failed'), 'Missing synthetic_test_failed event');
  assert(events.includes('sla_breached'), 'Missing sla_breached event');
});

// ============================================
// Integration Tests
// ============================================

console.log('\n--- Integration Tests ---\n');

test('RTO/RPO objectives align with backup schedules', () => {
  const rpo = fixtures.disasterRecovery.objectives.rpo.target; // 5 minutes
  const schedules = fixtures.disasterRecovery.backupPolicy.schedules;
  const continuous = schedules.find(s => s.type === 'continuous');
  assert(continuous, 'Should have continuous backup for near-zero RPO');
});

test('Failover time aligns with RTO', () => {
  const rto = fixtures.disasterRecovery.objectives.rto.target; // 15 minutes
  const failoverTarget = fixtures.infrastructureResilience.failover.failoverTime.target; // 60 seconds
  assert(failoverTarget < rto * 60, 'Failover time should be less than RTO');
});

test('Monitoring alerts support SLA compliance', () => {
  const sla = fixtures.infrastructureMonitoring.slaTracking.slas[0];
  const rules = fixtures.infrastructureMonitoring.alerting.rules;
  
  // Check there's an alert for error rate matching SLA target
  const errorAlert = rules.find(r => r.metric.includes('error'));
  assert(errorAlert, 'Should have error rate alert for SLA monitoring');
});

test('Synthetic tests cover critical endpoints', () => {
  const tests = fixtures.infrastructureMonitoring.syntheticTests.tests;
  const apiHealthTest = tests.find(t => t.endpoint.includes('health'));
  assert(apiHealthTest, 'Should have API health synthetic test');
  assert(apiHealthTest.frequency <= 60, 'Health check frequency should be 60s or less');
});

test('Chaos experiments have safeguards', () => {
  const experiments = fixtures.disasterRecovery.chaosTesting.experiments;
  experiments.forEach(exp => {
    assert(exp.safeguards.autoRollback === true, `Experiment ${exp.name} should have auto-rollback`);
    assert(exp.safeguards.maxImpact <= 50, `Experiment ${exp.name} should have max impact <= 50%`);
  });
});

test('Multi-region setup provides redundancy', () => {
  const regions = fixtures.infrastructureResilience.multiRegion.regions;
  const activeRegions = regions.filter(r => r.status === 'active');
  assert(activeRegions.length >= 2, 'Should have at least 2 active regions for redundancy');
  
  const primaryRegion = regions.find(r => r.role === 'primary');
  const secondaryRegions = regions.filter(r => r.role === 'secondary');
  assert(primaryRegion, 'Should have primary region');
  assert(secondaryRegions.length >= 1, 'Should have at least 1 secondary region');
});

test('Backup replication provides geographic redundancy', () => {
  const targets = fixtures.disasterRecovery.backupPolicy.targets;
  targets.forEach(target => {
    if (target.replication.enabled) {
      assert(
        target.replication.destinations.length >= 1,
        `Target ${target.targetId} should replicate to at least 1 destination`
      );
    }
  });
});

test('Error budget tracking supports reliability decisions', () => {
  const budgets = fixtures.infrastructureMonitoring.slaTracking.errorBudgets;
  assert(budgets.length >= 1, 'Should have at least 1 error budget');
  budgets.forEach(budget => {
    assert(budget.remaining >= 0, 'Error budget remaining should not be negative');
    assert(budget.burnRate !== undefined, 'Should track burn rate');
  });
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
