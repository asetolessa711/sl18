# Workstream 2 - Automated Asset Pipeline

## Objective
Harden the end-to-end automation that converts an Airtable episode row into finished CapCut assets (script, TTS, music, video) while preserving manual QC checkpoints.

## Prerequisites
- Workstream 1 Definition of Done achieved and documented.
- At least one Airtable `Episodes` record in status `planned` with real persona, hook, and franchise metadata.
- Valid `.env` credentials for Airtable, ElevenLabs, Udio/Mubert (at least one), Google Drive, and CapCut.
- Make.com scenarios imported (`sl18_make_blueprint.json`) and connected to the appropriate accounts.
- Access to the human review workspace with ability to log QC results.

## Step-by-Step Checklist

### 1. Prep Pilot Episodes
- [ ] Select or create two representative Airtable rows (`planned`) covering different personas/franchises.
- [ ] Attach script prompt references (`script_file`) and any theme notes required for high-quality outputs.
- [ ] Confirm Drive folder IDs exist for the target franchise (scripts, audio, music, video, captions).
- [ ] Flag pilot rows with a temporary tag (`pilot_w2`) for easy filtering.

### 2. Validate Prompt & Script Generation
- [ ] Open the Make.com asset scenario and run it manually for the first pilot row (script module only if possible).
- [ ] Inspect generated script text; ensure persona tone, sign-off, and hook alignment match expectations.
- [ ] Save script output to `/SL18/02_prompts/<date>_pilot_<persona>.txt` and link back to Airtable `script_file`.
- [ ] Log feedback in `/SL18/06_logs/issues_YYYYMM.csv` if tone adjustments are needed.

### 3. Harden TTS Stage
- [ ] Execute the TTS module using the generated script; verify ElevenLabs voice matches persona `voice_id`.
- [ ] Check audio duration and pronunciation; rerun with adjusted prompt markup if required.
- [ ] Store MP3 in `/SL18/03_audio/<persona>/<date>/` and update Airtable `tts_file` + `drive_audio_id`.
- [ ] Document any SSML or prompt tweaks used for clarity in the persona brief.

### 4. Harden Music Generation Stage
- [ ] Trigger music module (Udio/Mubert) with persona tone variables.
- [ ] Confirm audio length matches target video duration (30–45 seconds) and export naming matches convention.
- [ ] Upload stem to `/SL18/04_music/<persona>/<date>/` and set Airtable `music_file` + `drive_music_id`.
- [ ] Capture fallback loop reference in case API quota is exhausted.

### 5. CapCut Automation & Asset Assembly
- [ ] Run the CapCut automation module with script, TTS, and music inputs.
- [ ] Inspect rendered MP4/SRT pair in `/SL18/05_video_renders/<persona>/<date>/`.
- [ ] Verify captions sync, audio balance, and template layers (intro/outro) match the persona style guide.
- [ ] Update Airtable `video_file`, `caption_file`, and corresponding Drive IDs.

### 6. Quality Control & Manual Touchpoints
- [ ] Post generated assets to the human review workspace thread tagged `[Review] pilot_w2`.
- [ ] Collect self-review notes (since single operator) referencing cultural guardrails and virality hooks.
- [ ] Apply any manual edits (CapCut, audio trims) and re-upload final assets, preserving version history.
- [ ] Move Airtable status from `planned` to `render_ready` once QC passes.

### 7. Error Handling & Observability
- [ ] Configure Make.com error branches to send alerts to your chosen notification channel (email, future Slack).
- [ ] Document failure codes (API 4xx/5xx) and resolutions in `/SL18/06_logs/issues_YYYYMM.csv`.
- [ ] Ensure Airtable automation writes a status note (`status_notes`) with last successful stage.
- [ ] Capture screenshots or exports of Make.com run history for audit.

### 8. Repeatability & Scaling Prep
- [ ] Run the full scenario on the second pilot row; confirm consistent outputs.
- [ ] Create a filtered Airtable view `Episodes ▸ Ready for Pipeline` that feeds the automation schedule.
- [ ] Draft SOP snippet summarizing rerun steps when a single stage fails (script, TTS, music, video).
- [ ] Record time-to-complete for each module to benchmark throughput before wider rollout.

## Definition of Done
- Two pilot episodes processed end-to-end with assets stored in the canonical Drive structure and Airtable fields populated.
- Persona tones validated and any prompt/SSML adjustments added to persona briefs.
- Make.com run logs clean with documented resolutions for any transient failures.
- Automation can be triggered manually with predictable, repeatable results and clear rollback steps.
- Human review workspace contains the pilot review thread with final approval notes.

## Handoff Notes
Once Workstream 2 is complete, promote the asset pipeline to limited beta by enabling scheduled runs for a single franchise. Coordinate with Workstream 3 owners to ensure publishing automation can ingest the rendered assets without schema changes.
