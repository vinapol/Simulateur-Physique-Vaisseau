import { useEffect } from 'react'
import { useMarsTransfer } from '../../hooks/useMarsTransfer'
import { useOrbitPlayback } from '../../hooks/useOrbitPlayback'
import {
  missionSnapshot,
  type MissionSnapshot,
} from '../../physics/orbitalTransfers'
import { TrajectoryView } from './TrajectoryView'
import { useLanguage } from '../../i18n/LanguageContext'

function finiteNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function fmt(n: number | null | undefined, digits = 1, fallback = '—') {
  const v = finiteNumber(n)
  if (v === null) return fallback
  return v.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function TelemetryRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'ok' | 'bad' | 'warn'
}) {
  const valueClass =
    tone === 'ok'
      ? 'text-emerald-400'
      : tone === 'bad'
        ? 'text-rose-400'
        : tone === 'warn'
          ? 'text-amber-300'
          : 'text-cyan-300'
  return (
    <div className="flex items-center justify-between border-b border-slate-800/40 py-1 last:border-b-0">
      <span className="text-xs text-slate-300">{label}</span>
      <span className={`font-mono text-xs font-semibold ${valueClass}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function LiveDashboard({
  snap,
  shipLabel,
  isp,
  totalMass,
  engine,
}: {
  snap: MissionSnapshot
  shipLabel: string
  isp: number
  totalMass: number
  engine: string
}) {
  const { t: tr, lang } = useLanguage()
  const dayUnit = lang === 'en' ? 'd' : 'j'
  const fuelPct =
    snap.fuelInitialT > 1e-6
      ? Math.min(100, (snap.fuelRemainingT / snap.fuelInitialT) * 100)
      : 0
  const phaseLabelMap: Record<string, string> = {
    'Transit Aller': tr('phaseOutbound'),
    'Opérations Martiennes': tr('phaseMarsOps'),
    'Transit Retour': tr('phaseInbound'),
    'Orbite Terrestre': tr('phaseEarthOrbit'),
  }
  const currentPhaseLabel = phaseLabelMap[snap.phaseLabel] ?? snap.phaseLabel
  const targetNameLabel = snap.targetName === 'Mars' ? 'Mars' : (lang === 'en' ? 'Earth' : 'Terre')

  return (
    <div className="rounded-lg border border-cyan-500/50 bg-slate-900/90 p-3 shadow-lg shadow-cyan-950/40">
      <p className="mb-1 text-xs font-semibold tracking-wide text-cyan-300 uppercase">
        {tr('liveTelemetryTitle')}
      </p>
      <p className="mb-2 text-[0.7rem] leading-snug text-slate-300">
        {shipLabel} · {engine}
      </p>
      <TelemetryRow label={tr('flightPhase')} value={currentPhaseLabel} tone="warn" />
      <TelemetryRow
        label={tr('missionDay')}
        value={`T+${Math.floor(snap.tDays)} ${dayUnit}`}
      />
      <TelemetryRow
        label={tr('sunDistance')}
        value={`${fmt(snap.rAu, 3)} AU`}
      />
      <TelemetryRow
        label={tr('heliocentricSpeed')}
        value={`${fmt(snap.vHelioKmS, 2)} km/s`}
      />
      <TelemetryRow
        label={tr('remainingFuel')}
        value={`${fmt(snap.fuelRemainingT, 2)} t · ${fmt(fuelPct, 0)} %`}
        tone={fuelPct < 12 ? 'bad' : 'ok'}
      />
      <div className="my-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${snap.thrusting ? 'bg-amber-400' : 'bg-cyan-400'}`}
          style={{ width: `${fuelPct}%` }}
        />
      </div>
      <TelemetryRow
        label={`${tr('targetDistance')} ${targetNameLabel}`}
        value={`${fmt(snap.targetDistanceMkm, 2)} Mkm`}
      />
      <TelemetryRow label={tr('shipIsp')} value={`${Math.round(isp)} s`} />
      <TelemetryRow
        label={tr('totalMass')}
        value={`${fmt(totalMass, 1)} t`}
      />
    </div>
  )
}

export function MissionOverlay({ onClose }: { onClose: () => void }) {
  const { t: tr, lang } = useLanguage()
  const dayUnit = lang === 'en' ? 'd' : 'j'
  const { kind, schedule, fuel, shipLabel, telemetry, isp, active } =
    useMarsTransfer()
  const playback = useOrbitPlayback(kind ?? 'none')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const snap =
    kind && schedule
      ? missionSnapshot(playback.displayDays, kind, schedule, fuel)
      : null

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col bg-[#05070d] p-3 text-slate-100 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.78rem] font-semibold tracking-wide text-cyan-100">
          {tr('missionSimTitle')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-950/90 px-2.5 py-1.5 text-[0.78rem] font-semibold text-white ring-1 ring-white/15 hover:bg-slate-800"
          >
            {tr('close')}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.9fr)]">
        <div className="relative min-h-[16rem] overflow-hidden rounded-xl ring-1 ring-cyan-400/20">
          {kind && schedule ? (
            <TrajectoryView
              kind={kind}
              schedule={schedule}
              fuel={fuel}
              playback={playback}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-200">
              {lang === 'en' ? 'Mount an NTP or NEP engine on the aft slot.' : 'Monte un moteur NTP ou NEP sur le slot arrière.'}
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          {snap && (
            <LiveDashboard
              snap={snap}
              shipLabel={shipLabel}
              isp={isp}
              totalMass={telemetry.totalMass}
              engine={kind === 'ntp' ? 'NTP · Hohmann' : 'NEP · spiral'}
            />
          )}
          {schedule && active && (
            <div className="rounded-lg border border-slate-800/60 bg-slate-950/60 p-3">
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-300 uppercase">
                {tr('roundTripProfile')}
              </p>
              <TelemetryRow
                label={tr('finalDestination')}
                value={lang === 'en' ? 'HEO / EML-1 (Earth)' : 'HEO / EML-1 (Terre)'}
                tone="ok"
              />
              <TelemetryRow
                label={tr('outboundTransit')}
                value={`${fmt(schedule.outboundDays, 0)} ${dayUnit}`}
              />
              <TelemetryRow
                label={tr('stayMars')}
                value={`${fmt(schedule.stayDays, 0)} ${dayUnit}`}
              />
              <TelemetryRow
                label={tr('inboundTransit')}
                value={`${fmt(schedule.returnDays, 0)} ${dayUnit}`}
              />
              <TelemetryRow
                label={tr('totalDuration')}
                value={`${fmt(schedule.tMissionEnd, 0)} ${dayUnit}`}
              />
              <TelemetryRow
                label={tr('outboundDeltaV')}
                value={`${fmt((active.deltaVRequired ?? 0) / 1000, 2)} km/s`}
              />
              <TelemetryRow
                label={tr('totalDeltaVBudget')}
                value={`${fmt((active.deltaVTotalRequired ?? 0) / 1000, 2)} km/s`}
              />
              <TelemetryRow
                label={tr('deltaVMargin')}
                value={`${active.marginDeltaV >= 0 ? '+' : ''}${fmt((active.marginDeltaV ?? 0) / 1000, 2)} km/s`}
                tone={active.marginDeltaV >= 0 ? 'ok' : 'bad'}
              />
            </div>
          )}
          <p className="text-[0.68rem] leading-snug text-slate-300">
            {lang === 'en'
              ? 'Cyan arc: Outbound. Amber arc: Inbound. Active physics model (NTP Liner, NEP Heavy Hauler or NTP Tug).'
              : 'Arc cyan : aller. Arc ambre : retour. Physique du modèle actif (Liner NTP, Heavy Hauler NEP ou Tug NTP).'}
          </p>
        </div>
      </div>
    </div>
  )
}
