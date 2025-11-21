# Ops Quick Commands

This cheat sheet consolidates common "try it" commands for admins and operators. All commands are for Windows PowerShell 5.1+.

Prereqs
- Ensure `.env` (and optionally `.env.local`) are populated.
- Open a PowerShell session in `C:\Dev\SL 18`.

## Load Environment
```powershell
cd "C:\Dev\SL 18"
./scripts/helpers/load-env.ps1
```

## Smoke Tests — Credentials & Connectivity
Run the full suite:
```powershell
./scripts/smoke_tests/credentials_ping.ps1
```
Individual checks:
```powershell
# Airtable (generic) / Episodes shortcut
./scripts/smoke_tests/airtable_ping.ps1 -ShowUrl
./scripts/smoke_tests/episodes_ping.ps1 -ShowUrl

# YouTube / Meta / TikTok
./scripts/smoke_tests/youtube_ping.ps1 -ShowUrl
./scripts/smoke_tests/youtube_ping.ps1 -ChannelId UC_x5XG1OV2P6uZZ5FSM9Ttw -ShowUrl
# YouTube OAuth (mine=true) — requires client id/secret/refresh token
node -r dotenv/config scripts/smoke_tests/youtube_oauth_ping.mjs
./scripts/smoke_tests/meta_ping.ps1 -ShowUrl
./scripts/smoke_tests/tiktok_ping.ps1 -ShowUrl

# TikTok offline cookie-shape validation
./scripts/smoke_tests/tiktok_ping.ps1 -AllowOffline
# Full suite with TikTok offline allowed
./scripts/smoke_tests/credentials_ping.ps1 -AllowOffline
```
Notes:
- Output prefixes: `OK •` success, `WARN •` non-fatal (e.g., offline TikTok), `ERR •` failure. Handy for skimming and CI parsing.
- `airtable_ping.ps1` supports `-Table <tblId>` or `-TableName <name>`; see `scripts/smoke_tests/README.md` for full flags.

CI integration
- Azure Pipelines captures smoke test output, raises warnings/errors for `WARN •`/`ERR •` lines, and publishes a markdown summary in the run (see the job Summary tab). This includes credentials, Airtable, and audio (Mubert) smoke outputs.

## Diagnostics Sweep
```powershell
./scripts/diagnostics/validate-env.ps1                # Full run
./scripts/diagnostics/validate-env.ps1 -SkipNetwork   # Vars only
./scripts/diagnostics/validate-env.ps1 -Service Airtable
```

## Azure DevOps — Queue Pipelines
Preflight helper (ensures az + extension, sets defaults, queues by name):
```powershell
# Set env defaults from .env/.env.local
./scripts/helpers/load-env.ps1

# Queue Preflight (opens run URL)
./scripts/ci/queue-preflight.ps1 -Organization "https://dev.azure.com/<org>" -Project "<project>" -PipelineName "SL18 CI" -Open
```
Additional helpers:
```powershell
# List and queue by ID/name (see README for details)
./scripts/ci/queue-mvp.ps1 -DryRun
./scripts/ci/queue.ps1 -Open -Branch main
```

## YouTube Auth (Manual OAuth helper)
```powershell
# Launch Node to run the refresh-token helper (interactive)
node .\scripts\auth\get-youtube-refresh-token.mjs
```

## Tips
- Prefer `.env.local` for safe local overrides; shared `.env` should remain stable.
- If execution is blocked, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for the current session.
- See `scripts/smoke_tests/README.md` for script-specific flags and examples.

## Audio Smokes (Local)
```powershell
# Mubert (requires MUBERT_COMPANY_ID and MUBERT_LICENSE_TOKEN)
node -r dotenv/config automation/audio/mubert_generator.js

# UDIO minimal (runs only if UDIO_API_KEY is set)
node -r dotenv/config automation/audio/udio_smoke.js
```
