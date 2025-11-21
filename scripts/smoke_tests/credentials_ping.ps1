Param(
  [switch]$AllowOffline
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$helperPath = Join-Path $repoRoot 'scripts\helpers\load-env.ps1'
if (Test-Path $helperPath) { . $helperPath | Out-Null }

$youtube = Join-Path $repoRoot 'scripts\smoke_tests\youtube_ping.ps1'
$meta    = Join-Path $repoRoot 'scripts\smoke_tests\meta_ping.ps1'
$tiktok  = Join-Path $repoRoot 'scripts\smoke_tests\tiktok_ping.ps1'

$failed = @()

if (Test-Path $youtube) {
  try { & $youtube -ShowUrl } catch { $failed += 'YouTube' }
}

if (Test-Path $meta) {
  try { & $meta -ShowUrl } catch { $failed += 'Meta' }
}

if (Test-Path $tiktok) {
  try {
    if ($AllowOffline) { & $tiktok -ShowUrl -AllowOffline } else { & $tiktok -ShowUrl }
  } catch { $failed += 'TikTok' }
}

if ($failed.Count) {
  Write-Host ("ERR • Credential checks failed: {0}" -f ($failed -join ', ')) -ForegroundColor Red
  exit 1
} else {
  Write-Host 'OK • All credential checks passed.' -ForegroundColor Green
}
