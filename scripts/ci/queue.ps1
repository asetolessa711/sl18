param(
  [string]$Branch = 'main',
  [int]$PipelineId,
  [string]$Name = 'SL18 MVP validation',
  [switch]$Open,
  [switch]$DryRun
)

# Wrapper that defaults to the MVP pipeline name and forwards to queue-mvp.ps1
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$helper = Join-Path $repoRoot 'scripts\ci\queue-mvp.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
  Write-Error "Helper not found: $helper"
  exit 1
}

# Preflight: Azure CLI and devops extension
$az = Get-Command az -ErrorAction SilentlyContinue
if (-not $az) {
  Write-Error "Azure CLI 'az' not found. Install: https://aka.ms/azure-cli"
  exit 1
}
try {
  $hasExt = az extension list --query "[?name=='azure-devops']|length(@)" -o tsv 2>$null
} catch { $hasExt = '0' }
if ($hasExt -eq '0') {
  if ($DryRun) {
    Write-Host "[DryRun] Would run: az extension add --name azure-devops"
  } else {
    try { az extension add --name azure-devops | Out-Null } catch { Write-Warning "Could not add azure-devops extension: $_" }
  }
}

$argsSplat = @{
  BasePath  = $repoRoot
  Branch    = $Branch
  Open      = $Open
  DryRun    = $DryRun
}
if ($PipelineId) { $argsSplat.PipelineId = $PipelineId }
if ($Name)       { $argsSplat.Name       = $Name }

& $helper @argsSplat
exit $LASTEXITCODE
