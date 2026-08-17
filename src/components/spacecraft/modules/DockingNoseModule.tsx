import { DoubleSide } from 'three'
import { useShipConfiguration } from '../../../hooks/useShipConfiguration'
import type { Vec3 } from '../../../types/spacecraft'
import {
  AIRLOCK_LENGTH,
  AIRLOCK_RADIUS,
  HULL,
  HULL_DARK,
  METAL,
  METAL_DARK,
  WINDOW,
  WINDOW_GLOW,
} from '../constants'
import { ZCyl } from '../primitives'

const PORT_Z = 4.7
const AIRLOCK_LOCAL_Z = -2.8

function IdssDockingPort() {
  const z = PORT_Z
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
  const z = AIRLOCK_LOCAL_Z
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
      <mesh position={[AIRLOCK_RADIUS + 0.12, 0, z]}>
        <boxGeometry args={[0.08, 0.12, AIRLOCK_LENGTH * 0.7]} />
        <meshStandardMaterial color="#c45a1a" roughness={0.5} />
      </mesh>
    </group>
  )
}

function AvionicsDome() {
  return (
    <group position={[0, AIRLOCK_RADIUS + 0.35, AIRLOCK_LOCAL_Z + 1.4]}>
      <mesh rotation={[0.15, 0, 0]}>
        <sphereGeometry args={[1.15, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={HULL}
          metalness={0.55}
          roughness={0.3}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.55, 0.2]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.6, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.65} roughness={0.32} />
      </mesh>
    </group>
  )
}

function RcsCluster({
  position,
  rotationZ,
}: {
  position: Vec3
  rotationZ: number
}) {
  return (
    <group position={position} rotation={[0, 0, rotationZ]}>
      {[0, 1, 2, 3].map((i) => {
        const dir: Vec3 =
          i === 0
            ? [0.55, 0, 0]
            : i === 1
              ? [0, 0.55, 0]
              : i === 2
                ? [0, 0, 0.55]
                : [0, 0, -0.55]
        return (
          <mesh
            key={i}
            position={dir}
            rotation={
              i === 0
                ? [0, 0, -Math.PI / 2]
                : i === 1
                  ? [0, 0, 0]
                  : i === 2
                    ? [Math.PI / 2, 0, 0]
                    : [-Math.PI / 2, 0, 0]
            }
          >
            <coneGeometry args={[0.12, 0.32, 8]} />
            <meshStandardMaterial
              color={METAL_DARK}
              metalness={0.6}
              roughness={0.32}
              emissive="#ffb070"
              emissiveIntensity={0.08}
            />
          </mesh>
        )
      })}
      <mesh>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color={HULL_DARK} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

export function DockingNoseModule({ slotPosition }: { slotPosition: Vec3 }) {
  const { activePreset } = useShipConfiguration()
  const dual = activePreset === 'tug'
  const r = AIRLOCK_RADIUS + 0.55
  return (
    <group position={slotPosition}>
      {dual ? (
        <>
          <group position={[-1.35, 0, 0]}>
            <IdssDockingPort />
          </group>
          <group position={[1.35, 0, 0]}>
            <IdssDockingPort />
          </group>
        </>
      ) : (
        <IdssDockingPort />
      )}
      <ZeroGAirlock />
      <AvionicsDome />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2
        return (
          <RcsCluster
            key={i}
            position={[Math.cos(a) * r, Math.sin(a) * r, PORT_Z - 1.6]}
            rotationZ={a}
          />
        )
      })}
    </group>
  )
}
