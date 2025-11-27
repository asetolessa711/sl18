/**
 * SL18 Extended Multilingual Support Test Suite
 * Phase 15 Extended: Language Registry & Selection Panel
 * 
 * Run: node tests/governance/language_registry.test.js
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

// Test result tracking
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    failures.push({ name, error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
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

function assertArrayIncludes(arr, value, message) {
  if (!arr.includes(value)) {
    throw new Error(message || `Array does not include ${value}`);
  }
}

// Load JSON files
function loadJSON(path) {
  const fullPath = join(repoRoot, path);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${path}`);
  }
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

// Constants for validation patterns
const SEMVER_PATTERN = /^\d+\.\d+(\.\d+)?$/;
const LANGUAGE_CODE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

// Language registry validation
function validateRegistry(data) {
  const required = ['registryVersion', 'lastUpdated', 'languages', 'defaultLanguage'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate version format
  if (!SEMVER_PATTERN.test(data.registryVersion)) {
    return { valid: false, error: 'registryVersion must match semver pattern' };
  }

  // Validate each language entry
  for (const lang of data.languages) {
    if (!lang.code || !LANGUAGE_CODE_PATTERN.test(lang.code)) {
      return { valid: false, error: 'code must match ISO pattern' };
    }
    if (!lang.displayName || !lang.nativeName) {
      return { valid: false, error: 'displayName and nativeName are required' };
    }
    if (!['ltr', 'rtl'].includes(lang.direction)) {
      return { valid: false, error: 'direction must be ltr or rtl' };
    }
    const validStatuses = ['available', 'beta', 'coming_soon', 'deprecated'];
    if (!validStatuses.includes(lang.status)) {
      return { valid: false, error: 'status must be one of enum values' };
    }
  }

  return { valid: true };
}

// Language search function
function searchLanguages(registry, searchTerm) {
  const term = searchTerm.toLowerCase();
  return registry.languages.filter(lang => 
    lang.code.toLowerCase().includes(term) ||
    lang.displayName.toLowerCase().includes(term) ||
    lang.nativeName.toLowerCase().includes(term)
  );
}

// Dynamic loading simulation
function loadLanguagePack(registry, code) {
  const lang = registry.languages.find(l => l.code === code);
  if (!lang) {
    return { loaded: false, error: 'Language not found' };
  }
  return {
    loaded: true,
    language: lang,
    loadedOnDemand: lang.loadOnDemand !== false
  };
}

// Selection panel validation
function validateSelectionPanel(data) {
  const required = ['panelId', 'workspaceId', 'selectedLanguages', 'primaryLanguage'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate primary language is in selected languages
  const selectedCodes = data.selectedLanguages.map(l => l.code);
  if (!selectedCodes.includes(data.primaryLanguage)) {
    return { valid: false, error: 'primaryLanguage must be in selectedLanguages' };
  }

  // Validate language roles
  const primaryCount = data.selectedLanguages.filter(l => l.role === 'primary').length;
  if (primaryCount !== 1) {
    return { valid: false, error: 'Exactly one language must have primary role' };
  }

  return { valid: true };
}

console.log('\n=== SL18 Extended Multilingual Support Tests ===\n');

// Test 1: Schema files exist
console.log('--- Schema File Existence ---');

test('Language pack registry schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/language_pack_registry.schema.json')));
});

test('Language selection panel schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/language_selection_panel.schema.json')));
});

// Test 2: Schema files are valid JSON
console.log('\n--- Schema JSON Validity ---');

test('Language pack registry schema is valid JSON', () => {
  const schema = loadJSON('schemas/language_pack_registry.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'LanguagePackRegistry', 'Incorrect title');
});

test('Language selection panel schema is valid JSON', () => {
  const schema = loadJSON('schemas/language_selection_panel.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'LanguageSelectionPanel', 'Incorrect title');
});

// Test 3: Language registry validation
console.log('\n--- Language Registry Validation ---');

test('Valid registry passes validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const result = validateRegistry(fixtures.validRegistry);
  assert(result.valid, `Registry validation failed: ${result.error}`);
});

test('Invalid registries fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  for (const testCase of fixtures.invalidRegistries) {
    const result = validateRegistry(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

// Test 4: New language packs exist
console.log('\n--- Extended Language Pack Validation ---');

test('Italian language pack exists', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const italian = fixtures.validLanguagePacks.find(p => p.languageCode === 'it');
  assert(italian !== undefined, 'Italian language pack not found');
  assertEqual(italian.displayName, 'Italian');
  assertEqual(italian.nativeName, 'Italiano');
  assertEqual(italian.direction, 'ltr');
});

test('Oromifa language pack exists', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const oromifa = fixtures.validLanguagePacks.find(p => p.languageCode === 'om');
  assert(oromifa !== undefined, 'Oromifa language pack not found');
  assertEqual(oromifa.displayName, 'Oromifa (Afaan Oromo)');
  assertEqual(oromifa.nativeName, 'Afaan Oromoo');
  assertEqual(oromifa.direction, 'ltr');
});

test('Amharic language pack exists', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const amharic = fixtures.validLanguagePacks.find(p => p.languageCode === 'am');
  assert(amharic !== undefined, 'Amharic language pack not found');
  assertEqual(amharic.displayName, 'Amharic');
  assertEqual(amharic.nativeName, 'አማርኛ');
  assertEqual(amharic.direction, 'ltr');
});

test('Kiswahili language pack exists', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const swahili = fixtures.validLanguagePacks.find(p => p.languageCode === 'sw');
  assert(swahili !== undefined, 'Kiswahili language pack not found');
  assertEqual(swahili.displayName, 'Kiswahili');
  assertEqual(swahili.nativeName, 'Kiswahili');
  assertEqual(swahili.direction, 'ltr');
});

// Test 5: Language search functionality
console.log('\n--- Language Search Tests ---');

test('Search by display name returns correct language', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const results = searchLanguages(fixtures.validRegistry, 'Italian');
  assert(results.length > 0, 'No results found');
  assertEqual(results[0].code, 'it');
});

test('Search by native name returns correct language', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const results = searchLanguages(fixtures.validRegistry, 'አማርኛ');
  assert(results.length > 0, 'No results found');
  assertEqual(results[0].code, 'am');
});

test('Search by code returns correct language', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const results = searchLanguages(fixtures.validRegistry, 'sw');
  assert(results.length > 0, 'No results found');
  assertEqual(results[0].code, 'sw');
});

test('Case-insensitive search works', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const results = searchLanguages(fixtures.validRegistry, 'KISWAHILI');
  assert(results.length > 0, 'No results found');
  assertEqual(results[0].code, 'sw');
});

test('Partial match returns results', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const results = searchLanguages(fixtures.validRegistry, 'oro');
  assert(results.length > 0, 'No results found');
  assertEqual(results[0].code, 'om');
});

// Test 6: Dynamic loading tests
console.log('\n--- Dynamic Loading Tests ---');

test('On-demand language loads successfully', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const result = loadLanguagePack(fixtures.validRegistry, 'it');
  assert(result.loaded, 'Italian should load successfully');
  assert(result.loadedOnDemand, 'Italian should be loaded on-demand');
});

test('Preloaded language is immediately available', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const result = loadLanguagePack(fixtures.validRegistry, 'en');
  assert(result.loaded, 'English should load successfully');
  assert(!result.loadedOnDemand, 'English should be preloaded');
});

test('RTL language renders correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const result = loadLanguagePack(fixtures.validRegistry, 'ar');
  assert(result.loaded, 'Arabic should load successfully');
  assertEqual(result.language.direction, 'rtl', 'Arabic should be RTL');
});

test('Ethiopic script language loads with correct font', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const result = loadLanguagePack(fixtures.validRegistry, 'am');
  assert(result.loaded, 'Amharic should load successfully');
  assertEqual(result.language.scriptSystem, 'ethiopic', 'Amharic should use Ethiopic script');
  assertArrayIncludes(result.language.fontRecommendations, 'Noto Sans Ethiopic', 'Should recommend Noto Sans Ethiopic');
});

// Test 7: Language pack QC thresholds
console.log('\n--- QC Thresholds Validation ---');

test('All new languages have QC rules defined', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const newLanguages = ['it', 'om', 'am', 'sw'];
  for (const code of newLanguages) {
    const pack = fixtures.validLanguagePacks.find(p => p.languageCode === code);
    assert(pack !== undefined, `${code} pack not found`);
    assert(pack.qcRules !== undefined, `${code} should have qcRules`);
    assert(pack.qcRules.translationAccuracyThreshold !== undefined, `${code} should have translationAccuracyThreshold`);
  }
});

test('Amharic has cultural review and higher translation threshold', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const amharic = fixtures.validLanguagePacks.find(p => p.languageCode === 'am');
  assert(amharic.qcRules.translationAccuracyThreshold >= 95, 'Amharic should have high translation accuracy threshold');
  assert(amharic.qcRules.culturalReviewRequired === true, 'Amharic should require cultural review');
});

// Test 8: Registry contains all new languages
console.log('\n--- Registry Contains All Languages ---');

test('Registry includes Italian', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const italian = fixtures.validRegistry.languages.find(l => l.code === 'it');
  assert(italian !== undefined, 'Italian should be in registry');
  assertEqual(italian.status, 'available');
});

test('Registry includes Oromifa', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const oromifa = fixtures.validRegistry.languages.find(l => l.code === 'om');
  assert(oromifa !== undefined, 'Oromifa should be in registry');
  assertEqual(oromifa.region, 'Africa');
});

test('Registry includes Amharic with Ethiopic script', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const amharic = fixtures.validRegistry.languages.find(l => l.code === 'am');
  assert(amharic !== undefined, 'Amharic should be in registry');
  assertEqual(amharic.scriptSystem, 'ethiopic');
});

test('Registry includes Kiswahili with locale variations', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_registry.json');
  const swahili = fixtures.validRegistry.languages.find(l => l.code === 'sw');
  assert(swahili !== undefined, 'Kiswahili should be in registry');
  assert(swahili.localeVariations !== undefined, 'Kiswahili should have locale variations');
  assert(swahili.localeVariations.length >= 2, 'Kiswahili should have Kenya and Tanzania variants');
});

// Test 9: Selection panel functionality
console.log('\n--- Selection Panel Tests ---');

test('Selection panel schema has multi-select support', () => {
  const schema = loadJSON('schemas/language_selection_panel.schema.json');
  assert(schema.properties.selectedLanguages !== undefined, 'Should have selectedLanguages array');
  assertEqual(schema.properties.selectedLanguages.type, 'array');
});

test('Selection panel supports primary/secondary roles', () => {
  const schema = loadJSON('schemas/language_selection_panel.schema.json');
  const roleEnum = schema.properties.selectedLanguages.items.properties.role.enum;
  assertArrayIncludes(roleEnum, 'primary', 'Should support primary role');
  assertArrayIncludes(roleEnum, 'secondary', 'Should support secondary role');
});

test('Selection panel has search configuration', () => {
  const schema = loadJSON('schemas/language_selection_panel.schema.json');
  assert(schema.properties.searchConfig !== undefined, 'Should have searchConfig');
  assert(schema.properties.searchConfig.properties.enableSearch !== undefined, 'Should have enableSearch');
  assert(schema.properties.searchConfig.properties.searchFields !== undefined, 'Should have searchFields');
});

test('Selection panel supports dynamic switching', () => {
  const schema = loadJSON('schemas/language_selection_panel.schema.json');
  assert(schema.properties.dynamicSwitching !== undefined, 'Should have dynamicSwitching');
  assert(schema.properties.dynamicSwitching.properties.enabled !== undefined, 'Should have enabled flag');
  assert(schema.properties.dynamicSwitching.properties.allowedOperations !== undefined, 'Should have allowedOperations');
});

test('Selection panel integrates with QC dashboard', () => {
  const schema = loadJSON('schemas/language_selection_panel.schema.json');
  assert(schema.properties.qcDashboardIntegration !== undefined, 'Should have qcDashboardIntegration');
  assert(schema.properties.qcDashboardIntegration.properties.sideBySideView !== undefined, 'Should support side-by-side view');
});

// Test 10: Persona consistency validation
console.log('\n--- Persona Consistency Per Language ---');

test('All language packs require persona consistency check', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  for (const pack of fixtures.validLanguagePacks) {
    if (pack.qcRules) {
      assert(
        pack.qcRules.personaConsistencyRequired === true,
        `${pack.languageCode} should require persona consistency`
      );
    }
  }
});

test('African languages require native reviewer', () => {
  const fixtures = loadJSON('tests/governance/fixtures/language_packs.json');
  const africanLanguages = ['om', 'am', 'sw'];
  for (const code of africanLanguages) {
    const pack = fixtures.validLanguagePacks.find(p => p.languageCode === code);
    assert(pack !== undefined, `${code} pack not found`);
    assert(pack.qcRules.nativeReviewerRequired === true, `${code} should require native reviewer`);
  }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.error}`);
  }
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
