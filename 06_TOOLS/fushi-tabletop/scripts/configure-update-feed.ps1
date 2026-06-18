param(
  [Parameter(Mandatory = $true)]
  [string]$Url,
  [switch]$AllowInsecureHttp
)

$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$configPath = Join-Path $projectRoot 'electron-builder.json'
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$uri = [Uri]$Url

if ($uri.Scheme -ne 'https' -and $uri.Scheme -ne 'http') {
  throw 'Use uma URL http ou https.'
}

if ($uri.Scheme -eq 'http' -and !$AllowInsecureHttp -and $uri.Host -notin @('127.0.0.1', 'localhost')) {
  throw 'Para distribuicao publica use HTTPS. Para alpha privado via HTTP, rode novamente com -AllowInsecureHttp.'
}

$config.publish = @(
  [pscustomobject]@{
    provider = 'generic'
    url = $Url.TrimEnd('/')
  }
)

$config | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $configPath -Encoding UTF8

Write-Host "Canal de updates configurado para: $($Url.TrimEnd('/'))"
Write-Host 'Rode npm run release:installer para gerar uma build com essa URL.'
