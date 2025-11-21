# Daily SOP — SL18 Clip Production

Approximate time: 30 minutes.

## 1. Prep (5 min)
- Open Airtable view `Episodes ▸ Planned` (filtered to your `franchise_id`) and confirm today's row is correct.
- Check `/SL18/01_assets` for updated logo/date slates.
- Review persona `style_notes` for any cultural red lines.

## 2. Script Review (7 min)
- Trigger the Make.com scenario (or run the prompt manually) if it has not started yet to generate script, TTS, and music assets.
- Read generated script in `/SL18/<franchise>/02_prompts/<date>_<franchise>_<persona>.txt` (fallback: `/SL18/02_prompts/`).
- Apply up to 5 edits directly in the Drive file; track major changes in Airtable `notes` field.

## 3. Asset Check (6 min)
- Listen to the ElevenLabs MP3 in `/SL18/<franchise>/03_audio` (fallback: `/SL18/03_audio`).
- Preview the generated music stem in `/SL18/<franchise>/04_music`; confirm melody alignment with persona brief.
- Record retries or swaps in Airtable `notes`.
- Open the CapCut cloud project produced by automation; ensure latest script/audio assets are linked.

## 4. QC Render (6 min)
- Watch the rendered MP4 in `/SL18/<franchise>/05_video_renders`.
- Confirm:
  - Audio levels balanced (voice audible above background track).
  - Auto captions match script edits; tweak SRT if needed.
  - No watermark or template artifacts.

- Check Make.com publish scenario digest for platform job IDs (confirm franchise listed correctly).
- Spot-check YouTube Shorts link; if missing, upload manually and paste URL in Airtable `publish_url`.
- Ensure IG/FB reels post succeeded; if automation failed, push via Creator Studio and record in `notes` (include `franchise_id`).
- Verify TikTok post; if cookie expired, upload manually, refresh secret, and store new cookie in secure vault.
- Append issues to `/SL18/06_logs/issues_YYYYMM.csv` (use template row).
- Update Airtable `status` to `published` once all platforms are live.

## Contingencies
- If render fails, publish evergreen backup clip stored in `/SL18/05_video_renders/backups`.
- If TTS quota exceeded, re-use previous MP3 and adjust script accordingly.
- If Airtable or Drive API down, fall back to manual script creation using prompt template.

## Weekly Retro
- Every Sunday, export Airtable view `Episodes ▸ Published` to `/SL18/07_calendar/` with date stamp.
- Review daily analytics digest emails and cross-check Airtable `yt_views`, `meta_plays`, `tiktok_views` versus platform dashboards.
- Update future hooks/themes based on top performers and note insights in Airtable `notes`.
