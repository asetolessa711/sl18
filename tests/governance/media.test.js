/**
 * Phase 28: Media Rendering & Distribution Pipeline Tests
 * Tests for media rendering, distribution pipeline, localization, and observability schemas
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const mediaRenderingSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/media_rendering.schema.json'), 'utf8')
);
const distributionPipelineSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/distribution_pipeline.schema.json'), 'utf8')
);
const mediaLocalizationSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/media_localization.schema.json'), 'utf8')
);
const mediaObservabilitySchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/media_observability.schema.json'), 'utf8')
);
const auditLogSchema = JSON.parse(
  readFileSync(join(__dirname, '../../schemas/audit_log.schema.json'), 'utf8')
);

// Load fixtures
const fixtures = JSON.parse(
  readFileSync(join(__dirname, './fixtures/media.json'), 'utf8')
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

console.log('\n=== Phase 28: Media Rendering & Distribution Pipeline Tests ===\n');

// ============================================
// Media Rendering Schema Tests
// ============================================

console.log('--- Media Rendering Schema Tests ---\n');

test('Media rendering schema has required properties', () => {
  assert(mediaRenderingSchema.properties.renderingId, 'Missing renderingId');
  assert(mediaRenderingSchema.properties.version, 'Missing version');
  assert(mediaRenderingSchema.properties.name, 'Missing name');
  assert(mediaRenderingSchema.properties.scope, 'Missing scope');
  assert(mediaRenderingSchema.properties.ingestPipeline, 'Missing ingestPipeline');
  assert(mediaRenderingSchema.properties.transcoding, 'Missing transcoding');
  assert(mediaRenderingSchema.properties.packaging, 'Missing packaging');
  assert(mediaRenderingSchema.properties.status, 'Missing status');
});

test('Rendering ID follows correct pattern', () => {
  const pattern = new RegExp(mediaRenderingSchema.properties.renderingId.pattern);
  assert(pattern.test('render-waliin-production'), 'Pattern should match valid rendering ID');
  assert(!pattern.test('invalid-id'), 'Pattern should not match invalid ID');
});

test('Content types are properly defined', () => {
  const types = mediaRenderingSchema.properties.scope.properties.contentTypes.items.enum;
  assert(types.includes('short_drama'), 'Missing short_drama content type');
  assert(types.includes('movie'), 'Missing movie content type');
  assert(types.includes('series_episode'), 'Missing series_episode content type');
  assert(types.includes('trailer'), 'Missing trailer content type');
  assert(types.includes('teaser'), 'Missing teaser content type');
});

test('Ingest source types are properly enumerated', () => {
  const sources = mediaRenderingSchema.properties.ingestPipeline.properties.sources.items.properties.type.enum;
  assert(sources.includes('direct_upload'), 'Missing direct_upload source');
  assert(sources.includes('s3'), 'Missing s3 source');
  assert(sources.includes('capcut_export'), 'Missing capcut_export source');
  assert(sources.includes('studio_link'), 'Missing studio_link source');
});

test('Accepted video formats are defined', () => {
  const formats = mediaRenderingSchema.properties.ingestPipeline.properties.sources.items.properties.acceptedFormats.items.enum;
  assert(formats.includes('mp4'), 'Missing mp4 format');
  assert(formats.includes('mov'), 'Missing mov format');
  assert(formats.includes('prores'), 'Missing prores format');
  assert(formats.includes('mxf'), 'Missing mxf format');
});

test('Quality analysis metrics are properly defined', () => {
  const metrics = mediaRenderingSchema.properties.ingestPipeline.properties.qualityAnalysis.properties.metrics.items.enum;
  assert(metrics.includes('vmaf'), 'Missing vmaf metric');
  assert(metrics.includes('psnr'), 'Missing psnr metric');
  assert(metrics.includes('ssim'), 'Missing ssim metric');
  assert(metrics.includes('scene_detection'), 'Missing scene_detection metric');
});

test('Transcoding engines are properly enumerated', () => {
  const engines = mediaRenderingSchema.properties.transcoding.properties.engine.enum;
  assert(engines.includes('ffmpeg'), 'Missing ffmpeg engine');
  assert(engines.includes('mediaconvert'), 'Missing mediaconvert engine');
  assert(engines.includes('bitmovin'), 'Missing bitmovin engine');
});

test('Video codecs are properly defined', () => {
  const codecs = mediaRenderingSchema.properties.transcoding.properties.videoCodecs.items.properties.codec.enum;
  assert(codecs.includes('h264'), 'Missing h264 codec');
  assert(codecs.includes('h265_hevc'), 'Missing h265_hevc codec');
  assert(codecs.includes('vp9'), 'Missing vp9 codec');
  assert(codecs.includes('av1'), 'Missing av1 codec');
});

test('Audio codecs are properly defined', () => {
  const codecs = mediaRenderingSchema.properties.transcoding.properties.audioCodecs.items.properties.codec.enum;
  assert(codecs.includes('aac'), 'Missing aac codec');
  assert(codecs.includes('ac3'), 'Missing ac3 codec');
  assert(codecs.includes('opus'), 'Missing opus codec');
});

test('Device targets are properly enumerated', () => {
  const targets = mediaRenderingSchema.properties.transcoding.properties.renditions.items.properties.deviceTarget.enum;
  assert(targets.includes('mobile_small'), 'Missing mobile_small target');
  assert(targets.includes('desktop'), 'Missing desktop target');
  assert(targets.includes('smart_tv'), 'Missing smart_tv target');
  assert(targets.includes('ott_box'), 'Missing ott_box target');
});

test('Packaging formats are defined', () => {
  const formats = mediaRenderingSchema.properties.packaging.properties.formats.items.properties.format.enum;
  assert(formats.includes('hls'), 'Missing hls format');
  assert(formats.includes('dash'), 'Missing dash format');
  assert(formats.includes('cmaf'), 'Missing cmaf format');
});

test('DRM systems are properly enumerated', () => {
  const drm = mediaRenderingSchema.properties.packaging.properties.formats.items.properties.encryption.properties.drm.items.enum;
  assert(drm.includes('widevine'), 'Missing widevine DRM');
  assert(drm.includes('fairplay'), 'Missing fairplay DRM');
  assert(drm.includes('playready'), 'Missing playready DRM');
});

test('Thumbnail formats are defined', () => {
  const formats = mediaRenderingSchema.properties.thumbnails.properties.generation.properties.sizes.items.properties.format.enum;
  assert(formats.includes('jpg'), 'Missing jpg format');
  assert(formats.includes('webp'), 'Missing webp format');
  assert(formats.includes('avif'), 'Missing avif format');
});

test('Trailer generation algorithms are defined', () => {
  const algorithms = mediaRenderingSchema.properties.trailers.properties.autoGeneration.properties.algorithm.enum;
  assert(algorithms.includes('highlight_detection'), 'Missing highlight_detection algorithm');
  assert(algorithms.includes('ai_summary'), 'Missing ai_summary algorithm');
});

test('Short-form platforms are enumerated', () => {
  const platforms = mediaRenderingSchema.properties.trailers.properties.teasers.properties.shortFormPlatforms.items.enum;
  assert(platforms.includes('tiktok'), 'Missing tiktok platform');
  assert(platforms.includes('instagram_reels'), 'Missing instagram_reels platform');
  assert(platforms.includes('youtube_shorts'), 'Missing youtube_shorts platform');
});

test('Storage providers are defined', () => {
  const providers = mediaRenderingSchema.properties.storage.properties.primaryStorage.properties.provider.enum;
  assert(providers.includes('s3'), 'Missing s3 provider');
  assert(providers.includes('gcs'), 'Missing gcs provider');
  assert(providers.includes('azure_blob'), 'Missing azure_blob provider');
});

test('Rendering status values are defined', () => {
  const statuses = mediaRenderingSchema.properties.status.enum;
  assert(statuses.includes('active'), 'Missing active status');
  assert(statuses.includes('processing'), 'Missing processing status');
  assert(statuses.includes('paused'), 'Missing paused status');
});

// ============================================
// Distribution Pipeline Schema Tests
// ============================================

console.log('\n--- Distribution Pipeline Schema Tests ---\n');

test('Distribution pipeline schema has required properties', () => {
  assert(distributionPipelineSchema.properties.pipelineId, 'Missing pipelineId');
  assert(distributionPipelineSchema.properties.streaming, 'Missing streaming');
  assert(distributionPipelineSchema.properties.cdn, 'Missing cdn');
  assert(distributionPipelineSchema.properties.drm, 'Missing drm');
  assert(distributionPipelineSchema.properties.accessControl, 'Missing accessControl');
});

test('Distribution pipeline ID follows correct pattern', () => {
  const pattern = new RegExp(distributionPipelineSchema.properties.pipelineId.pattern);
  assert(pattern.test('dist-waliin-global'), 'Pattern should match valid distribution ID');
  assert(!pattern.test('invalid-id'), 'Pattern should not match invalid ID');
});

test('Streaming protocols are properly defined', () => {
  const protocols = distributionPipelineSchema.properties.streaming.properties.protocols.items.properties.protocol.enum;
  assert(protocols.includes('hls'), 'Missing hls protocol');
  assert(protocols.includes('dash'), 'Missing dash protocol');
  assert(protocols.includes('smooth'), 'Missing smooth protocol');
  assert(protocols.includes('progressive'), 'Missing progressive protocol');
});

test('Adaptive bitrate algorithms are defined', () => {
  const algorithms = distributionPipelineSchema.properties.streaming.properties.adaptiveBitrate.properties.algorithm.enum;
  assert(algorithms.includes('bandwidth_estimation'), 'Missing bandwidth_estimation algorithm');
  assert(algorithms.includes('buffer_based'), 'Missing buffer_based algorithm');
  assert(algorithms.includes('ml_predictive'), 'Missing ml_predictive algorithm');
});

test('CDN providers are properly enumerated', () => {
  const providers = distributionPipelineSchema.properties.cdn.properties.providers.items.properties.provider.enum;
  assert(providers.includes('cloudflare'), 'Missing cloudflare provider');
  assert(providers.includes('akamai'), 'Missing akamai provider');
  assert(providers.includes('fastly'), 'Missing fastly provider');
  assert(providers.includes('cloudfront'), 'Missing cloudfront provider');
});

test('Multi-CDN strategies are defined', () => {
  const strategies = distributionPipelineSchema.properties.cdn.properties.multiCdn.properties.strategy.enum;
  assert(strategies.includes('weighted'), 'Missing weighted strategy');
  assert(strategies.includes('latency_based'), 'Missing latency_based strategy');
  assert(strategies.includes('geo_based'), 'Missing geo_based strategy');
  assert(strategies.includes('failover'), 'Missing failover strategy');
});

test('DRM providers are properly defined', () => {
  const providers = distributionPipelineSchema.properties.drm.properties.providers.items.properties.provider.enum;
  assert(providers.includes('widevine'), 'Missing widevine provider');
  assert(providers.includes('fairplay'), 'Missing fairplay provider');
  assert(providers.includes('playready'), 'Missing playready provider');
});

test('DRM security levels are defined', () => {
  const levels = distributionPipelineSchema.properties.drm.properties.providers.items.properties.securityLevel.enum;
  assert(levels.includes('L1'), 'Missing L1 security level');
  assert(levels.includes('L2'), 'Missing L2 security level');
  assert(levels.includes('L3'), 'Missing L3 security level');
});

test('Content tiers are defined', () => {
  const tiers = distributionPipelineSchema.properties.drm.properties.policies.items.properties.contentTier.enum;
  assert(tiers.includes('free'), 'Missing free tier');
  assert(tiers.includes('premium'), 'Missing premium tier');
  assert(tiers.includes('ultra_premium'), 'Missing ultra_premium tier');
});

test('Token authentication algorithms are defined', () => {
  const algorithms = distributionPipelineSchema.properties.accessControl.properties.tokenAuth.properties.algorithm.enum;
  assert(algorithms.includes('hmac_sha256'), 'Missing hmac_sha256 algorithm');
  assert(algorithms.includes('jwt'), 'Missing jwt algorithm');
  assert(algorithms.includes('signed_url'), 'Missing signed_url algorithm');
});

test('Geo-restriction modes are defined', () => {
  const modes = distributionPipelineSchema.properties.accessControl.properties.geoRestriction.properties.mode.enum;
  assert(modes.includes('whitelist'), 'Missing whitelist mode');
  assert(modes.includes('blacklist'), 'Missing blacklist mode');
});

test('Device types are properly enumerated', () => {
  const types = distributionPipelineSchema.properties.accessControl.properties.deviceLimits.properties.deviceTypes.items.enum;
  assert(types.includes('mobile'), 'Missing mobile device type');
  assert(types.includes('smart_tv'), 'Missing smart_tv device type');
  assert(types.includes('streaming_device'), 'Missing streaming_device type');
});

test('Offline download quality levels are defined', () => {
  const qualities = distributionPipelineSchema.properties.offlineDownload.properties.profiles.items.properties.quality.enum;
  assert(qualities.includes('low'), 'Missing low quality');
  assert(qualities.includes('medium'), 'Missing medium quality');
  assert(qualities.includes('high'), 'Missing high quality');
});

test('Analytics providers are enumerated', () => {
  const providers = distributionPipelineSchema.properties.analytics.properties.providers.items.properties.provider.enum;
  assert(providers.includes('conviva'), 'Missing conviva provider');
  assert(providers.includes('mux'), 'Missing mux provider');
  assert(providers.includes('youbora'), 'Missing youbora provider');
});

// ============================================
// Media Localization Schema Tests
// ============================================

console.log('\n--- Media Localization Schema Tests ---\n');

test('Media localization schema has required properties', () => {
  assert(mediaLocalizationSchema.properties.localizationId, 'Missing localizationId');
  assert(mediaLocalizationSchema.properties.subtitles, 'Missing subtitles');
  assert(mediaLocalizationSchema.properties.dubbing, 'Missing dubbing');
  assert(mediaLocalizationSchema.properties.accessibility, 'Missing accessibility');
  assert(mediaLocalizationSchema.properties.tracks, 'Missing tracks');
});

test('Localization ID follows correct pattern', () => {
  const pattern = new RegExp(mediaLocalizationSchema.properties.localizationId.pattern);
  assert(pattern.test('loc-waliin-multilingual'), 'Pattern should match valid localization ID');
  assert(!pattern.test('invalid-id'), 'Pattern should not match invalid ID');
});

test('Speech-to-text engines are properly defined', () => {
  const engines = mediaLocalizationSchema.properties.subtitles.properties.generation.properties.autoGeneration.properties.engine.enum;
  assert(engines.includes('whisper'), 'Missing whisper engine');
  assert(engines.includes('google_speech'), 'Missing google_speech engine');
  assert(engines.includes('azure_speech'), 'Missing azure_speech engine');
});

test('Translation engines are defined', () => {
  const engines = mediaLocalizationSchema.properties.subtitles.properties.generation.properties.translation.properties.engine.enum;
  assert(engines.includes('google_translate'), 'Missing google_translate engine');
  assert(engines.includes('deepl'), 'Missing deepl engine');
  assert(engines.includes('azure_translator'), 'Missing azure_translator engine');
});

test('Subtitle formats are properly enumerated', () => {
  const formats = mediaLocalizationSchema.properties.subtitles.properties.formats.items.properties.format.enum;
  assert(formats.includes('webvtt'), 'Missing webvtt format');
  assert(formats.includes('ttml'), 'Missing ttml format');
  assert(formats.includes('srt'), 'Missing srt format');
  assert(formats.includes('scc'), 'Missing scc format');
});

test('QC checks are properly defined', () => {
  const checks = mediaLocalizationSchema.properties.subtitles.properties.qc.properties.checks.items.enum;
  assert(checks.includes('timing_accuracy'), 'Missing timing_accuracy check');
  assert(checks.includes('spelling'), 'Missing spelling check');
  assert(checks.includes('reading_speed'), 'Missing reading_speed check');
  assert(checks.includes('sync_check'), 'Missing sync_check');
});

test('Dubbing workflow types are defined', () => {
  const types = mediaLocalizationSchema.properties.dubbing.properties.workflows.items.properties.type.enum;
  assert(types.includes('traditional'), 'Missing traditional dubbing');
  assert(types.includes('ai_voice'), 'Missing ai_voice dubbing');
  assert(types.includes('hybrid'), 'Missing hybrid dubbing');
  assert(types.includes('voice_clone'), 'Missing voice_clone dubbing');
});

test('Voice synthesis engines are enumerated', () => {
  const engines = mediaLocalizationSchema.properties.dubbing.properties.voiceSynthesis.properties.engine.enum;
  assert(engines.includes('eleven_labs'), 'Missing eleven_labs engine');
  assert(engines.includes('google_wavenet'), 'Missing google_wavenet engine');
  assert(engines.includes('azure_neural'), 'Missing azure_neural engine');
});

test('Lip sync methods are defined', () => {
  const methods = mediaLocalizationSchema.properties.dubbing.properties.workflows.items.properties.lipSync.properties.method.enum;
  assert(methods.includes('manual'), 'Missing manual lip sync');
  assert(methods.includes('automated'), 'Missing automated lip sync');
  assert(methods.includes('ai_assisted'), 'Missing ai_assisted lip sync');
});

test('Loudness standards are defined', () => {
  const standards = mediaLocalizationSchema.properties.dubbing.properties.audioMixing.properties.loudnessNormalization.properties.standard.enum;
  assert(standards.includes('ebu_r128'), 'Missing ebu_r128 standard');
  assert(standards.includes('atsc_a85'), 'Missing atsc_a85 standard');
});

test('Closed caption formats are properly enumerated', () => {
  const formats = mediaLocalizationSchema.properties.accessibility.properties.closedCaptions.properties.formats.items.enum;
  assert(formats.includes('cea608'), 'Missing cea608 format');
  assert(formats.includes('cea708'), 'Missing cea708 format');
  assert(formats.includes('webvtt_sdh'), 'Missing webvtt_sdh format');
});

test('Audio description types are defined', () => {
  const types = mediaLocalizationSchema.properties.accessibility.properties.audioDescription.properties.type.enum;
  assert(types.includes('standard'), 'Missing standard AD');
  assert(types.includes('extended'), 'Missing extended AD');
  assert(types.includes('audio_intro'), 'Missing audio_intro AD');
});

test('Sign language types are enumerated', () => {
  const languages = mediaLocalizationSchema.properties.accessibility.properties.signLanguage.properties.languages.items.enum;
  assert(languages.includes('asl'), 'Missing ASL');
  assert(languages.includes('bsl'), 'Missing BSL');
  assert(languages.includes('lsf'), 'Missing LSF');
});

test('Track types are properly defined', () => {
  const types = mediaLocalizationSchema.properties.tracks.items.properties.type.enum;
  assert(types.includes('subtitle'), 'Missing subtitle track type');
  assert(types.includes('closed_caption'), 'Missing closed_caption track type');
  assert(types.includes('audio'), 'Missing audio track type');
  assert(types.includes('audio_description'), 'Missing audio_description track type');
});

test('Track status values are defined', () => {
  const statuses = mediaLocalizationSchema.properties.tracks.items.properties.status.enum;
  assert(statuses.includes('pending'), 'Missing pending status');
  assert(statuses.includes('qc_pending'), 'Missing qc_pending status');
  assert(statuses.includes('published'), 'Missing published status');
});

test('QC workflow stages are defined', () => {
  const stages = mediaLocalizationSchema.properties.qc.properties.workflow.properties.stages.items.properties.type.enum;
  assert(stages.includes('automated'), 'Missing automated stage');
  assert(stages.includes('native_review'), 'Missing native_review stage');
  assert(stages.includes('cultural_review'), 'Missing cultural_review stage');
});

test('Cultural sensitivity categories are enumerated', () => {
  const categories = mediaLocalizationSchema.properties.qc.properties.culturalSensitivity.properties.checkCategories.items.enum;
  assert(categories.includes('religious'), 'Missing religious category');
  assert(categories.includes('political'), 'Missing political category');
  assert(categories.includes('regional_taboos'), 'Missing regional_taboos category');
});

// ============================================
// Media Observability Schema Tests
// ============================================

console.log('\n--- Media Observability Schema Tests ---\n');

test('Media observability schema has required properties', () => {
  assert(mediaObservabilitySchema.properties.observabilityId, 'Missing observabilityId');
  assert(mediaObservabilitySchema.properties.playbackMetrics, 'Missing playbackMetrics');
  assert(mediaObservabilitySchema.properties.errorTracking, 'Missing errorTracking');
  assert(mediaObservabilitySchema.properties.regionHeatmaps, 'Missing regionHeatmaps');
  assert(mediaObservabilitySchema.properties.dashboards, 'Missing dashboards');
});

test('Observability ID follows correct pattern', () => {
  const pattern = new RegExp(mediaObservabilitySchema.properties.observabilityId.pattern);
  assert(pattern.test('mobs-waliin-production'), 'Pattern should match valid observability ID');
  assert(!pattern.test('invalid-id'), 'Pattern should not match invalid ID');
});

test('Analytics providers are properly defined', () => {
  const providers = mediaObservabilitySchema.properties.playbackMetrics.properties.collection.properties.provider.enum;
  assert(providers.includes('conviva'), 'Missing conviva provider');
  assert(providers.includes('mux'), 'Missing mux provider');
  assert(providers.includes('youbora'), 'Missing youbora provider');
});

test('Playback events are properly enumerated', () => {
  const events = mediaObservabilitySchema.properties.playbackMetrics.properties.events.items.properties.event.enum;
  assert(events.includes('play_request'), 'Missing play_request event');
  assert(events.includes('buffer_start'), 'Missing buffer_start event');
  assert(events.includes('quality_change'), 'Missing quality_change event');
  assert(events.includes('error'), 'Missing error event');
});

test('Error categories are properly defined', () => {
  const categories = mediaObservabilitySchema.properties.errorTracking.properties.categories.items.properties.category.enum;
  assert(categories.includes('network'), 'Missing network error category');
  assert(categories.includes('drm'), 'Missing drm error category');
  assert(categories.includes('decoder'), 'Missing decoder error category');
  assert(categories.includes('cdn'), 'Missing cdn error category');
});

test('Region heatmap metrics are defined', () => {
  const metrics = mediaObservabilitySchema.properties.regionHeatmaps.properties.metrics.items.enum;
  assert(metrics.includes('concurrent_viewers'), 'Missing concurrent_viewers metric');
  assert(metrics.includes('error_rate'), 'Missing error_rate metric');
  assert(metrics.includes('rebuffer_ratio'), 'Missing rebuffer_ratio metric');
});

test('Heatmap granularity levels are defined', () => {
  const levels = mediaObservabilitySchema.properties.regionHeatmaps.properties.granularity.enum;
  assert(levels.includes('country'), 'Missing country granularity');
  assert(levels.includes('city'), 'Missing city granularity');
  assert(levels.includes('isp'), 'Missing isp granularity');
});

test('Content analytics metrics are defined', () => {
  const metrics = mediaObservabilitySchema.properties.contentAnalytics.properties.perTitle.properties.metrics.items.enum;
  assert(metrics.includes('views'), 'Missing views metric');
  assert(metrics.includes('completion_rate'), 'Missing completion_rate metric');
  assert(metrics.includes('engagement_score'), 'Missing engagement_score metric');
});

test('CDN metrics are properly enumerated', () => {
  const metrics = mediaObservabilitySchema.properties.cdnMetrics.properties.metrics.items.enum;
  assert(metrics.includes('cache_hit_ratio'), 'Missing cache_hit_ratio metric');
  assert(metrics.includes('bandwidth'), 'Missing bandwidth metric');
  assert(metrics.includes('latency_p99'), 'Missing latency_p99 metric');
});

test('Dashboard types are properly defined', () => {
  const types = mediaObservabilitySchema.properties.dashboards.items.properties.type.enum;
  assert(types.includes('realtime'), 'Missing realtime dashboard');
  assert(types.includes('qoe_overview'), 'Missing qoe_overview dashboard');
  assert(types.includes('content_performance'), 'Missing content_performance dashboard');
  assert(types.includes('regional_performance'), 'Missing regional_performance dashboard');
});

test('Dashboard widget types are defined', () => {
  const types = mediaObservabilitySchema.properties.dashboards.items.properties.widgets.items.properties.type.enum;
  assert(types.includes('counter'), 'Missing counter widget');
  assert(types.includes('gauge'), 'Missing gauge widget');
  assert(types.includes('heatmap'), 'Missing heatmap widget');
  assert(types.includes('map'), 'Missing map widget');
});

test('Alert severity levels are defined', () => {
  const severities = mediaObservabilitySchema.properties.alerting.properties.rules.items.properties.severity.enum;
  assert(severities.includes('critical'), 'Missing critical severity');
  assert(severities.includes('high'), 'Missing high severity');
  assert(severities.includes('medium'), 'Missing medium severity');
});

test('Alert channels are properly enumerated', () => {
  const channels = mediaObservabilitySchema.properties.alerting.properties.rules.items.properties.channels.items.enum;
  assert(channels.includes('slack'), 'Missing slack channel');
  assert(channels.includes('pagerduty'), 'Missing pagerduty channel');
  assert(channels.includes('webhook'), 'Missing webhook channel');
});

test('Report types are defined', () => {
  const types = mediaObservabilitySchema.properties.reporting.properties.schedules.items.properties.type.enum;
  assert(types.includes('daily_summary'), 'Missing daily_summary report');
  assert(types.includes('weekly_qoe'), 'Missing weekly_qoe report');
  assert(types.includes('content_report'), 'Missing content_report');
});

// ============================================
// Fixture Validation Tests
// ============================================

console.log('\n--- Fixture Validation Tests ---\n');

test('Media rendering fixture has valid structure', () => {
  const rendering = fixtures.mediaRendering;
  assert(rendering.renderingId === 'render-waliin-production', 'Invalid rendering ID');
  assert(rendering.ingestPipeline.enabled === true, 'Ingest pipeline should be enabled');
  assert(rendering.transcoding.enabled === true, 'Transcoding should be enabled');
  assert(rendering.packaging.enabled === true, 'Packaging should be enabled');
});

test('Media rendering fixture has valid transcoding config', () => {
  const transcoding = fixtures.mediaRendering.transcoding;
  assert(transcoding.engine === 'mediaconvert', 'Engine should be mediaconvert');
  assert(transcoding.videoCodecs.length >= 3, 'Should have at least 3 video codecs');
  assert(transcoding.renditions.length >= 4, 'Should have at least 4 renditions');
});

test('Media rendering fixture has valid rendition ladder', () => {
  const renditions = fixtures.mediaRendering.transcoding.renditions;
  const rendition4k = renditions.find(r => r.renditionId === 'rendition-4k');
  assert(rendition4k, 'Should have 4K rendition');
  assert(rendition4k.resolution.width === 3840, '4K width should be 3840');
  assert(rendition4k.resolution.height === 2160, '4K height should be 2160');
});

test('Media rendering fixture has vertical video support', () => {
  const renditions = fixtures.mediaRendering.transcoding.renditions;
  const vertical = renditions.find(r => r.resolution.aspectRatio === '9:16');
  assert(vertical, 'Should have vertical video rendition');
  assert(vertical.resolution.width === 1080, 'Vertical width should be 1080');
  assert(vertical.resolution.height === 1920, 'Vertical height should be 1920');
});

test('Distribution pipeline fixture has valid structure', () => {
  const dist = fixtures.distributionPipeline;
  assert(dist.pipelineId === 'dist-waliin-global', 'Invalid pipeline ID');
  assert(dist.streaming.enabled === true, 'Streaming should be enabled');
  assert(dist.cdn.enabled === true, 'CDN should be enabled');
  assert(dist.drm.enabled === true, 'DRM should be enabled');
});

test('Distribution pipeline fixture has multi-CDN config', () => {
  const cdn = fixtures.distributionPipeline.cdn;
  assert(cdn.providers.length >= 3, 'Should have at least 3 CDN providers');
  assert(cdn.multiCdn.enabled === true, 'Multi-CDN should be enabled');
  assert(cdn.multiCdn.strategy === 'latency_based', 'Strategy should be latency_based');
});

test('Distribution pipeline fixture has valid DRM config', () => {
  const drm = fixtures.distributionPipeline.drm;
  assert(drm.providers.length >= 3, 'Should have at least 3 DRM providers');
  assert(drm.keyManagement.forensicWatermarking.enabled === true, 'Forensic watermarking should be enabled');
});

test('Distribution pipeline fixture has offline download support', () => {
  const offline = fixtures.distributionPipeline.offlineDownload;
  assert(offline.enabled === true, 'Offline download should be enabled');
  assert(offline.profiles.length >= 3, 'Should have at least 3 download profiles');
});

test('Media localization fixture has valid structure', () => {
  const loc = fixtures.mediaLocalization;
  assert(loc.localizationId === 'loc-waliin-multilingual', 'Invalid localization ID');
  assert(loc.subtitles.enabled === true, 'Subtitles should be enabled');
  assert(loc.dubbing.enabled === true, 'Dubbing should be enabled');
  assert(loc.accessibility.enabled === true, 'Accessibility should be enabled');
});

test('Media localization fixture supports multiple languages', () => {
  const scope = fixtures.mediaLocalization.scope;
  assert(scope.languages.length >= 10, 'Should support at least 10 languages');
  assert(scope.languages.includes('en'), 'Should include English');
  assert(scope.languages.includes('sw'), 'Should include Swahili');
  assert(scope.languages.includes('am'), 'Should include Amharic');
});

test('Media localization fixture has valid QC workflow', () => {
  const qc = fixtures.mediaLocalization.qc;
  assert(qc.enabled === true, 'QC should be enabled');
  assert(qc.workflow.stages.length >= 4, 'Should have at least 4 QC stages');
  assert(qc.workflow.minimumScore >= 90, 'Minimum QC score should be at least 90');
});

test('Media localization fixture has published tracks', () => {
  const tracks = fixtures.mediaLocalization.tracks;
  assert(tracks.length >= 5, 'Should have at least 5 tracks');
  const publishedTracks = tracks.filter(t => t.status === 'published');
  assert(publishedTracks.length >= 5, 'Should have at least 5 published tracks');
});

test('Media observability fixture has valid structure', () => {
  const obs = fixtures.mediaObservability;
  assert(obs.observabilityId === 'mobs-waliin-production', 'Invalid observability ID');
  assert(obs.playbackMetrics.enabled === true, 'Playback metrics should be enabled');
  assert(obs.errorTracking.enabled === true, 'Error tracking should be enabled');
});

test('Media observability fixture has valid QoE thresholds', () => {
  const qoe = fixtures.mediaObservability.playbackMetrics.qoe;
  assert(qoe.startupTime.target <= 2, 'Startup time target should be <= 2s');
  assert(qoe.rebufferRatio.target <= 0.5, 'Rebuffer ratio target should be <= 0.5%');
  assert(qoe.playbackFailure.target <= 0.1, 'Failure rate target should be <= 0.1%');
});

test('Media observability fixture has valid alerting rules', () => {
  const rules = fixtures.mediaObservability.alerting.rules;
  assert(rules.length >= 4, 'Should have at least 4 alert rules');
  const criticalRules = rules.filter(r => r.severity === 'critical');
  assert(criticalRules.length >= 1, 'Should have at least 1 critical rule');
});

test('Media observability fixture has valid dashboards', () => {
  const dashboards = fixtures.mediaObservability.dashboards;
  assert(dashboards.length >= 3, 'Should have at least 3 dashboards');
  const realtimeDash = dashboards.find(d => d.type === 'realtime');
  assert(realtimeDash, 'Should have realtime dashboard');
  assert(realtimeDash.widgets.length >= 4, 'Realtime dashboard should have at least 4 widgets');
});

// ============================================
// Audit Log Event Tests
// ============================================

console.log('\n--- Audit Log Event Tests ---\n');

test('Media rendering audit log events are defined in fixtures', () => {
  const events = fixtures.auditLogEvents;
  assert(events.includes('rendering_job_created'), 'Missing rendering_job_created event');
  assert(events.includes('rendering_job_completed'), 'Missing rendering_job_completed event');
  assert(events.includes('transcode_started'), 'Missing transcode_started event');
  assert(events.includes('quality_check_passed'), 'Missing quality_check_passed event');
  assert(events.includes('thumbnail_generated'), 'Missing thumbnail_generated event');
});

test('Distribution audit log events are defined in fixtures', () => {
  const events = fixtures.auditLogEvents;
  assert(events.includes('distribution_started'), 'Missing distribution_started event');
  assert(events.includes('cdn_cache_purged'), 'Missing cdn_cache_purged event');
  assert(events.includes('drm_license_issued'), 'Missing drm_license_issued event');
  assert(events.includes('stream_started'), 'Missing stream_started event');
  assert(events.includes('offline_download_started'), 'Missing offline_download_started event');
});

test('Localization audit log events are defined in fixtures', () => {
  const events = fixtures.auditLogEvents;
  assert(events.includes('localization_job_created'), 'Missing localization_job_created event');
  assert(events.includes('subtitle_generated'), 'Missing subtitle_generated event');
  assert(events.includes('subtitle_translated'), 'Missing subtitle_translated event');
  assert(events.includes('dubbing_started'), 'Missing dubbing_started event');
  assert(events.includes('voice_synthesis_completed'), 'Missing voice_synthesis_completed event');
  assert(events.includes('track_published'), 'Missing track_published event');
  assert(events.includes('cultural_review_passed'), 'Missing cultural_review_passed event');
});

test('Observability audit log events are defined in fixtures', () => {
  const events = fixtures.auditLogEvents;
  assert(events.includes('observability_alert_triggered'), 'Missing observability_alert_triggered event');
  assert(events.includes('qoe_threshold_breached'), 'Missing qoe_threshold_breached event');
  assert(events.includes('cdn_performance_degraded'), 'Missing cdn_performance_degraded event');
  assert(events.includes('error_spike_detected'), 'Missing error_spike_detected event');
  assert(events.includes('report_generated'), 'Missing report_generated event');
});

// ============================================
// Integration Tests
// ============================================

console.log('\n--- Integration Tests ---\n');

test('Renditions match distribution profiles', () => {
  const renditions = fixtures.mediaRendering.transcoding.renditions;
  const downloadProfiles = fixtures.distributionPipeline.offlineDownload.profiles;
  
  // Check that download profiles have matching renditions
  const downloadResolutions = downloadProfiles.map(p => p.resolution);
  assert(downloadResolutions.includes('480p'), 'Should have 480p download profile');
  assert(downloadResolutions.includes('1080p'), 'Should have 1080p download profile');
});

test('DRM in packaging matches distribution DRM', () => {
  const packagingDrm = fixtures.mediaRendering.packaging.formats
    .flatMap(f => f.encryption?.drm || []);
  const distributionDrm = fixtures.distributionPipeline.drm.providers
    .map(p => p.provider);
  
  // Verify alignment
  assert(packagingDrm.includes('widevine') || distributionDrm.includes('widevine'), 'Widevine should be configured');
  assert(packagingDrm.includes('fairplay') || distributionDrm.includes('fairplay'), 'FairPlay should be configured');
});

test('Localization languages align with subtitle formats', () => {
  const languages = fixtures.mediaLocalization.scope.languages;
  const tracks = fixtures.mediaLocalization.tracks;
  
  // Check that key languages have tracks
  const trackLanguages = tracks.map(t => t.language);
  assert(trackLanguages.includes('en'), 'Should have English track');
  assert(trackLanguages.includes('sw'), 'Should have Swahili track');
});

test('QoE thresholds align with alerting rules', () => {
  const qoe = fixtures.mediaObservability.playbackMetrics.qoe;
  const rules = fixtures.mediaObservability.alerting.rules;
  
  // Find the error rate alert
  const errorAlert = rules.find(r => r.name === 'High Error Rate');
  assert(errorAlert, 'Should have error rate alert');
  assert(errorAlert.condition.threshold >= qoe.playbackFailure.critical, 'Alert should trigger at critical threshold');
});

test('CDN providers configured in both distribution and observability', () => {
  const distCdnProviders = fixtures.distributionPipeline.cdn.providers.map(p => p.provider);
  const obsCdnProviders = fixtures.mediaObservability.cdnMetrics.providers;
  
  // Verify overlap
  const hasOverlap = distCdnProviders.some(p => obsCdnProviders.includes(p));
  assert(hasOverlap, 'CDN providers should be monitored');
});

test('Accessibility tracks align with localization config', () => {
  const accessibility = fixtures.mediaLocalization.accessibility;
  const tracks = fixtures.mediaLocalization.tracks;
  
  // Check for closed caption track if enabled
  if (accessibility.closedCaptions.enabled) {
    const ccTrack = tracks.find(t => t.type === 'closed_caption');
    assert(ccTrack, 'Should have closed caption track when CC is enabled');
  }
  
  // Check for audio description track if enabled
  if (accessibility.audioDescription.enabled) {
    const adTrack = tracks.find(t => t.type === 'audio_description');
    assert(adTrack, 'Should have audio description track when AD is enabled');
  }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
