<#
 .SYNOPSIS
  Loads key=value pairs from .env files into the current PowerShell session.

 .DESCRIPTION
  By default, loads from repo-root .env and then backend .env (if present) so backend values override root.
  Supports an explicit -EnvPath to load a single file instead.

 .PARAMETER EnvPath
  Optional explicit path to a .env file to load.
#>
Param(
    [string]$EnvPath
)

function Import-DotEnvFile {
    param([string]$Path)
    if (-not $Path -or -not (Test-Path $Path)) { return $false }
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line) { return }
        if ($line.StartsWith('#')) { return }
        $parts = $line.Split('=',2)
        if ($parts.Length -lt 2) { return }
        $name = $parts[0].Trim()
        if ($name -like 'export *') { $name = $name.Substring(7).Trim() }
        $value = $parts[1].Trim()
        # Strip surrounding quotes
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
    Write-Host "Loaded environment variables from $Path" -ForegroundColor Green
    return $true
}

$loaded = $false
if ($EnvPath) {
    $loaded = (Import-DotEnvFile -Path $EnvPath)
} else {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
    $rootEnv = Join-Path $repoRoot ".env"
    $backendEnv = Join-Path $repoRoot "apps\control-panel\backend\.env"
    $rootLocal = Join-Path $repoRoot ".env.local"
    $backendLocal = Join-Path $repoRoot "apps\control-panel\backend\.env.local"
    $loaded = (Import-DotEnvFile -Path $rootEnv) -or $loaded
    $loaded = (Import-DotEnvFile -Path $backendEnv) -or $loaded
    $loaded = (Import-DotEnvFile -Path $rootLocal) -or $loaded
    $loaded = (Import-DotEnvFile -Path $backendLocal) -or $loaded
}

if (-not $loaded) {
    Write-Warning "No .env files were loaded"
}

return $loaded
