/**
 * Phase 29: Waliin Studio Home Pages Tests
 * Tests for showcase, content detail, customer, and studio console schemas
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const waliinShowcaseSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/waliin_showcase.schema.json'), 'utf8')
);
const waliinContentDetailSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/waliin_content_detail.schema.json'), 'utf8')
);
const waliinCustomerSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/waliin_customer.schema.json'), 'utf8')
);
const waliinStudioConsoleSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/waliin_studio_console.schema.json'), 'utf8')
);
const auditLogSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/audit_log.schema.json'), 'utf8')
);

// Load fixtures
const fixtures = JSON.parse(
  readFileSync(join(__dirname, './fixtures/waliin_studio.json'), 'utf8')
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

console.log('\n=== Phase 29: Waliin Studio Home Pages Tests ===\n');

// ============== Waliin Showcase Schema Tests ==============

console.log('--- Waliin Showcase Schema Tests ---');

test('Showcase schema has required fields', () => {
  assert(waliinShowcaseSchema.required.includes('showcaseId'), 'Missing showcaseId');
  assert(waliinShowcaseSchema.required.includes('version'), 'Missing version');
  assert(waliinShowcaseSchema.required.includes('name'), 'Missing name');
  assert(waliinShowcaseSchema.required.includes('scope'), 'Missing scope');
  assert(waliinShowcaseSchema.required.includes('heroBanner'), 'Missing heroBanner');
  assert(waliinShowcaseSchema.required.includes('categoryDisplays'), 'Missing categoryDisplays');
  assert(waliinShowcaseSchema.required.includes('navigation'), 'Missing navigation');
});

test('Showcase ID pattern validation', () => {
  const pattern = new RegExp(waliinShowcaseSchema.properties.showcaseId.pattern);
  assert(pattern.test('showcase-waliin-global'), 'Valid ID should match');
  assert(!pattern.test('invalid-id'), 'Invalid ID should not match');
});

test('Showcase scope levels are defined', () => {
  const levels = waliinShowcaseSchema.properties.scope.properties.level.enum;
  assertIncludes(levels, 'global', 'Missing global scope');
  assertIncludes(levels, 'region', 'Missing region scope');
  assertIncludes(levels, 'country', 'Missing country scope');
  assertIncludes(levels, 'franchise', 'Missing franchise scope');
});

test('Hero banner rotation modes are defined', () => {
  const modes = waliinShowcaseSchema.properties.heroBanner.properties.rotationMode.enum;
  assertIncludes(modes, 'automatic', 'Missing automatic mode');
  assertIncludes(modes, 'manual', 'Missing manual mode');
  assertIncludes(modes, 'shuffle', 'Missing shuffle mode');
  assertIncludes(modes, 'scheduled', 'Missing scheduled mode');
});

test('Hero banner slot content types are defined', () => {
  const slotSchema = waliinShowcaseSchema.properties.heroBanner.properties.slots.items;
  const contentTypes = slotSchema.properties.contentType.enum;
  assertIncludes(contentTypes, 'featured_release', 'Missing featured_release');
  assertIncludes(contentTypes, 'new_release', 'Missing new_release');
  assertIncludes(contentTypes, 'trending', 'Missing trending');
  assertIncludes(contentTypes, 'editors_pick', 'Missing editors_pick');
  assertIncludes(contentTypes, 'premiere', 'Missing premiere');
});

test('Category display types are defined', () => {
  const categorySchema = waliinShowcaseSchema.properties.categoryDisplays.items;
  const types = categorySchema.properties.categoryType.enum;
  assertIncludes(types, 'genre', 'Missing genre type');
  assertIncludes(types, 'ranking', 'Missing ranking type');
  assertIncludes(types, 'trending', 'Missing trending type');
  assertIncludes(types, 'new_releases', 'Missing new_releases type');
  assertIncludes(types, 'continue_watching', 'Missing continue_watching type');
  assertIncludes(types, 'personalized', 'Missing personalized type');
});

test('Category display layouts are defined', () => {
  const categorySchema = waliinShowcaseSchema.properties.categoryDisplays.items;
  const layouts = categorySchema.properties.displayLayout.enum;
  assertIncludes(layouts, 'horizontal_carousel', 'Missing horizontal_carousel');
  assertIncludes(layouts, 'vertical_scroll', 'Missing vertical_scroll');
  assertIncludes(layouts, 'grid', 'Missing grid');
  assertIncludes(layouts, 'hero_row', 'Missing hero_row');
});

test('Genre options are comprehensive', () => {
  const categorySchema = waliinShowcaseSchema.properties.categoryDisplays.items;
  const genres = categorySchema.properties.genre.enum;
  assertIncludes(genres, 'drama', 'Missing drama');
  assertIncludes(genres, 'comedy', 'Missing comedy');
  assertIncludes(genres, 'thriller', 'Missing thriller');
  assertIncludes(genres, 'romance', 'Missing romance');
  assertIncludes(genres, 'documentary', 'Missing documentary');
});

test('Navigation tab types are defined', () => {
  const tabSchema = waliinShowcaseSchema.properties.navigation.properties.tabs.items;
  const types = tabSchema.properties.tabType.enum;
  assertIncludes(types, 'home', 'Missing home tab');
  assertIncludes(types, 'categories', 'Missing categories tab');
  assertIncludes(types, 'popular', 'Missing popular tab');
  assertIncludes(types, 'watchlist', 'Missing watchlist tab');
  assertIncludes(types, 'search', 'Missing search tab');
});

test('Responsive layouts cover all device sizes', () => {
  const layouts = waliinShowcaseSchema.properties.responsiveLayouts.properties;
  assert(layouts.mobile, 'Missing mobile layout');
  assert(layouts.tablet, 'Missing tablet layout');
  assert(layouts.desktop, 'Missing desktop layout');
  assert(layouts.largeDesktop, 'Missing largeDesktop layout');
});

test('Studio promotion features are defined', () => {
  const promo = waliinShowcaseSchema.properties.studioPromotion.properties;
  assert(promo.studioInfo, 'Missing studioInfo');
  assert(promo.upcomingReleases, 'Missing upcomingReleases');
  assert(promo.behindTheScenes, 'Missing behindTheScenes');
  assert(promo.contributorShowcase, 'Missing contributorShowcase');
});

test('Fixture: Showcase data is valid', () => {
  const showcase = fixtures.waliinShowcase;
  assert(showcase.showcaseId === 'showcase-waliin-global', 'Invalid showcaseId');
  assert(showcase.heroBanner.enabled === true, 'Hero banner should be enabled');
  assert(showcase.categoryDisplays.length >= 5, 'Should have at least 5 category displays');
  assert(showcase.navigation.tabs.length >= 5, 'Should have at least 5 navigation tabs');
});

test('Fixture: Hero banner has valid slots', () => {
  const slots = fixtures.waliinShowcase.heroBanner.slots;
  assert(slots.length >= 3, 'Should have at least 3 hero slots');
  assert(slots[0].contentType === 'featured_release', 'First slot should be featured release');
  assert(slots[0].autoplayTrailer === true, 'Featured slot should have autoplay trailer');
});

test('Fixture: Category displays are properly ordered', () => {
  const categories = fixtures.waliinShowcase.categoryDisplays;
  const sortOrders = categories.map(c => c.sortOrder);
  assert(sortOrders[0] === 1, 'First category should have sortOrder 1');
  assert(new Set(sortOrders).size === sortOrders.length, 'Sort orders should be unique');
});

// ============== Waliin Content Detail Schema Tests ==============

console.log('\n--- Waliin Content Detail Schema Tests ---');

test('Content detail schema has required fields', () => {
  assert(waliinContentDetailSchema.required.includes('contentDetailId'), 'Missing contentDetailId');
  assert(waliinContentDetailSchema.required.includes('version'), 'Missing version');
  assert(waliinContentDetailSchema.required.includes('contentType'), 'Missing contentType');
  assert(waliinContentDetailSchema.required.includes('contentInfo'), 'Missing contentInfo');
  assert(waliinContentDetailSchema.required.includes('media'), 'Missing media');
  assert(waliinContentDetailSchema.required.includes('monetization'), 'Missing monetization');
});

test('Content types are defined', () => {
  const types = waliinContentDetailSchema.properties.contentType.enum;
  assertIncludes(types, 'movie', 'Missing movie type');
  assertIncludes(types, 'series', 'Missing series type');
  assertIncludes(types, 'episode', 'Missing episode type');
  assertIncludes(types, 'short_drama', 'Missing short_drama type');
  assertIncludes(types, 'documentary', 'Missing documentary type');
});

test('Content info has localization support', () => {
  const contentInfo = waliinContentDetailSchema.properties.contentInfo.properties;
  assert(contentInfo.titleLocalized, 'Missing title localization');
  assert(contentInfo.synopsisLocalized, 'Missing synopsis localization');
});

test('Content ratings are comprehensive', () => {
  const ratings = waliinContentDetailSchema.properties.contentInfo.properties.rating.properties.contentRating.enum;
  assertIncludes(ratings, 'G', 'Missing G rating');
  assertIncludes(ratings, 'PG', 'Missing PG rating');
  assertIncludes(ratings, 'TV-14', 'Missing TV-14 rating');
  assertIncludes(ratings, 'TV-MA', 'Missing TV-MA rating');
});

test('Cast and crew roles are defined', () => {
  const crewRoles = waliinContentDetailSchema.properties.castAndCrew.properties.crew.items.properties.role.enum;
  assertIncludes(crewRoles, 'director', 'Missing director role');
  assertIncludes(crewRoles, 'writer', 'Missing writer role');
  assertIncludes(crewRoles, 'producer', 'Missing producer role');
  assertIncludes(crewRoles, 'cinematographer', 'Missing cinematographer role');
});

test('Localization options are comprehensive', () => {
  const loc = waliinContentDetailSchema.properties.localization.properties;
  assert(loc.subtitles, 'Missing subtitles');
  assert(loc.dubbedAudio, 'Missing dubbedAudio');
  assert(loc.audioDescriptions, 'Missing audioDescriptions');
});

test('Monetization access models are defined', () => {
  const models = waliinContentDetailSchema.properties.monetization.properties.accessModel.enum;
  assertIncludes(models, 'free', 'Missing free model');
  assertIncludes(models, 'ad_supported', 'Missing ad_supported model');
  assertIncludes(models, 'subscription', 'Missing subscription model');
  assertIncludes(models, 'tvod', 'Missing tvod model');
});

test('Subscription tiers are defined', () => {
  const tiers = waliinContentDetailSchema.properties.monetization.properties.requiredTier.enum;
  assertIncludes(tiers, 'free', 'Missing free tier');
  assertIncludes(tiers, 'basic', 'Missing basic tier');
  assertIncludes(tiers, 'premium', 'Missing premium tier');
  assertIncludes(tiers, 'vip', 'Missing vip tier');
});

test('Player config has skip features', () => {
  const playerConfig = waliinContentDetailSchema.properties.playerConfig.properties;
  assert(playerConfig.skipIntro, 'Missing skipIntro');
  assert(playerConfig.skipCredits, 'Missing skipCredits');
  assert(playerConfig.chapters, 'Missing chapters');
});

test('Social features are defined', () => {
  const social = waliinContentDetailSchema.properties.socialFeatures.properties;
  assert(social.commentsEnabled !== undefined, 'Missing commentsEnabled');
  assert(social.ratingsEnabled !== undefined, 'Missing ratingsEnabled');
  assert(social.watchPartyEnabled !== undefined, 'Missing watchPartyEnabled');
});

test('Fixture: Content detail data is valid', () => {
  const detail = fixtures.waliinContentDetail;
  assert(detail.contentDetailId === 'detail-waliin-drama-001', 'Invalid contentDetailId');
  assert(detail.contentType === 'short_drama', 'Content type should be short_drama');
  assert(detail.contentInfo.genres.length >= 2, 'Should have at least 2 genres');
});

test('Fixture: Content has localized titles', () => {
  const detail = fixtures.waliinContentDetail;
  assert(detail.contentInfo.titleLocalized.am, 'Missing Amharic title');
  assert(detail.contentInfo.titleLocalized.sw, 'Missing Kiswahili title');
});

test('Fixture: Content has engagement metrics', () => {
  const engagement = fixtures.waliinContentDetail.engagement;
  assert(engagement.viewCount > 0, 'Should have view count');
  assert(engagement.averageRating > 0, 'Should have average rating');
  assert(engagement.retentionCurve.length > 0, 'Should have retention curve');
});

test('Fixture: Content has multiple subtitle languages', () => {
  const subtitles = fixtures.waliinContentDetail.localization.subtitles;
  assert(subtitles.length >= 4, 'Should have at least 4 subtitle languages');
  assert(subtitles.some(s => s.language === 'en'), 'Should have English subtitles');
});

// ============== Waliin Customer Schema Tests ==============

console.log('\n--- Waliin Customer Schema Tests ---');

test('Customer schema has required fields', () => {
  assert(waliinCustomerSchema.required.includes('customerId'), 'Missing customerId');
  assert(waliinCustomerSchema.required.includes('version'), 'Missing version');
  assert(waliinCustomerSchema.required.includes('profile'), 'Missing profile');
  assert(waliinCustomerSchema.required.includes('subscription'), 'Missing subscription');
});

test('Subscription tiers are defined', () => {
  const tiers = waliinCustomerSchema.properties.subscription.properties.tier.enum;
  assertIncludes(tiers, 'free', 'Missing free tier');
  assertIncludes(tiers, 'basic', 'Missing basic tier');
  assertIncludes(tiers, 'premium', 'Missing premium tier');
  assertIncludes(tiers, 'vip', 'Missing vip tier');
  assertIncludes(tiers, 'family', 'Missing family tier');
});

test('Subscription status options are defined', () => {
  const statuses = waliinCustomerSchema.properties.subscription.properties.status.enum;
  assertIncludes(statuses, 'active', 'Missing active status');
  assertIncludes(statuses, 'trial', 'Missing trial status');
  assertIncludes(statuses, 'expired', 'Missing expired status');
  assertIncludes(statuses, 'cancelled', 'Missing cancelled status');
});

test('Payment method types are defined', () => {
  const types = waliinCustomerSchema.properties.subscription.properties.paymentMethod.properties.type.enum;
  assertIncludes(types, 'credit_card', 'Missing credit_card');
  assertIncludes(types, 'mobile_money', 'Missing mobile_money');
  assertIncludes(types, 'paypal', 'Missing paypal');
});

test('Watchlist schema is defined', () => {
  const watchlist = waliinCustomerSchema.properties.watchlist.properties;
  assert(watchlist.items, 'Missing watchlist items');
  assert(watchlist.maxItems, 'Missing maxItems');
});

test('Watch history schema is defined', () => {
  const history = waliinCustomerSchema.properties.watchHistory.properties;
  assert(history.items, 'Missing history items');
  assert(history.continueWatching, 'Missing continueWatching');
  assert(history.retentionDays, 'Missing retentionDays');
});

test('Downloads schema is defined', () => {
  const downloads = waliinCustomerSchema.properties.downloads.properties;
  assert(downloads.items, 'Missing download items');
  assert(downloads.usedStorage, 'Missing usedStorage');
  assert(downloads.maxStorage, 'Missing maxStorage');
});

test('Personalization schema is comprehensive', () => {
  const personalization = waliinCustomerSchema.properties.personalization.properties;
  assert(personalization.recommendations, 'Missing recommendations');
  assert(personalization.genreAffinities, 'Missing genreAffinities');
  assert(personalization.personaAffinities, 'Missing personaAffinities');
  assert(personalization.watchingPatterns, 'Missing watchingPatterns');
});

test('Device types are defined', () => {
  const deviceSchema = waliinCustomerSchema.properties.devices.items;
  const types = deviceSchema.properties.deviceType.enum;
  assertIncludes(types, 'mobile', 'Missing mobile');
  assertIncludes(types, 'tablet', 'Missing tablet');
  assertIncludes(types, 'smart_tv', 'Missing smart_tv');
  assertIncludes(types, 'streaming_device', 'Missing streaming_device');
});

test('Family profiles schema is defined', () => {
  const family = waliinCustomerSchema.properties.familyProfiles.properties;
  assert(family.enabled !== undefined, 'Missing enabled');
  assert(family.profiles, 'Missing profiles');
});

test('Privacy settings are comprehensive', () => {
  const privacy = waliinCustomerSchema.properties.privacy.properties;
  assert(privacy.dataCollection !== undefined, 'Missing dataCollection');
  assert(privacy.personalizedAds !== undefined, 'Missing personalizedAds');
  assert(privacy.gdprConsent !== undefined, 'Missing gdprConsent');
});

test('Fixture: Customer data is valid', () => {
  const customer = fixtures.waliinCustomer;
  assert(customer.customerId === 'customer-waliin-001', 'Invalid customerId');
  assert(customer.subscription.tier === 'premium', 'Should be premium tier');
  assert(customer.subscription.status === 'active', 'Should be active');
});

test('Fixture: Customer has watchlist items', () => {
  const watchlist = fixtures.waliinCustomer.watchlist;
  assert(watchlist.items.length >= 2, 'Should have at least 2 watchlist items');
});

test('Fixture: Customer has watch history', () => {
  const history = fixtures.waliinCustomer.watchHistory;
  assert(history.items.length >= 2, 'Should have at least 2 history items');
  assert(history.continueWatching.length >= 1, 'Should have continue watching items');
});

test('Fixture: Customer has genre affinities', () => {
  const affinities = fixtures.waliinCustomer.personalization.genreAffinities;
  assert(affinities.length >= 3, 'Should have at least 3 genre affinities');
  assert(affinities[0].affinity > 0, 'Affinity should be positive');
});

// ============== Waliin Studio Console Schema Tests ==============

console.log('\n--- Waliin Studio Console Schema Tests ---');

test('Studio console schema has required fields', () => {
  assert(waliinStudioConsoleSchema.required.includes('consoleId'), 'Missing consoleId');
  assert(waliinStudioConsoleSchema.required.includes('version'), 'Missing version');
  assert(waliinStudioConsoleSchema.required.includes('operatorContext'), 'Missing operatorContext');
  assert(waliinStudioConsoleSchema.required.includes('uploadPipeline'), 'Missing uploadPipeline');
  assert(waliinStudioConsoleSchema.required.includes('qcWorkflow'), 'Missing qcWorkflow');
  assert(waliinStudioConsoleSchema.required.includes('analyticsDashboards'), 'Missing analyticsDashboards');
});

test('Operator roles are defined', () => {
  const roles = waliinStudioConsoleSchema.properties.operatorContext.properties.role.enum;
  assertIncludes(roles, 'studio_admin', 'Missing studio_admin');
  assertIncludes(roles, 'content_manager', 'Missing content_manager');
  assertIncludes(roles, 'qc_reviewer', 'Missing qc_reviewer');
  assertIncludes(roles, 'contributor', 'Missing contributor');
});

test('Operator permissions are defined', () => {
  const permissions = waliinStudioConsoleSchema.properties.operatorContext.properties.permissions.items.enum;
  assertIncludes(permissions, 'upload_content', 'Missing upload_content');
  assertIncludes(permissions, 'review_qc', 'Missing review_qc');
  assertIncludes(permissions, 'publish_content', 'Missing publish_content');
  assertIncludes(permissions, 'view_analytics', 'Missing view_analytics');
});

test('Upload methods are defined', () => {
  const methodSchema = waliinStudioConsoleSchema.properties.uploadPipeline.properties.uploadMethods.items;
  const types = methodSchema.properties.type.enum;
  assertIncludes(types, 'direct_upload', 'Missing direct_upload');
  assertIncludes(types, 's3_import', 'Missing s3_import');
  assertIncludes(types, 'cloud_storage', 'Missing cloud_storage');
});

test('Content wizard steps are defined', () => {
  const stepSchema = waliinStudioConsoleSchema.properties.uploadPipeline.properties.contentWizard.properties.steps.items;
  const types = stepSchema.properties.type.enum;
  assertIncludes(types, 'file_upload', 'Missing file_upload step');
  assertIncludes(types, 'metadata_entry', 'Missing metadata_entry step');
  assertIncludes(types, 'localization', 'Missing localization step');
  assertIncludes(types, 'qc_submission', 'Missing qc_submission step');
});

test('QC workflow stages are defined', () => {
  const stageSchema = waliinStudioConsoleSchema.properties.qcWorkflow.properties.stages.items;
  const types = stageSchema.properties.type.enum;
  assertIncludes(types, 'technical_qc', 'Missing technical_qc');
  assertIncludes(types, 'content_review', 'Missing content_review');
  assertIncludes(types, 'cultural_review', 'Missing cultural_review');
  assertIncludes(types, 'final_approval', 'Missing final_approval');
});

test('Automated QC checks are defined', () => {
  const checks = waliinStudioConsoleSchema.properties.qcWorkflow.properties.automatedChecks.properties;
  assert(checks.videoQuality !== undefined, 'Missing videoQuality check');
  assert(checks.audioSync !== undefined, 'Missing audioSync check');
  assert(checks.personaConsistency !== undefined, 'Missing personaConsistency check');
  assert(checks.culturalSensitivity !== undefined, 'Missing culturalSensitivity check');
});

test('Analytics dashboard types are defined', () => {
  const dashSchema = waliinStudioConsoleSchema.properties.analyticsDashboards.properties.dashboards.items;
  const types = dashSchema.properties.type.enum;
  assertIncludes(types, 'overview', 'Missing overview dashboard');
  assertIncludes(types, 'content_performance', 'Missing content_performance dashboard');
  assertIncludes(types, 'audience_insights', 'Missing audience_insights dashboard');
  assertIncludes(types, 'revenue', 'Missing revenue dashboard');
});

test('Analytics widget types are defined', () => {
  const widgetSchema = waliinStudioConsoleSchema.properties.analyticsDashboards.properties.dashboards.items.properties.widgets.items;
  const types = widgetSchema.properties.type.enum;
  assertIncludes(types, 'kpi_card', 'Missing kpi_card widget');
  assertIncludes(types, 'line_chart', 'Missing line_chart widget');
  assertIncludes(types, 'bar_chart', 'Missing bar_chart widget');
  assertIncludes(types, 'map', 'Missing map widget');
});

test('Monetization controls are defined', () => {
  const monetization = waliinStudioConsoleSchema.properties.monetizationControls.properties;
  assert(monetization.accessModels, 'Missing accessModels');
  assert(monetization.pricingManagement, 'Missing pricingManagement');
  assert(monetization.revenueTracking, 'Missing revenueTracking');
});

test('Distribution controls are defined', () => {
  const distribution = waliinStudioConsoleSchema.properties.distributionControls.properties;
  assert(distribution.channels, 'Missing channels');
  assert(distribution.geoRestrictions, 'Missing geoRestrictions');
  assert(distribution.releaseWindows, 'Missing releaseWindows');
});

test('Localization management is defined', () => {
  const localization = waliinStudioConsoleSchema.properties.localizationManagement.properties;
  assert(localization.languages, 'Missing languages');
  assert(localization.subtitleManagement, 'Missing subtitleManagement');
  assert(localization.dubbingManagement, 'Missing dubbingManagement');
});

test('Fixture: Console data is valid', () => {
  const console = fixtures.waliinStudioConsole;
  assert(console.consoleId === 'console-waliin-operator', 'Invalid consoleId');
  assert(console.operatorContext.role === 'content_manager', 'Should be content_manager role');
});

test('Fixture: Upload pipeline is configured', () => {
  const upload = fixtures.waliinStudioConsole.uploadPipeline;
  assert(upload.enabled === true, 'Upload should be enabled');
  assert(upload.uploadMethods.length >= 2, 'Should have at least 2 upload methods');
  assert(upload.contentWizard.steps.length >= 5, 'Should have at least 5 wizard steps');
});

test('Fixture: QC workflow has multiple stages', () => {
  const qc = fixtures.waliinStudioConsole.qcWorkflow;
  assert(qc.enabled === true, 'QC workflow should be enabled');
  assert(qc.stages.length >= 4, 'Should have at least 4 QC stages');
  assert(qc.stages.some(s => s.type === 'technical_qc'), 'Should have technical_qc stage');
  assert(qc.stages.some(s => s.type === 'cultural_review'), 'Should have cultural_review stage');
});

test('Fixture: Analytics dashboards are configured', () => {
  const analytics = fixtures.waliinStudioConsole.analyticsDashboards;
  assert(analytics.enabled === true, 'Analytics should be enabled');
  assert(analytics.dashboards.length >= 3, 'Should have at least 3 dashboards');
  assert(analytics.metrics.length >= 4, 'Should have at least 4 metrics');
});

// ============== Audit Log Integration Tests ==============

console.log('\n--- Audit Log Integration Tests ---');

test('Audit log schema has Waliin showcase events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'showcase_created', 'Missing showcase_created');
  assertIncludes(events, 'showcase_updated', 'Missing showcase_updated');
  assertIncludes(events, 'showcase_published', 'Missing showcase_published');
  assertIncludes(events, 'hero_banner_updated', 'Missing hero_banner_updated');
  assertIncludes(events, 'category_display_created', 'Missing category_display_created');
});

test('Audit log schema has Waliin content events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'content_detail_created', 'Missing content_detail_created');
  assertIncludes(events, 'content_detail_published', 'Missing content_detail_published');
  assertIncludes(events, 'engagement_tracked', 'Missing engagement_tracked');
  assertIncludes(events, 'recommendation_served', 'Missing recommendation_served');
});

test('Audit log schema has Waliin customer events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'customer_registered', 'Missing customer_registered');
  assertIncludes(events, 'watchlist_item_added', 'Missing watchlist_item_added');
  assertIncludes(events, 'watch_progress_updated', 'Missing watch_progress_updated');
  assertIncludes(events, 'download_started', 'Missing download_started');
  assertIncludes(events, 'subscription_tier_changed', 'Missing subscription_tier_changed');
});

test('Audit log schema has Waliin studio console events', () => {
  const events = auditLogSchema.properties.eventType.enum;
  assertIncludes(events, 'studio_console_accessed', 'Missing studio_console_accessed');
  assertIncludes(events, 'upload_started', 'Missing upload_started');
  assertIncludes(events, 'upload_completed', 'Missing upload_completed');
  assertIncludes(events, 'qc_stage_started', 'Missing qc_stage_started');
  assertIncludes(events, 'analytics_dashboard_viewed', 'Missing analytics_dashboard_viewed');
});

test('Audit log schema has Waliin categories', () => {
  const categories = auditLogSchema.properties.category.enum;
  assertIncludes(categories, 'waliin_showcase', 'Missing waliin_showcase category');
  assertIncludes(categories, 'waliin_content', 'Missing waliin_content category');
  assertIncludes(categories, 'waliin_customer', 'Missing waliin_customer category');
  assertIncludes(categories, 'waliin_studio_console', 'Missing waliin_studio_console category');
});

test('Audit log schema has Waliin target types', () => {
  const targets = auditLogSchema.properties.target.properties.type.enum;
  assertIncludes(targets, 'showcase', 'Missing showcase target');
  assertIncludes(targets, 'hero_banner', 'Missing hero_banner target');
  assertIncludes(targets, 'content_detail', 'Missing content_detail target');
  assertIncludes(targets, 'customer', 'Missing customer target');
  assertIncludes(targets, 'watchlist', 'Missing watchlist target');
  assertIncludes(targets, 'studio_console', 'Missing studio_console target');
});

test('Fixture: Audit log entry is valid', () => {
  const log = fixtures.auditLog;
  assert(log.logId === 'log-waliin-showcase-001', 'Invalid logId');
  assert(log.eventType === 'showcase_published', 'Should be showcase_published event');
  assert(log.category === 'waliin_showcase', 'Should be waliin_showcase category');
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
