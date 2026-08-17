import { GOLD_MLI, GOLD_SEAM, HULL_DARK, METAL, TANK_ANGLES, TANK_RADIAL, TANK_RADIUS, TRUSS_RADIUS } from '../constants'
import { Cable, ZCyl } from '../primitives'
import type { Vec3 } from '../../../types/spacecraft'

function ZboCooler({ tankR }: { tankR: number }) {
  return (
    <group position={[0, tankR + 0.55, 0]}>
      <mesh>
        <boxGeometry args={[0.85, 0.55, 1.15]} />
        <meshStandardMaterial
          color={HULL_DARK}
          metalness={0.5}
          roughness={0.38}
        />
      </mesh>
      <ZCyl
        position={[0, 0.55, 0]}
        radius={0.28}
        length={0.7}
        color={METAL}
        metalness={0.62}
        roughness={0.3}
        segments={10}
      />
      <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.08, 16]} />
        <meshStandardMaterial
          color="#1a1d24"
          metalness={0.3}
          roughness={0.65}
        />
      </mesh>
    </group>
  )
}

export function CryoTankModule({ slotPosition }: { slotPosition: Vec3 }) {
  return (
    <group position={slotPosition}>
      {TANK_ANGLES.map((theta) => {
        const x = Math.cos(theta) * TANK_RADIAL
        const y = Math.sin(theta) * TANK_RADIAL
        return (
          <group key={theta}>
            <group position={[x, y, 0]}>
              <mesh>
                <sphereGeometry args={[TANK_RADIUS, 32, 24]} />
                <meshStandardMaterial
                  color={GOLD_MLI}
                  metalness={0.88}
                  roughness={0.3}
                />
              </mesh>
              <mesh rotation={[0, 0, 0]}>
                <cylinderGeometry
                  args={[TANK_RADIUS * 0.42, TANK_RADIUS * 0.42, TANK_RADIUS * 1.15, 24]}
                />
                <meshStandardMaterial
                  color={GOLD_MLI}
                  metalness={0.86}
                  roughness={0.32}
                />
              </mesh>
              {[-0.52, 0, 0.52].map((k) => {
                const z = k * TANK_RADIUS
                const ringR = Math.sqrt(
                  Math.max(TANK_RADIUS * TANK_RADIUS - z * z, 0.2),
                )
                return (
                  <mesh key={k} position={[0, 0, z]}>
                    <torusGeometry args={[ringR, 0.07, 6, 28]} />
                    <meshStandardMaterial
                      color={GOLD_SEAM}
                      metalness={0.8}
                      roughness={0.38}
                    />
                  </mesh>
                )
              })}
              <ZboCooler tankR={TANK_RADIUS} />
            </group>
            <Cable
              from={[
                Math.cos(theta) * (TANK_RADIAL - TANK_RADIUS),
                Math.sin(theta) * (TANK_RADIAL - TANK_RADIUS),
                0,
              ]}
              to={[
                Math.cos(theta) * (TRUSS_RADIUS + 0.35),
                Math.sin(theta) * (TRUSS_RADIUS + 0.35),
                0,
              ]}
              radius={0.2}
            />
          </group>
        )
      })}
    </group>
  )
}
