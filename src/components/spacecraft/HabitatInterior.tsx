import { PointerLockControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import {
  CanvasTexture,
  DoubleSide,
  Matrix4,
  Vector3,
  type Group,
} from 'three'
import {
  METAL,
  METAL_DARK,
  MODULE_LENGTH,
  MODULE_RADIUS,
  RING_RADIUS,
} from './constants'

const RAL9002 = '#e4e2d6'
const RAL9002_DARK = '#cfd0c4'
const ALU = '#b8c0c7'
const TEXTILE = '#8f8b82'
const WARM = '#fff3dd'
const EYE_H = 1.85
const HALF_L = MODULE_LENGTH / 2 - 0.15
const HALF_W = 2.42
const CEIL_H = 2.52
const HATCH_X = 0.12

function floorY(x: number) {
  const r = RING_RADIUS
  const clamped = Math.min(Math.abs(x), r - 0.5)
  return r - Math.sqrt(r * r - clamped * clamped)
}

function inBounds(x: number, z: number) {
  const inRoomA = x >= -HALF_L && x <= -HATCH_X && Math.abs(z) <= HALF_W
  const inHatch = Math.abs(x) <= 0.55 && Math.abs(z) <= 0.72
  const inRoomB = x >= HATCH_X && x <= HALF_L && Math.abs(z) <= HALF_W
  const inEndLock = x >= HALF_L - 0.05 && x <= HALF_L + 2.15 && Math.abs(z) <= 0.78
  const inNext = x >= HALF_L + 2.0 && x <= HALF_L + 8.6 && Math.abs(z) <= HALF_W
  return inRoomA || inHatch || inRoomB || inEndLock || inNext
}

function FloorTiles() {
  const n = 12
  const span = MODULE_LENGTH
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const x = -span / 2 + (i + 0.5) * (span / n)
        const ang = -x / RING_RADIUS
        return (
          <group key={i} position={[x, floorY(x), 0]} rotation={[0, 0, ang]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[span / n + 0.03, HALF_W * 2 + 0.08]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#c8cbc3' : '#bec1b9'}
                roughness={0.84}
                metalness={0.06}
              />
            </mesh>
            {[-1.2, 0, 1.2].map((z) => (
              <mesh key={z} position={[0, 0.012, z]} receiveShadow>
                <boxGeometry args={[span / n - 0.04, 0.02, 0.08]} />
                <meshStandardMaterial
                  color={METAL_DARK}
                  metalness={0.65}
                  roughness={0.35}
                />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

function OvalHatch({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh scale={[1, 1.32, 1]}>
        <torusGeometry args={[0.62, 0.07, 10, 24]} />
        <meshStandardMaterial color={ALU} metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh scale={[1, 1.32, 1]} position={[0, 0, -0.04]}>
        <circleGeometry args={[0.58, 24]} />
        <meshStandardMaterial
          color="#121820"
          metalness={0.3}
          roughness={0.45}
        />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.62, Math.sin(a) * 0.82, 0.02]}
          >
            <boxGeometry args={[0.07, 0.07, 0.05]} />
            <meshStandardMaterial
              color={METAL_DARK}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Workstation({
  position,
  yaw = 0,
  texture,
}: {
  position: [number, number, number]
  yaw?: number
  texture: CanvasTexture
}) {
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.78, -0.72]} castShadow>
        <boxGeometry args={[1.35, 0.08, 0.55]} />
        <meshStandardMaterial color={ALU} metalness={0.62} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.35, -0.88]} rotation={[0.18, 0, 0]}>
        <planeGeometry args={[1.22, 0.62]} />
        <meshStandardMaterial
          map={texture}
          emissive="#0e7490"
          emissiveIntensity={0.28}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 0.48, -0.35]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.08, 16]} />
        <meshStandardMaterial color="#3a414c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.92, -0.32]} castShadow>
        <boxGeometry args={[0.42, 0.08, 0.42]} />
        <meshStandardMaterial color="#3a414c" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.18, -0.42]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.42, 0.07]} />
        <meshStandardMaterial color="#3a414c" roughness={0.55} />
      </mesh>
      <pointLight
        position={[0, 1.2, -0.5]}
        color="#5eead4"
        intensity={1.4}
        distance={3.2}
      />
    </group>
  )
}

function Bike({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.32, 0.035, 8, 18]} />
        <meshStandardMaterial color="#2a2e34" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.78, 0.02]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.7]} />
        <meshStandardMaterial color={METAL} metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.05, -0.12]}>
        <boxGeometry args={[0.28, 0.08, 0.22]} />
        <meshStandardMaterial color="#3a414c" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.18, 0.28]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.28} />
      </mesh>
    </group>
  )
}

function Lockers({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-0.38, 0.38].map((x) =>
        [0, 1, 2].map((row) => (
          <group key={`${x}-${row}`} position={[x, 0.42 + row * 0.7, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.64, 0.42]} />
              <meshStandardMaterial
                color={RAL9002}
                roughness={0.55}
                metalness={0.12}
              />
            </mesh>
            <mesh position={[0.22, 0, 0.22]}>
              <cylinderGeometry args={[0.04, 0.04, 0.08, 10]} />
              <meshStandardMaterial
                color={ALU}
                metalness={0.8}
                roughness={0.22}
              />
            </mesh>
          </group>
        )),
      )}
    </group>
  )
}

function drawHabScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#071018'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, w - 16, h - 16)
  ctx.fillStyle = '#fbbf24'
  ctx.font = '600 26px DM Sans, sans-serif'
  ctx.fillText('DSTV-80  ·  MODULE HABITABLE', 24, 48)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '18px DM Sans, sans-serif'
  const rows = [
    ['Pesanteur', '1,02 g'],
    ['Rayon', '40,0 m'],
    ['ω', '0,50 rad/s'],
    ['Pression', '101,3 kPa'],
    ['O₂ / N₂', '21 % / 78 %'],
    ['Température', '21,5 °C'],
  ]
  rows.forEach((row, i) => {
    ctx.fillStyle = '#64748b'
    ctx.font = '16px DM Sans, sans-serif'
    ctx.fillText(row[0], 28, 92 + i * 34)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '600 18px DM Sans, sans-serif'
    ctx.fillText(row[1], 280, 92 + i * 34)
  })
}

function HabitatFPS({
  playerRef,
}: {
  playerRef: RefObject<Group | null>
}) {
  const { camera, gl } = useThree()
  const keys = useRef({ f: false, b: false, l: false, r: false })
  const forward = useMemo(() => new Vector3(), [])
  const right = useMemo(() => new Vector3(), [])
  const up = useMemo(() => new Vector3(0, 1, 0), [])
  const inv = useMemo(() => new Matrix4(), [])

  useEffect(() => {
    const setKey = (code: string, v: boolean) => {
      if (code === 'KeyW' || code === 'KeyZ' || code === 'ArrowUp') keys.current.f = v
      if (code === 'KeyS' || code === 'ArrowDown') keys.current.b = v
      if (code === 'KeyA' || code === 'KeyQ' || code === 'ArrowLeft') keys.current.l = v
      if (code === 'KeyD' || code === 'ArrowRight') keys.current.r = v
    }
    const down = (e: KeyboardEvent) => setKey(e.code, true)
    const upEvt = (e: KeyboardEvent) => setKey(e.code, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', upEvt)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', upEvt)
    }
  }, [])

  useFrame((_, dt) => {
    const player = playerRef.current
    if (!player?.parent) return
    const parent = player.parent
    inv.copy(parent.matrixWorld).invert()
    camera.getWorldDirection(forward)
    forward.transformDirection(inv)
    forward.y = 0
    if (forward.lengthSq() < 1e-6) forward.set(1, 0, 0)
    else forward.normalize()
    right.crossVectors(forward, up).normalize()

    const speed = 2.6
    let dx = 0
    let dz = 0
    const k = keys.current
    if (k.f) {
      dx += forward.x
      dz += forward.z
    }
    if (k.b) {
      dx -= forward.x
      dz -= forward.z
    }
    if (k.r) {
      dx += right.x
      dz += right.z
    }
    if (k.l) {
      dx -= right.x
      dz -= right.z
    }
    const len = Math.hypot(dx, dz)
    if (len > 0) {
      const s = (speed * dt) / len
      const nx = player.position.x + dx * s
      const nz = player.position.z + dz * s
      if (inBounds(nx, nz)) {
        player.position.x = nx
        player.position.z = nz
      } else if (inBounds(nx, player.position.z)) {
        player.position.x = nx
      } else if (inBounds(player.position.x, nz)) {
        player.position.z = nz
      }
    }
    player.position.y =
      player.position.x < HALF_L + 2.2 ? floorY(player.position.x) : 0
  })

  return (
    <group ref={playerRef} position={[-3.2, 0, 0.4]}>
      <PerspectiveCamera
        makeDefault
        fov={68}
        near={0.06}
        far={1800}
        position={[0, EYE_H, 0]}
      />
      <PointerLockControls domElement={gl.domElement} />
    </group>
  )
}

function WallWithHatch({
  x,
  facing,
}: {
  x: number
  facing: number
}) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, CEIL_H / 2, 1.58]}>
        <boxGeometry args={[0.1, CEIL_H, 1.72]} />
        <meshStandardMaterial
          color={RAL9002_DARK}
          roughness={0.62}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, CEIL_H / 2, -1.58]}>
        <boxGeometry args={[0.1, CEIL_H, 1.72]} />
        <meshStandardMaterial
          color={RAL9002_DARK}
          roughness={0.62}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 2.22, 0]}>
        <boxGeometry args={[0.1, 0.6, 1.48]} />
        <meshStandardMaterial
          color={RAL9002_DARK}
          roughness={0.62}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.1, 0.44, 1.48]} />
        <meshStandardMaterial
          color={RAL9002_DARK}
          roughness={0.62}
          metalness={0.1}
        />
      </mesh>
      <OvalHatch
        position={[facing * 0.06, 1.15, 0]}
        rotation={[0, facing > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
      />
    </group>
  )
}

function CeilingPanels() {
  const wx = -2.1
  const wr = 0.9
  const leftW = wx - wr - -HALF_L
  const rightW = HALF_L - (wx + wr)
  return (
    <group>
      <mesh
        position={[-HALF_L + leftW / 2, CEIL_H, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[leftW, HALF_W * 2 + 0.1]} />
        <meshStandardMaterial color={RAL9002} roughness={0.7} metalness={0.08} />
      </mesh>
      <mesh
        position={[wx + wr + rightW / 2, CEIL_H, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[rightW, HALF_W * 2 + 0.1]} />
        <meshStandardMaterial color={RAL9002} roughness={0.7} metalness={0.08} />
      </mesh>
      <mesh
        position={[wx, CEIL_H, (HALF_W + wr) / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[wr * 2, HALF_W - wr]} />
        <meshStandardMaterial color={RAL9002} roughness={0.7} metalness={0.08} />
      </mesh>
      <mesh
        position={[wx, CEIL_H, -(HALF_W + wr) / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[wr * 2, HALF_W - wr]} />
        <meshStandardMaterial color={RAL9002} roughness={0.7} metalness={0.08} />
      </mesh>
    </group>
  )
}

export function HabitatInterior() {
  const playerRef = useRef<Group>(null)
  const { canvas, texture, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 320
    const ctx = canvas.getContext('2d')
    const texture = new CanvasTexture(canvas)
    if (ctx) drawHabScreen(ctx, canvas.width, canvas.height)
    texture.needsUpdate = true
    return { canvas, texture, ctx }
  }, [])
  void canvas
  void ctx

  const nextOrigin = HALF_L + 5.35

  return (
    <group
      position={[RING_RADIUS + MODULE_RADIUS - 0.18, 0, 0]}
      rotation={[0, 0, -Math.PI / 2]}
    >
      <FloorTiles />
      <CeilingPanels />

      {[-HALF_W, HALF_W].map((z) => (
        <group key={z}>
          <mesh position={[0, CEIL_H / 2, z]} receiveShadow>
            <boxGeometry args={[MODULE_LENGTH, CEIL_H, 0.08]} />
            <meshStandardMaterial
              color={z > 0 ? ALU : RAL9002}
              metalness={z > 0 ? 0.62 : 0.08}
              roughness={z > 0 ? 0.3 : 0.68}
            />
          </mesh>
          <mesh position={[-2.2, 1.35, z + (z > 0 ? -0.06 : 0.06)]}>
            <boxGeometry args={[3.2, 1.1, 0.06]} />
            <meshStandardMaterial
              color={TEXTILE}
              roughness={0.88}
              metalness={0.02}
            />
          </mesh>
        </group>
      ))}

      <WallWithHatch x={-HALF_L} facing={-1} />
      <WallWithHatch x={0} facing={1} />
      <WallWithHatch x={HALF_L} facing={1} />

      {[-1.6, 0, 1.6].map((x) => (
        <mesh key={`led-${x}`} position={[x, CEIL_H - 0.04, 0]}>
          <boxGeometry args={[2.4, 0.05, 0.18]} />
          <meshStandardMaterial
            color={WARM}
            emissive={WARM}
            emissiveIntensity={1.35}
            roughness={0.4}
          />
        </mesh>
      ))}
      <mesh position={[2.4, CEIL_H - 0.12, 0.9]}>
        <boxGeometry args={[3.2, 0.16, 0.22]} />
        <meshStandardMaterial color={ALU} metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[2.4, CEIL_H - 0.12, -0.9]}>
        <boxGeometry args={[3.2, 0.16, 0.22]} />
        <meshStandardMaterial color={ALU} metalness={0.55} roughness={0.35} />
      </mesh>

      <mesh position={[-2.1, CEIL_H - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.88, 28]} />
        <meshStandardMaterial color={ALU} metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[-2.1, CEIL_H + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.64, 28]} />
        <meshPhysicalMaterial
          color="#9fd4ff"
          transparent
          opacity={0.16}
          roughness={0.05}
          metalness={0.04}
          transmission={0.78}
          thickness={0.05}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[1.6, CEIL_H - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.58, 22]} />
        <meshStandardMaterial color={METAL} metalness={0.68} roughness={0.3} />
      </mesh>
      <mesh position={[1.6, CEIL_H + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 22]} />
        <meshStandardMaterial color="#1a222c" metalness={0.35} roughness={0.4} />
      </mesh>

      <Workstation position={[-4.4, floorY(-4.4), -1.15]} texture={texture} />
      <Workstation position={[-2.7, floorY(-2.7), -1.15]} texture={texture} />

      <Bike position={[3.4, floorY(3.4), 1.15]} />
      <Lockers position={[4.6, floorY(4.6), -1.85]} />
      <Lockers position={[2.2, floorY(2.2), -1.85]} />

      <mesh position={[HALF_L + 1.05, 1.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 2.2, 18, 1, true]} />
        <meshStandardMaterial
          color={RAL9002}
          roughness={0.66}
          metalness={0.1}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[HALF_L + 1.05, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 1.6]} />
        <meshStandardMaterial color="#c8cbc3" roughness={0.82} />
      </mesh>
      <OvalHatch
        position={[HALF_L + 2.12, 1.15, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />

      <group position={[nextOrigin, 0, 0]}>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[6.4, HALF_W * 2]} />
          <meshStandardMaterial color="#c2c5bd" roughness={0.84} />
        </mesh>
        <mesh position={[0, CEIL_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.4, HALF_W * 2]} />
          <meshStandardMaterial color={RAL9002} roughness={0.7} side={DoubleSide} />
        </mesh>
        {[-HALF_W, HALF_W].map((z) => (
          <mesh key={z} position={[0, CEIL_H / 2, z]}>
            <boxGeometry args={[6.4, CEIL_H, 0.08]} />
            <meshStandardMaterial color={ALU} metalness={0.55} roughness={0.32} />
          </mesh>
        ))}
        <Lockers position={[-1.4, 0, -1.85]} />
        <Lockers position={[1.4, 0, -1.85]} />
        <mesh position={[0, 0.55, 1.6]} castShadow>
          <boxGeometry args={[1.9, 0.45, 0.7]} />
          <meshStandardMaterial color={TEXTILE} roughness={0.86} />
        </mesh>
        <mesh position={[0, CEIL_H - 0.04, 0]}>
          <boxGeometry args={[3.2, 0.05, 0.18]} />
          <meshStandardMaterial
            color={WARM}
            emissive={WARM}
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      <pointLight
        position={[0, CEIL_H - 0.3, 0]}
        color={WARM}
        intensity={6.5}
        distance={14}
      />
      <pointLight
        position={[-3.5, 1.4, -1]}
        color="#5eead4"
        intensity={1.8}
        distance={5}
      />
      <pointLight
        position={[3.2, 1.2, 1]}
        color="#fbbf24"
        intensity={1.1}
        distance={4}
      />
      <spotLight
        position={[-2.1, CEIL_H + 2.4, 0]}
        angle={0.45}
        penumbra={0.18}
        intensity={70}
        color="#ffe6c4"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <HabitatFPS playerRef={playerRef} />
    </group>
  )
}
