/**
 * Phase 19: Global Distribution & Partner Integrations Tests
 * 
 * Tests for distribution channels, syndication feeds, partner integrations,
 * regional compliance, and audit logging.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const distributionChannelSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/distribution_channel.schema.json'), 'utf-8')
);
const syndicationFeedSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/syndication_feed.schema.json'), 'utf-8')
);
const partnerIntegrationSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/partner_integration.schema.json'), 'utf-8')
);
const auditLogSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/audit_log.schema.json'), 'utf-8')
);

// Load fixtures
const fixtures = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/distribution.json'), 'utf-8')
);

// Test counters
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
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

function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// ==========================================
// Distribution Channel Tests
// ==========================================

console.log('\n📺 Distribution Channel Schema Tests\n');

test('Schema should have required distribution channel fields', () => {
  const required = distributionChannelSchema.required;
  assertIncludes(required, 'channelId', 'Missing channelId');
  assertIncludes(required, 'name', 'Missing name');
  assertIncludes(required, 'type', 'Missing type');
  assertIncludes(required, 'platform', 'Missing platform');
  assertIncludes(required, 'regions', 'Missing regions');
  assertIncludes(required, 'formats', 'Missing formats');
  assertIncludes(required, 'monetization', 'Missing monetization');
  assertIncludes(required, 'status', 'Missing status');
});

test('Channel types should include all distribution categories', () => {
  const channelTypes = distributionChannelSchema.properties.type.enum;
  assertIncludes(channelTypes, 'streaming', 'Missing streaming');
  assertIncludes(channelTypes, 'broadcast', 'Missing broadcast');
  assertIncludes(channelTypes, 'social_media', 'Missing social_media');
  assertIncludes(channelTypes, 'podcast', 'Missing podcast');
  assertIncludes(channelTypes, 'ott', 'Missing ott');
  assertIncludes(channelTypes, 'radio', 'Missing radio');
});

test('Platform names should include major streaming platforms', () => {
  const platforms = distributionChannelSchema.properties.platform.properties.name.enum;
  assertIncludes(platforms, 'youtube', 'Missing youtube');
  assertIncludes(platforms, 'tiktok', 'Missing tiktok');
  assertIncludes(platforms, 'spotify', 'Missing spotify');
  assertIncludes(platforms, 'netflix', 'Missing netflix');
  assertIncludes(platforms, 'amazon_prime', 'Missing amazon_prime');
});

test('Valid distribution channel should have correct structure', () => {
  const channel = fixtures.validDistributionChannels[0];
  assertEqual(channel.channelId, 'channel-youtube-global');
  assertEqual(channel.type, 'streaming');
  assertEqual(channel.platform.name, 'youtube');
  assertEqual(channel.status, 'active');
  assert(channel.regions.length >= 1, 'Should have at least one region');
});

test('Channel regions should support global and country codes', () => {
  const channel = fixtures.validDistributionChannels[0];
  const globalRegion = channel.regions.find(r => r.code === 'global');
  assert(globalRegion, 'Should have global region');
  assertEqual(globalRegion.enabled, true, 'Global should be enabled');
  
  const chinaRegion = channel.regions.find(r => r.code === 'CN');
  assert(chinaRegion, 'Should have China region');
  assertEqual(chinaRegion.enabled, false, 'China should be disabled');
});

test('Regional restrictions should define action types', () => {
  const actionTypes = distributionChannelSchema.properties.regions.items.properties.restrictions.items.properties.action.enum;
  assertIncludes(actionTypes, 'block', 'Missing block');
  assertIncludes(actionTypes, 'modify', 'Missing modify');
  assertIncludes(actionTypes, 'require_approval', 'Missing require_approval');
  assertIncludes(actionTypes, 'age_gate', 'Missing age_gate');
});

test('Channel formats should support video specifications', () => {
  const channel = fixtures.validDistributionChannels[0];
  assert(channel.formats.video.supported, 'Video should be supported');
  assertIncludes(channel.formats.video.codecs, 'h264', 'Should support h264');
  assertIncludes(channel.formats.video.resolutions, '1080p', 'Should support 1080p');
  assertIncludes(channel.formats.video.aspectRatios, '16:9', 'Should support 16:9');
});

test('Channel formats should support subtitles and captions', () => {
  const channel = fixtures.validDistributionChannels[0];
  assert(channel.formats.subtitles.supported, 'Subtitles should be supported');
  assertIncludes(channel.formats.subtitles.formats, 'srt', 'Should support srt');
  assert(channel.formats.captions.supported, 'Captions should be supported');
});

test('Monetization models should be configurable', () => {
  const models = distributionChannelSchema.properties.monetization.properties.model.enum;
  assertIncludes(models, 'ad_supported', 'Missing ad_supported');
  assertIncludes(models, 'subscription', 'Missing subscription');
  assertIncludes(models, 'transactional', 'Missing transactional');
  assertIncludes(models, 'hybrid', 'Missing hybrid');
  assertIncludes(models, 'licensed', 'Missing licensed');
});

test('Channel should have revenue share configuration', () => {
  const channel = fixtures.validDistributionChannels[0];
  assert(channel.monetization.revenueShare, 'Should have revenue share');
  const totalShare = channel.monetization.revenueShare.creatorPercentage +
                     channel.monetization.revenueShare.platformPercentage +
                     channel.monetization.revenueShare.franchisePercentage;
  assertEqual(totalShare, 100, 'Revenue share should total 100%');
});

test('Localization should support RTL languages', () => {
  const channel = fixtures.validDistributionChannels[0];
  assert(channel.localization.rtlSupport, 'Should support RTL');
  assertIncludes(channel.localization.supportedLanguages, 'ar', 'Should support Arabic');
  assertIncludes(channel.localization.supportedLanguages, 'am', 'Should support Amharic');
});

test('QC requirements should be configurable', () => {
  const channel = fixtures.validDistributionChannels[0];
  assert(channel.qcRequirements.autoQc, 'Auto QC should be enabled');
  assert(channel.qcRequirements.minimumQcScore >= 0, 'Should have minimum QC score');
  assertIncludes(channel.qcRequirements.checks, 'technical_quality', 'Should check technical quality');
});

test('Analytics metrics should be available', () => {
  const channel = fixtures.validDistributionChannels[0];
  assert(channel.analytics.available, 'Analytics should be available');
  assertIncludes(channel.analytics.metrics, 'views', 'Should track views');
  assertIncludes(channel.analytics.metrics, 'revenue', 'Should track revenue');
  assertIncludes(channel.analytics.metrics, 'engagement', 'Should track engagement');
});

// ==========================================
// Syndication Feed Tests
// ==========================================

console.log('\n📡 Syndication Feed Schema Tests\n');

test('Schema should have required syndication feed fields', () => {
  const required = syndicationFeedSchema.required;
  assertIncludes(required, 'feedId', 'Missing feedId');
  assertIncludes(required, 'name', 'Missing name');
  assertIncludes(required, 'type', 'Missing type');
  assertIncludes(required, 'format', 'Missing format');
  assertIncludes(required, 'endpoint', 'Missing endpoint');
  assertIncludes(required, 'status', 'Missing status');
});

test('Feed types should include all syndication formats', () => {
  const feedTypes = syndicationFeedSchema.properties.type.enum;
  assertIncludes(feedTypes, 'rss', 'Missing rss');
  assertIncludes(feedTypes, 'atom', 'Missing atom');
  assertIncludes(feedTypes, 'json_feed', 'Missing json_feed');
  assertIncludes(feedTypes, 'mrss', 'Missing mrss');
  assertIncludes(feedTypes, 'api', 'Missing api');
  assertIncludes(feedTypes, 'webhook', 'Missing webhook');
});

test('Valid syndication feed should have correct structure', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assertEqual(feed.feedId, 'feed-podcast-kenya');
  assertEqual(feed.type, 'rss');
  assertEqual(feed.format.contentType, 'application/rss+xml');
  assertEqual(feed.status, 'active');
});

test('Feed format should support RSS extensions', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assert(feed.format.extensions.length >= 1, 'Should have extensions');
  
  const itunesExt = feed.format.extensions.find(e => e.name === 'itunes');
  assert(itunesExt, 'Should have iTunes extension');
  assertEqual(itunesExt.prefix, 'itunes');
});

test('Feed endpoint should have URL and authentication config', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assert(feed.endpoint.url, 'Should have endpoint URL');
  assert(feed.endpoint.authentication, 'Should have authentication config');
  assert(feed.endpoint.rateLimit, 'Should have rate limit config');
});

test('Feed content should support filtering and sorting', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assert(feed.content.itemLimit >= 1, 'Should have item limit');
  assert(feed.content.includeTypes.length >= 1, 'Should have include types');
  assert(feed.content.filters.length >= 1, 'Should have filters');
  assert(feed.content.sorting, 'Should have sorting');
});

test('Feed localization should support multiple languages', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assert(feed.localization.enabled, 'Localization should be enabled');
  assert(feed.localization.languages.length >= 1, 'Should have languages');
  
  const swahiliFeed = feed.localization.languages.find(l => l.code === 'sw');
  assert(swahiliFeed, 'Should have Swahili feed');
  assert(swahiliFeed.feedUrl, 'Should have localized feed URL');
});

test('Feed compliance should include licensing terms', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assert(feed.compliance, 'Should have compliance config');
  assert(feed.compliance.licensingTerms, 'Should have licensing terms');
  assertIncludes(['exclusive', 'non_exclusive', 'limited', 'perpetual', 'time_limited'], 
                 feed.compliance.licensingTerms.licenseType, 'Should have valid license type');
});

test('Feed webhooks should support event notifications', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assert(feed.webhooks.length >= 1, 'Should have webhooks');
  
  const webhook = feed.webhooks[0];
  assert(webhook.url, 'Webhook should have URL');
  assert(webhook.events.length >= 1, 'Webhook should have events');
  assertIncludes(webhook.events, 'item_added', 'Should notify on item_added');
});

test('Feed metrics should track subscriber and request data', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assert(feed.metrics.totalItems >= 0, 'Should track total items');
  assert(feed.metrics.totalSubscribers >= 0, 'Should track subscribers');
  assert(feed.metrics.requestsToday >= 0, 'Should track requests');
});

// ==========================================
// Partner Integration Tests
// ==========================================

console.log('\n🤝 Partner Integration Schema Tests\n');

test('Schema should have required partner integration fields', () => {
  const required = partnerIntegrationSchema.required;
  assertIncludes(required, 'partnerId', 'Missing partnerId');
  assertIncludes(required, 'name', 'Missing name');
  assertIncludes(required, 'type', 'Missing type');
  assertIncludes(required, 'contact', 'Missing contact');
  assertIncludes(required, 'api', 'Missing api');
  assertIncludes(required, 'status', 'Missing status');
});

test('Partner types should include all integration categories', () => {
  const partnerTypes = partnerIntegrationSchema.properties.type.enum;
  assertIncludes(partnerTypes, 'payment_provider', 'Missing payment_provider');
  assertIncludes(partnerTypes, 'distribution_platform', 'Missing distribution_platform');
  assertIncludes(partnerTypes, 'analytics_provider', 'Missing analytics_provider');
  assertIncludes(partnerTypes, 'syndicator', 'Missing syndicator');
  assertIncludes(partnerTypes, 'broadcaster', 'Missing broadcaster');
});

test('Partnership tiers should be defined', () => {
  const tiers = partnerIntegrationSchema.properties.tier.enum;
  assertIncludes(tiers, 'strategic', 'Missing strategic');
  assertIncludes(tiers, 'preferred', 'Missing preferred');
  assertIncludes(tiers, 'standard', 'Missing standard');
  assertIncludes(tiers, 'trial', 'Missing trial');
});

test('Valid partner integration should have correct structure', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assertEqual(partner.partnerId, 'partner-stripe-payments');
  assertEqual(partner.type, 'payment_provider');
  assertEqual(partner.tier, 'strategic');
  assertEqual(partner.status, 'active');
});

test('Partner API should have authentication configuration', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.api.baseUrl, 'Should have base URL');
  assert(partner.api.authentication, 'Should have authentication');
  assertIncludes(['api_key', 'oauth2', 'bearer_token', 'basic_auth', 'hmac', 'jwt', 'custom'],
                 partner.api.authentication.type, 'Should have valid auth type');
  assert(partner.api.authentication.credentialRef, 'Should have credential reference');
});

test('Partner API should define endpoints', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.api.endpoints.length >= 1, 'Should have endpoints');
  
  const endpoint = partner.api.endpoints[0];
  assert(endpoint.name, 'Endpoint should have name');
  assert(endpoint.path, 'Endpoint should have path');
  assertIncludes(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], endpoint.method, 'Should have valid method');
});

test('Partner should support webhooks with signature verification', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.api.webhooks, 'Should have webhooks config');
  assertEqual(partner.api.webhooks.supported, true, 'Webhooks should be supported');
  assertIncludes(['hmac_sha256', 'hmac_sha512', 'rsa', 'none'], 
                 partner.api.webhooks.signatureVerification, 'Should have valid signature verification');
});

test('Partner capabilities should be configurable', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.capabilities.length >= 1, 'Should have capabilities');
  
  const paymentCap = partner.capabilities.find(c => c.capabilityId === 'payment_processing');
  assert(paymentCap, 'Should have payment processing capability');
  assertEqual(paymentCap.enabled, true, 'Payment should be enabled');
});

test('Partner revenue share should be defined', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.revenueShare, 'Should have revenue share');
  assertIncludes(['percentage', 'flat_fee', 'tiered', 'performance_based', 'hybrid'],
                 partner.revenueShare.model, 'Should have valid model');
});

test('Partner SLA should define uptime and response times', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.sla, 'Should have SLA');
  assert(partner.sla.uptimeGuarantee >= 99, 'Should have high uptime guarantee');
  assert(partner.sla.responseTime.p95, 'Should define p95 response time');
});

test('Partner compliance should include certifications', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.compliance, 'Should have compliance config');
  assert(partner.compliance.certifications.length >= 1, 'Should have certifications');
  assertIncludes(partner.compliance.certifications, 'PCI-DSS', 'Payment provider should have PCI-DSS');
});

test('Partner integration status should be tracked', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.integrationStatus, 'Should have integration status');
  assertEqual(partner.integrationStatus.setupComplete, true, 'Setup should be complete');
  assertIncludes(['healthy', 'degraded', 'unhealthy', 'unknown'],
                 partner.integrationStatus.healthStatus, 'Should have valid health status');
});

test('Partner metrics should track performance', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.metrics, 'Should have metrics');
  assert(partner.metrics.totalTransactions >= 0, 'Should track transactions');
  assert(partner.metrics.errorRate >= 0 && partner.metrics.errorRate <= 100, 'Error rate should be 0-100');
  assert(partner.metrics.uptime >= 0 && partner.metrics.uptime <= 100, 'Uptime should be 0-100');
});

test('Partner sandbox should be available for testing', () => {
  const partner = fixtures.validPartnerIntegrations[0];
  assert(partner.api.sandbox, 'Should have sandbox config');
  assertEqual(partner.api.sandbox.available, true, 'Sandbox should be available');
  assert(partner.api.sandbox.credentialRef, 'Sandbox should have credential reference');
});

// ==========================================
// Distribution Audit Events Tests
// ==========================================

console.log('\n📝 Distribution Audit Events Tests\n');

test('Audit log should support distribution event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'distribution_started', 'Missing distribution_started');
  assertIncludes(eventTypes, 'distribution_completed', 'Missing distribution_completed');
  assertIncludes(eventTypes, 'distribution_failed', 'Missing distribution_failed');
  assertIncludes(eventTypes, 'channel_created', 'Missing channel_created');
  assertIncludes(eventTypes, 'channel_activated', 'Missing channel_activated');
});

test('Audit log should support syndication event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'syndication_feed_created', 'Missing syndication_feed_created');
  assertIncludes(eventTypes, 'syndication_feed_updated', 'Missing syndication_feed_updated');
  assertIncludes(eventTypes, 'syndication_item_added', 'Missing syndication_item_added');
});

test('Audit log should support partner event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'partner_integration_created', 'Missing partner_integration_created');
  assertIncludes(eventTypes, 'partner_integration_activated', 'Missing partner_integration_activated');
  assertIncludes(eventTypes, 'partner_api_call', 'Missing partner_api_call');
  assertIncludes(eventTypes, 'partner_webhook_received', 'Missing partner_webhook_received');
});

test('Audit log should support compliance event types', () => {
  const eventTypes = auditLogSchema.properties.eventType.enum;
  assertIncludes(eventTypes, 'regional_compliance_check_passed', 'Missing regional_compliance_check_passed');
  assertIncludes(eventTypes, 'regional_compliance_check_failed', 'Missing regional_compliance_check_failed');
  assertIncludes(eventTypes, 'geo_restriction_applied', 'Missing geo_restriction_applied');
});

test('Audit log should support distribution categories', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'distribution', 'Missing distribution category');
  assertIncludes(categories, 'syndication', 'Missing syndication category');
  assertIncludes(categories, 'partner', 'Missing partner category');
});

test('Audit log should support new target types', () => {
  const targetTypes = auditLogSchema.properties.target.properties.type.enum;
  assertIncludes(targetTypes, 'distribution_channel', 'Missing distribution_channel target');
  assertIncludes(targetTypes, 'syndication_feed', 'Missing syndication_feed target');
  assertIncludes(targetTypes, 'partner_integration', 'Missing partner_integration target');
});

test('Valid distribution audit events should have correct structure', () => {
  const events = fixtures.distributionAuditEvents;
  assert(events.length >= 1, 'Should have audit events');
  
  const distEvent = events.find(e => e.eventType === 'distribution_started');
  assert(distEvent, 'Should have distribution_started event');
  assertEqual(distEvent.category, 'distribution');
  assertEqual(distEvent.target.type, 'distribution_channel');
});

test('Distribution events should include content metadata', () => {
  const events = fixtures.distributionAuditEvents;
  const completedEvent = events.find(e => e.eventType === 'distribution_completed');
  assert(completedEvent, 'Should have distribution_completed event');
  
  assert(completedEvent.details.metadata.episodeId, 'Should include episode ID');
  assert(completedEvent.details.metadata.platformVideoId, 'Should include platform video ID');
});

test('Partner events should track integration details', () => {
  const events = fixtures.distributionAuditEvents;
  const partnerEvent = events.find(e => e.eventType === 'partner_integration_created');
  assert(partnerEvent, 'Should have partner event');
  
  assertEqual(partnerEvent.category, 'partner');
  assertEqual(partnerEvent.target.type, 'partner_integration');
  assert(partnerEvent.details.metadata.partnerType, 'Should include partner type');
});

test('Compliance events should include check results', () => {
  const events = fixtures.distributionAuditEvents;
  const complianceEvent = events.find(e => e.eventType === 'regional_compliance_check_passed');
  assert(complianceEvent, 'Should have compliance event');
  
  assertEqual(complianceEvent.category, 'compliance');
  assert(complianceEvent.details.metadata.region, 'Should include region');
  assert(complianceEvent.details.metadata.checksPassed, 'Should include checks passed');
});

// ==========================================
// Integration Tests
// ==========================================

console.log('\n🔗 Integration Tests\n');

test('Distribution channels should support African languages', () => {
  const channel = fixtures.validDistributionChannels[1];
  assertIncludes(channel.localization.supportedLanguages, 'sw', 'Should support Swahili');
  assertIncludes(channel.localization.supportedLanguages, 'am', 'Should support Amharic');
  assertIncludes(channel.localization.supportedLanguages, 'om', 'Should support Oromifa');
});

test('Syndication feeds should reference valid channels', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  assert(feed.distribution.channels.length >= 1, 'Should have target channels');
  assert(feed.distribution.partners.length >= 1, 'Should have distribution partners');
});

test('Partner integrations should align with monetization requirements', () => {
  const paymentPartner = fixtures.validPartnerIntegrations.find(p => p.type === 'payment_provider');
  assert(paymentPartner, 'Should have payment provider');
  
  const paymentCap = paymentPartner.capabilities.find(c => c.capabilityId === 'payment_processing');
  assert(paymentCap, 'Should have payment processing');
  assertIncludes(paymentCap.configuration.supportedMethods, 'card', 'Should support card payments');
});

test('Regional compliance should align with channel restrictions', () => {
  const channel = fixtures.validDistributionChannels[0];
  const globalRegion = channel.regions.find(r => r.code === 'global');
  
  assertIncludes(globalRegion.compliance, 'GDPR', 'Global should require GDPR');
  assertIncludes(globalRegion.compliance, 'CCPA', 'Global should require CCPA');
});

test('Analytics partners should provide required metrics', () => {
  const analyticsPartner = fixtures.validPartnerIntegrations.find(p => p.type === 'analytics_provider');
  assert(analyticsPartner, 'Should have analytics provider');
  
  const trackingCap = analyticsPartner.capabilities.find(c => c.capabilityId === 'event_tracking');
  assert(trackingCap, 'Should have event tracking capability');
  assertEqual(trackingCap.enabled, true, 'Tracking should be enabled');
});

test('Feed webhooks should correlate with audit events', () => {
  const feed = fixtures.validSyndicationFeeds[0];
  const webhook = feed.webhooks[0];
  
  // Webhook events should match audit event types
  assertIncludes(webhook.events, 'item_added', 'Webhook should notify on item_added');
  assertIncludes(webhook.events, 'feed_updated', 'Webhook should notify on feed_updated');
});

// ==========================================
// Summary
// ==========================================

console.log('\n========================================');
console.log(`Phase 19 Tests Complete: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
