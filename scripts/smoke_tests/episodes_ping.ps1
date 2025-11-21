param(
    [string]$Table,
    [string]$TableName,
    [string]$BaseId,
    [string]$ApiKey,
    [switch]$Raw,
    [switch]$ShowUrl
)

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$pingPath = Join-Path $repoRoot 'scripts\smoke_tests\airtable_ping.ps1'

# Build pass-through arguments, always prefer Episodes table from env
$argsList = @('-UseEpisodes')
if ($Table) { $argsList += @('-Table', $Table) }
if ($TableName) { $argsList += @('-TableName', $TableName) }
if ($BaseId) { $argsList += @('-BaseId', $BaseId) }
if ($ApiKey) { $argsList += @('-ApiKey', $ApiKey) }
if ($Raw) { $argsList += '-Raw' }
if ($ShowUrl) { $argsList += '-ShowUrl' }

& $pingPath @argsList
if ($LASTEXITCODE) { exit $LASTEXITCODE }
