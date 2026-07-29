$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$auditScript = Join-Path $PSScriptRoot 'audit-rulebooks.py'
$bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'

if ($env:FUSHI_PYTHON -and (Test-Path -LiteralPath $env:FUSHI_PYTHON)) {
  $python = $env:FUSHI_PYTHON
} elseif (Test-Path -LiteralPath $bundledPython) {
  $python = $bundledPython
} else {
  $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
  if (-not $pythonCommand) {
    throw 'Python com Pillow e pypdf nao foi encontrado. Defina FUSHI_PYTHON.'
  }
  $python = $pythonCommand.Source
}

Push-Location $projectRoot
try {
  & $python $auditScript
  if ($LASTEXITCODE -ne 0) {
    throw "A auditoria dos livros falhou com codigo $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
