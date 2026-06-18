$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Add-Type -AssemblyName System.Drawing

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$projectRoot = (Resolve-Path (Join-Path $root '..\..')).Path
$sourceRoot = Join-Path $root '.codex-dev\ultra-biome-sources'
$outputRoot = Join-Path $root 'public\assets\biomes\8-biomas-ultra'
$manifestPath = Join-Path $outputRoot 'SOURCES.md'

New-Item -ItemType Directory -Force -Path $sourceRoot, $outputRoot | Out-Null

function Invoke-DownloadFile {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$OutFile
  )

  if (Test-Path $OutFile) {
    return
  }

  New-Item -ItemType Directory -Force -Path (Split-Path $OutFile -Parent) | Out-Null
  Invoke-WebRequest -Uri $Url -OutFile $OutFile
}

function Get-PolyHavenDiffuse {
  param(
    [Parameter(Mandatory = $true)][string]$AssetId,
    [string]$Resolution = '2k'
  )

  $outFile = Join-Path $sourceRoot "polyhaven\$AssetId`_$Resolution`_diff.jpg"
  if (Test-Path $outFile) {
    return $outFile
  }

  $files = Invoke-RestMethod "https://api.polyhaven.com/files/$AssetId"
  $entry = $files.Diffuse.$Resolution.jpg
  if (-not $entry) {
    $entry = $files.Diffuse.'1k'.jpg
  }
  if (-not $entry) {
    throw "Poly Haven diffuse jpg not found for $AssetId"
  }

  Invoke-DownloadFile -Url $entry.url -OutFile $outFile
  return $outFile
}

function Get-AmbientCgMap {
  param(
    [Parameter(Mandatory = $true)][string]$AssetId,
    [string]$MapName = 'Color',
    [string]$Resolution = '1K'
  )

  $zipPath = Join-Path $sourceRoot "ambientcg\$AssetId`_$Resolution-JPG.zip"
  $extractDir = Join-Path $sourceRoot "ambientcg\$AssetId`_$Resolution-JPG"
  $mapPath = Join-Path $extractDir "$AssetId`_$Resolution-JPG_$MapName.jpg"

  if (Test-Path $mapPath) {
    return $mapPath
  }

  Invoke-DownloadFile -Url "https://ambientCG.com/get?file=$AssetId`_$Resolution-JPG.zip" -OutFile $zipPath
  New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

  if (-not (Test-Path $mapPath)) {
    $mapPath = Get-ChildItem -Path $extractDir -Recurse -Filter "*_$MapName.jpg" |
      Select-Object -First 1 -ExpandProperty FullName
  }
  if (-not $mapPath -or -not (Test-Path $mapPath)) {
    throw "ambientCG $MapName jpg not found for $AssetId"
  }

  return $mapPath
}

function Get-WikimediaOcean {
  $outFile = Join-Path $sourceRoot 'wikimedia\ocean_water_background.jpg'
  Invoke-DownloadFile `
    -Url 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ocean%20Water%20Background.jpg' `
    -OutFile $outFile
  return $outFile
}

function Load-Bitmap {
  param([Parameter(Mandatory = $true)][string]$Path)

  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $image = [System.Drawing.Image]::FromStream($stream)
    return New-Object System.Drawing.Bitmap $image
  } finally {
    if ($image) { $image.Dispose() }
    $stream.Dispose()
  }
}

function New-Color {
  param(
    [Parameter(Mandatory = $true)][string]$Hex,
    [int]$Alpha = 255
  )

  $clean = $Hex.TrimStart('#')
  $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function Draw-ImageAlpha {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)][System.Drawing.Image]$Image,
    [Parameter(Mandatory = $true)][System.Drawing.RectangleF]$Destination,
    [double]$Alpha = 1
  )

  $matrix = New-Object System.Drawing.Imaging.ColorMatrix
  $matrix.Matrix33 = [single]$Alpha
  $attributes = New-Object System.Drawing.Imaging.ImageAttributes
  $attributes.SetColorMatrix($matrix)
  try {
    $Graphics.DrawImage(
      $Image,
      [System.Drawing.Rectangle]::Round($Destination),
      0,
      0,
      $Image.Width,
      $Image.Height,
      [System.Drawing.GraphicsUnit]::Pixel,
      $attributes
    )
  } finally {
    $attributes.Dispose()
  }
}

function Draw-CoverImage {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)][System.Drawing.Image]$Image,
    [int]$Width,
    [int]$Height,
    [double]$Alpha = 1
  )

  $scale = [Math]::Max($Width / $Image.Width, $Height / $Image.Height)
  $drawWidth = $Image.Width * $scale
  $drawHeight = $Image.Height * $scale
  $x = ($Width - $drawWidth) / 2
  $y = ($Height - $drawHeight) / 2
  Draw-ImageAlpha -Graphics $Graphics -Image $Image -Destination ([System.Drawing.RectangleF]::new($x, $y, $drawWidth, $drawHeight)) -Alpha $Alpha
}

function Draw-TiledImage {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)][System.Drawing.Image]$Image,
    [int]$Width,
    [int]$Height,
    [int]$TileSize = 640,
    [double]$Alpha = 0.3,
    [int]$OffsetX = 0,
    [int]$OffsetY = 0
  )

  for ($x = -$TileSize + $OffsetX; $x -lt $Width + $TileSize; $x += $TileSize) {
    for ($y = -$TileSize + $OffsetY; $y -lt $Height + $TileSize; $y += $TileSize) {
      Draw-ImageAlpha -Graphics $Graphics -Image $Image -Destination ([System.Drawing.RectangleF]::new($x, $y, $TileSize, $TileSize)) -Alpha $Alpha
    }
  }
}

function Fill-RadialGlow {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [int]$X,
    [int]$Y,
    [int]$Width,
    [int]$Height,
    [string]$Color,
    [int]$Alpha
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($X, $Y, $Width, $Height)
  $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush $path
  try {
    $brush.CenterColor = New-Color -Hex $Color -Alpha $Alpha
    $brush.SurroundColors = [System.Drawing.Color[]]@(New-Color -Hex $Color -Alpha 0)
    $Graphics.FillPath($brush, $path)
  } finally {
    $brush.Dispose()
    $path.Dispose()
  }
}

function Draw-CinematicLine {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)][string]$Color,
    [int]$Alpha,
    [float]$Width,
    [System.Drawing.PointF[]]$Points
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $pen = New-Object System.Drawing.Pen (New-Color -Hex $Color -Alpha $Alpha), $Width
  try {
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $path.AddCurve($Points, 0.64)
    $Graphics.DrawPath($pen, $path)
  } finally {
    $pen.Dispose()
    $path.Dispose()
  }
}

function Draw-FractureNetwork {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)][string]$Color,
    [int]$Alpha,
    [float]$Width,
    [int]$Seed,
    [int]$WidthCanvas,
    [int]$HeightCanvas,
    [int]$Count = 22,
    [double]$BranchChance = 0.38
  )

  $random = [System.Random]::new($Seed)
  $pen = New-Object System.Drawing.Pen (New-Color -Hex $Color -Alpha $Alpha), $Width
  try {
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    foreach ($i in 0..($Count - 1)) {
      $x = [double]$random.Next(0, $WidthCanvas)
      $y = [double]$random.Next(0, $HeightCanvas)
      $angle = ($random.NextDouble() * 6.28318530718)
      $segments = 3 + $random.Next(0, 5)
      $last = [System.Drawing.PointF]::new([single]$x, [single]$y)

      foreach ($segment in 0..($segments - 1)) {
        $length = 62 + $random.NextDouble() * 155
        $angle += ($random.NextDouble() - 0.5) * 0.82
        $next = [System.Drawing.PointF]::new(
          [single]($last.X + [Math]::Cos($angle) * $length),
          [single]($last.Y + [Math]::Sin($angle) * $length)
        )
        $Graphics.DrawLine($pen, $last, $next)

        if ($random.NextDouble() -lt $BranchChance) {
          $branchAngle = $angle + (($random.NextDouble() - 0.5) * 1.9)
          $branchLength = 38 + $random.NextDouble() * 90
          $branch = [System.Drawing.PointF]::new(
            [single]($last.X + [Math]::Cos($branchAngle) * $branchLength),
            [single]($last.Y + [Math]::Sin($branchAngle) * $branchLength)
          )
          $Graphics.DrawLine($pen, $last, $branch)
        }

        $last = $next
      }
    }
  } finally {
    $pen.Dispose()
  }
}

function Fill-LinearShade {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [int]$Width,
    [int]$Height,
    [string]$Top,
    [string]$Bottom,
    [int]$TopAlpha = 0,
    [int]$BottomAlpha = 130
  )

  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Rectangle]::new(0, 0, $Width, $Height),
    (New-Color -Hex $Top -Alpha $TopAlpha),
    (New-Color -Hex $Bottom -Alpha $BottomAlpha),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  try {
    $Graphics.FillRectangle($brush, 0, 0, $Width, $Height)
  } finally {
    $brush.Dispose()
  }
}

function Fill-DarkVignette {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [int]$Width,
    [int]$Height,
    [int]$Alpha = 135
  )

  Fill-RadialGlow -Graphics $Graphics -X (-260) -Y (-260) -Width ($Width + 520) -Height ($Height + 520) -Color '#000000' -Alpha 0
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddRectangle([System.Drawing.Rectangle]::new(0, 0, $Width, $Height))
  $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush $path
  try {
    $brush.CenterPoint = [System.Drawing.PointF]::new($Width / 2, $Height / 2)
    $brush.CenterColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
    $brush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb($Alpha, 0, 0, 0))
    $Graphics.FillRectangle($brush, 0, 0, $Width, $Height)
  } finally {
    $brush.Dispose()
    $path.Dispose()
  }
}

function Save-Jpeg {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Bitmap]$Bitmap,
    [Parameter(Mandatory = $true)][string]$Path,
    [long]$Quality = 88
  )

  New-Item -ItemType Directory -Force -Path (Split-Path $Path -Parent) | Out-Null
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' } |
    Select-Object -First 1
  $encoder = [System.Drawing.Imaging.Encoder]::Quality
  $parameters = New-Object System.Drawing.Imaging.EncoderParameters 1
  $parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $encoder, $Quality
  try {
    $Bitmap.Save($Path, $codec, $parameters)
  } finally {
    $parameters.Dispose()
  }
}

$sourcePaths = @{
  forestGround = Get-PolyHavenDiffuse -AssetId 'forrest_ground_01'
  forestFloor = Get-PolyHavenDiffuse -AssetId 'forest_floor'
  forestLeaves = Get-PolyHavenDiffuse -AssetId 'forest_leaves_02'
  mossyGround = Get-AmbientCgMap -AssetId 'Ground037'
  grassRock = Get-PolyHavenDiffuse -AssetId 'aerial_grass_rock'
  ocean = Get-WikimediaOcean
  oceanFoam = Get-AmbientCgMap -AssetId 'Foam003'
  coastSand = Get-PolyHavenDiffuse -AssetId 'coast_sand_03'
  coastRocks = Get-PolyHavenDiffuse -AssetId 'coast_land_rocks_01'
  mountainRock = Get-PolyHavenDiffuse -AssetId 'aerial_rocks_04'
  rockDark = Get-PolyHavenDiffuse -AssetId 'rock_face'
  rockSurface = Get-PolyHavenDiffuse -AssetId 'rock_surface'
  burnedGround = Get-PolyHavenDiffuse -AssetId 'burned_ground_01'
  lavaColor = Get-AmbientCgMap -AssetId 'Lava004' -MapName 'Color'
  lavaEmission = Get-AmbientCgMap -AssetId 'Lava004' -MapName 'Emission'
  snow = Get-AmbientCgMap -AssetId 'Snow014'
  ice = Get-AmbientCgMap -AssetId 'Ice003'
  ruins = Get-PolyHavenDiffuse -AssetId 'rabdentse_ruins_wall'
  mossyCobble = Get-PolyHavenDiffuse -AssetId 'mossy_cobblestone'
  groundRock = Get-PolyHavenDiffuse -AssetId 'aerial_ground_rock'
}

$biomes = @(
  @{
    Id = 'neutral'; Base = 'groundRock'; Overlay = 'rockDark'; Accent = '#91c7bc'; Style = 'neutral'; Quality = 86
  },
  @{
    Id = 'planicie_floresta_inicial'; Base = 'mossyGround'; Overlay = 'grassRock'; Accent = '#c0f08d'; Style = 'plain'; Quality = 88;
    LocalArt = 'MUN_REWORK\Cada ponto de interesse+topdown\Vila\(5) loc_vila_planicie.png'
  },
  @{
    Id = 'praia_litoral_oceano'; Base = 'ocean'; Overlay = 'coastSand'; Accent = '#5bedff'; Style = 'ocean'; Quality = 89;
    LocalArt = 'MUN_REWORK\Cada ponto de interesse+topdown\Praia\(55)alto_mar.png'
  },
  @{
    Id = 'montanhas_vazio_sereno'; Base = 'mountainRock'; Overlay = 'rockDark'; Accent = '#dce7ef'; Style = 'mountain'; Quality = 88;
    LocalArt = 'MUN_REWORK\Cada ponto de interesse+topdown\Montanha\(10) loc_pico_quatro_ventos.png'
  },
  @{
    Id = 'floresta_mistica'; Base = 'forestGround'; Overlay = 'forestLeaves'; Accent = '#9cff67'; Style = 'mysticForest'; Quality = 88;
    LocalArt = 'MUN_REWORK\Cada ponto de interesse+topdown\Floresta Mistica\(37) loc_coracao_verde.png'
  },
  @{
    Id = 'vulcao_terras_cinzentas'; Base = 'burnedGround'; Overlay = 'lavaColor'; Overlay2 = 'lavaEmission'; Accent = '#ff6431'; Style = 'volcano'; Quality = 89;
    LocalArt = 'MUN_REWORK\Cada ponto de interesse+topdown\Vulcao\(18) loc_boca_inferno.png'
  },
  @{
    Id = 'regiao_congelada_neve'; Base = 'snow'; Overlay = 'ice'; Accent = '#c9fbff'; Style = 'ice'; Quality = 88;
    LocalArt = 'MUN_REWORK\Cada ponto de interesse+topdown\Gelo\(22) loc_vale_branco.png'
  },
  @{
    Id = 'ruinas_antigas'; Base = 'ruins'; Overlay = 'mossyCobble'; Accent = '#c292ff'; Style = 'ruins'; Quality = 88;
    LocalArt = 'MUN_REWORK\Cada ponto de interesse+topdown\Ruinas\(30) loc_torre_abismo.png'
  },
  @{
    Id = 'vale_cinzento_veu'; Base = 'groundRock'; Overlay = 'burnedGround'; Accent = '#b7957f'; Style = 'veil'; Quality = 87;
    LocalArt = '06_TOOLS\fushi-tabletop\public\assets\maps\veu-cinzento\exterior-grande\grande-lago\grande_lago_topdown_4000.png'
  }
)

function Draw-Style {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)]$Biome,
    [Parameter(Mandatory = $true)][hashtable]$Images,
    [int]$Width,
    [int]$Height
  )

  $accent = $Biome.Accent
  $style = $Biome.Style

  Fill-RadialGlow -Graphics $Graphics -X 300 -Y 80 -Width 1500 -Height 980 -Color $accent -Alpha 52

  if ($Biome.LocalArt) {
    if ($style -eq 'ocean') {
      Draw-TiledImage -Graphics $Graphics -Image $Images.oceanFoam -Width $Width -Height $Height -TileSize 760 -Alpha 0.18 -OffsetX 80 -OffsetY 140
      Fill-RadialGlow -Graphics $Graphics -X 360 -Y 120 -Width 1340 -Height 960 -Color '#20f5ff' -Alpha 54
      Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#061a22' -Bottom '#02070d' -TopAlpha 4 -BottomAlpha 82
      return
    }

    if ($style -eq 'volcano') {
      Draw-TiledImage -Graphics $Graphics -Image $Images.lavaEmission -Width $Width -Height $Height -TileSize 700 -Alpha 0.18 -OffsetX 70 -OffsetY 200
      Fill-RadialGlow -Graphics $Graphics -X 420 -Y 80 -Width 1220 -Height 980 -Color '#ff2b12' -Alpha 74
      Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#2a0803' -Bottom '#050101' -TopAlpha 6 -BottomAlpha 88
      return
    }

    if ($style -eq 'ice') {
      Draw-TiledImage -Graphics $Graphics -Image $Images.ice -Width $Width -Height $Height -TileSize 760 -Alpha 0.18 -OffsetX 40 -OffsetY 180
      Fill-RadialGlow -Graphics $Graphics -X 360 -Y 130 -Width 1320 -Height 940 -Color '#8beeff' -Alpha 48
      Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#edf8ff' -Bottom '#07121e' -TopAlpha 0 -BottomAlpha 76
      return
    }

    if ($style -eq 'ruins') {
      Draw-TiledImage -Graphics $Graphics -Image $Images.mossyCobble -Width $Width -Height $Height -TileSize 620 -Alpha 0.025 -OffsetX 220 -OffsetY 120
      Fill-RadialGlow -Graphics $Graphics -X 430 -Y 180 -Width 1180 -Height 850 -Color '#8d5dff' -Alpha 46
      Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#150b19' -Bottom '#050408' -TopAlpha 4 -BottomAlpha 86
      return
    }

    if ($style -eq 'mysticForest') {
      Draw-TiledImage -Graphics $Graphics -Image $Images.forestLeaves -Width $Width -Height $Height -TileSize 620 -Alpha 0.14 -OffsetX 80 -OffsetY 210
      Fill-RadialGlow -Graphics $Graphics -X 520 -Y 180 -Width 1020 -Height 780 -Color '#73ff54' -Alpha 48
      Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#07170a' -Bottom '#010503' -TopAlpha 0 -BottomAlpha 88
      return
    }

    if ($style -eq 'plain') {
      Draw-TiledImage -Graphics $Graphics -Image $Images.grassRock -Width $Width -Height $Height -TileSize 720 -Alpha 0.13 -OffsetX 120 -OffsetY 160
      Fill-RadialGlow -Graphics $Graphics -X 360 -Y 160 -Width 1260 -Height 900 -Color '#bfff7d' -Alpha 40
      Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#12220f' -Bottom '#030604' -TopAlpha 0 -BottomAlpha 70
      return
    }

    if ($style -eq 'mountain') {
      Draw-TiledImage -Graphics $Graphics -Image $Images.rockSurface -Width $Width -Height $Height -TileSize 760 -Alpha 0.15 -OffsetX 0 -OffsetY 230
      Fill-RadialGlow -Graphics $Graphics -X 450 -Y 20 -Width 1160 -Height 560 -Color '#e8f7ff' -Alpha 36
      Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#121a22' -Bottom '#020407' -TopAlpha 0 -BottomAlpha 92
      return
    }

    if ($style -eq 'veil') {
      Draw-TiledImage -Graphics $Graphics -Image $Images.rockSurface -Width $Width -Height $Height -TileSize 720 -Alpha 0.13 -OffsetX 260 -OffsetY 0
      Fill-RadialGlow -Graphics $Graphics -X 500 -Y 130 -Width 1100 -Height 900 -Color '#75d9dc' -Alpha 38
      Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#151210' -Bottom '#040403' -TopAlpha 5 -BottomAlpha 94
      return
    }
  }

  if ($style -eq 'ocean') {
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 620 -Alpha 0.15 -OffsetX 110 -OffsetY 70
    Draw-TiledImage -Graphics $Graphics -Image $Images.oceanFoam -Width $Width -Height $Height -TileSize 760 -Alpha 0.24 -OffsetX 80 -OffsetY 140
    Draw-TiledImage -Graphics $Graphics -Image $Images.coastRocks -Width $Width -Height $Height -TileSize 820 -Alpha 0.11 -OffsetX 420 -OffsetY 20
    Draw-FractureNetwork -Graphics $Graphics -Color '#eaffff' -Alpha 34 -Width 2.1 -Seed 705 -WidthCanvas $Width -HeightCanvas $Height -Count 18 -BranchChance 0.18
    Fill-RadialGlow -Graphics $Graphics -X 420 -Y 140 -Width 1220 -Height 860 -Color '#20f5ff' -Alpha 62
    Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#061a22' -Bottom '#02070d' -TopAlpha 18 -BottomAlpha 96
    return
  }

  if ($style -eq 'volcano') {
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 620 -Alpha 0.46 -OffsetX 190 -OffsetY 40
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay2] -Width $Width -Height $Height -TileSize 660 -Alpha 0.58 -OffsetX 70 -OffsetY 200
    Draw-TiledImage -Graphics $Graphics -Image $Images.rockSurface -Width $Width -Height $Height -TileSize 720 -Alpha 0.22 -OffsetX 260 -OffsetY 110
    Draw-FractureNetwork -Graphics $Graphics -Color '#ff260d' -Alpha 160 -Width 11 -Seed 911 -WidthCanvas $Width -HeightCanvas $Height -Count 32 -BranchChance 0.45
    Draw-FractureNetwork -Graphics $Graphics -Color '#ffd46a' -Alpha 126 -Width 3.4 -Seed 912 -WidthCanvas $Width -HeightCanvas $Height -Count 32 -BranchChance 0.45
    Fill-RadialGlow -Graphics $Graphics -X 410 -Y 80 -Width 1280 -Height 1000 -Color '#ff2b12' -Alpha 102
    Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#2a0803' -Bottom '#050101' -TopAlpha 22 -BottomAlpha 116
    return
  }

  if ($style -eq 'ice') {
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 760 -Alpha 0.52 -OffsetX 40 -OffsetY 180
    Draw-FractureNetwork -Graphics $Graphics -Color '#f3ffff' -Alpha 86 -Width 2.8 -Seed 1204 -WidthCanvas $Width -HeightCanvas $Height -Count 34 -BranchChance 0.52
    Draw-FractureNetwork -Graphics $Graphics -Color '#78e8ff' -Alpha 36 -Width 8 -Seed 1208 -WidthCanvas $Width -HeightCanvas $Height -Count 14 -BranchChance 0.28
    Fill-RadialGlow -Graphics $Graphics -X 360 -Y 130 -Width 1320 -Height 940 -Color '#8beeff' -Alpha 68
    Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#edf8ff' -Bottom '#07121e' -TopAlpha 8 -BottomAlpha 84
    return
  }

  if ($style -eq 'ruins') {
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 580 -Alpha 0.48 -OffsetX 220 -OffsetY 120
    Draw-TiledImage -Graphics $Graphics -Image $Images.rockSurface -Width $Width -Height $Height -TileSize 760 -Alpha 0.17 -OffsetX 40 -OffsetY 360
    $pen = New-Object System.Drawing.Pen (New-Color -Hex '#d9b56d' -Alpha 28), 4
    try {
      foreach ($i in 0..8) {
        $x = 100 + $i * 220
        $y = 140 + (($i * 113) % 900)
        $Graphics.DrawRectangle($pen, $x, $y, 180, 125)
      }
    } finally {
      $pen.Dispose()
    }
    Draw-FractureNetwork -Graphics $Graphics -Color '#d8b67c' -Alpha 38 -Width 3 -Seed 334 -WidthCanvas $Width -HeightCanvas $Height -Count 18 -BranchChance 0.28
    Fill-RadialGlow -Graphics $Graphics -X 430 -Y 180 -Width 1180 -Height 850 -Color '#8d5dff' -Alpha 50
    Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#150b19' -Bottom '#050408' -TopAlpha 10 -BottomAlpha 98
    return
  }

  if ($style -eq 'mountain') {
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 700 -Alpha 0.42 -OffsetX 160 -OffsetY 90
    Draw-TiledImage -Graphics $Graphics -Image $Images.rockSurface -Width $Width -Height $Height -TileSize 640 -Alpha 0.24 -OffsetX 0 -OffsetY 230
    foreach ($i in 0..8) {
      $x = -100 + $i * 265
      $brush = New-Object System.Drawing.SolidBrush (New-Color -Hex '#dce7ef' -Alpha 22)
      try {
        $points = [System.Drawing.PointF[]]@(
          [System.Drawing.PointF]::new($x, 1160),
          [System.Drawing.PointF]::new($x + 210, 160 + (($i * 91) % 230)),
          [System.Drawing.PointF]::new($x + 520, 1180)
        )
        $Graphics.FillPolygon($brush, $points)
      } finally {
        $brush.Dispose()
      }
    }
    Draw-FractureNetwork -Graphics $Graphics -Color '#f0f7ff' -Alpha 28 -Width 2.2 -Seed 441 -WidthCanvas $Width -HeightCanvas $Height -Count 20 -BranchChance 0.16
    Fill-RadialGlow -Graphics $Graphics -X 450 -Y 20 -Width 1160 -Height 560 -Color '#e8f7ff' -Alpha 48
    Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#121a22' -Bottom '#020407' -TopAlpha 8 -BottomAlpha 112
    return
  }

  if ($style -eq 'mysticForest') {
    Draw-TiledImage -Graphics $Graphics -Image $Images.forestFloor -Width $Width -Height $Height -TileSize 660 -Alpha 0.38 -OffsetX 260 -OffsetY 90
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 540 -Alpha 0.5 -OffsetX 80 -OffsetY 210
    Draw-FractureNetwork -Graphics $Graphics -Color '#173a18' -Alpha 78 -Width 16 -Seed 223 -WidthCanvas $Width -HeightCanvas $Height -Count 26 -BranchChance 0.64
    Draw-FractureNetwork -Graphics $Graphics -Color '#89ff79' -Alpha 34 -Width 3.4 -Seed 224 -WidthCanvas $Width -HeightCanvas $Height -Count 16 -BranchChance 0.42
    Fill-RadialGlow -Graphics $Graphics -X 520 -Y 180 -Width 1020 -Height 780 -Color '#73ff54' -Alpha 74
    Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#07170a' -Bottom '#010503' -TopAlpha 0 -BottomAlpha 116
    return
  }

  if ($style -eq 'plain') {
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 680 -Alpha 0.42 -OffsetX 120 -OffsetY 160
    Draw-TiledImage -Graphics $Graphics -Image $Images.forestFloor -Width $Width -Height $Height -TileSize 720 -Alpha 0.24 -OffsetX 420 -OffsetY 40
    foreach ($i in 0..5) {
      Draw-CinematicLine -Graphics $Graphics -Color '#d5b16b' -Alpha 22 -Width 30 -Points @(
        [System.Drawing.PointF]::new(-100, 360 + $i * 115),
        [System.Drawing.PointF]::new(500, 420 + $i * 64),
        [System.Drawing.PointF]::new(980, 300 + $i * 90),
        [System.Drawing.PointF]::new(1550, 420 + $i * 68),
        [System.Drawing.PointF]::new(2200, 320 + $i * 70)
      )
    }
    Fill-RadialGlow -Graphics $Graphics -X 360 -Y 160 -Width 1260 -Height 900 -Color '#bfff7d' -Alpha 54
    Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#12220f' -Bottom '#030604' -TopAlpha 0 -BottomAlpha 90
    return
  }

  if ($style -eq 'veil') {
    Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 620 -Alpha 0.48 -OffsetX 90 -OffsetY 110
    Draw-TiledImage -Graphics $Graphics -Image $Images.rockSurface -Width $Width -Height $Height -TileSize 720 -Alpha 0.2 -OffsetX 260 -OffsetY 0
    Draw-FractureNetwork -Graphics $Graphics -Color '#1a100b' -Alpha 78 -Width 18 -Seed 880 -WidthCanvas $Width -HeightCanvas $Height -Count 24 -BranchChance 0.2
    Draw-FractureNetwork -Graphics $Graphics -Color '#d4c0ad' -Alpha 34 -Width 3.1 -Seed 881 -WidthCanvas $Width -HeightCanvas $Height -Count 18 -BranchChance 0.24
    Fill-RadialGlow -Graphics $Graphics -X 500 -Y 130 -Width 1100 -Height 900 -Color '#75d9dc' -Alpha 46
    Fill-LinearShade -Graphics $Graphics -Width $Width -Height $Height -Top '#151210' -Bottom '#040403' -TopAlpha 12 -BottomAlpha 118
    return
  }

  Draw-TiledImage -Graphics $Graphics -Image $Images[$Biome.Overlay] -Width $Width -Height $Height -TileSize 640 -Alpha 0.28 -OffsetX 90 -OffsetY 120
}

$loadedImages = @{}
foreach ($key in $sourcePaths.Keys) {
  $loadedImages[$key] = Load-Bitmap -Path $sourcePaths[$key]
}

try {
  foreach ($biome in $biomes) {
    $width = 2048
    $height = 1280
    $bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.Clear([System.Drawing.Color]::Black)

      $localArt = $null
      if ($biome.LocalArt) {
        $candidate = Join-Path $projectRoot $biome.LocalArt
        if (Test-Path $candidate) {
          $localArt = Load-Bitmap -Path $candidate
        } else {
          Write-Warning "Local art not found: $candidate"
        }
      }

      if ($localArt) {
        Draw-CoverImage -Graphics $graphics -Image $localArt -Width $width -Height $height -Alpha 1
        Draw-CoverImage -Graphics $graphics -Image $loadedImages[$biome.Base] -Width $width -Height $height -Alpha 0.04
      } else {
        Draw-CoverImage -Graphics $graphics -Image $loadedImages[$biome.Base] -Width $width -Height $height -Alpha 1
      }
      Draw-Style -Graphics $graphics -Biome $biome -Images $loadedImages -Width $width -Height $height
      Fill-DarkVignette -Graphics $graphics -Width $width -Height $height -Alpha 118

      $outDir = Join-Path $outputRoot $biome.Id
      $outFile = Join-Path $outDir "cinematic_$($biome.Id)_ultra.jpg"
      Save-Jpeg -Bitmap $bitmap -Path $outFile -Quality $biome.Quality
      Write-Host "Generated $outFile"
    } finally {
      if ($localArt) { $localArt.Dispose() }
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
} finally {
  foreach ($image in $loadedImages.Values) {
    $image.Dispose()
  }
}

$manifest = @"
# Ultra biome texture sources

Final runtime files live in `public/assets/biomes/8-biomas-ultra/<biome>/cinematic_<biome>_ultra.jpg`.
Raw source downloads are cached in `.codex-dev/ultra-biome-sources` and are not required at runtime.

## Licenses

- Poly Haven textures: CC0, https://polyhaven.com/license
- ambientCG materials: CC0 / Public Domain, https://ambientcg.com/license
- Wikimedia Ocean Water Background: Wikimedia Commons file used through Special:Redirect; source page should be kept in release notes if the file is externally redistributed.
- MUN_REWORK local biome art: project-authored FUSHI reference art used only to generate the optimized runtime JPG backdrops.

## Source assets

Poly Haven:
- forrest_ground_01
- forest_floor
- forest_leaves_02
- aerial_grass_rock
- coast_sand_03
- coast_land_rocks_01
- aerial_rocks_04
- rock_face
- rock_surface
- burned_ground_01
- rabdentse_ruins_wall
- mossy_cobblestone
- aerial_ground_rock

ambientCG:
- Ground037
- Foam003
- Lava004
- Snow014
- Ice003

Wikimedia:
- Ocean Water Background

MUN_REWORK local art:
- Vila/(5) loc_vila_planicie.png
- Praia/(55)alto_mar.png
- Montanha/(10) loc_pico_quatro_ventos.png
- Floresta Mistica/(37) loc_coracao_verde.png
- Vulcao/(18) loc_boca_inferno.png
- Gelo/(22) loc_vale_branco.png
- Ruinas/(30) loc_torre_abismo.png
- public/assets/maps/veu-cinzento/exterior-grande/grande-lago/grande_lago_topdown_4000.png

Generated by `scripts/generate-ultra-biome-textures.ps1`.
"@

Set-Content -Path $manifestPath -Value $manifest -Encoding UTF8
