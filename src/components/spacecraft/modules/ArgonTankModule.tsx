import { TANK_ANGLES, TANK_RADIAL, TANK_RADIUS, TRUSS_RADIUS } from '../constants'
import { Cable, ZCyl } from '../primitives'
import type { Vec3 } from '../../../types/spacecraft'

const ARGON_SILVER = '#94a3b8'
const TITANIUM_BLUE = '#0284c7'
const CYAN_MANIFOLD = '#38bdf8'

export function ArgonTankModule({ slotPosition }: { slotPosition: Vec3 }) {
  return (
    <group position={slotPosition}>
      {TANK_ANGLES.map((theta) => {
        const x = Math.cos(theta) * TANK_RADIAL
        const y = Math.sin(theta) * TANK_RADIAL
        return (
          <group key={theta}>
            <group position={[x, y, 0]}>
              {/* Réservoir principal argon (cylindre à dômes métalliques) */}
              <mesh>
                <sphereGeometry args={[TANK_RADIUS, 32, 24]} />
                <meshStandardMaterial
                  color={ARGON_SILVER}
                  metalness={0.75}
                  roughness={0.25}
                />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry
                  args={[TANK_RADIUS * 0.95, TANK_RADIUS * 0.95, TANK_RADIUS * 1.2, 24]}
                />
                <meshStandardMaterial
                  color="#334155"
                  metalness={0.8}
                  roughness={0.3}
                />
              </mesh>
              {/* Cerclages de renfort en titane bleu */}
              {[-0.6, -0.2, 0.2, 0.6].map((k) => {
                const z = k * TANK_RADIUS
                const ringR = Math.sqrt(
                  Math.max(TANK_RADIUS * TANK_RADIUS - z * z, 0.2),
                )
                return (
                  <mesh key={k} position={[0, 0, z]}>
                    <torusGeometry args={[ringR + 0.04, 0.08, 8, 28]} />
                    <meshStandardMaterial
                      color={TITANIUM_BLUE}
                      metalness={0.85}
                      roughness={0.2}
                    />
                  </mesh>
                )
              })}
              {/* Conduits de collecte haute pression cyan */}
              <ZCyl
                position={[0, TANK_RADIUS + 0.2, 0]}
                radius={0.18}
                length={TANK_RADIUS * 2.2}
                color={CYAN_MANIFOLD}
                metalness={0.9}
                roughness={0.15}
              />
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
              radius={0.22}
            />
          </group>
        )
      })}
    </group>
  )
}
