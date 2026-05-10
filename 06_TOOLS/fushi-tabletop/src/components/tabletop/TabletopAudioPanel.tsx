import type { TabletopAudioTrackRuntime } from '../../lib/tabletopRuntime'
import type { TabletopAudioTransportState } from '../../lib/tabletopAudio'

interface TabletopAudioPanelProps {
  transportState: TabletopAudioTransportState
  musicTrack: TabletopAudioTrackRuntime | null
  ambienceTrack: TabletopAudioTrackRuntime | null
  musicVolume: number
  ambienceVolume: number
  statusMessage: string
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onMusicVolumeChange: (value: number) => void
  onAmbienceVolumeChange: (value: number) => void
}

function formatVolumeValue(value: number) {
  return Math.round(value * 100)
}

export function TabletopAudioPanel({
  transportState,
  musicTrack,
  ambienceTrack,
  musicVolume,
  ambienceVolume,
  statusMessage,
  onPlay,
  onPause,
  onStop,
  onMusicVolumeChange,
  onAmbienceVolumeChange,
}: TabletopAudioPanelProps) {
  return (
    <div className="tabletop-audio-panel">
      <article className="list-card">
        <div className="list-card__top">
          <h3>Transporte</h3>
          <span className="tag">{transportState}</span>
        </div>
        <div className="tabletop-audio-panel__transport">
          <button className="button button--primary" onClick={onPlay} type="button">
            Play
          </button>
          <button className="button" onClick={onPause} type="button">
            Pause
          </button>
          <button className="button" onClick={onStop} type="button">
            Stop
          </button>
        </div>
        {statusMessage ? <p className="support-copy">{statusMessage}</p> : null}
      </article>

      <article className="list-card">
        <div className="list-card__top">
          <h3>Musica</h3>
          <span className="tag">{musicTrack ? 'ativa' : 'vazia'}</span>
        </div>
        <p className="support-copy">
          {musicTrack?.label ?? 'Nenhuma trilha principal configurada para esta cena.'}
        </p>
        {musicTrack?.summary ? (
          <p className="support-copy">{musicTrack.summary}</p>
        ) : null}
        <label className="field">
          <span>Volume {formatVolumeValue(musicVolume)}%</span>
          <input
            className="tabletop-audio-panel__slider"
            max={100}
            min={0}
            onChange={(event) => onMusicVolumeChange(Number(event.target.value) / 100)}
            type="range"
            value={formatVolumeValue(musicVolume)}
          />
        </label>
      </article>

      <article className="list-card">
        <div className="list-card__top">
          <h3>Ambiencia</h3>
          <span className="tag">{ambienceTrack ? 'ativa' : 'vazia'}</span>
        </div>
        <p className="support-copy">
          {ambienceTrack?.label ?? 'Nenhuma ambiencia configurada para esta cena.'}
        </p>
        {ambienceTrack?.summary ? (
          <p className="support-copy">{ambienceTrack.summary}</p>
        ) : null}
        <label className="field">
          <span>Volume {formatVolumeValue(ambienceVolume)}%</span>
          <input
            className="tabletop-audio-panel__slider"
            max={100}
            min={0}
            onChange={(event) => onAmbienceVolumeChange(Number(event.target.value) / 100)}
            type="range"
            value={formatVolumeValue(ambienceVolume)}
          />
        </label>
      </article>
    </div>
  )
}
