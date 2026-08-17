import { useMemo } from 'react'
import { getModuleStats } from '../data/shipModules'
import { computeShipTelemetry } from '../physics/spacecraft'
import { heavyCargoCapacity } from '../types/spacecraft'
import { useShipConfiguration } from './useShipConfiguration'

export function useShipTelemetry() {
  const { spineSlots, heavyCargoMass, podCount, thrust } = useShipConfiguration()
  const heavyCargoMounted = spineSlots.some(
    (slot) => slot.mountedModuleId === 'heavy-cargo',
  )
  return useMemo(() => {
    const mounted = spineSlots.flatMap((slot) => {
      const module = getModuleStats(slot.mountedModuleId)
      return module ? [{ module, slot }] : []
    })
    return computeShipTelemetry(mounted, {
      payloadMass: Math.min(heavyCargoMass, heavyCargoCapacity(podCount)),
      podCount,
      throttle: thrust,
      heavyCargoMounted,
    })
  }, [spineSlots, heavyCargoMass, podCount, thrust, heavyCargoMounted])
}

export function useHasModule(moduleId: string) {
  const { spineSlots } = useShipConfiguration()
  return spineSlots.some((slot) => slot.mountedModuleId === moduleId)
}
