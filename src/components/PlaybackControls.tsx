type PlaybackControlsProps = {
  playing: boolean
  time: number
  duration: number
  speed: number
  onToggle: () => void
  onReset: () => void
  onSeek: (t: number) => void
  onSpeedChange: (speed: number) => void
}

function formatTime(t: number) {
  return t.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PlaybackControls({
  playing,
  time,
  duration,
  speed,
  onToggle,
  onReset,
  onSeek,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="playback">
      <div className="playback__buttons">
        <button
          type="button"
          className="playback__btn playback__btn--primary"
          onClick={onToggle}
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {playing ? 'Pause' : 'Lecture'}
        </button>
        <button
          type="button"
          className="playback__btn"
          onClick={onReset}
          aria-label="Rejouer depuis le début"
        >
          Rejouer
        </button>
      </div>

      <label className="playback__scrub">
        <span className="playback__time">
          t = {formatTime(time)} s
          <span className="playback__time-sep">/</span>
          {formatTime(duration)} s
        </span>
        <input
          type="range"
          min={0}
          max={duration}
          step={Math.max(duration / 500, 0.001)}
          value={time}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Position temporelle"
        />
      </label>

      <label className="playback__speed">
        <span>Vitesse</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          aria-label="Vitesse de lecture"
        >
          <option value={0.25}>0,25×</option>
          <option value={0.5}>0,5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={3}>3×</option>
        </select>
      </label>
    </div>
  )
}
