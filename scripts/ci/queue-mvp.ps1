param(
  [string]$BasePath = "C:\Dev\SL 18",
  [string]$Branch = "main",
  [int]$PipelineId,
  [string]$Name,
  [switch]$Open,
  [switch]$DryRun
)

function Write-Step($msg){ Write-Host "==> $msg" -ForegroundColor Cyan }

$envPath = Join-Path $BasePath 'apps\control-panel\backend\.env'
if (Test-Path -LiteralPath $envPath) {
  Get-Content -LiteralPath $envPath | ForEach-Object {
    if ($_ -match '^AZURE_DEVOPS_EXT_PAT=(.+)$') { $env:AZURE_DEVOPS_EXT_PAT = $matches[1].Trim() }
    if ($_ -match '^AZURE_DEVOPS_ORG=(.+)$')     { $org     = $matches[1].Trim() }
    if ($_ -match '^AZURE_DEVOPS_PROJECT=(.+)$') { $project = $matches[1].Trim() }
  }
}

if (-not $org -or -not $project) {
  Write-Warning "AZURE_DEVOPS_ORG/PROJECT not found in $envPath. You can still pass az defaults manually."
} else {
  $cfg = "az devops configure --defaults organization=$org project=$project"
  if ($DryRun) { Write-Host "[DryRun] Would run: $cfg" } else { try { iex $cfg } catch { Write-Warning $_ } }
}

# Ensure azure-devops extension exists
$extCheck = az extension list --query "[?name=='azure-devops']|length(@)" -o tsv 2>$null
if (-not $extCheck -or $extCheck -eq '0') {
  if ($DryRun) { Write-Host "[DryRun] Would run: az extension add --name azure-devops" }
  else { az extension add --name azure-devops | Out-Null }
}

if (-not $PipelineId) {
  # Fetch pipelines as JSON for selection logic
  try {
    $json = az pipelines list -o json | ConvertFrom-Json
  } catch {
    Write-Error "Failed to list pipelines via az CLI. $_"; exit 1
  }

  if ($Name) {
    $match = $json | Where-Object { $_.name -ieq $Name }
    if ($match.Count -eq 1) {
      $PipelineId = [int]$match.id
      Write-Step "Selected pipeline by name: '$Name' (id=$PipelineId)"
    } elseif ($match.Count -gt 1) {
      Write-Host "Multiple pipelines matched name '$Name'. Please specify -PipelineId. List:" -ForegroundColor Yellow
      az pipelines list -o table
      exit 1
    } else {
      Write-Host "No pipeline named '$Name' found. Available pipelines:" -ForegroundColor Yellow
      az pipelines list -o table
      exit 1
    }
  } else {
    if ($json.Count -eq 1) {
      $PipelineId = [int]$json[0].id
      Write-Step "Only one pipeline found; auto-selecting id=$PipelineId (name=$($json[0].name))"
    } else {
      Write-Step "Listing pipelines (choose an ID with -PipelineId or a name with -Name)"
      az pipelines list -o table
      Write-Host "Hint: .\\scripts\\ci\\queue-mvp.ps1 -Name 'SL18 MVP validation' -Branch $Branch"
      exit 0
    }
  }
}

$cmd = "az pipelines run --id $PipelineId --branch $Branch --query webUrl -o tsv"
Write-Step "Queue run: pipeline=$PipelineId branch=$Branch"
if ($DryRun) {
  Write-Host "[DryRun] Would run: $cmd"
  exit 0
}
try {
  $url = iex $cmd
  if ($LASTEXITCODE -eq 0 -and $url) {
    Write-Host "Queued: $url"
    if ($Open) {
      try {
        if ($IsWindows) { Start-Process $url } else { xdg-open $url 2>$null }
      } catch { }
    }
    exit 0
  } else {
    Write-Error "Failed to queue pipeline run."
    exit 1
  }
} catch {
  Write-Error $_
  exit 1
}
