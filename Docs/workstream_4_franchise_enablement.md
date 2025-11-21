# Workstream 4 - Franchise Enablement

## Objective
Onboard new franchise partners efficiently with the assets, playbooks, and support processes they need to operate the SL18 pipeline in their language and market while protecting quality and brand guardrails.

## Prerequisites
- Workstreams 1 through 3 marked complete with automation running reliably for the core franchise.
- Updated Airtable schema with franchise onboarding fields and revenue tracking.
- Global and franchise dashboards published (see `Docs/dashboard_playbook.md`).
- Persona briefs, creative guardrails, and SOPs stored in `/SL18/06_logs/review_workspace/` and `Docs/franchise_playbook.md`.
- Contractual or memorandum items (revenue share, release cadence) agreed with the incoming partner.

## Step-by-Step Checklist

### 1. Franchise Intake & Scoping
- [ ] Capture partner details in Airtable `Franchises` table (contact, region, language, persona alignment).
- [ ] Validate the partner's release goals, cultural red lines, and local compliance requirements.
- [ ] Assign a unique `franchise_id`, Drive root folder, and default persona mapping.
- [ ] Confirm partner access to required tooling (Airtable Interface, dashboards, human review workspace).

### 2. Asset & Schema Provisioning
- [ ] Duplicate Drive folder structure under `/SL18` for the franchise (`<franchise_id>/` subfolders for prompts, audio, music, video, captions, logs).
- [ ] Generate or localize persona assets (script templates, voice IDs, style notes) and update `personas/personas.csv` plus Airtable `Personas` table.
- [ ] Copy baseline prompt templates into franchise folder; localize language and tone where needed.
- [ ] Populate `franchises/franchise_config_template.yaml` derivative with partner-specific IDs and store it in `franchises/<franchise_id>/config.yaml`.

### 3. Tooling & Credential Setup
- [ ] Provision API keys or delegate credential management (YouTube, Meta, TikTok, Google Drive, ElevenLabs, music generator).
- [ ] Store secrets in Azure DevOps and `.env` using franchise-specific prefixes (`FRANCHISE_<ID>_TOKEN`).
- [ ] Update Make.com scenario routing to read franchise-specific credentials and Drive IDs.
- [ ] Conduct joint credential smoke test (publishing dry run or content upload) and archive responses in `/SL18/06_logs/api_responses/<franchise_id>/`.

### 4. Training & SOP Alignment
- [ ] Run a training session covering README quick start, workstream checklists, and dashboards.
- [ ] Share `Docs/franchise_playbook.md`, persona briefs, and example creative briefs.
- [ ] Walk through the human review workspace workflow; set expectations for QC turnaround and escalation tags.
- [ ] Provide a checklist for weekly operations (episode planning, QC, analytics review) tailored to the partner.

### 5. Pilot Content Cycle
- [ ] Select two Airtable episodes for the franchise (`planned` status) and tag them `pilot_<franchise_id>`.
- [ ] Execute Workstream 2 automated asset pipeline with the partner observing; log any localization tweaks.
- [ ] Run Workstream 3 publishing and analytics flows to confirm uploads, IDs, and metrics ingestion.
- [ ] Collect partner feedback on persona tone, music, and captions; document updates in persona briefs and prompts.

### 6. Governance & Support
- [ ] Define SLA for issue response, release cadence, and analytics reporting; log in Airtable (`support_sla`, `release_target_per_week`).
- [ ] Set up alert routing so partner receives publish/analytics notifications (email or Slack once available).
- [ ] Establish escalation protocol for compliance or cultural concerns (contact list, decision authority).
- [ ] Schedule recurring retrospectives to review metrics, creative performance, and backlog adjustments.

### 7. Handoff & Scaling Readiness
- [ ] Confirm partner can independently run the automation (manual trigger + scheduled runs) and log outcomes.
- [ ] Ensure dashboards display partner-specific KPIs and revenue breakdowns.
- [ ] Archive pilot outputs, feedback, and approvals in `/SL18/06_logs/review_workspace/<date>/` for audit.
- [ ] Update the global operations dashboard to include the new franchise and validate filters.

## Definition of Done
- Franchise records complete in Airtable with onboarding checklist fields marked ready.
- Localized assets, prompts, and credentials configured and tested end-to-end.
- Partner trained on SOPs, review workspace usage, and dashboards; meeting cadence confirmed.
- Pilot episodes published with analytics flowing back into Airtable and dashboards.
- Escalation path, SLA, and documentation stored in shared workspace for future reference.

## Handoff Notes
After the franchise is live, monitor the first two weeks of scheduled runs closely. Capture lessons learned in `Docs/franchise_playbook.md` and update configuration templates as additional regions join. Feed recurring insights into enhancement backlogs (e.g., localized meme packs, trend monitoring) to support future franchises.
