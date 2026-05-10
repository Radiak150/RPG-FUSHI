import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TabletopTransitionAsset } from '../../data/types'
import type { SharedTransitionPlaybackState } from '../../lib/tabletopSession'

const IMAGE_CLIP_DURATION_MS = 8000
const ENTER_DURATION_MS = 260
const EXIT_DURATION_MS = 320

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
  const [phase, setPhase] = useState<TransitionPhase>('entering')
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const lastBroadcastAtRef = useRef(0)
  const mediaKind = useMemo(() => resolveTransitionMediaKind(transition), [transition])
  const timelineMaxSeconds =
    mediaKind === 'video' ? Math.max(videoDuration, 0) : IMAGE_CLIP_DURATION_MS / 1000
  const currentSeconds = timelineMaxSeconds * progress
  const isReadOnly = !isGm
  const playbackIsPlaying =
    playbackState?.activeTransitionId === transition.id
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
      const nextState: SharedTransitionPlaybackState = {
        activeTransitionId: transition.id,
        startedAt: input.paused
          ? Date.now()
          : Date.now() - nextCurrentTime * 1000,
        paused: input.paused,
        currentTime: nextCurrentTime,
        mapTargetId: transition.toMapId ?? null,
      }

      onPlaybackStateChange(nextState)
    },
    [isGm, onPlaybackStateChange, transition.id, transition.toMapId],
  )

  useEffect(() => {
    if (!playbackState || playbackState.activeTransitionId !== transition.id) {
      return
    }

    const targetTimeSeconds = playbackState.paused
      ? playbackState.currentTime
      : Math.max(
          0,
          (Date.now() - playbackState.startedAt) / 1000,
        )

    if (mediaKind === 'video' && videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - targetTimeSeconds) > 0.25) {
        videoRef.current.currentTime = targetTimeSeconds
      }
    } else if (mediaKind === 'image') {
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
  }, [mediaKind, playbackState, transition.id])

  useEffect(() => {
    if (
      mediaKind !== 'image' ||
      !playbackIsPlaying ||
      phase === 'exiting' ||
      isReadOnly
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

      if (timestamp - lastBroadcastAtRef.current >= 250) {
        lastBroadcastAtRef.current = timestamp
        emitPlaybackState({
          currentTime: (IMAGE_CLIP_DURATION_MS / 1000) * nextProgress,
          paused: false,
        })
      }

      if (nextProgress >= 1) {
        beginClose('confirm')
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
  }, [beginClose, emitPlaybackState, isReadOnly, mediaKind, phase, playbackIsPlaying])

  useEffect(() => {
    if (mediaKind !== 'video' || !videoRef.current) {
      return
    }

    videoRef.current.muted = false
    videoRef.current.volume = 1

    if (phase === 'exiting' || !playbackIsPlaying) {
      videoRef.current.pause()
      return
    }

    void videoRef.current.play().catch(() => {
      return
    })
  }, [mediaKind, phase, playbackIsPlaying])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  function handleVideoTimeUpdate() {
    const duration = videoRef.current?.duration ?? 0
    const currentTime = videoRef.current?.currentTime ?? 0

    if (!Number.isFinite(duration) || duration <= 0) {
      setProgress(0)
      return
    }

    setVideoDuration(duration)
    setProgress(clampProgress(currentTime / duration))

    if (!isReadOnly) {
      emitPlaybackState({
        currentTime,
        paused: false,
      })
    }
  }

  function handleVideoMetadataLoaded() {
    const duration = videoRef.current?.duration ?? 0

    if (!Number.isFinite(duration) || duration <= 0) {
      setVideoDuration(0)
      return
    }

    setVideoDuration(duration)
  }

  function handleTimelineChange(nextValue: number) {
    if (isReadOnly) {
      return
    }

    const nextProgress = clampProgress(nextValue / 100)

    if (mediaKind === 'video') {
      const duration = videoRef.current?.duration ?? 0

      if (videoRef.current && Number.isFinite(duration) && duration > 0) {
        videoRef.current.currentTime = duration * nextProgress
      }
    } else {
      imageProgressRef.current = nextProgress
      imageTimestampRef.current = null
    }

    setProgress(nextProgress)
    emitPlaybackState({
      currentTime:
        mediaKind === 'video'
          ? (videoRef.current?.duration ?? 0) * nextProgress
          : (IMAGE_CLIP_DURATION_MS / 1000) * nextProgress,
      paused: !playbackIsPlaying,
    })
  }

  function handlePlayPause() {
    if (isReadOnly) {
      return
    }

    if (mediaKind === 'image' && progress >= 1) {
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

    if (mediaKind === 'video' && videoRef.current && progress >= 1) {
      videoRef.current.currentTime = 0
      setProgress(0)
    }

    const nextIsPlaying = !playbackIsPlaying

    setIsPlaying(nextIsPlaying)
    emitPlaybackState({
      currentTime:
        mediaKind === 'video'
          ? videoRef.current?.currentTime ?? currentSeconds
          : currentSeconds,
      paused: !nextIsPlaying,
    })
  }

  function handleSkip() {
    if (isReadOnly) {
      return
    }

    if (mediaKind === 'image') {
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
      {isGm ? (
        <button
          aria-label="Fechar transicao"
          className="tabletop-transition-overlay__backdrop"
          onClick={() => beginClose('dismiss')}
          type="button"
        />
      ) : (
        <div className="tabletop-transition-overlay__backdrop" />
      )}

      <div className="tabletop-transition-overlay__stage">
        {scenePreviewUrl ? (
          <img
            alt=""
            aria-hidden="true"
            className="tabletop-transition-overlay__map-preview"
            src={scenePreviewUrl}
          />
        ) : null}

        <div className="tabletop-transition-overlay__wash" />

        <div className="tabletop-transition-overlay__media-frame">
          <div
            className="tabletop-transition-overlay__media"
            style={
              mediaKind === 'image'
                ? {
                    transform: `scale(${1.06 - progress * 0.06})`,
                  }
                : undefined
            }
          >
            {mediaKind === 'video' ? (
              <video
                className="tabletop-transition-overlay__video"
                onEnded={() => beginClose('confirm')}
                onLoadedMetadata={handleVideoMetadataLoaded}
                onTimeUpdate={handleVideoTimeUpdate}
                playsInline
                poster={transition.thumbnailUrl}
                preload="metadata"
                ref={videoRef}
                src={transition.assetUrl}
              />
            ) : (
              <img
                alt={transition.name}
                className="tabletop-transition-overlay__image"
                src={transition.assetUrl}
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
                onChange={(event) => handleTimelineChange(Number(event.target.value))}
                step={0.1}
                type="range"
                value={progress * 100}
              />
              <div className="tabletop-transition-overlay__actions">
                <button className="button" onClick={handlePlayPause} type="button">
                  {playbackIsPlaying ? 'Pause' : 'Play'}
                </button>
                <button className="button" onClick={handleSkip} type="button">
                  Skip
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
