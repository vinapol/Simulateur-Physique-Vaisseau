import { PointerLockControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import {
  CanvasTexture,
  DoubleSide,
  Quaternion,
  Vector3,
  type Group,
  type MeshStandardMaterial,
} from 'three'
import {
  CABIN_HALF_LEN,
  CABIN_INNER_R,
  CABIN_LED,
  ELEVATOR_G_RING,
  METAL,
  METAL_DARK,
  RING_RADIUS,
} from './constants'

export type CabinTelemetry = {
  position: number
  speed: number
  shaking: boolean
  dockedHub: boolean
  dockedRing: boolean
}

const CREAM = '#e8e4da'
const CREAM_DARK = '#d4cfc4'
const ALU = '#b7bec6'
const HANDLE = '#e3942b'
const STRAP = '#2a3038'
const SEAT = '#3d4450'

function Handrail({
  from,
  to,
  radius = 0.035,
}: {
  from: [number, number, number]
  to: [number, number, number]
  radius?: number
}) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dz = to[2] - from[2]
  const len = Math.hypot(dx, dy, dz)
  const quaternion = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    new Vector3(dx, dy, dz).normalize(),
  )
  return (
    <mesh
      position={[
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2,
        (from[2] + to[2]) / 2,
      ]}
      quaternion={quaternion}
    >
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshStandardMaterial
        color={HANDLE}
        metalness={0.55}
        roughness={0.35}
      />
    </mesh>
  )
}

function Hatch({
  x,
  telemetryRef,
  hub,
}: {
  x: number
  telemetryRef: RefObject<CabinTelemetry>
  hub: boolean
}) {
  const facing = x > 0 ? 1 : -1
  const ledA = useRef<MeshStandardMaterial>(null)
  const ledB = useRef<MeshStandardMaterial>(null)

  useFrame(() => {
    const docked = hub
      ? telemetryRef.current.dockedHub
      : telemetryRef.current.dockedRing
    for (const mat of [ledA.current, ledB.current]) {
      if (!mat) continue
      mat.color.set(docked ? '#7dffa1' : '#ff5a5a')
      mat.emissive.set(docked ? '#3dff88' : '#ff2a2a')
      mat.emissiveIntensity = 1.6
    }
  })

  return (
    <group position={[x, 0, 0]}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.62, 28]} />
        <meshStandardMaterial
          color="#1a222c"
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[facing * 0.02, 0, 0]}>
        <torusGeometry args={[0.5, 0.045, 10, 28]} />
        <meshStandardMaterial color={METAL} metalness={0.78} roughness={0.24} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[facing * 0.04, Math.cos(a) * 0.5, Math.sin(a) * 0.5]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.08, 0.08, 0.05]} />
            <meshStandardMaterial
              color={METAL_DARK}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        )
      })}
      <mesh position={[facing * 0.05, 0.72, 0.18]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial ref={ledA} color="#ff5a5a" emissive="#ff2a2a" />
      </mesh>
      <mesh position={[facing * 0.05, 0.72, -0.18]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial ref={ledB} color="#ff5a5a" emissive="#ff2a2a" />
      </mesh>
    </group>
  )
}

function Seat({ y }: { y: number }) {
  return (
    <group position={[0.92, y, -0.18]}>
      <mesh position={[0, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.48, 0.14, 0.52]} />
        <meshStandardMaterial
          color={SEAT}
          roughness={0.62}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[-0.28, 0, -0.18]} rotation={[0.18, 0, Math.PI / 2]}>
        <boxGeometry args={[0.62, 0.1, 0.48]} />
        <meshStandardMaterial
          color={SEAT}
          roughness={0.62}
          metalness={0.08}
        />
      </mesh>
      {[-0.16, 0.16].map((s) => (
        <group key={s}>
          <mesh position={[-0.02, s * 0.12, 0.08]}>
            <boxGeometry args={[0.42, 0.035, 0.03]} />
            <meshStandardMaterial color={STRAP} roughness={0.7} />
          </mesh>
          <mesh position={[-0.22, s * 0.1, -0.08]} rotation={[0.5, 0, 0.2 * s]}>
            <boxGeometry args={[0.03, 0.03, 0.5]} />
            <meshStandardMaterial color={STRAP} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.08, 0, 0.18]}>
        <boxGeometry args={[0.03, 0.03, 0.36]} />
        <meshStandardMaterial color={STRAP} roughness={0.7} />
      </mesh>
    </group>
  )
}

function drawTelemetry(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: CabinTelemetry,
) {
  const r = RING_RADIUS * (1 - t.position)
  const g = (r / RING_RADIUS) * ELEVATOR_G_RING
  ctx.fillStyle = '#071018'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#2dd4bf'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, w - 16, h - 16)

  ctx.fillStyle = '#5eead4'
  ctx.font = '600 22px DM Sans, sans-serif'
  ctx.fillText('DSTV-80  ·  TRANSFERT 1g → 0g', 28, 42)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '16px DM Sans, sans-serif'
  const rows: [string, string][] = [
    ['Altitude radiale', `${r.toFixed(1)} m`],
    ['Pesanteur ressentie', `${g.toFixed(2)} g`],
    ['Vitesse translation', `${t.speed.toFixed(1)} m/s`],
    ['Pressurisation', '101,3 kPa'],
    ['O₂', '21 %'],
    ['Statut', t.dockedHub ? 'QUAI MOYEU' : t.dockedRing ? 'QUAI ANNEAU' : 'TRANSIT'],
  ]
  rows.forEach((row, i) => {
    const y = 78 + i * 36
    ctx.fillStyle = '#64748b'
    ctx.fillText(row[0], 28, y)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '600 18px DM Sans, sans-serif'
    ctx.fillText(row[1], 280, y)
    ctx.font = '16px DM Sans, sans-serif'
  })

  const gx = 28
  const gy = h - 52
  const gw = w - 56
  ctx.fillStyle = '#134e4a'
  ctx.fillRect(gx, gy, gw, 18)
  ctx.fillStyle = '#2dd4bf'
  ctx.fillRect(gx, gy, gw * Math.min(1, g / ELEVATOR_G_RING), 18)
  ctx.fillStyle = '#99f6e4'
  ctx.font = '13px DM Sans, sans-serif'
  ctx.fillText('Jauge g  0,00  →  1,02', gx, gy - 8)
}

function TelemetryScreen({
  telemetryRef,
}: {
  telemetryRef: RefObject<CabinTelemetry>
}) {
  const { canvas, texture, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 320
    const ctx = canvas.getContext('2d')
    const texture = new CanvasTexture(canvas)
    return { canvas, texture, ctx }
  }, [])

  useFrame(() => {
    if (!ctx) return
    drawTelemetry(ctx, canvas.width, canvas.height, telemetryRef.current)
    texture.needsUpdate = true
  })

  return (
    <mesh position={[0.42, 0, 1.08]} rotation={[0.18, Math.PI, 0]}>
      <planeGeometry args={[1.15, 0.72]} />
      <meshStandardMaterial
        map={texture}
        emissive="#0e7490"
        emissiveIntensity={0.22}
        roughness={0.25}
        metalness={0.1}
      />
    </mesh>
  )
}

function CabinFPVCamera({
  telemetryRef,
}: {
  telemetryRef: RefObject<CabinTelemetry>
}) {
  const groupRef = useRef<Group>(null)
  const tRef = useRef(0)

  useFrame((_, dt) => {
    tRef.current += dt
    const g = groupRef.current
    if (!g) return
    const shake = telemetryRef.current.shaking ? 1 : 0
    const t = tRef.current
    const amp = 0.0032 + shake * 0.011
    const freq = shake ? 38 : 9
    g.position.x = 0.26 + Math.sin(t * freq) * amp
    g.position.y = Math.sin(t * freq * 1.17) * amp * 0.7
    g.position.z = 0.1 + Math.cos(t * freq * 0.9) * amp * 0.5
    g.rotation.z = Math.sin(t * freq * 0.8) * amp * 0.35
  })

  return (
    <group ref={groupRef} position={[0.26, 0, 0.1]} rotation={[0, Math.PI, 0]}>
      <PerspectiveCamera makeDefault fov={72} near={0.06} far={1800} />
      <PointerLockControls />
    </group>
  )
}

export function CabinInterior({
  telemetryRef,
  fpv,
}: {
  telemetryRef: RefObject<CabinTelemetry>
  fpv: boolean
}) {
  const L = CABIN_HALF_LEN
  const R = CABIN_INNER_R
  const windowHalf = 0.95
  const windowGap = 1.15

  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[
            R,
            R,
            L * 2,
            32,
            1,
            true,
            Math.PI / 2 + windowGap / 2,
            Math.PI * 2 - windowGap,
          ]}
        />
        <meshStandardMaterial
          color={CREAM}
          roughness={0.72}
          metalness={0.08}
          side={DoubleSide}
        />
      </mesh>

      {[-0.55, 0.55].map((y) => (
        <mesh key={y} position={[0, y, -R + 0.04]}>
          <boxGeometry args={[L * 1.6, 0.42, 0.03]} />
          <meshStandardMaterial
            color={ALU}
            metalness={0.72}
            roughness={0.28}
          />
        </mesh>
      ))}

      <mesh position={[L - 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[R - 0.02, 28]} />
        <meshStandardMaterial
          color={CREAM_DARK}
          roughness={0.68}
          metalness={0.12}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[-L + 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[R - 0.02, 28]} />
        <meshStandardMaterial
          color={CREAM}
          roughness={0.65}
          metalness={0.1}
          side={DoubleSide}
        />
      </mesh>

      {[-0.55, 0, 0.55].map((y) => (
        <mesh key={`led-${y}`} position={[-L + 0.08, y, 0]}>
          <boxGeometry args={[0.04, 0.7, 1.6]} />
          <meshStandardMaterial
            color={CABIN_LED}
            emissive={CABIN_LED}
            emissiveIntensity={1.4}
            roughness={0.4}
          />
        </mesh>
      ))}

      <mesh position={[0, 0, R - 0.05]}>
        <planeGeometry args={[2.15, windowHalf * 2]} />
        <meshPhysicalMaterial
          color="#9fd4ff"
          transparent
          opacity={0.14}
          roughness={0.04}
          metalness={0.05}
          transmission={0.72}
          thickness={0.04}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, R - 0.08]}>
        <torusGeometry args={[1.12, 0.045, 8, 28]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.28} />
      </mesh>

      <Hatch x={L - 0.04} telemetryRef={telemetryRef} hub={false} />
      <Hatch x={-L + 0.04} telemetryRef={telemetryRef} hub />

      <Seat y={-0.48} />
      <Seat y={0.48} />

      <Handrail from={[-0.9, -1.22, 0.4]} to={[0.9, -1.22, 0.4]} />
      <Handrail from={[-0.9, 1.22, 0.4]} to={[0.9, 1.22, 0.4]} />
      <Handrail from={[-0.9, -1.22, -0.5]} to={[0.9, -1.22, -0.5]} />
      <Handrail from={[-0.9, 1.22, -0.5]} to={[0.9, 1.22, -0.5]} />

      <pointLight
        position={[-1.05, 0, 0]}
        color={CABIN_LED}
        intensity={5.5}
        distance={6}
      />
      <pointLight
        position={[0.3, 0, 0.9]}
        color="#4fd4ff"
        intensity={2.2}
        distance={4.5}
      />
      <spotLight
        position={[0.15, 0.1, 3.2]}
        angle={0.52}
        penumbra={0.12}
        intensity={55}
        color="#ffe6c4"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <TelemetryScreen telemetryRef={telemetryRef} />

      {fpv && <CabinFPVCamera telemetryRef={telemetryRef} />}
    </group>
  )
}
