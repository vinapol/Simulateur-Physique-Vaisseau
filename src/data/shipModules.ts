import type { ModuleCategory } from '../types/spacecraft'

export type ShipModuleStats = {
  id: string
  name: string
  category: ModuleCategory
  dryMass: number
  fuelMass: number
  powerDraw: number
  isp?: number
  comOffsetZ?: number
  ratedThrustN?: number
}

export const MODULE_STATS: Record<string, ShipModuleStats> = {
  ntp: {
    id: 'ntp',
    name: 'Propulsion NTP',
    category: 'propulsion',
    dryMass: 62,
    fuelMass: 0,
    powerDraw: -250,
    isp: 912,
    comOffsetZ: -4,
    ratedThrustN: 110_000,
  },
  ion: {
    id: 'ion',
    name: 'Propulsion NEP ionique',
    category: 'propulsion',
    dryMass: 45,
    fuelMass: 56,
    powerDraw: -2000,
    isp: 4500,
    comOffsetZ: -3,
    ratedThrustN: 4800,
  },
  'centrifuge-hab': {
    id: 'centrifuge-hab',
    name: 'Habitation centrifuge',
    category: 'habitation',
    dryMass: 48,
    fuelMass: 0,
    powerDraw: 48,
  },
  'heavy-cargo': {
    id: 'heavy-cargo',
    name: 'Méga-caissons de fret',
    category: 'payload',
    dryMass: 35,
    fuelMass: 0,
    powerDraw: 18,
  },
  'cargo-bay': {
    id: 'cargo-bay',
    name: 'Baie cargo',
    category: 'payload',
    dryMass: 64,
    fuelMass: 8,
    powerDraw: 12,
  },
  'cryo-tanks': {
    id: 'cryo-tanks',
    name: 'Réservoirs cryogéniques (LH₂)',
    category: 'payload',
    dryMass: 20,
    fuelMass: 220,
    powerDraw: 28,
  },
  'argon-tanks': {
    id: 'argon-tanks',
    name: "Réservoirs d'argon (NEP)",
    category: 'payload',
    dryMass: 22,
    fuelMass: 180,
    powerDraw: 14,
  },
  'docking-nose': {
    id: 'docking-nose',
    name: 'Nez d’amarrage IDSS',
    category: 'docking',
    dryMass: 8,
    fuelMass: 0.4,
    powerDraw: 7,
  },
}

export const MODULE_BLURBS: Record<string, string> = {
  ntp: 'Réacteur thermique, cône d’ombre calé sur l’équipage / la charge, radiateurs en croix, tuyère régénérative.',
  ion: 'NEP 2 MWe, radiateurs en croix, argon/xénon, grille 4×4, Isp 4 500 s.',
  'centrifuge-hab': 'Anneau R = 40 m, 8 modules, haubans Zylon, palier magnétique.',
  'heavy-cargo': 'Rack octogonal, caissons 12×12×26 m, fret pressurisé ou minier.',
  'cargo-bay': 'Treillis octogonal fixe, conteneurs pressurisés et non pressurisés.',
  'cryo-tanks': 'Sphère-cylindres LH₂ / haute capacité (NTP), MLI doré, cryo-refroidisseurs ZBO.',
  'argon-tanks': "Grappe de réservoirs sous pression en titan composite pour fluide argon (NEP ionique).",
  'docking-nose': 'Sas axial IDSS, dôme avionique, grappe RCS d’attitude.',
}

export function getModuleStats(id: string | null): ShipModuleStats | null {
  if (!id) return null
  return MODULE_STATS[id] ?? null
}
