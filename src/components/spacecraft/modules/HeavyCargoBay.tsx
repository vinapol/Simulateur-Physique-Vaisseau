import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import { useShipConfiguration } from '../../../hooks/useShipConfiguration'
import { heavyPodLayout } from '../../../physics/spacecraft'
import type { Vec3 } from '../../../types/spacecraft'
import { METAL, METAL_DARK } from '../constants'
import { Cable, ZCyl } from '../primitives'

const RACK_R = 6.4
const RACK_LEN = 28
const POD: Vec3 = [12, 12, 26]

const POD_PBR = {
  color: '#c8ced6',
  metalness: 0.8,
  roughness: 0.3,
  transparent: false,
  opacity: 1,
} as const

function OctagonRack() {
  const n = 8
  return (
    <group>
      {[-12, -4, 4, 12].map((z) => (
        <group key={z} position={[0, 0, z]}>
          {Array.from({ length: n }, (_, i) => {
            const a0 = (i / n) * Math.PI * 2 + Math.PI / n
            const a1 = ((i + 1) / n) * Math.PI * 2 + Math.PI / n
            return (
              <Cable
                key={i}
                from={[Math.cos(a0) * RACK_R, Math.sin(a0) * RACK_R, 0]}
                to={[Math.cos(a1) * RACK_R, Math.sin(a1) * RACK_R, 0]}
                radius={0.14}
              />
            )
          })}
        </group>
      ))}
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + Math.PI / n
        return (
          <ZCyl
            key={i}
            position={[Math.cos(a) * RACK_R, Math.sin(a) * RACK_R, 0]}
            radius={0.16}
            length={RACK_LEN}
            color="#7d838c"
            metalness={0.72}
            roughness={0.32}
            segments={8}
          />
        )
      })}
      <ZCyl
        position={[0, 0, 0]}
        radius={2.35}
        length={9}
        color={METAL_DARK}
        metalness={0.6}
        roughness={0.34}
        segments={16}
      />
    </group>
  )
}

function TwistLock({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.55, 10]} />
        <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.55, 0.18, 0.18]} />
        <meshStandardMaterial color="#e8c547" metalness={0.75} roughness={0.28} />
      </mesh>
    </group>
  )
}

function StatusLed({ position }: { position: Vec3 }) {
  const matRef = useRef<MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    const mat = matRef.current
    if (!mat) return
    mat.emissiveIntensity =
      0.45 + 0.4 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.1))
  })
  return (
    <mesh position={position}>
      <boxGeometry args={[0.28, 0.18, 0.5]} />
      <meshStandardMaterial
        ref={matRef}
        color="#3dff88"
        emissive="#3dff88"
        emissiveIntensity={0.7}
        roughness={0.25}
        transparent={false}
      />
    </mesh>
  )
}

function CargoPod() {
  const [dx, dy, dz] = POD
  return (
    <group>
      <mesh>
        <boxGeometry args={[dx, dy, dz]} />
        <meshStandardMaterial {...POD_PBR} />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sy) =>
          [-1, 1].map((sz) => (
            <mesh
              key={`${sx}${sy}${sz}`}
              position={[(dx / 2) * sx, (dy / 2) * sy, (dz / 2) * sz]}
            >
              <boxGeometry args={[0.22, 0.22, 0.22]} />
              <meshStandardMaterial
                color={METAL}
                metalness={0.8}
                roughness={0.3}
                transparent={false}
              />
            </mesh>
          )),
        ),
      )}
      {[-8, -2.5, 3, 9].map((z) => (
        <mesh key={z} position={[dx / 2 + 0.04, 0, z]}>
          <boxGeometry args={[0.1, dy * 0.88, 0.22]} />
          <meshStandardMaterial {...POD_PBR} color="#9aa3ad" />
        </mesh>
      ))}
      <mesh position={[0, 0, dz / 2 + 0.12]}>
        <boxGeometry args={[dx * 0.72, dy * 0.72, 0.24]} />
        <meshStandardMaterial {...POD_PBR} color="#a8b0b8" />
      </mesh>
      <StatusLed position={[dx / 2 + 0.12, 4.6, 11]} />
    </group>
  )
}

export function HeavyCargoBay({ slotPosition }: { slotPosition: Vec3 }) {
  const { podCount } = useShipConfiguration()
  const pods = useMemo(() => heavyPodLayout(podCount), [podCount])

  return (
    <group position={slotPosition}>
      <OctagonRack />
      {pods.map((pod) => (
        <group
          key={pod.angle}
          position={[pod.x, pod.y, pod.z]}
          rotation={[0, 0, pod.angle]}
        >
          <CargoPod />
          <TwistLock position={[-6.15, 3.2, 8]} />
          <TwistLock position={[-6.15, -3.2, 8]} />
          <TwistLock position={[-6.15, 3.2, -8]} />
          <TwistLock position={[-6.15, -3.2, -8]} />
        </group>
      ))}
    </group>
  )
}
