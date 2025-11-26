import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync, promises as fs } from 'fs';
import Airtable, { type FieldSet, type SelectOptions } from 'airtable';
import { fileURLToPath } from 'url';
import { renderRouter } from './render-api.js';
import { storageRouter, createStorageFileMiddleware } from './storage-api.js';
import { qcRouter } from './qc-api.js';
import { controlPanelRouter } from './control-panel-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

// Load environment from repo root/back-end .env then override with .env.local variants
const rootEnvPath = path.join(repoRoot, '.env');
const backendEnvPath = path.join(repoRoot, 'apps', 'control-panel', 'backend', '.env');
const rootEnvLocalPath = path.join(repoRoot, '.env.local');
const backendEnvLocalPath = path.join(repoRoot, 'apps', 'control-panel', 'backend', '.env.local');
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath });
dotenv.config({ path: rootEnvLocalPath });
dotenv.config({ path: backendEnvLocalPath });

const app = express();
app.use(cors());
app.use(express.json());

// Mount render API routes
app.use('/api/render', renderRouter);

// Mount storage API routes
app.use('/api/storage', storageRouter);

// Mount QC API routes
app.use('/api/qc', qcRouter);

// Mount Control Panel API routes
app.use('/api/control-panel', controlPanelRouter);

// Mount storage file serving middleware
app.use('/storage', createStorageFileMiddleware());

const PORT = process.env.SL18_PANEL_PORT ? Number(process.env.SL18_PANEL_PORT) : 5178;

const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableBaseId = process.env.AIRTABLE_BASE_ID;
const airtableEpisodesTable = process.env.AIRTABLE_EPISODES_TABLE ?? 'Episodes';
const airtablePersonasTable = process.env.AIRTABLE_PERSONAS_TABLE ?? 'Personas';
const airtableFranchiseField = (process.env.AIRTABLE_EPISODES_FRANCHISE_FIELD ?? 'franchise_id').trim() || 'franchise_id';
const docsDirectory = path.join(repoRoot, 'Docs');
const docsExtensionWhitelist = new Set(['.md']);

const airtableBase = airtableApiKey && airtableBaseId
  ? new Airtable({ apiKey: airtableApiKey }).base(airtableBaseId)
  : null;

const UPLOAD_PAYLOAD_VERSION = 1;
const UPLOAD_QUEUE_STATUSES = ['render_ready', 'uploading'];
const UPLOAD_STATUS_METRICS = ['render_ready', 'uploading', 'published'];
const UPLOAD_ALLOWED_FIELDS = new Set([
  'status',
  'publish_url',
  'youtube_video_id',
  'meta_ig_media_id',
  'meta_fb_post_id',
  'tiktok_video_id',
  'notes'
]);
const uploadLogDir = path.join(repoRoot, 'logs');
const uploadActivityLogPath = path.join(uploadLogDir, 'upload_activity.jsonl');
const MAX_UPLOAD_ACTIVITY_ENTRIES = 200;
const alertsStatePath = path.join(uploadLogDir, 'alerts_state.json');
const adminToken = (process.env.PANEL_ADMIN_TOKEN ?? '').trim();

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertState = 'detected' | 'acknowledged' | 'resolved' | 'escalated';

interface AlertNote { timestamp: string; actor?: string; text: string }
interface AlertRecord {
  id: string; // e.g., credential:youtube
  source: 'credential' | 'system' | 'workflow';
  title: string;
  details: string;
  severity: AlertSeverity;
  state: AlertState;
  detectedAt: string;
  updatedAt: string;
  escalatedAt?: string;
  meta?: Record<string, unknown>;
  notes?: AlertNote[];
}

app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard', async (_req: Request, res: Response) => {
  if (!airtableBase) {
    res.status(500).json({ error: 'Missing AIRTABLE API credentials' });
    return;
  }

  try {
    const [episodes, personas] = await Promise.all([
      fetchAirtableRecords(airtableEpisodesTable, {
        maxRecords: 25,
        sortFields: ['-Last modified', '-Last Modified by']
      }),
      fetchAirtableRecords(airtablePersonasTable, {
        maxRecords: 50,
        sortFields: ['persona_code', 'Persona Code']
      })
    ]);

    res.json({
      episodes,
      personas,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[dashboard] airtable fetch failed', error);
    res.status(500).json({ error: 'Failed to load Airtable data' });
  }
});

app.get('/api/upload/queue', async (req: Request, res: Response) => {
  if (!airtableBase) {
    res.status(500).json({ error: 'Missing AIRTABLE API credentials' });
    return;
  }

  try {
    const franchise = normalizeQueryString(req.query?.franchise);
    const records = await fetchAirtableRecords(airtableEpisodesTable, {
      maxRecords: 100,
      sortFields: ['-Last modified', '-Last Modified by'],
      filterByFormula: buildStatusFormula(UPLOAD_QUEUE_STATUSES, franchise)
    });

    res.json({
      payloadVersion: UPLOAD_PAYLOAD_VERSION,
      records,
      credentials: getPublishingCredentialPreview(),
      fetchedAt: new Date().toISOString(),
      filter: {
        franchise: franchise ?? null
      }
    });
  } catch (error) {
    console.error('[upload] queue fetch failed', error);
    res.status(500).json({ error: 'Failed to load upload queue' });
  }
});

app.get('/api/upload/stats', async (req: Request, res: Response) => {
  if (!airtableBase) {
    res.status(500).json({ error: 'Missing AIRTABLE API credentials' });
    return;
  }

  try {
    const franchise = normalizeQueryString(req.query?.franchise);
    const counts = await fetchUploadStatusCounts(UPLOAD_STATUS_METRICS, franchise);
    res.json({
      counts,
      fetchedAt: new Date().toISOString(),
      filter: {
        franchise: franchise ?? null
      }
    });
  } catch (error) {
    console.error('[upload] stats fetch failed', error);
    res.status(500).json({ error: 'Failed to load upload stats' });
  }
});

app.post('/api/validate', (req: Request, res: Response) => {
  const { service } = req.body ?? {};
  const scriptPath = path.resolve(repoRoot, 'scripts', 'diagnostics', 'validate-env.ps1');
  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath];
  if (service) {
    args.push('-Service', service);
  }

  const ps = spawn('powershell', args, { cwd: repoRoot });
  res.setHeader('Content-Type', 'text/plain');

  ps.stdout.on('data', (chunk: Buffer | string) => {
    res.write(chunk);
  });

  ps.stderr.on('data', (chunk: Buffer | string) => {
    res.write(chunk);
  });

  ps.on('close', (code: number | null) => {
    res.end(`\n[INFO] validate-env.ps1 exited with code ${code}\n`);
  });
});

app.post('/api/upload/update', async (req: Request, res: Response) => {
  if (!airtableBase) {
    res.status(500).json({ error: 'Missing AIRTABLE API credentials' });
    return;
  }

  const { recordId, fields } = req.body ?? {};
  const actorRaw = typeof req.body?.actor === 'string' ? req.body.actor : undefined;
  const actor = actorRaw?.trim() ? actorRaw.trim() : undefined;
  if (typeof recordId !== 'string' || !recordId.trim()) {
    res.status(400).json({ error: 'recordId is required' });
    return;
  }

  if (!fields || typeof fields !== 'object') {
    res.status(400).json({ error: 'fields object is required' });
    return;
  }

  const sanitized: Partial<FieldSet> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (UPLOAD_ALLOWED_FIELDS.has(key)) {
      sanitized[key] = value as FieldSet[string];
    }
  }

  if (!Object.keys(sanitized).length) {
    res.status(400).json({ error: 'No valid fields provided' });
    return;
  }

  try {
    // Guard: block publish-related updates when required credentials are missing
    const credentialMap = getPublishingCredentialPreview();
    const targets: { provider: string; reason: string[] }[] = [];

    const wantsYouTube = typeof sanitized.youtube_video_id === 'string' ||
      (typeof sanitized.publish_url === 'string' && /youtu(\.be|be\.com)/i.test(sanitized.publish_url));
    const wantsMeta = typeof sanitized.meta_ig_media_id === 'string' || typeof sanitized.meta_fb_post_id === 'string';
    const wantsTikTok = typeof sanitized.tiktok_video_id === 'string' ||
      (typeof sanitized.publish_url === 'string' && /tiktok\.com/i.test(sanitized.publish_url));
    const wantsPublished = typeof (fields as any).status === 'string' && (fields as any).status === 'published';

    if (wantsYouTube || wantsPublished) {
      const cred = credentialMap['youtube'];
      if (cred && !cred.ready) targets.push({ provider: 'youtube', reason: cred.missing });
    }
    if (wantsMeta || wantsPublished) {
      const cred = credentialMap['meta'];
      if (cred && !cred.ready) targets.push({ provider: 'meta', reason: cred.missing });
    }
    if (wantsTikTok || wantsPublished) {
      const cred = credentialMap['tiktok'];
      if (cred && !cred.ready) targets.push({ provider: 'tiktok', reason: cred.missing });
    }

    if (targets.length) {
      // Log workflow alert(s) and block update
      const state = await readAlertsState();
      const nowIso = new Date().toISOString();
      for (const t of targets) {
        const id = `workflow:publish-block:${t.provider}:${recordId}`;
        const details = `Blocked publish for ${t.provider} due to: ${t.reason.join(' · ')}`;
        const rec: AlertRecord = state[id] ?? {
          id,
          source: 'workflow',
          title: `Publish blocked (${t.provider})`,
          details,
          severity: 'critical',
          state: 'detected',
          detectedAt: nowIso,
          updatedAt: nowIso,
          notes: []
        };
        rec.details = details;
        rec.updatedAt = nowIso;
        rec.notes = rec.notes ?? [];
        rec.notes.push({ timestamp: nowIso, text: 'Auto-blocked by server guard' });
        state[id] = rec;
      }
      await writeAlertsState(state);

      res.status(409).json({ error: 'Publish blocked due to missing credentials', targets });
      return;
    }

    const updatedRecords = await airtableBase(airtableEpisodesTable).update([
      { id: recordId, fields: sanitized }
    ], { typecast: true });

    const serialized = serializeRecord(updatedRecords[0]);

    await appendUploadActivity({
      recordId,
      timestamp: new Date().toISOString(),
      actor,
      fields: Object.fromEntries(Object.entries(sanitized ?? {}))
    });

    res.json(serialized);
  } catch (error) {
    console.error('[upload] update failed', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

app.get('/api/upload/activity', async (req: Request, res: Response) => {
  try {
    const recordId = normalizeQueryString(req.query?.recordId);
    const entries = await readUploadActivity(recordId ?? undefined);
    res.json({ entries });
  } catch (error) {
    console.error('[upload] activity fetch failed', error);
    res.status(500).json({ error: 'Failed to load upload activity' });
  }
});

app.get('/api/credentials/status', (_req: Request, res: Response) => {
  try {
    const credentials = getPublishingCredentialPreview();
    const alerts = Object.values(credentials)
      .filter(credential => !credential.ready)
      .map(credential => ({
        id: credential.id,
        label: credential.label,
        missing: credential.missing
      }));

    res.json({
      credentials,
      alerts,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[credential] status fetch failed', error);
    res.status(500).json({ error: 'Failed to load credential status' });
  }
});

// Alerts lifecycle API (MVP)
app.get('/api/alerts', async (req: Request, res: Response) => {
  try {
    const stateFilterRaw = normalizeQueryString(req.query?.state);
    const now = new Date();
    const current = buildCredentialAlerts();
    const stored = await readAlertsState();

    // Merge current alerts into state
    for (const alert of current) {
      const prev = stored[alert.id];
      if (prev && prev.state !== 'resolved') {
        // carry forward state and notes, update details & severity
        stored[alert.id] = {
          ...prev,
          title: alert.title,
          details: alert.details,
          severity: alert.severity,
          updatedAt: now.toISOString(),
          meta: alert.meta ?? prev.meta
        };
      } else {
        stored[alert.id] = {
          ...alert,
          state: 'detected',
          detectedAt: now.toISOString(),
          updatedAt: now.toISOString(),
          notes: prev?.notes ?? []
        };
      }
    }

    // Auto-resolve entries no longer present from credential source
    const currentIds = new Set(current.map(a => a.id));
    for (const [id, rec] of Object.entries(stored)) {
      if (rec.source === 'credential' && !currentIds.has(id) && rec.state !== 'resolved') {
        rec.state = 'resolved';
        rec.updatedAt = now.toISOString();
      }
    }

    // Auto-escalation: unresolved > 24h
    for (const rec of Object.values(stored)) {
      if (rec.state === 'detected' || rec.state === 'acknowledged') {
        const detected = new Date(rec.detectedAt);
        if (now.getTime() - detected.getTime() > 24 * 60 * 60 * 1000) {
          rec.state = 'escalated';
          rec.escalatedAt = rec.escalatedAt ?? now.toISOString();
          rec.updatedAt = now.toISOString();
        }
      }
    }

    await writeAlertsState(stored);

    let list = Object.values(stored).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (stateFilterRaw) {
      list = list.filter(a => a.state === stateFilterRaw);
    }
    const counts = listCounts(Object.values(stored));
    res.json({ alerts: list, counts, fetchedAt: now.toISOString() });
  } catch (error) {
    console.error('[alerts] list failed', error);
    res.status(500).json({ error: 'Failed to load alerts' });
  }
});

app.post('/api/alerts/ack', express.json(), async (req: Request, res: Response) => {
  const { id, actor } = req.body ?? {};
  if (typeof id !== 'string' || !id.trim()) {
    res.status(400).json({ error: 'id is required' });
    return;
  }
  const state = await readAlertsState();
  const rec = state[id];
  if (!rec) { res.status(404).json({ error: 'alert not found' }); return; }
  rec.state = 'acknowledged';
  rec.updatedAt = new Date().toISOString();
  rec.notes = rec.notes ?? [];
  if (actor) rec.notes.push({ timestamp: rec.updatedAt, actor, text: 'Acknowledged' });
  await writeAlertsState(state);
  res.json(rec);
});

app.post('/api/alerts/resolve', express.json(), async (req: Request, res: Response) => {
  const { id, actor, note } = req.body ?? {};
  if (typeof id !== 'string' || !id.trim()) {
    res.status(400).json({ error: 'id is required' });
    return;
  }
  const state = await readAlertsState();
  const rec = state[id];
  if (!rec) { res.status(404).json({ error: 'alert not found' }); return; }
  rec.state = 'resolved';
  rec.updatedAt = new Date().toISOString();
  rec.notes = rec.notes ?? [];
  if (note || actor) rec.notes.push({ timestamp: rec.updatedAt, actor, text: note || 'Resolved' });
  await writeAlertsState(state);
  res.json(rec);
});

app.post('/api/alerts/note', express.json(), async (req: Request, res: Response) => {
  const { id, actor, text } = req.body ?? {};
  if (typeof id !== 'string' || !id.trim() || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'id and text are required' });
    return;
  }
  const state = await readAlertsState();
  const rec = state[id];
  if (!rec) { res.status(404).json({ error: 'alert not found' }); return; }
  const ts = new Date().toISOString();
  rec.notes = rec.notes ?? [];
  rec.notes.push({ timestamp: ts, actor, text });
  rec.updatedAt = ts;
  await writeAlertsState(state);
  res.json(rec);
});

app.get('/api/docs', async (_req: Request, res: Response) => {
  try {
    const files = await readDocsDirectory();
    res.json({ files, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[docs] list failed', error);
    res.status(500).json({ error: 'Failed to list docs' });
  }
});

app.get('/api/docs/content', async (req: Request, res: Response) => {
  try {
    const id = normalizeQueryString(req.query?.file);
    if (!id) {
      res.status(400).json({ error: 'file query parameter is required' });
      return;
    }

    const docPath = resolveDocPath(id);
    if (!docPath) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const raw = await fs.readFile(docPath, 'utf8');
    res.json({ id, content: raw, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[docs] load failed', error);
    res.status(500).json({ error: 'Failed to load document' });
  }
});

app.listen(PORT, () => {
  console.log(`[control-panel] backend listening on http://localhost:${PORT}`);
});

interface FetchOptions {
  maxRecords?: number;
  sortFields?: string[];
  filterByFormula?: string;
  fields?: string[];
  view?: string;
}

type AirtableRecordType = Airtable.Record<FieldSet>;

async function fetchAirtableRecords(tableName: string, options: FetchOptions = {}) {
  if (!airtableBase) {
    return [];
  }

  const { maxRecords, sortFields, filterByFormula, fields, view } = options;

  const sortCandidates = sortFields ?? [];
  const sortConfig = [] as { field: string; direction: 'asc' | 'desc' }[];
  for (const candidate of sortCandidates) {
    if (!candidate) continue;
    const desc = candidate.startsWith('-');
    const fieldName = desc ? candidate.slice(1) : candidate;
    sortConfig.push({ field: fieldName, direction: desc ? 'desc' : 'asc' });
  }

  const selectOptions: SelectOptions<FieldSet> = {};
  if (typeof maxRecords === 'number') {
    selectOptions.maxRecords = maxRecords;
  }
  if (sortConfig.length) {
    selectOptions.sort = sortConfig;
  }
  if (filterByFormula) {
    selectOptions.filterByFormula = filterByFormula;
  }
  if (fields && fields.length) {
    selectOptions.fields = fields;
  }
  if (view) {
    selectOptions.view = view;
  }

  let records: readonly AirtableRecordType[];
  try {
    records = await airtableBase(tableName)
      .select(selectOptions)
      .all();
  } catch (err: any) {
    if (err?.error === 'UNKNOWN_FIELD_NAME') {
      const fallbackOptions: SelectOptions<FieldSet> = {};
      if (typeof maxRecords === 'number') {
        fallbackOptions.maxRecords = maxRecords;
      }
      if (filterByFormula) {
        fallbackOptions.filterByFormula = filterByFormula;
      }
      if (fields && fields.length) {
        fallbackOptions.fields = fields;
      }
      if (view) {
        fallbackOptions.view = view;
      }

      records = await airtableBase(tableName)
        .select(fallbackOptions)
        .all();
    } else {
      throw err;
    }
  }

  return records.map(serializeRecord);
}

function serializeRecord(record: AirtableRecordType) {
  return {
    id: record.id,
    fields: record.fields,
    createdTime: record._rawJson.createdTime
  };
}

function buildStatusFormula(statuses: string[], franchise?: string) {
  const conditions: string[] = [];

  const statusClauses = statuses
    .filter(Boolean)
    .map(status => `({status} = '${escapeFormulaValue(status)}')`);

  if (statusClauses.length === 1) {
    conditions.push(statusClauses[0]);
  } else if (statusClauses.length > 1) {
    conditions.push(`OR(${statusClauses.join(',')})`);
  }

  if (franchise) {
    conditions.push(`({${airtableFranchiseField}} = '${escapeFormulaValue(franchise)}')`);
  }

  if (!conditions.length) {
    return '';
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return `AND(${conditions.join(',')})`;
}

async function fetchUploadStatusCounts(statuses: string[], franchise?: string) {
  if (!statuses.length) {
    return {} as Record<string, number>;
  }

  const counts: Record<string, number> = {};
  for (const status of statuses) {
    counts[status] = 0;
  }

  const formula = buildStatusFormula(statuses, franchise);
  const records = await fetchAirtableRecords(airtableEpisodesTable, {
    filterByFormula: formula,
    fields: ['status'],
    maxRecords: 1000
  });

  for (const record of records) {
    const status = record.fields?.status;
    if (typeof status === 'string' && status in counts) {
      counts[status] += 1;
    }
  }

  return counts;
}

interface CredentialPreview {
  id: string;
  label: string;
  ready: boolean;
  missing: string[];
}

function getPublishingCredentialPreview() {
  const checks = [
    {
      id: 'youtube',
      label: 'YouTube',
      env: ['YOUTUBE_API_KEY'],
      files: ['config/youtube_client_secret.json', 'publishing/youtube/token.json']
    },
    {
      id: 'meta',
      label: 'Meta Reels',
      env: ['META_CREATOR_STUDIO_TOKEN', 'META_IG_ACCOUNT_ID', 'META_FB_PAGE_ID'],
      files: []
    },
    {
      id: 'capcut',
      label: 'CapCut',
      env: ['CAPCUT_API_KEY', 'CAPCUT_TEAM_ID', 'CAPCUT_TEMPLATE_ID'],
      files: []
    },
    // TikTok: manual-only for now; no credential check
  ];

  const result: Record<string, CredentialPreview> = {};

  for (const check of checks) {
    const missing: string[] = [];
    for (const envVar of check.env) {
      if (!process.env[envVar]) {
        missing.push(`env:${envVar}`);
      }
    }

    for (const relPath of check.files) {
      const absolutePath = path.join(repoRoot, relPath);
      if (!existsSync(absolutePath)) {
        missing.push(`file:${relPath}`);
      }
    }

    result[check.id] = {
      id: check.id,
      label: check.label,
      ready: missing.length === 0,
      missing
    };
  }

  return result;
}

function buildCredentialAlerts(): Omit<AlertRecord, 'state' | 'detectedAt' | 'updatedAt'>[] {
  const creds = getPublishingCredentialPreview();
  const out: Omit<AlertRecord, 'state' | 'detectedAt' | 'updatedAt'>[] = [];
  for (const cred of Object.values(creds)) {
    if (cred.ready) continue;
    const missingEnv = cred.missing.filter(m => m.startsWith('env:'));
    const missingFiles = cred.missing.filter(m => m.startsWith('file:'));
    let severity: AlertSeverity = missingEnv.length ? 'critical' : (missingFiles.length ? 'warning' : 'warning');
    const fallbackCandidates: string[] = [];
    let fallbackReady = false;
    // If backups exist for all missing envs on this credential, mark as fallbackReady and downgrade to warning
    if (missingEnv.length) {
      let allCovered = true;
      for (const envMarker of missingEnv) {
        const name = envMarker.slice(4);
        const backup = process.env[`${name}_BACKUP`];
        if (backup && backup.trim()) {
          fallbackCandidates.push(`${name}_BACKUP`);
        } else {
          allCovered = false;
        }
      }
      if (allCovered) {
        fallbackReady = true;
        severity = 'warning';
      }
    }
    out.push({
      id: `credential:${cred.id}`,
      source: 'credential',
      title: `${cred.label} credentials incomplete`,
      details: cred.missing.join(' · '),
      severity,
      meta: { missing: cred.missing, fallbackReady, fallbackCandidates }
    });
  }
  return out;
}

type AlertsStateFile = Record<string, AlertRecord>;

async function readAlertsState(): Promise<AlertsStateFile> {
  try {
    if (!existsSync(alertsStatePath)) {
      await fs.mkdir(uploadLogDir, { recursive: true });
      await fs.writeFile(alertsStatePath, '{}', 'utf8');
      return {};
    }
    const raw = await fs.readFile(alertsStatePath, 'utf8');
    return raw.trim() ? JSON.parse(raw) as AlertsStateFile : {};
  } catch (error) {
    console.warn('[alerts] read state failed', error);
    return {};
  }
}

async function writeAlertsState(state: AlertsStateFile): Promise<void> {
  try {
    await fs.mkdir(uploadLogDir, { recursive: true });
    await fs.writeFile(alertsStatePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.warn('[alerts] write state failed', error);
  }
}

function listCounts(list: AlertRecord[]) {
  const counts = { unresolved: 0, acknowledged: 0, resolved: 0, escalated: 0 } as Record<string, number>;
  for (const a of list) {
    if (a.state === 'resolved') counts.resolved++;
    else if (a.state === 'acknowledged') counts.acknowledged++;
    else if (a.state === 'escalated') counts.escalated++;
    else counts.unresolved++;
  }
  return counts;
}

// Apply fallback credentials for a provider when available
app.post('/api/alerts/fallback', express.json(), async (req: Request, res: Response) => {
  const { id, actor } = req.body ?? {};
  if (typeof id !== 'string' || !id.startsWith('credential:')) {
    res.status(400).json({ error: 'valid credential alert id is required' });
    return;
  }
  const provider = id.split(':')[1];
  const mapping: Record<string, string[]> = {
    youtube: ['YOUTUBE_API_KEY'],
    meta: ['META_CREATOR_STUDIO_TOKEN', 'META_IG_ACCOUNT_ID', 'META_FB_PAGE_ID'],
    capcut: ['CAPCUT_API_KEY', 'CAPCUT_TEAM_ID', 'CAPCUT_TEMPLATE_ID'],
    tiktok: ['TIKTOK_SESSION_COOKIE']
  };
  const keys = mapping[provider];
  if (!keys) { res.status(400).json({ error: `no fallback mapping for provider ${provider}` }); return; }

  const switched: string[] = [];
  for (const key of keys) {
    const backup = process.env[`${key}_BACKUP`];
    if (backup && backup.trim()) {
      process.env[key] = backup.trim();
      switched.push(key);
    }
  }

  const state = await readAlertsState();
  const rec = state[id];
  const ts = new Date().toISOString();
  if (rec) {
    rec.notes = rec.notes ?? [];
    rec.notes.push({ timestamp: ts, actor, text: switched.length ? `Fallback applied for: ${switched.join(', ')}` : 'Fallback attempted but no backup variables present' });
    rec.updatedAt = ts;
    await writeAlertsState(state);
  }

  res.json({ provider, switched });
});

// Persist current env values for a provider to .env.local (root) for durability
app.post('/api/alerts/persist-fallback', express.json(), async (req, res) => {
  const { id, actor } = req.body ?? {};
  if (adminToken) {
    const ok = isAdminRequest(req);
    if (!ok) {
      res.status(403).json({ error: 'admin token required' });
      return;
    }
  }
  if (typeof id !== 'string' || !id.startsWith('credential:')) {
    res.status(400).json({ error: 'valid credential alert id is required' });
    return;
  }
  const provider = id.split(':')[1];
  const mapping: Record<string, string[]> = {
    youtube: ['YOUTUBE_API_KEY'],
    meta: ['META_CREATOR_STUDIO_TOKEN', 'META_IG_ACCOUNT_ID', 'META_FB_PAGE_ID'],
    capcut: ['CAPCUT_API_KEY', 'CAPCUT_TEAM_ID', 'CAPCUT_TEMPLATE_ID'],
    tiktok: ['TIKTOK_SESSION_COOKIE']
  };
  const keys = mapping[provider];
  if (!keys) { res.status(400).json({ error: `no mapping for provider ${provider}` }); return; }

  const updates: Record<string, string> = {};
  for (const key of keys) {
    const val = process.env[key];
    if (typeof val === 'string' && val.trim()) {
      updates[key] = val.trim();
    }
  }
  if (!Object.keys(updates).length) {
    res.status(400).json({ error: 'no current env values to persist' });
    return;
  }

  const envLocalPath = path.join(repoRoot, '.env.local');
  await writeEnvLocal(envLocalPath, updates);

  const state = await readAlertsState();
  const rec = state[id];
  const ts = new Date().toISOString();
  if (rec) {
    rec.notes = rec.notes ?? [];
    rec.notes.push({ timestamp: ts, actor, text: `Persisted to .env.local: ${Object.keys(updates).join(', ')}` });
    rec.updatedAt = ts;
    await writeAlertsState(state);
  }

  res.json({ provider, persisted: Object.keys(updates), file: path.relative(repoRoot, envLocalPath) });
});

// Admin token status ping: returns whether a token is required and whether the provided token is valid
app.get('/api/admin/token-status', (req, res) => {
  const required = Boolean(adminToken);
  const valid = required ? isAdminRequest(req) : true;
  res.json({ required, valid });
});

async function writeEnvLocal(filePath: string, updates: Record<string, string>) {
  try {
    let existing = '';
    if (existsSync(filePath)) {
      existing = await fs.readFile(filePath, 'utf8');
    } else {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
    }
    const lines = existing.split(/\r?\n/);
    const out: string[] = [];
    const seen = new Set<string>();
    const isAssign = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;
    for (const line of lines) {
      const m = isAssign.exec(line);
      if (!m) { out.push(line); continue; }
      const key = m[1];
      if (updates[key] !== undefined) {
        out.push(`${key}=${escapeEnvValue(updates[key])}`);
        seen.add(key);
      } else {
        out.push(line);
      }
    }
    for (const [k, v] of Object.entries(updates)) {
      if (!seen.has(k)) {
        out.push(`${k}=${escapeEnvValue(v)}`);
      }
    }
    await fs.writeFile(filePath, out.join('\n').replace(/\n+$/,'\n'), 'utf8');
  } catch (e) {
    console.warn('[env] write .env.local failed', e);
    throw e;
  }
}

function escapeEnvValue(value: string) {
  if (/\s|#|"|\'/.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function isAdminRequest(req: Request): boolean {
  const header = (req.headers['x-admin-token'] ?? '') as string;
  const auth = (req.headers['authorization'] ?? '') as string;
  if (adminToken && header && header === adminToken) return true;
  if (adminToken && auth && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    if (token === adminToken) return true;
  }
  return false;
}

interface UploadActivityAppendPayload {
  recordId: string;
  timestamp: string;
  actor?: string;
  fields: Record<string, unknown>;
}

interface UploadActivityLogEntry extends UploadActivityAppendPayload {
  loggedAt: string;
  version: number;
}

async function appendUploadActivity(entry: UploadActivityAppendPayload) {
  try {
    await fs.mkdir(uploadLogDir, { recursive: true });
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entry.fields ?? {})) {
      fields[key] = value;
    }

    const payload: UploadActivityLogEntry = {
      recordId: entry.recordId,
      timestamp: entry.timestamp,
      actor: entry.actor?.trim() ? entry.actor.trim() : undefined,
      fields,
      loggedAt: new Date().toISOString(),
      version: UPLOAD_PAYLOAD_VERSION
    };

    await fs.appendFile(uploadActivityLogPath, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch (error) {
    console.warn('[upload] activity log append failed', error);
  }
}

async function readUploadActivity(recordId?: string) {
  if (!existsSync(uploadActivityLogPath)) {
    return [] as UploadActivityLogEntry[];
  }

  try {
    const raw = await fs.readFile(uploadActivityLogPath, 'utf8');
    if (!raw.trim()) {
      return [];
    }

    const entries: UploadActivityLogEntry[] = [];
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }

      try {
        const parsed = JSON.parse(line) as Partial<UploadActivityLogEntry>;
        if (!parsed || typeof parsed !== 'object') {
          continue;
        }

        if (typeof parsed.recordId !== 'string') {
          continue;
        }

        if (recordId && parsed.recordId !== recordId) {
          continue;
        }

        const timestamp = typeof parsed.timestamp === 'string' && parsed.timestamp.trim().length
          ? parsed.timestamp
          : undefined;
        const loggedAt = typeof parsed.loggedAt === 'string' && parsed.loggedAt.trim().length
          ? parsed.loggedAt
          : undefined;
        const fallbackTimestamp = new Date().toISOString();

        const entryFields: Record<string, unknown> = {};
        if (parsed.fields && typeof parsed.fields === 'object') {
          for (const [key, value] of Object.entries(parsed.fields as Record<string, unknown>)) {
            entryFields[key] = value;
          }
        }

        entries.push({
          recordId: parsed.recordId,
          timestamp: timestamp ?? loggedAt ?? fallbackTimestamp,
          actor: typeof parsed.actor === 'string' && parsed.actor.trim().length ? parsed.actor.trim() : undefined,
          fields: entryFields,
          loggedAt: loggedAt ?? timestamp ?? fallbackTimestamp,
          version: typeof parsed.version === 'number' ? parsed.version : UPLOAD_PAYLOAD_VERSION
        });
      } catch (parseError) {
        console.warn('[upload] activity parse failed', parseError);
      }
    }

    entries.sort((a, b) => {
      const tsCompare = b.timestamp.localeCompare(a.timestamp);
      if (tsCompare !== 0) {
        return tsCompare;
      }
      return b.loggedAt.localeCompare(a.loggedAt);
    });

    if (entries.length > MAX_UPLOAD_ACTIVITY_ENTRIES) {
      return entries.slice(0, MAX_UPLOAD_ACTIVITY_ENTRIES);
    }

    return entries;
  } catch (error) {
    console.error('[upload] activity read failed', error);
    return [];
  }
}

function escapeFormulaValue(value: string) {
  return value.replace(/'/g, "''");
}

function normalizeQueryString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

interface DocSummary {
  id: string;
  title: string;
  filename: string;
}

async function readDocsDirectory(): Promise<DocSummary[]> {
  if (!existsSync(docsDirectory)) {
    return [];
  }

  const entries = await fs.readdir(docsDirectory, { withFileTypes: true });
  const files: DocSummary[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!docsExtensionWhitelist.has(extension)) {
      continue;
    }

    const id = entry.name;
    files.push({
      id,
      title: toTitleCase(path.parse(entry.name).name),
      filename: entry.name
    });
  }

  files.sort((a, b) => a.title.localeCompare(b.title));
  return files;
}

function resolveDocPath(id: string) {
  const sanitized = id.replace(/\\/g, '/');
  if (sanitized.includes('..') || sanitized.includes('/')) {
    return null;
  }

  const filename = path.basename(sanitized);
  const extension = path.extname(filename).toLowerCase();
  if (!docsExtensionWhitelist.has(extension)) {
    return null;
  }

  const resolved = path.resolve(docsDirectory, filename);
  const relative = path.relative(docsDirectory, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  if (!existsSync(resolved)) {
    return null;
  }

  return resolved;
}

function toTitleCase(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}
