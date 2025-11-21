# Data Architecture Options — Reducing Reliance on CSV

## Current Situation
- `personas/personas.csv` and `Docs/episodes.csv` serve as flat-file snapshots.
- Airtable base (`SL18 Calendar`) is becoming the operational source of truth.
- Pain points: manual header alignment, risk of drift, no enforced constraints, harder validation & querying for analytics.

## Goals
1. Single canonical store for operational data (episodes, personas, franchises).
2. Low-code editing for a non-programmer operator.
3. Reliable automation triggers (script/TTS/music/publish) without schema drift.
4. Scalable analytics & historical auditing without manual CSV merges.
5. Clear backup & disaster recovery strategy.

## Option A: Airtable Canonical + Snapshot Backups (Minimal Change)
**Overview**: Keep Airtable as the authoritative database. Remove day-to-day dependence on CSV; generate snapshots only for backup/version history.
**Pros**: No new infra; UI-friendly; existing automations continue; simple.
**Cons**: Limited relational depth & advanced querying; analytics scaling may need exports.
**Implementation**:
- Retain `exportEpisodesToGitHub.js` but mark snapshots as weekly (not per change).
- Delete persona CSV edits unless adding a new persona; prefer Airtable updates then regenerate snapshot.
- Add a script to validate Airtable schema vs expected field list and raise warnings.

## Option B: Introduce Managed PostgreSQL (Azure Database for PostgreSQL / Supabase)
**Overview**: PostgreSQL becomes canonical store; Airtable switches to a thin UI or is fed from Postgres via sync.
**Pros**: Strong constraints, scalable analytics, joins, time-series queries; broad ecosystem.
**Cons**: More setup (DB provisioning, migrations); requires light scripting for sync; potential learning curve.
**Implementation Sketch**:
- Provision managed Postgres (Azure or Supabase). Create tables: `personas`, `episodes`, `franchises` matching Airtable fields.
- Write a sync script (Node/PowerShell) that pulls Airtable JSON and upserts into Postgres.
- Gradually shift automations to read Postgres via an API (optional lightweight service) rather than Airtable directly.
- Keep Airtable for editing by syncing Postgres → Airtable daily if UI still needed.

## Option C: SQLite + Airtable (Hybrid Local)
**Overview**: Use a local SQLite file for structured constraints + analytics; Airtable remains the editing UI; periodic export/import keeps them aligned.
**Pros**: Zero server management, simple backups, portable.
**Cons**: Single-user concurrency limitations; manual sync logic; not ideal for multi-franchise scale or remote analytics.
**Implementation**:
- Script: fetch Airtable → write to SQLite tables; analytics queries run locally.
- Back up the `.db` file to Drive/Git (avoid secrets).

## Option D: Supabase (Postgres + Built-in Auth/UI)
**Overview**: Supabase for storage + automatic REST/GraphQL API; optionally build simple dashboards; Airtable phased out.
**Pros**: Managed Postgres with auto APIs; easier incremental adoption; row-level security for franchises.
**Cons**: Still a DB concept; some configuration; learning curve for policies.
**Implementation**:
- Mirror Airtable schema as Supabase tables; write initial import script.
- Generate views for franchise-specific data; integrate Make.com with Supabase REST endpoints.

## Recommended Path (Phased)
Phase 1 (Now): Adopt Option A. Treat Airtable as canonical, use CSV only as weekly backup.
Phase 2 (After stable publishing): Pilot Option D (Supabase) for episodes metrics & revenue views while Airtable still drives persona/franchise editing.
Phase 3 (Multi-franchise scaling): Migrate all operational tables to Supabase/Postgres; Airtable only for light partner dashboards or retired entirely.

## Immediate Action Items
1. Mark `personas/personas.csv` as generated: add a header note and stop manual edits except via Airtable.
2. Add a validation script checklist (manual for now) comparing Airtable fields with `Docs/airtable_setup.md`.
3. Adjust Workstream 1 notes to clarify CSV is backup, not primary.
4. Schedule weekly snapshot export: Airtable → CSV commit → tag release `backup-YYYY-MM-DD`.

## Sample Table Definitions (PostgreSQL)
```sql
CREATE TABLE personas (
  persona_code TEXT PRIMARY KEY,
  franchise_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  language TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  style_notes TEXT,
  sign_off TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE episodes (
  episode_id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  persona_code TEXT REFERENCES personas(persona_code),
  franchise_id TEXT NOT NULL,
  theme TEXT,
  hook TEXT,
  melody_reference TEXT,
  script_file TEXT,
  tts_file TEXT,
  music_file TEXT,
  video_file TEXT,
  caption_file TEXT,
  publish_url TEXT,
  youtube_video_id TEXT,
  meta_ig_media_id TEXT,
  meta_fb_post_id TEXT,
  tiktok_video_id TEXT,
  yt_views INT DEFAULT 0,
  meta_plays INT DEFAULT 0,
  tiktok_views INT DEFAULT 0,
  last_metrics_sync TIMESTAMPTZ,
  status TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Simple Sync Concept (Pseudo)
```
for each Airtable table:
  fetch all records via REST
  transform fields to DB schema
  upsert into Postgres (ON CONFLICT DO UPDATE)
log counts & errors into /SL18/06_logs/sync_history.csv
```

## Backup & Recovery
- Weekly export of Airtable tables to CSV (episodes, personas, franchises) committed under `/Docs/backups/YYYY-MM-DD/`.
- Database: enable automated daily snapshots (Supabase or Azure Postgres retention policy).
- Incident rollback: restore last snapshot, re-run sync script, validate row counts.

## Decision Triggers for Migration
- >5 franchises live.
- Analytics queries require multi-dimensional rollups (persona × franchise × theme × time) slow or clumsy in Airtable.
- Need for row-level access control for external partners.

## Next Steps Checklist
- [ ] Confirm Option A adoption (Airtable canonical; CSV weekly backup only).
- [ ] Create backup schedule (calendar event + manual export SOP).
- [ ] Draft initial Supabase account (optional exploration).
- [ ] List metrics/queries you’ll need in Phase 2 to validate DB benefit.

---
Document owner: Update quarterly or when scaling past 3 franchises.