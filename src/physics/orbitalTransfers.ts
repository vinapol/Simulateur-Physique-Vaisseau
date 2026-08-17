import { G0 } from '../types/spacecraft'

export type TransferKind = 'ntp' | 'nep'

export type HohmannResult = {
  kind: 'ntp'
  deltaVRequired: number
  deltaVTotalRequired: number
  deltaVAvailable: number
  transitDays: number
  hohmannDays: number
  propellantUsed: number
  propellantType: 'LH2'
  meanAcceleration: number
  feasible: boolean
  marginDeltaV: number
  destinationLabel: string
}

export type NepResult = {
  kind: 'nep'
  deltaVRequired: number
  deltaVTotalRequired: number
  deltaVAvailable: number
  transitDays: number
  propellantUsed: number
  propellantType: 'Ar'
  meanAcceleration: number
  thrustN: number
  feasible: boolean
  marginDeltaV: number
  destinationLabel: string
}

export const AU_M = 1.495978707e11
export const MU_SUN = 1.3271244e20
export const R_EARTH_AU = 1
export const R_MARS_AU = 1.5237
/** Unités 3D par UA. */
export const AU_VIS = 10

const DAY = 86400

/** Insertion finale Terre (capture HEO / EML-1/2) : 1,0 km/s. */
export const DV_EARTH_CAPTURE = 1000
/** Insertion finale Mars (orbite haute aréocentrique) : 1,1 km/s. */
export const DV_MARS_CAPTURE = 1100
/** Injection Trans-Mars (TMI depuis HEO) : 3,6 km/s. */
export const DV_TMI = 3600
/** Injection Trans-Terre (TEI depuis Mars HEO) : 1,1 km/s. */
export const DV_TEI = 1100

/** Budget Aller NTP (TMI 3,6 + Capture Mars 1,1) = 4,7 km/s. */
export const NTP_DV_OUTBOUND = DV_TMI + DV_MARS_CAPTURE
/** Budget Retour NTP (TEI 1,1 + Capture Terre 1,0) = 2,1 km/s. */
export const NTP_DV_INBOUND = DV_TEI + DV_EARTH_CAPTURE
/** Coût total 4 manœuvres A/R NTP = 6,8 km/s. */
export const NTP_DV_TOTAL = NTP_DV_OUTBOUND + NTP_DV_INBOUND

export const NTP_DV = NTP_DV_OUTBOUND
export const NTP_TRANSIT_DAYS = 140

/** Budget NEP héliocentrique (aller 4,5 km/s, retour 4,5 km/s, total 9,0 km/s). */
export const NEP_DV_OUTBOUND = 4500
export const NEP_DV_INBOUND = 4500
export const NEP_DV_TOTAL = NEP_DV_OUTBOUND + NEP_DV_INBOUND
export const NEP_DV = NEP_DV_OUTBOUND
export const NEP_TRANSIT_DAYS_REF = 380
export const NEP_MASS_REF_KG = 400_000
export const NEP_ETA = 0.65
export const NEP_POWER_KW_DEFAULT = 5000

export const DESTINATION_HEO_LABEL = 'Orbite Haute Terrestre (HEO / EML-1)'

function availableDeltaV(dryMass: number, fuelMass: number, isp: number) {
  const m0 = dryMass + fuelMass
  if (dryMass <= 0 || m0 <= dryMass || isp <= 0) return 0
  return isp * G0 * Math.log(m0 / dryMass)
}

function propellantForDeltaV(
  dryMass: number,
  fuelMass: number,
  isp: number,
  deltaV: number,
) {
  const m0 = dryMass + fuelMass
  if (m0 <= 0 || isp <= 0) return { used: 0, feasible: false }
  const mf = m0 * Math.exp(-deltaV / (isp * G0))
  const used = m0 - mf
  return { used, feasible: used <= fuelMass + 1e-6 && mf >= dryMass - 1e-6 }
}

function hohmannElements() {
  const r1 = R_EARTH_AU * AU_M
  const r2 = R_MARS_AU * AU_M
  const a = (r1 + r2) / 2
  const period = 2 * Math.PI * Math.sqrt((a * a * a) / MU_SUN)
  return {
    hohmannDays: period / 2 / DAY,
  }
}

export function calculateHohmannNTP(
  dryMass: number,
  fuelMass: number,
  isp = 912,
): HohmannResult {
  const { hohmannDays } = hohmannElements()
  const deltaVAvailable = availableDeltaV(dryMass, fuelMass, isp)
  const { used: outboundUsed, feasible: outboundFeasible } = propellantForDeltaV(
    dryMass,
    fuelMass,
    isp,
    NTP_DV_OUTBOUND,
  )
  const remainingFuel = Math.max(0, fuelMass - outboundUsed)
  const { used: inboundUsed, feasible: inboundFeasible } = propellantForDeltaV(
    dryMass,
    remainingFuel,
    isp,
    NTP_DV_INBOUND,
  )
  const totalPropellantUsed = outboundUsed + inboundUsed
  const feasible =
    outboundFeasible &&
    inboundFeasible &&
    totalPropellantUsed <= fuelMass + 1e-6

  return {
    kind: 'ntp',
    deltaVRequired: NTP_DV_OUTBOUND,
    deltaVTotalRequired: NTP_DV_TOTAL,
    deltaVAvailable,
    transitDays: NTP_TRANSIT_DAYS,
    hohmannDays,
    propellantUsed: totalPropellantUsed,
    propellantType: 'LH2',
    meanAcceleration: 0,
    feasible,
    marginDeltaV: deltaVAvailable - NTP_DV_TOTAL,
    destinationLabel: DESTINATION_HEO_LABEL,
  }
}

export function calculateLowThrustNEP(
  dryMass: number,
  fuelMass: number,
  isp = 4500,
  powerKW = NEP_POWER_KW_DEFAULT,
): NepResult {
  const m0kg = Math.max(dryMass + fuelMass, 0.1) * 1000
  const ve = isp * G0
  const powerW = Math.max(powerKW, 0) * 1000
  const thrustN = ve > 0 ? (2 * NEP_ETA * powerW) / ve : 0
  const meanAcceleration = thrustN / m0kg
  const deltaVAvailable = availableDeltaV(dryMass, fuelMass, isp)
  const transitDays =
    meanAcceleration > 1e-12
      ? NEP_TRANSIT_DAYS_REF * (m0kg / NEP_MASS_REF_KG)
      : Number.POSITIVE_INFINITY
  const { used: outboundUsed, feasible: outboundFeasible } = propellantForDeltaV(
    dryMass,
    fuelMass,
    isp,
    NEP_DV_OUTBOUND,
  )
  const remainingFuel = Math.max(0, fuelMass - outboundUsed)
  const { used: inboundUsed, feasible: inboundFeasible } = propellantForDeltaV(
    dryMass,
    remainingFuel,
    isp,
    NEP_DV_INBOUND,
  )
  const totalPropellantUsed = outboundUsed + inboundUsed
  const feasible =
    outboundFeasible &&
    inboundFeasible &&
    totalPropellantUsed <= fuelMass + 1e-6

  return {
    kind: 'nep',
    deltaVRequired: NEP_DV_OUTBOUND,
    deltaVTotalRequired: NEP_DV_TOTAL,
    deltaVAvailable,
    transitDays,
    propellantUsed: totalPropellantUsed,
    propellantType: 'Ar',
    meanAcceleration,
    thrustN,
    feasible,
    marginDeltaV: deltaVAvailable - NEP_DV_TOTAL,
    destinationLabel: DESTINATION_HEO_LABEL,
  }
}

export type Vec3Tuple = [number, number, number]

export const YEAR_DAYS = 365.25
export const T_EARTH_DAYS = YEAR_DAYS
export const T_MARS_DAYS = 687
export const T_MARS_YEARS = T_MARS_DAYS / T_EARTH_DAYS
export const OMEGA_EARTH = (Math.PI * 2) / T_EARTH_DAYS
export const OMEGA_MARS = (Math.PI * 2) / T_MARS_DAYS
export const T_SYNODIC_DAYS = 1 / Math.abs(1 / T_EARTH_DAYS - 1 / T_MARS_DAYS)
/** Spirale NEP multi-tours (aller comme retour). */
export const NEP_SPIRAL_TURNS = 2.45
/** 1× : une année terrestre en ~40 s de temps réel. */
export const DAYS_PER_SEC_1X = YEAR_DAYS / 40
export const AU_MILLION_KM = AU_M / 1e9

export type FlightPhase =
  | 'outbound'
  | 'mars_ops'
  | 'inbound'
  | 'earth_orbit'

export const FLIGHT_PHASE_LABEL: Record<FlightPhase, string> = {
  outbound: 'Transit Aller',
  mars_ops: 'Opérations Martiennes',
  inbound: 'Transit Retour',
  earth_orbit: 'Orbite Terrestre',
}

export type RoundTripSchedule = {
  outboundDays: number
  stayDays: number
  returnDays: number
  earthOrbitDays: number
  tMarsArrive: number
  tDepartMars: number
  tEarthArrive: number
  tMissionEnd: number
}

export type FuelBudget = {
  initial: number
  outbound: number
  inbound: number
}

export type MissionSnapshot = {
  phase: FlightPhase
  phaseLabel: string
  tDays: number
  rAu: number
  vHelioKmS: number
  fuelRemainingT: number
  fuelInitialT: number
  thrusting: boolean
  targetName: 'Mars' | 'Terre'
  targetDistanceMkm: number
  ship: Vec3Tuple
  earth: Vec3Tuple
  mars: Vec3Tuple
}

export function transferSweepRad(kind: TransferKind) {
  return kind === 'ntp' ? Math.PI : NEP_SPIRAL_TURNS * Math.PI * 2
}

export function nepLogK() {
  return Math.log(R_MARS_AU / R_EARTH_AU) / transferSweepRad('nep')
}

function positiveMod(value: number, modulo: number) {
  return ((value % modulo) + modulo) % modulo
}

/** Aphélie Hohmann (π) ou fin de spirale NEP. */
export function arrivalTrueAnomaly(kind: TransferKind) {
  return transferSweepRad(kind)
}

/**
 * θ_Mars(0) = θ_arrivée − ω_Mars · t_aller
 * Hohmann : θ_arrivée = π pour un rendez-vous à l’aphélie.
 */
export function marsTrueAnomalyAtDeparture(
  kind: TransferKind,
  transitDays: number,
) {
  return arrivalTrueAnomaly(kind) - OMEGA_MARS * Math.max(transitDays, 0)
}

/** θ_Terre(0) = 0. */
export function earthTrueAnomaly(tDays: number) {
  return OMEGA_EARTH * tDays
}

export function marsTrueAnomaly(
  kind: TransferKind,
  outboundDays: number,
  tDays: number,
) {
  return marsTrueAnomalyAtDeparture(kind, outboundDays) + OMEGA_MARS * tDays
}

/** θ_dep = θ_Mars(t_aller + t_séjour). */
export function returnDepartureTrueAnomaly(
  kind: TransferKind,
  schedule: RoundTripSchedule,
) {
  return marsTrueAnomaly(kind, schedule.outboundDays, schedule.tDepartMars)
}

/**
 * Séjour ajusté pour l’insertion :
 * θ_Terre(t_total) ≡ θ_dep + θ_arrivée (mod 2π), θ_arrivée = π en Hohmann.
 */
export function computeMissionTimeline(
  transitAllerDays: number,
  isNEP: boolean,
) {
  const wEarth = OMEGA_EARTH
  const deltaW = wEarth - OMEGA_MARS
  const transit = Math.max(transitAllerDays, 1)
  const transitRetourDays = transit
  const kind: TransferKind = isNEP ? 'nep' : 'ntp'
  const sweepOut = arrivalTrueAnomaly(kind)
  const sweepIn = sweepOut
  const totalSweep = sweepOut + sweepIn
  const transferDays = transit + transitRetourDays

  let sejourMarsDays =
    positiveMod(totalSweep - wEarth * transferDays, Math.PI * 2) / deltaW

  while (sejourMarsDays < 150) {
    sejourMarsDays += T_SYNODIC_DAYS
  }

  return {
    transitAller: transit,
    sejourMars: sejourMarsDays,
    transitRetour: transitRetourDays,
    dureeTotale: transit + sejourMarsDays + transitRetourDays,
  }
}

export function buildRoundTrip(
  kind: TransferKind,
  outboundDays: number,
): RoundTripSchedule {
  const timeline = computeMissionTimeline(outboundDays, kind === 'nep')
  const out = timeline.transitAller
  const stay = timeline.sejourMars
  const ret = timeline.transitRetour
  const earthOrbitDays = 50
  return {
    outboundDays: out,
    stayDays: stay,
    returnDays: ret,
    earthOrbitDays,
    tMarsArrive: out,
    tDepartMars: out + stay,
    tEarthArrive: out + stay + ret,
    tMissionEnd: out + stay + ret + earthOrbitDays,
  }
}

/** 0 ≤ t < t_aller → aller ; séjour collé à Mars ; retour ; puis collé à la Terre. */
export function flightPhaseAt(
  tDays: number,
  schedule: RoundTripSchedule,
): FlightPhase {
  if (tDays < schedule.tMarsArrive) return 'outbound'
  if (tDays < schedule.tDepartMars) return 'mars_ops'
  if (tDays < schedule.tEarthArrive) return 'inbound'
  return 'earth_orbit'
}

export function polarAu(radiusAu: number, theta: number): Vec3Tuple {
  const r = radiusAu * AU_VIS
  return [r * Math.cos(theta), 0, r * Math.sin(theta)]
}

function keplerE(M: number, e: number) {
  let E = M
  for (let i = 0; i < 14; i += 1) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= dE
    if (Math.abs(dE) < 1e-10) break
  }
  return E
}

function hohmannElementsVis() {
  const r1 = R_EARTH_AU * AU_VIS
  const r2 = R_MARS_AU * AU_VIS
  const a = (r1 + r2) / 2
  const e = (r2 - r1) / (r2 + r1)
  return { r1, r2, a, e }
}

function rotateYaw(x: number, z: number, yaw: number): Vec3Tuple {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [x * c - z * s, 0, x * s + z * c]
}

/** Position sur l’ellipse de Hohmann aller (ν : 0 → π, loi des aires). */
export function hohmannPositionAtTime(
  tDays: number,
  transitDays: number,
): Vec3Tuple {
  const { a, e } = hohmannElementsVis()
  const tof = Math.max(transitDays, 1e-6)
  const M = Math.min(Math.max(tDays / tof, 0), 1) * Math.PI
  const E = keplerE(M, e)
  const nu =
    2 *
    Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2),
    )
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu))
  return [r * Math.cos(nu), 0, r * Math.sin(nu)]
}

/** Retour Hohmann : aphélie → périhélie, aphélie alignée sur θ_apo. */
export function hohmannReturnPositionAtTime(
  tDays: number,
  transitDays: number,
  thetaApoapsis: number,
): Vec3Tuple {
  const { a, e } = hohmannElementsVis()
  const tof = Math.max(transitDays, 1e-6)
  const u = Math.min(Math.max(tDays / tof, 0), 1)
  const Mraw = Math.PI * (1 + u)
  const M = Mraw >= Math.PI * 2 - 1e-9 ? 0 : Mraw
  const E = keplerE(M, e)
  const nu =
    2 *
    Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2),
    )
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu))
  const yaw = thetaApoapsis - Math.PI
  return rotateYaw(r * Math.cos(nu), r * Math.sin(nu), yaw)
}

export function nepLogPosition(u: number, inbound: boolean, theta0: number): Vec3Tuple {
  const sweep = transferSweepRad('nep')
  const k = nepLogK()
  const uu = Math.min(Math.max(u, 0), 1)
  const phi = uu * sweep
  const rAu = inbound
    ? R_MARS_AU * Math.exp(-k * phi)
    : R_EARTH_AU * Math.exp(k * phi)
  const theta = theta0 + phi
  return polarAu(rAu, theta)
}

export function visVivaKmS(rAu: number, aAu: number) {
  const r = Math.max(rAu, 0.05) * AU_M
  const a = Math.max(aAu, 0.05) * AU_M
  const v = Math.sqrt(Math.max(MU_SUN * (2 / r - 1 / a), 0))
  return v / 1000
}

function hypot3(a: Vec3Tuple, b: Vec3Tuple) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return Math.hypot(dx, dy, dz)
}

function visUnitsToMkm(dVis: number) {
  return (dVis / AU_VIS) * (AU_M / 1e9)
}

function fuelRemainingAt(
  tDays: number,
  kind: TransferKind,
  schedule: RoundTripSchedule,
  fuel: FuelBudget,
) {
  const { outbound, inbound, initial } = fuel
  let used = 0
  if (kind === 'ntp') {
    if (tDays >= 0) used += outbound * 0.5
    if (tDays >= schedule.tMarsArrive) used += outbound * 0.5
    if (tDays >= schedule.tDepartMars) used += inbound * 0.5
    if (tDays >= schedule.tEarthArrive) used += inbound * 0.5
  } else if (tDays < schedule.tMarsArrive) {
    used = outbound * (tDays / schedule.outboundDays)
  } else if (tDays < schedule.tDepartMars) {
    used = outbound
  } else if (tDays < schedule.tEarthArrive) {
    used =
      outbound +
      inbound * ((tDays - schedule.tDepartMars) / schedule.returnDays)
  } else {
    used = outbound + inbound
  }
  return Math.max(0, initial - used)
}

export function missionSnapshot(
  tDaysRaw: number,
  kind: TransferKind,
  schedule: RoundTripSchedule,
  fuel: FuelBudget,
): MissionSnapshot {
  const tDays = Math.max(tDaysRaw, 0)
  const phase = flightPhaseAt(tDays, schedule)
  const earth = polarAu(R_EARTH_AU, earthTrueAnomaly(tDays))
  const mars = polarAu(
    R_MARS_AU,
    marsTrueAnomaly(kind, schedule.outboundDays, tDays),
  )
  const thetaDep = returnDepartureTrueAnomaly(kind, schedule)

  let ship: Vec3Tuple
  if (phase === 'outbound') {
    ship =
      kind === 'ntp'
        ? hohmannPositionAtTime(tDays, schedule.outboundDays)
        : nepLogPosition(tDays / schedule.outboundDays, false, 0)
  } else if (phase === 'mars_ops') {
    ship = mars
  } else if (phase === 'inbound') {
    const tau = tDays - schedule.tDepartMars
    ship =
      kind === 'ntp'
        ? hohmannReturnPositionAtTime(tau, schedule.returnDays, thetaDep)
        : nepLogPosition(tau / schedule.returnDays, true, thetaDep)
  } else {
    ship = earth
  }

  const rAu = Math.hypot(ship[0], ship[2]) / AU_VIS
  const hohmannA = (R_EARTH_AU + R_MARS_AU) / 2
  let vHelioKmS: number
  if (phase === 'outbound' || phase === 'inbound') {
    if (kind === 'ntp') {
      vHelioKmS = visVivaKmS(rAu, hohmannA)
    } else {
      const sweep = transferSweepRad('nep')
      const k = nepLogK()
      const tof = (phase === 'outbound' ? schedule.outboundDays : schedule.returnDays) * DAY
      const thetaDot = sweep / Math.max(tof, 1)
      const rM = rAu * AU_M
      const sign = phase === 'inbound' ? -1 : 1
      const vr = sign * k * rM * thetaDot
      const vt = rM * thetaDot
      vHelioKmS = Math.hypot(vr, vt) / 1000
    }
  } else {
    vHelioKmS = visVivaKmS(rAu, rAu)
  }

  const targetName: 'Mars' | 'Terre' =
    phase === 'inbound' || phase === 'earth_orbit' ? 'Terre' : 'Mars'
  const target = targetName === 'Mars' ? mars : earth
  const thrusting =
    (kind === 'nep' && (phase === 'outbound' || phase === 'inbound')) ||
    (kind === 'ntp' &&
      (tDays < 2 ||
        Math.abs(tDays - schedule.tMarsArrive) < 2 ||
        Math.abs(tDays - schedule.tDepartMars) < 2 ||
        Math.abs(tDays - schedule.tEarthArrive) < 2))

  return {
    phase,
    phaseLabel: FLIGHT_PHASE_LABEL[phase],
    tDays,
    rAu,
    vHelioKmS,
    fuelRemainingT: fuelRemainingAt(tDays, kind, schedule, fuel),
    fuelInitialT: fuel.initial,
    thrusting,
    targetName,
    targetDistanceMkm: visUnitsToMkm(hypot3(ship, target)),
    ship,
    earth,
    mars,
  }
}

export function sampleCircle(radiusAu: number, samples = 96): Vec3Tuple[] {
  const r = radiusAu * AU_VIS
  return Array.from({ length: samples + 1 }, (_, i) => {
    const a = (i / samples) * Math.PI * 2
    return [r * Math.cos(a), 0, r * Math.sin(a)]
  })
}

export function sampleHohmannPath(
  transitDays = 140,
  samples = 96,
): Vec3Tuple[] {
  const tof = Math.max(transitDays, 1)
  return Array.from({ length: samples + 1 }, (_, i) =>
    hohmannPositionAtTime((i / samples) * tof, tof),
  )
}

export function sampleHohmannReturnPath(
  thetaApoapsis: number,
  transitDays = 140,
  samples = 96,
): Vec3Tuple[] {
  const tof = Math.max(transitDays, 1)
  return Array.from({ length: samples + 1 }, (_, i) =>
    hohmannReturnPositionAtTime((i / samples) * tof, tof, thetaApoapsis),
  )
}

export function sampleNepOutbound(samples = 240): Vec3Tuple[] {
  return Array.from({ length: samples + 1 }, (_, i) =>
    nepLogPosition(i / samples, false, 0),
  )
}

export function sampleNepReturn(
  thetaStart: number,
  samples = 240,
): Vec3Tuple[] {
  return Array.from({ length: samples + 1 }, (_, i) =>
    nepLogPosition(i / samples, true, thetaStart),
  )
}

/** @deprecated alias visuel aller NTP */
export function sampleNepSpiral(samples = 180): Vec3Tuple[] {
  return sampleNepOutbound(samples)
}

export function nepPositionAtTime(
  tDays: number,
  transitDays: number,
): Vec3Tuple {
  return nepLogPosition(tDays / Math.max(transitDays, 1e-6), false, 0)
}
