# Credential Rotation Checklist

Real secrets were exposed earlier in `.env.example`, so rotate them immediately and keep only placeholder values in repo files. Use this checklist whenever credentials leak or expire.

## 1. Airtable Personal Access Token
1. Visit https://airtable.com/create/tokens
2. Revoke the previous token.
3. Create a new token with scopes `data.records:read`, `data.records:write`, and `schema.bases:read` for base `SL18 Calendar`.
4. Update values in:
   - Local `.env` (`AIRTABLE_API_KEY`)
   - Azure DevOps variable group `SL18-Secrets`
   - Any running automations (Make.com, local scripts)

## 2. Airtable Base ID
- No rotation needed, but confirm `.env` uses `appSLjS0EpMV9hk6Z` and `AIRTABLE_PERSONAS_TABLE` uses the table ID `tblXXXXXXXXXXXX` to avoid NOT_FOUND errors.

## 3. ElevenLabs API & Project IDs
1. Open https://elevenlabs.io/app/account
2. Revoke old key and generate new API key.
3. Update `.env` (`ELEVENLABS_API_KEY`, `ELEVENLABS_PROJECT_ID`) and Azure DevOps secrets.
4. Re-test with `curl https://api.elevenlabs.io/v1/voices -H "xi-api-key: <new key>"`.

## 4. OpenAI API Key
1. Go to https://platform.openai.com/account/api-keys
2. Create a new secret key; delete the old one.
3. Update `.env` (`OPENAI_API_KEY`) and Azure DevOps.
4. Trigger a quick smoke test: `curl https://api.openai.com/v1/models -H "Authorization: Bearer <key>"`.

## 5. YouTube API Key & OAuth Client
- API key: regenerate via Google Cloud Console and update `.env` (`YOUTUBE_API_KEY`).
- OAuth client (for uploads): if compromised, delete the old client ID, create a new Desktop OAuth client, place JSON at `config/youtube_client_secret.json`, delete `publishing/youtube/token.json`, and re-auth on next upload.

## 6. Google Service Account JSON
- Create a new key under IAM & Admin → Service Accounts → Keys.
- Replace `config/google_service_account.json` locally (do not commit).
- Update `.env` if folder IDs changed.

## 7. Azure DevOps & Automation Secrets
- After rotating each key, update the `SL18-Secrets` variable group and rerun any pipeline or automation that depends on it.
- Document rotation date in `/SL18/06_logs/token_rotations.csv`.

## 8. Validation
- Run smoke tests:
  ```powershell
  .\scripts\smoke_tests\airtable_ping.ps1 -Verbose
  python scripts/smoke_tests/drive_list.py
  curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=$env:YOUTUBE_API_KEY"
  ```
- Ensure `.env.example` stays placeholder-only to prevent future leaks.

## 9. Communication
- Note rotations in the human review workspace or ops log so future collaborators know which credentials changed and why.

Repeat this checklist whenever secrets are exposed or per your regular rotation cadence (e.g., quarterly).
