# SL18 Agent Runbook

## Purpose
- Give AI assistants a fast onboarding path for this repo.
- Highlight automation boundaries (Airtable, Make.com, n8n) and required hand-offs to humans.
- Provide ready-to-run checklists for the most common maintenance tasks.

## Pre-Flight Checklist
- Read `.github/copilot-instructions.md` for repo norms and platform caveats.
- Confirm with the user which platform (Airtable, Make.com, n8n, Azure Pipelines) is in scope before editing files.
- Assume Airtable scripts, Make.com blueprints, and n8n snippets are canonical exports; plan changes in their native UIs first.
- Avoid running automation scripts locally. Anything under `automation/airtable/` expects Airtable runtime globals.
 - Use the centralized setup script for scaffolding: `scripts/setup/setup-sl18.ps1` (wrapper also at `apps/control-panel/backend/setup-sl18.ps1`).

## Tooling Map
- **Airtable** (`automation/airtable/exportEpisodesToGitHub.js`) exports `Docs/episodes.csv`. Any schema change must update `orderedFields` and drive ID expectations.
- **Make.com** blueprint JSON lives in `automation/make/`. Edit scenarios inside Make.com, then export to overwrite the matching file.
- **n8n** helpers (`automation/n8n/`) mirror Make.com logic for self-hosted automation; only adjust when n8n workflows will be re-imported.
- **Azure Pipelines** entry `azure-pipelines.yml` delegates to `pipelines/mvp.yml` and needs the `SL18-Secrets` variable group.
- **Docs folder** captures SOPs, analytics loop, and franchise playbooks referenced by partners. Keep them aligned with automation behavior.

## Core Workflows
1. **Sync Episodes CSV**
   - Update Airtable data through the platform UI.
   - Run the Airtable automation that executes `exportEpisodesToGitHub.js` (do not run locally).
   - Verify `Docs/episodes.csv` matches `orderedFields`; diff check for unintended header changes.
2. **Revise Make.com Scenarios**
   - Implement edits in Make.com (e.g., schedule, module routing, new outputs).
   - Export the scenario JSON and replace the matching file in `automation/make/`.
   - Note any new environment variables in `.env.example` and `Docs/make_scenario.md`.
3. **Persona or Franchise Updates**
   - Reflect persona metadata in `personas/personas.csv` (ensure columns stay in sync with `automation/n8n/persona_mapper.js`).
   - Align franchise configuration in `Docs/franchises.csv` and `franchises/franchise_config_template.yaml` derivatives.
   - Update prompt templates (`prompts/*.txt`) to include new sign-offs or tone notes.
4. **Pipeline or Script Maintenance**
   - Modify `pipelines/mvp.yml` only through YAML updates; keep `azure-pipelines.yml` pointing at the template.
   - For PowerShell setup changes, maintain Windows PowerShell compatibility (`scripts/setup.ps1`).

## Safety Rails
- Never delete drive ID fields or persona columns without confirming downstream automations.
- Treat Make.com JSON as opaque unless performing small, deliberate adjustments (cron schedule, friendly names). Complex edits must originate in the Make.com UI.
- Preserve CSV headers—automations read by exact column name.
- When unsure how a task ties into external services (CapCut, ElevenLabs, Meta), ask the user before committing changes.

## Reference Links
- `.github/copilot-instructions.md` — operational norms for AI contributors.
- `Docs/sop_daily.md` — daily production checklist; useful to confirm automation outputs.
- `Docs/make_scenario.md` — detailed walkthrough of the asset preparation scenario.
- `Docs/publishing_automation.md` — reference for multi-platform publishing flow.
- `Docs/analytics_feedback.md` — describes the metrics sync and expected KPIs.
- `Docs/franchise_playbook.md` — partner rollout expectations; ensure docs and automations stay aligned.
