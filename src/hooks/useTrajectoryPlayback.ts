import { useCallback, useEffect, useRef, useState } from 'react'

type PlaybackOptions = {
  duration: number
  /** Multiplicateur vitesse lecture (1 = temps réel) */
  speed?: number
  /** Relancer automatiquement à la fin */
  loop?: boolean
  /** Clé qui force un reset (ex: params changés) */
  resetKey?: string | number
  autoPlay?: boolean
  /** Fréquence max des mises à jour React (UI) */
  uiHz?: number
  /** Callback haute fréquence (raf) pour animer le DOM sans React */
  onFrame?: (time: number) => void
}

function finiteDuration(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return 0.1
  return duration
}

export function useTrajectoryPlayback({
  duration,
  speed = 1,
  loop = true,
  resetKey,
  autoPlay = true,
  uiHz = 12,
  onFrame,
}: PlaybackOptions) {
  const [playing, setPlaying] = useState(autoPlay)
  const [time, setTime] = useState(0)
  const timeRef = useRef(0)
  const lastFrameRef = useRef<number | null>(null)
  const lastUiRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  const safeDuration = finiteDuration(duration)
  const uiInterval = 1000 / Math.max(uiHz, 1)

  const reset = useCallback(() => {
    timeRef.current = 0
    setTime(0)
    lastFrameRef.current = null
    lastUiRef.current = 0
    onFrameRef.current?.(0)
  }, [])

  useEffect(() => {
    reset()
    setPlaying(Boolean(autoPlay))
  }, [resetKey, reset, autoPlay])

  useEffect(() => {
    if (!playing) {
      lastFrameRef.current = null
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const tick = (now: number) => {
      if (lastFrameRef.current == null) {
        lastFrameRef.current = now
        lastUiRef.current = now
      }
      const dt = ((now - lastFrameRef.current) / 1000) * Math.max(speed, 0)
      lastFrameRef.current = now

      let next = timeRef.current + dt
      if (!Number.isFinite(next)) next = 0

      if (next >= safeDuration) {
        if (loop) {
          next = next % safeDuration
        } else {
          next = safeDuration
          timeRef.current = next
          setTime(next)
          onFrameRef.current?.(next)
          setPlaying(false)
          return
        }
      }

      timeRef.current = next
      onFrameRef.current?.(next)

      if (now - lastUiRef.current >= uiInterval) {
        lastUiRef.current = now
        setTime(next)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, speed, safeDuration, loop, uiInterval])

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && timeRef.current >= safeDuration - 1e-6) {
        timeRef.current = 0
        setTime(0)
        onFrameRef.current?.(0)
      }
      return !p
    })
  }, [safeDuration])

  const seek = useCallback(
    (t: number) => {
      const next = Math.min(Math.max(t, 0), safeDuration)
      timeRef.current = next
      setTime(next)
      lastFrameRef.current = null
      onFrameRef.current?.(next)
    },
    [safeDuration],
  )

  return {
    time,
    timeRef,
    playing,
    duration: safeDuration,
    progress: time / safeDuration,
    setPlaying,
    toggle,
    reset: () => {
      reset()
      setPlaying(true)
    },
    seek,
  }
}
