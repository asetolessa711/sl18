param(
    [string]$SessionCookie,
    [switch]$ShowUrl,
    [switch]$Raw,
    [switch]$AllowOffline
)

$ProgressPreference = 'SilentlyContinue'
try { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 } catch { }

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$helperPath = Join-Path $repoRoot 'scripts\helpers\load-env.ps1'
if (Test-Path $helperPath) { . $helperPath | Out-Null }

$cookie = if ($SessionCookie) { $SessionCookie } else { $env:TIKTOK_SESSION_COOKIE }
if (-not $cookie) { Write-Error 'Missing TIKTOK_SESSION_COOKIE'; exit 1 }

# Use a lightweight account info endpoint; behavior may vary over time as TikTok changes
$uri = 'https://www.tiktok.com/passport/web/account/info/'
if ($ShowUrl) { Write-Host "URL: $uri" -ForegroundColor DarkCyan }

$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36'
    'Accept' = 'application/json, text/plain, */*'
    'Cookie' = "sessionid=$cookie"
    'Referer' = 'https://www.tiktok.com/'
}

function Test-SessionIdShape {
    param([string]$Value)
    if (-not $Value) {return $false }
    if ($Value.Length -lt 20 -or $Value.Length -gt 256) { return $false }
    if ($Value -match "\s") { return $false }
    # Allow common cookie chars
    if ($Value -match '^[A-Za-z0-9._\-]+$') { return $true }
    return $false
}

try {
    $resp = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET -ErrorAction Stop
    # Expect an object containing user info; check a few typical fields
    $uid = $null
    $email = $null
    if ($resp -and $resp.data) {
        $uid = $resp.data | Select-Object -ExpandProperty user_id -ErrorAction SilentlyContinue
        $email = $resp.data | Select-Object -ExpandProperty email -ErrorAction SilentlyContinue
    }
    if ($uid -or $email) {
        $uidDisplay = if ($uid) { $uid } else { 'n/a' }
        $emailDisplay = if ($email) { $email } else { 'n/a' }
        Write-Host ("OK • TikTok session • user_id={0} email={1}" -f $uidDisplay, $emailDisplay) -ForegroundColor Green
    } else {
        Write-Host 'WARN • TikTok responded but did not return expected account fields; cookie may be limited.' -ForegroundColor Yellow
    }
} catch {
    $status = $null
    try { $status = $_.Exception.Response.StatusCode.Value__ } catch { }
    Write-Error $_
    if ($Raw -and $_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host 'Raw error body:' -ForegroundColor DarkYellow
        Write-Host $_.ErrorDetails.Message
    }
    if ($AllowOffline -and (Test-SessionIdShape -Value $cookie)) {
        Write-Host "WARN • Offline OK: session cookie shape looks valid (network status=$status)." -ForegroundColor Yellow
        exit 0
    }
    exit 1
}
