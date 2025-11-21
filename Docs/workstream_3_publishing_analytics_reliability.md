# Workstream 3 - Publishing & Analytics Reliability

## Objective
Lock down the multi-platform publishing automation and daily analytics loop so published clips reliably land on each channel and performance data feeds back into Airtable without manual babysitting.

## Prerequisites
- Workstream 2 Definition of Done achieved with at least two `render_ready` episodes.
- Valid `.env` credentials for YouTube, Meta (IG/FB), TikTok, and email/notification services.
- Make.com publishing and analytics blueprints imported and connected to the correct accounts.
- Airtable episodes populated with platform-ready metadata (titles, tags, caption files, media IDs where applicable).
- Access to `/SL18/06_logs` for storing API responses, issues, and analytics exports.

## Step-by-Step Checklist

### 1. Publishing Pipeline Dry Runs
- [ ] Duplicate one `render_ready` Airtable row and set status to `publish_test` for each target platform.
- [ ] Run the Make.com publish scenario manually; capture run ID and execution log.
- [ ] Verify uploads succeed (YouTube Shorts, Instagram Reels, Facebook Reels, TikTok) with correct title, captions, and thumbnail.
- [ ] Record returned media IDs in Airtable (`youtube_video_id`, `meta_ig_media_id`, etc.) and store API responses in `/SL18/06_logs/api_responses/`.
- [ ] Revert test posts or mark them unlisted/draft as needed after validation.

### 2. Credential & Token Hardening
- [ ] Confirm each API token lifespan; document rotation cadence in `/SL18/06_logs/token_rotations.csv`.
- [ ] Configure Make.com to read tokens from environment variables or secure storage rather than inline strings.
- [ ] Test token refresh or re-authentication steps (Meta long-lived token, TikTok session cookie regeneration).
- [ ] Establish reminder events (calendar or task) for token rotation windows.

### 3. Metadata Integrity
- [ ] Review Airtable formula or automation that assembles publishing copy (titles, descriptions, hashtags) for each platform.
- [ ] Validate caption files (SRT) meet platform upload requirements (encoding, character limits).
- [ ] Ensure thumbnail assets, if used, reside in Drive and have accessible IDs for the automation.
- [ ] Create Airtable validation view flagging rows with missing platform fields (`status_notes`).

### 4. Notification & Observability
- [ ] Configure Make.com error branches to send alerts to your chosen channel (email now, Slack later) with contextual data (episode, persona, failure stage).
- [ ] Enable success notifications summarizing published platforms and links.
- [ ] Set up Airtable automation to append status updates (e.g., `status_notes = "Published: YouTube, IG"`).
- [ ] Document recovery steps for common errors (quota exceeded, auth failure, caption mismatch) in `/SL18/06_logs/issues_YYYYMM.csv`.

### 5. Analytics Sync Validation
- [ ] Select at least two published episodes with platform media IDs populated.
- [ ] Run the analytics Make.com scenario manually; ensure it updates view metrics (`yt_views`, `meta_plays`, `tiktok_views`) and `last_metrics_sync`.
- [ ] Compare returned numbers with platform dashboards to confirm accuracy.
- [ ] Export the digest email or summary payload and archive in `/SL18/06_logs/analytics_exports/`.
- [ ] Log any missing fields or rate limit warnings for follow-up.

### 6. Dashboard & Reporting Alignment
- [ ] Update Airtable views or linked dashboards to highlight KPI deltas (daily, weekly trends).
- [ ] Confirm `Docs/dashboard_playbook.md` steps align with the actual data available from the analytics sync.
- [ ] Schedule a weekly analytics recap note in the human review workspace referencing updated metrics.
- [ ] Draft a lightweight report template (`/SL18/06_logs/analytics_weekly_template.md`) for future partners.

### 7. Scheduling Readiness
- [ ] Once manual dry runs pass, enable scheduling/triggers in Make.com for both publish and analytics scenarios.
- [ ] Configure safe guards such as Airtable filters (`status = render_ready`) and per-platform throttling to avoid accidental mass posts.
- [ ] Set up monitoring to ensure scenarios resume after maintenance or outages (Make.com scenario auto-restart, email alerts).
- [ ] Document the go/no-go checklist for switching schedules on/off in the human review workspace.

## Definition of Done
- Publishing automation successfully posts to each platform with logs, media IDs, and Airtable updates captured.
- Token management, notification, and error-handling processes documented with rotation reminders set.
- Analytics sync reliably updates Airtable metrics and archives digest outputs.
- Dashboards and weekly reporting templates reflect live data from the automation loop.
- Scheduling enabled with safeguards and recovery procedures tested.

## Handoff Notes
After Workstream 3 is complete, continue to monitor scheduled runs for one to two weeks while preparing for Workstream 4 (Franchise Enablement). Use the documented reports and issue logs to onboard additional collaborators when they join.
