# Smoke Tests

These PowerShell scripts validate connectivity and credentials for SL18.

PowerShell compatibility
- Designed for Windows PowerShell 5.1 and PowerShell 7+
- Scripts explicitly enable TLS 1.2 and silence progress for reliable output
- Avoids PS7-only operators (`?.`, `??`) to run cleanly on PS 5.1

Output prefixes
- `OK •`: Check succeeded.
- `WARN •`: Non-fatal condition (e.g., TikTok offline cookie-shape valid) — proceed with caution.
- `ERR •`: Check failed — investigate credentials, network, or IDs.
These prefixes make it easy to skim logs and can be parsed in CI to flag failures.

Quick start
```powershell
cd "C:\Dev\SL 18"
# Load env from .env/.env.local (root + backend)
.\scripts\helpers\load-env.ps1

# Run all credential checks
.\scripts\smoke_tests\credentials_ping.ps1

# Airtable pings
.\scripts\smoke_tests\airtable_ping.ps1 -ShowUrl
.\scripts\smoke_tests\episodes_ping.ps1 -ShowUrl

# Individual credentials
.\scripts\smoke_tests\youtube_ping.ps1 -ShowUrl
.\scripts\smoke_tests\meta_ping.ps1 -ShowUrl
.\scripts\smoke_tests\tiktok_ping.ps1 -ShowUrl

# TikTok (offline validation of cookie shape if network blocks)
.\scripts\smoke_tests\tiktok_ping.ps1 -AllowOffline
.\scripts\smoke_tests\credentials_ping.ps1 -AllowOffline
```

Arguments overview
- `airtable_ping.ps1`:
  - `-Table <tblId>`: Table ID (e.g., `tblXXXXXXXXXXXX`)
  - `-TableName <name>`: Human-readable table name (uses metadata lookup)
  - `-UseEpisodes`: Prefer Episodes table from env
  - `-BaseId`, `-ApiKey`: Override Airtable credentials
  - `-ShowUrl`, `-Raw`: Print URL / raw error body
- `episodes_ping.ps1`: Convenience wrapper over `airtable_ping.ps1 -UseEpisodes`
- `youtube_ping.ps1` (API key):
  - `-ApiKey`: Override `YOUTUBE_API_KEY`
  - `-ChannelId <UC...>`: Validate a specific channel by ID (channels endpoint)
  - `-ForUsername <name>`: Validate by legacy username (channels endpoint)
  - `-UseChannels`: Force channels endpoint; requires ChannelId or ForUsername
  - `-ShowUrl`, `-Raw`
- `youtube_oauth_ping.mjs` (OAuth):
  - Uses `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` to call `channels?mine=true`
  - Prints `OK • YouTube OAuth • channel=<title> id=<id>` or `ERR • ...`
- `meta_ping.ps1`:
  - `-Token`, `-IgAccountId`, `-PageId` (overrides)
  - `-ShowUrl`, `-Raw`
- `tiktok_ping.ps1`:
  - `-SessionCookie`: Override `TIKTOK_SESSION_COOKIE`
  - `-AllowOffline`: Passes if cookie shape is valid, even if network blocked
  - `-ShowUrl`, `-Raw`
- `credentials_ping.ps1`:
  - Runs YouTube, Meta, TikTok checks; supports `-AllowOffline` for TikTok

Exit codes
- `0`: All checks passed or acceptable (e.g., offline TikTok allowed)
- `1`: One or more checks failed

Notes
-- Always prefer `.env.local` for local overrides; scripts load both root and backend `.env` and `.env.local`.
-- For TikTok, use a valid `sessionid` cookie value captured from an authenticated browser session.

Examples
```powershell
# YouTube channel lookup (public example)
.\scripts\smoke_tests\youtube_ping.ps1 -ChannelId UC_x5XG1OV2P6uZZ5FSM9Ttw -ShowUrl
# or by legacy username
.\scripts\smoke_tests\youtube_ping.ps1 -ForUsername GoogleDevelopers -ShowUrl

# YouTube OAuth (mine=true)
node -r dotenv/config scripts/smoke_tests/youtube_oauth_ping.mjs
```
