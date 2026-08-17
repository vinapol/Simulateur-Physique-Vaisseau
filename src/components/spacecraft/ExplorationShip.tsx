import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { HabitatInterior } from './HabitatInterior'
import { CentrifugeRing, FixedSpine } from './ShipParts'
import { TransferElevator } from './TransferElevator'

export type FpvMode = 'none' | 'cabin' | 'habitat'

/** DSTV-80 : poutre fixe 120 m + anneau centrifuge Ø 80 m.
 *  Fiche d’ingénierie : `gemini-code-1786923661213.md`.
 */
export function ExplorationShip({
  omega,
  thrust,
  showShield,
  elevatorAuto,
  elevatorPosition,
  onElevatorPositionChange,
  fpvMode = 'none',
}: {
  omega: number
  thrust: number
  showShield: boolean
  elevatorAuto: boolean
  elevatorPosition: number
  onElevatorPositionChange: (position: number) => void
  fpvMode?: FpvMode
}) {
  const ringRef = useRef<Group>(null)

  useFrame((_, delta) => {
    const ring = ringRef.current
    if (!ring) return
    ring.rotation.z += omega * delta
  })

  return (
    <group>
      <FixedSpine showShield={showShield} thrust={thrust} />
      <group ref={ringRef}>
        <CentrifugeRing
          hiddenModules={fpvMode === 'habitat' ? [0, 1] : []}
        />
        <TransferElevator
          auto={elevatorAuto}
          manualPosition={elevatorPosition}
          onPositionChange={onElevatorPositionChange}
          fpv={fpvMode === 'cabin'}
        />
        {fpvMode === 'habitat' && <HabitatInterior />}
      </group>
    </group>
  )
}
