import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TabletopTransitionAsset } from '../../data/types'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import type { SharedTransitionPlaybackState } from '../../lib/tabletopSession'

const IMAGE_CLIP_DURATION_MS = 8000
const ENTER_DURATION_MS = 260
const EXIT_DURATION_MS = 320
const PLAYBACK_BROADCAST_INTERVAL_MS = 220
const VIDEO_END_EPSILON_SECONDS = 0.08

interface TabletopTransitionOverlayProps {
  transition: TabletopTransitionAsset
  scenePreviewUrl?: string | null
  isGm: boolean
  playbackState?: SharedTransitionPlaybackState | null
  onPlaybackStateChange?: (state: SharedTransitionPlaybackState) => void
  onConfirm: () => void
  onClose: () => void
}

type TransitionPhase = 'entering' | 'ready' | 'exiting'
type TransitionMediaKind = 'video' | 'image'

function resolveTransitionMediaKind(transition: TabletopTransitionAsset): TransitionMediaKind {
  const assetUrl = transition.assetUrl.split('?')[0].toLowerCase()

  if (assetUrl.endsWith('.mp4') || assetUrl.endsWith('.webm')) {
    return 'video'
  }

  return transition.type === 'video' ? 'video' : 'image'
}

function clampProgress(nextValue: number) {
  return Math.max(0, Math.min(1, nextValue))
}

function formatPlaybackTime(totalSeconds: number) {
  const clampedSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(clampedSeconds / 60)
  const seconds = clampedSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function getVideoDuration(video: HTMLVideoElement | null) {
  const duration = video?.duration ?? 0

  return Number.isFinite(duration) && duration > 0 ? duration : 0
}

function getSafeVideoSeekTime(duration: number, progress: number) {
  if (duration <= 0) {
    return 0
  }

  if (progress >= 1) {
    return Math.max(0, duration - VIDEO_END_EPSILON_SECONDS)
  }

  return duration * progress
}

function TransitionFallbackImage({
  scenePreviewUrl,
  thumbnailUrl,
}: {
  scenePreviewUrl?: string | null
  thumbnailUrl?: string
}) {
  const imageUrls = [thumbnailUrl, scenePreviewUrl]
    .filter((url): url is string => Boolean(url))
    .map((url) => resolveRuntimeAssetUrl(url))
    .filter((url, index, urls) => Boolean(url) && urls.indexOf(url) === index)
  const imageKey = imageUrls.join('|')
  const [imageState, setImageState] = useState({ index: 0, key: '' })
  const imageIndex = imageState.key === imageKey ? imageState.index : 0
  const currentImageUrl = imageUrls[imageIndex] ?? ''

  if (!currentImageUrl) {
    return null
  }

  return (
    <img
      alt=""
      aria-hidden="true"
      className="tabletop-transition-overlay__fallback-image"
      onError={() => setImageState({ index: imageIndex + 1, key: imageKey })}
      src={currentImageUrl}
    />
  )
}

export function TabletopTransitionOverlay({
  transition,
  scenePreviewUrl,
  isGm,
  playbackState,
  onPlaybackStateChange,
  onConfirm,
  onClose,
}: TabletopTransitionOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const imageFrameRef = useRef<number | null>(null)
  const imageTimestampRef = useRef<number | null>(null)
  const imageProgressRef = useRef(0)
  const closeTimeoutRef = useRef<number | null>(null)
  const closingActionRef = useRef<'confirm' | 'dismiss' | null>(null)
  const pendingVideoSeekProgressRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<TransitionPhase>('entering')
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [scrubProgress, setScrubProgress] = useState<number | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [mediaFailureKey, setMediaFailureKey] = useState('')
  const lastBroadcastAtRef = useRef(0)
  const mediaKind = useMemo(() => resolveTransitionMediaKind(transition), [transition])
  const transitionMediaKey = `${transition.id}:${transition.assetUrl}`
  const mediaFailed = mediaFailureKey === transitionMediaKey
  const playbackMediaKind: TransitionMediaKind = mediaFailed ? 'image' : mediaKind
  const displayedProgress = scrubProgress ?? progress
  const timelineMaxSeconds =
    playbackMediaKind === 'video'
      ? Math.max(videoDuration, 0)
      : IMAGE_CLIP_DURATION_MS / 1000
  const currentSeconds = timelineMaxSeconds * displayedProgress
  const isReadOnly = !isGm
  const playbackIsPlaying =
    scrubProgress !== null
      ? false
      : playbackState?.activeTransitionId === transition.id
      ? !playbackState.paused
      : isPlaying

  const clearTimers = useCallback(() => {
    if (imageFrameRef.current !== null) {
      window.cancelAnimationFrame(imageFrameRef.current)
      imageFrameRef.current = null
    }

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const beginClose = useCallback(
    (action: 'confirm' | 'dismiss') => {
      if (closingActionRef.current) {
        return
      }

      closingActionRef.current = action
      setIsPlaying(false)
      setPhase('exiting')
      clearTimers()
      closeTimeoutRef.current = window.setTimeout(() => {
        if (action === 'confirm') {
          onConfirm()
          return
        }

        onClose()
      }, EXIT_DURATION_MS)
    },
    [clearTimers, onClose, onConfirm],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPhase('ready')
    }, ENTER_DURATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const emitPlaybackState = useCallback(
    (input: { currentTime: number; paused: boolean }) => {
      if (!isGm || !onPlaybackStateChange) {
        return
      }

      const nextCurrentTime = Math.max(0, input.currentTime)
      const updatedAt = Date.now()
      const nextState: SharedTransitionPlaybackState = {
        activeTransitionId: transition.id,
        startedAt: input.paused
          ? updatedAt
          : updatedAt - nextCurrentTime * 1000,
        paused: input.paused,
        currentTime: nextCurrentTime,
        mapTargetId: transition.toMapId || null,
        updatedAt,
      }

      onPlaybackStateChange(nextState)
    },
    [isGm, onPlaybackStateChange, transition.id, transition.toMapId],
  )

  useEffect(() => {
    if (
      isGm ||
      !playbackState ||
      playbackState.activeTransitionId !== transition.id ||
      scrubProgress !== null
    ) {
      return
    }

    const targetTimeSeconds = playbackState.paused
      ? playbackState.currentTime
      : Math.max(
          0,
          (Date.now() - playbackState.startedAt) / 1000,
        )

    if (playbackMediaKind === 'video' && videoRef.current) {
      const duration = getVideoDuration(videoRef.current)

      if (duration <= 0) {
        return
      }

      const safeTargetTime =
        Math.min(targetTimeSeconds, Math.max(0, duration - VIDEO_END_EPSILON_SECONDS))

      if (Math.abs(videoRef.current.currentTime - safeTargetTime) > 0.25) {
        videoRef.current.currentTime = safeTargetTime
      }

      setProgress(clampProgress(safeTargetTime / duration))
    } else if (playbackMediaKind === 'image') {
      const nextProgress = clampProgress(
        targetTimeSeconds / (IMAGE_CLIP_DURATION_MS / 1000),
      )
      const frameId = window.requestAnimationFrame(() => {
        setProgress(nextProgress)
      })

      imageProgressRef.current = nextProgress
      imageTimestampRef.current = null

      return () => {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [
    isGm,
    playbackMediaKind,
    playbackState,
    scrubProgress,
    transition.id,
    videoDuration,
  ])

  useEffect(() => {
    if (
      playbackMediaKind !== 'image' ||
      !playbackIsPlaying ||
      phase === 'exiting'
    ) {
      return
    }

    function tick(timestamp: number) {
      if (imageTimestampRef.current === null) {
        imageTimestampRef.current = timestamp
      }

      const deltaMs = timestamp - imageTimestampRef.current
      imageTimestampRef.current = timestamp
      const nextProgress = clampProgress(
        imageProgressRef.current + deltaMs / IMAGE_CLIP_DURATION_MS,
      )

      imageProgressRef.current = nextProgress
      setProgress(nextProgress)

      if (
        !isReadOnly &&
        timestamp - lastBroadcastAtRef.current >= PLAYBACK_BROADCAST_INTERVAL_MS
      ) {
        lastBroadcastAtRef.current = timestamp
        emitPlaybackState({
          currentTime: (IMAGE_CLIP_DURATION_MS / 1000) * nextProgress,
          paused: false,
        })
      }

      if (nextProgress >= 1) {
        if (!isReadOnly) {
          beginClose('confirm')
        }
        imageFrameRef.current = null
        return
      }

      imageFrameRef.current = window.requestAnimationFrame(tick)
    }

    imageFrameRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (imageFrameRef.current !== null) {
        window.cancelAnimationFrame(imageFrameRef.current)
        imageFrameRef.current = null
      }
      imageTimestampRef.current = null
    }
  }, [
    beginClose,
    emitPlaybackState,
    isReadOnly,
    phase,
    playbackIsPlaying,
    playbackMediaKind,
  ])

  useEffect(() => {
    if (mediaKind !== 'video' || !videoRef.current || mediaFailed) {
      return
    }

    videoRef.current.muted = isReadOnly
    videoRef.current.volume = isReadOnly ? 0 : 1

    if (phase === 'exiting' || !playbackIsPlaying || scrubProgress !== null) {
      videoRef.current.pause()
      return
    }

    void videoRef.current.play().catch(() => {
      return
    })
  }, [isReadOnly, mediaFailed, mediaKind, phase, playbackIsPlaying, scrubProgress])

  useEffect(() => {
    if (
      mediaKind !== 'video' ||
      isReadOnly ||
      mediaFailed ||
      phase === 'exiting' ||
      !playbackIsPlaying ||
      scrubProgress !== null
    ) {
      return
    }

    const intervalId = window.setInterval(() => {
      const video = videoRef.current
      const duration = getVideoDuration(video)

      if (!video || duration <= 0) {
        return
      }

      setVideoDuration(duration)
      setProgress(clampProgress(video.currentTime / duration))
      lastBroadcastAtRef.current = Date.now()
      emitPlaybackState({
        currentTime: video.currentTime,
        paused: video.paused,
      })
    }, PLAYBACK_BROADCAST_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [
    emitPlaybackState,
    isReadOnly,
    mediaFailed,
    mediaKind,
    phase,
    playbackIsPlaying,
    scrubProgress,
  ])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  function handleVideoTimeUpdate() {
    const video = videoRef.current
    const duration = getVideoDuration(video)
    const currentTime = video?.currentTime ?? 0

    if (duration <= 0) {
      setProgress(0)
      return
    }

    setVideoDuration(duration)
    setProgress(clampProgress(currentTime / duration))

    const now = Date.now()

    if (!isReadOnly && now - lastBroadcastAtRef.current >= PLAYBACK_BROADCAST_INTERVAL_MS) {
      lastBroadcastAtRef.current = now
      emitPlaybackState({
        currentTime,
        paused: video?.paused ?? !playbackIsPlaying,
      })
    }
  }

  function handleVideoMetadataLoaded() {
    const duration = getVideoDuration(videoRef.current)

    if (duration <= 0) {
      setVideoDuration(0)
      return
    }

    setVideoDuration(duration)

    if (pendingVideoSeekProgressRef.current !== null && videoRef.current) {
      const nextProgress = pendingVideoSeekProgressRef.current
      const nextCurrentTime = getSafeVideoSeekTime(duration, nextProgress)

      pendingVideoSeekProgressRef.current = null
      videoRef.current.currentTime = nextCurrentTime
      videoRef.current.pause()
      setProgress(nextProgress)
      setScrubProgress(null)
      emitPlaybackState({
        currentTime: nextCurrentTime,
        paused: true,
      })
    }
  }

  function handleMediaError() {
    setMediaFailureKey(transitionMediaKey)
    setScrubProgress(null)
    pendingVideoSeekProgressRef.current = null
    imageProgressRef.current = 0
    imageTimestampRef.current = null
    setProgress(0)
    setIsPlaying(true)

    if (isGm) {
      emitPlaybackState({
        currentTime: 0,
        paused: false,
      })
    }
  }

  function handleTimelineChange(nextValue: number) {
    if (isReadOnly) {
      return
    }

    const nextProgress = clampProgress(nextValue / 100)
    let nextCurrentTime = (IMAGE_CLIP_DURATION_MS / 1000) * nextProgress

    if (playbackMediaKind === 'video') {
      const video = videoRef.current
      const duration = getVideoDuration(video)

      if (video && duration > 0) {
        nextCurrentTime = getSafeVideoSeekTime(duration, nextProgress)
        video.currentTime = nextCurrentTime
        video.pause()
        pendingVideoSeekProgressRef.current = null
      } else {
        pendingVideoSeekProgressRef.current = nextProgress
        nextCurrentTime = video?.currentTime ?? playbackState?.currentTime ?? 0
      }
    } else {
      imageProgressRef.current = nextProgress
      imageTimestampRef.current = null
    }

    setIsPlaying(false)
    setScrubProgress(nextProgress)
    setProgress(nextProgress)
    emitPlaybackState({
      currentTime: nextCurrentTime,
      paused: true,
    })
  }

  function handleTimelinePointerDown() {
    if (isReadOnly) {
      return
    }

    const currentProgress = clampProgress(progress)
    let currentTime = (IMAGE_CLIP_DURATION_MS / 1000) * currentProgress

    if (playbackMediaKind === 'video') {
      const video = videoRef.current
      video?.pause()
      currentTime = video?.currentTime ?? playbackState?.currentTime ?? 0
    } else {
      imageTimestampRef.current = null
    }

    setIsPlaying(false)
    setScrubProgress(currentProgress)
    emitPlaybackState({
      currentTime,
      paused: true,
    })
  }

  function handleTimelinePointerUp() {
    if (isReadOnly) {
      return
    }

    const finalProgress = clampProgress(scrubProgress ?? progress)
    const currentTime =
      playbackMediaKind === 'video'
        ? videoRef.current?.currentTime ?? playbackState?.currentTime ?? 0
        : (IMAGE_CLIP_DURATION_MS / 1000) * finalProgress

    setScrubProgress(null)
    setIsPlaying(false)
    emitPlaybackState({
      currentTime,
      paused: true,
    })
  }

  function handlePlayPause() {
    if (isReadOnly) {
      return
    }

    if (playbackMediaKind === 'image' && progress >= 1) {
      imageProgressRef.current = 0
      imageTimestampRef.current = null
      setProgress(0)
      setIsPlaying(true)
      emitPlaybackState({
        currentTime: 0,
        paused: false,
      })
      return
    }

    const nextIsPlaying = !playbackIsPlaying

    if (playbackMediaKind === 'video') {
      const video = videoRef.current

      if (video?.ended && nextIsPlaying) {
        video.currentTime = 0
        setProgress(0)
      }

      if (video) {
        if (nextIsPlaying) {
          void video.play().catch(() => {
            setIsPlaying(false)
            emitPlaybackState({
              currentTime: video.currentTime,
              paused: true,
            })
          })
        } else {
          video.pause()
        }

        setIsPlaying(nextIsPlaying)
        emitPlaybackState({
          currentTime: video.currentTime,
          paused: !nextIsPlaying,
        })
        return
      }
    }

    setIsPlaying(nextIsPlaying)
    emitPlaybackState({
      currentTime:
        playbackMediaKind === 'video'
          ? videoRef.current?.currentTime ?? currentSeconds
          : currentSeconds,
      paused: !nextIsPlaying,
    })
  }

  function handleSkip() {
    if (isReadOnly) {
      return
    }

    if (playbackMediaKind === 'image') {
      imageProgressRef.current = 1
      imageTimestampRef.current = null
      setProgress(1)
    }

    beginClose('confirm')
  }

  return (
    <div
      className={`tabletop-transition-overlay tabletop-transition-overlay--${phase}${
        isGm ? ' tabletop-transition-overlay--gm' : ' tabletop-transition-overlay--player'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className="tabletop-transition-overlay__backdrop" />

      <div className="tabletop-transition-overlay__stage">
        {scenePreviewUrl ? (
          <img
            alt=""
            aria-hidden="true"
            className="tabletop-transition-overlay__map-preview"
            src={resolveRuntimeAssetUrl(scenePreviewUrl)}
          />
        ) : null}

        <div className="tabletop-transition-overlay__wash" />

        <div className="tabletop-transition-overlay__media-frame">
          <div
            className="tabletop-transition-overlay__media"
            style={
              mediaKind === 'image'
                ? {
                    transform: `scale(${1.06 - displayedProgress * 0.06})`,
                  }
                : undefined
            }
          >
            {mediaFailed ? (
              <div className="tabletop-transition-overlay__fallback">
                <TransitionFallbackImage
                  scenePreviewUrl={scenePreviewUrl}
                  thumbnailUrl={transition.thumbnailUrl}
                />
                <div className="tabletop-transition-overlay__fallback-copy">
                  <p className="eyebrow">Interludio</p>
                  <h2>{transition.name}</h2>
                  <p className="support-copy">
                    A midia principal nao respondeu. A previa segura sera usada e a troca
                    de mapa continuara normalmente.
                  </p>
                </div>
              </div>
            ) : mediaKind === 'video' ? (
              <video
                className="tabletop-transition-overlay__video"
                onEnded={() => {
                  setIsPlaying(false)
                  setScrubProgress(null)
                  pendingVideoSeekProgressRef.current = null
                  setProgress(1)

                  if (isGm) {
                    emitPlaybackState({
                      currentTime: getVideoDuration(videoRef.current),
                      paused: true,
                    })
                  }
                }}
                onLoadedMetadata={handleVideoMetadataLoaded}
                onError={handleMediaError}
                onTimeUpdate={handleVideoTimeUpdate}
                playsInline
                poster={resolveRuntimeAssetUrl(transition.thumbnailUrl)}
                preload="auto"
                ref={videoRef}
                src={resolveRuntimeAssetUrl(transition.assetUrl)}
              />
            ) : (
              <img
                alt={transition.name}
                className="tabletop-transition-overlay__image"
                onError={handleMediaError}
                src={resolveRuntimeAssetUrl(transition.assetUrl)}
              />
            )}
          </div>
        </div>

        {isGm ? (
          <div className="tabletop-transition-overlay__gm-controls">
            <div className="tabletop-transition-overlay__timeline-panel">
              <div className="tabletop-transition-overlay__timeline-top">
                <span>{formatPlaybackTime(currentSeconds)}</span>
                <span>{formatPlaybackTime(timelineMaxSeconds)}</span>
              </div>
              <input
                aria-label="Linha do tempo do interludio"
                className="tabletop-transition-overlay__timeline"
                disabled={isReadOnly}
                max={100}
                min={0}
                onBlur={handleTimelinePointerUp}
                onChange={(event) => handleTimelineChange(Number(event.target.value))}
                onInput={(event) => handleTimelineChange(Number(event.currentTarget.value))}
                onPointerCancel={handleTimelinePointerUp}
                onPointerDown={handleTimelinePointerDown}
                onPointerUp={handleTimelinePointerUp}
                step={0.1}
                type="range"
                value={displayedProgress * 100}
              />
              <div className="tabletop-transition-overlay__actions">
                <button className="button" onClick={handlePlayPause} type="button">
                  {playbackIsPlaying ? 'Pausar' : 'Continuar'}
                </button>
                <button className="button" onClick={handleSkip} type="button">
                  Pular
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="tabletop-transition-overlay__player-caption">
            <p className="eyebrow">Interludio</p>
            <h2>{transition.name}</h2>
          </div>
        )}
      </div>
    </div>
  )
}
