// Mubert track generation utility with retry, fallback, and logging.
// Run via: node -r dotenv/config automation/audio/mubert_generator.js
// Requires: npm install axios dotenv (run at repo root)

import axios from 'axios';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const MUBERT_API_KEY = process.env.MUBERT_API_KEY; // optional if using license token flow
const MUBERT_COMPANY_ID = process.env.MUBERT_COMPANY_ID;
const MUBERT_LICENSE_TOKEN = process.env.MUBERT_LICENSE_TOKEN;
const UDIO_API_KEY = process.env.UDIO_API_KEY; // fallback provider

// Simple rate limiting: enforce minimum interval and max concurrent outbound requests.
const MIN_INTERVAL_MS = 500;
const MAX_CONCURRENT = 2;
let lastRequestAt = 0;
let inFlight = 0;
async function scheduleOutbound(fn) {
  while (inFlight >= MAX_CONCURRENT) { await sleep(50); }
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) { await sleep(MIN_INTERVAL_MS - elapsed); }
  inFlight += 1;
  lastRequestAt = Date.now();
  try { return await fn(); } finally { inFlight -= 1; }
}

// Log file path
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audio_generation.json');

function loadLog() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
  if (!existsSync(LOG_FILE)) return [];
  try { return JSON.parse(readFileSync(LOG_FILE, 'utf8')) ?? []; } catch { return []; }
}

function appendLog(entry) {
  const log = loadLog();
  log.push({ timestamp: new Date().toISOString(), ...entry });
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generateMubertTrack({ mood = 'chill', genre = 'ambient', duration = 60 }) {
  if (!MUBERT_COMPANY_ID || !MUBERT_LICENSE_TOKEN) {
    throw new Error('Missing MUBERT_COMPANY_ID or MUBERT_LICENSE_TOKEN in environment');
  }
  // Endpoint name may differ; confirm against latest Mubert docs.
  const url = 'https://api.mubert.com/v2/GenerateTrack';
  const payload = { companyId: MUBERT_COMPANY_ID, licenseToken: MUBERT_LICENSE_TOKEN, mood, genre, duration };
  const res = await scheduleOutbound(() => axios.post(url, payload, { timeout: 15000 }));
  if (res.data?.trackUrl) return res.data.trackUrl;
  throw new Error(`Mubert response missing trackUrl: ${JSON.stringify(res.data)}`);
}

async function generateWithRetry(opts, { retries = 3, baseDelay = 750 } = {}) {
  let attempt = 0; let lastErr;
  while (attempt < retries) {
    try {
      return await generateMubertTrack(opts);
    } catch (err) {
      lastErr = err;
      const delay = baseDelay * Math.pow(2, attempt); // simple exponential backoff
      await sleep(delay);
      attempt += 1;
    }
  }
  throw lastErr || new Error('Unknown Mubert failure');
}

async function fallbackUdio({ mood, genre, duration }) {
  if (UDIO_API_KEY) {
    try {
      const payload = { mood, genre, duration };
      const res = await scheduleOutbound(() => axios.post('https://api.udio.com/v1/generate', payload, {
        timeout: 15000,
        headers: { Authorization: `Bearer ${UDIO_API_KEY}` }
      }));
      if (res.data?.audioUrl) {
        appendLog({ provider: 'udio', success: true, trackUrl: res.data.audioUrl, options: payload });
        return res.data.audioUrl;
      }
      appendLog({ provider: 'udio', success: false, reason: 'Missing audioUrl', options: payload });
    } catch (err) {
      appendLog({ provider: 'udio', success: false, error: err.message });
    }
  } else {
    appendLog({ provider: 'udio', success: false, reason: 'No UDIO_API_KEY provided' });
  }
  return `assets/audio/default_${mood || 'generic'}.mp3`;
}

function normalizeDuration(value) {
  const allowed = [30, 45, 60, 75, 90, 120, 150, 180];
  if (!Number.isFinite(value) || value <= 0) return 60;
  let closest = allowed[0];
  let diff = Math.abs(value - closest);
  for (const d of allowed) {
    const nd = Math.abs(value - d);
    if (nd < diff) { diff = nd; closest = d; }
  }
  return closest;
}

async function validateTrackUrl(url) {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const res = await axios.head(url, { timeout: 8000 });
    return res.status >= 200 && res.status < 400;
  } catch { return false; }
}

export async function generateAudioTrack(options) {
  const start = Date.now();
  const originalDuration = options.duration || 90;
  const duration = normalizeDuration(originalDuration);
  const resolved = { ...options, duration };
  try {
    const trackUrl = await generateWithRetry(resolved);
    const validated = await validateTrackUrl(trackUrl);
    appendLog({ provider: 'mubert', success: true, trackUrl, options: resolved, ms: Date.now() - start });
    if (!validated) {
      appendLog({ provider: 'validation', success: false, error: 'HEAD failed', options: resolved });
      const fallbackUrl = await fallbackUdio(resolved);
      appendLog({ provider: 'fallback', trackUrl: fallbackUrl, originalError: 'Validation failed', options: resolved });
      return fallbackUrl;
    }
    return trackUrl;
  } catch (err) {
    appendLog({ provider: 'mubert', success: false, error: err.message, options: resolved, ms: Date.now() - start });
    const fallbackUrl = await fallbackUdio(resolved);
    appendLog({ provider: 'fallback', trackUrl: fallbackUrl, originalError: err.message, options: resolved });
    return fallbackUrl;
  }
}

// CLI self-test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const mood = process.env.TEST_MOOD || 'uplifting';
    const genre = process.env.TEST_GENRE || 'cinematic';
    const duration = Number(process.env.TEST_DURATION || 90);
    try {
      const url = await generateAudioTrack({ mood, genre, duration });
      console.log('Generated track (or fallback):', url);
    } catch (err) {
      console.error('Generation failed:', err.message);
      process.exitCode = 1;
    }
  })();
}
