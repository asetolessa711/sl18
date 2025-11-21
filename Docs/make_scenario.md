# Make.com Scenario — SL18 Script + TTS + Music + Video Prep

## Overview
- Scenario Name: `SL18 ▸ Script, TTS, Music & CapCut`
- Schedule: 09:00 local (Africa/Addis_Ababa)
- Primary Data Source: Airtable `Episodes` table where `status = planned`
- Output: Script `.txt`, TTS `.mp3`, music stem `.mp3`, CapCut render `.mp4`, captions `.srt`, Airtable update, operator notification

## Module Sequence
1. **Scheduler** — daily trigger.
2. **Airtable: List Records** — fetch first planned episode for today or next date.
3. **Airtable: Lookup Persona** — fetch persona voice/style fields by `persona_code` (include franchise lookups via Airtable fields).
4. **OpenAI (ChatGPT)** — merge `prompts/script_template_en.txt` with persona/theme variables.
5. **Google Drive: Upload File** — store generated script in `/SL18/<franchise>/02_prompts` (falls back to default if lookup missing).
6. **ElevenLabs: Text-to-Speech** — render MP3 using persona `voice_id`.
7. **Google Drive: Upload Voiceover** — save TTS MP3 to the franchise audio folder.
8. **Music Generator (Udio or Mubert)** — render 30s stem using persona tone, `hook`, and `melody_reference`.
9. **Google Drive: Upload Music** — save stem MP3 to the franchise music folder.
10. **CapCut Automation** — feed template ID, script file, TTS URL, and music URL to render draft video.
11. **CapCut Export Captions** — export MP4 + SRT, upload to `/SL18/<franchise>/05_video_renders` (fallback to shared folder).
12. **Airtable Update** — attach Drive IDs, set `status = render_ready`.
13. **Notification** — email/Teams summary to operator and franchise lead.

> Tip: Add Airtable lookup fields (Drive folders, franchise contact emails) to the `Episodes` table so the scenario can access partner-specific routing without extra API calls.

## Error Handling
- If OpenAI fails, branch to a short email notification instructing the operator to spin up ChatGPT manually and update Airtable notes.
- Record any scenario errors by appending a row to `/SL18/06_logs/issues_YYYYMM.csv` using the Make.com "Add a row" Airtable utility or Drive append module.

## Required Connections
- Airtable API key with read/write access to base.
- Google Drive service account with access to `/SL18` folder.
- ElevenLabs project key with required voices.
- Udio or Mubert API key for music generation.
- CapCut Teams automation key + template ID (beta program).
- Meta Creator Studio token with IG account ID + FB page ID authorized for Reels upload.
- SMTP or Gmail connection for notifications.
- Optional: per-franchise Drive folder IDs and CapCut template overrides stored in Airtable lookups.

## Variable Map
| Make Variable | Source | Notes |
| --- | --- | --- |
| `episode_record` | Module 2 output | Entire row payload |
| `persona_record` | Module 3 output | Includes voice + music cues + franchise lookups |
| `script_text` | Module 4 response | Text body |
| `script_file_id` | Module 5 output | Drive file ID |
| `tts_file_id` | Module 7 output | Drive file ID |
| `music_file_id` | Module 9 output | Drive file ID |
| `video_file_id` | Module 12 output | Drive file ID |
| `caption_file_id` | Module 13 output | Drive file ID |

### Additional Variables (Publish Scenario)
| Make Variable | Source | Notes |
| --- | --- | --- |
| `youtube_video_id` | Publish Module 6 output | Needed for YouTube analytics |
| `meta_ig_media_id` | Publish Module 7 output | Required for IG insights |
| `meta_fb_post_id` | Publish Module 7 output | Required for FB reel insights |
| `tiktok_video_id` | Publish Module 8 output | Used for TikTok stats |

## Testing Checklist
- Run scenario with `Episodes` sample row set to today.
- Verify each module produces expected file in Drive.
- Confirm Airtable row updates with attachments and new status.
- Simulate OpenAI, music, or CapCut failure to ensure operator notification fires and fallback instructions apply.

## Deployment Tips
- Duplicate scenario for `Staging` with test persona before enabling schedule.
- Keep schedule disabled until Airtable fields and Drive folder IDs are confirmed.
- If music generator exposes rate limits, add router branch to reuse recent evergreen stem stored in `/SL18/04_music/backups`.
- For CapCut outages, add a router branch that emails operators with manual editing instructions and marks episode `scripted` instead of `render_ready`.
- Export scenario JSON backup after each edit; store in `automation/make/` with timestamp.
- When franchising, duplicate scenario per region or use routers keyed on `franchise_id` to isolate quotas and custom assets.

## Publish Fanout Scenario (sl18_publish_blueprint.json)
- Trigger hourly schedule until Airtable `Episodes` shows `render_ready` row.
- Lookup persona card for naming conventions and pull CapCut exports (MP4 + SRT) from Drive.
- Lookup franchise record for partner-specific notification list and Drive overrides.
- Upload to YouTube Shorts with captions enabled; capture returned video URL.
- Post identical vertical cut to Instagram and Facebook reels using Meta Creator Studio token and account IDs.
- Upload to TikTok via session cookie fallback; ensure caption includes `#SL18`.
- Update Airtable status to `published`, set `publish_url` to Shorts link, and send operator digest email (CC franchise owner if available).
- On empty queue, send heads-up notification; on any failure path, email escalation with manual fallback instructions and partner contact.
- Leverage Airtable lookup fields (e.g., `franchise_owner_email`) to dynamically build notification recipient lists.

## Analytics Sync Scenario (sl18_analytics_blueprint.json)
- Trigger daily at 06:30 local to keep dashboards fresh before morning standup.
- Airtable filter finds published episodes without recent `last_metrics_sync` timestamp.
- Hit YouTube Data API for view count, Meta Graph for reel plays, TikTok web endpoint for play count.
- Update Airtable metric fields and timestamp; email digest with counts.
- If queue empty, send lightweight notification; failures escalate with manual update instructions.

## Franchise & Multi-Tenant Notes
- Use `franchise_id` router branches or duplicate blueprints if partners require isolated API credentials.
- Prefix file names with `{{episode_record.fields.franchise_id}}` to ease revenue sharing and auditing.
- Store partner Drive folder IDs in Airtable lookup fields; fall back to global folders when blank.
- Include franchise owner email in notification modules to keep partners accountable for QC and publishing.
- Track scenario execution counts per franchise to inform ROI discussions and throttle heavy users.
