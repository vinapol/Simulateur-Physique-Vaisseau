import { HULL, HULL_DARK, METAL, METAL_DARK, WINDOW, WINDOW_GLOW } from '../constants'
import { Cable, ZCyl } from '../primitives'
import type { Vec3 } from '../../../types/spacecraft'

const BAY_RADIUS = 11.5
const BAY_LENGTH = 28

function OctagonRings() {
  const n = 8
  const r = BAY_RADIUS
  return (
    <group>
      {[-11, -3.5, 4, 11].map((z) => (
        <group key={z} position={[0, 0, z]}>
          {Array.from({ length: n }, (_, i) => {
            const a0 = (i / n) * Math.PI * 2
            const a1 = ((i + 1) / n) * Math.PI * 2
            const x0 = Math.cos(a0) * r
            const y0 = Math.sin(a0) * r
            const x1 = Math.cos(a1) * r
            const y1 = Math.sin(a1) * r
            return (
              <Cable
                key={i}
                from={[x0, y0, 0]}
                to={[x1, y1, 0]}
                radius={0.16}
              />
            )
          })}
        </group>
      ))}
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + Math.PI / n
        const x = Math.cos(a) * r
        const y = Math.sin(a) * r
        return (
          <ZCyl
            key={i}
            position={[x, y, 0]}
            radius={0.14}
            length={BAY_LENGTH}
            color={METAL_DARK}
            metalness={0.62}
            roughness={0.35}
            segments={8}
          />
        )
      })}
    </group>
  )
}

function PressurizedContainer({
  position,
  rotationZ,
}: {
  position: Vec3
  rotationZ: number
}) {
  return (
    <group position={position} rotation={[0, 0, rotationZ]}>
      <mesh>
        <boxGeometry args={[4.2, 3.4, 7.2]} />
        <meshStandardMaterial
          color={HULL}
          metalness={0.42}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0, 3.7]}>
        <cylinderGeometry args={[0.85, 0.85, 0.35, 16]} />
        <meshStandardMaterial color={HULL_DARK} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.72, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 14]} />
        <meshStandardMaterial
          color={WINDOW}
          emissive={WINDOW_GLOW}
          emissiveIntensity={0.28}
          roughness={0.14}
        />
      </mesh>
      <mesh position={[2.12, 0, 0]}>
        <boxGeometry args={[0.08, 2.4, 5.2]} />
        <meshStandardMaterial color="#c45a1a" roughness={0.5} />
      </mesh>
    </group>
  )
}

function OpenContainer({
  position,
  rotationZ,
}: {
  position: Vec3
  rotationZ: number
}) {
  return (
    <group position={position} rotation={[0, 0, rotationZ]}>
      <mesh>
        <boxGeometry args={[4.0, 3.1, 6.6]} />
        <meshStandardMaterial
          color="#3d444e"
          metalness={0.55}
          roughness={0.45}
          wireframe={false}
        />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, 1.6, -2.4 + i * 1.2]}>
          <boxGeometry args={[3.6, 0.06, 0.08]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.28} />
        </mesh>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={`s${i}`} position={[-1.5 + i, 1.6, 0]}>
          <boxGeometry args={[0.06, 0.06, 6.2]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.28} />
        </mesh>
      ))}
    </group>
  )
}

export function CargoBayModule({ slotPosition }: { slotPosition: Vec3 }) {
  const pressurized = [0, 2, 5]
  return (
    <group position={slotPosition}>
      <ZCyl
        position={[0, 0, 0]}
        radius={2.4}
        length={8.5}
        color={METAL_DARK}
        metalness={0.58}
        roughness={0.34}
        segments={20}
      />
      <OctagonRings />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        const r = 8.35
        const pos: Vec3 = [Math.cos(a) * r, Math.sin(a) * r, (i % 2 === 0 ? -5 : 5)]
        return pressurized.includes(i) ? (
          <PressurizedContainer key={i} position={pos} rotationZ={a} />
        ) : (
          <OpenContainer key={i} position={pos} rotationZ={a} />
        )
      })}
    </group>
  )
}
