# YouTube Upload Helper

Uploads a video to YouTube using OAuth user consent (required for uploads; API key alone is insufficient). This guide merges sanitized setup steps with a verified configuration summary.

## Prereqs
- Python 3.10+
- Install deps:
  ```bash
  pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 python-dotenv
  ```
- OAuth client JSON at `config/youtube_client_secret.json` (Desktop or Web)
- Local `.env` file (not committed) containing YouTube OAuth env vars

## OAuth Setup (Sanitized)
1. Create an OAuth 2.0 Client (Desktop or Web) in Google Cloud Console.
2. Add `http://localhost` as an authorized redirect URI.
3. Set these environment variables locally:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID
   GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET
   GOOGLE_OAUTH_REDIRECT_URI=http://localhost
   ```
4. Run the helper to obtain a refresh token:
   ```bash
   node scripts/auth/get-youtube-refresh-token.mjs
   ```
5. Copy the printed refresh token into your local `.env`:
   ```env
   YOUTUBE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
   ```
6. Validate:
   ```powershell
   & .\scripts\helpers\load-env.ps1
   .\scripts\diagnostics\validate-env.ps1 -Service YouTube
   ```

Do NOT commit real client IDs, secrets, or refresh tokens.

## Verified Setup Summary (Nov 16, 2025)
The workflow was tested end‑to‑end: client created, redirect URI registered, refresh token captured, validation script confirmed access.

## Files
- `publishing/youtube/upload_video.py` — main upload script
- `publishing/youtube/metadata.json` — title / description / tags / privacy / playlist
- `publishing/youtube/thumbnails/` — optional thumbnails (first image used)
- `publishing/youtube/token.json` — created after first OAuth run (ignored by Git)
- `scripts/auth/get-youtube-refresh-token.mjs` — refresh token helper (no secrets inside)

## Usage
```bash
python publishing/youtube/upload_video.py "publishing/assets/skits/sample.mp4"
```
The script reads `metadata.json`, uploads the video, applies first thumbnail, adds to playlist if `playlistId` provided.

## Notes
- For scheduled publishing set `privacyStatus` to `private` and schedule in Studio or extend script with `publishAt`.
- Ensure OAuth client belongs to channel owner or delegated account with upload scope.
- Store secrets only in local `.env` (ignored by Git).
- Rotate refresh tokens periodically and re-run validation.
