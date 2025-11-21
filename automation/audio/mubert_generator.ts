/*
  TypeScript audio generation utility for SL18.
  Features:
  - Mubert generation with retry & exponential backoff
  - Persona-aware mood/genre inference (simple heuristics)
  - Fallback to UDIO (placeholder) or static local asset
  - Structured JSON logging

  Usage:
    npx ts-node -r dotenv/config automation/audio/mubert_generator.ts
*/

import axios, { AxiosError } from 'axios';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

type GenerationOptions = {
  mood?: string;
  genre?: string;
  duration?: number; // seconds
  persona?: string;  // optional persona code/name for heuristic mapping
};

type LogEntry = {
  timestamp: string;
  provider: string;
  success?: boolean;
  trackUrl?: string;
  error?: string;
  originalError?: string;
  options?: GenerationOptions;
  ms?: number;
  reason?: string;
};

const MUBERT_COMPANY_ID = process.env.MUBERT_COMPANY_ID || '';
const MUBERT_LICENSE_TOKEN = process.env.MUBERT_LICENSE_TOKEN || '';
const UDIO_API_KEY = process.env.UDIO_API_KEY || '';

// Rate limiting (simple): enforce minimum interval & max in-flight
const MIN_INTERVAL_MS = 500; // spacing between outbound provider calls
const MAX_CONCURRENT = 2;
let lastRequestAt = 0;
let inFlight = 0;

async function scheduleOutbound<T>(fn: () => Promise<T>): Promise<T> {
  // Wait for concurrency slot
  while (inFlight >= MAX_CONCURRENT) {
    await sleep(50);
  }
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }
  inFlight += 1;
  lastRequestAt = Date.now();
  try {
    return await fn();
  } finally {
    inFlight -= 1;
  }
}

// Logging setup
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audio_generation.json');

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

function readLog(): LogEntry[] {
  ensureLogDir();
  if (!existsSync(LOG_FILE)) return [];
  try {
    const raw = readFileSync(LOG_FILE, 'utf8');
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
}

function appendLog(entry: Omit<LogEntry, 'timestamp'>) {
  const log = readLog();
  log.push({ timestamp: new Date().toISOString(), ...entry });
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// Simple heuristic mapping from persona => mood/genre suggestions
function inferPersonaDefaults(persona?: string): { mood?: string; genre?: string } {
  if (!persona) return {};
  const p = persona.toLowerCase();
  if (/(calm|relax|zen|mind)/.test(p)) return { mood: 'relaxing', genre: 'ambient' };
  if (/(tech|code|dev|ai)/.test(p)) return { mood: 'futuristic', genre: 'electronic' };
  if (/(fitness|sport|run|energy|power)/.test(p)) return { mood: 'energetic', genre: 'edm' };
  if (/(news|daily|brief)/.test(p)) return { mood: 'neutral', genre: 'corporate' };
  if (/(story|narrative|cinema|film)/.test(p)) return { mood: 'uplifting', genre: 'cinematic' };
  return {}; // fallback: let caller-specified or defaults stand
}

async function generateMubertTrack(opts: Required<Pick<GenerationOptions, 'mood' | 'genre' | 'duration'>>) : Promise<string> {
  if (!MUBERT_COMPANY_ID || !MUBERT_LICENSE_TOKEN) {
    throw new Error('Missing MUBERT_COMPANY_ID or MUBERT_LICENSE_TOKEN');
  }
  const url = 'https://api.mubert.com/v2/GenerateTrack'; // Confirm with official docs.
  const payload = {
    companyId: MUBERT_COMPANY_ID,
    licenseToken: MUBERT_LICENSE_TOKEN,
    mood: opts.mood,
    genre: opts.genre,
    duration: opts.duration
  };
  const res = await scheduleOutbound(() => axios.post(url, payload, { timeout: 15000 }));
  if (res.data?.trackUrl) return res.data.trackUrl as string;
  throw new Error(`Mubert response missing trackUrl: ${JSON.stringify(res.data)}`);
}

async function generateWithRetry(opts: Required<Pick<GenerationOptions, 'mood' | 'genre' | 'duration'>>, retries = 3, baseDelay = 750): Promise<string> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < retries) {
    try {
      return await generateMubertTrack(opts);
    } catch (err) {
      lastErr = err;
      // Axios error classification (optional richer logging)
      if (attempt < retries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
    attempt += 1;
  }
  throw lastErr instanceof Error ? lastErr : new Error('Unknown Mubert failure');
}

async function fallbackUdio(opts: GenerationOptions): Promise<string> {
  if (UDIO_API_KEY) {
    try {
      const url = 'https://api.udio.com/v1/generate'; // Placeholder endpoint.
      const payload = { mood: opts.mood, genre: opts.genre, duration: opts.duration };
      const res = await scheduleOutbound(() => axios.post(url, payload, {
        timeout: 15000,
        headers: { Authorization: `Bearer ${UDIO_API_KEY}` }
      }));
      if (res.data?.audioUrl) {
        appendLog({ provider: 'udio', success: true, trackUrl: res.data.audioUrl, options: opts });
        return res.data.audioUrl as string;
      }
      appendLog({ provider: 'udio', success: false, reason: 'Missing audioUrl', options: opts });
    } catch (err) {
      appendLog({ provider: 'udio', success: false, error: (err as Error).message, options: opts });
    }
  } else {
    appendLog({ provider: 'udio', success: false, reason: 'No UDIO_API_KEY provided', options: opts });
  }
  const mood = opts.mood || 'generic';
  return `assets/audio/default_${mood}.mp3`;
}

// Duration normalization (example bucket list; adjust if official list differs)
const ALLOWED_DURATIONS = [30, 45, 60, 75, 90, 120, 150, 180];
function normalizeDuration(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 60;
  // Find closest allowed bucket
  let closest = ALLOWED_DURATIONS[0];
  let diff = Math.abs(value - closest);
  for (const d of ALLOWED_DURATIONS) {
    const ndiff = Math.abs(value - d);
    if (ndiff < diff) { diff = ndiff; closest = d; }
  }
  return closest;
}

export async function generateAudioTrack(options: GenerationOptions): Promise<string> {
  const start = Date.now();
  const personaDerived = inferPersonaDefaults(options.persona);
  const mood = options.mood || personaDerived.mood || 'uplifting';
  const genre = options.genre || personaDerived.genre || 'cinematic';
  const originalDuration = options.duration || 90;
  const duration = normalizeDuration(originalDuration);
  const resolved: Required<Pick<GenerationOptions, 'mood' | 'genre' | 'duration'>> = { mood, genre, duration };
  try {
    const trackUrl = await generateWithRetry(resolved);
    const validated = await validateTrackUrl(trackUrl);
    appendLog({ provider: 'mubert', success: true, trackUrl, options: { ...options, ...resolved }, ms: Date.now() - start });
    if (!validated) {
      appendLog({ provider: 'validation', success: false, error: 'HEAD failed', options: { ...options, ...resolved } });
      const fallbackUrl = await fallbackUdio({ ...options, ...resolved });
      appendLog({ provider: 'fallback', trackUrl: fallbackUrl, originalError: 'Validation failed', options: { ...options, ...resolved } });
      return fallbackUrl;
    }
    return trackUrl;
  } catch (err) {
    const message = (err as Error)?.message || 'Generation failed';
    appendLog({ provider: 'mubert', success: false, error: message, options: { ...options, ...resolved }, ms: Date.now() - start });
    const fallbackUrl = await fallbackUdio({ ...options, ...resolved });
    appendLog({ provider: 'fallback', trackUrl: fallbackUrl, originalError: message, options: { ...options, ...resolved } });
    return fallbackUrl;
  }
}

async function validateTrackUrl(url: string): Promise<boolean> {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const res = await axios.head(url, { timeout: 8000 });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

// CLI execution path
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const url = await generateAudioTrack({ persona: process.env.TEST_PERSONA || 'tech_brief', duration: Number(process.env.TEST_DURATION || 60) });
      console.log('Generated (or fallback) track URL:', url);
    } catch (err) {
      console.error('Audio generation failed:', (err as Error).message);
      process.exitCode = 1;
    }
  })();
}
