# Airtable Setup — SL18 Calendar

## Base Structure
- **Base Name** `SL18 Calendar`
- **Tables** `Personas`, `Episodes`, `Caption Snippets` (optional)

### Personas Table
| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| `persona_code` | Single line text | `AA_EN` | Unique ID shared with automations |
| `franchise_id` | Link to Franchises | `core` | Routes assets and analytics |
| `display_name` | Single line text | `Addis Analyst` | Friendly name for human review |
| `language` | Single select | `en`, `om` | ISO code for script + captions |
| `voice_id` | Single line text | `voice-addis-analyst-01` | Matches ElevenLabs voice |
| `style_notes` | Long text | `Dry wit, never insults elders` | Prompt guidance |
| `sign_off` | Single line text | `Stay sharp, Addis!` | Persona CTA |

### Episodes Table
| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| `date` | Date | `2025-11-15` | Schedule; set as primary |
| `persona_code` | Link to Personas | `AA_EN` | Enables lookup of voice/tone |
| `franchise_id` | Link to Franchises | `ng_lagos` | Drives folder/API routing |
| `theme` | Single select | `AI vs Aunties` | Use daily rotation |
| `hook` | Long text | `When your auntie's WhatsApp rumors get fact-checked by AI` | Seed for script |
| `melody_reference` | Single line text | `Amhara wedding classic` | Guides music prompt |
| `script_file` | Attachment | Drive link ID | Added by automation |
| `tts_file` | Attachment | MP3 ID | Added by automation |
| `music_file` | Attachment | MP3 ID | Added by automation |
| `video_file` | Attachment | MP4 ID | Exported by CapCut automation |
| `caption_file` | Attachment | SRT/VTT ID | Exported captions |
| `publish_url` | URL | `https://youtu.be/...` | Filled once live |
| `youtube_video_id` | Single line text | `abc123XYZ` | Captured from Shorts upload |
| `meta_ig_media_id` | Single line text | `17890...` | Returned IG media ID |
| `meta_fb_post_id` | Single line text | `12345_6789` | Returned FB reel post ID |
| `tiktok_video_id` | Single line text | `7250...` | Captured from TikTok upload |
| `drive_scripts_id` | Lookup (Franchises) | `1AbC...` | Optional override for script storage |
| `drive_audio_id` | Lookup (Franchises) | `1Def...` |  |
| `drive_music_id` | Lookup (Franchises) | `1GhI...` |  |
| `drive_video_id` | Lookup (Franchises) | `1JkL...` |  |
| `drive_captions_id` | Lookup (Franchises) | `1MnO...` |  |
| `franchise_owner_email` | Lookup (Franchises) | `lagos.ops@sl18.africa` | Used for notifications |
| `yt_views` | Number | `1543` | Updated by analytics automation |
| `meta_plays` | Number | `982` | Updated by analytics automation |
| `tiktok_views` | Number | `2120` | Updated by analytics automation |
| `last_metrics_sync` | Date/Time | `2025-11-15 09:00` | Tracks last analytics pull |
| `status` | Single select | `planned`, `scripted`, `render_ready`, `published`, `fallback` | Flow control |
| `notes` | Long text | `Manual tweaks, QC notes` | Optional |

### Franchises Table
| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| `franchise_id` | Primary text | `ng_lagos` | Shortcode used across automations |
| `display_name` | Single line text | `SL18 Lagos` | Human-readable label |
| `country` | Single select | `Nigeria` | Partner geography |
| `owner_name` | Single line text | `Kojo Mensah` | Partner lead |
| `owner_contact` | Email | `lagos.ops@sl18.africa` | Partner lead email |
| `drive_scripts_id` | Single line text | `1AbC...` | Folder IDs for per-partner storage |
| `drive_audio_id` | Single line text | `1Def...` |  |
| `drive_music_id` | Single line text | `1GhI...` |  |
| `drive_video_id` | Single line text | `1JkL...` |  |
| `drive_captions_id` | Single line text | `1MnO...` |  |
| `make_webhook_secret` | Single line text | `lagos-secret` | Optional auth for partner-triggered runs |
| `revenue_split` | Percent | `0.35` | Partner rev-share |
| `status` | Single select | `prospect`, `active`, `paused` | Lifecycle |
| `notes` | Long text | `DJ Kojo pilot 2026 Q1` | |

### Caption Snippets Table (Optional)
| Field | Type | Notes |
| --- | --- | --- |
| `name` | Primary text | E.g., `TikTok Energy` |
| `platform` | Single select | `tik`, `yt`, `ig`, `fb` |
| `copy_block` | Long text | Paste-ready caption text |
| `hashtag_list` | Long text | `#AddisLife #Comedy` |

## Views
- `Episodes ▸ Planned` filter `status = planned` and `date <= TODAY()`
- `Episodes ▸ Rendered` filter `status = rendered`
- `Episodes ▸ Published` filter `status = published`
- `Episodes ▸ Needs Metrics` filter `status = published` AND (`last_metrics_sync` empty OR older than 24h)
- `Episodes ▸ Franchise Ops` filter by `franchise_id` for partner-specific boards
- `Franchises ▸ Active` filter `status = active`
- `Personas ▸ Ops` show all fields

## Automations
1. **Daily reminder**: if `status = planned` and `date = TODAY()` send Slack/Email.
2. **Script handoff**: when Make.com uploads script/TTS/music, set `status = scripted`.
3. **Render flag**: once CapCut export uploads video/caption files, flip `status` to `render_ready`.
4. **Publish tracker**: when `status` changes to `published`, append a line in `/SL18/06_logs/issues_YYYYMM.csv` with runtime notes.
5. **Franchise ledger**: when `yt_views` crosses agreed thresholds, create/update record in `Franchises` table rollup for revenue share.

## Data Hygiene Tips
- Lock columns referenced by Make.com to prevent accidental rename.
- Use Airtable color coding on persona/language to spot mismatches.
- Export weekly backups to `/SL18/07_calendar` (CSV) via Airtable download or automation.

## Smoke Tests
PowerShell compatibility: scripts are written for Windows PowerShell 5.1 and also run on PowerShell 7+. They enable TLS 1.2 and suppress progress for clean output.

- Load env and ping Personas (default) or Episodes:

```powershell
cd "C:\Dev\SL 18"
.\scripts\helpers\load-env.ps1
# Generic ping (uses AIRTABLE_PERSONAS_TABLE or Personas)
.\scripts\smoke_tests\airtable_ping.ps1 -ShowUrl
# Prefer Episodes table from env
.\scripts\smoke_tests\episodes_ping.ps1 -ShowUrl
```

- Ping by explicit table ID or human name (requires metadata scope):

```powershell
.\scripts\smoke_tests\airtable_ping.ps1 -Table tblXXXXXXXXXXXX -ShowUrl
.\scripts\smoke_tests\airtable_ping.ps1 -TableName "Episodes" -ShowUrl
```

- Override base/key inline (useful for staging):

```powershell
.\scripts\smoke_tests\airtable_ping.ps1 -BaseId appXXXXXXXXXXXX -ApiKey patXXXXXXXXXXXX -Table tblXXXXXXXXXXXX -ShowUrl -Raw
```

See also: `scripts/smoke_tests/README.md` for a full overview and examples.
