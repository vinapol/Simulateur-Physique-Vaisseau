import { createContext } from 'react'
import type { PodCount, ShipPresetId, SlotId, SpineSlot } from '../types/spacecraft'

export type ShipConfiguration = {
  spineSlots: SpineSlot[]
  activePreset: ShipPresetId | null
  selectedSlotId: SlotId | null
  omega: number
  thrust: number
  showShield: boolean
  elevatorAuto: boolean
  elevatorPosition: number
  podCount: PodCount
  heavyCargoMass: number
  setSlotModule: (slotId: SlotId, moduleId: string | null) => void
  applyPreset: (preset: ShipPresetId) => void
  selectSlot: (slotId: SlotId | null) => void
  setOmega: (value: number) => void
  setThrust: (value: number) => void
  setShowShield: (value: boolean) => void
  setElevatorAuto: (value: boolean) => void
  setElevatorPosition: (value: number) => void
  setPodCount: (value: PodCount) => void
  setHeavyCargoMass: (value: number) => void
  resetShip: () => void
}

export const ShipConfigurationContext =
  createContext<ShipConfiguration | null>(null)
