param(
  [ValidateSet('local', 'lan', 'tunnel')]
  [string]$Mode = 'local',
  [int]$Port = 8765
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$serverScript = Join-Path $PSScriptRoot "local-update-server.cjs"

function Resolve-CloudflaredPath {
  $command = Get-Command cloudflared -ErrorAction SilentlyContinue

  if ($command) {
    return $command.Source
  }

  $wingetPackageRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
  $wingetBinary = Get-ChildItem -Path $wingetPackageRoot -Recurse -Filter "cloudflared.exe" -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($wingetBinary) {
    return $wingetBinary.FullName
  }

  return $null
}

if (!(Test-Path -LiteralPath (Join-Path $projectRoot "release\nsis-web\latest.yml"))) {
  throw "Nao encontrei release\nsis-web\latest.yml. Rode npm run release:installer primeiro."
}

function Stop-ExistingUpdateServer {
  param([int]$UpdatePort)

  $listeners = Get-NetTCPConnection -LocalPort $UpdatePort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $listeners) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue

    if ($process -and $process.CommandLine -match "local-update-server\.cjs") {
      Write-Host "Fechando servidor de updates antigo na porta $UpdatePort (PID $processId)."
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

Stop-ExistingUpdateServer -UpdatePort $Port

$env:FUSHI_UPDATE_PORT = [string]$Port
$env:FUSHI_UPDATE_HOST = if ($Mode -eq 'lan') { '0.0.0.0' } else { '127.0.0.1' }

if ($Mode -eq 'tunnel') {
  $cloudflared = Resolve-CloudflaredPath

  if (!$cloudflared) {
    throw "cloudflared nao esta instalado/no PATH. Baixe o cloudflared ou use npm run updates:serve-lan."
  }

  $server = Start-Process -FilePath "node" -ArgumentList "`"$serverScript`"" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru

  try {
    Write-Host "Servidor local iniciado em http://127.0.0.1:$Port"
    Write-Host "Quando aparecer a URL https://*.trycloudflare.com, envie essa URL aos amigos."
    & $cloudflared tunnel --url "http://127.0.0.1:$Port"
  } finally {
    if ($server -and !$server.HasExited) {
      Stop-Process -Id $server.Id -Force
    }
  }

  exit $LASTEXITCODE
}

node $serverScript
