import type { TrajectoryPoint } from './types'

export type RectilinearParams = {
  /** Position initiale x₀ (m) */
  x0: number
  /** Vitesse initiale v₀ (m/s) */
  v0: number
  /** Accélération a (m/s²) */
  a: number
  /** Durée de simulation (s) */
  duration: number
}

export type RectilinearStats = {
  xFinal: number
  vFinal: number
  displacement: number
  /** Instant où v = 0, si dans [0, T] */
  stopTime: number | null
}

/** x(t) = x₀ + v₀ · t + ½ · a · t² */
export function xAt(t: number, params: RectilinearParams): number {
  return params.x0 + params.v0 * t + 0.5 * params.a * t * t
}

/** v(t) = v₀ + a · t */
export function vAt(t: number, params: RectilinearParams): number {
  return params.v0 + params.a * t
}

export function computeRectilinearStats(
  params: RectilinearParams,
): RectilinearStats {
  const T = Math.max(params.duration, 0)
  const xFinal = xAt(T, params)
  const vFinal = vAt(T, params)

  let stopTime: number | null = null
  if (params.a !== 0) {
    const tStop = -params.v0 / params.a
    if (tStop > 0 && tStop <= T) stopTime = tStop
  }

  return {
    xFinal,
    vFinal,
    displacement: xFinal - params.x0,
    stopTime,
  }
}

export function sampleRectilinear(
  params: RectilinearParams,
  samples = 200,
): TrajectoryPoint[] {
  const T = Math.max(params.duration, 1e-6)
  const points: TrajectoryPoint[] = []
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * T
    points.push({ t, x: t, y: xAt(t, params) })
  }
  return points
}
