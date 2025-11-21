# SL18 Control Panel

This directory hosts the experimental localhost dashboard for diagnostics, uploads, publishing triggers, and internal docs. The goal is to provide a stable redirect URI for YouTube OAuth while exposing quick buttons for the existing PowerShell helpers.

## Structure
- `backend/` — Express + TypeScript API server. Streams PowerShell script output and will host OAuth callbacks.
- `frontend/` — React (Vite) UI for routes `/dashboard`, `/upload`, `/validate`, `/publish`, `/docs` (to be scaffolded next).

## Backend quick start
```powershell
cd "C:\Dev\SL 18\apps\control-panel\backend"
npm install
npm run dev
```
This launches the server on port `5178` (override with `SL18_PANEL_PORT`).

### `/api/validate`
POST endpoint that shells out to `scripts/diagnostics/validate-env.ps1`. Optional body `{ "service": "Airtable" }` narrows the check. Output is streamed back as plain text so the UI can render a live log.

### `/api/upload/*`
- `GET /api/upload/queue` returns the upload backlog (statuses `render_ready` or `uploading`) plus credential readiness flags and a payload version identifier. Optional query `?franchise=<franchise_id>` narrows results.
- `GET /api/upload/stats` summarizes queue counts by status. Accepts the same optional `?franchise=` filter for consistency with the queue view.
- `POST /api/upload/update` applies whitelisted field updates (`status`, platform IDs, `publish_url`, `notes`).

The frontend `/upload` route consumes these endpoints to surface a manual publishing workspace with asset links, status transitions, and credential badges.
Use the franchise filter control (top of the page) to focus on a single partner without reloading the whole backlog.

### `/api/docs/*`
- `GET /api/docs` enumerates Markdown files under `Docs/`, returning ids/titles for the UI list.
- `GET /api/docs/content?file=<filename>` streams the Markdown body for rendering inside the control panel.

The `/docs` route renders these SOPs with quick refresh buttons so operators can reference playbooks alongside the diagnostics/publishing tools.

## Next steps
1. Implement OAuth handlers for YouTube and Graph API token capture.
2. Wrap the upcoming CLI modules (`generate-video.ps1`, `publish-meta.ps1`, `log-drop.ps1`).
3. Add per-record activity logs on the upload view for better handoff tracking.
```}