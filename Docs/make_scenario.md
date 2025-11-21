# Make.com Scenarios — SL18

This document unifies the detailed module sequence for asset preparation with high‑level references for all Make.com blueprints used in SL18. Always modify scenarios inside Make.com, then export and overwrite the matching JSON in `automation/make/`.

## Locations
- Blueprints: `automation/make/*.json`
- Environment template: `.env.example`
- Safety & setup: `AGENTS.md`, `Docs/airtable_setup.md`

---
## Asset Preparation Scenario (sl18_make_blueprint.json)
Daily pipeline that generates script, voice, music, rough cut video and updates Airtable.

### Module Sequence
1. Scheduler (daily trigger)
2. Airtable: List Episodes (pick next planned or today’s)
3. Airtable: Lookup Persona (voice/style + franchise lookups)
4. OpenAI: Generate script (`prompts/script_template_en.txt` + persona/theme variables)
5. Google Drive: Upload Script → `/SL18/<franchise>/02_prompts` (fallback to shared)
6. ElevenLabs: TTS render (persona `voice_id`)
7. Google Drive: Upload Voiceover
8. Music Generator (Udio/Mubert): 30s stem (persona tone + `hook` + `melody_reference`)
9. Google Drive: Upload Music
10. CapCut Automation: render draft video (template ID + assets)
11. CapCut Export Captions: MP4 + SRT → `/SL18/<franchise>/05_video_renders`
12. Airtable Update: attach Drive IDs, set `status = render_ready`
13. Notification: summary to operator + franchise lead

Tip: Use Airtable lookup fields (Drive folder IDs, contact emails) so routing requires no extra API calls.

### Variable Map
| Variable | Source | Notes |
|----------|--------|-------|
| `episode_record` | Step 2 | Full Episodes row |
| `persona_record` | Step 3 | Voice/music cues + franchise lookups |
| `script_text` | Step 4 | Generated script body |
| `script_file_id` | Step 5 | Drive ID |
| `tts_file_id` | Step 7 | Drive ID |
| `music_file_id` | Step 9 | Drive ID |
| `video_file_id` | Step 12 | Drive ID |
| `caption_file_id` | Step 11 | Drive ID |

### Additional Publish Variables
| Variable | Source | Notes |
|----------|--------|-------|
| `youtube_video_id` | Publish flow | Needed for YT analytics |
| `meta_ig_media_id` | Publish flow | IG insights |
| `meta_fb_post_id` | Publish flow | FB reel insights |
| `tiktok_video_id` | Publish flow | TikTok stats |

---
## Publish Fanout Scenario (sl18_publish_blueprint.json)
Hourly trigger while queue has `render_ready` episodes. Pull CapCut exports, apply naming conventions, push to platforms, update Airtable (`status = published`, set `publish_url`) and send digest emails (operator + franchise owner). On empty queue: heads‑up notification. On failure: escalation email with manual fallback guidance.

---
## Analytics Sync Scenario (sl18_analytics_blueprint.json)
Daily 06:30 local run. For published episodes missing a recent `last_metrics_sync`, pull:
- YouTube Data API (views)
- Meta Graph (reel plays)
- TikTok (web endpoint) (play count)
Then update Airtable metric fields + timestamp and issue summary email. Empty queue → lightweight notification. Failures → escalation with manual update steps.

Env vars: `AIRTABLE_BASE_ID`, `YOUTUBE_API_KEY`, `META_CREATOR_STUDIO_TOKEN`, `TIKTOK_SESSION_COOKIE`.

---
## Franchise & Multi‑Tenant Notes
- Branch by `franchise_id` or duplicate blueprints if partners need isolated credentials.
- Prefix output filenames with `{{episode_record.fields.franchise_id}}` for auditing & revenue sharing.
- Store partner Drive folder IDs in Airtable; fallback to global folders when blank.
- Include franchise owner email in notifications for accountability.
- Track executions per franchise to inform ROI and throttling.

---
## Change Process
1. Implement changes in Make.com.
2. Export scenario JSON.
3. Replace file in `automation/make/`.
4. Update this doc + `.env.example` for any new variables.

---
## Testing Checklist (Before Export)
- Script generation uses correct persona variables.
- TTS voice matches `voice_id`.
- Music stem length & mood align with persona tone.
- CapCut render completes; MP4 + SRT present.
- Airtable fields updated & `status` transitions properly.
- Notifications include correct recipients (operator + franchise owner).

## Deployment Tips
- Keep scenario modular; prefer small iterator branches for franchises.
- Avoid hand‑editing exported JSON except for trivial label adjustments.
- Rotate credentials; ensure secret scan patterns cover any new env vars.
- Blueprint: `automation/make/sl18_make_blueprint.json`
