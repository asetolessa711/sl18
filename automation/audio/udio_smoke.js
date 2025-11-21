// Minimal UDIO smoke test
// Run via: node -r dotenv/config automation/audio/udio_smoke.js
// Requires: npm install axios dotenv

import axios from 'axios';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const UDIO_API_KEY = process.env.UDIO_API_KEY;
const TEST_MOOD = process.env.TEST_MOOD || 'uplifting';
const TEST_GENRE = process.env.TEST_GENRE || 'cinematic';
const TEST_DURATION = Number(process.env.TEST_DURATION || 45);

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

function normalizeDuration(value) {
  const allowed = [30,45,60,75,90,120,150,180];
  if (!Number.isFinite(value) || value <= 0) return 45;
  return allowed.reduce((best, d) => Math.abs(d - value) < Math.abs(best - value) ? d : best, allowed[0]);
}

async function main() {
  if (!UDIO_API_KEY) {
    appendLog({ provider: 'udio', success: false, reason: 'No UDIO_API_KEY provided (smoke skipped)' });
    console.log('UDIO smoke skipped: missing UDIO_API_KEY');
    return;
  }
  const payload = { mood: TEST_MOOD, genre: TEST_GENRE, duration: normalizeDuration(TEST_DURATION) };
  try {
    const start = Date.now();
    // Minimal placeholder endpoint; adjust when official UDIO API is finalized.
    const url = 'https://api.udio.com/v1/generate';
    const res = await axios.post(url, payload, { timeout: 15000, headers: { Authorization: `Bearer ${UDIO_API_KEY}` } });
    if (res.data && res.data.audioUrl) {
      appendLog({ provider: 'udio', success: true, trackUrl: res.data.audioUrl, options: payload, ms: Date.now() - start });
      console.log('UDIO smoke OK:', res.data.audioUrl);
    } else {
      appendLog({ provider: 'udio', success: false, reason: 'Missing audioUrl', options: payload, ms: Date.now() - start });
      console.log('UDIO smoke WARN: response missing audioUrl');
    }
  } catch (err) {
    appendLog({ provider: 'udio', success: false, error: (err && err.message) || 'unknown', options: payload, ms: (Date.now ? (Date.now() - (globalThis.__udioStart || Date.now())) : undefined) });
    console.log('UDIO smoke ERR:', err && err.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error('UDIO smoke failed:', e && e.message); process.exitCode = 1; });
}
