import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CatmullRomCurve3,
  DoubleSide,
  EllipseCurve,
  Quaternion,
  Vector2,
  Vector3,
} from 'three'
import type { Group } from 'three'
import {
  AIRLOCK_LENGTH,
  AIRLOCK_RADIUS,
  AIRLOCK_Z,
  CABLE,
  COLLAR_RADIUS,
  COLLAR_Z,
  COPPER,
  CORRIDOR_RADIUS,
  DOCKING_Z,
  GOLD_MLI,
  GOLD_SEAM,
  HUB_LENGTH,
  HUB_ROTOR_RADIUS,
  HUB_STATOR_RADIUS,
  HULL,
  HULL_DARK,
  METAL,
  METAL_DARK,
  MODULE_COUNT,
  MODULE_LENGTH,
  MODULE_RADIUS,
  NOZZLE_LENGTH,
  RADIATOR_SPAN,
  RADIATOR_THICK,
  RADIATOR_WIDTH,
  RADIATOR_Z,
  REACTOR_LENGTH,
  REACTOR_RADIUS,
  REACTOR_Z,
  RING_RADIUS,
  SHIELD_LEN,
  SHIELD_R_AFT,
  SHIELD_R_FWD,
  SHIELD_Z,
  TANK_ANGLES,
  TANK_RADIAL,
  TANK_RADIUS,
  TANK_Z,
  TRUSS_LENGTH,
  TRUSS_RADIUS,
  TUNGSTEN,
  WINDOW,
  WINDOW_GLOW,
  Z_AFT,
  Z_NOSE,
} from './constants'

type XYZ = [number, number, number]

function ZCyl({
  position,
  radius,
  radiusBottom,
  length,
  color,
  metalness = 0.55,
  roughness = 0.4,
  segments = 24,
  emissive,
  emissiveIntensity = 0,
}: {
  position: XYZ
  radius: number
  radiusBottom?: number
  length: number
  color: string
  metalness?: number
  roughness?: number
  segments?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry
        args={[radius, radiusBottom ?? radius, length, segments]}
      />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  )
}

function Cable({
  from,
  to,
  radius = 0.08,
}: {
  from: XYZ
  to: XYZ
  radius?: number
}) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dz = to[2] - from[2]
  const length = Math.hypot(dx, dy, dz)
  if (length < 1e-4) return null
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
      <cylinderGeometry args={[radius, radius, length, 5]} />
      <meshStandardMaterial color={CABLE} metalness={0.4} roughness={0.52} />
    </mesh>
  )
}

function IdssDockingPort() {
  const z = DOCKING_Z
  return (
    <group>
      <ZCyl
        position={[0, 0, z - 0.55]}
        radius={1.15}
        length={1.4}
        color={HULL}
        metalness={0.45}
        roughness={0.38}
      />
      <mesh position={[0, 0, z + 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.11, 10, 28]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, z + 0.42]}>
        <circleGeometry args={[0.72, 24]} />
        <meshStandardMaterial
          color="#0c1118"
          metalness={0.2}
          roughness={0.55}
        />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i * 2 * Math.PI) / 3
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 1.12, Math.sin(a) * 1.12, z + 0.55]}
            rotation={[Math.PI / 2, 0, a]}
          >
            <coneGeometry args={[0.22, 0.62, 3]} />
            <meshStandardMaterial
              color={HULL_DARK}
              metalness={0.55}
              roughness={0.35}
            />
          </mesh>
        )
      })}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4
        return (
          <mesh
            key={`pin-${i}`}
            position={[Math.cos(a) * 0.9, Math.sin(a) * 0.9, z + 0.38]}
          >
            <boxGeometry args={[0.08, 0.08, 0.28]} />
            <meshStandardMaterial
              color="#c9a227"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function ZeroGAirlock() {
  const z = AIRLOCK_Z
  return (
    <group>
      <ZCyl
        position={[0, 0, z]}
        radius={AIRLOCK_RADIUS}
        length={AIRLOCK_LENGTH}
        color={HULL}
        metalness={0.42}
        roughness={0.4}
        segments={28}
      />
      <ZCyl
        position={[0, 0, z]}
        radius={AIRLOCK_RADIUS + 0.06}
        length={0.55}
        color="#c45a1a"
        metalness={0.3}
        roughness={0.5}
      />
      {[-2.4, 2.4].map((dz) => (
        <group key={dz} position={[0, AIRLOCK_RADIUS - 0.08, z + dz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.48, 20]} />
            <meshStandardMaterial
              color={WINDOW}
              emissive={WINDOW_GLOW}
              emissiveIntensity={0.35}
              metalness={0.1}
              roughness={0.15}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <torusGeometry args={[0.5, 0.05, 8, 20]} />
            <meshStandardMaterial
              color={METAL_DARK}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[AIRLOCK_RADIUS + 0.12, 0, z]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.12, AIRLOCK_LENGTH * 0.7]} />
        <meshStandardMaterial color="#c45a1a" roughness={0.5} />
      </mesh>
    </group>
  )
}

function CentralTruss() {
  const rings = 13
  return (
    <group>
      <ZCyl
        position={[0, 0, 0]}
        radius={TRUSS_RADIUS}
        length={TRUSS_LENGTH}
        color={METAL}
        metalness={0.72}
        roughness={0.32}
        segments={16}
      />
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4
        return (
          <ZCyl
            key={i}
            position={[Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0]}
            radius={0.12}
            length={TRUSS_LENGTH - 4}
            color={METAL_DARK}
            metalness={0.65}
            roughness={0.38}
            segments={8}
          />
        )
      })}
      {Array.from({ length: rings }, (_, i) => {
        const z = Z_AFT + 4 + (i * (TRUSS_LENGTH - 8)) / (rings - 1)
        return (
          <mesh key={i} position={[0, 0, z]}>
            <torusGeometry args={[1.38, 0.1, 8, 18]} />
            <meshStandardMaterial
              color={HULL_DARK}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function MagneticStator() {
  return (
    <group>
      <ZCyl
        position={[0, 0, 0]}
        radius={HUB_STATOR_RADIUS}
        length={HUB_LENGTH}
        color={METAL_DARK}
        metalness={0.6}
        roughness={0.35}
        segments={32}
      />
      {Array.from({ length: 10 }, (_, i) => {
        const z = -HUB_LENGTH / 2 + 0.4 + (i * (HUB_LENGTH - 0.8)) / 9
        return (
          <mesh key={i} position={[0, 0, z]}>
            <torusGeometry args={[HUB_STATOR_RADIUS + 0.08, 0.09, 8, 28]} />
            <meshStandardMaterial
              color={COPPER}
              metalness={0.85}
              roughness={0.22}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function HollowZCyl({
  position,
  innerRadius,
  outerRadius,
  length,
  color,
  metalness = 0.55,
  roughness = 0.4,
}: {
  position: XYZ
  innerRadius: number
  outerRadius: number
  length: number
  color: string
  metalness?: number
  roughness?: number
}) {
  const points = useMemo(
    () => [
      new Vector2(innerRadius, -length / 2),
      new Vector2(outerRadius, -length / 2),
      new Vector2(outerRadius, length / 2),
      new Vector2(innerRadius, length / 2),
    ],
    [innerRadius, outerRadius, length],
  )
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <latheGeometry args={[points, 36]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        side={DoubleSide}
      />
    </mesh>
  )
}

function MagneticRotor() {
  return (
    <group>
      <HollowZCyl
        position={[0, 0, 0]}
        innerRadius={HUB_STATOR_RADIUS + 0.28}
        outerRadius={HUB_ROTOR_RADIUS}
        length={HUB_LENGTH + 0.6}
        color={HULL}
        metalness={0.5}
        roughness={0.36}
      />
      <mesh>
        <torusGeometry args={[HUB_ROTOR_RADIUS + 0.15, 0.22, 10, 40]} />
        <meshStandardMaterial color={METAL} metalness={0.75} roughness={0.28} />
      </mesh>
      {[-COLLAR_Z, COLLAR_Z].map((z) => (
        <group key={z}>
          <ZCyl
            position={[0, 0, z]}
            radius={COLLAR_RADIUS}
            length={1.8}
            color={HULL_DARK}
            metalness={0.62}
            roughness={0.32}
          />
          <mesh position={[0, 0, z]}>
            <torusGeometry args={[COLLAR_RADIUS + 0.2, 0.16, 8, 24]} />
            <meshStandardMaterial
              color={METAL}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Lh2Tanks() {
  return (
    <group>
      {TANK_ANGLES.map((theta) => {
        const x = Math.cos(theta) * TANK_RADIAL
        const y = Math.sin(theta) * TANK_RADIAL
        return (
          <group key={theta}>
            <group position={[x, y, TANK_Z]}>
              <mesh>
                <sphereGeometry args={[TANK_RADIUS, 32, 24]} />
                <meshStandardMaterial
                  color={GOLD_MLI}
                  metalness={0.88}
                  roughness={0.3}
                />
              </mesh>
              {[-0.52, 0, 0.52].map((k) => {
                const z = k * TANK_RADIUS
                const ringR = Math.sqrt(
                  Math.max(TANK_RADIUS * TANK_RADIUS - z * z, 0.2),
                )
                return (
                  <mesh key={k} position={[0, 0, z]}>
                    <torusGeometry args={[ringR, 0.07, 6, 28]} />
                    <meshStandardMaterial
                      color={GOLD_SEAM}
                      metalness={0.8}
                      roughness={0.38}
                    />
                  </mesh>
                )
              })}
            </group>
            <Cable
              from={[
                Math.cos(theta) * (TANK_RADIAL - TANK_RADIUS),
                Math.sin(theta) * (TANK_RADIAL - TANK_RADIUS),
                TANK_Z,
              ]}
              to={[
                Math.cos(theta) * (TRUSS_RADIUS + 0.35),
                Math.sin(theta) * (TRUSS_RADIUS + 0.35),
                TANK_Z,
              ]}
              radius={0.2}
            />
          </group>
        )
      })}
    </group>
  )
}

function PhysicalShadowShield() {
  return (
    <mesh position={[0, 0, SHIELD_Z]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry
        args={[SHIELD_R_FWD, SHIELD_R_AFT, SHIELD_LEN, 28]}
      />
      <meshStandardMaterial
        color={TUNGSTEN}
        metalness={0.35}
        roughness={0.55}
      />
    </mesh>
  )
}

function RadiationUmbra() {
  const apexZ = REACTOR_Z
  const baseZ = Z_NOSE - 4
  const height = baseZ - apexZ
  const midZ = (apexZ + baseZ) / 2
  const coverRadius = RING_RADIUS + MODULE_RADIUS + 2
  const baseRadius = (coverRadius / (0 - apexZ)) * height

  return (
    <mesh position={[0, 0, midZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <coneGeometry args={[baseRadius, height, 40, 1, true]} />
      <meshStandardMaterial
        color="#ffb060"
        transparent
        opacity={0.11}
        side={DoubleSide}
        depthWrite={false}
        metalness={0}
        roughness={1}
        emissive="#ff8a2a"
        emissiveIntensity={0.08}
      />
    </mesh>
  )
}

function Radiators() {
  const inner = 4.2
  const length = RADIATOR_SPAN - inner
  const mid = inner + length / 2
  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2
        return (
          <group key={i} rotation={[0, 0, a]}>
            <mesh position={[mid, 0, RADIATOR_Z]}>
              <boxGeometry args={[length, RADIATOR_WIDTH, RADIATOR_THICK]} />
              <meshStandardMaterial
                color="#1a1d24"
                metalness={0.25}
                roughness={0.7}
              />
            </mesh>
            {Array.from({ length: 7 }, (_, k) => {
              const y = -RADIATOR_WIDTH / 2 + 0.6 + k * ((RADIATOR_WIDTH - 1.2) / 6)
              return (
                <mesh key={k} position={[mid, y, RADIATOR_Z + 0.09]}>
                  <boxGeometry args={[length * 0.92, 0.07, 0.04]} />
                  <meshStandardMaterial
                    color="#cfd6de"
                    metalness={0.7}
                    roughness={0.25}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

function PlasmaPlume({ thrust, exitZ }: { thrust: number; exitZ: number }) {
  const groupRef = useRef<Group>(null)
  const t = Math.min(Math.max(thrust, 0), 1)
  const length = 6 + t * 22
  const coreR = 0.45 + t * 0.7
  const midR = 1.1 + t * 1.4
  const outerR = 1.9 + t * 2.2
  const z = exitZ - length / 2

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    group.visible = t > 0.02
    if (t <= 0.02) return
    const flicker = 0.9 + Math.sin(clock.elapsedTime * 41) * 0.08
    group.scale.set(1, flicker, 1)
  })

  return (
    <group
      ref={groupRef}
      position={[0, 0, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={t > 0.02}
    >
      <mesh>
        <coneGeometry args={[coreR, length, 16, 1, true]} />
        <meshBasicMaterial
          color="#e8d7ff"
          transparent
          opacity={0.55 * t}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, -1.2, 0]}>
        <coneGeometry args={[midR, length * 1.15, 18, 1, true]} />
        <meshBasicMaterial
          color="#7c5cff"
          transparent
          opacity={0.32 * t}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, -2.4, 0]}>
        <coneGeometry args={[outerR, length * 1.3, 20, 1, true]} />
        <meshBasicMaterial
          color="#4f6dff"
          transparent
          opacity={0.18 * t}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}

function NuclearEngine({ thrust }: { thrust: number }) {
  const t = Math.min(Math.max(thrust, 0), 1)
  const throatZ = REACTOR_Z - REACTOR_LENGTH / 2
  const exitZ = throatZ - NOZZLE_LENGTH
  const bell = useMemo(() => {
    const pts: Vector2[] = []
    for (let i = 0; i <= 18; i++) {
      const u = i / 18
      const r = 1.15 + u * u * 2.55
      pts.push(new Vector2(r, u * NOZZLE_LENGTH))
    }
    return pts
  }, [])

  return (
    <group>
      <ZCyl
        position={[0, 0, REACTOR_Z]}
        radius={REACTOR_RADIUS}
        length={REACTOR_LENGTH}
        color="#3a3f48"
        metalness={0.55}
        roughness={0.38}
        emissive="#6b3cff"
        emissiveIntensity={t * 0.45}
      />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <ZCyl
            key={i}
            position={[
              Math.cos(a) * (REACTOR_RADIUS + 0.55),
              Math.sin(a) * (REACTOR_RADIUS + 0.55),
              REACTOR_Z,
            ]}
            radius={0.38}
            length={REACTOR_LENGTH * 0.82}
            color={COPPER}
            metalness={0.7}
            roughness={0.3}
            segments={10}
          />
        )
      })}
      <mesh position={[0, 0, throatZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <latheGeometry args={[bell, 28]} />
        <meshStandardMaterial
          color="#5c6570"
          metalness={0.72}
          roughness={0.28}
          emissive="#5a3cff"
          emissiveIntensity={t * 0.55}
          side={DoubleSide}
        />
      </mesh>
      <pointLight
        position={[0, 0, exitZ - 4]}
        color="#8a6bff"
        intensity={t * 42}
        distance={90}
      />
      <PlasmaPlume thrust={t} exitZ={exitZ} />
    </group>
  )
}

function HabitatModule({
  theta,
  elevatorBay = false,
}: {
  theta: number
  elevatorBay?: boolean
}) {
  const portholes = [-4.2, -1.4, 1.4, 4.2]
  return (
    <group
      position={[Math.cos(theta) * RING_RADIUS, Math.sin(theta) * RING_RADIUS, 0]}
      rotation={[0, 0, theta]}
    >
      <mesh>
        <cylinderGeometry
          args={[MODULE_RADIUS, MODULE_RADIUS, MODULE_LENGTH, 28]}
        />
        <meshStandardMaterial
          color={HULL}
          metalness={0.4}
          roughness={0.42}
        />
      </mesh>
      <mesh>
        <cylinderGeometry
          args={[MODULE_RADIUS + 0.05, MODULE_RADIUS + 0.05, 0.45, 28]}
        />
        <meshStandardMaterial color="#c45a1a" roughness={0.48} />
      </mesh>
      <mesh position={[-(MODULE_RADIUS + 1.15), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.05, 1.05, 2.3, 18]} />
        <meshStandardMaterial
          color={HULL_DARK}
          metalness={0.45}
          roughness={0.38}
        />
      </mesh>
      <mesh
        position={[-(MODULE_RADIUS + 2.25), 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <circleGeometry args={[0.72, 20]} />
        <meshStandardMaterial color="#10151c" metalness={0.2} roughness={0.5} />
      </mesh>
      {portholes.map((y) => (
        <group key={y} position={[-MODULE_RADIUS + 0.04, y, 0]}>
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.42, 16]} />
            <meshStandardMaterial
              color={WINDOW}
              emissive={WINDOW_GLOW}
              emissiveIntensity={0.4}
              roughness={0.12}
            />
          </mesh>
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <torusGeometry args={[0.44, 0.045, 8, 16]} />
            <meshStandardMaterial
              color={METAL_DARK}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
      {elevatorBay && (
        <mesh position={[-(MODULE_RADIUS + 0.55), 0, 1.05]}>
          <boxGeometry args={[0.12, 2.2, 0.12]} />
          <meshStandardMaterial
            color="#e8c547"
            emissive="#c9a227"
            emissiveIntensity={0.35}
          />
        </mesh>
      )}
      <mesh position={[MODULE_RADIUS + 0.08, 0, 0]}>
        <boxGeometry args={[0.1, MODULE_LENGTH * 0.55, 0.12]} />
        <meshStandardMaterial color="#c45a1a" roughness={0.5} />
      </mesh>
    </group>
  )
}

function PressurizedCorridors() {
  const halfAngle = MODULE_LENGTH / 2 / RING_RADIUS
  const geometries = useMemo(() => {
    return Array.from({ length: MODULE_COUNT }, (_, i) => {
      const theta0 = (i / MODULE_COUNT) * Math.PI * 2 + halfAngle + 0.02
      const theta1 =
        ((i + 1) / MODULE_COUNT) * Math.PI * 2 - halfAngle - 0.02
      const curve = new EllipseCurve(
        0,
        0,
        RING_RADIUS,
        RING_RADIUS,
        theta0,
        theta1,
        false,
        0,
      )
      const points = curve.getSpacedPoints(18).map((p) => new Vector3(p.x, p.y, 0))
      return new CatmullRomCurve3(points)
    })
  }, [halfAngle])

  return (
    <group>
      {geometries.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 18, CORRIDOR_RADIUS, 10, false]} />
          <meshStandardMaterial
            color={HULL}
            metalness={0.38}
            roughness={0.44}
          />
        </mesh>
      ))}
    </group>
  )
}

function TensionCables() {
  const hubR = HUB_ROTOR_RADIUS + 0.2
  const innerR = RING_RADIUS - MODULE_RADIUS - 0.2
  const pairs = useMemo(() => {
    const list: { from: XYZ; to: XYZ; radius?: number }[] = []
    for (let i = 0; i < MODULE_COUNT; i++) {
      const theta = (i / MODULE_COUNT) * Math.PI * 2
      const c = Math.cos(theta)
      const s = Math.sin(theta)
      const mx = c * RING_RADIUS
      const my = s * RING_RADIUS
      if (i !== 0) {
        list.push({
          from: [c * hubR, s * hubR, 1.15],
          to: [c * innerR, s * innerR, 0],
          radius: 0.09,
        })
        list.push({
          from: [c * hubR, s * hubR, -1.15],
          to: [c * innerR, s * innerR, 0],
          radius: 0.09,
        })
      }
      list.push({
        from: [c * COLLAR_RADIUS, s * COLLAR_RADIUS, COLLAR_Z],
        to: [mx, my, 1.6],
        radius: 0.07,
      })
      list.push({
        from: [c * COLLAR_RADIUS, s * COLLAR_RADIUS, -COLLAR_Z],
        to: [mx, my, -1.6],
        radius: 0.07,
      })
      const t2 = ((i + 1) / MODULE_COUNT) * Math.PI * 2
      const outer = RING_RADIUS + MODULE_RADIUS * 0.15
      list.push({
        from: [c * outer, s * outer, 0],
        to: [Math.cos(t2) * outer, Math.sin(t2) * outer, 0],
        radius: 0.06,
      })
    }
    return list
  }, [hubR, innerR])

  return (
    <group>
      {pairs.map((p, i) => (
        <Cable key={i} from={p.from} to={p.to} radius={p.radius} />
      ))}
    </group>
  )
}

export function FixedSpine({
  showShield,
  thrust,
}: {
  showShield: boolean
  thrust: number
}) {
  return (
    <group>
      <CentralTruss />
      <IdssDockingPort />
      <ZeroGAirlock />
      <MagneticStator />
      <Lh2Tanks />
      <PhysicalShadowShield />
      {showShield && <RadiationUmbra />}
      <Radiators />
      <NuclearEngine thrust={thrust} />
      <mesh position={[2.8, 1.1, 27.4]} rotation={[0.15, 0, 0.3]}>
        <cylinderGeometry args={[0.1, 0.1, 2.4, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh position={[2.8, 2.2, 28]} rotation={[0.4, -0.5, 0.2]}>
        <sphereGeometry args={[1.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={HULL}
          metalness={0.55}
          roughness={0.3}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}

export function CentrifugeRing({
  hiddenModules = [],
}: {
  hiddenModules?: number[]
}) {
  return (
    <group>
      <MagneticRotor />
      {Array.from({ length: MODULE_COUNT }, (_, i) =>
        hiddenModules.includes(i) ? null : (
          <HabitatModule
            key={i}
            theta={(i / MODULE_COUNT) * Math.PI * 2}
            elevatorBay={i === 0}
          />
        ),
      )}
      {!hiddenModules.length && <PressurizedCorridors />}
      <TensionCables />
    </group>
  )
}
