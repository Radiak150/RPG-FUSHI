import type { TabletopAudioTrackRuntime } from './tabletopRuntime'

export type TabletopAudioTransportState = 'playing' | 'paused' | 'stopped'
export type TabletopAudioChannelId = 'music' | 'ambience'

export interface TabletopAudioChannelState {
  channelId: TabletopAudioChannelId
  element: HTMLAudioElement
  track: TabletopAudioTrackRuntime | null
  volume: number
  shouldPlay: boolean
  restart: boolean
}

export function createTabletopAudioElement() {
  const audio = new Audio()
  audio.loop = true
  audio.preload = 'auto'

  return audio
}

export function sanitizeAudioVolume(value: number) {
  if (Number.isNaN(value)) {
    return 0.5
  }

  return Math.min(1, Math.max(0, value))
}

export function stopAudioElement(element: HTMLAudioElement) {
  element.pause()
  element.currentTime = 0
}

export async function syncTabletopAudioChannel(
  state: TabletopAudioChannelState,
) {
  const { element, track, volume, shouldPlay, restart } = state
  const nextVolume = sanitizeAudioVolume(volume)
  const hasTrack = Boolean(track?.source)
  const nextSource = track?.source ?? ''
  const currentSource = element.getAttribute('src') ?? element.src ?? ''
  const shouldReplaceTrack = currentSource !== nextSource || restart

  element.loop = true
  element.volume = nextVolume

  if (!hasTrack) {
    if (currentSource) {
      stopAudioElement(element)
      element.removeAttribute('src')
      element.load()
    }

    return 'idle'
  }

  if (shouldReplaceTrack) {
    stopAudioElement(element)
    element.src = nextSource
    element.load()
  }

  if (!shouldPlay) {
    element.pause()
    return 'paused'
  }

  try {
    await element.play()
    return 'playing'
  } catch {
    return 'blocked'
  }
}
