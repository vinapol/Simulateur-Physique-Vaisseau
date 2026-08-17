import { useMemo } from 'react'
import { DoubleSide, Vector2 } from 'three'
import { useShipConfiguration } from '../../../hooks/useShipConfiguration'
import type { Vec3 } from '../../../types/spacecraft'
import {
  COPPER,
  METAL,
  NOZZLE_LENGTH,
  RADIATOR_SPAN,
  RADIATOR_THICK,
  RADIATOR_WIDTH,
  REACTOR_LENGTH,
  REACTOR_RADIUS,
  SHIELD_LEN,
  TUNGSTEN,
} from '../constants'
import {
  shieldHalfAngleForShip,
  umbraHeightFromApex,
} from '../radiationUmbra'
import { PlasmaPlume, ZCyl } from '../primitives'

const REACTOR_LOCAL_Z = -3.1
const SHIELD_LOCAL_Z = 10.8
const RADIATOR_LOCAL_Z = 2.4
const SHIELD_R_FWD = 2.15

function ShadowShield({ halfAngle }: { halfAngle: number }) {
  const rAft = SHIELD_R_FWD + Math.tan(halfAngle) * SHIELD_LEN
  return (
    <mesh
      key={halfAngle.toFixed(4)}
      position={[0, 0, SHIELD_LOCAL_Z]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <cylinderGeometry args={[SHIELD_R_FWD, rAft, SHIELD_LEN, 28]} />
      <meshStandardMaterial
        color={TUNGSTEN}
        metalness={0.35}
        roughness={0.55}
      />
    </mesh>
  )
}

function RadiationUmbra({
  slotZ,
  halfAngle,
}: {
  slotZ: number
  halfAngle: number
}) {
  const apexLocal = REACTOR_LOCAL_Z
  const apexWorld = slotZ + apexLocal
  const height = umbraHeightFromApex(apexWorld)
  const midLocal = apexLocal + height / 2
  const baseRadius = Math.tan(halfAngle) * height

  return (
    <mesh
      key={halfAngle.toFixed(4)}
      position={[0, 0, midLocal]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
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

function CrossRadiators() {
  const inner = 4.2
  const length = RADIATOR_SPAN - inner
  const mid = inner + length / 2
  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2
        return (
          <group key={i} rotation={[0, 0, a]}>
            <mesh position={[mid, 0, RADIATOR_LOCAL_Z]}>
              <boxGeometry args={[length, RADIATOR_WIDTH, RADIATOR_THICK]} />
              <meshStandardMaterial
                color="#1a1d24"
                metalness={0.25}
                roughness={0.7}
              />
            </mesh>
            {Array.from({ length: 7 }, (_, k) => {
              const y =
                -RADIATOR_WIDTH / 2 +
                0.6 +
                k * ((RADIATOR_WIDTH - 1.2) / 6)
              return (
                <mesh key={k} position={[mid, y, RADIATOR_LOCAL_Z + 0.09]}>
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

function RegenerativeNozzle({ thrust }: { thrust: number }) {
  const t = Math.min(Math.max(thrust, 0), 1)
  const throatZ = REACTOR_LOCAL_Z - REACTOR_LENGTH / 2
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
        position={[0, 0, REACTOR_LOCAL_Z]}
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
              REACTOR_LOCAL_Z,
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

export function NTPPropulsionModule({
  slotPosition,
}: {
  slotPosition: Vec3
}) {
  const { thrust, showShield, spineSlots, podCount } = useShipConfiguration()
  const apexWorldZ = slotPosition[2] + REACTOR_LOCAL_Z
  const halfAngle = shieldHalfAngleForShip(spineSlots, apexWorldZ, podCount)
  return (
    <group position={slotPosition}>
      <ShadowShield halfAngle={halfAngle} />
      {showShield && (
        <RadiationUmbra slotZ={slotPosition[2]} halfAngle={halfAngle} />
      )}
      <CrossRadiators />
      <RegenerativeNozzle thrust={thrust} />
      <mesh position={[0, 0, SHIELD_LOCAL_Z + SHIELD_LEN / 2 + 0.4]}>
        <torusGeometry args={[2.4, 0.12, 8, 20]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}
