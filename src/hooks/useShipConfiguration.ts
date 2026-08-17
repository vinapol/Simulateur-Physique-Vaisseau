import { useContext } from 'react'
import {
  ShipConfigurationContext,
  type ShipConfiguration,
} from '../store/shipConfigurationContext'

export function useShipConfiguration(): ShipConfiguration {
  const ctx = useContext(ShipConfigurationContext)
  if (!ctx) {
    throw new Error(
      'useShipConfiguration doit être utilisé dans ShipConfigurationProvider',
    )
  }
  return ctx
}
