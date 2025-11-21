param(
    [string]$ApiKey,
    [switch]$ShowUrl,
    [switch]$Raw,
    [string]$ChannelId,
    [string]$ForUsername,
    [switch]$UseChannels
)

$ProgressPreference = 'SilentlyContinue'
try { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 } catch { }

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$helperPath = Join-Path $repoRoot 'scripts\helpers\load-env.ps1'
if (Test-Path $helperPath) { . $helperPath | Out-Null }

$resolvedKey = if ($ApiKey) { $ApiKey } else { $env:YOUTUBE_API_KEY }
if (-not $resolvedKey) { Write-Error 'Missing YOUTUBE_API_KEY'; exit 1 }

if ($UseChannels -or $ChannelId -or $ForUsername) {
    if (-not $ChannelId -and -not $ForUsername) {
        Write-Error 'Channel lookup requested but no -ChannelId or -ForUsername provided.'
        exit 1
    }
    if ($ChannelId) {
        $uri = "https://www.googleapis.com/youtube/v3/channels?part=snippet&id=$ChannelId&key=$resolvedKey"
    } else {
        $uri = "https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=$ForUsername&key=$resolvedKey"
    }
    if ($ShowUrl) { Write-Host "URL: $uri" -ForegroundColor DarkCyan }
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method GET -ErrorAction Stop
        $count = ($resp.items | Measure-Object).Count
        if ($count -gt 0) {
            $item = $resp.items[0]
            $title = $item.snippet.title
            $cid = if ($item.id) { $item.id } else { $ChannelId }
            Write-Host "OK • YouTube channel • id=$cid title=$title" -ForegroundColor Green
        } else {
            Write-Host "ERR • YouTube channel • not found" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Error $_
        if ($Raw -and $_.ErrorDetails -and $_.ErrorDetails.Message) {
            Write-Host 'Raw error body:' -ForegroundColor DarkYellow
            Write-Host $_.ErrorDetails.Message
        }
        exit 1
    }
    exit 0
}

# Default: low-cost public endpoint that works with API key auth
$uri = "https://www.googleapis.com/youtube/v3/i18nLanguages?part=snippet&maxResults=1&key=$resolvedKey"
if ($ShowUrl) { Write-Host "URL: $uri" -ForegroundColor DarkCyan }

try {
    $resp = Invoke-RestMethod -Uri $uri -Method GET -ErrorAction Stop
    $count = ($resp.items | Measure-Object).Count
    Write-Host "OK • YouTube API key • i18nLanguages items=$count" -ForegroundColor Green
} catch {
    Write-Error $_
    if ($Raw -and $_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host 'Raw error body:' -ForegroundColor DarkYellow
        Write-Host $_.ErrorDetails.Message
    }
    exit 1
}
