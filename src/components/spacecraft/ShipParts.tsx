import { useMemo } from 'react'
import {
  CatmullRomCurve3,
  DoubleSide,
  EllipseCurve,
  Vector2,
  Vector3,
} from 'three'
import {
  COLLAR_RADIUS,
  COLLAR_Z,
  COPPER,
  CORRIDOR_RADIUS,
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
  RING_RADIUS,
  WINDOW,
  WINDOW_GLOW,
} from './constants'
import { Cable, ZCyl, type XYZ } from './primitives'

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

export function MagneticStator() {
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

export function CentrifugeRing() {
  return (
    <group>
      <MagneticRotor />
      {Array.from({ length: MODULE_COUNT }, (_, i) => (
        <HabitatModule
          key={i}
          theta={(i / MODULE_COUNT) * Math.PI * 2}
          elevatorBay={i === 0}
        />
      ))}
      <PressurizedCorridors />
      <TensionCables />
    </group>
  )
}
