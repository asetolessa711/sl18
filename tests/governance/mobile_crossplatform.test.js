/**
 * SL18 Phase 22: Mobile Operator App & Cross-Platform UI Tests
 * 
 * Tests for mobile app schemas, mobile panels, cross-platform UI, accessibility, and offline support
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test utilities
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

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message || 'Expected condition to be false');
  }
}

function assertIncludes(array, item, message) {
  if (!array.includes(item)) {
    throw new Error(`${message || 'Array does not include item'}: ${item}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'Deep equality failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// Load schemas and fixtures
const schemasDir = join(__dirname, '../../schemas');
const fixturesDir = join(__dirname, 'fixtures');

function loadSchema(name) {
  const path = join(schemasDir, name);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadFixtures() {
  const path = join(fixturesDir, 'mobile_crossplatform.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Validation functions
function validateMobileOperatorApp(app) {
  const errors = [];
  
  // Required fields
  const required = ['appId', 'version', 'platform', 'deviceInfo', 'operator', 'authentication'];
  for (const field of required) {
    if (!(field in app)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // App ID pattern
  if (app.appId && !/^mobile-[a-z0-9-]+$/.test(app.appId)) {
    errors.push('Invalid appId pattern');
  }
  
  // Version pattern
  if (app.version && !/^\d+\.\d+\.\d+$/.test(app.version)) {
    errors.push('Invalid version pattern');
  }
  
  // Platform validation
  const validPlatforms = ['ios', 'android', 'web_mobile'];
  if (app.platform && !validPlatforms.includes(app.platform)) {
    errors.push(`Invalid platform: ${app.platform}`);
  }
  
  // Device info validation
  if (app.deviceInfo) {
    if (!app.deviceInfo.deviceId) errors.push('Missing deviceId');
    if (!app.deviceInfo.model) errors.push('Missing device model');
    if (!app.deviceInfo.osVersion) errors.push('Missing OS version');
    
    // Biometric type validation
    if (app.deviceInfo.capabilities?.biometricType) {
      const validBiometrics = ['face_id', 'touch_id', 'fingerprint', 'none'];
      if (!validBiometrics.includes(app.deviceInfo.capabilities.biometricType)) {
        errors.push(`Invalid biometric type: ${app.deviceInfo.capabilities.biometricType}`);
      }
    }
  }
  
  // Operator validation
  if (app.operator) {
    if (!app.operator.operatorId) errors.push('Missing operatorId');
    const validRoles = ['viewer', 'operator', 'reviewer', 'contributor', 'auditor', 'admin', 'super_admin'];
    if (app.operator.role && !validRoles.includes(app.operator.role)) {
      errors.push(`Invalid operator role: ${app.operator.role}`);
    }
  }
  
  // Authentication validation
  if (app.authentication) {
    if (!app.authentication.sessionId) errors.push('Missing sessionId');
    const validAuthMethods = ['password', 'sso', 'oauth', 'biometric'];
    if (app.authentication.authMethod && !validAuthMethods.includes(app.authentication.authMethod)) {
      errors.push(`Invalid auth method: ${app.authentication.authMethod}`);
    }
  }
  
  // Navigation tab validation
  if (app.navigation?.bottomTabs) {
    const validTabs = ['home', 'franchises', 'alerts', 'insights', 'more'];
    for (const tab of app.navigation.bottomTabs) {
      if (!validTabs.includes(tab.tabId)) {
        errors.push(`Invalid tab: ${tab.tabId}`);
      }
    }
  }
  
  // Offline sync status
  if (app.offlineMode?.syncStatus) {
    const validSyncStatuses = ['synced', 'syncing', 'pending', 'error', 'offline'];
    if (!validSyncStatuses.includes(app.offlineMode.syncStatus)) {
      errors.push(`Invalid sync status: ${app.offlineMode.syncStatus}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateMobilePanel(panel) {
  const errors = [];
  
  // Required fields
  const required = ['panelId', 'panelType', 'title'];
  for (const field of required) {
    if (!(field in panel)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Panel ID pattern
  if (panel.panelId && !/^mobile-panel-[a-z0-9-]+$/.test(panel.panelId)) {
    errors.push('Invalid panelId pattern');
  }
  
  // Panel type validation
  const validPanelTypes = [
    'mobile_language', 'mobile_observability', 'mobile_marketplace', 'mobile_insights',
    'mobile_qc', 'mobile_alerts', 'mobile_franchise', 'mobile_settings'
  ];
  if (panel.panelType && !validPanelTypes.includes(panel.panelType)) {
    errors.push(`Invalid panel type: ${panel.panelType}`);
  }
  
  // Layout validation
  if (panel.layout) {
    const validOrientations = ['portrait', 'landscape', 'both'];
    if (panel.layout.orientation && !validOrientations.includes(panel.layout.orientation)) {
      errors.push(`Invalid orientation: ${panel.layout.orientation}`);
    }
    const validScrolls = ['vertical', 'horizontal', 'none'];
    if (panel.layout.scrollDirection && !validScrolls.includes(panel.layout.scrollDirection)) {
      errors.push(`Invalid scroll direction: ${panel.layout.scrollDirection}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateCrossPlatformUI(config) {
  const errors = [];
  
  // Required fields
  const required = ['configId', 'version'];
  for (const field of required) {
    if (!(field in config)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Config ID pattern
  if (config.configId && !/^xplatform-[a-z0-9-]+$/.test(config.configId)) {
    errors.push('Invalid configId pattern');
  }
  
  // Device profile validation
  if (config.deviceProfiles) {
    const validCategories = ['mobile', 'tablet', 'desktop', 'tv'];
    for (const profile of config.deviceProfiles) {
      if (profile.category && !validCategories.includes(profile.category)) {
        errors.push(`Invalid device category: ${profile.category}`);
      }
    }
  }
  
  // WCAG level validation
  if (config.accessibility?.wcagLevel) {
    const validLevels = ['A', 'AA', 'AAA'];
    if (!validLevels.includes(config.accessibility.wcagLevel)) {
      errors.push(`Invalid WCAG level: ${config.accessibility.wcagLevel}`);
    }
  }
  
  // Localization direction validation
  if (config.localization?.defaultDirection) {
    const validDirections = ['ltr', 'rtl'];
    if (!validDirections.includes(config.localization.defaultDirection)) {
      errors.push(`Invalid text direction: ${config.localization.defaultDirection}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Run tests
console.log('\n=== SL18 Phase 22: Mobile Operator App & Cross-Platform UI Tests ===\n');

// Schema file existence tests
console.log('--- Schema File Existence ---');

test('Mobile operator app schema exists', () => {
  assertTrue(existsSync(join(schemasDir, 'mobile_operator_app.schema.json')));
});

test('Mobile panels schema exists', () => {
  assertTrue(existsSync(join(schemasDir, 'mobile_panels.schema.json')));
});

test('Cross-platform UI schema exists', () => {
  assertTrue(existsSync(join(schemasDir, 'cross_platform_ui.schema.json')));
});

// Schema JSON validity tests
console.log('\n--- Schema JSON Validity ---');

test('Mobile operator app schema is valid JSON', () => {
  const schema = loadSchema('mobile_operator_app.schema.json');
  assertTrue(schema.$schema !== undefined);
  assertTrue(schema.properties !== undefined);
});

test('Mobile panels schema is valid JSON', () => {
  const schema = loadSchema('mobile_panels.schema.json');
  assertTrue(schema.$schema !== undefined);
  assertTrue(schema.definitions !== undefined);
});

test('Cross-platform UI schema is valid JSON', () => {
  const schema = loadSchema('cross_platform_ui.schema.json');
  assertTrue(schema.$schema !== undefined);
  assertTrue(schema.properties !== undefined);
});

// Mobile Operator App tests
console.log('\n--- Mobile Operator App Validation ---');

const fixtures = loadFixtures();

test('Valid iOS mobile app passes validation', () => {
  const result = validateMobileOperatorApp(fixtures.mobileOperatorApps.valid[0]);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Valid Android mobile app passes validation', () => {
  const result = validateMobileOperatorApp(fixtures.mobileOperatorApps.valid[1]);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Invalid mobile app (missing appId) fails validation', () => {
  const result = validateMobileOperatorApp(fixtures.mobileOperatorApps.invalid[0]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('appId')));
});

test('Invalid mobile app (bad ID pattern) fails validation', () => {
  const result = validateMobileOperatorApp(fixtures.mobileOperatorApps.invalid[1]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('appId')));
});

test('Invalid mobile app (invalid platform) fails validation', () => {
  const result = validateMobileOperatorApp(fixtures.mobileOperatorApps.invalid[2]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('platform')));
});

test('Invalid mobile app (invalid biometric type) fails validation', () => {
  const result = validateMobileOperatorApp(fixtures.mobileOperatorApps.invalid[3]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('biometric')));
});

// Mobile app feature tests
console.log('\n--- Mobile App Feature Tests ---');

test('Mobile app has biometric authentication configured', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.authentication.biometricEnabled === true);
  assertEqual(app.authentication.biometricType, 'face_id');
});

test('Mobile app has MFA enabled', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.authentication.mfaEnabled === true);
  assertEqual(app.authentication.mfaMethod, 'biometric');
});

test('Mobile app has bottom navigation tabs', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.navigation.bottomTabs.length === 5);
  assertTrue(app.navigation.bottomTabs.some(t => t.tabId === 'home'));
  assertTrue(app.navigation.bottomTabs.some(t => t.tabId === 'alerts'));
});

test('Mobile app has push notification channels configured', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.notifications.pushEnabled === true);
  assertTrue(app.notifications.channels.anomalies.enabled === true);
  assertTrue(app.notifications.channels.qcAlerts.enabled === true);
  assertTrue(app.notifications.channels.culturalSensitivity.enabled === true);
});

test('Mobile app has quiet hours configured', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.notifications.quietHours.enabled === true);
  assertEqual(app.notifications.quietHours.startTime, '22:00');
  assertEqual(app.notifications.quietHours.endTime, '07:00');
  assertTrue(app.notifications.quietHours.allowCritical === true);
});

// Offline mode tests
console.log('\n--- Offline Mode Tests ---');

test('Mobile app has offline mode enabled', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.offlineMode.enabled === true);
});

test('Mobile app has offline cache configured', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.offlineMode.cacheConfig.dashboardsCached === true);
  assertEqual(app.offlineMode.cacheConfig.maxCacheSizeMB, 100);
  assertTrue(app.offlineMode.cacheConfig.priorityData.includes('franchises'));
  assertTrue(app.offlineMode.cacheConfig.priorityData.includes('alerts'));
});

test('Mobile app has sync config', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.offlineMode.syncConfig.autoSync === true);
  assertEqual(app.offlineMode.syncConfig.syncIntervalMinutes, 15);
  assertTrue(app.offlineMode.syncConfig.backgroundSyncEnabled === true);
});

test('Mobile app has queued actions for offline sync', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertTrue(app.offlineMode.queuedActions.length > 0);
  const action = app.offlineMode.queuedActions[0];
  assertEqual(action.actionType, 'alert_acknowledge');
  assertEqual(action.status, 'pending');
});

test('Mobile app sync status is valid', () => {
  const app = fixtures.mobileOperatorApps.valid[0];
  assertEqual(app.offlineMode.syncStatus, 'synced');
});

// Mobile Panel tests
console.log('\n--- Mobile Panel Validation ---');

test('Mobile language panel passes validation', () => {
  const result = validateMobilePanel(fixtures.mobilePanels.mobileLanguage.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Mobile observability panel passes validation', () => {
  const result = validateMobilePanel(fixtures.mobilePanels.mobileObservability.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Mobile marketplace panel passes validation', () => {
  const result = validateMobilePanel(fixtures.mobilePanels.mobileMarketplace.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Mobile insights panel passes validation', () => {
  const result = validateMobilePanel(fixtures.mobilePanels.mobileInsights.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Mobile QC panel passes validation', () => {
  const result = validateMobilePanel(fixtures.mobilePanels.mobileQc.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Mobile alerts panel passes validation', () => {
  const result = validateMobilePanel(fixtures.mobilePanels.mobileAlerts.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Mobile franchise panel passes validation', () => {
  const result = validateMobilePanel(fixtures.mobilePanels.mobileFranchise.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Mobile settings panel passes validation', () => {
  const result = validateMobilePanel(fixtures.mobilePanels.mobileSettings.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

// Mobile panel feature tests
console.log('\n--- Mobile Panel Feature Tests ---');

test('Mobile language panel has quick switch', () => {
  const panel = fixtures.mobilePanels.mobileLanguage.valid;
  assertTrue(panel.config.quickSwitch.enabled === true);
  assertEqual(panel.config.quickSwitch.recentLanguages, 3);
  assertTrue(panel.config.quickSwitch.showFlags === true);
});

test('Mobile language panel has offline languages', () => {
  const panel = fixtures.mobilePanels.mobileLanguage.valid;
  assertTrue(panel.config.offlineLanguages.includes('en'));
  assertTrue(panel.config.offlineLanguages.includes('sw'));
  assertTrue(panel.config.offlineLanguages.includes('am'));
});

test('Mobile QC panel has swipe-to-approve', () => {
  const panel = fixtures.mobilePanels.mobileQc.valid;
  assertTrue(panel.config.pendingReviews.swipeToApprove === true);
  assertTrue(panel.layout.swipeActions.length > 0);
  assertTrue(panel.layout.swipeActions.some(a => a.action === 'approve'));
});

test('Mobile alerts panel has swipe actions', () => {
  const panel = fixtures.mobilePanels.mobileAlerts.valid;
  assertTrue(panel.config.alertFeed.swipeActions === true);
  assertTrue(panel.config.quickAcknowledge.enabled === true);
});

test('Mobile panels have offline support flag', () => {
  const langPanel = fixtures.mobilePanels.mobileLanguage.valid;
  const marketPanel = fixtures.mobilePanels.mobileMarketplace.valid;
  assertTrue(langPanel.offlineSupported === true);
  assertFalse(marketPanel.offlineSupported);
});

// Cross-Platform UI tests
console.log('\n--- Cross-Platform UI Validation ---');

test('Valid cross-platform UI config passes validation', () => {
  const result = validateCrossPlatformUI(fixtures.crossPlatformUI.valid[0]);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Invalid cross-platform config (missing configId) fails validation', () => {
  const result = validateCrossPlatformUI(fixtures.crossPlatformUI.invalid[0]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('configId')));
});

test('Invalid cross-platform config (bad ID pattern) fails validation', () => {
  const result = validateCrossPlatformUI(fixtures.crossPlatformUI.invalid[1]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('configId')));
});

test('Invalid cross-platform config (invalid device category) fails validation', () => {
  const result = validateCrossPlatformUI(fixtures.crossPlatformUI.invalid[2]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('category')));
});

// Device profile tests
console.log('\n--- Device Profile Tests ---');

test('Cross-platform UI has multiple device profiles', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.deviceProfiles.length >= 4);
});

test('Device profiles cover all categories', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  const categories = config.deviceProfiles.map(p => p.category);
  assertTrue(categories.includes('mobile'));
  assertTrue(categories.includes('tablet'));
  assertTrue(categories.includes('desktop'));
});

test('Device profiles have touch/pointer configuration', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  const mobileProfile = config.deviceProfiles.find(p => p.profileId === 'mobile_large');
  assertTrue(mobileProfile.touchEnabled === true);
  assertEqual(mobileProfile.pointerType, 'touch');
  
  const desktopProfile = config.deviceProfiles.find(p => p.profileId === 'desktop');
  assertFalse(desktopProfile.touchEnabled);
  assertEqual(desktopProfile.pointerType, 'mouse');
});

// Responsive breakpoints tests
console.log('\n--- Responsive Breakpoints Tests ---');

test('Cross-platform UI has responsive breakpoints', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.responsiveBreakpoints !== undefined);
  assertTrue(config.responsiveBreakpoints.mobile !== undefined);
  assertTrue(config.responsiveBreakpoints.tablet !== undefined);
  assertTrue(config.responsiveBreakpoints.desktop !== undefined);
});

test('Mobile breakpoint is correctly configured', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertEqual(config.responsiveBreakpoints.mobile.maxWidth, 767);
  assertEqual(config.responsiveBreakpoints.mobile.columns, 4);
});

test('Desktop breakpoint is correctly configured', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertEqual(config.responsiveBreakpoints.desktop.minWidth, 1024);
  assertEqual(config.responsiveBreakpoints.desktop.columns, 12);
});

// Accessibility tests (WCAG 2.1 AA)
console.log('\n--- Accessibility Tests (WCAG 2.1 AA) ---');

test('Cross-platform UI has WCAG AA compliance', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertEqual(config.accessibility.wcagLevel, 'AA');
});

test('Color contrast meets WCAG requirements', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.accessibility.colorContrast.minimumRatio >= 4.5);
  assertTrue(config.accessibility.colorContrast.largeTextRatio >= 3.0);
});

test('Focus indicators are enabled', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.accessibility.focusIndicators.enabled === true);
  assertEqual(config.accessibility.focusIndicators.style, 'ring');
});

test('Keyboard navigation is enabled', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.accessibility.keyboardNavigation.enabled === true);
  assertTrue(config.accessibility.keyboardNavigation.skipLinks === true);
});

test('Screen reader support is enabled', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.accessibility.screenReader.ariaLabels === true);
  assertTrue(config.accessibility.screenReader.liveRegions === true);
  assertTrue(config.accessibility.screenReader.announcements === true);
});

test('Reduced motion is supported', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.accessibility.reducedMotion.respectSystem === true);
  assertTrue(config.accessibility.reducedMotion.simplifyTransitions === true);
});

test('Text scaling is supported', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertEqual(config.accessibility.textScaling.minScale, 1.0);
  assertEqual(config.accessibility.textScaling.maxScale, 2.0);
  assertTrue(config.accessibility.textScaling.respectSystem === true);
});

// RTL/LTR localization tests
console.log('\n--- RTL/LTR Localization Tests ---');

test('Cross-platform UI has localization config', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.localization !== undefined);
  assertEqual(config.localization.defaultDirection, 'ltr');
});

test('RTL languages are properly identified', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.localization.rtlLanguages.includes('ar'));
  assertTrue(config.localization.rtlLanguages.includes('he'));
  assertTrue(config.localization.rtlLanguages.includes('fa'));
});

test('Per-language font families are configured', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.localization.fontFamilies.en !== undefined);
  assertTrue(config.localization.fontFamilies.ar !== undefined);
  assertTrue(config.localization.fontFamilies.am !== undefined);
  assertEqual(config.localization.fontFamilies.am.primary, 'Noto Sans Ethiopic');
});

test('Date formats are localized', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertEqual(config.localization.dateFormats.en, 'MM/DD/YYYY');
  assertEqual(config.localization.dateFormats['en-GB'], 'DD/MM/YYYY');
});

// Design system tests
console.log('\n--- Design System Tests ---');

test('Design system has color tokens', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.designSystem.colors !== undefined);
  assertTrue(config.designSystem.colors.primary !== undefined);
  assertTrue(config.designSystem.colors.success !== undefined);
  assertTrue(config.designSystem.colors.error !== undefined);
});

test('Design system has typography tokens', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.designSystem.typography !== undefined);
  assertTrue(config.designSystem.typography.fontSizes !== undefined);
  assertTrue(config.designSystem.typography.fontWeights !== undefined);
});

test('Design system has spacing tokens', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.designSystem.spacing !== undefined);
  assertEqual(config.designSystem.spacing.md, 16);
});

// Adaptive components tests
console.log('\n--- Adaptive Components Tests ---');

test('Cross-platform UI has adaptive components', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  assertTrue(config.adaptiveComponents.length >= 3);
});

test('Adaptive components have device variants', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  const cardComponent = config.adaptiveComponents.find(c => c.componentId === 'card');
  assertTrue(cardComponent.variants.mobile !== undefined);
  assertTrue(cardComponent.variants.tablet !== undefined);
  assertTrue(cardComponent.variants.desktop !== undefined);
});

test('Adaptive components have accessibility features', () => {
  const config = fixtures.crossPlatformUI.valid[0];
  const navComponent = config.adaptiveComponents.find(c => c.componentId === 'navigation');
  assertTrue(navComponent.accessibilityFeatures.includes('aria_labels'));
  assertTrue(navComponent.accessibilityFeatures.includes('keyboard_nav'));
  assertTrue(navComponent.accessibilityFeatures.includes('screen_reader'));
});

// Audit event tests
console.log('\n--- Mobile/Cross-Platform Audit Event Tests ---');

test('App launch events are logged', () => {
  const events = fixtures.auditEvents.mobileEvents;
  const launchEvent = events.find(e => e.eventType === 'app_launched');
  assertTrue(launchEvent !== undefined);
  assertEqual(launchEvent.category, 'mobile');
  assertTrue(launchEvent.metadata.platform !== undefined);
});

test('Biometric authentication events are logged', () => {
  const events = fixtures.auditEvents.mobileEvents;
  const biometricEvent = events.find(e => e.eventType === 'biometric_authenticated');
  assertTrue(biometricEvent !== undefined);
  assertEqual(biometricEvent.metadata.biometricType, 'face_id');
  assertTrue(biometricEvent.metadata.success === true);
});

test('Offline action queued events are logged', () => {
  const events = fixtures.auditEvents.mobileEvents;
  const queuedEvent = events.find(e => e.eventType === 'offline_action_queued');
  assertTrue(queuedEvent !== undefined);
  assertEqual(queuedEvent.metadata.networkStatus, 'offline');
});

test('Offline action synced events are logged', () => {
  const events = fixtures.auditEvents.mobileEvents;
  const syncedEvent = events.find(e => e.eventType === 'offline_action_synced');
  assertTrue(syncedEvent !== undefined);
  assertEqual(syncedEvent.metadata.syncResult, 'success');
});

test('Push notification events are logged', () => {
  const events = fixtures.auditEvents.mobileEvents;
  const receivedEvent = events.find(e => e.eventType === 'push_notification_received');
  const tappedEvent = events.find(e => e.eventType === 'push_notification_tapped');
  assertTrue(receivedEvent !== undefined);
  assertTrue(tappedEvent !== undefined);
  assertTrue(receivedEvent.metadata.delivered === true);
});

test('Accessibility feature events are logged', () => {
  const events = fixtures.auditEvents.mobileEvents;
  const a11yEvent = events.find(e => e.eventType === 'accessibility_feature_enabled');
  assertTrue(a11yEvent !== undefined);
  assertEqual(a11yEvent.category, 'cross_platform');
  assertEqual(a11yEvent.metadata.feature, 'high_contrast');
});

test('Language direction change events are logged', () => {
  const events = fixtures.auditEvents.mobileEvents;
  const directionEvent = events.find(e => e.eventType === 'language_direction_changed');
  assertTrue(directionEvent !== undefined);
  assertEqual(directionEvent.metadata.previousDirection, 'ltr');
  assertEqual(directionEvent.metadata.newDirection, 'rtl');
});

test('Responsive layout change events are logged', () => {
  const events = fixtures.auditEvents.mobileEvents;
  const layoutEvent = events.find(e => e.eventType === 'responsive_layout_changed');
  assertTrue(layoutEvent !== undefined);
  assertTrue(layoutEvent.metadata.previousBreakpoint !== undefined);
  assertTrue(layoutEvent.metadata.newBreakpoint !== undefined);
});

// Documentation tests
console.log('\n--- Documentation Tests ---');

test('Mobile operator app documentation exists', () => {
  const docsPath = join(__dirname, '../../Docs/mobile_operator_app.md');
  assertTrue(existsSync(docsPath));
});

test('Cross-platform UI documentation exists', () => {
  const docsPath = join(__dirname, '../../Docs/cross_platform_ui.md');
  assertTrue(existsSync(docsPath));
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
