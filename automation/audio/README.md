# Audio Generation Utilities (SL18)

This folder contains helpers for programmatic music bed generation for episodes.

## Files
- `mubert_generator.js`: JavaScript implementation (stable) for generating a Mubert track with retry, logging, and fallback.
- `mubert_generator.ts`: TypeScript implementation with stronger typing and persona-aware mood defaults.
- `../logs/audio_generation.json`: Append-only JSON log capturing each generation attempt.
- `udio_smoke.js`: Minimal UDIO smoke test that attempts a generate call when `UDIO_API_KEY` is present and logs into `logs/audio_generation.json`.

## Environment Variables (.env)
Required for Mubert:
```
MUBERT_COMPANY_ID=your_company_id
MUBERT_LICENSE_TOKEN=your_license_token
```
Optional / legacy:
```
MUBERT_API_KEY= (only if older auth flow required)
```
Fallback (UDIO – placeholder until implemented):
```
UDIO_API_KEY=your_udio_key (optional)
```

## Usage (JS)
Install dependencies at repo root if not already:
```
npm install axios dotenv
```
Run a test generation:
```
node -r dotenv/config automation/audio/mubert_generator.js
```

Compare providers (run both when enabled):
```
# Mubert (requires MUBERT_* vars)
node -r dotenv/config automation/audio/mubert_generator.js

# UDIO (requires UDIO_API_KEY)
node -r dotenv/config automation/audio/udio_smoke.js
```
The CI pipeline will parse `logs/audio_generation.json` and report separate OK/ERR lines for Mubert and UDIO so you can compare reliability at a glance.

Run UDIO minimal smoke (when enabled):
```
node -r dotenv/config automation/audio/udio_smoke.js
```

## Usage (TS)
```
npm install axios dotenv typescript ts-node @types/node --save-dev
npx ts-node -r dotenv/config automation/audio/mubert_generator.ts
```

## Persona-Based Defaults (TS Version)
The TypeScript variant can derive `mood` and `genre` from a persona code or name. Provide `persona` in options; it will map to a mood & genre using simple keyword heuristics.

## Logging
Each attempt appends an object to `logs/audio_generation.json`:
```jsonc
{
  "timestamp": "2025-11-18T12:34:56.000Z",
  "provider": "mubert",     // or 'fallback', 'udio'
  "success": true,           // only on primary provider entries
  "trackUrl": "https://...",// present if success
  "options": {"mood":"uplifting","genre":"cinematic","duration":90},
  "ms": 1423                 // duration in ms
}
```
Failure entries capture `error` and then a fallback entry logs the chosen fallback track.

### Additional Log Entry Types
- `validation`: URL HEAD preflight failure before accepting the Mubert track.
- `fallback`: Selected fallback result (UDIO or static asset) with `originalError`.
- `udio`: Attempted UDIO generation (success/failure) if `UDIO_API_KEY` provided.

## Optional Enhancements Implemented
- Rate limiting (simple global queue) to avoid API bursts (`MAX_CONCURRENT=2`, `MIN_INTERVAL_MS=500`).
- Duration normalization to nearest bucket from `[30,45,60,75,90,120,150,180]`.
- HEAD validation of returned `trackUrl` (fallback used if validation fails).
- UDIO provider attempt (placeholder endpoint) before static asset fallback.

## Configuration Tips
- If official Mubert duration buckets differ, update `ALLOWED_DURATIONS` in `.ts` and the list in `.js`.
- For higher throughput, replace the simple limiter with a token bucket or external queue (e.g. Redis + BullMQ).
- Consider adding per-provider circuit breaker if repeated failures occur.

## Example TS Invocation With Persona
```
npx ts-node -r dotenv/config automation/audio/mubert_generator.ts --TEST_PERSONA=tech_brief --TEST_DURATION=85
```
Internally 85 will normalize to the closest allowed bucket (e.g. 90).

## Validation Behavior
If the HEAD request on the generated URL fails, a fallback track is produced and logged. Downstream consumers should always check the provider field before trusting the audio.

## Next Steps (Future)
- Replace UDIO placeholder with correct endpoint & response schema.
- Add hash/signature verification of audio content.
- Integrate caching for repeated (mood, genre, duration) combos.

## Extending
1. Replace the UDIO placeholder in both files with actual API integration once endpoint details are finalized.
2. Consider adding rate limiting if generating > 20 tracks/min.
3. Add a queue processor (e.g. BullMQ / simple FIFO) if multiple parallel requests are expected.

## Safety Notes
- Never commit real license tokens.
- Use exponential backoff (already implemented) to avoid hammering the API.
- Validate returned URLs before downstream ingestion.

## Next Potential Enhancements
- Signed URL validation & HEAD request preflight.
- Automatic duration adjustment to nearest Mubert-supported bucket.
- Cache recent persona + mood combos for faster reuse.
