Param(
    [switch]$SkipNetwork,
    [string[]]$Service
)

$serviceMap = @{
    airtable   = 'Airtable'
    elevenlabs = 'ElevenLabs'
    openai     = 'OpenAI'
    youtube    = 'YouTube'
    drive      = 'Drive'
}

$selectedServices = @()
if ($Service -and $Service.Count -gt 0) {
    foreach ($svc in $Service) {
        $key = $svc.ToLower()
        if (-not $serviceMap.ContainsKey($key)) {
            throw "Unknown service '$svc'. Valid options: $($serviceMap.Values -join ', ')"
        }
        if (-not $selectedServices.Contains($serviceMap[$key])) {
            $selectedServices += $serviceMap[$key]
        }
    }
} else {
    $selectedServices = $serviceMap.Values
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$helper   = Join-Path $repoRoot "scripts\helpers\load-env.ps1"

if (Test-Path $helper) {
    . $helper | Out-Null
} else {
    Write-Warning "Helper not found at $helper"
}

function Test-EnvVar {
    param(
        [string]$Name,
        [switch]$Secret
    )
    $value = [System.Environment]::GetEnvironmentVariable($Name, 'Process')
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Warning "[ERROR] Missing $Name"
        return $false
    }
    elseif ($Secret) {
        Write-Host "[OK] $Name = ***" -ForegroundColor Green
    }
    else {
        Write-Host "[OK] $Name = $value" -ForegroundColor Green
    }
    return $true
}

function Test-FilePresence {
    param(
        [string]$Label,
        [string]$Path,
        [switch]$Required
    )

    if (Test-Path $Path) {
        Write-Host "[OK] $Label found ($Path)" -ForegroundColor Green
        return $true
    }

    if ($Required) {
        Write-Warning "[ERROR] $Label missing ($Path)"
    }
    else {
        Write-Warning "[WARN] $Label not found ($Path)"
    }
    return $false
}

Write-Host "`n[INFO] Validating required variables..." -ForegroundColor Cyan
$required = @(
    'AIRTABLE_API_KEY','AIRTABLE_BASE_ID','AIRTABLE_PERSONAS_TABLE',
    'GOOGLE_SERVICE_ACCOUNT_JSON','GOOGLE_DRIVE_PARENT_ID',
    'ELEVENLABS_API_KEY','OPENAI_API_KEY','YOUTUBE_API_KEY'
)
$script:MissingVars = @()
foreach ($name in $required) {
    if (-not (Test-EnvVar -Name $name -Secret)) { $script:MissingVars += $name }
}

if ($SkipNetwork) {
    Write-Host "Skipping network checks (--SkipNetwork set)." -ForegroundColor Yellow
    return
}

function Test-IsMissing {
    param([string]$Name)
    return $script:MissingVars -contains $Name
}

function Invoke-AirtableTest {
    if (Test-IsMissing 'AIRTABLE_API_KEY' -or Test-IsMissing 'AIRTABLE_BASE_ID') { return }
    $table = $env:AIRTABLE_PERSONAS_TABLE
    if (-not $table) { $table = 'Personas' }
    $uri = "https://api.airtable.com/v0/$($env:AIRTABLE_BASE_ID)/$($table)?pageSize=1"
    $headers = @{ Authorization = "Bearer $($env:AIRTABLE_API_KEY)" }
    try {
        Invoke-RestMethod -Uri $uri -Headers $headers -ErrorAction Stop | ForEach-Object {
            Write-Host "[OK] Airtable ok ($($_.records.Count) records)" -ForegroundColor Green
            $_.records | Select-Object -First 1
        }
    } catch {
        Write-Warning "[ERROR] Airtable error: $($_.Exception.Message)"
    }
}

function Invoke-ElevenLabsTest {
    if (Test-IsMissing 'ELEVENLABS_API_KEY') { return }
    $headers = @{ 'xi-api-key' = $env:ELEVENLABS_API_KEY }
    try {
        Invoke-RestMethod -Uri 'https://api.elevenlabs.io/v1/voices' -Headers $headers -ErrorAction Stop | ForEach-Object {
            Write-Host "[OK] ElevenLabs ok ($($_.voices.Count) voices)" -ForegroundColor Green
        }
    } catch {
        Write-Warning "[ERROR] ElevenLabs error: $($_.Exception.Message)"
    }
}

function Invoke-OpenAITest {
    if (Test-IsMissing 'OPENAI_API_KEY') { return }
    $headers = @{ Authorization = "Bearer $($env:OPENAI_API_KEY)" }
    try {
        Invoke-RestMethod -Uri 'https://api.openai.com/v1/models' -Headers $headers -ErrorAction Stop | ForEach-Object {
            Write-Host "[OK] OpenAI ok ($($_.data.Count) models)" -ForegroundColor Green
        }
    } catch {
        Write-Warning "[ERROR] OpenAI error: $($_.Exception.Message)"
    }
}

function Invoke-YouTubeTest {
    if (Test-IsMissing 'YOUTUBE_API_KEY') { return }
    $secretPath = Join-Path $repoRoot "config\youtube_client_secret.json"
    $tokenPath  = Join-Path $repoRoot "publishing\youtube\token.json"

    $hasSecret = Test-FilePresence -Label "YouTube OAuth client" -Path $secretPath -Required
    $hasToken  = Test-FilePresence -Label "YouTube OAuth token" -Path $tokenPath

    if (-not $hasSecret) {
        Write-Warning "[WARN] Skipping API ping until OAuth client is in place."
        return
    }

    $uri = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=$($env:YOUTUBE_API_KEY)"
    try {
        Invoke-RestMethod -Uri $uri -ErrorAction Stop | Out-Null
        Write-Host "[OK] YouTube API key valid" -ForegroundColor Green
    } catch {
        $response = $_.Exception.Response
        $statusCode = $null
        $statusDesc = $null
        if ($response) {
            try {
                $statusCode = $response.StatusCode.Value__
                $statusDesc = $response.StatusDescription
            } catch {
                $statusCode = $response.StatusCode
            }
        }

        if ($statusCode) {
            Write-Warning "[ERROR] YouTube error ($statusCode $statusDesc): $($_.Exception.Message)"
        } else {
            Write-Warning "[ERROR] YouTube error: $($_.Exception.Message)"
        }
        if (-not $hasToken) {
            Write-Warning "[HINT] Generate token.json via scripts/auth/get-youtube-refresh-token.mjs"
        }
    }
}

function Invoke-DriveTest {
    if (Test-IsMissing 'GOOGLE_SERVICE_ACCOUNT_JSON' -or -not $env:GOOGLE_SERVICE_ACCOUNT_JSON -or -not (Test-Path $env:GOOGLE_SERVICE_ACCOUNT_JSON)) {
        Write-Warning "[ERROR] Drive: service account JSON missing/invalid path"
        return
    }
    Write-Host "[OK] Drive: service account file detected" -ForegroundColor Green
}

Write-Host "`n[INFO] Running smoke tests..." -ForegroundColor Cyan
$serviceRunners = @{
    Airtable   = { Invoke-AirtableTest }
    ElevenLabs = { Invoke-ElevenLabsTest }
    OpenAI     = { Invoke-OpenAITest }
    YouTube    = { Invoke-YouTubeTest }
    Drive      = { Invoke-DriveTest }
}

foreach ($svc in $selectedServices) {
    if ($serviceRunners.ContainsKey($svc)) {
        Write-Host "[INFO] Testing $svc..." -ForegroundColor Cyan
        & $serviceRunners[$svc]
    }
}

Write-Host "`n[INFO] Validation complete." -ForegroundColor Cyan
