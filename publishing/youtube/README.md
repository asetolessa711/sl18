# YouTube Upload Helper

This helper uploads a video to YouTube using OAuth user consent (required by the YouTube Data API for uploads). API keys or service accounts are not sufficient for uploads.

## Prereqs
- Python 3.10+
- Packages: `pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 python-dotenv`
- OAuth client JSON at `config/youtube_client_secret.json` (Desktop type)
- `.env` at the repo root (used only for other services; not required for OAuth flow here)

## OAuth Setup (Sanitized)

Follow these steps without committing secrets:

1. Create an OAuth 2.0 Client ID (Desktop or Web) in Google Cloud Console.
2. Add `http://localhost` as an authorized redirect URI.
3. Set these environment variables locally (e.g. in your non-committed `.env`):
  ```env
  GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID
  GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET
  YOUTUBE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN   # added after running the helper script
  ```
4. Run `node scripts/auth/get-youtube-refresh-token.mjs` to obtain a refresh token (writes nothing to disk; copy it manually).
5. Validate with:
  ```powershell
  & .\scripts\helpers\load-env.ps1
  .\scripts\diagnostics\validate-env.ps1 -Service YouTube
  ```

Do NOT commit real client IDs, secrets, or refresh tokens. GitHub push protection will block them.

## Files
- `publishing/youtube/upload_video.py` — upload script
- `publishing/youtube/metadata.json` — title/description/tags/privacy/playlist
- `publishing/youtube/thumbnails/` — optional thumbnails (first image used)
- `publishing/youtube/token.json` — created after first OAuth run (ignored by Git)

## Usage
```bash
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 python-dotenv
python publishing/youtube/upload_video.py "publishing/assets/skits/sample.mp4"
```
The script reads `metadata.json`, uploads the video, sets the first thumbnail found, and adds to a playlist if `playlistId` is provided.

## Notes
- For scheduled publishing set `privacyStatus` to `private` and schedule in YouTube Studio, or extend the script to set `publishAt`.
- Ensure the OAuth client belongs to the channel owner account with correct permissions.
- Store secrets only in your local `.env` (ignored by Git).
