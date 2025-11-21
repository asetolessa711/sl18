param(
    [string]$BasePath = "C:\Dev\SL 18",
    [switch]$DryRun
)

function Write-Step($msg) {
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Ensure-Dir($path) {
    if (-not (Test-Path -LiteralPath $path)) {
        if ($DryRun) {
            Write-Host "[DryRun] Would create: $path"
        } else {
            New-Item -ItemType Directory -Force -Path $path | Out-Null
            Write-Host "Ensured: $path"
        }
    } else {
        Write-Host "Exists: $path"
    }
}

Write-Step "Creating SL18 scaffold at: $BasePath"
$Folders = @(
    'apps\control-panel\backend',
    'automation\make',
    'automation\n8n',
    'assets\branding',
    'assets\templates\capcut',
    'data\captions',
    'data\renders',
    'data\audio\tts',
    'data\audio\music',
    'data\logs',
    'Docs',
    'personas',
    'prompts',
    'scripts',
    'pipelines'
)

foreach ($f in $Folders) {
    $p = Join-Path $BasePath $f
    Ensure-Dir -path $p
}

Write-Step "Reading backend .env for Azure DevOps settings (if present)"
$envPath = Join-Path $BasePath 'apps\control-panel\backend\.env'
$org = ''
$project = ''

if (Test-Path -LiteralPath $envPath) {
    Get-Content -LiteralPath $envPath | ForEach-Object {
        if ($_ -match '^AZURE_DEVOPS_EXT_PAT=(.+)$') { $env:AZURE_DEVOPS_EXT_PAT = $matches[1].Trim() }
        if ($_ -match '^AZURE_DEVOPS_ORG=(.+)$')     { $org     = $matches[1].Trim() }
        if ($_ -match '^AZURE_DEVOPS_PROJECT=(.+)$') { $project = $matches[1].Trim() }
    }

    if ($org -and $project) {
        Write-Step "Configuring Azure DevOps CLI defaults for $project"
        $cmd = "az devops configure --defaults organization=$org project=$project"
        if ($DryRun) {
            Write-Host "[DryRun] Would run: $cmd"
        } else {
            try {
                iex $cmd
            } catch {
                Write-Warning "Azure DevOps CLI not available or failed to configure. $_"
            }
        }
    } else {
        Write-Host "No AZURE_DEVOPS_ORG/PROJECT found in .env — skipping az configuration."
    }
} else {
    Write-Host ".env not found at $envPath — skipping az configuration."
}

Write-Step "Done. You can re-run without -DryRun to apply changes."
Write-Host "Tip: Execution policy (current session): Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass"
