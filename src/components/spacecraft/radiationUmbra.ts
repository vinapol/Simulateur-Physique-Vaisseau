import type { PodCount, SpineSlot } from '../../types/spacecraft'
import {
  AIRLOCK_RADIUS,
  MODULE_RADIUS,
  RING_RADIUS,
  SHIELD_HALF_ANGLE,
  TANK_RADIAL,
  TANK_RADIUS,
  Z_NOSE,
} from './constants'

const MARGIN = 1.08
const HALF_ANGLE_MIN = SHIELD_HALF_ANGLE
const HALF_ANGLE_MAX = (48 * Math.PI) / 180

type Envelope = { zAft: number; radius: number }

function envelopeFor(
  moduleId: string,
  slotZ: number,
  _podCount: PodCount,
): Envelope | null {
  switch (moduleId) {
    case 'centrifuge-hab':
      return {
        zAft: slotZ - MODULE_RADIUS,
        radius: RING_RADIUS + MODULE_RADIUS,
      }
    case 'heavy-cargo': {
      const layoutR = 13
      const podHalf = 6
      const podHalfZ = 13
      return {
        zAft: slotZ - podHalfZ,
        radius: layoutR + podHalf * Math.SQRT2,
      }
    }
    case 'cargo-bay':
      return { zAft: slotZ - 11, radius: 12.5 }
    case 'cryo-tanks':
    case 'argon-tanks':
      return {
        zAft: slotZ - TANK_RADIUS,
        radius: TANK_RADIAL + TANK_RADIUS + 1.6,
      }
    case 'docking-nose':
      return { zAft: slotZ - 4, radius: AIRLOCK_RADIUS + 0.4 }
    default:
      return null
  }
}

/** Demi-angle d’umbra pour couvrir la charge utile / l’équipage. */
export function shieldHalfAngleForShip(
  spineSlots: SpineSlot[],
  apexWorldZ: number,
  podCount: PodCount,
) {
  let tanMax = Math.tan(HALF_ANGLE_MIN)
  for (const slot of spineSlots) {
    if (!slot.mountedModuleId || slot.id === 'aft') continue
    const env = envelopeFor(slot.mountedModuleId, slot.position[2], podCount)
    if (!env) continue
    const dz = env.zAft - apexWorldZ
    if (dz < 4) continue
    tanMax = Math.max(tanMax, (env.radius * MARGIN) / dz)
  }
  return Math.min(Math.atan(tanMax), HALF_ANGLE_MAX)
}

export function umbraHeightFromApex(apexWorldZ: number) {
  return Math.max(Z_NOSE - 2 - apexWorldZ, 8)
}
