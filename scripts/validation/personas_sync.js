#!/usr/bin/env node
/**
 * Personas Validation + Sync Script
 * Phase 1/2: Validate CSV against schema, preview (dry-run) create/update actions.
 * Phase 3 (commit): Push changes to Airtable.
 *
 * Usage:
 *   node scripts/validation/personas_sync.js --source personas/personas.csv --dry-run
 *   node scripts/validation/personas_sync.js --source personas/personas.csv --commit
 */

const fs = require('fs');
const path = require('path');

// Node 18+ has global fetch
const fetchFn = global.fetch || require('node-fetch');

// Simple CLI arg parsing
const args = process.argv.slice(2);
const getArg = (name, def = null) => {
  const idx = args.indexOf(name);
  if (idx === -1) return def;
  return args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : true;
};

const sourcePath = getArg('--source');
const isDryRun = args.includes('--dry-run');
const doCommit = args.includes('--commit');
if (!sourcePath) {
  console.error('ERROR: --source <csvPath> required');
  process.exit(1);
}
if (isDryRun && doCommit) {
  console.error('ERROR: Use either --dry-run OR --commit, not both.');
  process.exit(1);
}

// Load env (.env) manually (minimal parser)
function loadEnv() {
  const envFile = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envFile)) return;
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  lines.forEach(l => {
    const m = l.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  });
}
loadEnv();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PERSONAS_TABLE = process.env.AIRTABLE_PERSONAS_TABLE || 'Personas';

if (doCommit && (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID)) {
  console.error('ERROR: Missing Airtable credentials (AIRTABLE_API_KEY / AIRTABLE_BASE_ID).');
  process.exit(1);
}

// Load schema JSON
const schemaPath = path.join(process.cwd(), 'scripts', 'validation', 'personas.schema.json');
if (!fs.existsSync(schemaPath)) {
  console.error('ERROR: Schema file missing at', schemaPath);
  process.exit(1);
}
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Minimal CSV parser (no quoted commas support beyond basic). Adjust if needed.
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
  const header = lines.shift().split(',');
  return lines.map(line => {
    const parts = line.split(',');
    const obj = {};
    header.forEach((h, i) => obj[h] = parts[i] !== undefined ? parts[i] : '');
    return obj;
  });
}

function validateRecord(record) {
  const errors = [];
  // Required fields
  schema.required.forEach(f => {
    if (record[f] === undefined || record[f] === '') errors.push(`Missing required field: ${f}`);
  });
  // Type & pattern checks (basic)
  Object.entries(schema.properties).forEach(([field, def]) => {
    if (record[field] !== undefined && def.type === 'string') {
      if (def.minLength && record[field].length < def.minLength) errors.push(`Field ${field} length < ${def.minLength}`);
      if (def.pattern) {
        const re = new RegExp(def.pattern);
        if (!re.test(record[field])) errors.push(`Field ${field} fails pattern ${def.pattern}`);
      }
    }
  });
  return errors;
}

async function fetchExistingPersonas() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return { byCode: {}, records: [] };
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(PERSONAS_TABLE)}?pageSize=100`;
  const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };
  let all = [];
  let offset;
  do {
    const fullUrl = offset ? url + `&offset=${offset}` : url;
    const res = await fetchFn(fullUrl, { headers });
    if (!res.ok) throw new Error('Failed fetch personas: ' + res.status);
    const data = await res.json();
    all = all.concat(data.records);
    offset = data.offset;
  } while (offset);
  const byCode = {};
  all.forEach(r => {
    const code = r.fields.persona_code;
    if (code) byCode[code] = r;
  });
  return { byCode, records: all };
}

function determineActions(validRecords, existingMap) {
  const toCreate = [];
  const toUpdate = [];
  validRecords.forEach(r => {
    const existing = existingMap[r.persona_code];
    if (!existing) {
      toCreate.push(r);
    } else {
      // Basic diff: update if any field differs
      const diffs = {};
      Object.keys(r).forEach(k => {
        if (r[k] !== (existing.fields[k] || '')) diffs[k] = { from: existing.fields[k], to: r[k] };
      });
      if (Object.keys(diffs).length > 0) {
        toUpdate.push({ record: r, airtableId: existing.id, diffs });
      }
    }
  });
  return { toCreate, toUpdate };
}

function writeReport(baseDir, { errors, valid, actions }) {
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  fs.writeFileSync(path.join(baseDir, 'errors.csv'), 'row,errors\n' + errors.map(e => `${e.index},"${e.errors.join('; ')}"`).join('\n'));
  if (valid.length) {
    const header = Object.keys(valid[0]).join(',');
    fs.writeFileSync(path.join(baseDir, 'valid.csv'), header + '\n' + valid.map(r => Object.values(r).join(',')).join('\n'));
  }
  fs.writeFileSync(path.join(baseDir, 'actions_preview.json'), JSON.stringify(actions, null, 2));
  const summary = {
    total: errors.length + valid.length,
    valid: valid.length,
    invalid: errors.length,
    willCreate: actions.toCreate.length,
    willUpdate: actions.toUpdate.length,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(path.join(baseDir, 'summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}

async function commitActions(actions) {
  const commitLog = [];
  // Batch create (10 per request)
  const createBatches = [];
  for (let i = 0; i < actions.toCreate.length; i += 10) {
    createBatches.push(actions.toCreate.slice(i, i + 10));
  }
  for (const batch of createBatches) {
    const res = await fetchFn(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(PERSONAS_TABLE)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: batch.map(b => ({ fields: b })) })
    });
    const data = await res.json();
    commitLog.push({ type: 'create', status: res.status, response: data });
  }
  // Batch update (simple approach: PATCH per batch ≤10)
  const updateBatches = [];
  for (let i = 0; i < actions.toUpdate.length; i += 10) {
    updateBatches.push(actions.toUpdate.slice(i, i + 10));
  }
  for (const batch of updateBatches) {
    const res = await fetchFn(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(PERSONAS_TABLE)}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: batch.map(b => ({ id: b.airtableId, fields: b.record })) })
    });
    const data = await res.json();
    commitLog.push({ type: 'update', status: res.status, response: data });
  }
  return commitLog;
}

async function main() {
  const csvText = fs.readFileSync(sourcePath, 'utf8');
  const records = parseCSV(csvText);
  const errors = [];
  const valid = [];
  records.forEach((r, idx) => {
    const errs = validateRecord(r);
    if (errs.length) errors.push({ index: idx + 1, errors: errs }); else valid.push(r);
  });
  let existingMap = {};
  try {
    const existing = await fetchExistingPersonas();
    existingMap = existing.byCode;
  } catch (e) {
    console.warn('WARN: Could not fetch existing Airtable personas (perhaps missing creds) — proceeding with local validation only.');
  }
  const actions = determineActions(valid, existingMap);
  const outDir = path.join(process.cwd(), 'logs', 'sync', 'personas');
  const summary = writeReport(outDir, { errors, valid, actions });
  console.log('Validation summary:', summary);
  if (isDryRun) {
    console.log('Dry-run complete. See actions_preview.json for planned create/update operations.');
    return;
  }
  if (doCommit) {
    console.log('Committing changes to Airtable...');
    const log = await commitActions(actions);
    fs.writeFileSync(path.join(outDir, 'commit_log.json'), JSON.stringify(log, null, 2));
    console.log('Commit complete.');
    return;
  }
  console.log('No --dry-run or --commit flag supplied. Exiting after validation.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
