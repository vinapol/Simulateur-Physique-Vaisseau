import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_OMEGA } from '../components/spacecraft/constants'
import {
  HEAVY_CARGO_MASS_MAX,
  SHIP_PRESETS,
  createSpineSlots,
  type PodCount,
  type ShipPresetId,
  type SlotId,
  type SpineSlot,
} from '../types/spacecraft'
import {
  ShipConfigurationContext,
  type ShipConfiguration,
} from './shipConfigurationContext'

function slotsFromPreset(preset: ShipPresetId): SpineSlot[] {
  return createSpineSlots(SHIP_PRESETS[preset])
}

export function ShipConfigurationProvider({
  children,
}: {
  children: ReactNode
}) {
  const [spineSlots, setSpineSlots] = useState<SpineSlot[]>(() =>
    slotsFromPreset('liner'),
  )
  const [activePreset, setActivePreset] = useState<ShipPresetId | null>('liner')
  const [selectedSlotId, setSelectedSlotId] = useState<SlotId | null>(null)
  const [omega, setOmega] = useState(DEFAULT_OMEGA)
  const [thrust, setThrust] = useState(0)
  const [showShield, setShowShield] = useState(true)
  const [elevatorAuto, setElevatorAuto] = useState(true)
  const [elevatorPosition, setElevatorPosition] = useState(0)
  const [podCount, setPodCount] = useState<PodCount>(4)
  const [heavyCargoMass, setHeavyCargoMass] = useState(200)

  const setSlotModule = useCallback(
    (slotId: SlotId, moduleId: string | null) => {
      if (slotId === 'aft') return
      setSpineSlots((prev) =>
        prev.map((slot) => {
          if (slot.id !== slotId) return slot
          if (
            moduleId !== null &&
            !slot.allowedModuleIds.includes(moduleId)
          ) {
            return slot
          }
          return { ...slot, mountedModuleId: moduleId }
        }),
      )
      setActivePreset(null)
    },
    [],
  )

  const applyPreset = useCallback((preset: ShipPresetId) => {
    setSpineSlots(slotsFromPreset(preset))
    setActivePreset(preset)
    setOmega(preset === 'liner' ? DEFAULT_OMEGA : 0)
    setThrust(0)
    if (preset === 'hauler') {
      setPodCount(4)
      setHeavyCargoMass(HEAVY_CARGO_MASS_MAX)
    }
    if (preset !== 'liner') {
      setElevatorAuto(false)
      setElevatorPosition(0)
    }
  }, [])

  const resetShip = useCallback(() => {
    setSpineSlots(slotsFromPreset('liner'))
    setActivePreset('liner')
    setSelectedSlotId(null)
    setOmega(DEFAULT_OMEGA)
    setThrust(0)
    setShowShield(true)
    setElevatorAuto(true)
    setElevatorPosition(0)
    setPodCount(4)
    setHeavyCargoMass(200)
  }, [])

  const value = useMemo<ShipConfiguration>(
    () => ({
      spineSlots,
      activePreset,
      selectedSlotId,
      omega,
      thrust,
      showShield,
      elevatorAuto,
      elevatorPosition,
      podCount,
      heavyCargoMass,
      setSlotModule,
      applyPreset,
      selectSlot: setSelectedSlotId,
      setOmega,
      setThrust,
      setShowShield,
      setElevatorAuto,
      setElevatorPosition,
      setPodCount,
      setHeavyCargoMass,
      resetShip,
    }),
    [
      spineSlots,
      activePreset,
      selectedSlotId,
      omega,
      thrust,
      showShield,
      elevatorAuto,
      elevatorPosition,
      podCount,
      heavyCargoMass,
      setSlotModule,
      applyPreset,
      resetShip,
    ],
  )

  return (
    <ShipConfigurationContext.Provider value={value}>
      {children}
    </ShipConfigurationContext.Provider>
  )
}
