import { G0 } from '../../types/spacecraft'
import { useMarsTransfer } from '../../hooks/useMarsTransfer'
import { useLanguage } from '../../i18n/LanguageContext'

function fmt(n: number, digits = 1) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function Row({
  label,
  value,
  tone = 'value',
}: {
  label: string
  value: string
  tone?: 'value' | 'emphasis' | 'ok' | 'bad' | 'warn'
}) {
  const valueClass =
    tone === 'emphasis'
      ? 'text-white font-bold'
      : tone === 'ok'
        ? 'text-emerald-300 font-bold'
        : tone === 'bad'
          ? 'text-rose-300 font-bold'
          : tone === 'warn'
            ? 'text-amber-300 font-bold'
            : 'text-cyan-200 font-semibold'
  return (
    <div className="flex items-center justify-between gap-3 py-0.5 border-b border-slate-800/50 last:border-b-0">
      <span className="text-xs font-medium text-slate-200">{label}</span>
      <span className={`font-mono text-xs tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  )
}

export function TelemetryHud() {
  const { t: tr, lang } = useLanguage()
  const { kind, active, schedule, telemetry: t } = useMarsTransfer()
  const surplus = t.powerNet >= 0
  const fuelLabel =
    kind === 'ntp' ? tr('fuelLH2') : kind === 'nep' ? tr('fuelArgon') : tr('fuelGeneric')
  const thrustLabel = t.ratedThrustN
    ? t.ratedThrustN >= 1000
      ? `${fmt(t.thrustN / 1000, 2)} / ${fmt(t.ratedThrustN / 1000, 1)} kN`
      : `${fmt(t.thrustN, 0)} / ${fmt(t.ratedThrustN, 0)} N`
    : '—'
  const accelMm = t.acceleration * 1000
  const accelLabel =
    accelMm >= 10
      ? `${fmt(t.acceleration, 3)} m/s²`
      : `${fmt(accelMm, 2)} mm/s²`
  const dayUnit = lang === 'en' ? 'd' : 'j'
  const transitLabel =
    kind === 'ntp'
      ? `NTP · ${fmt(active?.transitDays ?? 140, 0)} ${dayUnit} (Hohmann)`
      : kind === 'nep'
        ? `NEP · ${fmt(active?.transitDays ?? 380, 0)} ${dayUnit} (spiral)`
        : null
  const missionFuel =
    kind === 'ntp'
      ? `${fmt(active?.propellantUsed ?? 0, 2)} t LH₂`
      : kind === 'nep'
        ? `${fmt(active?.propellantUsed ?? 0, 2)} t Ar`
        : null

  return (
    <div className="pointer-events-auto w-full max-w-[19.5rem] rounded-xl border border-cyan-400/40 bg-slate-950/95 p-3 text-cyan-50 shadow-2xl backdrop-blur-md">
      <p className="mb-1.5 text-[0.7rem] font-bold tracking-wide text-cyan-300 uppercase">
        {tr('telemetryTitle')}
      </p>
      <Row label={tr('dryMass')} value={`${fmt(t.dryMass, 1)} t`} />
      {t.payloadMass > 0 && (
        <Row label={tr('payloadMass')} value={`${fmt(t.payloadMass, 0)} t`} />
      )}
      <Row label={fuelLabel} value={`${fmt(t.fuelMass, 1)} t`} />
      <Row
        label={tr('totalMass')}
        value={`${fmt(t.totalMass, 1)} t`}
        tone="emphasis"
      />
      <Row label={tr('comZ')} value={`${fmt(t.comZ, 1)} m`} />
      <Row label={tr('isp')} value={t.isp ? `${Math.round(t.isp)} s` : '—'} />
      <Row
        label={tr('deltaV')}
        value={`${fmt(t.deltaV / 1000, 2)} km/s`}
        tone="emphasis"
      />
      <Row label={tr('thrust')} value={thrustLabel} />
      <Row label={tr('acceleration')} value={accelLabel} tone="warn" />
      {transitLabel && (
        <Row label={tr('outboundTransit')} value={transitLabel} />
      )}
      {schedule && (
        <Row
          label={tr('roundTripMission')}
          value={`${fmt(schedule.tMissionEnd, 0)} ${dayUnit}`}
        />
      )}
      {active && (
        <>
          <Row
            label={tr('finalDestination')}
            value={lang === 'en' ? 'HEO / EML-1 (Earth)' : 'HEO / EML-1 (Terre)'}
          />
          <Row
            label={tr('deltaVMarginAR')}
            value={`${active.marginDeltaV >= 0 ? '+' : ''}${fmt(active.marginDeltaV / 1000, 2)} km/s`}
            tone={active.marginDeltaV >= 0 ? 'ok' : 'bad'}
          />
        </>
      )}
      {missionFuel && (
        <Row
          label={tr('missionConsumption')}
          value={`${missionFuel}${active && !active.feasible ? ` · ${tr('insufficient')}` : ''}`}
          tone={active?.feasible ? 'ok' : 'bad'}
        />
      )}
      <Row label={tr('powerProduction')} value={`${fmt(t.powerProduction, 0)} kW`} tone="ok" />
      <Row label={tr('powerConsumption')} value={`${fmt(t.powerConsumption, 0)} kW`} />
      <Row
        label={tr('powerBalance')}
        value={`${surplus ? '+' : ''}${fmt(t.powerNet, 0)} kW`}
        tone={surplus ? 'ok' : 'bad'}
      />
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${surplus ? 'bg-teal-400' : 'bg-rose-400'}`}
          style={{
            width: `${Math.min(100, (t.powerProduction / Math.max(t.powerConsumption, 1)) * 100)}%`,
          }}
        />
      </div>
      <p className="mt-2 text-[0.68rem] leading-snug text-slate-300 font-mono">
        Δv = I<sub>sp</sub> · g<sub>0</sub> · ln(M<sub>i</sub>/M<sub>f</sub>)
        {' · '}a = F / M · g₀ = {G0}
      </p>
    </div>
  )
}
