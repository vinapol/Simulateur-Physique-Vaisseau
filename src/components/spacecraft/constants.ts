/** 1 unité Three.js = 1 mètre. Avant = +Z, tuyère = −Z.
 *  Cotes alignées sur la fiche technique DSTV-80
 *  (`gemini-code-1786923661213.md`).
 */

export const TRUSS_LENGTH = 120
export const TRUSS_RADIUS = 0.85
export const Z_NOSE = 60
export const Z_AFT = -60

export const AIRLOCK_RADIUS = 2.15
export const AIRLOCK_LENGTH = 8.5
export const AIRLOCK_Z = 51.2

export const DOCKING_Z = 58.7

export const HUB_STATOR_RADIUS = 3.55
export const HUB_ROTOR_RADIUS = 4.4
export const HUB_LENGTH = 7.2

export const TANK_RADIUS = 4.8
export const TANK_RADIAL = 10.5
export const TANK_Z = -11
export const TANK_ANGLES = [22.5, 112.5, 202.5, 292.5].map(
  (deg) => (deg * Math.PI) / 180,
)

export const RING_RADIUS = 40
export const MODULE_COUNT = 8
export const MODULE_RADIUS = 3.15
export const MODULE_LENGTH = 13.4
export const CORRIDOR_RADIUS = 1.42
export const G = 9.81

export const COLLAR_Z = 20.5
export const COLLAR_RADIUS = 2.35

export const SHIELD_Z = -39.2
export const SHIELD_LEN = 9.2
export const SHIELD_R_AFT = 6.5
export const SHIELD_R_FWD = 2.15

export const RADIATOR_Z = -47.6
export const RADIATOR_SPAN = 30
export const RADIATOR_WIDTH = 8.6
export const RADIATOR_THICK = 0.16

export const REACTOR_Z = -53.1
export const REACTOR_RADIUS = 2.12
export const REACTOR_LENGTH = 5.1

export const NOZZLE_LENGTH = 7.4

/** 4,77 RPM ≈ 0,50 rad/s → ω²R ≈ 1 g à 40 m */
export const DEFAULT_OMEGA = 0.5
/** g au plancher de l’anneau au régime nominal (ω²R / g₀) */
export const ELEVATOR_G_RING = 1.02

/** Module 0 (θ = 0) : rayon d’ascenseur 1 g ↔ 0 g */
export const ELEVATOR_THETA = 0
export const ELEVATOR_RAIL_Z = 1.52
export const ELEVATOR_RAIL_RADIUS = 0.16
export const ELEVATOR_R_HUB = 7.35
export const ELEVATOR_R_RING = 33.6
export const ELEVATOR_TRAVEL_S = 9
export const ELEVATOR_PAUSE_S = 3.2

/** Cabine pressurisée — diamètre intérieur 2,8 m */
export const CABIN_INNER_R = 1.4
export const CABIN_OUTER_R = 1.5
export const CABIN_HALF_LEN = 1.45
export const CABIN_LED = '#f2f0e6'

export const HULL = '#d5dbe3'
export const HULL_DARK = '#8b949e'
export const METAL = '#6f7884'
export const METAL_DARK = '#3d434c'
export const GOLD_MLI = '#d4a017'
export const GOLD_SEAM = '#a67c0a'
export const WINDOW = '#16324a'
export const WINDOW_GLOW = '#5ec8ff'
export const CABLE = '#222328'
export const TUNGSTEN = '#4a453c'
export const COPPER = '#b87333'
