<!-- Repository-specific Copilot instructions for AI coding agents -->
# Copilot / Agent Instructions — SL18 repository

Purpose
- Provide concise, actionable guidance so an AI coding agent can be productive in this repo.

Where to look (quick links)
- Project README: `README.md` — high level architecture and operational checklist.
- Automation blueprints: `automation/make/*.json` (e.g. `sl18_make_blueprint.json`, `sl18_publish_blueprint.json`, `sl18_analytics_blueprint.json`) — Make.com scenario exports (do not rewrite by hand unless you understand Make.com JSON).
- Airtable scripting: `automation/airtable/exportEpisodesToGitHub.js` — Airtable Scripting environment code; canonical export of `Docs/episodes.csv`.
- n8n helpers: `automation/n8n/persona_mapper.js` — function node snippets used in n8n workflows.
- Pipelines: `azure-pipelines.yml` and `pipelines/mvp.yml` — CI entry and template. Variable group `SL18-Secrets` is referenced here.
- Persona & data: `personas/personas.csv`, `Docs/episodes.csv`, `franchises/franchise_config_template.yaml`.

Execution environment notes
- Airtable scripts (e.g. `exportEpisodesToGitHub.js`) run inside Airtable Automation / Scripting App — they use `input.config()`, `base.getTable()` and Airtable globals. Do NOT execute those files directly with `node`.
- Make.com blueprints are imports for Make.com (Integromat). Edit them in the Make.com UI and export the JSON if you need to version changes.
- `automation/n8n/*.js` snippets are intended for n8n Function nodes; paste them into a Function node when editing n8n flows.
- `scripts/setup.ps1` & other PowerShell utilities are Windows/PowerShell scripts — run with PowerShell v5.1+.

Conventions & important patterns (concrete)
- Canonical episode data: `Docs/episodes.csv` is the repository copy of the Airtable Episodes table. It is produced by `automation/airtable/exportEpisodesToGitHub.js` and treated as the canonical CSV for CI/backup.
- Airtable field expectations: `exportEpisodesToGitHub.js` enforces an `orderedFields` list and requires several drive ID text fields (`drive_*`) to be `singleLineText`. If you change the Airtable schema, update this script's `orderedFields` first.
- Make.com scenario scheduling: `sl18_analytics_blueprint.json` uses a daily cron trigger and pulls platform metrics. When editing analytics sync logic, mirror changes in the Make.com scenario and export the updated JSON to `automation/make/`.
- Persona mapping: `automation/n8n/persona_mapper.js` maps Airtable persona rows to the shape n8n expects. Keep persona CSV columns aligned with this mapper.

CI / Secrets / Deploy
- CI entry: `azure-pipelines.yml` triggers on `main` and templates `pipelines/mvp.yml`.
- Secrets: pipeline references a variable group `SL18-Secrets` — update secrets there (Azure DevOps) rather than committing credentials to the repo.

Testing
- Test framework: **Vitest** (configured at root level).
- Run tests: `npm test` (single run) or `npm run test:watch` (watch mode).
- Test files: `tests/*.test.ts` — add new tests here when modifying utility functions.
- Before committing: always run `npm test` to ensure all tests pass.

Developer workflows (practical examples)
- To update the canonical episodes CSV (run via Airtable): edit Airtable Automation inputs, then run the Airtable automation that contains `exportEpisodesToGitHub.js` to update `Docs/episodes.csv` in the repo.
- To change Make.com automation: edit scenario in Make.com → export JSON → replace matching file in `automation/make/` and commit with a short explanation in the commit message.
- To run the PowerShell setup locally (Windows):
  - Open PowerShell and run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\\scripts\\setup.ps1`
  - New centralized scaffold helper: `./scripts/setup/setup-sl18.ps1 -DryRun` (safe)
  - A wrapper exists at `apps/control-panel/backend/setup-sl18.ps1` that delegates to the centralized script.

Editing tips & gotchas
- Make.com JSON: `automation/make/*.json` are exports — edit scenarios in the Make.com editor and export JSON. Avoid hand-editing complex module layouts; change only simple settings if you know the schema.
- Airtable scripts: `exportEpisodesToGitHub.js` expects Airtable runtime globals (`input.config()`, `base`). Do not `node`-run these files — run them inside Airtable Automations. If you alter `orderedFields` update the script and check the `Docs/episodes.csv` output.
- Drive ID columns: script expects `drive_*` fields to be `singleLineText`. The script will attempt to coerce field types but prefer manual schema changes in Airtable to avoid automation surprises.
- Persona CSV: keep `personas/personas.csv` columns aligned with `automation/n8n/persona_mapper.js` to avoid mapping errors in n8n flows.

Integration points (observed)
- Airtable: Episodes, Personas, Franchises tables drive the workflow. `automation/airtable/exportEpisodesToGitHub.js` is the canonical exporter.
- Make.com: blueprints orchestrate TTS, music, CapCut renders, and analytics sync (see `sl18_analytics_blueprint.json`).
- n8n: small mappers/snippets are provided for lightweight transformation into workflow nodes.
- CI: Azure Pipelines (`azure-pipelines.yml`) references variable group `SL18-Secrets` for tokens and credentials.

Quick copyable examples
- Airtable automation (DO NOT RUN LOCALLY): the script uses `input.config()` and outputs `Docs/episodes.csv`.
- n8n Function node paste: copy `automation/n8n/persona_mapper.js` into a Function node to map persona fields.
- Make.com: import `automation/make/sl18_make_blueprint.json` into Make.com to recreate the automation scenario.

If you need to change something not listed here
- Open an issue describing the change, the platform that must be updated (Airtable / Make / n8n / Azure Pipelines), and the files you intend to modify.

Contact / feedback
- Repo README (`README.md`) contains operational context and contact pointers. If anything is unclear, ask the project owner listed in the README or open an issue.

-- End of instructions --