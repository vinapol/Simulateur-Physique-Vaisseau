import { getShipModule } from './modules/catalog'
import { CentralSpine } from './modules/CentralSpine'
import { useShipConfiguration } from '../../hooks/useShipConfiguration'
import { useShipTelemetry } from '../../hooks/useShipTelemetry'

function CenterOfMassMarker() {
  const { comZ, totalMass } = useShipTelemetry()
  if (totalMass < 1e-6) return null
  return (
    <group position={[0, 0, comZ]}>
      <mesh>
        <sphereGeometry args={[0.85, 16, 12]} />
        <meshStandardMaterial
          color="#f5c542"
          emissive="#e8b400"
          emissiveIntensity={0.55}
          metalness={0.2}
          roughness={0.35}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.07, 8, 24]} />
        <meshStandardMaterial
          color="#f5c542"
          emissive="#e8b400"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  )
}

/** DSTV-80 : poutre fixe 120 m + modules enfichés sur les slots. */
export function ExplorationShip() {
  const { spineSlots } = useShipConfiguration()
  const heavyCargoOnMedian =
    spineSlots.find((s) => s.id === 'median')?.mountedModuleId === 'heavy-cargo'

  return (
    <group>
      <CentralSpine />
      {spineSlots.map((slot) => {
        const module = getShipModule(slot.mountedModuleId)
        if (!module) return null
        const ModuleView = module.component
        const slotPos: [number, number, number] =
          slot.id === 'intermediate' && heavyCargoOnMedian
            ? [slot.position[0], slot.position[1], -26]
            : slot.position
        return <ModuleView key={slot.id} slotPosition={slotPos} />
      })}
      <CenterOfMassMarker />
    </group>
  )
}
