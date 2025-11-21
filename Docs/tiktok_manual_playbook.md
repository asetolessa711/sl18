# TikTok Manual Publishing Playbook (SL18)

## 1. Scope & Principles

- TikTok is a **manual-only** destination for now.
- SL18 is responsible for **generating assets + metadata**; humans are responsible for **posting**.
- The design mirrors other publishers (YouTube, Meta) so that a future automated TikTok publisher can plug in later.

---

## 2. TikTok User Flows

### 2.1 Eligibility by Franchise / Persona

Not every episode needs TikTok. Use the Airtable + franchise config to decide:

- `tiktok_enabled = true` when:
  - Franchise is short-form heavy (e.g. comedy, music clips, fast skits), **or**
  - Persona/series is explicitly TikTok-focused (e.g. "SL18 Love Stories", "Remix Friday").
- `tiktok_enabled = false` when:
  - Long-form / documentary style content where vertical clips are not desired, **or**
  - Partner or franchise owner opts out of TikTok.

Franchise / persona rules should be encoded once in franchise config and/or Airtable (e.g., a per-franchise default for `tiktok_enabled`).

### 2.2 Edge Cases: Length & Format

TikTok exports target short-form vertical video. Define per-series rules, but the default is:

- **Target duration**: up to **60 seconds** (short-form default).
- **If an episode or candidate clip exceeds the target duration**:
  - Option A: **Auto-trim** to the configured max seconds for that franchise/series, **or**
  - Option B: Mark episode/clip as **not TikTok-eligible**.

Recommended default behavior:

- If the pipeline can safely generate a short vertical cut → auto-trim to the series-specific max (e.g. 60s or 90s) and proceed.
- If trimming is impossible or content is awkward in vertical → set an Airtable flag (e.g. `tiktok_post_status = "Not needed"` and a note in `tiktok_notes`) so operators do not go hunting for it.

### 2.3 Ownership & Timing

Define a clear role:

- **Role name**: `TikTok Operator` (could be producer, social media manager, or a shared role).

Timing expectations:

- For episodes with `tiktok_enabled = true` and `tiktok_export_ready = true`:
  - Target: TikTok post **within 24 hours** of YouTube/Meta publish.
  - If delayed, operator should leave a short note in `tiktok_notes`.

---

## 3. Export Outputs (What SL18 Produces)

For each TikTok-eligible episode (or clip), SL18 should export a small bundle of files.

### 3.1 Directory & Naming Convention

Base path (example):

```text
exports/tiktok/{episodeId}/
  video_tiktok.mp4
  caption_tiktok.txt
  metadata_tiktok.json
```

- `episodeId` should match the internal ID used by SL18 / Airtable so it can be joined back easily.
- The path `exports/tiktok/{episodeId}/` should be written back into Airtable as `tiktok_export_path`.

### 3.2 Video Spec: `video_tiktok.mp4`

- **Container**: MP4
- **Video codec**: H.264
- **Audio codec**: AAC
- **Resolution**: 1080×1920 (9:16 vertical)
- **FPS**: choose one and standardize (recommended: **30 FPS**)
- **Max duration**:
  - Default: **≤ 60 seconds** (can be extended to 90s per franchise/series configuration).
- **Safe zones**:
  - Avoid placing critical text/UI in the outer ~10% of top/bottom edges.
  - Leave space for TikTok’s UI overlays (caption, buttons, profile info).

### 3.3 Caption Spec: `caption_tiktok.txt`

Plain-text file with a simple structure:

```text
{HOOK_LINE}
{OPTIONAL_SECOND_LINE}

#sl18 #aimusic #aifilm #lovestory #shortfilm
```

Guidelines:

- **First line (hook)**:
  - Strong opening line.
  - Target length: **≤ 60–80 characters**.
- **Second line (optional)**:
  - 1‑line context, lyric, or continuation.
- **Final lines**:
  - Hashtags.
  - Default set might include: `#sl18`, `#aimusic`, `#aifilms`, `#lovestory`, `#shortfilm` (tune per series).
- **Total caption length**:
  - Recommended: **≤ 300 characters**, even though TikTok allows more.
- **Language**:
  - Default: English (`en`), **or** use a language field from Airtable (`language`, `locale`, etc.) to localize hook / hashtags.

### 3.4 Metadata Spec: `metadata_tiktok.json`

JSON sidecar to record what was generated and how:

```json
{
  "episodeId": "ep_2025_11_21_001",
  "title": "SL18 – Falling Skies (Clip)",
  "hook": "Would you fall for someone who fell from the sky?",
  "hashtags": ["sl18", "aimusic", "aifilms", "lovestory"],
  "durationSeconds": 37,
  "createdAt": "2025-11-21T18:32:00Z",
  "createdBy": "sl18-pipeline",
  "language": "en"
}
```

Required fields (minimum):

- `episodeId`: the canonical episode/clip ID.
- `durationSeconds`: numeric duration.
- `createdAt`: ISO timestamp when the export was generated.
- `createdBy`: e.g. `"sl18-pipeline"`.

Recommended additional fields:

- `title`: human-friendly title.
- `hook`: first line used in the caption.
- `hashtags`: array of hashtags without `#` prefix (or with; pick one convention).
- `language`: language code (e.g. `"en"`).

This JSON becomes extremely valuable if you later automate TikTok posting or run analytics across clips.

---

## 4. Airtable Schema & Workflow Integration

### 4.1 When to Produce TikTok Exports

Default behavior:

- When the pipeline renders YouTube/Meta assets **and** the episode row has `tiktok_enabled = true`, generate TikTok exports in the same pass.
- If a franchise/series does **not** want TikTok by default, it should:
  - Set `tiktok_enabled = false` in Airtable, or
  - Use franchise config to default `tiktok_enabled` and sync that into Airtable.

### 4.2 Suggested Airtable Fields

Add or align the following fields on the Episodes table:

- `tiktok_enabled` (checkbox / boolean)
  - Whether this episode should participate in TikTok export.

- `tiktok_export_ready` (checkbox / boolean)
  - Set to **true** by the pipeline when `video_tiktok.mp4`, `caption_tiktok.txt`, and `metadata_tiktok.json` exist and pass basic validation.

- `tiktok_export_path` (single line text)
  - Example: `exports/tiktok/ep_2025_11_21_001/`.
  - Written by the pipeline when export is complete.

- `tiktok_post_status` (single select)
  - Suggested options:
    - `Not needed`
    - `Not ready`
    - `Ready`
    - `Posted`
    - `Skipped`
  - Pipeline behavior:
    - Set to `Not needed` when `tiktok_enabled = false` or episode is not TikTok-eligible.
    - Set to `Ready` when `tiktok_export_ready = true`.
  - Operator behavior:
    - Set to `Posted` or `Skipped` after attempting to post.

- `tiktok_posted_at` (datetime)
  - Set by operator when the video is actually posted.

- `tiktok_posted_by` (single line text or linked user)
  - Name/handle of the operator who posted.

- `tiktok_post_url` (URL)
  - The TikTok share URL.

- `tiktok_notes` (long text)
  - Freeform notes: issues, context, reasons for `Skipped`, etc.

This structure allows:

- The pipeline to drive export status (`tiktok_enabled`, `tiktok_export_ready`, `tiktok_export_path`, initial `tiktok_post_status`).
- Human operators to record posting and issue details (`tiktok_post_status`, `tiktok_posted_at`, `tiktok_posted_by`, `tiktok_post_url`, `tiktok_notes`).

---

## 5. Operator SOP (TikTok Manual Posting)

This SOP assumes `Docs/tiktok_manual_playbook.md` is the canonical reference.

### 5.1 Before Posting

1. Open Airtable Episodes.
2. Filter for rows where:
   - `tiktok_enabled = true`
   - `tiktok_export_ready = true`
   - `tiktok_post_status = Ready`
3. For each matching episode:
   - Note the `episodeId` (or primary key).
   - Locate the export folder:
     - `exports/tiktok/{episodeId}/`
   - Confirm that the folder contains:
     - `video_tiktok.mp4`
     - `caption_tiktok.txt`
     - `metadata_tiktok.json`

### 5.2 Posting in the TikTok App

On your phone (TikTok Operator):

1. Transfer `video_tiktok.mp4` to your phone if needed (e.g., via shared drive or cloud sync).
2. Open the TikTok app and tap the **+** button to upload.
3. Select `video_tiktok.mp4` for the relevant episode.
4. In the caption field:
   - Open `caption_tiktok.txt` on your device.
   - Copy all text and paste into TikTok's caption field.
5. Choose a thumbnail if needed (e.g., scrub frame and select cover).
6. Adjust privacy settings according to SL18 policy (e.g., default **Public** unless otherwise specified).
7. Post the video.

### 5.3 After Posting

1. Copy the TikTok video URL (Share → Copy link).
2. In Airtable for that episode, update:
   - `tiktok_post_status` → `Posted`
   - `tiktok_posted_at` → current date/time.
   - `tiktok_posted_by` → your name or operator ID.
   - `tiktok_post_url` → the copied URL.
3. If anything went wrong (e.g., content rejected, technical issue):
   - Set `tiktok_post_status` → `Skipped`.
   - Add a short explanation in `tiktok_notes`.

### 5.4 Quality Checks

For each posted video, verify:

- Video plays correctly (no unexpected black bars, no muted audio).
- Framing looks intentional on vertical (no critical text cut off by UI).
- Caption follows SL18 tone guidelines and matches the generated hook.
- Hashtags are present and not obviously banned/sensitive.

If you spot issues that should be fixed for future episodes:

- Add a brief note in `tiktok_notes` for that row.
- Optionally log systematic issues in the content/prompt templates so the pipeline can be improved.

---

## 6. Governance & Guardrails

### 6.1 Content Restrictions

TikTok clips must comply with:

- Age-appropriateness rules (no explicit sexual content, extreme violence, or hate).
- No misleading deepfakes of real, identifiable people.
- Platform community guidelines (TikTok) and SL18 / partner policies (e.g., UNICEF).

If an episode or clip risks violating these rules:

- Mark `tiktok_post_status = Not needed` or `Skipped`.
- Capture rationale in `tiktok_notes`.
- Escalate to editorial / governance as needed.

### 6.2 Brand Consistency

Guidelines:

- Include `#sl18` (and other core brand tags) in captions unless a partner specifies otherwise.
- If desired for transparency, consider adding an "AI-generated" note either in the caption or as part of the creative, especially for sensitive partnerships.

These rules strengthen optics with partners and platforms and reduce future friction.

---

## 7. Future-Proofing for Later Automation

Internally, SL18 should treat TikTok as a **manual publisher** that still follows the same conceptual interface as automated publishers (YouTube, Meta):

- Inputs: episode metadata, script, persona, franchise configuration.
- Outputs: `video_tiktok.mp4`, `caption_tiktok.txt`, `metadata_tiktok.json`.
- Side effect: Airtable fields updated to indicate `tiktok_export_ready` and `tiktok_post_status`.

Later, if TikTok offers a safe, official API and you decide to automate:

- Reuse `metadata_tiktok.json` as the source of truth for title, hook, hashtags, and language.
- Implement a `tiktokPublisher` that:
  - Reads `video_tiktok.mp4` + `metadata_tiktok.json`.
  - Calls TikTok's API instead of relying on human posting.
  - Updates the same Airtable fields (`tiktok_post_status`, `tiktok_posted_at`, `tiktok_post_url`).

Because the manual flow already matches this interface, you can swap in automation later without rewriting upstream pipeline logic or Airtable schema.
