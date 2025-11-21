Param(
  [string]$Organization,
  [string]$Project,
  [string]$PipelineName = 'SL18 CI'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  throw 'Azure CLI (az) is required. Install from https://aka.ms/azure-cli and login via az login.'
}

$null = az account show 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'You are not logged in. Running az login...' -ForegroundColor Yellow
  az login | Out-Null
}

if (-not $Organization -or -not $Project) {
  throw 'Provide -Organization "https://dev.azure.com/<org>" and -Project "<project>".'
}

# Ensure DevOps extension
$extensions = az extension list --output json | ConvertFrom-Json
if (-not ($extensions | Where-Object { $_.name -eq 'azure-devops' })) {
  az extension add --name azure-devops | Out-Null
}

az devops configure --defaults organization=$Organization project=$Project | Out-Null

# Find pipeline by name
$p = az pipelines list --query "[?name=='$PipelineName']" --output json | ConvertFrom-Json
if (-not $p -or $p.Count -eq 0) {
  throw "Pipeline not found: $PipelineName"
}
$pipelineId = $p[0].id

Write-Host "Queueing pipeline '$PipelineName' (ID=$pipelineId) with current branch..." -ForegroundColor Cyan
$run = az pipelines run --id $pipelineId --output json | ConvertFrom-Json
$runId = $run.id
$web = $run._links.web.href
Write-Host "Run queued: #$runId" -ForegroundColor Green
Write-Host $web
