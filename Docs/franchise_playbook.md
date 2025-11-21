# SL18 Franchise Playbook

This playbook helps new regional creators, DJs, and partners operate SL18 under a shared brand while maintaining quality control, cultural resonance, and transparent revenue sharing.

## 1. Franchise Overview
- **Goal**: Deploy the SL18 persona-led automation stack in new markets with local hosts who manage script nuance, cultural QA, and publishing cadence.
- **Core Pillars**: consistent persona voice, automated asset pipeline, human review loop, transparent analytics → revenue share.
- **Key Roles**:
  - *Partner Lead*: operates daily SOP, reviews scripts, manages publishing.
  - *SL18 Central Ops*: maintains automation blueprints, brand guardrails, revenue reconciliation.
  - *Regional Creatives/DJs*: provide local hooks, music cues, and promotional pushes.

## 2. Onboarding Checklist
1. Execute franchise agreement and capture `franchise_id`, contact info, revenue split in Airtable `Franchises` table.
2. Provision Google Drive sub-folders (scripts/audio/music/video/captions) and share with partner account.
3. Duplicate CapCut template, inject localized overlays, and save template ID in Airtable `Franchises` table.
4. Issue `.env` bundle with partner-specific API keys (`DEFAULT_FRANCHISE_ID`, YouTube/META/TikTok secrets).
5. Import Make.com blueprints, duplicate scenarios, and set router filter `franchise_id = <partner>`.
6. Train partner on SOP (`Docs/sop_daily.md`) and analytics loop (`Docs/analytics_feedback.md`).
7. Run pilot episode end-to-end, logging results in `/SL18/06_logs/issues_YYYYMM.csv`.

## 3. Operational Guardrails
- **Persona Consistency**: partner can add new personas but must align with central persona style notes and sign-off format.
- **Cultural QA**: partner reviews scripts before render; central ops spot-checks weekly.
- **Automation Health**: daily scenario run logs forwarded to central ops; failures escalated within 1 hour.
- **Brand Assets**: only approved overlays, fonts, and audio stings stored in `/SL18/01_assets` may be used.
- **Data Residency**: partners store content in SL18-provided Drive folders; local copies permitted for editing but must be synced back.

## 4. Revenue Sharing
- Track platform IDs and view counts via analytics automation.
- Calculate monthly revenue pools using platform rev-share dashboards or CPM assumptions (document assumptions in Airtable `notes`).
- Export Airtable `Episodes ▸ Published` for the month, pivot by `franchise_id` to compute partner share.
- Record payouts in `Franchises` table (fields: `month`, `gross`, `share`, `status`).
- Central ops remits payments within 15 days of month end; partners acknowledge receipt via Airtable checkbox.

## 5. Quality Assurance
- **Weekly Reviews**: central ops reviews top 3 performing clips per franchise; provides notes in Airtable `notes` + shared Slack/Teams thread.
- **Quarterly Audits**: sample 10 episodes for compliance with persona guardrails, caption accuracy, and CTA quality.
- **Strike System**: missed SOP steps or brand violations logged; three strikes trigger pause status (`Franchises.status = paused`).

## 6. Scaling Playbook
- Launch multiple franchises by cloning scenarios within Make.com or running in separate teams with dedicated API keys.
- Use `FRANCHISE_ROUTER_MODE=multi` (set in `.env`) to enable router branches by franchise, or keep `single` for standalone runs.
- Maintain `franchises/<id>/config.yaml` files for partner-specific overrides (e.g., prompt variables, CapCut layers, custom hashtags).
- Add partner-specific prompt snippets under `prompts/franchises/<id>/` when dialect or cultural references need templating.

## 7. Offboarding & Suspensions
- Disable partner API keys and remove Drive access immediately.
- Reassign in-progress episodes to central ops (set `status = fallback`, `notes = offboard in progress`).
- Archive partner config in `/SL18/06_logs/offboard/<franchise_id>/`.
- Retain analytics data for 12 months for financial reconciliation.

## 8. Communication Cadence
- **Daily**: automation digest email (asset build + publish + analytics) CC partner lead.
- **Weekly**: 30-min sync to review performance, blockers, and upcoming themes.
- **Monthly**: finance review of revenue share; confirm next month’s content plan.

## 9. Partner Toolkit
- `Docs/sop_daily.md` — daily operations reference.
- `Docs/analytics_feedback.md` — interpreting metrics and closing the loop.
- `Docs/make_scenario.md` — automation details with franchise notes.
- `franchises/franchise_config_template.yaml` — configuration template (one copy per partner).
- Shared Slack/Teams channel with central ops for rapid troubleshooting.

*Keep this playbook updated as new partners join. Log revisions in `/SL18/06_logs/process_changes.md`.*
