import { useShipConfiguration } from '../../hooks/useShipConfiguration'
import {
  HEAVY_CARGO_MASS_MIN,
  heavyCargoCapacity,
  type PodCount,
  type ShipPresetId,
} from '../../types/spacecraft'
import { MODULE_STATS, getModuleStats } from '../../data/shipModules'
import { useLanguage } from '../../i18n/LanguageContext'

const PRESET_ORDER: ShipPresetId[] = ['liner', 'hauler', 'tug']
const POD_OPTIONS: PodCount[] = [2, 4]

export function ModuleConfigurator() {
  const { t: tr, lang } = useLanguage()
  const {
    spineSlots,
    activePreset,
    selectedSlotId,
    setSlotModule,
    applyPreset,
    selectSlot,
    podCount,
    setPodCount,
    heavyCargoMass,
    setHeavyCargoMass,
  } = useShipConfiguration()

  const selected = spineSlots.find((s) => s.id === selectedSlotId) ?? null
  const heavyMounted = spineSlots.some((s) => s.mountedModuleId === 'heavy-cargo')
  const cargoMax = heavyCargoCapacity(podCount)

  const presetLabels: Record<ShipPresetId, string> = {
    liner: tr('presetLinerName'),
    hauler: tr('presetHaulerName'),
    tug: tr('presetTugName'),
  }

  const presetRoles: Record<ShipPresetId, string> = {
    liner: tr('presetLinerRole'),
    hauler: tr('presetHaulerRole'),
    tug: tr('presetTugRole'),
  }

  const slotNames: Record<string, string> = {
    forward: tr('slotForwardName'),
    median: tr('slotMedianName'),
    intermediate: tr('slotInterName'),
    aft: tr('slotAftName'),
  }

  const moduleNames: Record<string, string> = {
    ntp: tr('modNtpName'),
    ion: tr('modIonName'),
    'centrifuge-hab': tr('modCentrifugeName'),
    'heavy-cargo': tr('modHeavyCargoName'),
    'cargo-bay': tr('modCargoBayName'),
    'cryo-tanks': tr('modCryoTanksName'),
    'argon-tanks': tr('modArgonTanksName'),
    'docking-nose': tr('modDockingName'),
  }

  const moduleBlurbs: Record<string, string> = {
    ntp: tr('blurbNtp'),
    ion: tr('blurbIon'),
    'centrifuge-hab': tr('blurbCentrifuge'),
    'heavy-cargo': tr('blurbHeavyCargo'),
    'cargo-bay': tr('blurbCargoBay'),
    'cryo-tanks': tr('blurbCryoTanks'),
    'argon-tanks': tr('blurbArgonTanks'),
    'docking-nose': tr('blurbDocking'),
  }

  return (
    <div
      className="pointer-events-auto flex min-h-0 flex-1 w-full max-w-[20.5rem] flex-col gap-2 overflow-y-scroll overscroll-contain rounded-xl border border-white/15 bg-slate-950 p-3 text-slate-50 shadow-lg backdrop-blur-md [scrollbar-color:#5ee7ff66_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
      onWheel={(event) => event.stopPropagation()}
    >
      <p className="text-[0.65rem] font-semibold tracking-wide text-amber-300 uppercase">
        {tr('assemblyTitleText')}
      </p>
      <div className="flex flex-col gap-1.5">
        {PRESET_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => applyPreset(id)}
            className={`rounded-lg px-2.5 py-1.5 text-left text-[0.75rem] leading-snug ring-1 transition ${
              activePreset === id
                ? 'bg-teal-600 text-white ring-teal-200/50'
                : 'bg-slate-800 text-slate-50 ring-white/15 hover:bg-slate-700'
            }`}
          >
            {presetLabels[id]}
            <span
              className={`mt-0.5 block text-[0.65rem] font-normal ${
                activePreset === id ? 'text-teal-50' : 'text-slate-300'
              }`}
            >
              {presetRoles[id]}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-1 text-[0.65rem] font-semibold tracking-wide text-slate-300 uppercase">
        {tr('slotsTitleText')}
      </p>
      <ul className="flex flex-col gap-1.5">
        {spineSlots.map((slot) => {
          const mounted = getModuleStats(slot.mountedModuleId)
          const mountedName = mounted ? (moduleNames[mounted.id] ?? mounted.name) : null
          const active = selectedSlotId === slot.id
          return (
            <li key={slot.id}>
              <button
                type="button"
                onClick={() => selectSlot(active ? null : slot.id)}
                onDragOver={(e) => {
                  if (slot.id === 'aft') return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'copy'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (slot.id === 'aft') return
                  const moduleId = e.dataTransfer.getData('text/plain')
                  if (moduleId) setSlotModule(slot.id, moduleId)
                }}
                className={`flex w-full flex-col items-start rounded-lg px-2.5 py-1.5 text-left ring-1 ${
                  active
                    ? 'bg-cyan-800 text-white ring-cyan-300/60'
                    : 'bg-slate-800 text-slate-50 ring-white/15 hover:bg-slate-700'
                }`}
              >
                <span className="text-[0.72rem] font-semibold text-slate-50">
                  {slotNames[slot.id] ?? slot.name}
                </span>
                <span
                  className={`text-[0.7rem] ${
                    active ? 'text-cyan-100' : 'text-slate-300'
                  }`}
                >
                  {mountedName ? mountedName : tr('emptySlot')}
                  {slot.id === 'aft' ? tr('slotLocked') : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {selected && selected.id === 'aft' && (
        <div className="rounded-lg bg-slate-800 p-2 ring-1 ring-white/15">
          <p className="text-[0.7rem] text-slate-200">
            {tr('nativeEngineLocked')}
          </p>
          <p className="mt-1 text-[0.72rem] font-medium text-cyan-100">
            {(selected.mountedModuleId && moduleNames[selected.mountedModuleId]) ?? getModuleStats(selected.mountedModuleId)?.name ?? '—'}
          </p>
        </div>
      )}

      {selected && selected.id !== 'aft' && (
        <div className="rounded-lg bg-slate-800 p-2 ring-1 ring-white/15">
          <p className="mb-1.5 text-[0.7rem] font-medium text-slate-100">
            {tr('compatiblesFor')}{slotNames[selected.id] ?? selected.name}
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSlotModule(selected.id, null)}
              className="rounded-md px-2 py-1 text-left text-[0.72rem] text-slate-200 hover:bg-slate-700"
            >
              {tr('removeModule')}
            </button>
            {selected.allowedModuleIds.map((id) => {
              const mod = MODULE_STATS[id]
              if (!mod) return null
              const modName = moduleNames[id] ?? mod.name
              const on = selected.mountedModuleId === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSlotModule(selected.id, id)}
                  className={`rounded-md px-2 py-1.5 text-left text-[0.72rem] ${
                    on
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-700 text-slate-50 hover:bg-slate-600'
                  }`}
                >
                  <span className="block font-medium text-slate-50">
                    {modName}
                  </span>
                  <span
                    className={`block text-[0.65rem] ${
                      on ? 'text-teal-50' : 'text-slate-300'
                    }`}
                  >
                    {mod.dryMass + mod.fuelMass} t · {mod.powerDraw} kW
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {heavyMounted && (
        <div className="rounded-lg bg-slate-800 p-2 ring-1 ring-white/15">
          <p className="mb-1.5 text-[0.65rem] font-semibold tracking-wide text-amber-200 uppercase">
            {tr('megaPods')}
          </p>
          <p className="mb-1 text-[0.7rem] text-slate-200">{tr('podsCountLabel')}</p>
          <div className="mb-2 flex gap-1">
            {POD_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setPodCount(n)
                  setHeavyCargoMass(heavyCargoCapacity(n))
                }}
                className={`flex-1 rounded-md py-1 text-[0.72rem] font-semibold ${
                  podCount === n
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="block text-[0.7rem] text-slate-200">
            <span className="mb-0.5 flex justify-between gap-2">
              <span>{tr('payloadMass')}</span>
              <span className="tabular-nums text-amber-100">
                {Math.round(Math.min(heavyCargoMass, cargoMax))} t
              </span>
            </span>
            <input
              type="range"
              min={HEAVY_CARGO_MASS_MIN}
              max={cargoMax}
              step={5}
              value={Math.min(heavyCargoMass, cargoMax)}
              onChange={(e) => setHeavyCargoMass(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </label>
          <p className="mt-1 text-[0.65rem] text-slate-300">
            {tr('structureMass')} {podCount === 2 ? (lang === 'en' ? '17.5' : '17,5') : (lang === 'en' ? '35.0' : '35,0')} t · {tr('maxCap')} {cargoMax} t
          </p>
        </div>
      )}

      <p className="mt-1 text-[0.65rem] font-semibold tracking-wide text-slate-300 uppercase">
        {tr('libraryTitleText')}
      </p>
      <ul className="flex flex-col gap-1.5">
        {Object.values(MODULE_STATS).map((mod) => (
          <li
            key={mod.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', mod.id)
              e.dataTransfer.effectAllowed = 'copy'
            }}
            className="cursor-grab rounded-lg bg-slate-800 px-2.5 py-1.5 text-slate-50 ring-1 ring-white/15 active:cursor-grabbing"
          >
            <p className="text-[0.75rem] font-medium text-slate-50">{moduleNames[mod.id] ?? mod.name}</p>
            <p className="text-[0.65rem] leading-snug text-slate-300">
              {moduleBlurbs[mod.id] ?? ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
