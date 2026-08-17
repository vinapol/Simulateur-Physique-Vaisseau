import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import {
  AdditiveBlending,
  DoubleSide,
  Quaternion,
  Vector3,
} from 'three'
import type { Group } from 'three'
import { CABLE } from './constants'

export type XYZ = [number, number, number]

export function ZCyl({
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

export function Cable({
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

export function PlasmaPlume({
  thrust,
  exitZ,
  core = '#e8d7ff',
  mid = '#7c5cff',
  outer = '#4f6dff',
  lengthScale = 1,
}: {
  thrust: number
  exitZ: number
  core?: string
  mid?: string
  outer?: string
  lengthScale?: number
}) {
  const groupRef = useRef<Group>(null)
  const t = Math.min(Math.max(thrust, 0), 1)
  const length = (6 + t * 22) * lengthScale
  const coreR = (0.45 + t * 0.7) * lengthScale
  const midR = (1.1 + t * 1.4) * lengthScale
  const outerR = (1.9 + t * 2.2) * lengthScale
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
          color={core}
          transparent
          opacity={0.55 * t}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, -1.2 * lengthScale, 0]}>
        <coneGeometry args={[midR, length * 1.15, 18, 1, true]} />
        <meshBasicMaterial
          color={mid}
          transparent
          opacity={0.32 * t}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, -2.4 * lengthScale, 0]}>
        <coneGeometry args={[outerR, length * 1.3, 20, 1, true]} />
        <meshBasicMaterial
          color={outer}
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
