import { Line, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, type Mesh } from 'three'
import type { OrbitPlayback } from '../../hooks/useOrbitPlayback'
import { PLAYBACK_SPEEDS } from '../../hooks/useOrbitPlayback'
import {
  DAYS_PER_SEC_1X,
  missionSnapshot,
  R_EARTH_AU,
  R_MARS_AU,
  returnDepartureTrueAnomaly,
  sampleCircle,
  sampleHohmannPath,
  sampleHohmannReturnPath,
  sampleNepOutbound,
  sampleNepReturn,
  type FuelBudget,
  type RoundTripSchedule,
  type TransferKind,
} from '../../physics/orbitalTransfers'

const TRAIL_LEN = 140

function OrbitRing({
  radiusAu,
  color,
}: {
  radiusAu: number
  color: string
}) {
  const pts = useMemo(() => sampleCircle(radiusAu, 96), [radiusAu])
  return (
    <Line points={pts} color={color} lineWidth={1.2} transparent opacity={0.75} />
  )
}

function TransferArcs({
  kind,
  schedule,
}: {
  kind: TransferKind
  schedule: RoundTripSchedule
}) {
  const thetaDep = useMemo(
    () => returnDepartureTrueAnomaly(kind, schedule),
    [kind, schedule],
  )

  const outbound = useMemo(
    () =>
      kind === 'ntp'
        ? sampleHohmannPath(schedule.outboundDays, 128)
        : sampleNepOutbound(260),
    [kind, schedule.outboundDays],
  )
  const inbound = useMemo(
    () =>
      kind === 'ntp'
        ? sampleHohmannReturnPath(thetaDep, schedule.returnDays, 128)
        : sampleNepReturn(thetaDep, 260),
    [kind, thetaDep, schedule.returnDays],
  )

  return (
    <>
      <Line points={outbound} color="#7dd3fc" lineWidth={2} />
      <Line points={inbound} color="#fbbf24" lineWidth={2} />
    </>
  )
}

function KeplerBodies({
  kind,
  schedule,
  fuel,
  playback,
}: {
  kind: TransferKind
  schedule: RoundTripSchedule
  fuel: FuelBudget
  playback: OrbitPlayback
}) {
  const earthRef = useRef<Mesh>(null)
  const marsRef = useRef<Mesh>(null)
  const shipRef = useRef<Mesh>(null)
  const trailGeomRef = useRef<BufferGeometry>(null)
  const trail = useMemo(() => new Float32Array(TRAIL_LEN * 3), [])
  const trailCount = useRef(0)

  useLayoutEffect(() => {
    const geom = trailGeomRef.current
    if (!geom) return
    geom.setAttribute('position', new BufferAttribute(trail, 3))
    geom.setDrawRange(0, 0)
  }, [trail])

  useEffect(() => {
    playback.timeDaysRef.current = 0
    trailCount.current = 0
    trail.fill(0)
    const geom = trailGeomRef.current
    if (geom) geom.setDrawRange(0, 0)
  }, [kind, playback.resetSerial, playback.timeDaysRef, trail])

  useFrame((_, dt) => {
    if (playback.playingRef.current) {
      playback.timeDaysRef.current +=
        dt * DAYS_PER_SEC_1X * playback.speedRef.current
      if (playback.timeDaysRef.current >= schedule.tMissionEnd) {
        playback.timeDaysRef.current %= schedule.tMissionEnd
        trailCount.current = 0
      }
    }

    const snap = missionSnapshot(
      playback.timeDaysRef.current,
      kind,
      schedule,
      fuel,
    )
    earthRef.current?.position.set(...snap.earth)
    marsRef.current?.position.set(...snap.mars)
    shipRef.current?.position.set(...snap.ship)

    if (playback.playingRef.current || trailCount.current === 0) {
      const n = trailCount.current
      const [x, y, z] = snap.ship
      if (n < TRAIL_LEN) {
        trail[n * 3] = x
        trail[n * 3 + 1] = y
        trail[n * 3 + 2] = z
        trailCount.current = n + 1
      } else {
        trail.copyWithin(0, 3)
        trail[(TRAIL_LEN - 1) * 3] = x
        trail[(TRAIL_LEN - 1) * 3 + 1] = y
        trail[(TRAIL_LEN - 1) * 3 + 2] = z
      }
      const geom = trailGeomRef.current
      if (geom) {
        const attr = geom.getAttribute('position')
        if (attr) {
          ;(attr.array as Float32Array).set(trail)
          attr.needsUpdate = true
        }
        geom.setDrawRange(0, trailCount.current)
        geom.computeBoundingSphere()
      }
    }
  })

  const shipGlow = kind === 'ntp' ? '#c4b5fd' : '#5ee7ff'

  return (
    <>
      <mesh ref={earthRef}>
        <sphereGeometry args={[0.28, 18, 14]} />
        <meshStandardMaterial
          color="#4f8dff"
          emissive="#4f8dff"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh ref={marsRef}>
        <sphereGeometry args={[0.22, 18, 14]} />
        <meshStandardMaterial
          color="#e85d3a"
          emissive="#e85d3a"
          emissiveIntensity={0.4}
        />
      </mesh>
      <line>
        <bufferGeometry ref={trailGeomRef} />
        <lineBasicMaterial
          color="#f4f7ff"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </line>
      <mesh ref={shipRef}>
        <sphereGeometry args={[0.2, 14, 12]} />
        <meshStandardMaterial
          color="#f8fbff"
          emissive={shipGlow}
          emissiveIntensity={2.4}
        />
        <pointLight color={shipGlow} intensity={3.2} distance={8} />
      </mesh>
    </>
  )
}

function PlaybackBar({ playback }: { playback: OrbitPlayback }) {
  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1.5 text-[0.72rem] text-slate-100 shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={() => playback.setPlaying(!playback.playing)}
        className="rounded-md bg-cyan-700 px-2 py-1 font-semibold text-white hover:bg-cyan-600"
      >
        {playback.playing ? 'Pause' : 'Lecture'}
      </button>
      <button
        type="button"
        onClick={playback.reset}
        className="rounded-md bg-slate-700 px-2 py-1 font-semibold text-slate-50 hover:bg-slate-600"
      >
        Reset
      </button>
      <span className="mx-0.5 h-4 w-px bg-white/15" />
      {PLAYBACK_SPEEDS.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => playback.setSpeed(value)}
          className={`rounded-md px-1.5 py-1 font-mono font-semibold ${
            playback.speed === value
              ? 'bg-violet-600 text-white'
              : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
          }`}
        >
          ×{value}
        </button>
      ))}
    </div>
  )
}

export function TrajectoryView({
  kind,
  schedule,
  fuel,
  playback,
}: {
  kind: TransferKind
  schedule: RoundTripSchedule
  fuel: FuelBudget
  playback: OrbitPlayback
}) {
  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 24, 20], fov: 42, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        className="h-full w-full touch-none"
        onCreated={({ gl }) => {
          const onLost = (event: Event) => {
            event.preventDefault()
          }
          gl.domElement.addEventListener('webglcontextlost', onLost)
        }}
      >
        <color attach="background" args={['#05070d']} />
        <ambientLight intensity={0.22} />
        <mesh>
          <sphereGeometry args={[0.55, 24, 18]} />
          <meshBasicMaterial color="#ffd27a" />
        </mesh>
        <pointLight color="#ffcc77" intensity={18} distance={48} />
        <OrbitRing radiusAu={R_EARTH_AU} color="#5b9dff" />
        <OrbitRing radiusAu={R_MARS_AU} color="#ff6b4a" />
        <TransferArcs kind={kind} schedule={schedule} />
        <KeplerBodies
          key={`${kind}-${schedule.outboundDays.toFixed(1)}-${schedule.stayDays.toFixed(1)}`}
          kind={kind}
          schedule={schedule}
          fuel={fuel}
          playback={playback}
        />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={12}
          maxDistance={52}
          target={[0, 0, 0]}
        />
      </Canvas>
      <PlaybackBar playback={playback} />
    </div>
  )
}
