# Workstream 1 — Core Infrastructure Setup

## Objective
Establish the baseline environment so automation runs have the correct schemas, folders, personas, and credentials before enabling downstream pipelines.

## Prerequisites
- Local clone at `C:\Dev\SL 18` with the latest `main` changes pulled.
- Access to Airtable base `SL18 Calendar`, Google Drive `/SL18` hierarchy, ElevenLabs project, Make.com, CapCut Teams, and publishing API credentials.
- Azure DevOps project/repo already created (per README quick start).

## Step-by-Step Checklist

### 1. Repository & Environment
- [ ] Copy `.env.example` to `.env` and populate every value (use placeholders `TBD` only where access is pending).
- [ ] Store secrets in Azure DevOps variable group `SL18-Secrets` to match `.env` keys.
- [ ] Run `scripts/setup.ps1 -DryRun` in PowerShell to confirm folder scaffolding.
- [ ] Record secret rotation dates in `/SL18/06_logs/token_rotations.csv`.

### 2. Airtable Schema Validation
- [ ] Open `Docs/airtable_setup.md` and ensure the Airtable base mirrors the listed fields (Personas, Episodes, Franchises).
- [ ] Confirm `orderedFields` from `automation/airtable/exportEpisodesToGitHub.js` match the Episodes table exactly.
- [ ] Add onboarding checklist fields to `Franchises` (e.g., `assets_ready`, `make_configured`, `pilot_episode_done`).
- [ ] Create views: `Episodes ▸ Needs Review`, `Episodes ▸ Render Ready`, `Franchises ▸ Active`.

### 3. Drive / OneDrive Hierarchy
- [ ] Provision `/SL18/01_assets` through `/SL18/07_calendar` folders plus `/SL18/06_logs/review_workspace` subfolders (YYYY-MM template).
- [ ] Align Drive folder IDs with `.env` (`GOOGLE_DRIVE_*`) and `Docs/franchises.csv` overrides.
- [ ] Share folders with automation service accounts and key human reviewers.

### 4. Persona & Prompt Alignment
- [ ] Review `personas/personas.csv` for completeness (language, voice_id, sign_off).
- [ ] Sync Airtable `Personas` table records with CSV content; add missing personas.
- [ ] Update `prompts/script_template_en.txt` tone notes if new personas require additional guardrails.
- [ ] Document persona-specific creative briefs in `/SL18/06_logs/review_workspace/<date>/persona_briefs.md`.

### 5. Credential & Integration Smoke Checks
- [ ] Test Airtable API connectivity via curl or Postman using `AIRTABLE_API_KEY`.
- [ ] Confirm Google Drive service account can read/write to `/SL18/02_prompts`.
- [ ] Generate a short ElevenLabs sample (manual) to validate `voice_id` availability.
- [ ] Verify CapCut template access for `CAPCUT_TEAM_ID` and update `franchise_config_template.yaml` if IDs changed.
- [ ] Store publishing API test responses (200 OK) in `/SL18/06_logs/api_responses/` for reference.

### 6. Human Review Workspace Seeding
- [ ] Create collaboration channel `#sl18-review` (Teams/Slack) and pin links to Airtable, Drive, and README sections.
- [ ] Add template creative brief & AI query prompt to the shared workspace notebook.
- [ ] Schedule the daily 10-minute QC huddle invite.

## Definition of Done
- `.env` and Azure DevOps secrets fully populated.
- Airtable base matches documented schema with onboarding fields present.
- Google Drive folders created, IDs mapped, and access granted.
- Persona data consistent across CSV, Airtable, and prompts.
- Manual credential smoke checks completed with logs saved.
- Human review workspace configured with templates and calendar invite.

## Handoff Notes
Once Workstream 1 is complete, proceed to Workstream 2 (Automated Asset Pipeline). Confirm the `Definition of Done` items in the human review workspace checklist before promoting to beta.
