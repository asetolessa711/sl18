/**
 * SL18 Phase 21: Frontend & UI Implementation Tests
 * 
 * Tests for UI schemas, operator console, dashboards, and panels
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
  const path = join(fixturesDir, 'ui_frontend.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Schema validation helpers
function validateRequiredFields(data, requiredFields) {
  for (const field of requiredFields) {
    if (!(field in data)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  return { valid: true };
}

function validateEnumValue(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    return { valid: false, error: `Invalid ${fieldName}: ${value}. Allowed: ${allowedValues.join(', ')}` };
  }
  return { valid: true };
}

function validatePattern(value, pattern, fieldName) {
  const regex = new RegExp(pattern);
  if (!regex.test(value)) {
    return { valid: false, error: `Invalid ${fieldName} format: ${value}` };
  }
  return { valid: true };
}

// UI validation functions
function validateOperatorConsole(console) {
  const errors = [];
  
  // Required fields
  const required = ['consoleId', 'version', 'operator'];
  for (const field of required) {
    if (!(field in console)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Console ID pattern
  if (console.consoleId && !/^console-[a-z0-9-]+$/.test(console.consoleId)) {
    errors.push('Invalid consoleId pattern');
  }
  
  // Version pattern
  if (console.version && !/^\d+\.\d+\.\d+$/.test(console.version)) {
    errors.push('Invalid version pattern');
  }
  
  // Operator validation
  if (console.operator) {
    if (!console.operator.operatorId) {
      errors.push('Operator missing operatorId');
    }
    if (!console.operator.role) {
      errors.push('Operator missing role');
    }
    const validRoles = ['viewer', 'operator', 'reviewer', 'contributor', 'auditor', 'admin', 'super_admin'];
    if (console.operator.role && !validRoles.includes(console.operator.role)) {
      errors.push(`Invalid operator role: ${console.operator.role}`);
    }
  }
  
  // Navigation modules
  if (console.navigation?.primaryModules) {
    const validModules = [
      'dashboard', 'franchises', 'series', 'episodes', 'personas', 'languages',
      'distribution', 'partners', 'marketplace', 'governance', 'personalization',
      'monetization', 'insights', 'alerts', 'settings'
    ];
    for (const module of console.navigation.primaryModules) {
      if (!validModules.includes(module.moduleId)) {
        errors.push(`Invalid navigation module: ${module.moduleId}`);
      }
    }
  }
  
  // Widget types
  if (console.dashboardWidgets) {
    const validWidgetTypes = [
      'kpi_card', 'chart_line', 'chart_bar', 'chart_pie', 'chart_area',
      'table', 'list', 'map', 'heatmap', 'timeline', 'alert_summary', 'activity_feed'
    ];
    for (const widget of console.dashboardWidgets) {
      if (!validWidgetTypes.includes(widget.widgetType)) {
        errors.push(`Invalid widget type: ${widget.widgetType}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateDashboard(dashboard) {
  const errors = [];
  
  // Required fields
  const required = ['dashboardId', 'name', 'type'];
  for (const field of required) {
    if (!(field in dashboard)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Dashboard ID pattern
  if (dashboard.dashboardId && !/^dash-[a-z0-9-]+$/.test(dashboard.dashboardId)) {
    errors.push('Invalid dashboardId pattern');
  }
  
  // Dashboard type
  const validTypes = [
    'overview', 'observability', 'multilingual', 'distribution', 'marketplace',
    'personalization', 'monetization', 'insights', 'governance', 'custom'
  ];
  if (dashboard.type && !validTypes.includes(dashboard.type)) {
    errors.push(`Invalid dashboard type: ${dashboard.type}`);
  }
  
  // KPI metrics
  if (dashboard.kpis) {
    const validMetrics = [
      'total_revenue', 'active_franchises', 'active_series', 'total_episodes',
      'active_contributors', 'active_partners', 'distribution_channels', 'qc_pass_rate',
      'engagement_rate', 'audience_reach', 'conversion_rate', 'churn_rate',
      'avg_watch_time', 'sentiment_score', 'translation_accuracy', 'persona_consistency'
    ];
    for (const kpi of dashboard.kpis) {
      if (kpi.metric && !validMetrics.includes(kpi.metric)) {
        errors.push(`Invalid KPI metric: ${kpi.metric}`);
      }
    }
  }
  
  // Chart types
  if (dashboard.charts) {
    const validChartTypes = ['line', 'bar', 'area', 'pie', 'donut', 'heatmap', 'scatter', 'funnel', 'radar'];
    for (const chart of dashboard.charts) {
      if (chart.chartType && !validChartTypes.includes(chart.chartType)) {
        errors.push(`Invalid chart type: ${chart.chartType}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validatePanel(panel) {
  const errors = [];
  
  // Required fields
  const required = ['panelId', 'panelType', 'title'];
  for (const field of required) {
    if (!(field in panel)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Panel types
  const validPanelTypes = [
    'language_selection', 'series_workspace', 'governance_console', 'marketplace_portal',
    'partner_integration', 'personalization_ui', 'monetization_controls',
    'insights_dashboard', 'feedback_loop', 'qc_dashboard'
  ];
  if (panel.panelType && !validPanelTypes.includes(panel.panelType)) {
    errors.push(`Invalid panel type: ${panel.panelType}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Run tests
console.log('\n=== SL18 Phase 21: Frontend & UI Tests ===\n');

// Schema file existence tests
console.log('--- Schema File Existence ---');

test('UI operator console schema exists', () => {
  assertTrue(existsSync(join(schemasDir, 'ui_operator_console.schema.json')));
});

test('UI dashboard schema exists', () => {
  assertTrue(existsSync(join(schemasDir, 'ui_dashboard.schema.json')));
});

test('UI panels schema exists', () => {
  assertTrue(existsSync(join(schemasDir, 'ui_panels.schema.json')));
});

// Schema JSON validity tests
console.log('\n--- Schema JSON Validity ---');

test('UI operator console schema is valid JSON', () => {
  const schema = loadSchema('ui_operator_console.schema.json');
  assertTrue(schema.$schema !== undefined);
  assertTrue(schema.properties !== undefined);
});

test('UI dashboard schema is valid JSON', () => {
  const schema = loadSchema('ui_dashboard.schema.json');
  assertTrue(schema.$schema !== undefined);
  assertTrue(schema.properties !== undefined);
});

test('UI panels schema is valid JSON', () => {
  const schema = loadSchema('ui_panels.schema.json');
  assertTrue(schema.$schema !== undefined);
  assertTrue(schema.definitions !== undefined);
});

// Operator Console tests
console.log('\n--- Operator Console Validation ---');

const fixtures = loadFixtures();

test('Valid operator console passes validation', () => {
  const result = validateOperatorConsole(fixtures.operatorConsoles.valid[0]);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Invalid operator console (missing consoleId) fails validation', () => {
  const result = validateOperatorConsole(fixtures.operatorConsoles.invalid[0]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('consoleId')));
});

test('Invalid operator console (bad ID pattern) fails validation', () => {
  const result = validateOperatorConsole(fixtures.operatorConsoles.invalid[1]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('consoleId')));
});

test('Invalid operator console (invalid role) fails validation', () => {
  const result = validateOperatorConsole(fixtures.operatorConsoles.invalid[2]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('role')));
});

test('Console navigation modules are valid', () => {
  const console = fixtures.operatorConsoles.valid[0];
  const validModules = ['dashboard', 'languages', 'insights'];
  for (const module of console.navigation.primaryModules) {
    assertIncludes(validModules, module.moduleId);
  }
});

test('Console quick actions have required fields', () => {
  const console = fixtures.operatorConsoles.valid[0];
  for (const action of console.navigation.quickActions) {
    assertTrue(action.actionId !== undefined);
    assertTrue(action.label !== undefined);
    assertTrue(action.action !== undefined);
  }
});

test('Console dashboard widgets are valid', () => {
  const console = fixtures.operatorConsoles.valid[0];
  for (const widget of console.dashboardWidgets) {
    assertTrue(widget.widgetId !== undefined);
    assertTrue(widget.widgetType !== undefined);
    assertTrue(widget.title !== undefined);
  }
});

// Dashboard tests
console.log('\n--- Dashboard Validation ---');

test('Valid dashboard passes validation', () => {
  const result = validateDashboard(fixtures.dashboards.valid[0]);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Invalid dashboard (missing dashboardId) fails validation', () => {
  const result = validateDashboard(fixtures.dashboards.invalid[0]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('dashboardId')));
});

test('Invalid dashboard (invalid type) fails validation', () => {
  const result = validateDashboard(fixtures.dashboards.invalid[1]);
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('type')));
});

test('Dashboard KPIs have valid metrics', () => {
  const dashboard = fixtures.dashboards.valid[0];
  const validMetrics = ['total_revenue', 'engagement_rate'];
  for (const kpi of dashboard.kpis) {
    assertIncludes(validMetrics, kpi.metric);
  }
});

test('Dashboard charts have valid types', () => {
  const dashboard = fixtures.dashboards.valid[0];
  const validTypes = ['line', 'bar', 'area', 'pie'];
  for (const chart of dashboard.charts) {
    assertIncludes(validTypes, chart.chartType);
  }
});

test('Dashboard tables have required columns', () => {
  const dashboard = fixtures.dashboards.valid[0];
  for (const table of dashboard.tables) {
    assertTrue(table.columns.length > 0);
    for (const col of table.columns) {
      assertTrue(col.field !== undefined);
      assertTrue(col.header !== undefined);
    }
  }
});

test('Multilingual dashboard has correct scope', () => {
  const dashboard = fixtures.dashboards.valid[1];
  assertEqual(dashboard.type, 'multilingual');
  assertTrue(dashboard.scope.languages.length > 0);
});

// Panel tests
console.log('\n--- Panel Validation ---');

test('Language selection panel passes validation', () => {
  const result = validatePanel(fixtures.panels.languageSelection.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Series workspace panel passes validation', () => {
  const result = validatePanel(fixtures.panels.seriesWorkspace.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Governance console panel passes validation', () => {
  const result = validatePanel(fixtures.panels.governanceConsole.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Marketplace portal panel passes validation', () => {
  const result = validatePanel(fixtures.panels.marketplacePortal.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Partner integration panel passes validation', () => {
  const result = validatePanel(fixtures.panels.partnerIntegration.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Personalization UI panel passes validation', () => {
  const result = validatePanel(fixtures.panels.personalizationUI.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Monetization controls panel passes validation', () => {
  const result = validatePanel(fixtures.panels.monetizationControls.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Insights dashboard panel passes validation', () => {
  const result = validatePanel(fixtures.panels.insightsDashboard.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('Feedback loop panel passes validation', () => {
  const result = validatePanel(fixtures.panels.feedbackLoop.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

test('QC dashboard panel passes validation', () => {
  const result = validatePanel(fixtures.panels.qcDashboard.valid);
  assertTrue(result.valid, `Validation errors: ${result.errors.join(', ')}`);
});

// Panel configuration tests
console.log('\n--- Panel Configuration Tests ---');

test('Language selection panel has QC integration', () => {
  const panel = fixtures.panels.languageSelection.valid;
  assertTrue(panel.config.qcIntegration !== undefined);
  assertTrue(panel.config.qcIntegration.showQcStatus === true);
  assertTrue(panel.config.qcIntegration.sideBySideComparison === true);
});

test('Series workspace panel has continuity tracker', () => {
  const panel = fixtures.panels.seriesWorkspace.valid;
  assertTrue(panel.config.showContinuityTracker === true);
  assertTrue(panel.config.showPlotThreads === true);
});

test('Governance console panel has audit trail viewer', () => {
  const panel = fixtures.panels.governanceConsole.valid;
  assertTrue(panel.config.auditTrailViewer !== undefined);
  assertTrue(panel.config.auditTrailViewer.enabled === true);
  assertTrue(panel.config.auditTrailViewer.exportEnabled === true);
});

test('Marketplace portal panel has onboarding wizard', () => {
  const panel = fixtures.panels.marketplacePortal.valid;
  assertTrue(panel.config.onboardingWizard !== undefined);
  assertTrue(panel.config.onboardingWizard.steps.length > 0);
});

test('Partner integration panel has health monitoring', () => {
  const panel = fixtures.panels.partnerIntegration.valid;
  assertTrue(panel.config.healthMonitoring !== undefined);
  assertTrue(panel.config.healthMonitoring.showUptimeStatus === true);
});

test('Personalization UI panel has profile simulator', () => {
  const panel = fixtures.panels.personalizationUI.valid;
  assertTrue(panel.config.viewerProfileSimulator !== undefined);
  assertTrue(panel.config.viewerProfileSimulator.enabled === true);
});

test('Monetization controls panel has retention actions', () => {
  const panel = fixtures.panels.monetizationControls.valid;
  assertTrue(panel.config.retentionActions !== undefined);
  assertTrue(panel.config.retentionActions.actionTypes.length > 0);
});

test('Insights dashboard panel has sentiment analysis', () => {
  const panel = fixtures.panels.insightsDashboard.valid;
  assertTrue(panel.config.sentimentAnalysis !== undefined);
  assertTrue(panel.config.sentimentAnalysis.showCulturalReactions === true);
});

test('Feedback loop panel has cultural sensitivity alerts', () => {
  const panel = fixtures.panels.feedbackLoop.valid;
  assertTrue(panel.config.culturalSensitivityAlerts !== undefined);
  assertTrue(panel.config.culturalSensitivityAlerts.enabled === true);
});

test('QC dashboard panel has per-language QC', () => {
  const panel = fixtures.panels.qcDashboard.valid;
  assertTrue(panel.config.perLanguageQc !== undefined);
  assertTrue(panel.config.perLanguageQc.sideBySideView === true);
});

// Audit event tests
console.log('\n--- UI Audit Event Tests ---');

test('Console access events are logged', () => {
  const events = fixtures.auditEvents.uiEvents;
  const consoleEvent = events.find(e => e.eventType === 'console_accessed');
  assertTrue(consoleEvent !== undefined);
  assertEqual(consoleEvent.category, 'ui');
  assertTrue(consoleEvent.actor !== undefined);
  assertTrue(consoleEvent.target !== undefined);
});

test('Dashboard view events are logged', () => {
  const events = fixtures.auditEvents.uiEvents;
  const dashEvent = events.find(e => e.eventType === 'dashboard_viewed');
  assertTrue(dashEvent !== undefined);
  assertEqual(dashEvent.target.type, 'dashboard');
});

test('Panel access events are logged', () => {
  const events = fixtures.auditEvents.uiEvents;
  const panelEvent = events.find(e => e.eventType === 'panel_accessed');
  assertTrue(panelEvent !== undefined);
  assertEqual(panelEvent.target.type, 'panel');
});

test('Widget configuration events are logged', () => {
  const events = fixtures.auditEvents.uiEvents;
  const widgetEvent = events.find(e => e.eventType === 'widget_configured');
  assertTrue(widgetEvent !== undefined);
  assertTrue(widgetEvent.metadata.changes !== undefined);
});

test('Language switch events are logged', () => {
  const events = fixtures.auditEvents.uiEvents;
  const langEvent = events.find(e => e.eventType === 'language_switched');
  assertTrue(langEvent !== undefined);
  assertTrue(langEvent.metadata.previousLanguage !== undefined);
});

// Integration tests
console.log('\n--- Integration Tests ---');

test('Console context links to valid franchise', () => {
  const console = fixtures.operatorConsoles.valid[0];
  assertTrue(console.context.franchiseId !== undefined);
  assertTrue(console.context.franchiseId.length > 0);
});

test('Dashboard scope can filter by multiple franchises', () => {
  const dashboard = fixtures.dashboards.valid[0];
  assertTrue(dashboard.scope.franchiseIds.length > 1);
});

test('Panel permissions reference valid permission strings', () => {
  const panel = fixtures.panels.governanceConsole.valid;
  assertTrue(panel.permissions.length > 0);
  for (const perm of panel.permissions) {
    assertTrue(perm.includes(':'));
  }
});

test('All supported languages are in language selection panel', () => {
  const panel = fixtures.panels.languageSelection.valid;
  const supportedLangs = ['en', 'fr', 'es', 'ar', 'zh-CN', 'it', 'om', 'am', 'sw'];
  for (const lang of supportedLangs) {
    assertIncludes(panel.config.supportedLanguages, lang);
  }
});

// Documentation tests
console.log('\n--- Documentation Tests ---');

test('UI operator console documentation exists', () => {
  const docsPath = join(__dirname, '../../Docs/ui_operator_console.md');
  assertTrue(existsSync(docsPath));
});

test('UI frontend architecture documentation exists', () => {
  const docsPath = join(__dirname, '../../Docs/ui_frontend_architecture.md');
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
