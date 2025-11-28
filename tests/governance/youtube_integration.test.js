/**
 * YouTube Integration Tests for SL18 + Waliin Studio
 * Tests for content publishing, monetization, cross-linking, analytics, and governance
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const youtubeIntegrationSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/youtube_integration.schema.json'), 'utf8')
);
const auditLogSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/audit_log.schema.json'), 'utf8')
);

// Load fixtures
const fixtures = JSON.parse(
  readFileSync(join(__dirname, './fixtures/youtube_integration.json'), 'utf8')
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

console.log('\n=== YouTube Integration Tests ===\n');

// ============== Schema Structure Tests ==============

console.log('--- Schema Structure Tests ---');

test('YouTube integration schema has required fields', () => {
  assert(youtubeIntegrationSchema.required.includes('integrationId'), 'Missing integrationId');
  assert(youtubeIntegrationSchema.required.includes('version'), 'Missing version');
  assert(youtubeIntegrationSchema.required.includes('channelConfig'), 'Missing channelConfig');
  assert(youtubeIntegrationSchema.required.includes('contentPublishing'), 'Missing contentPublishing');
  assert(youtubeIntegrationSchema.required.includes('status'), 'Missing status');
});

test('Integration ID pattern validation', () => {
  const pattern = new RegExp(youtubeIntegrationSchema.properties.integrationId.pattern);
  assert(pattern.test('youtube-waliin-studio-main'), 'Valid ID should match');
  assert(pattern.test('youtube-drama-franchise'), 'Valid ID should match');
  assert(!pattern.test('invalid-id'), 'Invalid ID should not match');
  assert(!pattern.test('tiktok-waliin-studio'), 'Non-YouTube ID should not match');
});

test('Channel ID pattern follows YouTube format', () => {
  const pattern = new RegExp(youtubeIntegrationSchema.properties.channelConfig.properties.channelId.pattern);
  assert(pattern.test('UCabcdefghijklmnopqrstuv'), 'Valid YouTube channel ID should match');
  assert(!pattern.test('invalid-channel'), 'Invalid channel ID should not match');
});

test('Channel types are defined', () => {
  const types = youtubeIntegrationSchema.properties.channelConfig.properties.channelType.enum;
  assertIncludes(types, 'main', 'Missing main type');
  assertIncludes(types, 'franchise', 'Missing franchise type');
  assertIncludes(types, 'persona', 'Missing persona type');
  assertIncludes(types, 'regional', 'Missing regional type');
  assertIncludes(types, 'shorts_only', 'Missing shorts_only type');
});

test('Status values are defined', () => {
  const statuses = youtubeIntegrationSchema.properties.status.enum;
  assertIncludes(statuses, 'active', 'Missing active status');
  assertIncludes(statuses, 'inactive', 'Missing inactive status');
  assertIncludes(statuses, 'setup_pending', 'Missing setup_pending status');
  assertIncludes(statuses, 'suspended', 'Missing suspended status');
  assertIncludes(statuses, 'deprecated', 'Missing deprecated status');
});

// ============== Content Publishing Tests ==============

console.log('\n--- Content Publishing Tests ---');

test('Content types include all required formats', () => {
  const contentTypes = youtubeIntegrationSchema.properties.contentPublishing.properties.contentTypes.items.properties.type.enum;
  assertIncludes(contentTypes, 'short', 'Missing short type');
  assertIncludes(contentTypes, 'teaser', 'Missing teaser type');
  assertIncludes(contentTypes, 'trailer', 'Missing trailer type');
  assertIncludes(contentTypes, 'highlight', 'Missing highlight type');
  assertIncludes(contentTypes, 'full_episode', 'Missing full_episode type');
  assertIncludes(contentTypes, 'behind_scenes', 'Missing behind_scenes type');
  assertIncludes(contentTypes, 'live_stream', 'Missing live_stream type');
  assertIncludes(contentTypes, 'community_post', 'Missing community_post type');
});

test('Shorts format requirements are correct', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const shortsConfig = sample.contentPublishing.videoSpecs.shorts;
  assertEqual(shortsConfig.resolution, '1080x1920', 'Shorts resolution should be 1080x1920');
  assertEqual(shortsConfig.aspectRatio, '9:16', 'Shorts aspect ratio should be 9:16');
  assertEqual(shortsConfig.maxDurationSeconds, 60, 'Shorts max duration should be 60 seconds');
});

test('Long-form video specs are defined', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const longFormConfig = sample.contentPublishing.videoSpecs.longForm;
  assertEqual(longFormConfig.resolution, '1920x1080', 'Long-form resolution should be 1920x1080');
  assertEqual(longFormConfig.aspectRatio, '16:9', 'Long-form aspect ratio should be 16:9');
});

test('Thumbnail requirements match YouTube specs', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const thumbnailConfig = sample.contentPublishing.thumbnailRequirements;
  assertEqual(thumbnailConfig.width, 1280, 'Thumbnail width should be 1280');
  assertEqual(thumbnailConfig.height, 720, 'Thumbnail height should be 720');
  assertEqual(thumbnailConfig.maxSizeBytes, 2097152, 'Max size should be 2MB');
});

test('Publishing cadence is configured for Shorts', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const shortsType = sample.contentPublishing.contentTypes.find(t => t.type === 'short');
  assert(shortsType.enabled, 'Shorts should be enabled');
  assertEqual(shortsType.cadence.frequency, 'weekly', 'Shorts cadence should be weekly');
  assertGreaterThan(shortsType.cadence.targetCount, 0, 'Target count should be positive');
});

test('Subtitle languages include multilingual support', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const subtitleConfig = sample.contentPublishing.subtitles;
  assert(subtitleConfig.autoGenerate, 'Auto-generate should be enabled');
  assertIncludes(subtitleConfig.languages, 'en', 'English should be included');
  assertIncludes(subtitleConfig.languages, 'am', 'Amharic should be included');
  assertIncludes(subtitleConfig.languages, 'sw', 'Swahili should be included');
});

// ============== Cross-Linking Tests ==============

console.log('\n--- Cross-Linking & Funnel Tests ---');

test('Waliin Studio links are configured', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const links = sample.crossLinking.waliinStudioLinks;
  assert(links.baseUrl.includes('waliin.studio'), 'Base URL should include waliin.studio');
  assert(links.premiumUrl.includes('premium'), 'Premium URL should include premium');
  assert(links.watchUrl.includes('{episodeId}'), 'Watch URL should have episodeId placeholder');
});

test('End screens are configured with funnel elements', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const endScreens = sample.crossLinking.endScreens;
  assert(endScreens.enabled, 'End screens should be enabled');
  assertEqual(endScreens.durationSeconds, 20, 'End screen duration should be 20 seconds');
  assert(endScreens.elements.length >= 2, 'Should have at least 2 end screen elements');
  
  const subscribeElement = endScreens.elements.find(e => e.type === 'subscribe');
  assert(subscribeElement, 'Should have subscribe element');
  
  const linkElement = endScreens.elements.find(e => e.type === 'link');
  assert(linkElement, 'Should have link element');
});

test('Cards are configured for premium funnel', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const cards = sample.crossLinking.cards;
  assert(cards.enabled, 'Cards should be enabled');
  assertGreaterThan(cards.maxCardsPerVideo, 0, 'Max cards should be positive');
  
  const premiumCard = cards.defaultCards.find(c => c.linkUrl.includes('premium'));
  assert(premiumCard, 'Should have premium link card');
});

test('Pinned comments template includes Waliin link', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const pinnedComments = sample.crossLinking.pinnedComments;
  assert(pinnedComments.enabled, 'Pinned comments should be enabled');
  assert(pinnedComments.template.includes('{waliinUrl}'), 'Template should include Waliin URL placeholder');
  assert(pinnedComments.includePremiumCta, 'Should include premium CTA');
});

test('Community tab is enabled with post types', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const communityTab = sample.crossLinking.communityTab;
  assert(communityTab.enabled, 'Community tab should be enabled');
  assertIncludes(communityTab.postTypes, 'poll', 'Should support polls');
  assert(communityTab.pollsEnabled, 'Polls should be enabled');
});

// ============== Monetization Tests ==============

console.log('\n--- Monetization Tests ---');

test('Ad settings are properly configured', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const adSettings = sample.monetization.adSettings;
  assert(adSettings.preRoll, 'Pre-roll should be enabled');
  assert(adSettings.midRoll, 'Mid-roll should be enabled');
  assertEqual(adSettings.midRollMinDurationMinutes, 8, 'Mid-roll min duration should be 8 minutes');
  assert(adSettings.shortsAds, 'Shorts ads should be enabled');
});

test('Fan funding features are enabled', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const fanFunding = sample.monetization.fanFunding;
  assert(fanFunding.superChatEnabled, 'Super Chat should be enabled');
  assert(fanFunding.superStickersEnabled, 'Super Stickers should be enabled');
  assert(fanFunding.superThanksEnabled, 'Super Thanks should be enabled');
});

test('Membership tiers are properly structured', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const memberships = sample.monetization.memberships;
  assert(memberships.enabled, 'Memberships should be enabled');
  assertEqual(memberships.tiers.length, 4, 'Should have 4 membership tiers');
  
  const supporterTier = memberships.tiers[0];
  assertEqual(supporterTier.name, 'Supporter', 'First tier should be Supporter');
  assertEqual(supporterTier.priceUsd, 2.99, 'Supporter price should be $2.99');
  
  const patronTier = memberships.tiers[3];
  assertEqual(patronTier.name, 'Patron', 'Fourth tier should be Patron');
  assertEqual(patronTier.priceUsd, 24.99, 'Patron price should be $24.99');
});

test('Membership perks escalate with tier', () => {
  const tiers = fixtures.membershipTiers;
  assert(tiers.supporter.perks.length < tiers.fan.perks.length, 'Fan should have more perks than Supporter');
  assert(tiers.fan.perks.length < tiers.vip.perks.length, 'VIP should have more perks than Fan');
  assert(tiers.vip.perks.length < tiers.patron.perks.length, 'Patron should have more perks than VIP');
});

test('Early access hours increase with tier', () => {
  const tiers = fixtures.membershipTiers;
  assert(!tiers.supporter.earlyAccessHours, 'Supporter should not have early access');
  assertEqual(tiers.fan.earlyAccessHours, 24, 'Fan should have 24 hours early access');
  assertEqual(tiers.vip.earlyAccessHours, 48, 'VIP should have 48 hours early access');
  assertEqual(tiers.patron.earlyAccessHours, 72, 'Patron should have 72 hours early access');
});

test('Brand Connect is configured with disclosure', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const brandConnect = sample.monetization.brandConnect;
  assert(brandConnect.enabled, 'Brand Connect should be enabled');
  assert(brandConnect.disclosureRequired, 'Disclosure should be required');
});

// ============== Analytics Tests ==============

console.log('\n--- Analytics & Reporting Tests ---');

test('Analytics sync is enabled', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const analytics = sample.analytics;
  assert(analytics.enabled, 'Analytics should be enabled');
  assert(analytics.syncEnabled, 'Sync should be enabled');
  assertEqual(analytics.syncIntervalMinutes, 60, 'Sync interval should be 60 minutes');
});

test('Discovery metrics are tracked', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const discoveryMetrics = sample.analytics.metrics.discovery;
  assertIncludes(discoveryMetrics, 'views', 'Should track views');
  assertIncludes(discoveryMetrics, 'watch_time', 'Should track watch time');
  assertIncludes(discoveryMetrics, 'impressions', 'Should track impressions');
  assertIncludes(discoveryMetrics, 'ctr', 'Should track CTR');
  assertIncludes(discoveryMetrics, 'subscriber_gained', 'Should track subscriber gained');
});

test('Monetization metrics are tracked', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const monetizationMetrics = sample.analytics.metrics.monetization;
  assertIncludes(monetizationMetrics, 'estimated_revenue', 'Should track revenue');
  assertIncludes(monetizationMetrics, 'rpm', 'Should track RPM');
  assertIncludes(monetizationMetrics, 'cpm', 'Should track CPM');
  assertIncludes(monetizationMetrics, 'membership_revenue', 'Should track membership revenue');
});

test('Funnel metrics track Waliin conversions', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const funnelMetrics = sample.analytics.metrics.funnel;
  assertIncludes(funnelMetrics, 'card_clicks', 'Should track card clicks');
  assertIncludes(funnelMetrics, 'end_screen_clicks', 'Should track end screen clicks');
  assertIncludes(funnelMetrics, 'waliin_conversions', 'Should track Waliin conversions');
});

test('Geographic insights are enabled', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const geoInsights = sample.analytics.geographicInsights;
  assert(geoInsights.enabled, 'Geographic insights should be enabled');
  assert(geoInsights.rpmByRegion, 'RPM by region should be enabled');
});

test('Alert thresholds are configured', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const alertThresholds = sample.analytics.reporting.alertThresholds;
  assert(alertThresholds.viewsDropPercent > 0, 'Views drop threshold should be set');
  assert(alertThresholds.revenueDropPercent > 0, 'Revenue drop threshold should be set');
  assertEqual(alertThresholds.copyrightClaims, 1, 'Copyright claims alert should be 1');
});

test('Analytics snapshot has valid daily metrics', () => {
  const daily = fixtures.analyticsSnapshot.daily;
  assertGreaterThan(daily.views, 0, 'Daily views should be positive');
  assertGreaterThan(daily.watchTimeHours, 0, 'Watch time should be positive');
  assert(daily.ctr > 0 && daily.ctr < 100, 'CTR should be between 0 and 100');
});

test('Funnel metrics track conversion rate', () => {
  const funnelMetrics = fixtures.analyticsSnapshot.funnelMetrics;
  assertGreaterThan(funnelMetrics.cardClicks, 0, 'Card clicks should be positive');
  assertGreaterThan(funnelMetrics.waliinConversions, 0, 'Waliin conversions should be positive');
  assert(funnelMetrics.conversionRate > 0, 'Conversion rate should be positive');
});

// ============== Governance Tests ==============

console.log('\n--- Governance & Compliance Tests ---');

test('Cultural sensitivity is integrated with Phase 25', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const culturalSensitivity = sample.governance.culturalSensitivity;
  assert(culturalSensitivity.enabled, 'Cultural sensitivity should be enabled');
  assert(culturalSensitivity.phase25Integration, 'Phase 25 integration should be enabled');
  assertIncludes(culturalSensitivity.blockedCategories, 'religious_sensitivity', 'Should block religious sensitivity');
});

test('Copyright protection is enabled', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const copyright = sample.governance.copyright;
  assert(copyright.contentIdRegistration, 'Content ID registration should be enabled');
  assert(copyright.claimMonitoring, 'Claim monitoring should be enabled');
  assert(copyright.licensedContentCheck, 'Licensed content check should be enabled');
});

test('Age restriction mappings are defined', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const ageRestrictions = sample.governance.ageRestrictions;
  assert(ageRestrictions.autoRestrict, 'Auto-restrict should be enabled');
  assertEqual(ageRestrictions.ratingMappings['G'], 'none', 'G rating should have no restriction');
  assertEqual(ageRestrictions.ratingMappings['TV-MA'], 'age_restricted', 'TV-MA should be age restricted');
  assertEqual(ageRestrictions.ratingMappings['NC-17'], 'not_allowed', 'NC-17 should not be allowed');
});

test('Brand consistency is enforced', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const brandConsistency = sample.governance.brandConsistency;
  assertEqual(brandConsistency.channelName, 'Waliin Studio', 'Channel name should be Waliin Studio');
  assert(brandConsistency.hideSL18Branding, 'SL18 branding should be hidden');
  assert(brandConsistency.poweredByInAbout, 'Powered by should be in About');
});

test('Disclosures are required', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const disclosures = sample.governance.disclosures;
  assert(disclosures.sponsoredContent, 'Sponsored content disclosure should be required');
  assert(disclosures.aiGeneratedContent, 'AI-generated content disclosure should be required');
  assert(disclosures.affiliateLinks, 'Affiliate links disclosure should be required');
});

// ============== Airtable Integration Tests ==============

console.log('\n--- Airtable Integration Tests ---');

test('Airtable field mappings are complete', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const fieldMappings = sample.airtableIntegration.fieldMappings;
  assert(fieldMappings.youtubeEnabled, 'Should have youtubeEnabled mapping');
  assert(fieldMappings.youtubeVideoId, 'Should have youtubeVideoId mapping');
  assert(fieldMappings.youtubePublishStatus, 'Should have youtubePublishStatus mapping');
  assert(fieldMappings.youtubeViews, 'Should have youtubeViews mapping');
  assert(fieldMappings.youtubeRevenue, 'Should have youtubeRevenue mapping');
});

test('Export path uses episodeId placeholder', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  assert(sample.airtableIntegration.exportPath.includes('{episodeId}'), 'Export path should have episodeId placeholder');
});

test('Export files include required types', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const exportFiles = sample.airtableIntegration.exportFiles;
  
  const videoFile = exportFiles.find(f => f.type === 'video');
  assert(videoFile && videoFile.required, 'Video file should be required');
  
  const thumbnailFile = exportFiles.find(f => f.type === 'thumbnail');
  assert(thumbnailFile && thumbnailFile.required, 'Thumbnail file should be required');
  
  const metadataFile = exportFiles.find(f => f.type === 'metadata');
  assert(metadataFile && metadataFile.required, 'Metadata file should be required');
});

// ============== API Configuration Tests ==============

console.log('\n--- API Configuration Tests ---');

test('API versions are configured', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  assertEqual(sample.apiConfiguration.dataApiVersion, 'v3', 'Data API version should be v3');
  assertEqual(sample.apiConfiguration.analyticsApiVersion, 'v2', 'Analytics API version should be v2');
});

test('Quota limits are defined', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const quotaLimits = sample.apiConfiguration.quotaLimits;
  assertEqual(quotaLimits.dailyQuota, 10000, 'Daily quota should be 10000');
  assertEqual(quotaLimits.videoUploadCost, 1600, 'Video upload cost should be 1600');
});

test('Rate limits are defined', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const rateLimits = sample.apiConfiguration.rateLimits;
  assertEqual(rateLimits.requestsPerMinute, 60, 'Requests per minute should be 60');
  assertEqual(rateLimits.uploadsPerDay, 6, 'Uploads per day should be 6');
});

test('Webhooks are configured', () => {
  const sample = fixtures.youtubeIntegration.sampleIntegration;
  const webhooks = sample.apiConfiguration.webhooks;
  assert(webhooks.enabled, 'Webhooks should be enabled');
  assert(webhooks.callbackUrl.includes('waliin.studio'), 'Callback URL should include waliin.studio');
  assertIncludes(webhooks.events, 'video_published', 'Should include video_published event');
  assertIncludes(webhooks.events, 'copyright_claim', 'Should include copyright_claim event');
});

// ============== Fixture Validation Tests ==============

console.log('\n--- Fixture Validation Tests ---');

test('Sample integration has valid statistics', () => {
  const stats = fixtures.youtubeIntegration.sampleIntegration.statistics;
  assertGreaterThan(stats.totalVideos, 0, 'Total videos should be positive');
  assertGreaterThan(stats.totalViews, 0, 'Total views should be positive');
  assertGreaterThan(stats.totalSubscribers, 0, 'Total subscribers should be positive');
});

test('Sample video metadata is valid', () => {
  const videoMetadata = fixtures.videoMetadata.sampleVideo;
  assert(videoMetadata.episodeId.startsWith('ep_'), 'Episode ID should start with ep_');
  assert(videoMetadata.title.includes('Waliin Studio'), 'Title should include Waliin Studio');
  assertEqual(videoMetadata.categoryId, '24', 'Category ID should be 24 (Entertainment)');
  assert(videoMetadata.tags.length > 0, 'Tags should not be empty');
});

test('Video metadata has end screen and cards', () => {
  const videoMetadata = fixtures.videoMetadata.sampleVideo;
  assert(videoMetadata.endScreen, 'Should have end screen config');
  assert(videoMetadata.endScreen.subscribe, 'End screen should have subscribe');
  assert(videoMetadata.cards.length >= 1, 'Should have at least one card');
});

test('Content types fixture matches schema', () => {
  const contentTypes = fixtures.contentTypes;
  assertIncludes(contentTypes, 'short', 'Should include short');
  assertIncludes(contentTypes, 'teaser', 'Should include teaser');
  assertIncludes(contentTypes, 'live_stream', 'Should include live_stream');
});

test('Audit log events cover YouTube integration', () => {
  const events = fixtures.auditLogEvents;
  assertIncludes(events, 'youtube_video_uploaded', 'Should have video uploaded event');
  assertIncludes(events, 'youtube_video_published', 'Should have video published event');
  assertIncludes(events, 'youtube_analytics_synced', 'Should have analytics synced event');
  assertIncludes(events, 'youtube_waliin_conversion_tracked', 'Should have conversion tracking event');
  assertIncludes(events, 'youtube_copyright_claim_received', 'Should have copyright claim event');
});

// ============== Audit Log Integration Tests ==============

console.log('\n--- Audit Log Integration Tests ---');

test('Audit log schema supports YouTube events', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'distribution', 'Audit log should support distribution category');
});

test('YouTube audit events are comprehensive', () => {
  const events = fixtures.auditLogEvents;
  assert(events.length >= 40, 'Should have at least 40 YouTube-specific audit events');
  
  // Check for key event categories
  const hasUploadEvents = events.some(e => e.includes('upload'));
  const hasPublishEvents = events.some(e => e.includes('publish'));
  const hasAnalyticsEvents = events.some(e => e.includes('analytics'));
  const hasMonetizationEvents = events.some(e => e.includes('membership') || e.includes('revenue'));
  const hasComplianceEvents = events.some(e => e.includes('copyright') || e.includes('age_restriction'));
  
  assert(hasUploadEvents, 'Should have upload events');
  assert(hasPublishEvents, 'Should have publish events');
  assert(hasAnalyticsEvents, 'Should have analytics events');
  assert(hasMonetizationEvents, 'Should have monetization events');
  assert(hasComplianceEvents, 'Should have compliance events');
});

// ============== Summary ==============

console.log('\n=== Test Summary ===');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
