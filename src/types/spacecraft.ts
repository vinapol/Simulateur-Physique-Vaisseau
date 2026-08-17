import type { FC } from 'react'

export type Vec3 = [number, number, number]

export type ModuleCategory =
  | 'propulsion'
  | 'payload'
  | 'habitation'
  | 'power'
  | 'docking'

export type SlotId = 'forward' | 'median' | 'intermediate' | 'aft'

export type ShipPresetId = 'liner' | 'tug' | 'hauler'

export type PodCount = 2 | 4

export interface ShipModule {
  id: string
  name: string
  category: ModuleCategory
  /** Masse sèche en tonnes. */
  dryMass: number
  /** Masse d’ergols en tonnes. */
  fuelMass: number
  /** Bilan électrique en kW (négatif = production). */
  powerDraw: number
  component: FC<{ slotPosition: Vec3 }>
  /** Impulsion spécifique en secondes (propulsion). */
  isp?: number
  /** Décalage du CoM le long de +Z local, en mètres. */
  comOffsetZ?: number
  /** Poussée nominale en newtons. */
  ratedThrustN?: number
}

export interface SpineSlot {
  id: SlotId
  name: string
  position: Vec3
  allowedCategories: ModuleCategory[]
  allowedModuleIds: string[]
  mountedModuleId: string | null
}

export const SLOT_LAYOUT: Omit<SpineSlot, 'mountedModuleId'>[] = [
  {
    id: 'forward',
    name: 'Slot Avant',
    position: [0, 0, 54],
    allowedCategories: ['docking'],
    allowedModuleIds: ['docking-nose'],
  },
  {
    id: 'median',
    name: 'Slot Médian',
    position: [0, 0, 0],
    allowedCategories: ['habitation', 'payload'],
    allowedModuleIds: ['centrifuge-hab', 'cargo-bay', 'heavy-cargo', 'cryo-tanks', 'argon-tanks'],
  },
  {
    id: 'intermediate',
    name: 'Slot Intermédiaire',
    position: [0, 0, -11],
    allowedCategories: ['payload'],
    allowedModuleIds: ['cryo-tanks', 'argon-tanks'],
  },
  {
    id: 'aft',
    name: 'Slot Arrière',
    position: [0, 0, -50],
    allowedCategories: ['propulsion'],
    allowedModuleIds: ['ntp', 'ion'],
  },
]

export const SHIP_PRESETS: Record<ShipPresetId, Record<SlotId, string | null>> =
  {
    liner: {
      forward: 'docking-nose',
      median: 'centrifuge-hab',
      intermediate: 'cryo-tanks',
      aft: 'ntp',
    },
    hauler: {
      forward: 'docking-nose',
      median: 'heavy-cargo',
      intermediate: null,
      aft: 'ion',
    },
    tug: {
      forward: 'docking-nose',
      median: 'cryo-tanks',
      intermediate: 'cryo-tanks',
      aft: 'ntp',
    },
  }

export const SHIP_PRESET_LABELS: Record<ShipPresetId, string> = {
  liner: 'DSTV-Liner (Habitation & Équipage)',
  hauler: 'DSTV-Heavy Hauler (Fret Lourd Interplanétaire)',
  tug: 'DSTV-Tug (Ravitailleur / Transfert Orbital)',
}

export const SHIP_PRESET_ROLES: Record<ShipPresetId, string> = {
  liner: 'Transport habité rapide vers Mars (~140 j) · NTP 912 s',
  hauler: 'Logistique lourde économique (~380 j) · NEP 4 500 s',
  tug: 'Ravitaillement d’ergols et remorquage lourd · NTP',
}

export const SPINE_DRY_MASS = 22
export const SPINE_POWER_DRAW = 5
export const SPINE_COM_Z = 0
export const G0 = 9.81

export const HEAVY_CARGO_STRUCTURE_T = 35
export const HEAVY_CARGO_MASS_MIN = 0
export const HEAVY_CARGO_MASS_MAX = 400

export function heavyCargoCapacity(podCount: PodCount) {
  return podCount === 2 ? 200 : 400
}

export const HEAVY_POD_SIZE: Vec3 = [12, 12, 26]
export const ION_ISP = 4500
export const ION_RATED_THRUST_N = 4800
export const NTP_RATED_THRUST_N = 110_000

export function createSpineSlots(
  mounts: Record<SlotId, string | null>,
): SpineSlot[] {
  return SLOT_LAYOUT.map((slot) => ({
    ...slot,
    mountedModuleId: mounts[slot.id],
  }))
}
