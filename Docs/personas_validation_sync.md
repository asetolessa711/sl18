# Personas Validation & Sync Pipeline

## Purpose
Move from "upload and pray" to a controlled, test-before-upload workflow for persona data.

## Phases Implemented
- **Phase 1 (Schema Validation)**: Validate CSV against JSON schema; produce `valid.csv` and `errors.csv`.
- **Phase 2 (Dry-Run Preview)**: Fetch existing Airtable personas (if credentials set) and list planned create/update actions (`actions_preview.json`).
- **Phase 3 (Controlled Upload)**: Optional `--commit` flag batches create/update requests to Airtable; logs responses.

## Files
- Schema: `scripts/validation/personas.schema.json`
- Script: `scripts/validation/personas_sync.js`
- Source CSV: `personas/personas.csv`
- Output reports: `logs/sync/personas/` (`summary.json`, `errors.csv`, `valid.csv`, `actions_preview.json`, `commit_log.json`)

## Prerequisites
- Node.js 18+ installed.
- `.env` populated with `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_PERSONAS_TABLE` (defaults to `Personas`).

## Usage
```powershell
# 1. Validation only (no API usage required)
node scripts/validation/personas_sync.js --source personas/personas.csv

# 2. Dry-run (includes create/update preview vs Airtable)
node scripts/validation/personas_sync.js --source personas/personas.csv --dry-run

# 3. Commit changes (creates/updates in batches of 10)
node scripts/validation/personas_sync.js --source personas/personas.csv --commit
```

## Report Interpretation
- `errors.csv`: Rows with schema violations (fix these before commit).
- `valid.csv`: Clean rows eligible for sync.
- `actions_preview.json`: Lists `toCreate` and `toUpdate` (with field diffs) derived from comparing valid rows to Airtable.
- `summary.json`: Aggregate counts (total, valid, invalid, willCreate, willUpdate).
- `commit_log.json`: Airtable API responses per batch (present only after `--commit`).

## Field Diff Logic (Updates)
Any field whose value differs from the Airtable record is included in the diff. On commit, the entire record payload is sent (Airtable will store updated values and keep unspecified fields unchanged).

## Safety & Guardrails
- Running without flags performs pure validation (safe for missing creds).
- `--dry-run` never mutates Airtable.
- `--commit` requires valid API key and base ID; script aborts early if missing.
- Batching respects Airtable 10-record limit.
- All outputs timestamped in `summary.json` for audit; consider committing this folder for historical trace.

## Extending to Episodes / Franchises
1. Define new schema JSON (e.g., `episodes.schema.json`).
2. Duplicate `personas_sync.js` logic, adjust required fields and table name.
3. Enhance diff logic to ignore volatile fields (e.g., metrics) by filtering them out before comparison.

## Planned Enhancements (Roadmap)
- Two-way sync: pull Airtable, merge external changes intelligently.
- Selective field updates: update only changed fields to reduce payload size.
- Link validation: ensure `franchise_id` exists before create.
- Metrics: add CLI summary of percentage invalid and top error types.
- Config file: centralize table + schema mapping (e.g., `validation.config.json`).

## Troubleshooting
- Empty `actions_preview.json`: either all invalid or no differences found.
- High invalid count: inspect `errors.csv` for pattern (e.g., missing `franchise_id`).
- API 422 errors on commit: confirm field names match Airtable exactly.
- Rate limit errors (429): add delay between batches or retry logic (future enhancement).

## Next Steps
- Validate current personas with dry-run.
- Fix any `errors.csv` issues in Airtable or CSV.
- Re-run dry-run until only desired create/update operations appear.
- Execute `--commit` and review `commit_log.json`.
- Decide whether to replicate pipeline for Episodes.

Document owner: Review monthly; update when schema changes or additional tables added.