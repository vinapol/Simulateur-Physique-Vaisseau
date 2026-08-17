import { MODULE_STATS } from '../../../data/shipModules'
import type { ShipModule } from '../../../types/spacecraft'
import { ArgonTankModule } from './ArgonTankModule'
import { CargoBayModule } from './CargoBayModule'
import { CentrifugeHabitationModule } from './CentrifugeHabitationModule'
import { CryoTankModule } from './CryoTankModule'
import { DockingNoseModule } from './DockingNoseModule'
import { HeavyCargoBay } from './HeavyCargoBay'
import { IonPropulsionModule } from './IonPropulsionModule'
import { NTPPropulsionModule } from './NTPPropulsionModule'

export const MODULE_LIBRARY: Record<string, ShipModule> = {
  ntp: { ...MODULE_STATS.ntp, component: NTPPropulsionModule },
  ion: { ...MODULE_STATS.ion, component: IonPropulsionModule },
  'centrifuge-hab': {
    ...MODULE_STATS['centrifuge-hab'],
    component: CentrifugeHabitationModule,
  },
  'heavy-cargo': { ...MODULE_STATS['heavy-cargo'], component: HeavyCargoBay },
  'cargo-bay': { ...MODULE_STATS['cargo-bay'], component: CargoBayModule },
  'cryo-tanks': { ...MODULE_STATS['cryo-tanks'], component: CryoTankModule },
  'argon-tanks': { ...MODULE_STATS['argon-tanks'], component: ArgonTankModule },
  'docking-nose': {
    ...MODULE_STATS['docking-nose'],
    component: DockingNoseModule,
  },
}

export function getShipModule(id: string | null): ShipModule | null {
  if (!id) return null
  return MODULE_LIBRARY[id] ?? null
}
