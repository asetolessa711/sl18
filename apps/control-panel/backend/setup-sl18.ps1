param(
    [string]$BasePath,
    [switch]$DryRun
)

# Determine repo root and central script path
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
if (-not $BasePath) { $BasePath = $repoRoot }
$central = Join-Path $repoRoot 'scripts\setup\setup-sl18.ps1'

if (-not (Test-Path -LiteralPath $central)) {
    Write-Error "Central setup script not found at $central"
    exit 1
}

Write-Host "Delegating to central setup: $central" -ForegroundColor Cyan
& $central -BasePath $BasePath -DryRun:$DryRun
exit $LASTEXITCODE
