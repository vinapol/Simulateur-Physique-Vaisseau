import { useEffect, useMemo, useRef, useState } from 'react'

export const PLAYBACK_SPEEDS = [1, 10, 100] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

export function useOrbitPlayback(resetKey: string | number) {
  const timeDaysRef = useRef(0)
  const playingRef = useRef(true)
  const speedRef = useRef<PlaybackSpeed>(1)
  const [playing, setPlayingState] = useState(true)
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1)
  const [resetSerial, setResetSerial] = useState(0)
  const [displayDays, setDisplayDays] = useState(0)

  useEffect(() => {
    timeDaysRef.current = 0
    setDisplayDays(0)
  }, [resetKey])

  useEffect(() => {
    const id = window.setInterval(() => {
      setDisplayDays(timeDaysRef.current)
    }, 80)
    return () => window.clearInterval(id)
  }, [])

  return useMemo(
    () => ({
      timeDaysRef,
      playingRef,
      speedRef,
      playing,
      speed,
      displayDays,
      resetSerial,
      setPlaying: (value: boolean) => {
        playingRef.current = value
        setPlayingState(value)
      },
      setSpeed: (value: PlaybackSpeed) => {
        speedRef.current = value
        setSpeedState(value)
      },
      reset: () => {
        timeDaysRef.current = 0
        setDisplayDays(0)
        setResetSerial((n) => n + 1)
      },
    }),
    [playing, speed, displayDays, resetSerial],
  )
}

export type OrbitPlayback = ReturnType<typeof useOrbitPlayback>
