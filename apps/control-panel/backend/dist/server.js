import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync, promises as fs } from 'fs';
import Airtable from 'airtable';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.join(repoRoot, '.env') });
const app = express();
app.use(cors());
app.use(express.json());
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
app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/dashboard', async (_req, res) => {
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
    }
    catch (error) {
        console.error('[dashboard] airtable fetch failed', error);
        res.status(500).json({ error: 'Failed to load Airtable data' });
    }
});
app.get('/api/upload/queue', async (req, res) => {
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
    }
    catch (error) {
        console.error('[upload] queue fetch failed', error);
        res.status(500).json({ error: 'Failed to load upload queue' });
    }
});
app.get('/api/upload/stats', async (req, res) => {
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
    }
    catch (error) {
        console.error('[upload] stats fetch failed', error);
        res.status(500).json({ error: 'Failed to load upload stats' });
    }
});
app.post('/api/validate', (req, res) => {
    const { service } = req.body ?? {};
    const scriptPath = path.resolve(repoRoot, 'scripts', 'diagnostics', 'validate-env.ps1');
    const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath];
    if (service) {
        args.push('-Service', service);
    }
    const ps = spawn('powershell', args, { cwd: repoRoot });
    res.setHeader('Content-Type', 'text/plain');
    ps.stdout.on('data', chunk => {
        res.write(chunk);
    });
    ps.stderr.on('data', chunk => {
        res.write(chunk);
    });
    ps.on('close', code => {
        res.end(`\n[INFO] validate-env.ps1 exited with code ${code}\n`);
    });
});
app.post('/api/upload/update', async (req, res) => {
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
    const sanitized = {};
    for (const [key, value] of Object.entries(fields)) {
        if (UPLOAD_ALLOWED_FIELDS.has(key)) {
            sanitized[key] = value;
        }
    }
    if (!Object.keys(sanitized).length) {
        res.status(400).json({ error: 'No valid fields provided' });
        return;
    }
    try {
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
    }
    catch (error) {
        console.error('[upload] update failed', error);
        res.status(500).json({ error: 'Failed to update record' });
    }
});
app.get('/api/upload/activity', async (req, res) => {
    try {
        const recordId = normalizeQueryString(req.query?.recordId);
        const entries = await readUploadActivity(recordId ?? undefined);
        res.json({ entries });
    }
    catch (error) {
        console.error('[upload] activity fetch failed', error);
        res.status(500).json({ error: 'Failed to load upload activity' });
    }
});
app.get('/api/credentials/status', (_req, res) => {
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
    }
    catch (error) {
        console.error('[credential] status fetch failed', error);
        res.status(500).json({ error: 'Failed to load credential status' });
    }
});
app.get('/api/docs', async (_req, res) => {
    try {
        const files = await readDocsDirectory();
        res.json({ files, fetchedAt: new Date().toISOString() });
    }
    catch (error) {
        console.error('[docs] list failed', error);
        res.status(500).json({ error: 'Failed to list docs' });
    }
});
app.get('/api/docs/content', async (req, res) => {
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
    }
    catch (error) {
        console.error('[docs] load failed', error);
        res.status(500).json({ error: 'Failed to load document' });
    }
});
app.listen(PORT, () => {
    console.log(`[control-panel] backend listening on http://localhost:${PORT}`);
});
async function fetchAirtableRecords(tableName, options = {}) {
    if (!airtableBase) {
        return [];
    }
    const { maxRecords, sortFields, filterByFormula, fields, view } = options;
    const sortCandidates = sortFields ?? [];
    const sortConfig = [];
    for (const candidate of sortCandidates) {
        if (!candidate)
            continue;
        const desc = candidate.startsWith('-');
        const fieldName = desc ? candidate.slice(1) : candidate;
        sortConfig.push({ field: fieldName, direction: desc ? 'desc' : 'asc' });
    }
    const selectOptions = {};
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
    let records;
    try {
        records = await airtableBase(tableName)
            .select(selectOptions)
            .all();
    }
    catch (err) {
        if (err?.error === 'UNKNOWN_FIELD_NAME') {
            const fallbackOptions = {};
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
        }
        else {
            throw err;
        }
    }
    return records.map(serializeRecord);
}
function serializeRecord(record) {
    return {
        id: record.id,
        fields: record.fields,
        createdTime: record._rawJson.createdTime
    };
}
function buildStatusFormula(statuses, franchise) {
    const conditions = [];
    const statusClauses = statuses
        .filter(Boolean)
        .map(status => `({status} = '${escapeFormulaValue(status)}')`);
    if (statusClauses.length === 1) {
        conditions.push(statusClauses[0]);
    }
    else if (statusClauses.length > 1) {
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
async function fetchUploadStatusCounts(statuses, franchise) {
    if (!statuses.length) {
        return {};
    }
    const counts = {};
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
            id: 'tiktok',
            label: 'TikTok',
            env: ['TIKTOK_SESSION_COOKIE'],
            files: []
        }
    ];
    const result = {};
    for (const check of checks) {
        const missing = [];
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
async function appendUploadActivity(entry) {
    try {
        await fs.mkdir(uploadLogDir, { recursive: true });
        const fields = {};
        for (const [key, value] of Object.entries(entry.fields ?? {})) {
            fields[key] = value;
        }
        const payload = {
            recordId: entry.recordId,
            timestamp: entry.timestamp,
            actor: entry.actor?.trim() ? entry.actor.trim() : undefined,
            fields,
            loggedAt: new Date().toISOString(),
            version: UPLOAD_PAYLOAD_VERSION
        };
        await fs.appendFile(uploadActivityLogPath, `${JSON.stringify(payload)}\n`, 'utf8');
    }
    catch (error) {
        console.warn('[upload] activity log append failed', error);
    }
}
async function readUploadActivity(recordId) {
    if (!existsSync(uploadActivityLogPath)) {
        return [];
    }
    try {
        const raw = await fs.readFile(uploadActivityLogPath, 'utf8');
        if (!raw.trim()) {
            return [];
        }
        const entries = [];
        for (const line of raw.split(/\r?\n/)) {
            if (!line.trim()) {
                continue;
            }
            try {
                const parsed = JSON.parse(line);
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
                const entryFields = {};
                if (parsed.fields && typeof parsed.fields === 'object') {
                    for (const [key, value] of Object.entries(parsed.fields)) {
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
            }
            catch (parseError) {
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
    }
    catch (error) {
        console.error('[upload] activity read failed', error);
        return [];
    }
}
function escapeFormulaValue(value) {
    return value.replace(/'/g, "''");
}
function normalizeQueryString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
}
async function readDocsDirectory() {
    if (!existsSync(docsDirectory)) {
        return [];
    }
    const entries = await fs.readdir(docsDirectory, { withFileTypes: true });
    const files = [];
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
function resolveDocPath(id) {
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
function toTitleCase(value) {
    return value
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, letter => letter.toUpperCase());
}
