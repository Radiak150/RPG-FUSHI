$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseRoot = [System.IO.Path]::GetFullPath(
  (Join-Path $projectRoot 'release\win-unpacked')
).TrimEnd('\') + '\'
$closed = 0

Get-CimInstance Win32_Process -Filter "Name = 'RPG FUSHI.exe'" |
  ForEach-Object {
    $executablePath = [string]$_.ExecutablePath

    if (-not $executablePath) {
      return
    }

    $resolvedPath = [System.IO.Path]::GetFullPath($executablePath)

    if (-not $resolvedPath.StartsWith(
      $releaseRoot,
      [System.StringComparison]::OrdinalIgnoreCase
    )) {
      return
    }

    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
      $script:closed += 1
    } catch [Microsoft.PowerShell.Commands.ProcessCommandException] {
      # O processo pode fechar sozinho entre a consulta WMI e o Stop-Process.
    }
  }

if ($closed -gt 0) {
  Write-Host "Release fechada antes do empacotamento: $closed processo(s)."
} else {
  Write-Host 'Nenhum processo da release win-unpacked estava aberto.'
}
