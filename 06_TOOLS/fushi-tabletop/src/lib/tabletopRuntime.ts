import type {
  TabletopAssetLibrary,
  TabletopCameraState,
  TabletopCinematicAsset,
  TabletopMediaAsset,
  TabletopScene,
} from '../data/types'
import {
  DEFAULT_TABLETOP_ZOOM,
  MAX_TABLETOP_ZOOM,
  MIN_TABLETOP_ZOOM,
} from './tabletop'

type UiThemeTone = 'default' | 'cold' | 'warm'
type WeatherVariant = 'none' | 'snow' | 'rain' | 'dust'

interface ThemePalette {
  screenGlow: string
  screenEdge: string
  boardGlow: string
  panelSurface: string
  panelBorder: string
  uiSurface: string
  uiBorder: string
  windowShadow: string
  mapWash: string
  mapFilter: string
}

export interface TabletopUiThemeRuntime {
  id: string
  label: string
  tone: UiThemeTone
  variables: Record<string, string>
}

export interface TabletopWeatherRuntime {
  id: string
  label: string
  variant: WeatherVariant
  density: number
  veilOpacity: number
}

export interface TabletopIntroCardRuntime {
  id: string
  label: string
  title: string
  summary: string
  imageSource: string
  notes: string
}

export interface TabletopCameraRuntime {
  id: string
  label: string
  initialZoom: number
  focusX: number
  focusY: number
}

export interface TabletopAudioTrackRuntime {
  id: string
  label: string
  summary: string
  source: string
}

export interface TabletopAudioRuntime {
  music: TabletopAudioTrackRuntime | null
  ambience: TabletopAudioTrackRuntime | null
}

export interface TabletopCinematicRuntime {
  id: string
  label: string
  category: TabletopCinematicAsset['category']
  summary: string
  previewImage: string
  introCardId: string
}

export interface TabletopSceneRuntime {
  uiTheme: TabletopUiThemeRuntime
  weather: TabletopWeatherRuntime
  introCard: TabletopIntroCardRuntime | null
  camera: TabletopCameraRuntime
  audio: TabletopAudioRuntime
  cinematic: TabletopCinematicRuntime | null
}

const DEFAULT_THEME_PALETTE: ThemePalette = {
  screenGlow: 'rgba(146, 192, 182, 0.12)',
  screenEdge: 'rgba(209, 177, 130, 0.08)',
  boardGlow: 'rgba(146, 192, 182, 0.12)',
  panelSurface:
    'linear-gradient(180deg, rgba(15, 19, 25, 0.95), rgba(9, 12, 17, 0.94))',
  panelBorder: 'rgba(245, 242, 236, 0.12)',
  uiSurface: 'rgba(10, 13, 18, 0.82)',
  uiBorder: 'rgba(245, 242, 236, 0.12)',
  windowShadow: '0 28px 64px rgba(0, 0, 0, 0.42)',
  mapWash:
    'linear-gradient(180deg, rgba(146, 192, 182, 0.06), rgba(5, 7, 9, 0.04))',
  mapFilter: 'saturate(1) contrast(1) brightness(1)',
}

function clampRuntimeZoom(value: number) {
  return Math.max(MIN_TABLETOP_ZOOM, Math.min(MAX_TABLETOP_ZOOM, value))
}

function findAssetById<T extends { id: string }>(
  items: T[] | undefined,
  id: string,
): T | null {
  if (!id || !items) {
    return null
  }

  return items.find((item) => item.id === id) ?? null
}

function withThemeVariables(
  id: string,
  label: string,
  tone: UiThemeTone,
  palette: ThemePalette,
): TabletopUiThemeRuntime {
  return {
    id,
    label,
    tone,
    variables: {
      '--tabletop-screen-glow': palette.screenGlow,
      '--tabletop-screen-edge': palette.screenEdge,
      '--tabletop-board-glow': palette.boardGlow,
      '--tabletop-panel-surface': palette.panelSurface,
      '--tabletop-panel-border': palette.panelBorder,
      '--tabletop-ui-surface': palette.uiSurface,
      '--tabletop-ui-border': palette.uiBorder,
      '--tabletop-window-shadow': palette.windowShadow,
      '--tabletop-map-wash': palette.mapWash,
      '--tabletop-map-filter': palette.mapFilter,
    },
  }
}

function resolveThemePalette(
  themeId: string,
  lightingId: string,
): TabletopUiThemeRuntime {
  const baseTheme =
    themeId === 'ui-fushi-cold' || themeId === 'ui-fushi-fog'
      ? withThemeVariables('ui-fushi-cold', 'FUSHI Frio', 'cold', {
          screenGlow: 'rgba(108, 140, 188, 0.16)',
          screenEdge: 'rgba(159, 188, 214, 0.08)',
          boardGlow: 'rgba(110, 151, 204, 0.16)',
          panelSurface:
            'linear-gradient(180deg, rgba(13, 18, 27, 0.96), rgba(7, 10, 17, 0.96))',
          panelBorder: 'rgba(173, 198, 226, 0.16)',
          uiSurface: 'rgba(8, 12, 20, 0.84)',
          uiBorder: 'rgba(165, 193, 219, 0.16)',
          windowShadow: '0 28px 64px rgba(3, 9, 20, 0.5)',
          mapWash:
            'linear-gradient(180deg, rgba(83, 113, 164, 0.12), rgba(10, 13, 20, 0.08))',
          mapFilter: 'saturate(0.92) contrast(1.04) brightness(0.95)',
        })
      : themeId === 'ui-fushi-warm'
        ? withThemeVariables('ui-fushi-warm', 'FUSHI Calor', 'warm', {
            screenGlow: 'rgba(201, 143, 76, 0.16)',
            screenEdge: 'rgba(223, 181, 114, 0.1)',
            boardGlow: 'rgba(187, 128, 72, 0.14)',
            panelSurface:
              'linear-gradient(180deg, rgba(27, 19, 14, 0.95), rgba(14, 10, 8, 0.95))',
            panelBorder: 'rgba(222, 186, 132, 0.16)',
            uiSurface: 'rgba(21, 14, 10, 0.84)',
            uiBorder: 'rgba(215, 179, 126, 0.16)',
            windowShadow: '0 28px 64px rgba(20, 8, 2, 0.5)',
            mapWash:
              'linear-gradient(180deg, rgba(195, 122, 54, 0.12), rgba(20, 11, 7, 0.08))',
            mapFilter: 'saturate(1.06) contrast(1.04) brightness(0.96)',
          })
        : withThemeVariables(
            'ui-fushi-default',
            'FUSHI Base',
            'default',
            DEFAULT_THEME_PALETTE,
          )

  if (lightingId === 'lighting-cold') {
    return {
      ...baseTheme,
      variables: {
        ...baseTheme.variables,
        '--tabletop-map-wash':
          'linear-gradient(180deg, rgba(92, 126, 182, 0.16), rgba(10, 14, 22, 0.1))',
        '--tabletop-map-filter': 'saturate(0.9) contrast(1.08) brightness(0.93)',
      },
    }
  }

  if (lightingId === 'lighting-warm') {
    return {
      ...baseTheme,
      variables: {
        ...baseTheme.variables,
        '--tabletop-map-wash':
          'linear-gradient(180deg, rgba(199, 126, 58, 0.16), rgba(18, 10, 8, 0.1))',
        '--tabletop-map-filter': 'saturate(1.08) contrast(1.04) brightness(0.95)',
      },
    }
  }

  return baseTheme
}

function resolveWeatherRuntime(
  weatherId: string,
  weatherAsset: { name: string } | null,
): TabletopWeatherRuntime {
  if (!weatherId || weatherId === 'weather-none' || weatherId === 'weather-still') {
    return {
      id: weatherId || 'weather-none',
      label: weatherAsset?.name ?? 'Sem clima',
      variant: 'none',
      density: 0,
      veilOpacity: 0,
    }
  }

  if (weatherId === 'weather-snow') {
    return {
      id: weatherId,
      label: weatherAsset?.name ?? 'Neve',
      variant: 'snow',
      density: 28,
      veilOpacity: 0.08,
    }
  }

  if (weatherId === 'weather-rain') {
    return {
      id: weatherId,
      label: weatherAsset?.name ?? 'Chuva',
      variant: 'rain',
      density: 34,
      veilOpacity: 0.1,
    }
  }

  if (weatherId === 'weather-dust') {
    return {
      id: weatherId,
      label: weatherAsset?.name ?? 'Po',
      variant: 'dust',
      density: 22,
      veilOpacity: 0.11,
    }
  }

  if (weatherId === 'weather-fog') {
    return {
      id: weatherId,
      label: weatherAsset?.name ?? 'Bruma',
      variant: 'dust',
      density: 14,
      veilOpacity: 0.18,
    }
  }

  return {
    id: weatherId,
    label: weatherAsset?.name ?? 'Sem clima',
    variant: 'none',
    density: 0,
    veilOpacity: 0,
  }
}

function resolveIntroCardRuntime(
  scene: TabletopScene,
  introAsset: TabletopMediaAsset | null,
): TabletopIntroCardRuntime | null {
  if (!scene.metadata.introCardId) {
    return null
  }

  return {
    id: scene.metadata.introCardId,
    label: introAsset?.name ?? scene.name,
    title: introAsset?.name ?? scene.name,
    summary: introAsset?.summary ?? 'Entrada de cena pronta para gatilhos futuros.',
    imageSource: introAsset?.source ?? '',
    notes: scene.metadata.notes,
  }
}

function resolveCinematicRuntime(
  scene: TabletopScene,
  cinematicAsset: TabletopCinematicAsset | null,
): TabletopCinematicRuntime | null {
  if (!scene.metadata.cinematicId || !cinematicAsset) {
    return null
  }

  return {
    id: cinematicAsset.id,
    label: cinematicAsset.name,
    category: cinematicAsset.category,
    summary: cinematicAsset.summary,
    previewImage: cinematicAsset.previewImage ?? '',
    introCardId: cinematicAsset.introCardId ?? '',
  }
}

function resolveCameraRuntime(
  cameraId: string,
  cameraAsset: { name: string } | null,
): TabletopCameraRuntime {
  if (cameraId === 'camera-wide') {
    return {
      id: cameraId,
      label: cameraAsset?.name ?? 'Wide',
      initialZoom: 0.9,
      focusX: 0.5,
      focusY: 0.44,
    }
  }

  if (cameraId === 'camera-north') {
    return {
      id: cameraId,
      label: cameraAsset?.name ?? 'Norte',
      initialZoom: 1.06,
      focusX: 0.5,
      focusY: 0.24,
    }
  }

  if (cameraId === 'camera-close') {
    return {
      id: cameraId,
      label: cameraAsset?.name ?? 'Fechada',
      initialZoom: 1.14,
      focusX: 0.5,
      focusY: 0.5,
    }
  }

  return {
    id: cameraId || 'camera-default',
    label: cameraAsset?.name ?? 'Padrao',
    initialZoom: DEFAULT_TABLETOP_ZOOM,
    focusX: 0.5,
    focusY: 0.5,
  }
}

function resolveAudioTrackRuntime(
  trackId: string,
  trackAsset: TabletopMediaAsset | null,
): TabletopAudioTrackRuntime | null {
  if (!trackId || !trackAsset?.source) {
    return null
  }

  return {
    id: trackAsset.id,
    label: trackAsset.name,
    summary: trackAsset.summary,
    source: trackAsset.source,
  }
}

export function resolveTabletopSceneRuntime(input: {
  scene: TabletopScene
  assetLibrary: TabletopAssetLibrary | null
}): TabletopSceneRuntime {
  const { scene, assetLibrary } = input
  const uiThemeAsset = findAssetById(
    assetLibrary?.uiThemes,
    scene.metadata.uiThemePresetId,
  )
  const weatherAsset = findAssetById(
    assetLibrary?.weatherPresets,
    scene.metadata.weatherPresetId,
  )
  const introAsset = findAssetById(
    assetLibrary?.introCards,
    scene.metadata.introCardId,
  )
  const cinematicAsset = findAssetById(
    assetLibrary?.cinematics,
    scene.metadata.cinematicId,
  )
  const musicTrackAsset = findAssetById(
    assetLibrary?.musicTracks,
    scene.metadata.musicTrackId,
  )
  const ambienceTrackAsset = findAssetById(
    assetLibrary?.ambienceTracks,
    scene.metadata.ambienceTrackId,
  )
  const cameraAsset = findAssetById(
    assetLibrary?.cameraPresets,
    scene.metadata.cameraPresetId,
  )

  return {
    uiTheme: resolveThemePalette(
      uiThemeAsset?.id ?? scene.metadata.uiThemePresetId,
      scene.metadata.lightingPresetId,
    ),
    weather: resolveWeatherRuntime(
      weatherAsset?.id ?? scene.metadata.weatherPresetId,
      weatherAsset,
    ),
    introCard: resolveIntroCardRuntime(scene, introAsset),
    camera: resolveCameraRuntime(
      cameraAsset?.id ?? scene.metadata.cameraPresetId,
      cameraAsset,
    ),
    audio: {
      music: resolveAudioTrackRuntime(
        scene.metadata.musicTrackId,
        musicTrackAsset,
      ),
      ambience: resolveAudioTrackRuntime(
        scene.metadata.ambienceTrackId,
        ambienceTrackAsset,
      ),
    },
    cinematic: resolveCinematicRuntime(scene, cinematicAsset),
  }
}

export function getSceneCameraZoom(input: {
  scene: TabletopScene
  cameraRuntime: TabletopCameraRuntime
}) {
  if (typeof input.scene.cameraState?.zoom === 'number') {
    return clampRuntimeZoom(input.scene.cameraState.zoom)
  }

  return clampRuntimeZoom(input.cameraRuntime.initialZoom)
}

function clampCameraScroll(value: number, maxValue: number) {
  return Math.max(0, Math.min(maxValue, value))
}

export function getSceneCameraTarget(input: {
  viewport: HTMLDivElement
  scene: TabletopScene
  cameraRuntime: TabletopCameraRuntime
}): Required<Pick<TabletopCameraState, 'scrollLeft' | 'scrollTop'>> {
  const maxScrollLeft = Math.max(0, input.viewport.scrollWidth - input.viewport.clientWidth)
  const maxScrollTop = Math.max(0, input.viewport.scrollHeight - input.viewport.clientHeight)
  const fallbackScrollLeft = maxScrollLeft * input.cameraRuntime.focusX
  const fallbackScrollTop = maxScrollTop * input.cameraRuntime.focusY

  return {
    scrollLeft: clampCameraScroll(
      input.scene.cameraState?.scrollLeft ?? fallbackScrollLeft,
      maxScrollLeft,
    ),
    scrollTop: clampCameraScroll(
      input.scene.cameraState?.scrollTop ?? fallbackScrollTop,
      maxScrollTop,
    ),
  }
}
