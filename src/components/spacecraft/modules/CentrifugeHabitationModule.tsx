import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { useShipConfiguration } from '../../../hooks/useShipConfiguration'
import type { Vec3 } from '../../../types/spacecraft'
import { CentrifugeRing, MagneticStator } from '../ShipParts'
import { TransferElevator } from '../TransferElevator'

export function CentrifugeHabitationModule({
  slotPosition,
}: {
  slotPosition: Vec3
}) {
  const { omega, elevatorAuto, elevatorPosition, setElevatorPosition } =
    useShipConfiguration()
  const ringRef = useRef<Group>(null)

  useFrame((_, delta) => {
    const ring = ringRef.current
    if (!ring) return
    ring.rotation.z += omega * delta
  })

  return (
    <group position={slotPosition}>
      <MagneticStator />
      <group ref={ringRef}>
        <CentrifugeRing />
        <TransferElevator
          auto={elevatorAuto}
          manualPosition={elevatorPosition}
          onPositionChange={setElevatorPosition}
        />
      </group>
    </group>
  )
}
