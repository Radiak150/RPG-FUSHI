$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$executablePath = Join-Path $projectRoot 'release\win-unpacked\RPG FUSHI.exe'
$iconPath = Join-Path $projectRoot 'build\icon.ico'
$rceditPath = Join-Path $projectRoot 'node_modules\electron-winstaller\vendor\rcedit.exe'

foreach ($requiredPath in @($executablePath, $iconPath, $rceditPath)) {
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
    throw "Arquivo obrigatorio ausente: $requiredPath"
  }
}

& $rceditPath $executablePath `
  --set-icon $iconPath `
  --set-version-string ProductName 'RPG FUSHI' `
  --set-version-string FileDescription 'Mesa virtual desktop do RPG FUSHI' `
  --set-version-string CompanyName 'Projeto RPG FUSHI'

if ($LASTEXITCODE -ne 0) {
  throw "rcedit falhou com codigo $LASTEXITCODE"
}

Write-Host 'Executavel win-unpacked recebeu icone e metadados FUSHI.'
