import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Ref } from 'react'
import type { Group, MeshStandardMaterial } from 'three'
import {
  CABLE,
  CABIN_HALF_LEN,
  CABIN_OUTER_R,
  ELEVATOR_PAUSE_S,
  ELEVATOR_R_HUB,
  ELEVATOR_R_RING,
  ELEVATOR_RAIL_RADIUS,
  ELEVATOR_RAIL_Z,
  ELEVATOR_THETA,
  ELEVATOR_TRAVEL_S,
  HUB_ROTOR_RADIUS,
  HULL,
  HULL_DARK,
  METAL,
  MODULE_RADIUS,
  RING_RADIUS,
} from './constants'

function setLamp(mat: MeshStandardMaterial | null, on: boolean) {
  if (!mat) return
  mat.color.set(on ? '#7dffa1' : '#ff5a5a')
  mat.emissive.set(on ? '#3dff88' : '#ff2a2a')
  mat.emissiveIntensity = on ? 1.85 : 1.05
}

function Lamp({
  position,
  matRef,
}: {
  position: [number, number, number]
  matRef: Ref<MeshStandardMaterial>
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.11, 12, 10]} />
      <meshStandardMaterial
        ref={matRef}
        color="#ff5a5a"
        emissive="#ff2a2a"
        emissiveIntensity={1.05}
        roughness={0.25}
        metalness={0.1}
      />
    </mesh>
  )
}

function GuideRails() {
  const r0 = ELEVATOR_R_HUB - 0.45
  const r1 = ELEVATOR_R_RING + 0.55
  const length = r1 - r0
  const mid = (r0 + r1) / 2
  return (
    <group>
      {[-ELEVATOR_RAIL_Z, ELEVATOR_RAIL_Z].map((z) => (
        <group key={z}>
          <mesh position={[mid, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[ELEVATOR_RAIL_RADIUS, ELEVATOR_RAIL_RADIUS, length, 10]}
            />
            <meshStandardMaterial
              color="#1c1b1a"
              metalness={0.42}
              roughness={0.48}
            />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => {
            const x = r0 + ((i + 0.5) / 9) * length
            return (
              <mesh
                key={i}
                position={[x, 0, z]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry
                  args={[
                    ELEVATOR_RAIL_RADIUS + 0.025,
                    ELEVATOR_RAIL_RADIUS + 0.025,
                    0.22,
                    8,
                  ]}
                />
                <meshStandardMaterial
                  color="#8a6a28"
                  metalness={0.65}
                  roughness={0.35}
                />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

function HubReceptionAirlock() {
  const x = HUB_ROTOR_RADIUS + 0.85
  return (
    <group>
      <mesh position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.35, 1.48, 1.9, 22]} />
        <meshStandardMaterial color={HULL} metalness={0.5} roughness={0.34} />
      </mesh>
      <mesh position={[x + 0.92, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.12, 0.09, 8, 24]} />
        <meshStandardMaterial color={METAL} metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[x + 0.98, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.95, 22]} />
        <meshStandardMaterial color="#0e141c" metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  )
}

function ModuleBayMarker() {
  const x = RING_RADIUS - MODULE_RADIUS - 0.2
  return (
    <group>
      <mesh position={[x - 1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.42, 1.55, 1.05, 22]} />
        <meshStandardMaterial
          color="#c45a1a"
          metalness={0.35}
          roughness={0.46}
        />
      </mesh>
      <mesh position={[x - 1.62, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.22, 0.09, 8, 24]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[x - 0.55, 0, 1.35]}>
        <boxGeometry args={[0.55, 1.9, 0.08]} />
        <meshStandardMaterial
          color="#e8c547"
          emissive="#c9a227"
          emissiveIntensity={0.22}
        />
      </mesh>
    </group>
  )
}

function ElevatorCabinShell() {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[CABIN_OUTER_R, CABIN_OUTER_R, CABIN_HALF_LEN * 2, 24]}
        />
        <meshStandardMaterial
          color={HULL}
          metalness={0.58}
          roughness={0.32}
        />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[CABIN_OUTER_R + 0.02, CABIN_OUTER_R + 0.02, 0.22, 24]} />
        <meshStandardMaterial
          color={HULL_DARK}
          metalness={0.55}
          roughness={0.36}
        />
      </mesh>
      <mesh position={[0, 0, CABIN_OUTER_R - 0.02]}>
        <circleGeometry args={[0.55, 20]} />
        <meshStandardMaterial
          color="#16324a"
          emissive="#5ec8ff"
          emissiveIntensity={0.45}
          roughness={0.12}
        />
      </mesh>
      {[-ELEVATOR_RAIL_Z, ELEVATOR_RAIL_Z].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <boxGeometry args={[0.9, 0.32, 0.26]} />
          <meshStandardMaterial color={CABLE} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

export function TransferElevator({
  auto,
  manualPosition,
  onPositionChange,
}: {
  auto: boolean
  manualPosition: number
  onPositionChange: (position: number) => void
}) {
  const cabinRef = useRef<Group>(null)
  const pRef = useRef(0)
  const dirRef = useRef(1)
  const dwellRef = useRef(0.8)
  const uiAccRef = useRef(0)
  const autoRef = useRef(auto)
  const manualRef = useRef(manualPosition)
  const hubA = useRef<MeshStandardMaterial>(null)
  const hubB = useRef<MeshStandardMaterial>(null)
  const ringA = useRef<MeshStandardMaterial>(null)
  const ringB = useRef<MeshStandardMaterial>(null)
  autoRef.current = auto
  manualRef.current = manualPosition

  useFrame((_, dt) => {
    if (autoRef.current) {
      if (dwellRef.current > 0) {
        dwellRef.current -= dt
      } else {
        const p = pRef.current
        const ease =
          0.22 + 0.78 * Math.sin(Math.PI * Math.min(0.999, Math.max(0.001, p)))
        pRef.current = p + dirRef.current * (dt / ELEVATOR_TRAVEL_S) * ease * 1.2
        if (pRef.current >= 1) {
          pRef.current = 1
          dirRef.current = -1
          dwellRef.current = ELEVATOR_PAUSE_S
        } else if (pRef.current <= 0) {
          pRef.current = 0
          dirRef.current = 1
          dwellRef.current = ELEVATOR_PAUSE_S
        }
      }
    } else {
      const target = Math.min(1, Math.max(0, manualRef.current))
      pRef.current += (target - pRef.current) * Math.min(1, dt * 5)
    }

    const p = pRef.current
    const r = ELEVATOR_R_RING + (ELEVATOR_R_HUB - ELEVATOR_R_RING) * p
    const cabin = cabinRef.current
    if (cabin) cabin.position.x = r

    setLamp(hubA.current, p > 0.92)
    setLamp(hubB.current, p > 0.92)
    setLamp(ringA.current, p < 0.08)
    setLamp(ringB.current, p < 0.08)

    if (autoRef.current) {
      uiAccRef.current += dt
      if (uiAccRef.current >= 0.08) {
        uiAccRef.current = 0
        onPositionChange(p)
      }
    }
  })

  const hubLampX = HUB_ROTOR_RADIUS + 1.15
  const ringLampX = RING_RADIUS - MODULE_RADIUS - 2.15

  return (
    <group rotation={[0, 0, ELEVATOR_THETA]}>
      <GuideRails />
      <HubReceptionAirlock />
      <ModuleBayMarker />
      <Lamp position={[hubLampX, 0.95, 0.7]} matRef={hubA} />
      <Lamp position={[hubLampX, -0.95, 0.7]} matRef={hubB} />
      <Lamp position={[ringLampX, 0.7, 0.85]} matRef={ringA} />
      <Lamp position={[ringLampX, -0.7, 0.85]} matRef={ringB} />
      <group ref={cabinRef} position={[ELEVATOR_R_RING, 0, 0]}>
        <ElevatorCabinShell />
      </group>
    </group>
  )
}
