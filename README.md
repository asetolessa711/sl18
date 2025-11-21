# SL 18 — VSO Project Scaffold

This repository scaffold is designed for **Azure DevOps (VSO)** with **GPT‑5 + Codex Preview**. It supports a minimal‑code workflow where automation prepares the script, persona TTS, backing music stem, and CapCut-ready project assets before the clip is finished manually.

## Quick Start

1) **Create local folder** at `C:\Dev\SL 18`  
2) Extract this zip into that folder.  
3) Initialize Git & push to VSO:
```powershell
cd "C:\Dev\SL 18"
git init
git add .
git commit -m "SL18 scaffold init"
git branch -M main
# Create empty project/repo in Azure DevOps first, then:
git remote add origin https://dev.azure.com/<org>/<project>/_git/sl18-automation
git push -u origin main
```

4) Create a service connection in Azure DevOps for Google Drive / Airtable (if used).  
5) Import the **Make.com** blueprints from `automation/make/sl18_make_blueprint.json` (asset build), `automation/make/sl18_publish_blueprint.json` (fanout publish), and `automation/make/sl18_analytics_blueprint.json` (daily metrics sync).

Ops helpers
- See `Docs/ops_quick_commands.md` for a consolidated list of admin "try it" commands (env load, smoke tests, diagnostics, and CI queueing).
- Smoke test outputs use prefixes `OK •`, `WARN •`, `ERR •` for quick scanning and CI parsing; details in `scripts/smoke_tests/README.md`.

## Local Setup Script
- Central script: `scripts/setup/setup-sl18.ps1`
- Wrapper (optional): `apps/control-panel/backend/setup-sl18.ps1`

Run a safe DryRun:
```powershell
cd "C:\Dev\SL 18"
./scripts/setup/setup-sl18.ps1 -DryRun
# or from backend (delegates to central script)
cd "C:\Dev\SL 18\apps\control-panel\backend"
./setup-sl18.ps1 -DryRun
```
- What it does: ensures standard folders, reads `apps/control-panel/backend/.env` for `AZURE_DEVOPS_ORG` and `AZURE_DEVOPS_PROJECT`, and (when not using `-DryRun`) configures `az devops` defaults. It does not modify files beyond directory creation.
- Tip: If execution is blocked, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for the current session.

## Persona Integration Guide
- This scaffold does **not** auto-generate characters. Choose or design personas manually, then document them in both `personas/personas.csv` and the Airtable `Personas` table.
- Keep personas grounded in real audience insights: capture language, tone guardrails, cultural red lines, and a concise sign-off. Mirror that detail in `style_notes` and `sign_off` so prompts stay authentic.
- Map each persona to an actual voice asset (`voice_id`) and, if relevant, a franchise owner for accountability. Update the matching Drive folders and CapCut overlays before scheduling automation runs.
- When adding personas or editing tone, sync the changes across:
	- `prompts/` templates (ensure the sign-off and tone instructions reflect the new persona).
	- `automation/n8n/persona_mapper.js` and Make.com variable maps so downstream nodes receive the new fields.
	- `Docs/franchise_playbook.md` if franchise partners will operate the persona.
- Test each new persona with a manual script + render cycle prior to enabling the scheduled scenarios to confirm voice, music, and captions align with expectations.

## Human Review Workspace
- Even with automation-first workflows, reserve space for human QC. Maintain a shared collaboration hub (e.g., Teams channel or Slack room) linked to the `/SL18/06_logs` directory for flagging issues and approving clips.
- Mirror active review queues in Airtable using views such as `Episodes ▸ Needs Review` and give operators edit access so they can mark decision status quickly.
- Store manual edit notes, alternative hooks, and culturally sensitive guidance in a dedicated subfolder (e.g., `/SL18/06_logs/review_workspace`) so the automation team and franchise partners reference the same source of truth.
- When escalations occur (API failure, persona tone concerns, partner feedback), log the context in the shared workspace and tag responsible owners before resuming automation runs.
- Capture manual creative briefs, thematic prompts, or audience leads that should steer AI output; translate them into structured guidance for personas or prompt templates before the next automation cycle.
- Example workspace layout:
	- **Channel** `#sl18-review` (Teams/Slack) for daily status posts from Make.com and manual QC comments.
	- **Shared document** (OneNote/Confluence) sections: `Persona redlines`, `Platform escalations`, `Partner feedback`, `Creative leads` (manual queries and storylines for future AI runs).
	- **Drive folder** `/SL18/06_logs/review_workspace/YYYY-MM-DD` storing annotated scripts, revised caption files, and approval checklists.
	- **Calendar reminder** for a 10-minute daily QC huddle to clear backlog before automation publishes.
- Template snippets:
	- **Creative Brief (Markdown/OneNote)**
		- `Persona / Franchise:`
		- `Target audience insight:`
		- `Hook idea:`
		- `Tone & cultural guardrails:`
		- `Call-to-action:`
		- `Reference assets or episodes:`
	- **AI Query Prompt**
		- `Goal:` What outcome or storyline should the AI deliver?
		- `Context:` Any timely events, partnerships, or platform constraints?
		- `Constraints:` Words/phrases to avoid, timing, music tempo, etc.
		- `Success test:` How will the reviewer decide if the generated script or asset is publish-ready?

	## AI Role & Guardrails
	- Automations carry the heavy lift across script drafting, TTS, music, publishing, and analytics, while humans own cultural judgment, escalation, and final sign-off.
	- Review the responsibility split, guardrails, and escalation paths in `Docs/ai_role_and_governance.md` before enabling scheduled runs or onboarding partners.
	- Revisit the governance checklist quarterly to keep persona briefs, prompts, and automation safety nets aligned with current policies.

## Structure
- `automation/` — No/low‑code blueprints (Make.com, n8n)
- `assets/` — Logos, stings, video templates
- `data/` — Generated assets and logs
- `docs/` — Docs for collaborators
- `franchises/` — Partner configuration templates & launch kits
- `personas/` — Persona shells and language variants (CSV/JSON)
- `prompts/` — Prompt templates for GPT‑5
- `scripts/` — Convenience scripts (PowerShell)
- `pipelines/` — Azure Pipelines YAMLs

## API Integration Overview
- Populate `.env` (mirrors `.env.example`) with credentials before running automation. Missing values will cause the Make.com blueprints to pause for manual intervention.
- **Airtable**: Supply `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, and ensure `Episodes`, `Personas`, and `Franchises` schema matches the ordered fields used by `automation/airtable/exportEpisodesToGitHub.js`.
- **ElevenLabs (TTS)**: Store `ELEVENLABS_API_KEY` and persona `voice_id` mappings. Validate quota and voice availability before scaling up personas.
- **Music Generators**: Configure either `MUBERT_API_KEY`, `UDIO_API_KEY`, or both. The Make.com asset pipeline expects at least one to be active for stem creation.
- **CapCut Teams**: Provide `CAPCUT_API_KEY`, `CAPCUT_TEAM_ID`, and `CAPCUT_TEMPLATE_ID`. Update template layers in CapCut before referencing new personas or franchises.
- **Publishing APIs**: Fill `YOUTUBE_API_KEY`, `META_CREATOR_STUDIO_TOKEN`, `META_IG_ACCOUNT_ID`, `META_FB_PAGE_ID`, and `TIKTOK_SESSION_COOKIE`. Rotate Meta tokens every 60 days and refresh the TikTok session cookie monthly; log rotations in `/SL18/06_logs`.
- **Google Drive**: Backing folders referenced by `GOOGLE_DRIVE_*` IDs must exist and be shared with automation service accounts. Align any franchise-specific overrides in `Docs/franchises.csv` and `franchises/<id>/config.yaml`.

## Variables & Secrets
- Copy `.env.example` to `.env` and fill values.
- In Azure DevOps, set pipeline variables (Library or variable groups).
- Use `DEFAULT_FRANCHISE_ID` for single-tenant runs; set `FRANCHISE_ROUTER_MODE=multi` when routing scenarios by franchise.

## Strategic Pivot — CapCut + Meta (Nov 16 2025)
*Owner: Asefa Tolessa*

CapCut no longer supports publishing directly to Meta properties (Facebook/Instagram) via the former Groups API bridge. SL18 now treats CapCut as a **creative layer only**, with publishing handled by native platform APIs.

### Modular Architecture
- **Layer 1 — Creative Automation** (CapCut, Mubert, Udio)
	- Inputs: persona, script, audio, styling tokens.
	- Actions: generate soundtrack (Mubert/Udio) → render CapCut template → export MP4.
	- Output: downloadable MP4 packaged for handoff.
- **Layer 2 — Publishing Automation** (Meta Graph API, TikTok session cookie, YouTube OAuth)
	- Inputs: rendered MP4 + metadata bundle.
	- Actions: upload to IG/FB via Graph API, TikTok via cookie session, YouTube via OAuth.
	- Output: publish status + platform IDs logged back into Airtable.

### Credential Checklist
| Creative Layer | Publishing Layer |
| --- | --- |
| `CAPCUT_API_KEY`, `CAPCUT_TEAM_ID`, `CAPCUT_TEMPLATE_ID` | `META_CREATOR_STUDIO_TOKEN`, `META_IG_ACCOUNT_ID`, `META_FB_PAGE_ID` |
| `MUBERT_API_KEY`, `UDIO_API_KEY` | `TIKTOK_SESSION_COOKIE`, `YOUTUBE_API_KEY` |

Keep the sheet mirrored in `.env.example` so onboarding remains deterministic.

### Planned CLI Modules
1. `scripts/cli/generate-video.ps1` — persona + audio + template → CapCut MP4 export.
2. `scripts/cli/publish-meta.ps1` — MP4 + IG/FB IDs + metadata → Graph API publish + Airtable log.
3. `scripts/cli/log-drop.ps1` — platform + persona + timestamp + status → Airtable logging helper.

### Immediate Next Steps
- Await finalized Mubert API key (ETA ~24h) and update `.env` once issued.
- Request CapCut API access via `open.capcut.com`; record team/template IDs when granted.
- Retrieve Meta tokens/account IDs via Graph API explorer; refresh on the documented cadence.
- Scaffold the CLI modules above so automation agents can call creative/publishing layers independently.

### Local Control Panel (in progress)
- Location: `apps/control-panel/`
	- `backend/` (Express/TS) exposes `/api/*` endpoints and streams PowerShell output.
	- `frontend/` (React/Vite) provides routes `/dashboard`, `/upload`, `/validate`, `/publish`, `/docs`.
- Purpose: host a stable `http://localhost:5178` origin for OAuth callbacks, manual uploads, and diagnostics.
- Quick start:
	```powershell
	# Backend
	cd "C:\Dev\SL 18\apps\control-panel\backend"
	npm install
	npm run dev

	# Frontend (separate terminal)
	cd "C:\Dev\SL 18\apps\control-panel\frontend"
	npm install
	npm run dev
	```
- `/api/validate` already shells out to `scripts/diagnostics/validate-env.ps1`; other modules are scaffolded with placeholders awaiting CapCut/Mubert/TikTok integration.

## Environment Validation Workflow
1) **Load `.env` into your shell** whenever you open a new PowerShell session:
```powershell
cd "C:\Dev\SL 18"
./scripts/helpers/load-env.ps1
```
2) **Run the diagnostics sweep** to confirm secrets and external APIs before any persona sync:
```powershell
./scripts/diagnostics/validate-env.ps1            # full run (fetches from Airtable/ElevenLabs/OpenAI/YouTube/Drive)
./scripts/diagnostics/validate-env.ps1 -SkipNetwork # quick check when you only want to verify variables
./scripts/diagnostics/validate-env.ps1 -Service Airtable  # optional: target a single provider (repeatable)
```
	- The script highlights missing variables, then pings each provider with lightweight API calls. Red lines usually mean the token lacks scope or the referenced file/ID does not exist.
	- Keep `GOOGLE_SERVICE_ACCOUNT_JSON` as an absolute path; the script validates the file before attempting Drive calls.
3) **Target a single service during debugging** with the helper smoke tests. Airtable example:
```powershell
./scripts/smoke_tests/airtable_ping.ps1                # uses AIRTABLE_PERSONAS_TABLE from .env
./scripts/smoke_tests/airtable_ping.ps1 -Table tblXXXX # override with explicit table ID when needed
```
	- Airtable requires the table **ID** (`tbl…`) when names contain spaces or special characters. The script now handles IDs directly, so store them in `.env` for reliable runs.
4) **Re-run diagnostics after every secret change** (new PAT, rotated API key, etc.) so issues surface before Make.com/n8n scenarios execute.
5) **Capture failures in `/Docs/sop_daily.md` or `/SL18/06_logs`** so the next operator sees which credential or platform needs attention.

## First Run (MVP)
- Update `prompts/script_template_en.txt` for your first persona.
- Fill `personas/personas.csv` & `docs/episodes.csv` with 1 test row.
- Run pipeline **SL18-MVP** (defined in `azure-pipelines.yml`) to validate.

## Minimal Automation Plan (No-Code First)
- **Objective** Deliver one short-form clip per day by chaining reliable services with minimal custom code.
- **Guardrails** Favor templates over bespoke assets, keep outputs in Drive/OneDrive, and keep editing/publishing manual for now.
- **Failover** Maintain at least one evergreen backup clip ready for same-day publishing.

### Recommended Stack (Swapable)
| Function | Default | Alternates |
| --- | --- | --- |
| Content calendar | Airtable base `SL18 Calendar` | Google Sheets |
| Script drafting | ChatGPT via Make.com prompt template | Manual ChatGPT session |
| Voice (TTS) | ElevenLabs project voices | Play.ht, Azure TTS |
| Music bed | Udio or Mubert API | Suno, stock loop |
| Storage | Google Drive `/SL18` folders | OneDrive, Dropbox |
| Editing | CapCut Teams template automation | Descript, VEED |
| Publishing | YouTube Shorts + Meta Creator Studio | Buffer, Later |
| Analytics | Manual weekly export to Airtable | Native dashboards |

### Drive / OneDrive Layout (Mirror in Google Drive)
- `/SL18/01_assets` logos, stings, lower-thirds
- `/SL18/02_prompts` script templates, persona prompt snippets
- `/SL18/03_audio` generated TTS files
- `/SL18/04_music` generated stems + loops
- `/SL18/05_video_renders` exported MP4s + SRT captions
- `/SL18/06_logs` manual notes + issues
- `/SL18/07_calendar` Airtable CSV exports (backups)

- **Table Personas** `persona_code`, `franchise_id`, `display_name`, `language`, `voice_id`, `style_notes`, `sign_off`
- **Table Episodes** `date`, `persona_code`, `franchise_id`, `theme`, `hook`, `melody_reference`, `script_file`, `tts_file`, `music_file`, `video_file`, `caption_file`, `publish_url`, `youtube_video_id`, `meta_ig_media_id`, `meta_fb_post_id`, `tiktok_video_id`, `drive_scripts_id`, `drive_audio_id`, `drive_music_id`, `drive_video_id`, `drive_captions_id`, `yt_views`, `meta_plays`, `tiktok_views`, `last_metrics_sync`, `status`, `notes`
- **Table Franchises** `franchise_id`, `display_name`, `country`, `owner_contact`, Drive folder IDs, revenue split %, status, notes
- **Table Caption Snippets** (optional) platform-specific copy blocks

### Daily Theme Rotation
- Mon `AI vs Aunties`
- Tue `Love in the Time of Bureaucracy`
- Wed `Remix the Headlines`
- Thu `Tech vs Tradition`
- Fri `Workplace Whispers`
- Sat `Diaspora Diaries`
- Sun `Wildcard Collab`

- Trigger: schedule 09:00 local → Airtable Episodes filter status = planned (router-ready for `franchise_id`)
- GPT: merge script template with persona/theme variables → save `.txt` into franchise-specific prompts folder
- TTS: ElevenLabs module using `voice_id` → upload MP3 to matched franchise audio folder
- Music: Call Udio/Mubert to render 30s stem using persona + hook cues → upload to franchise music folder
- Video: Trigger CapCut automation with template, script, voice, and music; export MP4 + SRT to franchise render folder
- Update Airtable: attach file IDs, set status `render_ready`, and log execution in `/06_logs`
- Notify operator + franchise lead via email/Teams summary for QC

- Trigger: hourly schedule → Airtable Episodes filter status = render_ready (per-franchise router optional)
- Fetch persona + franchise metadata, download MP4/SRT from Drive
- YouTube Shorts upload with captions + persona themed title
- Meta Graph API post to IG + FB reels via Creator Studio token
- TikTok upload using session cookie fallback
- Update Airtable status to `published`, record Shorts URL & platform IDs
- Notify operator + franchise owner with platform job IDs or error branch for manual posting

### Make.com Scenario (Analytics Sync)
- Trigger: daily 06:30 check for published episodes lacking recent metrics
- Call YouTube Data API, Meta Graph API, and TikTok stats endpoint using stored media IDs
- Update Airtable view counters and `last_metrics_sync`
- Email digest of counts; if queue empty, send light reminder; escalate on failures

- Confirm Airtable Episodes row for today is `planned` for your franchise
- Trigger Make.com scenario (or run prompt manually) to get script + TTS + music + rough cut
- QC the CapCut render, tweak template layers if needed, then finalize graphics
- QC final video for audio balance and on-screen text
- If publish automation succeeds, spot-check platform links; otherwise publish manually and update Airtable (note franchise in comments)
- Append issues in `/SL18/06_logs/issues_YYYYMM.csv`

### 48-Hour Kickoff Checklist
- Provision Drive folders + Airtable base with Personas/Episodes
- Capture voice samples, store ElevenLabs `voice_id` in Personas table
- Save CapCut 1080×1920 template with intro/outro sting in `/01_assets`
- Configure Make.com scenario (script + TTS + music + CapCut render) and test on one sample row
- Produce first clip manually, publish, and capture lessons in `/06_logs`

## Azure DevOps Tips
- **Boards** Track Episodes status (`planned`, `render_ready`, `published`) via Kanban if needed; add swimlane for items waiting analytics (`last_metrics_sync` >24h).
- **Repos** Push this repo to the Azure DevOps project shown in the screenshot (`SL18`).
- **Pipelines** Use `pipelines/mvp.yml` as starter to lint prompt snippets or sync Drive backups.
- **Wiki** Copy the sections above into Wiki pages for non-technical collaborators.

### Queue MVP Pipeline via CLI
1) Ensure `.env` contains `AZURE_DEVOPS_EXT_PAT`, `AZURE_DEVOPS_ORG`, `AZURE_DEVOPS_PROJECT`.
2) Configure defaults and list pipelines, then queue a run:
```powershell
cd "C:\Dev\SL 18"
.\scripts\setup\setup-sl18.ps1            # sets az devops defaults from .env
az pipelines list -o table                # copy the ID you want to run
az pipelines run --id <ID> --branch main  # queue a run
```
Or use the helper script:
```powershell
cd "C:\Dev\SL 18"
.\scripts\ci\queue-mvp.ps1 -DryRun     # prints actions
.\scripts\ci\queue-mvp.ps1 -PipelineId <ID> -Branch main
# or pick by name (case-insensitive) or auto-select when only one exists
.\scripts\ci\queue-mvp.ps1 -Name "SL18 MVP validation" -Branch main
# shortest alias (defaults to -Name "SL18 MVP validation")
.\scripts\ci\queue.ps1 -Open -Branch main
```
Notes:
- The alias `scripts/ci/queue.ps1` performs a quick preflight: verifies `az` is installed and ensures the `azure-devops` extension (auto-installs it unless `-DryRun`).
- Both helpers read `apps/control-panel/backend/.env` for `AZURE_DEVOPS_ORG` and `AZURE_DEVOPS_PROJECT` to set `az devops` defaults.
The script reads backend `.env`, configures `az devops` defaults, ensures the Azure DevOps extension is installed, and queues the specified pipeline ID.

## Franchise Rollout Guide
- Duplicate Airtable base per region or manage centrally with `franchise_id` linked records and filtered views.
- Share Google Drive folders using partner-specific IDs stored in the `Franchises` table to keep assets segregated.
- Issue `.env` bundles with `DEFAULT_FRANCHISE_ID` and partner API tokens; rotate via Azure Key Vault or Make.com environments.
- Provide each partner with a copy of `Docs/franchise_playbook.md` and `franchises/franchise_config_template.yaml` to align on brand guardrails, tone, and revenue splits.
- Monitor analytics per franchise using the daily metrics sync and log any revenue share adjustments in the `Franchises` table.
- For shared visibility, reference `Docs/dashboard_playbook.md` to build onboarding and revenue dashboards sourced from Airtable and automation logs.

## Competitive Edge Snapshot
- **Persona-first scripting**: Airtable + prompt template keep character voice, sign-off, and cultural guardrails consistent across languages.
- **Hybrid audio pipeline**: Dual-option music generation (Udio/Mubert) paired with ElevenLabs voices yields comedic musical responses that feel custom without heavy DAW work.
- **CapCut Teams automation**: Template-aware render step turns raw assets into captioned 9:16 video in minutes, beating manual edit latency common on rival persona channels.
- **Human-in-the-loop QC**: Lightweight SOP focuses reviewers on cultural nuance and virality hooks, preserving authenticity that fully automated meme pages often lose.
- **Data feedback loop**: Unified Airtable episode log + analytics exports make it trivial to adjust hooks/themes faster than multi-tool social agencies.

## Enhancement Ideas for Virality
- **Trend radar**: Add a Make.com or n8n scenario that scrapes trending topics per platform and feeds candidate hooks into the human review workspace for same-day adaptation.
- **A/B prompt testing**: Duplicate Airtable rows with variant hooks and schedule alternating releases; use the analytics dashboard to rapidly retire underperforming angles.
- **Community stitches**: Maintain a rolling list of fan duets/stitches and integrate them into weekly planning, crediting collaborators to encourage share loops.
- **Localized meme packs**: Expand `prompts/` with region-specific slang libraries so new franchises can launch with culturally primed humor from day one.
- **Partnership pipeline**: Track potential influencer tie-ins in Airtable and automate outreach snippets, pushing warm leads to the creative brief template.
- **Live reaction spikes**: Schedule occasional live stream recaps using persona voices to react to top clips, driving viewers back to short-form channels.

## Development & Testing Plan
1. **Environment Prep**
	- Clone repo to `C:\Dev\SL 18`, copy `.env.example` to `.env`, and fill secrets.
	- Configure required service accounts (Airtable, Google Drive, ElevenLabs, music APIs, CapCut, publishing APIs).
2. **Schema & Asset Validation**
	- Verify Airtable tables match `Docs/airtable_setup.md` and personas/personas.csv headers.
	- Confirm Drive folders exist and permissions align with `.env` IDs.
3. **Manual Persona Dry Run**
	- Use `prompts/script_template_en.txt` with ChatGPT manually to draft a script.
	- Render voice via ElevenLabs dashboard and store files following `/SL18/03_audio` naming convention.
	- Assemble quick CapCut draft manually to validate template layers.
4. **Automation Smoke Test**
	- Enable Make.com asset blueprint for a single Airtable row (status `planned`).
	- Inspect generated script, TTS, music, and video outputs; document findings in `/SL18/06_logs/issues_YYYYMM.csv`.
	- If failures occur, update Airtable status to `fallback` and note fixes needed.
5. **Publishing Pipeline Check**
	- Switch an Airtable row to `render_ready` and run Make.com publish blueprint.
	- Confirm platform uploads, capture returned IDs, and update Airtable status to `published`.
	- Validate notifications are received in the human review workspace.
6. **Analytics Loop Verification**
	- After at least one published clip, run analytics blueprint to ensure metrics fields update and digest email sends.
7. **Regression Safeguards**
	- Before enabling schedules, review logs, ensure creative briefs and manual queries are recorded for next cycle.
	- Schedule weekly review to revisit personas, prompts, and automation configs based on analytics feedback.

## Recommended Workstream Priority
1. **Core Infrastructure Setup**
	- Finalize Airtable schema, Drive folders, and persona prompt assets (see `Docs/workstream_1_core_infrastructure.md`).
	- Configure automation credentials and verify `.env` coverage.
2. **Automated Asset Pipeline**
	- Harden Make.com asset blueprint (script → TTS → music → video) with manual QA loop (see `Docs/workstream_2_automated_asset_pipeline.md`).
	- Integrate enhancement backlog (trend radar, localized meme packs) once baseline flow is stable.
3. **Publishing & Analytics Reliability**
	- Solidify cross-platform publishing automation, ensure error notifications reach human workspace (see `Docs/workstream_3_publishing_analytics_reliability.md`).
	- Lock in analytics dashboard updates and revenue calculations for weekly reporting.
4. **Franchise Enablement**
	- Build onboarding dashboards, document SOPs, and trial franchise rollout using refined prompts (see `Docs/workstream_4_franchise_enablement.md`).
	- Add A/B testing and community engagement features after primary franchise is running smoothly.

## Launch Timeline (Approximate)
- **Phase 1 — Development & Configuration (Week 0-2)**
	- Stand up environment, populate Airtable schema, load initial personas, and validate Drive/CapCut assets.
	- Manual persona dry runs, refine prompts, and align human review workspace.
- **Phase 2 — Beta (Week 3-4)**
	- Enable automation for one franchise persona; monitor asset pipeline, publishing, and analytics scenarios daily.
	- Gather creative briefs and manual adjustments to ensure AI output meets standards; iterate prompts/blueprints.
- **Phase 3 — Production Rollout (Week 5+)**
	- Turn on scheduled runs for core franchise after beta KPIs (reliable asset generation, publish success, analytics updates) are met.
	- Onboard additional franchises using the dashboards playbook; maintain weekly retros and monthly revenue reconciliation.

