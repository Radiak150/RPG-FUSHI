param(
  [string]$Source = "",
  [string]$Target = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourcePath = if ($Source.Trim().Length -gt 0) {
  Resolve-Path $Source
} else {
  Resolve-Path (Join-Path $projectRoot "public\assets")
}

$targetPath = if ($Target.Trim().Length -gt 0) {
  $Target
} else {
  Join-Path $env:APPDATA "FUSHI\library\assets"
}

New-Item -ItemType Directory -Force -Path $targetPath | Out-Null

Write-Host "Copiando biblioteca de conteudo:"
Write-Host "Origem : $sourcePath"
Write-Host "Destino: $targetPath"
Write-Host ""

& robocopy $sourcePath $targetPath /E /XO /R:1 /W:1 /NP
$exitCode = $LASTEXITCODE

if ($exitCode -gt 7) {
  throw "Robocopy falhou com codigo $exitCode."
}

Write-Host ""
Write-Host "Biblioteca instalada/atualizada em: $targetPath"
exit 0
