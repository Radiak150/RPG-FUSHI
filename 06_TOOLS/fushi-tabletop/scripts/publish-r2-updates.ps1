param(
  [string]$Bucket = "rpg-fushi-updates",
  [string]$Prefix = "rpg-fushi/win",
  [string]$FeedUrl = "",
  [switch]$Build
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseDir = Join-Path $projectRoot "release\nsis-web"
$manifest = Join-Path $releaseDir "latest.yml"

function Invoke-CheckedCommand {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $FilePath $($Arguments -join ' ')"
  }
}

if ($FeedUrl.Trim().Length -gt 0) {
  $feed = $FeedUrl.TrimEnd("/")
  Invoke-CheckedCommand -FilePath "powershell" -Arguments @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    (Join-Path $PSScriptRoot "configure-update-feed.ps1"),
    "-Url",
    $feed
  )
}

if ($Build) {
  Invoke-CheckedCommand -FilePath "npm" -Arguments @("run", "release:installer")
}

if (!(Test-Path -LiteralPath $manifest)) {
  throw "latest.yml not found. Run npm run release:installer first."
}

$fileNames = New-Object System.Collections.Generic.List[string]
foreach ($line in Get-Content -LiteralPath $manifest) {
  if ($line -match "^\s*(url|path|file):\s*(.+?)\s*$") {
    $name = $Matches[2].Trim().Trim("'").Trim('"')
    if ($name -match "\.(exe|7z)$" -and !$fileNames.Contains($name)) {
      $fileNames.Add($name)
    }
  }
}

if ($fileNames.Count -eq 0) {
  throw "No installer/package files found in latest.yml."
}

$payloads = $fileNames | Sort-Object {
  if ($_ -like "*.7z") { 0 }
  elseif ($_ -like "*.exe") { 1 }
  else { 2 }
}

$prefixClean = ($Prefix.Trim("/").Trim("\") -replace "\\", "/")

function Publish-R2Object {
  param([string]$Name)

  $source = Join-Path $releaseDir $Name
  if (!(Test-Path -LiteralPath $source)) {
    throw "Release file not found: $source"
  }

  if ($prefixClean.Length -gt 0) {
    $objectKey = "$prefixClean/$Name"
  } else {
    $objectKey = $Name
  }

  Write-Host "Uploading $Name -> r2://$Bucket/$objectKey"
  Invoke-CheckedCommand -FilePath "npx" -Arguments @(
    "--yes",
    "wrangler@latest",
    "r2",
    "object",
    "put",
    "$Bucket/$objectKey",
    "-f",
    $source
  )
}

foreach ($name in $payloads) {
  Publish-R2Object -Name $name
}

Publish-R2Object -Name "latest.yml"

Write-Host ""
Write-Host "R2 update channel uploaded successfully."
Write-Host "latest.yml was uploaded last to avoid clients seeing a half-published release."
if ($FeedUrl.Trim().Length -gt 0) {
  Write-Host "Feed URL: $($FeedUrl.TrimEnd('/'))"
}
