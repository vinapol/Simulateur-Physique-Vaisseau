import { SLOT_LAYOUT } from '../../../types/spacecraft'
import { useShipConfiguration } from '../../../hooks/useShipConfiguration'
import {
  HULL_DARK,
  METAL,
  METAL_DARK,
  TRUSS_LENGTH,
  TRUSS_RADIUS,
  Z_AFT,
} from '../constants'
import { ZCyl } from '../primitives'

function SlotNode({
  z,
  occupied,
  selected,
}: {
  z: number
  occupied: boolean
  selected: boolean
}) {
  const color = selected ? '#5ec8ff' : occupied ? '#2dd4bf' : '#6f7884'
  return (
    <group position={[0, 0, z]}>
      <mesh>
        <torusGeometry args={[2.15, 0.11, 8, 22]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.28}
          emissive={color}
          emissiveIntensity={selected ? 0.55 : occupied ? 0.22 : 0.04}
        />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0]}
          >
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial
              color={color}
              metalness={0.65}
              roughness={0.3}
              emissive={color}
              emissiveIntensity={selected ? 0.4 : 0.08}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export function CentralSpine() {
  const { spineSlots, selectedSlotId } = useShipConfiguration()
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
      {SLOT_LAYOUT.map((def) => {
        const slot = spineSlots.find((s) => s.id === def.id)
        return (
          <SlotNode
            key={def.id}
            z={def.position[2]}
            occupied={Boolean(slot?.mountedModuleId)}
            selected={selectedSlotId === def.id}
          />
        )
      })}
    </group>
  )
}
