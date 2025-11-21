# Analytics Feedback Loop

A lightweight loop to keep persona performance visible and feed insights back into scripting and publishing.

## Data Flow
- **Source**: Make.com `sl18_analytics_blueprint.json` runs daily at 06:30 Africa/Addis_Ababa.
- **Inputs**: Airtable Episodes rows marked `published` with platform IDs (`youtube_video_id`, `meta_ig_media_id`, `meta_fb_post_id`, `tiktok_video_id`) and linked `franchise_id` for multi-tenant rollups.
- **APIs**:
  - YouTube Data API `videos.list` for `statistics.viewCount`.
  - Meta Graph API `/{media-id}/insights?metric=plays` (IG) and `/{post-id}/insights?metric=video_views` (FB).
  - TikTok Web analytics endpoint using session cookie for `playCount`.
- **Outputs**: Airtable fields `yt_views`, `meta_plays`, `tiktok_views` plus refreshed `last_metrics_sync` timestamp.
- **Notifications**: Email digest summarises daily counts or pings ops when queue empty/failing.

## KPIs to Watch
- **24h View Velocity**: Compare views captured the morning after publish versus baseline target (e.g., 1K views on Shorts).
- **Hook Retention**: Track drop-offs by correlating low view counts with script `hook` themes to refine ideation.
- **Persona Spread**: Pivot Airtable data by `persona_code` to identify over/under-performing characters.
- **Franchise ROI**: Compare performance by `franchise_id` to inform revenue share adjustments and coaching.
- **Platform Bias**: Spot gains on TikTok vs YouTube to adjust music tempo or caption focus.

## Weekly Review Cadence
1. **Monday Standup**
   - Review latest digest email metrics.
   - Flag any anomalies (e.g., zero plays due to upload issue).
2. **Wednesday Midweek Tuning**
   - Use Airtable filters (`Episodes ▸ Needs Metrics`, `Episodes ▸ Published`) scoped to each `franchise_id` to ensure automation kept pace.
   - Adjust prompts or CapCut template overlays if persona consistency slipping.
3. **Sunday Retro**
   - Export Airtable view `Episodes ▸ Published` CSV to `/SL18/07_calendar/` for archival.
   - Annotate top performers in Airtable `notes`; capture learnings in `/SL18/06_logs/retro_YYYYMM.md` if needed.

## Manual Overrides
- If API quotas exceeded, temporarily pause scenario schedule and update metrics manually in Airtable.
- When Meta token expires, renew via Creator Studio and update `.env` + Make.com connection.
- Refresh TikTok session cookie monthly; log new value with date in `/SL18/06_logs/token_rotations.csv`.
- Document any manual edits in Airtable `notes` and the daily `/SL18/06_logs/issues_YYYYMM.csv` file.

## Extending the Loop
- Add secondary metrics (likes, comments, shares) once APIs confirmed stable.
- Push Airtable data into a Looker Studio report for trend visualisation.
- Trigger Slack alerts when `yt_views` or `tiktok_views` cross growth milestones to celebrate wins (per franchise channel).
- Experiment with A/B hooks: duplicate Episode entries with variant hooks and compare `yt_views` delta after 48h.
