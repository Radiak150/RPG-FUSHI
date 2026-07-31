param(
  [switch]$PlayerOnly,
  [switch]$MasterOnly,
  [switch]$HistoryOnly,
  [switch]$RulebooksOnly
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$builder = Join-Path $PSScriptRoot 'build-rulebooks.py'
$bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'

if ($env:FUSHI_PYTHON -and (Test-Path -LiteralPath $env:FUSHI_PYTHON)) {
  $python = $env:FUSHI_PYTHON
} elseif (Test-Path -LiteralPath $bundledPython) {
  $python = $bundledPython
} else {
  $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
  if (-not $pythonCommand) {
    throw 'Python com reportlab, Pillow e pypdf nao foi encontrado. Defina FUSHI_PYTHON.'
  }
  $python = $pythonCommand.Source
}

$arguments = @($builder)
if ($PlayerOnly) { $arguments += '--player-only' }
if ($MasterOnly) { $arguments += '--master-only' }
if ($HistoryOnly) { $arguments += '--history-only' }
if ($RulebooksOnly) { $arguments += '--rulebooks-only' }

Push-Location $projectRoot
try {
  & $python @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "A geracao dos livros falhou com codigo $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
