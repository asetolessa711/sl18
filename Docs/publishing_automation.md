# Multi-Platform Publishing Automation

This playbook covers how the `sl18_publish_blueprint.json` Make.com scenario distributes each rendered clip across YouTube Shorts and Instagram/Facebook Reels, plus generates assets for TikTok manual posting.

## Prerequisites
- Airtable `Episodes` table updated via asset-build scenario with `status = render_ready` and attachments for video (`video_file`) and captions (`caption_file`).
- `.env` populated with:
   - `YOUTUBE_API_KEY`
   - `META_CREATOR_STUDIO_TOKEN`, `META_IG_ACCOUNT_ID`, `META_FB_PAGE_ID`
- Service accounts with access to `/SL18/05_video_renders` folder in Google Drive.
- Make.com connections configured for YouTube Data API, Meta Graph API, and custom TikTok HTTP module (session-cookie based).

## Scenario Flow
1. **Hourly Trigger** — runs at the top of each hour (Africa/Addis_Ababa timezone).
2. **Fetch Episode** — Airtable filter `status = render_ready`; exits early with notification if queue empty.
3. **Persona Lookup** — fetches `display_name` and language metadata for titles/captions.
4. **Download Assets** — pulls MP4 and SRT blobs from Google Drive.
5. **YouTube Shorts Upload**
   - Title template: `<theme> | <persona display>`
   - Description: uses `hook` and any `notes` from Airtable.
   - Uploads captions file to enable auto-subtitles.
   - Captures returned `videoUrl` for Airtable.
6. **Meta Reels Upload**
   - Uses Creator Studio long-lived token.
   - Posts to Instagram and Facebook with shared caption (`hook`).
7. **TikTok Export (Manual Posting)**
   - Scenario renders a TikTok-ready vertical video and caption text file.
   - Operator uploads via the TikTok app and pastes the caption manually.
8. **Airtable Update** — writes Shorts URL to `publish_url`, sets `status = published`.
9. **Success Notification** — sends digest email with platform job IDs.
10. **Failure Path** — any module error triggers escalation email instructing manual posting + Airtable status change to `fallback`.

## Manual Fallback Checklist
- If YouTube upload fails, retry via browser and paste URL in Airtable.
- For Meta failures, re-run using Creator Studio; refresh token if permission errors appear.
- Always note manual overrides in Airtable `notes` and append to `/SL18/06_logs/issues_YYYYMM.csv`.

## Testing Tips
- Duplicate the scenario and point to staging Airtable view with test attachments before going live.
- Use a 5s MP4 placeholder for connectivity tests to avoid quota waste.
- Validate each platform response payload in Make.com execution log; store sample JSON under `/SL18/06_logs/api_responses` for troubleshooting.
- After first production run, verify timestamps and thumbnails on all channels to confirm automation respects brand guidelines.

## Maintenance
- Rotate Meta token every 60 days; document renewal date in Airtable `Notes` of the most recent episode.
- Review TikTok cookie monthly; set calendar reminder to refresh even if uploads succeed.
- Spot-check YouTube Shorts analytics weekly to ensure titles/descriptions propagate correctly.
- Re-export `sl18_publish_blueprint.json` after each Make.com edit and commit to repo for traceability.

## Publish Guard (Control Panel)
- Purpose: Prevent bad publishes when platform credentials are missing or misconfigured.
- Where it runs: Control Panel backend (`/api/upload/update`).
- When it triggers:
   - Setting `status = published` in Upload Queue.
   - Saving platform IDs/links (`youtube_video_id`, `meta_ig_media_id`, `meta_fb_post_id`, `tiktok_video_id`, `publish_url`).
- Behavior on trigger:
   - If required credentials are missing, request is blocked with HTTP 409 and details per provider.
   - A critical workflow alert is recorded (Alert Center) for visibility and follow-up.
- Operator actions in UI:
   - Upload page shows a banner with missing items and quick links.
   - Use "Open Alert Center" to review full context and notes.
   - If backup env vars exist (e.g., `YOUTUBE_API_KEY_BACKUP`), click "Use Fallback" to apply them in-process.
   - After fallback, the UI automatically retries the last update (and clears the banner on success).
   - Use "Persist Fallback" to write current fallback values into `.env.local` for durability across restarts.
- Notes:
   - Fallback applies to the running server process only; it does not write `.env`.
   - "Persist Fallback" writes to `.env.local` only (safe override layer).
   - To fully rotate secrets, still update primary secrets in your secret store and `.env` out of band.

### Admin Token for Persistence (optional)
- Enable an admin guard by setting `PANEL_ADMIN_TOKEN` (prefer `.env.local`).
- When set, `POST /api/alerts/persist-fallback` requires either:
  - Header `x-admin-token: <PANEL_ADMIN_TOKEN>`, or
  - Header `Authorization: Bearer <PANEL_ADMIN_TOKEN>`
- Missing/invalid token returns `403 { error: "admin token required" }`.
- Current UI does not send this header; if you enable the guard, "Persist Fallback" from the UI will be blocked (403). We can add a small UI admin-token setting to include the header on request if desired.

### Credential Smoke Tests
PowerShell compatibility: scripts run on Windows PowerShell 5.1 and PowerShell 7+. They force TLS 1.2 and silence progress for reliable output.

- Run all checks:
```powershell
cd "C:\Dev\SL 18"
.\scripts\helpers\load-env.ps1
.\scripts\smoke_tests\credentials_ping.ps1
```
- Individual checks:
```powershell
.\scripts\smoke_tests\youtube_ping.ps1 -ShowUrl
.\scripts\smoke_tests\meta_ping.ps1 -ShowUrl
.\scripts\smoke_tests\tiktok_ping.ps1 -ShowUrl -Raw
```

- If your network blocks TikTok endpoints, allow offline validation (cookie shape only):
```powershell
.\scripts\smoke_tests\tiktok_ping.ps1 -AllowOffline
.\scripts\smoke_tests\credentials_ping.ps1 -AllowOffline
```

For more examples and flags, see `scripts/smoke_tests/README.md`.
