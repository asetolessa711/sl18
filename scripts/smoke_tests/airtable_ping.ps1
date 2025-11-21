param(
    [string]$Table,
    [string]$TableName,
    [string]$BaseId,
    [string]$ApiKey,
    [switch]$UseEpisodes,
    [switch]$Raw,
    [switch]$ShowUrl
)

$ProgressPreference = 'SilentlyContinue'
try { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 } catch { }

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$helperPath = Join-Path $repoRoot 'scripts\helpers\load-env.ps1'

if (Test-Path $helperPath) {
    . $helperPath | Out-Null
}

$resolvedBase = if ($BaseId) { $BaseId } else { $env:AIRTABLE_BASE_ID }
$resolvedKey  = if ($ApiKey) { $ApiKey } else { $env:AIRTABLE_API_KEY }
if (-not $resolvedKey -or -not $resolvedBase) {
    Write-Error "Missing Airtable credentials. Ensure AIRTABLE_API_KEY and AIRTABLE_BASE_ID are set in .env or pass -ApiKey/-BaseId."
    exit 1
}

$targetTable = $null
if ($Table) {
    $targetTable = $Table
} elseif ($TableName) {
    # Attempt metadata lookup
    $metaUri = "https://api.airtable.com/v0/meta/bases/$resolvedBase/tables"
    $metaHeaders = @{ Authorization = "Bearer $resolvedKey"; Accept = 'application/json' }
    try {
        $tables = (Invoke-RestMethod -Uri $metaUri -Headers $metaHeaders -ErrorAction Stop).tables
        $match = $tables | Where-Object { $_.name -eq $TableName } | Select-Object -First 1
        if ($match) {
            $targetTable = $match.id
            Write-Host "Resolved TableName '$TableName' → $($match.id)" -ForegroundColor DarkGreen
        } else {
            Write-Host "Table name '$TableName' not found via metadata; falling back to name in request (may 404)." -ForegroundColor Yellow
            $targetTable = $TableName
        }
    } catch {
        Write-Host "Metadata lookup failed; falling back to name in request (may 404)." -ForegroundColor Yellow
        $targetTable = $TableName
    }
} else {
    if ($UseEpisodes -and $env:AIRTABLE_EPISODES_TABLE) {
        $targetTable = $env:AIRTABLE_EPISODES_TABLE
    } elseif ($env:AIRTABLE_PERSONAS_TABLE) {
        $targetTable = $env:AIRTABLE_PERSONAS_TABLE
    } elseif ($env:AIRTABLE_EPISODES_TABLE) {
        $targetTable = $env:AIRTABLE_EPISODES_TABLE
    } else {
        $targetTable = 'Personas'
    }
}
$encodedTable = [System.Uri]::EscapeDataString($targetTable)
$uri = "https://api.airtable.com/v0/$resolvedBase/$($encodedTable)?pageSize=1"
$headers = @{ Authorization = "Bearer $resolvedKey"; Accept = 'application/json' }

Write-Host "INFO • Airtable ping • Base=$resolvedBase Table=$targetTable" -ForegroundColor Cyan
if ($ShowUrl) { Write-Host "URL: $uri" -ForegroundColor DarkCyan }

try {
    $resp = Invoke-RestMethod -Uri $uri -Headers $headers -ErrorAction Stop
    $count = $resp.records.Count
    Write-Host "OK • Airtable ping • $count record(s) returned" -ForegroundColor Green
    if ($count -gt 0) {
        $first = $resp.records | Select-Object -First 1
        $id = $first.id
        $fields = ($first.fields | Get-Member -MemberType NoteProperty | Select-Object -First 3 -ExpandProperty Name) -join ', '
        Write-Host ("INFO • Sample Record • id={0} fields=[{1}]" -f $id, $fields)
    }
} catch {
    $status = $null; $statusText = $null
    $rawBody = $null
    try {
        $status = $_.Exception.Response.StatusCode.Value__
        $statusText = $_.Exception.Response.StatusDescription
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $rawBody = $_.ErrorDetails.Message }
    } catch { }
    Write-Error $_
    if ($status -eq 401) {
        Write-Host "WARN • Unauthorized (401): Check AIRTABLE_API_KEY or token scope." -ForegroundColor Yellow
    } elseif ($status -eq 404) {
        Write-Host "WARN • Not Found (404): The table '$targetTable' may be incorrect for base '$resolvedBase'." -ForegroundColor Yellow
        Write-Host "INFO • Tip: Use the table ID (starts with 'tbl') via -Table tblXXXXXXXXXXXX or set AIRTABLE_PERSONAS_TABLE in .env." -ForegroundColor Yellow
    } else {
        $suffix = ''
        if ($status) { $suffix = " ($status $statusText)" }
        Write-Host ("WARN • Request failed{0}." -f $suffix) -ForegroundColor Yellow
    }
    if ($Raw -and $rawBody) {
        Write-Host "Raw error body:" -ForegroundColor DarkYellow
        Write-Host $rawBody
    }
    exit 1
}
