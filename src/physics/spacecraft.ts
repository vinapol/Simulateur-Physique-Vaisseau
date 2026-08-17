import {
  G0,
  HEAVY_CARGO_STRUCTURE_T,
  HEAVY_POD_SIZE,
  SPINE_COM_Z,
  SPINE_DRY_MASS,
  SPINE_POWER_DRAW,
  type PodCount,
  type SpineSlot,
} from '../types/spacecraft'
import type { ShipModuleStats } from '../data/shipModules'

export type ShipTelemetry = {
  dryMass: number
  fuelMass: number
  payloadMass: number
  totalMass: number
  comZ: number
  isp: number | null
  deltaV: number
  powerDraw: number
  powerProduction: number
  powerConsumption: number
  powerNet: number
  ratedThrustN: number
  thrustN: number
  acceleration: number
  inertiaLocal: { Ixx: number; Iyy: number; Izz: number }
}

export type MountedModule = {
  module: ShipModuleStats
  slot: SpineSlot
}

export type TelemetryExtras = {
  payloadMass: number
  podCount: PodCount
  throttle: number
  heavyCargoMounted: boolean
}

export function heavyCargoStructureMass(podCount: PodCount) {
  return HEAVY_CARGO_STRUCTURE_T * (podCount / 4)
}

export function heavyPodLayout(podCount: PodCount) {
  const n = podCount
  const r = 13
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return {
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      z: 0,
      angle: a,
    }
  })
}

export function computeCargoInertia(
  podCount: PodCount,
  structureMass: number,
  payloadMass: number,
) {
  const pods = heavyPodLayout(podCount)
  const m = (structureMass + payloadMass) / Math.max(pods.length, 1)
  const [dx, dy, dz] = HEAVY_POD_SIZE
  const IcmX = (m * (dy * dy + dz * dz)) / 12
  const IcmY = (m * (dx * dx + dz * dz)) / 12
  const IcmZ = (m * (dx * dx + dy * dy)) / 12
  let Ixx = 0
  let Iyy = 0
  let Izz = 0
  for (const p of pods) {
    Ixx += IcmX + m * (p.y * p.y + p.z * p.z)
    Iyy += IcmY + m * (p.x * p.x + p.z * p.z)
    Izz += IcmZ + m * (p.x * p.x + p.y * p.y)
  }
  return { Ixx, Iyy, Izz }
}

export function computeShipTelemetry(
  mounted: MountedModule[],
  extras: TelemetryExtras = {
    payloadMass: 0,
    podCount: 4,
    throttle: 0,
    heavyCargoMounted: false,
  },
): ShipTelemetry {
  let dryMass = SPINE_DRY_MASS
  let fuelMass = 0
  let massMoment = SPINE_DRY_MASS * SPINE_COM_Z
  let powerDraw = SPINE_POWER_DRAW
  let isp: number | null = null
  let ratedThrustN = 0

  const payloadMass = extras.heavyCargoMounted ? extras.payloadMass : 0
  const structureOverride = extras.heavyCargoMounted
    ? heavyCargoStructureMass(extras.podCount)
    : null

  for (const { module, slot } of mounted) {
    const dry =
      module.id === 'heavy-cargo' && structureOverride !== null
        ? structureOverride
        : module.dryMass
    const slotZ =
      slot.id === 'intermediate' && extras.heavyCargoMounted
        ? -26
        : slot.position[2]
    const z = slotZ + (module.comOffsetZ ?? 0)
    const extra =
      module.id === 'heavy-cargo' ? payloadMass : 0
    dryMass += dry
    fuelMass += module.fuelMass
    massMoment += (dry + module.fuelMass + extra) * z
    powerDraw += module.powerDraw
    if (module.category === 'propulsion' && module.isp && module.isp > 0) {
      isp = module.isp
      ratedThrustN = module.ratedThrustN ?? 0
    }
  }

  const totalMass = dryMass + fuelMass + payloadMass
  const burnoutMass = dryMass + payloadMass
  const comZ = totalMass > 1e-9 ? massMoment / totalMass : 0
  const deltaV =
    isp && burnoutMass > 1e-9 && totalMass > burnoutMass
      ? isp * G0 * Math.log(totalMass / burnoutMass)
      : 0

  const powerProduction = mounted.reduce((sum, { module }) => {
    return sum + (module.powerDraw < 0 ? -module.powerDraw : 0)
  }, SPINE_POWER_DRAW < 0 ? -SPINE_POWER_DRAW : 0)
  const powerConsumption = mounted.reduce((sum, { module }) => {
    return sum + (module.powerDraw > 0 ? module.powerDraw : 0)
  }, SPINE_POWER_DRAW > 0 ? SPINE_POWER_DRAW : 0)

  const throttle = Math.min(Math.max(extras.throttle, 0), 1)
  const thrustN = ratedThrustN * throttle
  const massKg = totalMass * 1000
  const acceleration = massKg > 1e-6 ? thrustN / massKg : 0

  const inertiaLocal = extras.heavyCargoMounted
    ? computeCargoInertia(
        extras.podCount,
        structureOverride ?? HEAVY_CARGO_STRUCTURE_T,
        payloadMass,
      )
    : { Ixx: 0, Iyy: 0, Izz: 0 }

  return {
    dryMass,
    fuelMass,
    payloadMass,
    totalMass,
    comZ,
    isp,
    deltaV,
    powerDraw,
    powerProduction,
    powerConsumption,
    powerNet: -powerDraw,
    ratedThrustN,
    thrustN,
    acceleration,
    inertiaLocal,
  }
}
