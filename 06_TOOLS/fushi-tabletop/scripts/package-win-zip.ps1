$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$packageJsonPath = Join-Path $projectRoot 'package.json'
$releaseDir = Join-Path $projectRoot 'release'
$sourceDir = Join-Path $releaseDir 'win-unpacked'
$packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
$version = $packageJson.version
$zipPath = Join-Path $releaseDir "RPG-FUSHI-$version-win-x64.zip"
$rootEntryName = 'RPG FUSHI'
$buildInfoPath = Join-Path $sourceDir 'BUILD-INFO.txt'
$appAsarPath = Join-Path $sourceDir 'resources\app.asar'
$exePath = Join-Path $sourceDir 'RPG FUSHI.exe'

if (-not (Test-Path -LiteralPath $sourceDir)) {
  throw "Release win-unpacked nao encontrada: $sourceDir"
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

$appAsarHash = if (Test-Path -LiteralPath $appAsarPath) {
  (Get-FileHash -LiteralPath $appAsarPath -Algorithm SHA256).Hash
} else {
  'missing'
}

$exeHash = if (Test-Path -LiteralPath $exePath) {
  (Get-FileHash -LiteralPath $exePath -Algorithm SHA256).Hash
} else {
  'missing'
}

@(
  'RPG FUSHI Alpha Build'
  "Version: $version"
  "BuiltAt: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'))"
  "RootFolderInZip: $rootEntryName"
  "Executable: RPG FUSHI.exe"
  "AppAsarSha256: $appAsarHash"
  "ExeSha256: $exeHash"
  ''
  'Distribuicao: extraia o ZIP inteiro antes de abrir o app.'
  'Teste local multi-instancia: use RPG FUSHI - Teste Local Multi.cmd na raiz da pasta extraida.'
  'Build oficial deste ZIP: confira este arquivo antes de testar bugs.'
) | Set-Content -LiteralPath $buildInfoPath -Encoding UTF8

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

try {
  Get-ChildItem -LiteralPath $sourceDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length).TrimStart('\', '/')
    $entryName = "$rootEntryName/$($relativePath -replace '\\', '/')"

    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip,
      $_.FullName,
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
} finally {
  $zip.Dispose()
}

$zipItem = Get-Item -LiteralPath $zipPath
Write-Host "ZIP gerado: $($zipItem.FullName)"
Write-Host "Tamanho: $([Math]::Round($zipItem.Length / 1MB, 2)) MB"
