import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { memo, useState } from 'react'
import { ACESFilmicToneMapping } from 'three'
import { useHasModule } from '../../hooks/useShipTelemetry'
import { useShipConfiguration } from '../../hooks/useShipConfiguration'
import { G, RING_RADIUS } from './constants'
import { ExplorationShip } from './ExplorationShip'
import { MissionOverlay } from '../orbit/MissionOverlay'
import { ModuleConfigurator } from './ModuleConfigurator'
import { BlueprintOverlay } from './ShipBlueprint'
import { TelemetryHud } from './TelemetryHud'
import { useLanguage } from '../../i18n/LanguageContext'

function rpmFromOmega(omega: number) {
  return (omega * 60) / (2 * Math.PI)
}

const CAMERA = { position: [92, 42, 78] as const, fov: 40, near: 0.08, far: 1800 }
const GL = { antialias: true, toneMapping: ACESFilmicToneMapping }
const DPR: [number, number] = [1, 1.75]

export const ShipViewer = memo(function ShipViewer() {
  const {
    omega,
    thrust,
    showShield,
    setOmega,
    setThrust,
    setShowShield,
    elevatorAuto,
    setElevatorAuto,
    elevatorPosition,
    setElevatorPosition,
  } = useShipConfiguration()
  const { t, lang } = useLanguage()
  const hasCentrifuge = useHasModule('centrifuge-hab')
  const [controlsOpen, setControlsOpen] = useState(false)
  const [bayOpen, setBayOpen] = useState(true)
  const [planOpen, setPlanOpen] = useState(false)
  const [missionOpen, setMissionOpen] = useState(false)

  const accel = omega * omega * RING_RADIUS
  const gRatio = accel / G
  const rpm = rpmFromOmega(omega)

  return (
    <div className="relative h-[min(calc(100dvh-12rem),56rem)] min-h-[32rem] w-full overflow-hidden rounded-[14px] bg-[#05070d]">
      <Canvas
        camera={CAMERA}
        dpr={DPR}
        gl={GL}
        className="h-full w-full touch-none"
        onCreated={({ gl }) => {
          const canvas = gl.domElement
          const onLost = (event: Event) => {
            event.preventDefault()
          }
          canvas.addEventListener('webglcontextlost', onLost)
        }}
      >
        <color attach="background" args={['#05070d']} />
        <ambientLight intensity={0.14} />
        <hemisphereLight args={['#9bbcff', '#1a1020', 0.38]} />
        <directionalLight
          position={[110, 70, 40]}
          intensity={2.35}
          color="#fff3d6"
        />
        <directionalLight
          position={[-60, -30, -40]}
          intensity={0.35}
          color="#6d7fb3"
        />
        <Stars
          radius={280}
          depth={70}
          count={4500}
          factor={3.1}
          saturation={0}
          fade
          speed={0.35}
        />
        <ExplorationShip />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={22}
          maxDistance={420}
          target={[0, 0, -4]}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 p-3 sm:p-4">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex min-h-0 flex-1 justify-between gap-3 overflow-hidden max-h-[calc(100%-4.2rem)]">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden max-h-full">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBayOpen((open) => !open)}
                  className={`pointer-events-auto rounded-lg px-3.5 py-1.5 text-[0.82rem] font-extrabold shadow-lg transition border-2 ${
                    bayOpen
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-slate-900 text-amber-300 border-amber-500/80 hover:bg-slate-800 hover:text-amber-200'
                  }`}
                  style={{
                    color: bayOpen ? '#020617' : '#fcd34d',
                    backgroundColor: bayOpen ? '#fbbf24' : '#0f172a',
                    borderColor: bayOpen ? '#fef08a' : '#f59e0b',
                  }}
                >
                  {bayOpen ? t('hideAssembly') : t('assembly')}
                </button>
                <button
                  type="button"
                  onClick={() => setPlanOpen(true)}
                  className="pointer-events-auto rounded-lg border-2 border-cyan-300 bg-cyan-600 px-3.5 py-1.5 text-[0.82rem] font-extrabold text-white shadow-lg hover:bg-cyan-500 transition"
                  style={{
                    color: '#ffffff',
                    backgroundColor: '#0891b2',
                    borderColor: '#67e8f9',
                  }}
                >
                  {t('blueprint')}
                </button>
              </div>
              {bayOpen && <ModuleConfigurator />}
            </div>
            <div
              className="pointer-events-auto flex w-full max-w-[19.5rem] shrink-0 flex-col items-stretch gap-2 overflow-y-auto max-h-full"
              onWheel={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMissionOpen(true)}
                  className="pointer-events-auto rounded-lg border-2 border-violet-300 bg-violet-600 px-3.5 py-1.5 text-[0.82rem] font-extrabold text-white shadow-lg hover:bg-violet-500 transition"
                  style={{
                    color: '#ffffff',
                    backgroundColor: '#7c3aed',
                    borderColor: '#c4b5fd',
                  }}
                >
                  {t('orbit3D')}
                </button>
              </div>
              <TelemetryHud />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 sm:inset-x-4 sm:bottom-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              {controlsOpen && (
                <div
                  className="pointer-events-auto absolute bottom-full left-0 mb-2.5 w-[19rem] rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md z-30"
                  onWheel={(event) => event.stopPropagation()}
                >
                  <div className="mb-2.5 flex flex-col gap-2 text-xs font-semibold text-slate-100">
                    <label className="flex cursor-pointer items-center justify-between gap-3">
                      <span>{t('radiationShield')}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showShield}
                        onClick={() => setShowShield(!showShield)}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                          showShield ? 'bg-teal-400' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                            showShield ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                    {hasCentrifuge && (
                      <label className="flex cursor-pointer items-center justify-between gap-3">
                        <span>{t('elevatorLoop')}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={elevatorAuto}
                          onClick={() => setElevatorAuto(!elevatorAuto)}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                            elevatorAuto ? 'bg-cyan-400' : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                              elevatorAuto ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </label>
                    )}
                  </div>

                  <div className="grid gap-2.5 text-white">
                    {hasCentrifuge && (
                      <label className="block text-[0.8rem]">
                        <span className="mb-0.5 flex justify-between gap-2 font-medium text-slate-200">
                          <span>{t('rotation')}</span>
                          <span className="tabular-nums font-bold font-mono text-teal-300">
                            {omega.toFixed(2)} rad/s
                          </span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={1.2}
                          step={0.01}
                          value={omega}
                          onChange={(e) => setOmega(Number(e.target.value))}
                          className="w-full accent-teal-400 cursor-pointer"
                        />
                      </label>
                    )}
                    <label className="block text-[0.8rem]">
                      <span className="mb-0.5 flex justify-between gap-2 font-medium text-slate-200">
                        <span>{t('thrustThrottle')}</span>
                        <span className="tabular-nums font-bold font-mono text-violet-300">
                          {Math.round(thrust * 100)} %
                        </span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={thrust}
                        onChange={(e) => setThrust(Number(e.target.value))}
                        className="w-full accent-violet-400 cursor-pointer"
                      />
                    </label>
                    {hasCentrifuge && (
                      <label className="block text-[0.8rem]">
                        <span className="mb-0.5 flex justify-between gap-2 font-medium text-slate-200">
                          <span>{t('elevator')}</span>
                          <span className="tabular-nums font-bold font-mono text-cyan-300">
                            {Math.round(elevatorPosition * 100)} %
                          </span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={elevatorPosition}
                          disabled={elevatorAuto}
                          onChange={(e) => {
                            setElevatorAuto(false)
                            setElevatorPosition(Number(e.target.value))
                          }}
                          className="w-full accent-cyan-400 disabled:opacity-50 cursor-pointer"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
              <button
                type="button"
                aria-expanded={controlsOpen}
                onClick={() => setControlsOpen((o) => !o)}
                className={`pointer-events-auto rounded-lg px-3.5 py-1.5 text-[0.82rem] font-extrabold shadow-xl transition border-2 ${
                  controlsOpen
                    ? 'bg-teal-400 text-slate-950 border-teal-200'
                    : 'bg-slate-900 text-teal-300 border-teal-400/80 hover:bg-slate-800 hover:text-teal-100'
                }`}
                style={{
                  color: controlsOpen ? '#020617' : '#5eead4',
                  backgroundColor: controlsOpen ? '#2dd4bf' : '#0f172a',
                  borderColor: controlsOpen ? '#99f6e4' : '#2dd4bf',
                }}
              >
                {controlsOpen ? t('hideControls') : t('controls')}
              </button>
            </div>
            {hasCentrifuge && (
              <>
                <span className="rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[0.75rem] font-semibold text-slate-100 shadow-sm">
                  <strong className="font-mono text-teal-300">{rpm.toFixed(2)}</strong> RPM
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[0.75rem] font-semibold text-slate-100 shadow-sm">
                  a<sub>c</sub> = <strong className="font-mono text-teal-300">{accel.toFixed(1)}</strong> m/s²
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[0.75rem] font-semibold text-slate-100 shadow-sm">
                  <strong className="font-mono text-teal-300">{gRatio.toFixed(2)}</strong> {lang === 'en' ? 'ring g' : 'g anneau'}
                </span>
              </>
            )}
            <span className="rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[0.75rem] font-semibold text-slate-200 shadow-sm">
              {t('spinedescription')}
            </span>
          </div>
        </div>
      </div>
      {planOpen && <BlueprintOverlay onClose={() => setPlanOpen(false)} />}
      {missionOpen && (
        <MissionOverlay onClose={() => setMissionOpen(false)} />
      )}
    </div>
  )
})
