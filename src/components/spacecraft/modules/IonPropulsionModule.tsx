import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  ShaderMaterial,
} from 'three'
import { useShipConfiguration } from '../../../hooks/useShipConfiguration'
import type { Vec3 } from '../../../types/spacecraft'
import {
  COPPER,
  GOLD_MLI,
  HULL,
  HULL_DARK,
  METAL,
  METAL_DARK,
  TUNGSTEN,
} from '../constants'
import {
  shieldHalfAngleForShip,
  umbraHeightFromApex,
} from '../radiationUmbra'
import { ZCyl } from '../primitives'

const REACTOR_Z = 7.4
const GRID_Z = -11.2
const GRID_N = 4
const GRID_PITCH = 1.55

const plumeVert = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const plumeFrag = /* glsl */ `
uniform float uTime;
uniform float uThrust;
uniform vec3 uColor;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec2 vUv;
void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.35);
  float along = pow(clamp(vUv.y, 0.0, 1.0), 1.25);
  float pulse = 0.84 + 0.16 * sin(uTime * 5.4 + vUv.y * 14.0);
  float alpha = uThrust * pulse * (0.10 + 0.72 * fresnel) * (1.0 - along);
  vec3 col = mix(uColor, vec3(0.85, 0.98, 1.0), fresnel * 0.55);
  gl_FragColor = vec4(col, alpha);
}
`

function IonPlasmaPlume({ thrust }: { thrust: number }) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uThrust: { value: 0 },
          uColor: { value: new Color('#5ee7ff') },
        },
        vertexShader: plumeVert,
        fragmentShader: plumeFrag,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  )
  const t = Math.min(Math.max(thrust, 0), 1)
  const length = 3.2 + t * 14

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    mat.uniforms.uThrust.value = t
    mat.visible = t > 0.02
  })

  return (
    <group position={[0, 0, -length / 2 - 0.35]} visible={t > 0.02}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat}>
        <coneGeometry args={[0.16 + t * 0.12, length, 14, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.8]}>
        <coneGeometry args={[0.28 + t * 0.18, length * 1.12, 12, 1, true]} />
        <meshBasicMaterial
          color="#7ef0ff"
          transparent
          opacity={0.14 * t}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}

function CrossRadiators() {
  const inner = 3.8
  const length = 26
  const mid = inner + length / 2
  const width = 9.2
  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2
        return (
          <group key={i} rotation={[0, 0, a]}>
            <mesh position={[mid, 0, 2.4]}>
              <boxGeometry args={[length, width, 0.14]} />
              <meshStandardMaterial
                color="#1a1d24"
                metalness={0.28}
                roughness={0.68}
              />
            </mesh>
            {Array.from({ length: 8 }, (_, k) => {
              const y = -width / 2 + 0.7 + k * ((width - 1.4) / 7)
              return (
                <mesh key={k} position={[mid, y, 2.5]}>
                  <boxGeometry args={[length * 0.92, 0.06, 0.04]} />
                  <meshStandardMaterial
                    color="#9aa7b8"
                    metalness={0.7}
                    roughness={0.22}
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

function ShadowCone({
  show,
  slotZ,
  halfAngle,
}: {
  show: boolean
  slotZ: number
  halfAngle: number
}) {
  if (!show) return null
  const apexWorld = slotZ + REACTOR_Z
  const height = umbraHeightFromApex(apexWorld)
  const baseR = Math.tan(halfAngle) * height
  return (
    <mesh
      key={halfAngle.toFixed(4)}
      position={[0, 0, REACTOR_Z + height / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <coneGeometry args={[baseR, height, 32, 1, true]} />
      <meshStandardMaterial
        color="#7ec8ff"
        transparent
        opacity={0.08}
        side={DoubleSide}
        depthWrite={false}
        metalness={0}
        roughness={1}
        emissive="#4aa0ff"
        emissiveIntensity={0.06}
      />
    </mesh>
  )
}

function NepReactor() {
  return (
    <group>
      <mesh position={[0, 0, REACTOR_Z + 2.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.35, 3.4, 5.2, 24]} />
        <meshStandardMaterial
          color={TUNGSTEN}
          metalness={0.38}
          roughness={0.55}
        />
      </mesh>
      <ZCyl
        position={[0, 0, REACTOR_Z]}
        radius={2.05}
        length={4.4}
        color="#3a3f48"
        metalness={0.58}
        roughness={0.36}
        emissive="#5a3cff"
        emissiveIntensity={0.12}
      />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <ZCyl
            key={i}
            position={[Math.cos(a) * 2.55, Math.sin(a) * 2.55, REACTOR_Z]}
            radius={0.28}
            length={3.6}
            color={COPPER}
            metalness={0.72}
            roughness={0.28}
            segments={8}
          />
        )
      })}
    </group>
  )
}

function ArgonTanks() {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4
        const x = Math.cos(a) * 5.4
        const y = Math.sin(a) * 5.4
        return (
          <group key={i} position={[x, y, -1.4]}>
            <mesh>
              <sphereGeometry args={[2.05, 28, 20]} />
              <meshStandardMaterial
                color="#c5cdd6"
                metalness={0.62}
                roughness={0.28}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[2.18, 10, 8]} />
              <meshStandardMaterial
                color="#8b949e"
                metalness={0.55}
                roughness={0.4}
                wireframe
              />
            </mesh>
            <mesh rotation={[0.6, 0.2, 0]}>
              <torusGeometry args={[2.12, 0.05, 6, 18]} />
              <meshStandardMaterial color={GOLD_MLI} metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function IonThruster({
  position,
  thrust,
}: {
  position: Vec3
  thrust: number
}) {
  const t = Math.min(Math.max(thrust, 0), 1)
  return (
    <group position={position}>
      <ZCyl
        position={[0, 0, 0.7]}
        radius={0.52}
        length={1.2}
        color={HULL_DARK}
        metalness={0.58}
        roughness={0.34}
        segments={14}
      />
      {[0.35, 0.18, 0.02].map((z, i) => (
        <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42 - i * 0.05, 0.045, 8, 18]} />
          <meshStandardMaterial
            color="#9bd7ff"
            metalness={0.85}
            roughness={0.16}
            emissive="#3ad7ff"
            emissiveIntensity={0.15 + t * 0.7}
          />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.46, 0.22, 16]} />
        <meshStandardMaterial
          color={METAL}
          metalness={0.8}
          roughness={0.2}
          emissive="#5ee7ff"
          emissiveIntensity={t * 0.9}
        />
      </mesh>
      <IonPlasmaPlume thrust={t} />
    </group>
  )
}

export function IonPropulsionModule({
  slotPosition,
}: {
  slotPosition: Vec3
}) {
  const { thrust, showShield, spineSlots, podCount } = useShipConfiguration()
  const cells = useMemo(() => {
    const half = (GRID_N - 1) / 2
    const list: Vec3[] = []
    for (let i = 0; i < GRID_N; i++) {
      for (let j = 0; j < GRID_N; j++) {
        list.push([
          (i - half) * GRID_PITCH,
          (j - half) * GRID_PITCH,
          GRID_Z,
        ])
      }
    }
    return list
  }, [])

  return (
    <group position={slotPosition}>
      <ZCyl
        position={[0, 0, -1.6]}
        radius={2.35}
        length={12.5}
        color={HULL}
        metalness={0.5}
        roughness={0.38}
        segments={22}
      />
      <NepReactor />
      <ShadowCone
        show={showShield}
        slotZ={slotPosition[2]}
        halfAngle={shieldHalfAngleForShip(
          spineSlots,
          slotPosition[2] + REACTOR_Z,
          podCount,
        )}
      />
      <CrossRadiators />
      <ArgonTanks />
      <mesh position={[0, 0, GRID_Z + 1.6]}>
        <boxGeometry args={[6.4, 6.4, 0.35]} />
        <meshStandardMaterial color={METAL_DARK} metalness={0.55} roughness={0.4} />
      </mesh>
      {cells.map((p, i) => (
        <IonThruster key={i} position={p} thrust={thrust} />
      ))}
      <pointLight
        position={[0, 0, GRID_Z - 4]}
        color="#5ee7ff"
        intensity={thrust * 28}
        distance={70}
      />
    </group>
  )
}
