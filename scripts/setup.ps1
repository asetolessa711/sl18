param(
    [string]$BasePath = "C:\Users\atdan\OneDrive\Documents\SL 18",
    [switch]$DryRun
)

$Folders = @(
    "automation\make",
    "automation\n8n",
    "assets\branding",
    "assets\templates\capcut",
    "data\captions",
    "data\renders",
    "data\audio\tts",
    "data\audio\music",
    "data\logs",
    "docs",
    "personas",
    "prompts",
    "scripts",
    "pipelines"
)

Write-Host "Creating SL18 scaffold at: $BasePath"
foreach ($f in $Folders) {
    $p = Join-Path $BasePath $f
    if (-not $DryRun) {
        New-Item -ItemType Directory -Force -Path $p | Out-Null
    }
    Write-Host "Ensured: $p"
}

# Copy placeholders if running from repo location
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @(
    "README.md",
    ".gitignore",
    ".env.example",
    "azure-pipelines.yml",
    "pipelines\mvp.yml",
    "prompts\script_template_en.txt",
    "personas\personas.csv",
    "docs\episodes.csv",
    "automation\make\sl18_make_blueprint.json"
)

foreach ($file in $files) {
    $src = Join-Path $here $file
    $dst = Join-Path $BasePath $file
    if (Test-Path $src) {
        if (-not $DryRun) {
            $dstDir = Split-Path -Parent $dst
            New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
            Copy-Item $src $dst -Force
        }
        Write-Host "Copied: $file"
    } else {
        Write-Warning "Missing source file in package: $file"
    }
}

Write-Host "Done."
