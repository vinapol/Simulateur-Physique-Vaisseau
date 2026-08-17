export type CircularParams = {
  /** Rayon du cercle (m) */
  radius: number
  /** Vitesse angulaire initiale ω₀ (rad/s) */
  omega0: number
  /** Accélération angulaire α (rad/s²) */
  alpha: number
  /** Angle initial θ₀ (rad) */
  theta0: number
  /** Durée de simulation (s) */
  duration: number
}

export type CircularStats = {
  omegaFinal: number
  thetaFinal: number
  revolutions: number
  linearSpeedFinal: number
  centripetalAccelFinal: number
}

/** ω(t) = ω₀ + α · t */
export function omegaAt(t: number, params: CircularParams): number {
  return params.omega0 + params.alpha * t
}

/** θ(t) = θ₀ + ω₀ · t + ½ · α · t² */
export function thetaAt(t: number, params: CircularParams): number {
  return (
    params.theta0 +
    params.omega0 * t +
    0.5 * params.alpha * t * t
  )
}

export function positionAt(
  t: number,
  params: CircularParams,
): { x: number; y: number } {
  const theta = thetaAt(t, params)
  return {
    x: params.radius * Math.cos(theta),
    y: params.radius * Math.sin(theta),
  }
}

export function computeCircularStats(params: CircularParams): CircularStats {
  const omegaFinal = omegaAt(params.duration, params)
  const thetaFinal = thetaAt(params.duration, params)
  return {
    omegaFinal,
    thetaFinal,
    revolutions: Math.abs(thetaFinal - params.theta0) / (2 * Math.PI),
    linearSpeedFinal: params.radius * Math.abs(omegaFinal),
    centripetalAccelFinal: params.radius * omegaFinal * omegaFinal,
  }
}
