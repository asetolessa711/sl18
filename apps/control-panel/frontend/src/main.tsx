import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import type {
  AirtableRecord,
  CredentialPreview,
  DashboardResponse,
  DocContentResponse,
  DocsListResponse,
  UploadQueueResponse,
  UploadStatsResponse,
  UploadActivityEntry,
  UploadActivityResponse,
  CredentialStatusResponse,
  CredentialAlert
} from './types';
import { marked } from 'marked';
// Local data interfaces (frontend only)
interface Franchise {
  id: string;
  name: string;
  status: string;
  lastEpisode: string;
  revenue: number;
}
import './styles.css';

// Admin token helpers (session-scoped)
function getAdminToken(): string | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage.getItem('sl18.adminToken') : null;
  } catch {
    return null;
  }
}
function setAdminToken(token: string | null) {
  try {
    if (typeof window === 'undefined') return;
    if (token && token.trim()) {
      window.sessionStorage.setItem('sl18.adminToken', token.trim());
    } else {
      window.sessionStorage.removeItem('sl18.adminToken');
    }
  } catch {
    // ignore storage failures
  }
}

function useSelectedFranchiseId(): string | null {
  const location = useLocation();
  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(location.search).get('franchise');
      if (fromUrl) {
        setValue(fromUrl);
        return;
      }
      const fromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('sl18.selectedFranchise') : null;
      setValue(fromStorage);
    } catch {
      setValue(null);
    }
  }, [location.search]);

  return value;
}

const statusLabels: Record<string, string> = {
  render_ready: 'Render Ready',
  uploading: 'Uploading',
  published: 'Published'
};

const credentialOrder = ['youtube', 'meta'];

function getFieldValue(record: AirtableRecord, keys: string[]) {
  if (!record?.fields) {
    return undefined;
  }
  for (const key of keys) {
    if (key in record.fields) {
      const value = record.fields[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return undefined;
}

function getStringField(record: AirtableRecord, keys: string[]) {
  const value = getFieldValue(record, keys);
  return typeof value === 'string' ? value : '';
}

function getAttachmentList(record: AirtableRecord, keys: string[]) {
  const value = getFieldValue(record, keys);
  return Array.isArray(value) ? value : [];
}

function statusClassName(status: string) {
  const safeValue = status ? status : 'unknown';
  const safe = safeValue.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `status-badge status-${safe}`;
}

function formatStatus(status: string) {
  return statusLabels[status] ?? status ?? 'Unknown';
}

function formatTimestamp(value: unknown, fallback?: string) {
  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }
  }
  if (fallback) {
    const parsedFallback = new Date(fallback);
    if (!Number.isNaN(parsedFallback.getTime())) {
      return parsedFallback.toLocaleString();
    }
  }
  return '—';
}

function humanizeMissing(item: string) {
  if (item.startsWith('env:')) {
    return `Missing ${item.slice(4)}`;
  }
  if (item.startsWith('file:')) {
    return `Missing file ${item.slice(5)}`;
  }
  return item;
}

function describeActivityValue(value: unknown) {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value || '""';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Failed to stringify activity field', error);
    }
  }
  if (value === undefined) {
    return 'undefined';
  }
  return String(value);
}

type CredentialStatusContextValue = {
  status: CredentialStatusResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const CredentialStatusContext = React.createContext<CredentialStatusContextValue | undefined>(undefined);

interface CredentialStatusProviderProps { children: React.ReactNode }
const CredentialStatusProvider: React.FC<CredentialStatusProviderProps> = ({ children }) => {
  const [status, setStatus] = React.useState<CredentialStatusResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/credentials/status');
      if (!res.ok) {
        throw new Error('Failed to load credential status');
      }
      const body: CredentialStatusResponse = await res.json();
      setStatus(body);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load credential status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = React.useMemo(() => ({
    status,
    loading,
    error,
    refresh
  }), [status, loading, error, refresh]);

  return (
    <CredentialStatusContext.Provider value={value}>
      {children}
    </CredentialStatusContext.Provider>
  );
};

function useCredentialStatus() {
  const context = React.useContext(CredentialStatusContext);
  if (!context) {
    throw new Error('useCredentialStatus must be used within a CredentialStatusProvider');
  }
  return context;
}

const CredentialAlertBanner = () => {
  const { status, loading, error, refresh } = useCredentialStatus();

  const alerts = status?.alerts ?? [];
  if (!alerts.length && !error) {
    return null;
  }

  return (
    <div className="credential-alert-banner">
      <div className="banner-header">
        <strong>Publishing Credentials</strong>
        <button onClick={() => void refresh()} disabled={loading} className="button-secondary">
          {loading ? 'Checking…' : 'Recheck'}
        </button>
      </div>
      {error ? (
        <div className="error">{error}</div>
      ) : (
        <ul className="credential-alert-list">
          {alerts.map((alert: CredentialAlert) => (
            <li key={alert.id}>
              <span className="credential-alert-label">{alert.label}</span>
              <span className="credential-alert-missing">
                {alert.missing.map(humanizeMissing).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      )}
      <footer className="credential-alert-footer">
        Last checked: {status?.generatedAt ? new Date(status.generatedAt).toLocaleString() : '—'}
      </footer>
    </div>
  );
};

const Placeholder = ({ label }: { label: string }) => (
  <div className="panel">
    <h2>{label}</h2>
    <p>Coming soon.</p>
  </div>
);

const Validate = () => {
  const [service, setService] = React.useState('');
  const [logs, setLogs] = React.useState('');
  const runCheck = async () => {
    setLogs('Running...');
    const res = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service ? { service } : {})
    });
    const text = await res.text();
    setLogs(text);
  };
  return (
    <div className="panel">
      <h2>Validate</h2>
      <div className="controls">
        <label>
          Service (optional):
          <input
            value={service}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setService(e.target.value)}
            placeholder="Airtable"
          />
        </label>
        <button onClick={runCheck}>Run Diagnostics</button>
      </div>
      <pre className="log-output">{logs}</pre>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedFranchiseId = useSelectedFranchiseId();
  const franchises = React.useMemo<Franchise[]>(() => ([
    { id: 'global-remix', name: 'Global Remix', status: 'Assets Ready', lastEpisode: 'Nov 17', revenue: 1240 },
    { id: 'urban-pulse', name: 'Urban Pulse', status: 'Needs Cover Art', lastEpisode: 'Nov 16', revenue: 980 },
    { id: 'tech-sparks', name: 'Tech Sparks', status: 'In Production', lastEpisode: 'Nov 18', revenue: 620 }
  ]), []);
  const [franchiseId, setFranchiseId] = React.useState<string>(() => {
    try {
      const ids = new Set(franchises.map((f: Franchise) => f.id));
      const fromUrl = new URLSearchParams(window.location.search).get('franchise');
      if (fromUrl && ids.has(fromUrl)) return fromUrl;
      const fromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('sl18.selectedFranchise') : null;
      if (fromStorage && ids.has(fromStorage)) return fromStorage;
    } catch {
      // noop
    }
    return franchises[0].id;
  });
  const currentFranchise = React.useMemo(() => franchises.find((f: Franchise) => f.id === franchiseId)!, [franchiseId, franchises]);

  const applyFranchiseSelection = React.useCallback((nextId: string) => {
    setFranchiseId(nextId);
    try {
      window.localStorage.setItem('sl18.selectedFranchise', nextId);
    } catch {
      // ignore storage failures
    }
    const params = new URLSearchParams(location.search);
    if (params.get('franchise') !== nextId) {
      params.set('franchise', nextId);
      navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  // Keep URL/query in sync if state changes elsewhere (e.g., first load from storage)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qs = params.get('franchise');
    if (franchiseId && qs !== franchiseId) {
      params.set('franchise', franchiseId);
      navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
    }
    try {
      window.localStorage.setItem('sl18.selectedFranchise', franchiseId);
    } catch {
      // ignore
    }
  }, [franchiseId, location.pathname, location.search, navigate]);

  const go = React.useCallback((path: string) => {
    const fid = franchiseId || selectedFranchiseId;
    if (fid) {
      navigate({ pathname: path, search: `?franchise=${encodeURIComponent(fid)}` });
    } else {
      navigate(path);
    }
  }, [navigate, franchiseId, selectedFranchiseId]);
  return (
    <div className="dashboard">
      <section className="welcome-banner">
        <h1>Welcome to SL18</h1>
        <p>Choose a module or start with a quick action.</p>
      </section>

      <section className="quick-actions">
        <button onClick={() => go('/episodes')}>Create New Episode</button>
        <button onClick={() => go('/upload')}>View Upload Queue</button>
        <button onClick={() => go('/validate')}>Run Validator</button>
      </section>

      <section className="franchise-spotlight">
        <div className="franchise-toolbar">
          <h2>🎬 {currentFranchise.name}</h2>
          <select
            aria-label="Select franchise"
            className="franchise-select"
            value={franchiseId}
            onChange={(e) => applyFranchiseSelection(e.target.value)}
          >
            {franchises.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <p>
          Status: {currentFranchise.status} | Last Episode: {currentFranchise.lastEpisode} | Revenue: {'$'}{currentFranchise.revenue.toLocaleString()}
        </p>
      </section>

      <section className="status-cards">
        <div
          className="card clickable"
          role="button"
          tabIndex={0}
          onClick={() => go('/episodes')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') go('/episodes');
          }}
        >
          <h3>Episodes Today</h3>
          <p>
            Published: 12<br />
            Pending: 4<br />
            Failed: 1
          </p>
        </div>
        <div
          className="card clickable"
          role="button"
          tabIndex={0}
          onClick={() => go('/validate')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') go('/validate');
          }}
        >
          <h3>Credential Health</h3>
          <p>
            YouTube ✅<br />
            Meta ✅<br />
            CapCut ❌
          </p>
        </div>
      </section>

      <section className="activity-feed">
        <h3>Recent Activity</h3>
        <ul>
          <li>[10:42] Episode uploaded by Operator</li>
          <li>[10:39] Validator flagged missing thumbnail</li>
          <li>[10:35] Franchise "Global Remix" moved to Live</li>
        </ul>
      </section>
    </div>
  );
};

// Simple Settings page (Admin Token only)
const SettingsView: React.FC = () => {
  const [token, setTokenState] = React.useState<string>(() => getAdminToken() || '');
  const [saved, setSaved] = React.useState<string>('');
  const [required, setRequired] = React.useState<boolean | null>(null);
  const [valid, setValid] = React.useState<boolean | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkStatus = React.useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const admin = getAdminToken();
      const headers: Record<string, string> = {};
      if (admin) headers['x-admin-token'] = admin;
      const res = await fetch('/api/admin/token-status', { headers });
      if (!res.ok) throw new Error(await res.text());
      const body: { required: boolean; valid: boolean } = await res.json();
      setRequired(Boolean(body?.required));
      setValid(Boolean(body?.valid));
    } catch (e: any) {
      setError(e?.message || 'Failed to check token status');
      setRequired(null);
      setValid(null);
    } finally {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => { void checkStatus(); }, [checkStatus]);
  const apply = React.useCallback(() => {
    setAdminToken(token.trim() || null);
    setSaved('Saved. This is session-only and used for protected actions.');
    setTimeout(() => setSaved(''), 3000);
    void checkStatus();
  }, [token, checkStatus]);
  const clear = React.useCallback(() => {
    setAdminToken(null);
    setTokenState('');
    setSaved('Cleared.');
    setTimeout(() => setSaved(''), 2000);
    void checkStatus();
  }, []);
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-form">
        <label>Admin Token (optional)</label>
        <input
          type="password"
          value={token}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenState(e.target.value)}
          placeholder="Enter token if backend requires it"
        />
        <div className="controls">
          <button onClick={apply}>Save</button>
          <button className="button-secondary" onClick={clear}>Clear</button>
          <button className="button-secondary" onClick={() => void checkStatus()} disabled={checking}>{checking ? 'Checking…' : 'Recheck'}</button>
        </div>
        <p className="hint">
          Stored in session only. Used for actions like "Persist Fallback" when the backend sets PANEL_ADMIN_TOKEN.
        </p>
        <div className="settings-status">
          {error ? <div className="error">{error}</div> : null}
          {required === null && valid === null && !error ? <div className="hint">Status unknown.</div> : null}
          {required !== null && valid !== null && !error ? (
            <div className={valid ? 'hint' : 'error'}>
              Guard: {required ? 'On' : 'Off'} • Token: {valid ? 'Valid' : 'Not provided or invalid'}
            </div>
          ) : null}
        </div>
        {saved ? <div className="hint" role="status">{saved}</div> : null}
      </div>
    </div>
  );
};

type UploadRowProps = {
  record: AirtableRecord;
  onUpdate: (recordId: string, fields: Record<string, unknown>) => Promise<void>;
  isUpdating: boolean;
};

const UploadRow: React.FC<UploadRowProps> = ({ record, onUpdate, isUpdating }) => {
  const persona = getStringField(record, ['persona_code', 'Persona Code']);
  const theme = getStringField(record, ['theme', 'Theme']);
  const hook = getStringField(record, ['hook', 'Hook']);
  const franchise = getStringField(record, ['franchise_id', 'Franchise']);
  const status = getStringField(record, ['status', 'Status']);
  const lastModified = getFieldValue(record, ['Last modified', 'Last Modified', 'Last Modified time']);

  const originals = React.useMemo(() => ({
    publishUrl: getStringField(record, ['publish_url', 'Publish URL']),
    youtubeId: getStringField(record, ['youtube_video_id', 'YouTube Video ID']),
    metaIg: getStringField(record, ['meta_ig_media_id', 'Meta IG Media ID']),
    metaFb: getStringField(record, ['meta_fb_post_id', 'Meta FB Post ID']),
    tiktokId: getStringField(record, ['tiktok_video_id', 'TikTok Video ID']),
    notes: getStringField(record, ['notes', 'Notes'])
  }), [record]);

  const [publishUrl, setPublishUrl] = React.useState(originals.publishUrl);
  const [youtubeId, setYoutubeId] = React.useState(originals.youtubeId);
  const [metaIg, setMetaIg] = React.useState(originals.metaIg);
  const [metaFb, setMetaFb] = React.useState(originals.metaFb);
  const [tiktokId, setTiktokId] = React.useState(originals.tiktokId);
  const [notes, setNotes] = React.useState(originals.notes);

  React.useEffect(() => {
    setPublishUrl(originals.publishUrl);
    setYoutubeId(originals.youtubeId);
    setMetaIg(originals.metaIg);
    setMetaFb(originals.metaFb);
    setTiktokId(originals.tiktokId);
    setNotes(originals.notes);
  }, [originals]);

  const videoAttachments = getAttachmentList(record, ['video_file', 'Video File']);
  const captionAttachments = getAttachmentList(record, ['caption_file', 'Caption File']);

  const [showHistory, setShowHistory] = React.useState(false);
  const [activity, setActivity] = React.useState<UploadActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = React.useState(false);
  const [activityError, setActivityError] = React.useState<string | null>(null);

  const loadActivity = React.useCallback(async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const res = await fetch(`/api/upload/activity?recordId=${encodeURIComponent(record.id)}`);
      if (!res.ok) {
        throw new Error('Failed to load activity');
      }

      const body: UploadActivityResponse = await res.json();
      setActivity(body.entries ?? []);
    } catch (err: any) {
      setActivityError(err.message ?? 'Failed to load activity');
    } finally {
      setActivityLoading(false);
    }
  }, [record.id]);

  const toggleHistory = React.useCallback(() => {
    const next = !showHistory;
    setShowHistory(next);
    if (!showHistory && activity.length === 0) {
      void loadActivity();
    }
  }, [showHistory, activity.length, loadActivity]);

  const normalize = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  const handleSave = async () => {
    const updates: Record<string, unknown> = {};
    if (publishUrl !== originals.publishUrl) {
      updates.publish_url = normalize(publishUrl);
    }
    if (youtubeId !== originals.youtubeId) {
      updates.youtube_video_id = normalize(youtubeId);
    }
    if (metaIg !== originals.metaIg) {
      updates.meta_ig_media_id = normalize(metaIg);
    }
    if (metaFb !== originals.metaFb) {
      updates.meta_fb_post_id = normalize(metaFb);
    }
    if (tiktokId !== originals.tiktokId) {
      updates.tiktok_video_id = normalize(tiktokId);
    }
    if (notes !== originals.notes) {
      updates.notes = normalize(notes);
    }

    if (!Object.keys(updates).length) {
      return;
    }

    await onUpdate(record.id, updates);
    if (showHistory) {
      await loadActivity();
    }
  };

  const updateStatus = async (nextStatus: string) => {
    if (!nextStatus || status === nextStatus) {
      return;
    }
    await onUpdate(record.id, { status: nextStatus });
    if (showHistory) {
      await loadActivity();
    }
  };

  return (
    <div className="upload-card">
      <header>
        <div>
          <h3>{theme || 'Untitled Episode'}</h3>
          <p className="subtext">
            {persona || 'Unknown persona'}
            {franchise ? ` • ${franchise}` : ''}
            {hook ? ` • Hook: ${hook}` : ''}
          </p>
          <p className="hint">Updated {formatTimestamp(lastModified, record.createdTime)}</p>
        </div>
        <span className={statusClassName(status)}>{formatStatus(status)}</span>
      </header>
      <div className="upload-field">
        <label>Publish URL</label>
        <input
          value={publishUrl}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPublishUrl(event.target.value)}
          placeholder="https://youtube.com/shorts/..."
        />
      </div>
      <div className="upload-field">
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)}
          placeholder="Quick handoff notes"
        />
      </div>
      <div className="upload-field">
        <label>Platform IDs</label>
        <div className="platform-inputs">
          <input
            value={youtubeId}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setYoutubeId(event.target.value)}
            placeholder="YouTube video ID"
          />
          <input
            value={metaIg}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMetaIg(event.target.value)}
            placeholder="Meta IG media ID"
          />
          <input
            value={metaFb}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMetaFb(event.target.value)}
            placeholder="Meta FB post ID"
          />
          <input
            value={tiktokId}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTiktokId(event.target.value)}
            placeholder="TikTok video ID"
          />
        </div>
      </div>
      <div className="upload-field">
        <label>Assets</label>
        <div className="upload-attachments">
          {videoAttachments.map((attachment: any) => (
            <a key={attachment.id ?? attachment.url} href={attachment.url} target="_blank" rel="noreferrer">
              🎬 {attachment.filename ?? 'Video asset'}
            </a>
          ))}
          {captionAttachments.map((attachment: any) => (
            <a key={attachment.id ?? attachment.url} href={attachment.url} target="_blank" rel="noreferrer">
              📝 {attachment.filename ?? 'Caption file'}
            </a>
          ))}
          {!videoAttachments.length && !captionAttachments.length && <span className="hint">No attachments on record</span>}
        </div>
      </div>
      <div className="upload-actions">
        <button onClick={handleSave} disabled={isUpdating}>Save Links</button>
        <button
          className="button-secondary"
          onClick={() => updateStatus('render_ready')}
          disabled={isUpdating || status === 'render_ready'}
        >
          Reset Queue
        </button>
        <button
          className="button-secondary"
          onClick={() => updateStatus('uploading')}
          disabled={isUpdating || status === 'uploading'}
        >
          Mark Uploading
        </button>
        <button
          className="button-secondary"
          onClick={() => updateStatus('published')}
          disabled={isUpdating || status === 'published'}
        >
          Mark Published
        </button>
        <button
          className="button-secondary"
          onClick={toggleHistory}
          disabled={activityLoading}
        >
          {showHistory ? 'Hide Activity' : 'Show Activity'}
        </button>
      </div>
      {showHistory && (
        <div className="upload-activity">
          {activityLoading && <div className="hint">Loading activity…</div>}
          {activityError && <div className="activity-error">{activityError}</div>}
          {!activityLoading && !activityError && (
            <ul className="activity-list">
              {activity.length ? (
                activity.map((entry, index) => (
                  <li key={`${entry.loggedAt}-${index}`} className="activity-entry">
                    <div className="activity-meta">
                      <span>{formatTimestamp(entry.timestamp, entry.loggedAt)}</span>
                      {entry.actor ? <span>• {entry.actor}</span> : null}
                    </div>
                    <div className="activity-fields">
                      {Object.keys(entry.fields ?? {}).length ? (
                        Object.entries(entry.fields ?? {}).map(([fieldKey, value]) => (
                          <div key={fieldKey} className="activity-field">
                            <span className="activity-field-key">{fieldKey}</span>
                            <span className="activity-field-value">{describeActivityValue(value)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="hint">No field changes recorded.</span>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="activity-entry activity-entry-empty">No activity logged yet.</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const Upload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [queue, setQueue] = React.useState<UploadQueueResponse | null>(null);
  const [stats, setStats] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [block, setBlock] = React.useState<null | { targets: { provider: string; reason: string[] }[]; error?: string }>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = React.useState<null | { recordId: string; fields: Record<string, unknown> }>(null);
  const [franchiseDraft, setFranchiseDraft] = React.useState('');
  const [franchiseFilter, setFranchiseFilter] = React.useState('');

  // Initialize from URL franchise param and react to changes
  React.useEffect(() => {
    const urlFranchise = new URLSearchParams(location.search).get('franchise') || '';
    if (urlFranchise && urlFranchise !== franchiseFilter) {
      setFranchiseFilter(urlFranchise);
    }
    if (urlFranchise && urlFranchise !== franchiseDraft) {
      setFranchiseDraft(urlFranchise);
    }
    if (!urlFranchise && (franchiseFilter || franchiseDraft)) {
      setFranchiseFilter('');
      setFranchiseDraft('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    // keep existing block visible until user dismisses
    try {
      const query = franchiseFilter ? `?franchise=${encodeURIComponent(franchiseFilter)}` : '';
      const [queueRes, statsRes] = await Promise.all([
        fetch(`/api/upload/queue${query}`),
        fetch(`/api/upload/stats${query}`)
      ]);

      if (!queueRes.ok) {
        throw new Error('Failed to load upload queue');
      }
      if (!statsRes.ok) {
        throw new Error('Failed to load upload stats');
      }

      const queueJson: UploadQueueResponse = await queueRes.json();
      const statsJson: UploadStatsResponse = await statsRes.json();
      setQueue(queueJson);
      setStats(statsJson.counts ?? {});
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [franchiseFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const applyFranchiseFilter = React.useCallback(() => {
    const normalized = franchiseDraft.trim();
    if (normalized !== franchiseDraft) {
      setFranchiseDraft(normalized);
    }
    if (normalized === franchiseFilter) {
      return;
    }
    setFranchiseFilter(normalized);
    const params = new URLSearchParams(location.search);
    if (normalized) params.set('franchise', normalized); else params.delete('franchise');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  }, [franchiseDraft, franchiseFilter, location.pathname, location.search, navigate]);

  const clearFranchiseFilter = React.useCallback(() => {
    if (!franchiseFilter && !franchiseDraft) {
      return;
    }
    setFranchiseDraft('');
    setFranchiseFilter('');
    const params = new URLSearchParams(location.search);
    params.delete('franchise');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  }, [franchiseDraft, franchiseFilter, location.pathname, location.search, navigate]);

  const handleUpdate = React.useCallback(async (recordId: string, fields: Record<string, unknown>) => {
    setUpdatingId(recordId);
    setError(null);
    setLastAttempt({ recordId, fields });
    try {
      const res = await fetch('/api/upload/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, fields })
      });

      if (!res.ok) {
        if (res.status === 409) {
          // Publish blocked by server guard — show details and actions
          let body: any = {};
          try { body = await res.json(); } catch {}
          setBlock({ targets: Array.isArray(body?.targets) ? body.targets : [], error: typeof body?.error === 'string' ? body.error : 'Publish blocked due to missing credentials' });
          return;
        }
        const text = await res.text();
        throw new Error(text || 'Failed to update record');
      }

      await load();
      setNotice(null);
      setBlock(null);
    } catch (err: any) {
      setError(err.message ?? 'Failed to update record');
    } finally {
      setUpdatingId(null);
    }
  }, [load]);

  const providerLabel = React.useCallback((id: string) => {
    if (id === 'youtube') return 'YouTube';
    if (id === 'meta') return 'Meta Reels';
    if (id === 'capcut') return 'CapCut';
    return id;
  }, []);

  const applyFallback = React.useCallback(async (provider: string) => {
    try {
      const res = await fetch('/api/alerts/fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: `credential:${provider}`, actor: 'Operator' })
      });
      if (!res.ok) throw new Error(await res.text() || 'Fallback request failed');
      // Refresh credential preview strip then retry last update if present
      await load();
      if (lastAttempt) {
        setNotice(`Fallback applied for ${providerLabel(provider)}. Retrying last update…`);
        void handleUpdate(lastAttempt.recordId, lastAttempt.fields);
      } else {
        setNotice(`Fallback applied for ${providerLabel(provider)}.`);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to apply fallback');
    }
  }, [load, lastAttempt, handleUpdate, providerLabel]);

  const persistFallback = React.useCallback(async (provider: string) => {
    try {
      const admin = getAdminToken();
      const res = await fetch('/api/alerts/persist-fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(admin ? { 'x-admin-token': admin } : {}) },
        body: JSON.stringify({ id: `credential:${provider}`, actor: 'Operator' })
      });
      if (!res.ok) throw new Error(await res.text() || 'Persist request failed');
      const body = await res.json();
      setNotice(`Persisted ${providerLabel(provider)} to ${body?.file || '.env.local'}.`);
    } catch (e: any) {
      setError(e?.message || 'Failed to persist fallback');
    }
  }, [providerLabel]);
  const credentialEntries = React.useMemo<CredentialPreview[]>(() => {
    if (!queue?.credentials) {
      return [];
    }

    const ordered = credentialOrder
      .map(key => queue.credentials[key])
      .filter((item): item is CredentialPreview => Boolean(item));

    const extras = Object.entries(queue.credentials)
      .filter(([key]) => !credentialOrder.includes(key))
      .map(([, value]) => value);

    return [...ordered, ...extras];
  }, [queue?.credentials]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Upload Queue</h2>
        <button onClick={() => void load()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {notice ? (
        <div className="hint" role="status">
          {notice} <button className="button-secondary" onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      ) : null}
      {block ? (
        <div className="error">
          <div><strong>{block.error || 'Publish blocked'}</strong></div>
          {block.targets?.length ? (
            <ul>
              {block.targets.map(t => (
                <li key={t.provider}>
                  <strong>{providerLabel(t.provider)}:</strong> {(t.reason || []).map(humanizeMissing).join(' · ')}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="controls">
            <button onClick={() => navigate('/alerts')}>Open Alert Center</button>
            {block.targets?.map(t => (
              <button
                key={`fallback-${t.provider}`}
                className="button-secondary"
                onClick={() => { void applyFallback(t.provider); }}
                title={`Apply backup creds for ${providerLabel(t.provider)}`}
              >
                Use Fallback: {providerLabel(t.provider)}
              </button>
            ))}
            {block.targets?.map(t => (
              <button
                key={`persist-${t.provider}`}
                className="button-secondary"
                onClick={() => { void persistFallback(t.provider); }}
                title={`Persist current ${providerLabel(t.provider)} values to .env.local`}
              >
                Persist Fallback: {providerLabel(t.provider)}
              </button>
            ))}
            <button className="button-secondary" onClick={() => setBlock(null)}>Dismiss</button>
          </div>
        </div>
      ) : null}
      <div className="filter-row">
        <label htmlFor="franchise-filter">Franchise</label>
        <input
          id="franchise-filter"
          value={franchiseDraft}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFranchiseDraft(event.target.value)}
          placeholder="franchise_id"
        />
        <button onClick={applyFranchiseFilter} disabled={loading}>
          Apply
        </button>
        <button
          className="button-secondary"
          onClick={clearFranchiseFilter}
          disabled={loading || (!franchiseFilter && !franchiseDraft)}
        >
          Clear
        </button>
      </div>
      <div className="upload-meta">
        <span>Payload version: {queue?.payloadVersion ?? '—'}</span>
        <span>Last fetched: {queue?.fetchedAt ? new Date(queue.fetchedAt).toLocaleString() : '—'}</span>
        <span>Franchise filter: {franchiseFilter || 'All'}</span>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="upload-stats">
        {Object.entries(statusLabels).map(([statusKey, label]) => (
          <div key={statusKey} className="upload-stat">
            <span>{label}</span>
            <span className="value">{stats[statusKey] ?? 0}</span>
          </div>
        ))}
      </div>
      <div className="credential-strip">
        {credentialEntries.length ? (
          <>
            {credentialEntries.map(cred => (
              <span
                key={cred.id}
                className={`credential-card${cred.ready ? '' : ' missing'}`}
              >
                <strong>{cred.label}</strong>
                {cred.ready ? 'Ready' : cred.missing.map(humanizeMissing).join(' · ')}
              </span>
            ))}
            <span className="credential-card manual">
              <strong>TikTok</strong>
              Manual posting (no automated publishing)
            </span>
          </>
        ) : (
          <>
            <span className="credential-card manual">
              <strong>TikTok</strong>
              Manual posting (no automated publishing)
            </span>
            <span className="hint">Credential preview unavailable</span>
          </>
        )}
      </div>
      <div className="upload-grid">
        {queue?.records?.length ? (
          queue.records.map(record => (
            <UploadRow
              key={record.id}
              record={record}
              onUpdate={handleUpdate}
              isUpdating={updatingId === record.id}
            />
          ))
        ) : (
          <div className="empty-state">No episodes awaiting upload.</div>
        )}
      </div>
    </div>
  );
};

const DocsView = () => {
  const [docs, setDocs] = React.useState<DocsListResponse | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [htmlContent, setHtmlContent] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDocs = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/docs');
      if (!res.ok) {
        throw new Error('Failed to load docs list');
      }
      const body: DocsListResponse = await res.json();
      setDocs(body);
      if (!selectedId && body.files?.length) {
        setSelectedId(body.files[0]?.id ?? null);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load docs');
    }
  }, [selectedId]);

  React.useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  const loadDocContent = React.useCallback(async (id: string | null) => {
    if (!id) {
      setHtmlContent('');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/docs/content?file=${encodeURIComponent(id)}`);
      if (!res.ok) {
        throw new Error('Failed to load document');
      }
      const body: DocContentResponse = await res.json();
      const html = marked.parse(body.content ?? '');
      setHtmlContent(html);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load document');
      setHtmlContent('');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDocContent(selectedId);
  }, [selectedId, loadDocContent]);

  const selectDoc = (id: string) => {
    setSelectedId(id);
  };

  return (
    <div className="panel docs-panel">
      <div className="panel-header docs-header">
        <h2>Docs</h2>
        <button onClick={() => void loadDocs()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="docs-layout">
        <nav className="docs-nav">
          <ul>
            {(docs?.files ?? []).map(doc => (
              <li key={doc.id}>
                <button
                  className={doc.id === selectedId ? 'doc-link active' : 'doc-link'}
                  onClick={() => selectDoc(doc.id)}
                >
                  {doc.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="docs-content">
          {selectedId ? (
            <div className="doc-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : (
            <div className="empty-state">Select a document to view.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const Episodes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedFranchiseId = useSelectedFranchiseId();
  const [franchiseDraft, setFranchiseDraft] = React.useState('');
  const [franchiseFilter, setFranchiseFilter] = React.useState('');

  // Initialize from URL or fallback to selected franchise
  React.useEffect(() => {
    const urlFranchise = new URLSearchParams(location.search).get('franchise');
    const initial = urlFranchise ?? selectedFranchiseId ?? '';
    setFranchiseDraft(initial || '');
    setFranchiseFilter(initial || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, selectedFranchiseId]);

  const applyFranchiseFilter = React.useCallback(() => {
    const normalized = franchiseDraft.trim();
    if (normalized !== franchiseFilter) {
      setFranchiseFilter(normalized);
    }
    const params = new URLSearchParams(location.search);
    if (normalized) params.set('franchise', normalized); else params.delete('franchise');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  }, [franchiseDraft, franchiseFilter, location.pathname, location.search, navigate]);

  const clearFranchiseFilter = React.useCallback(() => {
    if (!franchiseFilter && !franchiseDraft) return;
    setFranchiseDraft('');
    setFranchiseFilter('');
    const params = new URLSearchParams(location.search);
    params.delete('franchise');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  }, [franchiseDraft, franchiseFilter, location.pathname, location.search, navigate]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Episodes</h2>
      </div>
      <div className="filter-row">
        <label htmlFor="episodes-franchise">Franchise</label>
        <input
          id="episodes-franchise"
          value={franchiseDraft}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFranchiseDraft(e.target.value)}
          placeholder="franchise_id"
        />
        <button onClick={applyFranchiseFilter}>Apply</button>
        <button className="button-secondary" onClick={clearFranchiseFilter} disabled={!franchiseFilter && !franchiseDraft}>Clear</button>
      </div>
      <div className="upload-meta">
        <span>Franchise filter: {franchiseFilter || 'All'}</span>
      </div>
      <div className="empty-state">Episodes workspace coming soon.</div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const selectedFranchiseId = useSelectedFranchiseId();
  const toWithFranchise = React.useCallback((path: string) => (
    selectedFranchiseId ? { pathname: path, search: `?franchise=${encodeURIComponent(selectedFranchiseId)}` } : path
  ), [selectedFranchiseId]);

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <nav className="nav-group" aria-label="Core Ops">
        <h2 className="nav-group-title">Core Ops</h2>
        <ul>
          <li><NavLink to={toWithFranchise('/dashboard')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Home</NavLink></li>
          <li><NavLink to={toWithFranchise('/franchises')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Franchises</NavLink></li>
          <li><NavLink to={toWithFranchise('/personas')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Personas</NavLink></li>
          <li><NavLink to={toWithFranchise('/episodes')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Episodes</NavLink></li>
          <li><NavLink to={toWithFranchise('/upload')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Upload Queue</NavLink></li>
          <li><NavLink to={toWithFranchise('/publish')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Publishing Panel</NavLink></li>
        </ul>
      </nav>
      <nav className="nav-group" aria-label="Monitoring">
        <h2 className="nav-group-title">Monitoring</h2>
        <ul>
          <li><NavLink to={toWithFranchise('/analytics')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Analytics</NavLink></li>
          <li><NavLink to={toWithFranchise('/activity')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Activity Feed</NavLink></li>
        </ul>
      </nav>
      <nav className="nav-group" aria-label="Reference">
        <h2 className="nav-group-title">Reference</h2>
        <ul>
          <li><NavLink to={toWithFranchise('/assets')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Assets</NavLink></li>
          <li><NavLink to={toWithFranchise('/docs')} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Docs &amp; Runbooks</NavLink></li>
          <li><NavLink to={'/settings'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Settings</NavLink></li>
        </ul>
      </nav>
    </aside>
  );
};

type HeaderProps = {
  onToggleAlerts: () => void;
  alertsCount: number;
  lastChecked?: string;
  onRefreshAlerts: () => Promise<void>;
  refreshing: boolean;
};

const Header: React.FC<HeaderProps> = ({ onToggleAlerts, alertsCount, lastChecked, onRefreshAlerts, refreshing }) => {
  const formattedLastChecked = lastChecked ? new Date(lastChecked).toLocaleString() : '—';
  const [searchTerm, setSearchTerm] = React.useState('');
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const selectedFranchiseId = useSelectedFranchiseId();

  // Admin guard badge state
  const [guardRequired, setGuardRequired] = React.useState<boolean | null>(null);
  const [guardValid, setGuardValid] = React.useState<boolean | null>(null);
  const [guardLoading, setGuardLoading] = React.useState(false);

  const refreshGuardStatus = React.useCallback(async () => {
    setGuardLoading(true);
    try {
      const admin = getAdminToken();
      const headers: Record<string, string> = {};
      if (admin) headers['x-admin-token'] = admin;
      const res = await fetch('/api/admin/token-status', { headers });
      if (res.ok) {
        const body: { required: boolean; valid: boolean } = await res.json();
        setGuardRequired(Boolean(body?.required));
        setGuardValid(Boolean(body?.valid));
      } else {
        setGuardRequired(null);
        setGuardValid(null);
      }
    } catch {
      setGuardRequired(null);
      setGuardValid(null);
    } finally {
      setGuardLoading(false);
    }
  }, []);

  React.useEffect(() => { void refreshGuardStatus(); }, [refreshGuardStatus]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      return;
    }
    navigate(`/episodes?search=${encodeURIComponent(trimmed)}`);
    setSearchTerm('');
  };

  const handleQuickAction = React.useCallback((path: string) => {
    const fid = selectedFranchiseId;
    if (fid) {
      navigate({ pathname: path, search: `?franchise=${encodeURIComponent(fid)}` });
    } else {
      navigate(path);
    }
  }, [navigate, selectedFranchiseId]);

  const closeProfileMenu = React.useCallback(() => setProfileOpen(false), []);

  React.useEffect(() => {
    if (!profileOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        closeProfileMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen, closeProfileMenu]);

  const homeHref = React.useMemo(() => (
    selectedFranchiseId ? `/dashboard?franchise=${encodeURIComponent(selectedFranchiseId)}` : '/dashboard'
  ), [selectedFranchiseId]);

  return (
    <header className={`app-header${alertsCount ? ' has-alerts' : ''}`}>
      <div className="app-header-left">
        <a href={homeHref} className="logo-circle" aria-label="SL18 Home">
          <span className="logo-text">SL18</span>
        </a>
        <form className="app-header-search" onSubmit={handleSearchSubmit}>
          <input
            className="search-input"
            value={searchTerm}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
            placeholder="Search episodes, personas, hooks, or assets"
            aria-label="Search the control panel"
          />
          <button type="submit" className="button-secondary search-submit">Search</button>
        </form>
      </div>
      <div className="app-header-right">
        <div className="app-header-quick-actions">
          <button type="button" className="quick-action" onClick={() => handleQuickAction('/episodes')}>
            New Episode
          </button>
          <button type="button" className="quick-action" onClick={() => handleQuickAction('/upload')}>
            Upload Assets
          </button>
          <button type="button" className="quick-action" onClick={() => handleQuickAction('/validate')}>
            Run Validator
          </button>
        </div>
        <div className="app-header-controls">
          {(() => {
            const stateClass = guardRequired ? (guardValid ? ' on ok' : ' on warn') : ' off';
            const label = guardRequired === null ? '—' : (guardRequired ? (guardValid ? 'On (ok)' : 'On (!token)') : 'Off');
            return (
              <button
                type="button"
                className={`nav-btn guard-badge${stateClass}`}
                title={guardLoading ? 'Checking…' : 'Open Settings'}
                onClick={() => navigate('/settings')}
              >
                Guard: {label}
              </button>
            );
          })()}
          <button type="button" className="nav-btn alert-btn" onClick={onToggleAlerts}>
            <span>Alerts</span>
            <span className={`alert-count${alertsCount ? '' : ' muted'}`}>{alertsCount}</span>
          </button>
          <button
            type="button"
            className="nav-btn"
            onClick={() => { void onRefreshAlerts(); void refreshGuardStatus(); }}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh alerts'}
          </button>
          <div className="app-header-profile" ref={profileMenuRef}>
            <button type="button" className="nav-btn profile-trigger" onClick={() => setProfileOpen(c => !c)}>
              <span className="profile-avatar">OP</span>
              <span>Operator</span>
            </button>
            {profileOpen ? (
              <div className="profile-menu">
                <button type="button" onClick={() => { navigate('/settings'); closeProfileMenu(); }}>Settings</button>
                <button type="button" onClick={() => { console.info('Open API credentials'); closeProfileMenu(); }}>API Credentials</button>
                <button
                  type="button"
                  onClick={() => {
                    const current = getAdminToken() || '';
                    const next = window.prompt('Set Admin Token (leave blank to clear)', current) ?? '';
                    setAdminToken(next.trim() || null);
                    closeProfileMenu();
                  }}
                >Admin Token</button>
                <button type="button" onClick={() => { console.info('Sign out'); closeProfileMenu(); }}>Sign out</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="app-footer">
    <span>© {new Date().getFullYear()} Studio Lab 18</span>
    <span>Need help? Check Docs or ping #sl18-ops.</span>
  </footer>
);

type AlertDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type AlertEntry = {
  id: string;
  title: string;
  details: string;
  severity?: 'critical' | 'warning' | 'info';
  quickActions?: string[];
  meta?: string;
};

type AlertSection = {
  key: string;
  icon: string;
  title: string;
  description: string;
  items: AlertEntry[];
  emptyLabel: string;
};

const AlertDrawer: React.FC<AlertDrawerProps> = ({ open, onClose }) => {
  const { status, loading, error, refresh } = useCredentialStatus();
  const credentialAlerts = status?.alerts ?? [];
  const [escalatedOnly, setEscalatedOnly] = React.useState(false);
  const [unresolvedOnly, setUnresolvedOnly] = React.useState(false);
  const [alertsApi, setAlertsApi] = React.useState<{ alerts: UiAlert[]; fetchedAt?: string } | null>(null);

  const fetchAlertsApi = React.useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('Failed to load alerts');
      const body = await res.json();
      setAlertsApi({ alerts: body.alerts ?? [], fetchedAt: body.fetchedAt });
    } catch (e) {
      // keep drawer functional even if alerts API fails
      setAlertsApi(prev => prev ?? { alerts: [] });
    }
  }, []);

  React.useEffect(() => {
    if (open) { void fetchAlertsApi(); }
  }, [open, fetchAlertsApi]);

  const sections: AlertSection[] = React.useMemo(() => {
    if (escalatedOnly) {
      const list = (alertsApi?.alerts ?? []).filter(a => a.state === 'escalated');
      return [
        {
          key: 'escalated-only',
          icon: '🚨',
          title: 'Escalated Alerts',
          description: 'Items unresolved for more than 24 hours or force-escalated.',
          items: list.map(a => ({
            id: a.id,
            title: a.title,
            details: a.details,
            severity: 'critical',
            meta: a.escalatedAt ? `Escalated ${new Date(a.escalatedAt).toLocaleString()}` : undefined
          })),
          emptyLabel: 'No escalated alerts.'
        }
      ];
    }
    if (unresolvedOnly) {
      const list = (alertsApi?.alerts ?? []).filter(a => a.state === 'detected' || a.state === 'escalated');
      return [
        {
          key: 'unresolved-only',
          icon: '⚠️',
          title: 'Unresolved Alerts',
          description: 'Open issues that need attention (detected or escalated).',
          items: list.map(a => ({
            id: a.id,
            title: a.title,
            details: a.details,
            severity: a.severity,
            meta: a.escalatedAt
              ? `Escalated ${new Date(a.escalatedAt).toLocaleString()}`
              : `Detected ${new Date(a.detectedAt).toLocaleString()}`
          })),
          emptyLabel: 'No unresolved alerts.'
        }
      ];
    }
    return [
    {
      key: 'validation-failures',
      icon: '🧩',
      title: 'Validation Failures',
      description: 'Episodes that failed automation validation checks (audio, metadata, attachments).',
      items: [],
      emptyLabel: 'No validation failures detected.'
    },
    {
      key: 'missing-assets',
      icon: '📦',
      title: 'Missing Assets',
      description: 'Episodes awaiting required media or metadata before publishing.',
      items: [],
      emptyLabel: 'All required assets are accounted for.'
    },
    {
      key: 'credential-issues',
      icon: '🛡️',
      title: 'Credential / API Issues',
      description: 'Tokens and API credentials that failed the latest credential sweep.',
      items: credentialAlerts.map(alert => ({
        id: alert.id,
        title: alert.label,
        details: alert.missing.map(humanizeMissing).join(' · '),
        severity: 'critical',
        quickActions: ['Re-authenticate', 'View setup guide'],
        meta: status?.generatedAt ? `Checked ${new Date(status.generatedAt).toLocaleString()}` : undefined
      })),
      emptyLabel: 'All publishing credentials look healthy.'
    },
    {
      key: 'publishing-failures',
      icon: '📊',
      title: 'Publishing Failures',
      description: 'Episodes stuck during platform publishing or missing returned URLs.',
      items: [],
      emptyLabel: 'No publishing failures recorded.'
    },
    {
      key: 'airtable-sync',
      icon: '🧼',
      title: 'Airtable Sync Errors',
      description: 'Issues syncing data between Airtable and automation payloads.',
      items: [],
      emptyLabel: 'Airtable sync is clear.'
    },
    {
      key: 'workflow-stalls',
      icon: '🧭',
      title: 'Workflow Stalls',
      description: 'Episodes stalled in render_ready or uploading beyond the healthy threshold.',
      items: [],
      emptyLabel: 'No stalled workflows detected.'
    }
    ];
  }, [escalatedOnly, alertsApi?.alerts, credentialAlerts, status?.generatedAt]);

  return (
    <>
      <div className={`alert-backdrop${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`alert-drawer${open ? ' open' : ''}`}>
        <header className="alert-drawer-header">
          <div>
            <h2>SL18 Alert Center</h2>
            <p>Review automation warnings and plan the next fix. Quick actions coming soon.</p>
          </div>
          <button className="button-secondary" onClick={onClose}>Close</button>
        </header>
        <div className="alert-drawer-toolbar">
          <button onClick={() => { void refresh(); void fetchAlertsApi(); }} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh now'}
          </button>
          <label className="toggle-inline">
            <input type="checkbox" checked={escalatedOnly} onChange={(e) => setEscalatedOnly(e.target.checked)} /> Escalated only
          </label>
          <label className="toggle-inline">
            <input type="checkbox" checked={unresolvedOnly} onChange={(e) => setUnresolvedOnly(e.target.checked)} /> Unresolved only
          </label>
          {error && <span className="alert-drawer-error">{error}</span>}
        </div>
        <div className="alert-drawer-content">
          {sections.map(section => (
            <section key={section.key} className="alert-section">
              <header className="alert-section-header">
                <span className="alert-section-icon" aria-hidden="true">{section.icon}</span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
              </header>
              {section.items.length ? (
                <div className="alert-items">
                  {section.items.map(item => (
                    <article key={item.id} className={`alert-item${item.severity ? ` ${item.severity}` : ''}`}>
                      <div className="alert-item-head">
                        <strong>{item.title}</strong>
                        {item.meta ? <span>{item.meta}</span> : null}
                      </div>
                      <p>{item.details}</p>
                      {item.quickActions?.length ? (
                        <div className="alert-item-actions">
                          {item.quickActions.map(action => (
                            <button key={action} className="button-secondary" disabled title="Coming soon">
                              {action}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="alert-empty">{section.emptyLabel}</div>
              )}
            </section>
          ))}
        </div>
      </aside>
    </>
  );
};

// Alerts Center (MVP)
type UiAlert = {
  id: string;
  title: string;
  details: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'detected' | 'acknowledged' | 'resolved' | 'escalated';
  detectedAt: string;
  updatedAt: string;
  escalatedAt?: string;
  notes?: { timestamp: string; actor?: string; text: string }[];
  meta?: { fallbackReady?: boolean; fallbackCandidates?: string[] };
};

const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = React.useState<UiAlert[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'unresolved' | 'acknowledged' | 'resolved' | 'escalated'>('all');

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('Failed to load alerts');
      const body = await res.json();
      setAlerts(body.alerts ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const doPost = async (url: string, payload: unknown) => {
    const admin = getAdminToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (admin) headers['x-admin-token'] = admin;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text() || 'Request failed');
    await load();
  };

  const ack = async (id: string) => { await doPost('/api/alerts/ack', { id, actor: 'Operator' }); };
  const resolve = async (id: string) => { await doPost('/api/alerts/resolve', { id, actor: 'Operator' }); };
  const note = async (id: string) => {
    const text = window.prompt('Add operator note');
    if (text && text.trim()) { await doPost('/api/alerts/note', { id, actor: 'Operator', text }); }
  };
  const useFallback = async (id: string) => { await doPost('/api/alerts/fallback', { id, actor: 'Operator' }); };
  const persistFallback = async (id: string) => { await doPost('/api/alerts/persist-fallback', { id, actor: 'Operator' }); };

  const visible = React.useMemo(() => {
    if (filter === 'all') return alerts;
    if (filter === 'unresolved') return alerts.filter(a => a.state === 'detected' || a.state === 'escalated');
    return alerts.filter(a => a.state === filter);
  }, [alerts, filter]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Alert Center</h2>
        <div className="controls">
          <button onClick={() => void load()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
          <select aria-label="Filter alerts" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="unresolved">Unresolved</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {!error && !visible.length && <div className="empty-state">No alerts in this view.</div>}
      <div className="alert-center-list">
        {visible.map(a => (
          <article key={a.id} className={`alert-item ${a.severity}`}>
            <header className="alert-item-head">
              <strong>{a.title}</strong>
              <span className="subtext">Detected {new Date(a.detectedAt).toLocaleString()} • State: {a.state}</span>
            </header>
            <p>{a.details}</p>
            {a.notes?.length ? (
              <div className="alert-notes">
                {a.notes.map((n, i) => (
                  <div key={`${n.timestamp}-${i}`} className="alert-note">
                    <span className="subtext">{new Date(n.timestamp).toLocaleString()} {n.actor ? `• ${n.actor}` : ''}</span>
                    <div>{n.text}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="alert-actions">
              <button className="button-secondary" onClick={() => void ack(a.id)} disabled={a.state === 'acknowledged' || a.state === 'resolved'}>Acknowledge</button>
              <button className="button-secondary" onClick={() => void note(a.id)}>Add Note</button>
              {a.meta?.fallbackReady ? (
                <button className="button-secondary" onClick={() => void useFallback(a.id)} title={`Use backup for ${a.meta?.fallbackCandidates?.join(', ') || ''}`}>Use Fallback</button>
              ) : null}
              <button className="button-secondary" onClick={() => void persistFallback(a.id)} title="Persist current values to .env.local">Persist Fallback</button>
              <button onClick={() => void resolve(a.id)} disabled={a.state === 'resolved'}>Resolve</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const AppLayout = () => {
  const { status, loading, refresh } = useCredentialStatus();
  const [alertsOpen, setAlertsOpen] = React.useState(false);
  const [alertsCount, setAlertsCount] = React.useState(0);
  const [alertsCheckedAt, setAlertsCheckedAt] = React.useState<string | undefined>(undefined);
  const [alertsLoading, setAlertsLoading] = React.useState(false);

  const refreshAlertsCount = React.useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('Failed to load alerts');
      const body = await res.json();
      const counts = body.counts ?? {};
      setAlertsCount(Number(counts.unresolved ?? 0));
      setAlertsCheckedAt(typeof body.fetchedAt === 'string' ? body.fetchedAt : undefined);
    } catch {
      // fallback to credential unresolved count if API fails
      setAlertsCount(status?.alerts?.length ?? 0);
      setAlertsCheckedAt(status?.generatedAt);
    } finally {
      setAlertsLoading(false);
    }
  }, [status?.alerts?.length, status?.generatedAt]);

  React.useEffect(() => { void refreshAlertsCount(); }, [refreshAlertsCount]);

  const openAlerts = React.useCallback(() => setAlertsOpen(true), []);
  const closeAlerts = React.useCallback(() => setAlertsOpen(false), []);

  const onRefreshAll = React.useCallback(async () => {
    await Promise.allSettled([refresh(), refreshAlertsCount()]);
  }, [refresh, refreshAlertsCount]);

  return (
    <div className="app-shell">
      <Header
        onToggleAlerts={openAlerts}
        alertsCount={alertsCount}
        lastChecked={alertsCheckedAt ?? status?.generatedAt}
        onRefreshAlerts={onRefreshAll}
        refreshing={loading || alertsLoading}
      />
      <div className="layout">
        <Sidebar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/personas" element={<Placeholder label="Personas workspace" />} />
            <Route path="/episodes" element={<Episodes />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/validate" element={<Validate />} />
            <Route path="/publish" element={<Placeholder label="Publishing panel" />} />
            <Route path="/analytics" element={<Placeholder label="Analytics" />} />
            <Route path="/activity" element={<Placeholder label="Activity feed" />} />
            <Route path="/alerts" element={<AlertsView />} />
            <Route path="/assets" element={<Placeholder label="Assets library" />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/docs" element={<DocsView />} />
            <Route path="/franchises" element={<Placeholder label="Franchise hub" />} />
            <Route path="*" element={<Placeholder label="Select a module" />} />
          </Routes>
        </main>
      </div>
      <Footer />
      <AlertDrawer open={alertsOpen} onClose={closeAlerts} />
    </div>
  );
};

const App = () => (
  <CredentialStatusProvider>
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  </CredentialStatusProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
