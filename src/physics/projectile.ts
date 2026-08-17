import type { TrajectoryPoint } from './types'

export type { TrajectoryPoint }

export type ProjectileParams = {
  /** Composante horizontale V₀ · cos(θ) (m/s) */
  vx0: number
  /** Composante verticale V₀ · sin(θ) (m/s) */
  vy0: number
  y0: number
  g: number
}

export type ProjectileStats = {
  flightTime: number
  range: number
  maxHeight: number
  timeToMaxHeight: number
  v0: number
  thetaDeg: number
}

/** V₀ = √(vx₀² + vy₀²) */
export function speedFromComponents(params: ProjectileParams): number {
  return Math.hypot(params.vx0, params.vy0)
}

/** θ = atan2(vy₀, vx₀) en degrés */
export function angleFromComponents(params: ProjectileParams): number {
  return (Math.atan2(params.vy0, params.vx0) * 180) / Math.PI
}

/** x(t) = vx₀ · t  (= V₀ · cos(θ) · t) */
export function xAt(t: number, params: ProjectileParams): number {
  return params.vx0 * t
}

/** y(t) = Y₀ + vy₀ · t − ½ · g · t² */
export function yAt(t: number, params: ProjectileParams): number {
  return params.y0 + params.vy0 * t - 0.5 * params.g * t * t
}

function safePositive(n: number, fallback: number) {
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** Temps de vol jusqu'au retour au sol (y = 0) */
export function flightTime(params: ProjectileParams): number {
  const g = safePositive(params.g, 9.81)
  const a = -0.5 * g
  const b = params.vy0
  const c = Math.max(params.y0, 0)

  const disc = b * b - 4 * a * c
  if (disc < 0) {
    return Math.max(Math.abs(b) / g, 0.1) * 2
  }

  const sqrtDisc = Math.sqrt(disc)
  const t1 = (-b + sqrtDisc) / (2 * a)
  const t2 = (-b - sqrtDisc) / (2 * a)
  const positive = [t1, t2].filter((t) => Number.isFinite(t) && t > 1e-9)
  if (positive.length === 0) return 0.1
  return Math.min(Math.max(...positive), 3600)
}

export function computeStats(params: ProjectileParams): ProjectileStats {
  const g = safePositive(params.g, 9.81)
  const tFlight = flightTime(params)
  const tApex = Math.max(params.vy0 / g, 0)

  return {
    flightTime: tFlight,
    range: xAt(tFlight, params),
    maxHeight: yAt(Math.min(tApex, tFlight), params),
    timeToMaxHeight: Math.min(tApex, tFlight),
    v0: speedFromComponents(params),
    thetaDeg: angleFromComponents(params),
  }
}

export function sampleTrajectory(
  params: ProjectileParams,
  samples = 200,
): TrajectoryPoint[] {
  const T = flightTime(params)
  if (T <= 0) return [{ t: 0, x: 0, y: params.y0 }]

  const points: TrajectoryPoint[] = []
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * T
    const y = yAt(t, params)
    points.push({ t, x: xAt(t, params), y: Math.max(y, 0) })
    if (y < 0 && i > 0) break
  }
  return points
}
