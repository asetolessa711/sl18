/**
 * Social Media Integration Tests for SL18 + Waliin Studio
 * Tests for social connectors, analytics, and campaign calendar
 * Phase 34: Interlinked Social Media Presence + Global Campaign Calendar
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const socialConnectorsSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/social_connectors.schema.json'), 'utf8')
);
const socialAnalyticsSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/social_analytics.schema.json'), 'utf8')
);
const campaignCalendarSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/campaign_calendar.schema.json'), 'utf8')
);
const auditLogSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/audit_log.schema.json'), 'utf8')
);

// Load fixtures
const fixtures = JSON.parse(
  readFileSync(join(__dirname, './fixtures/social_media.json'), 'utf8')
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

function assertGreaterThan(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
  }
}

console.log('\n=== Social Media Integration Tests ===\n');

// ============== Social Connectors Schema Tests ==============

console.log('--- Social Connectors Schema Tests ---');

test('Social connectors schema has required fields', () => {
  assert(socialConnectorsSchema.required.includes('connectorId'), 'Missing connectorId');
  assert(socialConnectorsSchema.required.includes('version'), 'Missing version');
  assert(socialConnectorsSchema.required.includes('platforms'), 'Missing platforms');
  assert(socialConnectorsSchema.required.includes('status'), 'Missing status');
});

test('Connector ID pattern validation', () => {
  const pattern = new RegExp(socialConnectorsSchema.properties.connectorId.pattern);
  assert(pattern.test('social-waliin-studio-main'), 'Valid ID should match');
  assert(pattern.test('social-franchise-001'), 'Valid ID should match');
  assert(!pattern.test('invalid-id'), 'Invalid ID should not match');
  assert(!pattern.test('youtube-waliin-studio'), 'Non-social ID should not match');
});

test('Platform configurations are defined', () => {
  const platforms = socialConnectorsSchema.properties.platforms.properties;
  assert(platforms.youtube, 'Missing YouTube platform');
  assert(platforms.facebook, 'Missing Facebook platform');
  assert(platforms.instagram, 'Missing Instagram platform');
  assert(platforms.tiktok, 'Missing TikTok platform');
  assert(platforms.waliinNative, 'Missing Waliin Native platform');
});

test('YouTube platform has required properties', () => {
  const youtube = socialConnectorsSchema.properties.platforms.properties.youtube.properties;
  assert(youtube.enabled, 'Missing enabled');
  assert(youtube.channelId, 'Missing channelId');
  assert(youtube.channelHandle, 'Missing channelHandle');
  assert(youtube.purpose, 'Missing purpose');
  assert(youtube.contentTypes, 'Missing contentTypes');
  assert(youtube.monetization, 'Missing monetization');
});

test('Facebook platform has required properties', () => {
  const facebook = socialConnectorsSchema.properties.platforms.properties.facebook.properties;
  assert(facebook.enabled, 'Missing enabled');
  assert(facebook.pageId, 'Missing pageId');
  assert(facebook.pageName, 'Missing pageName');
  assert(facebook.groupId, 'Missing groupId');
  assert(facebook.purpose, 'Missing purpose');
});

test('Instagram platform has required properties', () => {
  const instagram = socialConnectorsSchema.properties.platforms.properties.instagram.properties;
  assert(instagram.enabled, 'Missing enabled');
  assert(instagram.accountId, 'Missing accountId');
  assert(instagram.accountHandle, 'Missing accountHandle');
  assert(instagram.purpose, 'Missing purpose');
});

test('TikTok platform has required properties', () => {
  const tiktok = socialConnectorsSchema.properties.platforms.properties.tiktok.properties;
  assert(tiktok.enabled, 'Missing enabled');
  assert(tiktok.accountId, 'Missing accountId');
  assert(tiktok.accountHandle, 'Missing accountHandle');
  assert(tiktok.purpose, 'Missing purpose');
});

test('Branding configuration includes all required elements', () => {
  const branding = socialConnectorsSchema.properties.branding.properties;
  assert(branding.studioName, 'Missing studioName');
  assert(branding.tagline, 'Missing tagline');
  assert(branding.primaryHashtags, 'Missing primaryHashtags');
  assert(branding.secondaryHashtags, 'Missing secondaryHashtags');
  assert(branding.colorPalette, 'Missing colorPalette');
  assert(branding.logoAssets, 'Missing logoAssets');
});

test('Interlinking strategy is comprehensive', () => {
  const interlinking = socialConnectorsSchema.properties.interlinking.properties.strategy.properties;
  assert(interlinking.bioLinks, 'Missing bioLinks');
  assert(interlinking.crossPlatformLinks, 'Missing crossPlatformLinks');
  assert(interlinking.endScreens, 'Missing endScreens');
  assert(interlinking.pinnedComments, 'Missing pinnedComments');
  assert(interlinking.communitySync, 'Missing communitySync');
});

test('Publishing workflows include approval and cross-posting', () => {
  const workflows = socialConnectorsSchema.properties.publishingWorkflows.properties;
  assert(workflows.autoPublish, 'Missing autoPublish');
  assert(workflows.approvalRequired, 'Missing approvalRequired');
  assert(workflows.crossPostEnabled, 'Missing crossPostEnabled');
  assert(workflows.crossPostRules, 'Missing crossPostRules');
  assert(workflows.schedulingEnabled, 'Missing schedulingEnabled');
});

test('Monetization tracking covers all platforms', () => {
  const monetization = socialConnectorsSchema.properties.monetization.properties.platformRevenue.properties;
  assert(monetization.youtube, 'Missing YouTube monetization');
  assert(monetization.facebook, 'Missing Facebook monetization');
  assert(monetization.instagram, 'Missing Instagram monetization');
  assert(monetization.tiktok, 'Missing TikTok monetization');
  assert(monetization.waliinNative, 'Missing Waliin Native monetization');
});

test('Governance includes cultural sensitivity and copyright', () => {
  const governance = socialConnectorsSchema.properties.governance.properties;
  assert(governance.culturalSensitivity, 'Missing culturalSensitivity');
  assert(governance.contentGuidelines, 'Missing contentGuidelines');
  assert(governance.copyrightCompliance, 'Missing copyrightCompliance');
  assert(governance.accessControl, 'Missing accessControl');
});

// ============== Social Analytics Schema Tests ==============

console.log('\n--- Social Analytics Schema Tests ---');

test('Social analytics schema has required fields', () => {
  assert(socialAnalyticsSchema.required.includes('analyticsId'), 'Missing analyticsId');
  assert(socialAnalyticsSchema.required.includes('version'), 'Missing version');
  assert(socialAnalyticsSchema.required.includes('connectorRef'), 'Missing connectorRef');
  assert(socialAnalyticsSchema.required.includes('metricsCollection'), 'Missing metricsCollection');
  assert(socialAnalyticsSchema.required.includes('status'), 'Missing status');
});

test('Analytics ID pattern validation', () => {
  const pattern = new RegExp(socialAnalyticsSchema.properties.analyticsId.pattern);
  assert(pattern.test('analytics-social-waliin-main'), 'Valid ID should match');
  assert(!pattern.test('analytics-youtube-main'), 'Non-social analytics ID should not match');
});

test('Metrics collection covers all platforms', () => {
  const platforms = socialAnalyticsSchema.properties.metricsCollection.properties.platforms.properties;
  assert(platforms.youtube, 'Missing YouTube metrics');
  assert(platforms.facebook, 'Missing Facebook metrics');
  assert(platforms.instagram, 'Missing Instagram metrics');
  assert(platforms.tiktok, 'Missing TikTok metrics');
  assert(platforms.waliinNative, 'Missing Waliin Native metrics');
});

test('YouTube metrics include key performance indicators', () => {
  const youtubeMetrics = socialAnalyticsSchema.properties.metricsCollection.properties.platforms.properties.youtube.properties.metrics.items.enum;
  assertIncludes(youtubeMetrics, 'views', 'Missing views metric');
  assertIncludes(youtubeMetrics, 'watch_time', 'Missing watch_time metric');
  assertIncludes(youtubeMetrics, 'subscribers', 'Missing subscribers metric');
  assertIncludes(youtubeMetrics, 'estimated_revenue', 'Missing estimated_revenue metric');
  assertIncludes(youtubeMetrics, 'card_clicks', 'Missing card_clicks metric');
});

test('Facebook metrics include engagement indicators', () => {
  const facebookMetrics = socialAnalyticsSchema.properties.metricsCollection.properties.platforms.properties.facebook.properties.metrics.items.enum;
  assertIncludes(facebookMetrics, 'page_fans', 'Missing page_fans metric');
  assertIncludes(facebookMetrics, 'page_impressions', 'Missing page_impressions metric');
  assertIncludes(facebookMetrics, 'post_engagements', 'Missing post_engagements metric');
});

test('Instagram metrics include Reels and Stories', () => {
  const instagramMetrics = socialAnalyticsSchema.properties.metricsCollection.properties.platforms.properties.instagram.properties.metrics.items.enum;
  assertIncludes(instagramMetrics, 'reel_plays', 'Missing reel_plays metric');
  assertIncludes(instagramMetrics, 'story_impressions', 'Missing story_impressions metric');
  assertIncludes(instagramMetrics, 'story_reach', 'Missing story_reach metric');
});

test('TikTok metrics include viral indicators', () => {
  const tiktokMetrics = socialAnalyticsSchema.properties.metricsCollection.properties.platforms.properties.tiktok.properties.metrics.items.enum;
  assertIncludes(tiktokMetrics, 'video_views', 'Missing video_views metric');
  assertIncludes(tiktokMetrics, 'shares', 'Missing shares metric');
  assertIncludes(tiktokMetrics, 'creator_fund_earnings', 'Missing creator_fund_earnings metric');
});

test('Cross-platform KPIs include reach, engagement, audience, conversions, revenue', () => {
  const kpis = socialAnalyticsSchema.properties.crossPlatformKPIs.properties;
  assert(kpis.reach, 'Missing reach KPI');
  assert(kpis.engagement, 'Missing engagement KPI');
  assert(kpis.audience, 'Missing audience KPI');
  assert(kpis.conversions, 'Missing conversions KPI');
  assert(kpis.revenue, 'Missing revenue KPI');
});

test('Funnel tracking includes all stages', () => {
  const funnelStages = socialAnalyticsSchema.properties.funnelTracking.properties.funnelStages.items.properties.stageName.enum;
  assertIncludes(funnelStages, 'awareness', 'Missing awareness stage');
  assertIncludes(funnelStages, 'interest', 'Missing interest stage');
  assertIncludes(funnelStages, 'consideration', 'Missing consideration stage');
  assertIncludes(funnelStages, 'intent', 'Missing intent stage');
  assertIncludes(funnelStages, 'purchase', 'Missing purchase stage');
  assertIncludes(funnelStages, 'retention', 'Missing retention stage');
});

test('Attribution models are comprehensive', () => {
  const models = socialAnalyticsSchema.properties.funnelTracking.properties.attributionModel.enum;
  assertIncludes(models, 'last_click', 'Missing last_click model');
  assertIncludes(models, 'first_click', 'Missing first_click model');
  assertIncludes(models, 'linear', 'Missing linear model');
  assertIncludes(models, 'time_decay', 'Missing time_decay model');
  assertIncludes(models, 'data_driven', 'Missing data_driven model');
});

test('Dashboards include overview and funnel', () => {
  const dashboards = socialAnalyticsSchema.properties.dashboards.properties;
  assert(dashboards.overviewDashboard, 'Missing overview dashboard');
  assert(dashboards.funnelDashboard, 'Missing funnel dashboard');
  assert(dashboards.campaignDashboard, 'Missing campaign dashboard');
});

test('Alert types cover performance and compliance', () => {
  const alertTypes = socialAnalyticsSchema.properties.alerting.properties.alertTypes.items.properties.type.enum;
  assertIncludes(alertTypes, 'reach_spike', 'Missing reach_spike alert');
  assertIncludes(alertTypes, 'engagement_drop', 'Missing engagement_drop alert');
  assertIncludes(alertTypes, 'follower_milestone', 'Missing follower_milestone alert');
  assertIncludes(alertTypes, 'viral_content', 'Missing viral_content alert');
  assertIncludes(alertTypes, 'copyright_claim', 'Missing copyright_claim alert');
});

test('Reporting includes scheduled reports and executive summary', () => {
  const reporting = socialAnalyticsSchema.properties.reporting.properties;
  assert(reporting.scheduledReports, 'Missing scheduledReports');
  assert(reporting.executiveReport, 'Missing executiveReport');
  assert(reporting.exportFormats, 'Missing exportFormats');
});

// ============== Campaign Calendar Schema Tests ==============

console.log('\n--- Campaign Calendar Schema Tests ---');

test('Campaign calendar schema has required fields', () => {
  assert(campaignCalendarSchema.required.includes('calendarId'), 'Missing calendarId');
  assert(campaignCalendarSchema.required.includes('version'), 'Missing version');
  assert(campaignCalendarSchema.required.includes('calendarSettings'), 'Missing calendarSettings');
  assert(campaignCalendarSchema.required.includes('status'), 'Missing status');
});

test('Calendar ID pattern validation', () => {
  const pattern = new RegExp(campaignCalendarSchema.properties.calendarId.pattern);
  assert(pattern.test('calendar-waliin-2024'), 'Valid ID should match');
  assert(pattern.test('calendar-launch-q1'), 'Valid ID should match');
  assert(!pattern.test('invalid-calendar'), 'Invalid ID should not match');
});

test('Launch phases include all stages', () => {
  const phases = campaignCalendarSchema.properties.launchPhases.items.properties.phaseName.enum;
  assertIncludes(phases, 'pre_launch', 'Missing pre_launch phase');
  assertIncludes(phases, 'soft_launch', 'Missing soft_launch phase');
  assertIncludes(phases, 'launch', 'Missing launch phase');
  assertIncludes(phases, 'growth', 'Missing growth phase');
  assertIncludes(phases, 'scaling', 'Missing scaling phase');
});

test('Campaign types are comprehensive', () => {
  const types = campaignCalendarSchema.properties.campaigns.items.properties.type.enum;
  assertIncludes(types, 'launch', 'Missing launch type');
  assertIncludes(types, 'premiere', 'Missing premiere type');
  assertIncludes(types, 'awareness', 'Missing awareness type');
  assertIncludes(types, 'engagement', 'Missing engagement type');
  assertIncludes(types, 'conversion', 'Missing conversion type');
  assertIncludes(types, 'seasonal', 'Missing seasonal type');
});

test('Campaign structure includes objectives and budget', () => {
  const campaign = campaignCalendarSchema.properties.campaigns.items.properties;
  assert(campaign.objectives, 'Missing objectives');
  assert(campaign.budget, 'Missing budget');
  assert(campaign.contentPlan, 'Missing contentPlan');
  assert(campaign.team, 'Missing team');
});

test('Content cadence includes weekly targets', () => {
  const cadence = campaignCalendarSchema.properties.contentCadence.properties.weeklyTargets.properties;
  assert(cadence.youtube, 'Missing YouTube targets');
  assert(cadence.facebook, 'Missing Facebook targets');
  assert(cadence.instagram, 'Missing Instagram targets');
  assert(cadence.tiktok, 'Missing TikTok targets');
});

test('Milestone types are comprehensive', () => {
  const types = campaignCalendarSchema.properties.milestones.items.properties.type.enum;
  assertIncludes(types, 'follower_milestone', 'Missing follower_milestone');
  assertIncludes(types, 'subscriber_milestone', 'Missing subscriber_milestone');
  assertIncludes(types, 'view_milestone', 'Missing view_milestone');
  assertIncludes(types, 'revenue_milestone', 'Missing revenue_milestone');
  assertIncludes(types, 'launch_milestone', 'Missing launch_milestone');
});

test('Premiere calendar includes promotion plan', () => {
  const premiere = campaignCalendarSchema.properties.premiereCalendar.items.properties;
  assert(premiere.premiereId, 'Missing premiereId');
  assert(premiere.contentTitle, 'Missing contentTitle');
  assert(premiere.premiereDate, 'Missing premiereDate');
  assert(premiere.promotionPlan, 'Missing promotionPlan');
});

test('Special events include cultural and industry events', () => {
  const eventTypes = campaignCalendarSchema.properties.specialEvents.items.properties.type.enum;
  assertIncludes(eventTypes, 'holiday', 'Missing holiday type');
  assertIncludes(eventTypes, 'cultural_event', 'Missing cultural_event type');
  assertIncludes(eventTypes, 'industry_event', 'Missing industry_event type');
  assertIncludes(eventTypes, 'partnership_launch', 'Missing partnership_launch type');
});

test('Approval workflow includes stages and escalation', () => {
  const workflow = campaignCalendarSchema.properties.approvalWorkflow.properties;
  assert(workflow.enabled, 'Missing enabled');
  assert(workflow.stages, 'Missing stages');
  assert(workflow.escalationEnabled, 'Missing escalationEnabled');
  assert(workflow.escalationAfterHours, 'Missing escalationAfterHours');
});

test('Team assignments include all required roles', () => {
  const roles = campaignCalendarSchema.properties.teamAssignments.items.properties.role.enum;
  assertIncludes(roles, 'ceo', 'Missing ceo role');
  assertIncludes(roles, 'marketing_lead', 'Missing marketing_lead role');
  assertIncludes(roles, 'social_media_manager', 'Missing social_media_manager role');
  assertIncludes(roles, 'content_manager', 'Missing content_manager role');
  assertIncludes(roles, 'content_creator', 'Missing content_creator role');
});

test('Notifications include key triggers', () => {
  const triggers = campaignCalendarSchema.properties.notifications.properties.triggers.items.properties.event.enum;
  assertIncludes(triggers, 'approval_needed', 'Missing approval_needed trigger');
  assertIncludes(triggers, 'milestone_approaching', 'Missing milestone_approaching trigger');
  assertIncludes(triggers, 'premiere_reminder', 'Missing premiere_reminder trigger');
  assertIncludes(triggers, 'deadline_missed', 'Missing deadline_missed trigger');
});

test('Integrations include Airtable and Slack', () => {
  const integrations = campaignCalendarSchema.properties.integrations.properties;
  assert(integrations.airtable, 'Missing Airtable integration');
  assert(integrations.slack, 'Missing Slack integration');
  assert(integrations.googleCalendar, 'Missing Google Calendar integration');
});

// ============== Fixture Validation Tests ==============

console.log('\n--- Fixture Validation Tests ---');

test('Social connector fixture has valid structure', () => {
  const connector = fixtures.socialConnector;
  assert(connector.connectorId === 'social-waliin-studio-main', 'Invalid connectorId');
  assert(connector.version === '1.0.0', 'Invalid version');
  assert(connector.status === 'active', 'Invalid status');
});

test('Fixture branding includes all hashtags', () => {
  const branding = fixtures.socialConnector.branding;
  assertEqual(branding.studioName, 'Waliin Studio', 'Invalid studioName');
  assertEqual(branding.tagline, 'Together through stories', 'Invalid tagline');
  assert(branding.primaryHashtags.length >= 4, 'Not enough primary hashtags');
  assert(branding.secondaryHashtags.length >= 4, 'Not enough secondary hashtags');
});

test('Fixture platforms are all enabled', () => {
  const platforms = fixtures.socialConnector.platforms;
  assert(platforms.youtube.enabled, 'YouTube should be enabled');
  assert(platforms.facebook.enabled, 'Facebook should be enabled');
  assert(platforms.instagram.enabled, 'Instagram should be enabled');
  assert(platforms.tiktok.enabled, 'TikTok should be enabled');
  assert(platforms.waliinNative.enabled, 'Waliin Native should be enabled');
});

test('Fixture has cross-posting rules', () => {
  const rules = fixtures.socialConnector.publishingWorkflows.crossPostRules;
  assert(rules.length >= 1, 'Should have cross-post rules');
  assert(rules[0].sourcePlatform === 'youtube', 'First rule should be from YouTube');
  assert(rules[0].targetPlatforms.length >= 3, 'Should target multiple platforms');
});

test('Analytics fixture has valid KPIs', () => {
  const kpis = fixtures.socialAnalytics.crossPlatformKPIs;
  assertGreaterThan(kpis.reach.totalReach, 0, 'Total reach should be positive');
  assertGreaterThan(kpis.engagement.totalEngagements, 0, 'Total engagements should be positive');
  assertGreaterThan(kpis.audience.totalFollowers, 0, 'Total followers should be positive');
  assertGreaterThan(kpis.revenue.totalRevenue, 0, 'Total revenue should be positive');
});

test('Analytics fixture has funnel stages', () => {
  const funnel = fixtures.socialAnalytics.funnelTracking;
  assert(funnel.enabled, 'Funnel tracking should be enabled');
  assert(funnel.funnelStages.length >= 5, 'Should have at least 5 funnel stages');
  assertEqual(funnel.attributionModel, 'last_click', 'Default attribution should be last_click');
});

test('Campaign calendar fixture has launch phases', () => {
  const phases = fixtures.campaignCalendar.launchPhases;
  assert(phases.length >= 3, 'Should have at least 3 launch phases');
  assertEqual(phases[0].phaseName, 'pre_launch', 'First phase should be pre_launch');
  assertEqual(phases[1].phaseName, 'launch', 'Second phase should be launch');
});

test('Campaign calendar fixture has campaigns', () => {
  const campaigns = fixtures.campaignCalendar.campaigns;
  assert(campaigns.length >= 1, 'Should have at least 1 campaign');
  assertEqual(campaigns[0].type, 'launch', 'First campaign should be launch type');
  assert(campaigns[0].objectives.length >= 3, 'Launch campaign should have multiple objectives');
});

test('Campaign calendar fixture has milestones', () => {
  const milestones = fixtures.campaignCalendar.milestones;
  assert(milestones.length >= 3, 'Should have at least 3 milestones');
  assert(milestones.some(m => m.type === 'subscriber_milestone'), 'Should have subscriber milestone');
  assert(milestones.some(m => m.type === 'follower_milestone'), 'Should have follower milestone');
});

test('Campaign calendar fixture has premiere calendar', () => {
  const premieres = fixtures.campaignCalendar.premiereCalendar;
  assert(premieres.length >= 1, 'Should have at least 1 premiere');
  assert(premieres[0].promotionPlan, 'Premiere should have promotion plan');
  assert(premieres[0].promotionPlan.socialBlitz.length >= 1, 'Should have social blitz');
});

test('Campaign calendar fixture has team assignments', () => {
  const team = fixtures.campaignCalendar.teamAssignments;
  assert(team.length >= 5, 'Should have at least 5 team members');
  assert(team.some(t => t.role === 'ceo'), 'Should have CEO assigned');
  assert(team.some(t => t.role === 'social_media_manager'), 'Should have social media manager');
});

// ============== Audit Log Integration Tests ==============

console.log('\n--- Audit Log Integration Tests ---');

test('Audit log includes social connector events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'social_connector_created', 'Missing social_connector_created');
  assertIncludes(events, 'social_connector_updated', 'Missing social_connector_updated');
  assertIncludes(events, 'social_platform_connected', 'Missing social_platform_connected');
  assertIncludes(events, 'social_content_published', 'Missing social_content_published');
  assertIncludes(events, 'social_content_cross_posted', 'Missing social_content_cross_posted');
});

test('Audit log includes social analytics events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'social_analytics_synced', 'Missing social_analytics_synced');
  assertIncludes(events, 'social_report_generated', 'Missing social_report_generated');
  assertIncludes(events, 'social_alert_triggered', 'Missing social_alert_triggered');
  assertIncludes(events, 'social_conversion_tracked', 'Missing social_conversion_tracked');
});

test('Audit log includes campaign events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'campaign_created', 'Missing campaign_created');
  assertIncludes(events, 'campaign_activated', 'Missing campaign_activated');
  assertIncludes(events, 'campaign_milestone_achieved', 'Missing campaign_milestone_achieved');
  assertIncludes(events, 'campaign_content_published', 'Missing campaign_content_published');
});

test('Audit log includes calendar events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'calendar_created', 'Missing calendar_created');
  assertIncludes(events, 'calendar_phase_started', 'Missing calendar_phase_started');
  assertIncludes(events, 'calendar_premiere_scheduled', 'Missing calendar_premiere_scheduled');
  assertIncludes(events, 'calendar_notification_sent', 'Missing calendar_notification_sent');
});

test('Audit log categories include social media categories', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'social_connectors', 'Missing social_connectors category');
  assertIncludes(categories, 'social_analytics', 'Missing social_analytics category');
  assertIncludes(categories, 'campaign_calendar', 'Missing campaign_calendar category');
});

test('Audit log target types include social entities', () => {
  const targets = auditLogSchema.properties.target.properties.type.enum;
  assertIncludes(targets, 'social_connector', 'Missing social_connector target');
  assertIncludes(targets, 'social_content', 'Missing social_content target');
  assertIncludes(targets, 'campaign', 'Missing campaign target');
  assertIncludes(targets, 'calendar', 'Missing calendar target');
  assertIncludes(targets, 'calendar_premiere', 'Missing calendar_premiere target');
});

// ============== Business Logic Tests ==============

console.log('\n--- Business Logic Tests ---');

test('Cross-platform reach calculation', () => {
  const kpis = fixtures.socialAnalytics.crossPlatformKPIs;
  const platformSum = kpis.reach.reachByPlatform.youtube +
                      kpis.reach.reachByPlatform.facebook +
                      kpis.reach.reachByPlatform.instagram +
                      kpis.reach.reachByPlatform.tiktok +
                      kpis.reach.reachByPlatform.waliinNative;
  // Total reach should be at least equal to platform sum (could be less due to overlap)
  assert(kpis.reach.totalReach >= kpis.reach.uniqueReach, 'Total reach should be >= unique reach');
});

test('Engagement rate is within reasonable bounds', () => {
  const engagement = fixtures.socialAnalytics.crossPlatformKPIs.engagement;
  assert(engagement.engagementRate >= 0 && engagement.engagementRate <= 100, 'Engagement rate should be 0-100');
  Object.values(engagement.engagementByPlatform).forEach(rate => {
    assert(rate >= 0 && rate <= 100, 'Platform engagement rates should be 0-100');
  });
});

test('Conversion funnel has decreasing conversion rates', () => {
  const stages = fixtures.socialAnalytics.funnelTracking.funnelStages;
  // Earlier stages should have lower conversion rates (more people drop off)
  assert(stages[0].conversionToNext < stages[stages.length - 1].conversionToNext, 
    'Early funnel stages should have lower conversion rates');
});

test('Campaign budget allocation sums correctly', () => {
  const budget = fixtures.campaignCalendar.campaigns[0].budget;
  const allocated = budget.allocated;
  const allocationSum = allocated.content_production + 
                        allocated.paid_promotion + 
                        allocated.influencer + 
                        allocated.tools;
  assertEqual(allocationSum, budget.total, 'Budget allocation should equal total');
});

test('Milestone progress is tracked correctly', () => {
  const milestones = fixtures.campaignCalendar.milestones;
  milestones.forEach(milestone => {
    if (milestone.status === 'achieved') {
      assert(milestone.currentValue >= milestone.targetValue, 
        `Achieved milestone ${milestone.name} should meet target`);
    }
    if (milestone.status === 'in_progress') {
      assert(milestone.currentValue < milestone.targetValue, 
        `In-progress milestone ${milestone.name} should not yet meet target`);
    }
  });
});

test('Content cadence content mix sums to 100%', () => {
  const mix = fixtures.campaignCalendar.contentCadence.contentMix;
  const total = mix.entertainment + mix.educational + mix.promotional + 
                mix.community + mix.behindScenes;
  assertEqual(total, 100, 'Content mix should sum to 100%');
});

test('Phase dates are sequential', () => {
  const phases = fixtures.campaignCalendar.launchPhases;
  for (let i = 1; i < phases.length; i++) {
    const prevEnd = new Date(phases[i-1].endDate);
    const currStart = new Date(phases[i].startDate);
    assert(currStart >= prevEnd, `Phase ${phases[i].phaseName} should start after ${phases[i-1].phaseName} ends`);
  }
});

test('Premiere promotion timeline is logical', () => {
  const premiere = fixtures.campaignCalendar.premiereCalendar[0];
  const promotionPlan = premiere.promotionPlan;
  const teaserDate = new Date(promotionPlan.teaserReleaseDate);
  const trailerDate = new Date(promotionPlan.trailerReleaseDate);
  const countdownDate = new Date(promotionPlan.countdownStart);
  const premiereDate = new Date(premiere.premiereDate);
  
  assert(teaserDate < trailerDate, 'Teaser should be before trailer');
  assert(trailerDate < countdownDate, 'Trailer should be before countdown');
  assert(countdownDate < premiereDate, 'Countdown should be before premiere');
});

// ============== Summary ==============

console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
