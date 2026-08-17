import { useMemo } from 'react'
import {
  buildRoundTrip,
  calculateHohmannNTP,
  calculateLowThrustNEP,
  type FuelBudget,
  type HohmannResult,
  type NepResult,
  type RoundTripSchedule,
  type TransferKind,
} from '../physics/orbitalTransfers'
import { SHIP_PRESET_LABELS } from '../types/spacecraft'
import { useShipConfiguration } from './useShipConfiguration'
import { useShipTelemetry } from './useShipTelemetry'

export function useMarsTransfer() {
  const { spineSlots, activePreset } = useShipConfiguration()
  const telemetry = useShipTelemetry()

  return useMemo(() => {
    const aft = spineSlots.find((s) => s.id === 'aft')?.mountedModuleId ?? null
    const kind: TransferKind | null =
      aft === 'ntp' ? 'ntp' : aft === 'ion' ? 'nep' : null
    const dry = telemetry.dryMass + telemetry.payloadMass
    const isp = telemetry.isp ?? (kind === 'ntp' ? 912 : 4500)
    const powerKW = Math.max(telemetry.powerProduction, 1)
    const ntp = calculateHohmannNTP(
      dry,
      telemetry.fuelMass,
      kind === 'ntp' ? isp : 912,
    )
    const nep = calculateLowThrustNEP(
      dry,
      telemetry.fuelMass,
      kind === 'nep' ? isp : 4500,
      kind === 'nep' ? powerKW : 5000,
    )
    const active: HohmannResult | NepResult | null =
      kind === 'ntp' ? ntp : kind === 'nep' ? nep : null
    const outboundDays = active?.transitDays ?? 140
    const schedule: RoundTripSchedule | null = kind
      ? buildRoundTrip(kind, outboundDays)
      : null

    const dvOut = kind === 'ntp' ? 4700 : 4500
    const dvIn = kind === 'ntp' ? 2100 : 4500
    const m0 = dry + telemetry.fuelMass
    const mfOut = m0 > 0 && isp > 0 ? m0 * Math.exp(-dvOut / (isp * 9.80665)) : m0
    const outbound = Math.max(0, m0 - mfOut)
    const mDepMars = Math.max(dry, mfOut)
    const mfIn = mDepMars > 0 && isp > 0 ? mDepMars * Math.exp(-dvIn / (isp * 9.80665)) : mDepMars
    const inbound = Math.max(0, mDepMars - mfIn)

    const fuel: FuelBudget = {
      initial: telemetry.fuelMass,
      outbound,
      inbound,
    }
    const shipLabel =
      activePreset != null
        ? SHIP_PRESET_LABELS[activePreset]
        : 'Configuration libre'

    return {
      kind,
      ntp,
      nep,
      active,
      aft,
      schedule,
      fuel,
      shipLabel,
      telemetry,
      isp,
      dryMass: dry,
    }
  }, [spineSlots, activePreset, telemetry])
}
