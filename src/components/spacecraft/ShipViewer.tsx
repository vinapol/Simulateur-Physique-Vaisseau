import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { memo, useState } from 'react'
import { ACESFilmicToneMapping } from 'three'
import {
  ELEVATOR_G_RING,
  G,
  RING_RADIUS,
} from './constants'
import { ExplorationShip, type FpvMode } from './ExplorationShip'

export type ShipViewerProps = {
  omega: number
  thrust: number
  showShield: boolean
  onOmegaChange: (value: number) => void
  onThrustChange: (value: number) => void
  onShowShieldChange: (value: boolean) => void
}

function rpmFromOmega(omega: number) {
  return (omega * 60) / (2 * Math.PI)
}

const CAMERA = { position: [92, 42, 78] as const, fov: 40, near: 0.08, far: 1800 }
const GL = { antialias: true, toneMapping: ACESFilmicToneMapping }
const DPR: [number, number] = [1, 1.75]

export const ShipViewer = memo(function ShipViewer({
  omega,
  thrust,
  showShield,
  onOmegaChange,
  onThrustChange,
  onShowShieldChange,
}: ShipViewerProps) {
  const [elevatorAuto, setElevatorAuto] = useState(true)
  const [elevatorPos, setElevatorPos] = useState(0)
  const [fpvMode, setFpvMode] = useState<FpvMode>('none')
  const [controlsOpen, setControlsOpen] = useState(false)

  const accel = omega * omega * RING_RADIUS
  const gRatio = accel / G
  const rpm = rpmFromOmega(omega)
  const cabinRadius = RING_RADIUS * (1 - elevatorPos)
  const gFelt = (cabinRadius / RING_RADIUS) * ELEVATOR_G_RING
  const inTransit = elevatorPos > 0.08 && elevatorPos < 0.92
  const speed = inTransit ? 1.5 : 0

  return (
    <div className="relative h-[min(78vh,740px)] min-h-[28rem] w-full overflow-hidden rounded-[14px] bg-[#05070d]">
      <Canvas
        shadows
        camera={CAMERA}
        dpr={DPR}
        gl={GL}
        className="h-full w-full touch-none"
      >
        <color attach="background" args={['#05070d']} />
        <ambientLight intensity={fpvMode !== 'none' ? 0.08 : 0.14} />
        <hemisphereLight args={['#9bbcff', '#1a1020', fpvMode !== 'none' ? 0.22 : 0.38]} />
        <directionalLight
          position={[110, 70, 40]}
          intensity={fpvMode !== 'none' ? 3.4 : 2.35}
          color="#fff3d6"
          castShadow={fpvMode !== 'none'}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
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
        <ExplorationShip
          omega={omega}
          thrust={thrust}
          showShield={showShield && fpvMode === 'none'}
          elevatorAuto={elevatorAuto}
          elevatorPosition={elevatorPos}
          onElevatorPositionChange={setElevatorPos}
          fpvMode={fpvMode}
        />
        {fpvMode === 'none' && (
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={22}
            maxDistance={420}
            target={[0, 0, -4]}
          />
        )}
      </Canvas>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
        {fpvMode === 'cabin' ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="rounded-md bg-slate-950/70 px-2 py-1 text-[0.72rem] text-cyan-100 backdrop-blur-sm">
                Clic dans la vue pour regarder autour · Échap pour libérer
              </p>
              <button
                type="button"
                onClick={() => setFpvMode('none')}
                className="pointer-events-auto rounded-lg bg-slate-950/80 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-slate-800"
              >
                Vue extérieure
              </button>
            </div>
            <div className="w-full max-w-md rounded-xl border border-cyan-400/25 bg-slate-950/80 p-3 text-cyan-50 shadow-lg backdrop-blur-md">
              <p className="mb-2 text-[0.65rem] font-semibold tracking-wide text-cyan-300 uppercase">
                Télémétrie cabine
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm tabular-nums">
                <span className="text-slate-400">Altitude radiale</span>
                <span>{cabinRadius.toFixed(1)} m</span>
                <span className="text-slate-400">Pesanteur ressentie</span>
                <span>{gFelt.toFixed(2)} g</span>
                <span className="text-slate-400">Vitesse translation</span>
                <span>{speed.toFixed(1)} m/s</span>
                <span className="text-slate-400">Pressurisation</span>
                <span>101,3 kPa · 21 % O₂</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal-950">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width: `${Math.min(100, (gFelt / ELEVATOR_G_RING) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </>
        ) : fpvMode === 'habitat' ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="rounded-md bg-slate-950/70 px-2 py-1 text-[0.72rem] text-amber-100 backdrop-blur-sm">
                Clic pour regarder · ZQSD / WASD pour marcher · Échap pour libérer
              </p>
              <button
                type="button"
                onClick={() => setFpvMode('none')}
                className="pointer-events-auto rounded-lg bg-slate-950/80 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-slate-800"
              >
                Vue extérieure
              </button>
            </div>
            <div className="w-full max-w-md rounded-xl border border-amber-400/25 bg-slate-950/80 p-3 text-amber-50 shadow-lg backdrop-blur-md">
              <p className="mb-2 text-[0.65rem] font-semibold tracking-wide text-amber-300 uppercase">
                Module habitable · 1,02 g
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm tabular-nums">
                <span className="text-slate-400">Pesanteur</span>
                <span>1,02 g</span>
                <span className="text-slate-400">Rayon anneau</span>
                <span>40 m</span>
                <span className="text-slate-400">Pression</span>
                <span>101,3 kPa · 21 % O₂</span>
                <span className="text-slate-400">Température</span>
                <span>21,5 °C</span>
              </div>
              <p className="mt-2 text-[0.72rem] text-slate-400">
                Sas ovale central → zone sport · sas avant → module voisin
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setElevatorAuto(true)
                  setFpvMode('cabin')
                }}
                className="pointer-events-auto rounded-lg bg-cyan-700/90 px-2.5 py-1.5 text-[0.78rem] font-semibold text-white shadow-lg hover:bg-cyan-600"
              >
                Cabine FPV
              </button>
              <button
                type="button"
                onClick={() => setFpvMode('habitat')}
                className="pointer-events-auto rounded-lg bg-amber-700/90 px-2.5 py-1.5 text-[0.78rem] font-semibold text-white shadow-lg hover:bg-amber-600"
              >
                Module 1 g
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="pointer-events-none w-fit rounded-lg border border-cyan-400/30 bg-cyan-950/80 px-3 py-2 text-cyan-50 shadow-lg backdrop-blur-sm">
                  <p className="text-[0.65rem] font-semibold tracking-wide text-cyan-300 uppercase">
                    Cabine — pesanteur ressentie
                  </p>
                  <p className="font-semibold tabular-nums text-cyan-100">
                    g_ressenti = {gFelt.toFixed(2)} g
                  </p>
                  <p className="text-[0.7rem] text-cyan-200/80">
                    (R / 40) × 1,02 g · R = {cabinRadius.toFixed(1)} m
                  </p>
                </div>
                <button
                  type="button"
                  aria-expanded={controlsOpen}
                  onClick={() => setControlsOpen((open) => !open)}
                  className="pointer-events-auto rounded-lg border border-white/10 bg-slate-950/80 px-3 py-1.5 text-[0.78rem] font-semibold text-slate-100 shadow-lg backdrop-blur-md hover:bg-slate-800"
                >
                  {controlsOpen ? 'Masquer les commandes' : 'Commandes'}
                </button>
              </div>

              {controlsOpen && (
                <div className="pointer-events-auto max-h-[42%] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/85 p-3 text-slate-100 shadow-lg backdrop-blur-md">
                  <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <span>Cône anti-radiations</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showShield}
                        onClick={() => onShowShieldChange(!showShield)}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                          showShield ? 'bg-teal-500' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                            showShield ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <span>Aller-retour ascenseur</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={elevatorAuto}
                        onClick={() => setElevatorAuto((v) => !v)}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                          elevatorAuto ? 'bg-cyan-500' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                            elevatorAuto ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="block text-[0.8rem]">
                      <span className="mb-0.5 flex justify-between gap-2">
                        <span>Rotation</span>
                        <span className="tabular-nums text-teal-200">
                          {omega.toFixed(2)} rad/s
                        </span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1.2}
                        step={0.01}
                        value={omega}
                        onChange={(e) => onOmegaChange(Number(e.target.value))}
                        className="w-full accent-teal-400"
                      />
                    </label>
                    <label className="block text-[0.8rem]">
                      <span className="mb-0.5 flex justify-between gap-2">
                        <span>Poussée</span>
                        <span className="tabular-nums text-violet-200">
                          {Math.round(thrust * 100)} %
                        </span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={thrust}
                        onChange={(e) =>
                          onThrustChange(Number(e.target.value))
                        }
                        className="w-full accent-violet-400"
                      />
                    </label>
                    <label className="block text-[0.8rem]">
                      <span className="mb-0.5 flex justify-between gap-2">
                        <span>Ascenseur</span>
                        <span className="tabular-nums text-cyan-200">
                          {Math.round(elevatorPos * 100)} %
                        </span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={elevatorPos}
                        disabled={elevatorAuto}
                        onChange={(e) => {
                          setElevatorAuto(false)
                          setElevatorPos(Number(e.target.value))
                        }}
                        className="w-full accent-cyan-400 disabled:opacity-60"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="pointer-events-none flex flex-wrap gap-2 text-[0.72rem] text-slate-200">
                <span className="rounded-md bg-slate-950/70 px-2 py-1 backdrop-blur-sm">
                  {rpm.toFixed(2)} RPM
                </span>
                <span className="rounded-md bg-slate-950/70 px-2 py-1 backdrop-blur-sm">
                  a<sub>c</sub> = {accel.toFixed(1)} m/s²
                </span>
                <span className="rounded-md bg-slate-950/70 px-2 py-1 backdrop-blur-sm">
                  {gRatio.toFixed(2)} g anneau
                </span>
                <span className="rounded-md bg-slate-950/70 px-2 py-1 backdrop-blur-sm">
                  Poutre 120 m · anneau Ø 80 m
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
})
