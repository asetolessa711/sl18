# SL 18 — VSO Project Scaffold

This repository scaffold is designed for **Azure DevOps (VSO)** with **GPT‑5 + Codex Preview**. It supports a minimal‑code workflow to automate: script → TTS → music → video → captions → publish.

## Quick Start

1) **Create local folder** (or OneDrive path): `C:\Users\atdan\OneDrive\Documents\SL 18`  
2) Extract this zip into that folder.  
3) Initialize Git & push to VSO:
```powershell
cd "C:\Users\atdan\OneDrive\Documents\SL 18"
git init
git add .
git commit -m "SL18 scaffold init"
git branch -M main
# Create empty project/repo in Azure DevOps first, then:
git remote add origin https://dev.azure.com/<org>/<project>/_git/sl18-automation
git push -u origin main
```

4) Create a service connection in Azure DevOps for Google Drive / Airtable (if used).  
5) Import the **Make.com** blueprint from `automation/make/sl18_make_blueprint.json`.

## Structure
- `automation/` — No/low‑code blueprints (Make.com, n8n)
- `assets/` — Logos, stings, video templates
- `data/` — Generated assets and logs
- `docs/` — Docs for collaborators
- `personas/` — Persona shells and language variants (CSV/JSON)
- `prompts/` — Prompt templates for GPT‑5
- `scripts/` — Convenience scripts (PowerShell)
- `pipelines/` — Azure Pipelines YAMLs

## Variables & Secrets
- Copy `.env.example` to `.env` and fill values.
- In Azure DevOps, set pipeline variables (Library or variable groups).

## First Run (MVP)
- Update `prompts/script_template_en.txt` for your first persona.
- Fill `personas/personas.csv` & `docs/episodes.csv` with 1 test row.
- Run pipeline **SL18-MVP** (defined in `azure-pipelines.yml`) to validate.

