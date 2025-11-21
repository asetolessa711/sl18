param(
    [string]$Token,
    [string]$IgAccountId,
    [string]$PageId,
    [switch]$ShowUrl,
    [switch]$Raw
)

$ProgressPreference = 'SilentlyContinue'
try { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 } catch { }

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$helperPath = Join-Path $repoRoot 'scripts\helpers\load-env.ps1'
if (Test-Path $helperPath) { . $helperPath | Out-Null }

$resolvedToken = if ($Token) { $Token } else { $env:META_CREATOR_STUDIO_TOKEN }
if (-not $resolvedToken) { Write-Error 'Missing META_CREATOR_STUDIO_TOKEN'; exit 1 }

function Invoke-GraphGet {
    param([string]$Path, [hashtable]$Params)
    $base = 'https://graph.facebook.com/v18.0'
    $qs = @()
    foreach ($k in $Params.Keys) { $qs += ("{0}={1}" -f $k, [System.Uri]::EscapeDataString([string]$Params[$k])) }
    $uri = "$base/$Path?" + ($qs -join '&')
    if ($ShowUrl) { Write-Host "URL: $uri" -ForegroundColor DarkCyan }
    return Invoke-RestMethod -Uri $uri -Method GET -ErrorAction Stop
}

$ok = $true
try {
    $me = Invoke-GraphGet -Path 'me' -Params @{ access_token = $resolvedToken; fields = 'id,name' }
    Write-Host ("OK • Meta token • me.id={0} name='{1}'" -f $me.id, $me.name) -ForegroundColor Green
} catch {
    Write-Error $_; if ($Raw -and $_.ErrorDetails -and $_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }; $ok = $false
}

if ($ok -and ($IgAccountId -or $env:META_IG_ACCOUNT_ID)) {
    $ig = if ($IgAccountId) { $IgAccountId } else { $env:META_IG_ACCOUNT_ID }
    try {
        $igInfo = Invoke-GraphGet -Path $ig -Params @{ access_token = $resolvedToken; fields = 'id,username' }
        Write-Host ("OK • IG account • id={0} username='{1}'" -f $igInfo.id, $igInfo.username) -ForegroundColor Green
    } catch { Write-Error $_; if ($Raw -and $_.ErrorDetails -and $_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }; $ok = $false }
}

if ($ok -and ($PageId -or $env:META_FB_PAGE_ID)) {
    $pg = if ($PageId) { $PageId } else { $env:META_FB_PAGE_ID }
    try {
        $pgInfo = Invoke-GraphGet -Path $pg -Params @{ access_token = $resolvedToken; fields = 'id,name' }
        Write-Host ("OK • FB Page • id={0} name='{1}'" -f $pgInfo.id, $pgInfo.name) -ForegroundColor Green
    } catch { Write-Error $_; if ($Raw -and $_.ErrorDetails -and $_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }; $ok = $false }
}

if (-not $ok) { exit 1 }
