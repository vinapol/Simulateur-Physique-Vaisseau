import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { getModuleStats } from '../../data/shipModules'
import { useShipConfiguration } from '../../hooks/useShipConfiguration'
import { useShipTelemetry } from '../../hooks/useShipTelemetry'
import { useLanguage } from '../../i18n/LanguageContext'
import type { ShipTelemetry } from '../../physics/spacecraft'
import {
  SHIP_PRESET_LABELS,
  SPINE_DRY_MASS,
  type SpineSlot,
} from '../../types/spacecraft'
import {
  RING_RADIUS,
  TANK_ANGLES,
  TANK_RADIAL,
  TANK_RADIUS,
  TRUSS_LENGTH,
  Z_AFT,
  Z_NOSE,
} from './constants'

type ViewKind = 'profile' | 'face'

type Proj = {
  X: (z: number) => number
  Y: (y: number) => number
  s: number
}

const INK = '#9be7ff'
const DIM = '#5f8b9a'
const HULL = '#d5dee6'
const GOLD = '#d4a017'
const COM = '#f5c542'
const PAPER = '#071018'

function fmt(n: number, digits = 1) {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function configTitle(
  activePreset: keyof typeof SHIP_PRESET_LABELS | null,
): string {
  if (activePreset) return SHIP_PRESET_LABELS[activePreset]
  return 'Configuration personnalisée'
}

function fileStem(activePreset: string | null) {
  const tag = activePreset ?? 'custom'
  const day = new Date().toISOString().slice(0, 10)
  return `DSTV-80-plan-${tag}-${day}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function DimH({
  x1,
  x2,
  y,
  label,
}: {
  x1: number
  x2: number
  y: number
  label: string
}) {
  const left = Math.min(x1, x2)
  const right = Math.max(x1, x2)
  const mid = (left + right) / 2
  return (
    <g stroke={DIM} fill={DIM} strokeWidth={0.8}>
      <line x1={left} y1={y - 4} x2={left} y2={y + 4} />
      <line x1={right} y1={y - 4} x2={right} y2={y + 4} />
      <line x1={left} y1={y} x2={right} y2={y} />
      <text
        x={mid}
        y={y - 6}
        textAnchor="middle"
        fill={DIM}
        stroke="none"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  )
}

function SlotTick({
  proj,
  slot,
  labelY,
  level,
  heavyCargoMounted,
}: {
  proj: Proj
  slot: SpineSlot
  labelY: number
  level: number
  heavyCargoMounted: boolean
}) {
  const slotZ =
    slot.id === 'intermediate' && heavyCargoMounted
      ? -26
      : slot.position[2]
  const x = proj.X(slotZ)
  const mounted = getModuleStats(slot.mountedModuleId)
  const currentY = labelY + level * 34
  const slotTitle = slot.name.replace('Slot ', '')
  const moduleTitle = mounted ? mounted.name : 'Vide'

  return (
    <g>
      <line
        x1={x}
        y1={proj.Y(2.4)}
        x2={x}
        y2={currentY + 12}
        stroke={DIM}
        strokeDasharray="3 3"
        strokeWidth={0.8}
      />
      <circle cx={x} cy={proj.Y(0)} r={3.5} fill={INK} />

      {/* Badge de fond pour une lisibilité parfaite */}
      <rect
        x={x - 68}
        y={currentY - 10}
        width={136}
        height={30}
        rx={5}
        fill="#07121b"
        stroke="#1a3648"
        strokeWidth={0.8}
      />

      <text
        x={x}
        y={currentY + 2}
        textAnchor="middle"
        fill={INK}
        fontSize={10}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={700}
      >
        {slotTitle}
      </text>
      <text
        x={x}
        y={currentY + 15}
        textAnchor="middle"
        fill={mounted ? HULL : DIM}
        fontSize={9}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {moduleTitle}
      </text>
    </g>
  )
}

function ProfileModules({ proj, slots }: { proj: Proj; slots: SpineSlot[] }) {
  const { X, Y, s } = proj
  const ids = new Set(slots.map((sl) => sl.mountedModuleId))

  return (
    <g fill="none" stroke={HULL} strokeWidth={1.2}>
      <rect
        x={X(Z_AFT)}
        y={Y(1.2)}
        width={X(Z_NOSE) - X(Z_AFT)}
        height={Y(-1.2) - Y(1.2)}
        fill="#0e1a22"
        stroke={INK}
      />
      {Array.from({ length: 13 }, (_, i) => {
        const z = Z_AFT + 4 + (i * (TRUSS_LENGTH - 8)) / 12
        return (
          <line
            key={i}
            x1={X(z)}
            y1={Y(1.2)}
            x2={X(z)}
            y2={Y(-1.2)}
            stroke={DIM}
            strokeWidth={0.6}
          />
        )
      })}

      {ids.has('docking-nose') && (
        <g stroke={HULL}>
          <rect
            x={X(47.2)}
            y={Y(2.15)}
            width={X(55.5) - X(47.2)}
            height={Y(-2.15) - Y(2.15)}
            rx={3}
          />
          <rect
            x={X(55.2)}
            y={Y(1.15)}
            width={X(59.2) - X(55.2)}
            height={Y(-1.15) - Y(1.15)}
          />
          <circle cx={X(59.4)} cy={Y(0)} r={0.7 * s} />
          {[-1.6, 1.6].map((y) => (
            <rect
              key={y}
              x={X(57.2)}
              y={Y(y + 0.35)}
              width={X(58.1) - X(57.2)}
              height={Y(y - 0.35) - Y(y + 0.35)}
              fill={DIM}
              stroke={HULL}
            />
          ))}
        </g>
      )}

      {ids.has('centrifuge-hab') && (
        <g stroke={INK}>
          <ellipse
            cx={X(0)}
            cy={Y(0)}
            rx={3.2 * s}
            ry={RING_RADIUS * s}
            strokeDasharray="5 3"
          />
          <circle cx={X(0)} cy={Y(0)} r={4.4 * s} fill="#0e1a22" />
          {[-RING_RADIUS, RING_RADIUS].map((y) => (
            <g key={y}>
              <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(y)} strokeWidth={0.9} />
              <rect
                x={X(-6.7)}
                y={Y(y + 3.15)}
                width={X(6.7) - X(-6.7)}
                height={Y(y - 3.15) - Y(y + 3.15)}
                rx={4}
                fill="#10222c"
              />
            </g>
          ))}
        </g>
      )}

      {ids.has('cargo-bay') && (
        <g stroke="#e0a36a">
          <rect
            x={X(-14)}
            y={Y(11.5)}
            width={X(14) - X(-14)}
            height={Y(-11.5) - Y(11.5)}
          />
          {[-8, 0, 8].map((z) =>
            [-7.2, 7.2].map((y) => (
              <rect
                key={`${z}-${y}`}
                x={X(z - 3.3)}
                y={Y(y + 1.7)}
                width={X(z + 3.3) - X(z - 3.3)}
                height={Y(y - 1.7) - Y(y + 1.7)}
                fill="#1a140e"
              />
            )),
          )}
        </g>
      )}

      {ids.has('heavy-cargo') && (
        <g stroke="#e0a36a">
          {[-13, 13].map((y) => (
            <rect
              key={y}
              x={X(-13)}
              y={Y(y + 6)}
              width={X(13) - X(-13)}
              height={Y(y - 6) - Y(y + 6)}
              fill="#1a140e"
            />
          ))}
        </g>
      )}

      {ids.has('cryo-tanks') && (
        <g stroke={GOLD} fill="#3a2a08">
          {TANK_ANGLES.map((theta) => {
            const y = Math.sin(theta) * TANK_RADIAL
            const tankZ = ids.has('heavy-cargo') ? -26 : -11
            return (
              <circle
                key={theta}
                cx={X(tankZ)}
                cy={Y(y)}
                r={TANK_RADIUS * s}
                fillOpacity={0.35}
              />
            )
          })}
        </g>
      )}

      {ids.has('argon-tanks') && (
        <g stroke="#38bdf8" fill="#0369a1">
          {TANK_ANGLES.map((theta) => {
            const y = Math.sin(theta) * TANK_RADIAL
            const tankZ = ids.has('heavy-cargo') ? -26 : -11
            return (
              <circle
                key={theta}
                cx={X(tankZ)}
                cy={Y(y)}
                r={TANK_RADIUS * s}
                fillOpacity={0.4}
              />
            )
          })}
        </g>
      )}

      {ids.has('ntp') && (
        <g stroke="#c4b5fd">
          <polygon
            points={`${X(-34.6)},${Y(2.15)} ${X(-43.8)},${Y(5.9)} ${X(-43.8)},${Y(-5.9)} ${X(-34.6)},${Y(-2.15)}`}
            fill="#1a1520"
          />
          {[-1, 1].map((side) => (
            <line
              key={side}
              x1={X(-47.6)}
              y1={Y(side * 4.2)}
              x2={X(-47.6)}
              y2={Y(side * 30)}
              strokeWidth={2.2}
            />
          ))}
          <rect
            x={X(-55.7)}
            y={Y(2.12)}
            width={X(-50.5) - X(-55.7)}
            height={Y(-2.12) - Y(2.12)}
            fill="#16101c"
          />
          <path
            d={`M ${X(-55.7)} ${Y(1.15)} L ${X(-63)} ${Y(3.7)} L ${X(-63)} ${Y(-3.7)} L ${X(-55.7)} ${Y(-1.15)} Z`}
            fill="#120c18"
          />
        </g>
      )}

      {ids.has('ion') && (
        <g stroke="#5ee7ff">
          {[-1, 1].map((side) => (
            <line
              key={side}
              x1={X(-47.6)}
              y1={Y(side * 4)}
              x2={X(-47.6)}
              y2={Y(side * 28)}
              strokeWidth={2}
            />
          ))}
          <rect
            x={X(-56)}
            y={Y(2.3)}
            width={X(-44) - X(-56)}
            height={Y(-2.3) - Y(2.3)}
            fill="#0b1c22"
          />
          {[-2.3, -0.8, 0.8, 2.3].map((y) => (
            <g key={y}>
              <circle cx={X(-61.2)} cy={Y(y)} r={0.4 * s} />
              <line
                x1={X(-61.2)}
                y1={Y(y)}
                x2={X(-68)}
                y2={Y(y)}
                strokeDasharray="2 2"
              />
            </g>
          ))}
        </g>
      )}
    </g>
  )
}

function FaceView({ proj, slots }: { proj: Proj; slots: SpineSlot[] }) {
  const { t: tr } = useLanguage()
  const { X, Y, s } = proj
  const median = slots.find((sl) => sl.id === 'median')
  const id = median?.mountedModuleId

  return (
    <g fill="none" stroke={HULL} strokeWidth={1.2}>
      <circle cx={X(0)} cy={Y(0)} r={1.2 * s} fill="#0e1a22" stroke={INK} />
      {id === 'centrifuge-hab' && (
        <g stroke={INK}>
          <circle
            cx={X(0)}
            cy={Y(0)}
            r={RING_RADIUS * s}
            strokeDasharray="6 4"
          />
          <circle cx={X(0)} cy={Y(0)} r={4.4 * s} fill="#0e1a22" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2
            const cx = Math.cos(a) * RING_RADIUS
            const cy = Math.sin(a) * RING_RADIUS
            const tx = -Math.sin(a)
            const ty = Math.cos(a)
            const hx = 6.7
            const hy = 3.15
            const corners = [
              [cx + tx * hx + Math.cos(a) * hy, cy + ty * hx + Math.sin(a) * hy],
              [cx - tx * hx + Math.cos(a) * hy, cy - ty * hx + Math.sin(a) * hy],
              [cx - tx * hx - Math.cos(a) * hy, cy - ty * hx - Math.sin(a) * hy],
              [cx + tx * hx - Math.cos(a) * hy, cy + ty * hx - Math.sin(a) * hy],
            ]
            const pts = corners
              .map(([wx, wy]) => `${X(wx)},${Y(wy)}`)
              .join(' ')
            return (
              <g key={i}>
                <line
                  x1={X(0)}
                  y1={Y(0)}
                  x2={X(cx)}
                  y2={Y(cy)}
                  strokeWidth={0.8}
                />
                <polygon points={pts} fill="#10222c" />
              </g>
            )
          })}
        </g>
      )}
      {id === 'heavy-cargo' && (
        <g stroke="#e0a36a">
          {[-13, 13].map((x) => (
            <rect
              key={`x${x}`}
              x={X(x - 6)}
              y={Y(6)}
              width={12 * s}
              height={12 * s}
              fill="#1a140e"
            />
          ))}
          {[-13, 13].map((y) => (
            <rect
              key={`y${y}`}
              x={X(-6)}
              y={Y(y + 6)}
              width={12 * s}
              height={12 * s}
              fill="#1a140e"
            />
          ))}
        </g>
      )}
      {id === 'cargo-bay' && (
        <g stroke="#e0a36a">
          {Array.from({ length: 8 }, (_, i) => {
            const a0 = (i / 8) * Math.PI * 2
            const a1 = ((i + 1) / 8) * Math.PI * 2
            const r = 11.5
            return (
              <line
                key={i}
                x1={X(Math.cos(a0) * r)}
                y1={Y(Math.sin(a0) * r)}
                x2={X(Math.cos(a1) * r)}
                y2={Y(Math.sin(a1) * r)}
              />
            )
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2
            const r = 8.35
            return (
              <rect
                key={i}
                x={X(Math.cos(a) * r - 2.1)}
                y={Y(Math.sin(a) * r + 1.7)}
                width={4.2 * s}
                height={3.4 * s}
                fill="#1a140e"
                transform={`rotate(${(a * 180) / Math.PI} ${X(Math.cos(a) * r)} ${Y(Math.sin(a) * r)})`}
              />
            )
          })}
        </g>
      )}
      {!id && (
        <text
          x={X(0)}
          y={Y(-8)}
          textAnchor="middle"
          fill={DIM}
          stroke="none"
          fontSize={13}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {tr('emptyMedianSlot')}
        </text>
      )}
    </g>
  )
}

function TitleBlock({
  x,
  y,
  w,
  h,
  title,
  telemetry,
  viewLabel,
}: {
  x: number
  y: number
  w: number
  h: number
  title: string
  telemetry: ShipTelemetry
  viewLabel: string
}) {
  const { t: tr, lang } = useLanguage()
  const date = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#0b1620"
        stroke={INK}
        strokeWidth={1}
      />
      <line x1={x} y1={y + 22} x2={x + w} y2={y + 22} stroke={INK} />
      <text
        x={x + 10}
        y={y + 15}
        fill={INK}
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={700}
      >
        {tr('blueprintAssemblyTitle')}
      </text>
      <text
        x={x + 10}
        y={y + 38}
        fill={HULL}
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={600}
      >
        {title}
      </text>
      <text
        x={x + 10}
        y={y + 53}
        fill={DIM}
        fontSize={10}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {viewLabel} · 1 u = 1 m · {date}
      </text>
      <text
        x={x + 10}
        y={y + 70}
        fill={HULL}
        fontSize={10}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {`M = ${fmt(telemetry.totalMass, 1)} t   Δv = ${fmt(telemetry.deltaV / 1000, 2)} km/s   CoM Z = ${fmt(telemetry.comZ, 1)} m`}
      </text>
      <text
        x={x + 10}
        y={y + 86}
        fill={DIM}
        fontSize={10}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {`Isp ${telemetry.isp ? `${Math.round(telemetry.isp)} s` : '—'}   ${tr('powerBalanceLabel')} ${telemetry.powerNet >= 0 ? '+' : ''}${fmt(telemetry.powerNet, 0)} kW   ${tr('spineMassLabel')} ${SPINE_DRY_MASS} t`}
      </text>
    </g>
  )
}

function Nomenclature({
  x,
  y,
  slots,
}: {
  x: number
  y: number
  slots: SpineSlot[]
}) {
  const { t: tr } = useLanguage()

  const slotNames: Record<string, string> = {
    forward: tr('slotForwardName'),
    median: tr('slotMedianName'),
    intermediate: tr('slotInterName'),
    aft: tr('slotAftName'),
  }

  const moduleNames: Record<string, string> = {
    ntp: tr('modNtpName'),
    ion: tr('modIonName'),
    'centrifuge-hab': tr('modCentrifugeName'),
    'heavy-cargo': tr('modHeavyCargoName'),
    'cargo-bay': tr('modCargoBayName'),
    'cryo-tanks': tr('modCryoTanksName'),
    'argon-tanks': tr('modArgonTanksName'),
    'docking-nose': tr('modDockingName'),
  }

  const rows = [
    { rep: 'S', name: tr('spineCentralName'), slot: tr('chassisSlotName'), mass: SPINE_DRY_MASS },
    ...slots.map((slot, i) => {
      const mod = getModuleStats(slot.mountedModuleId)
      const translatedName = mod ? (moduleNames[mod.id] ?? mod.name) : '—'
      const translatedSlot = slotNames[slot.id] ?? slot.name
      return {
        rep: String.fromCharCode(65 + i),
        name: translatedName,
        slot: translatedSlot,
        mass: mod ? mod.dryMass + mod.fuelMass : 0,
      }
    }),
  ]
  return (
    <g fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize={10}>
      <text x={x} y={y} fill={INK} fontWeight={700}>
        {tr('nomenclatureHeader')}
      </text>
      {rows.map((row, i) => (
        <text key={row.rep} x={x} y={y + 16 + i * 14} fill={HULL}>
          {`${row.rep}  ${row.name}  ·  ${row.slot}  ·  ${fmt(row.mass, 1)} t`}
        </text>
      ))}
    </g>
  )
}

function BlueprintSvg({
  view,
  slots,
  telemetry,
  title,
  svgRef,
}: {
  view: ViewKind
  slots: SpineSlot[]
  telemetry: ShipTelemetry
  title: string
  svgRef: RefObject<SVGSVGElement | null>
}) {
  const { t: tr } = useLanguage()
  const hasRing = slots.some((s) => s.mountedModuleId === 'centrifuge-hab')
  const hasHeavy = slots.some((s) => s.mountedModuleId === 'heavy-cargo')
  const layout = useMemo(() => {
    const W = 1200
    const H = 680
    const padL = 50
    const padR = 50
    const padT = 44
    const padB = 145
    const innerW = W - padL - padR
    const innerH = H - padT - padB
    if (view === 'face') {
      const ext = hasRing ? RING_RADIUS + 8 : hasHeavy ? 22 : 16
      const s = Math.min(innerW, innerH) / (2 * ext)
      const cx = padL + innerW / 2
      const cy = padT + innerH / 2
      const X = (x: number) => cx + x * s
      const Y = (y: number) => cy - y * s
      return { W, H, padL, padR, padT, padB, innerW, innerH, s, X, Y }
    }
    const z0 = -68
    const z1 = 68
    const yExt = hasRing ? RING_RADIUS + 8 : hasHeavy ? 28 : 32
    const s = Math.min(innerW / (z1 - z0), innerH / (2 * yExt))
    const zSpan = (z1 - z0) * s
    const x0 = padL + (innerW - zSpan) / 2
    const cy = padT + innerH / 2
    const X = (z: number) => x0 + (z - z0) * s
    const Y = (y: number) => cy - y * s
    return { W, H, padL, padR, padT, padB, innerW, innerH, s, X, Y }
  }, [view, hasRing, hasHeavy])

  const proj: Proj = { X: layout.X, Y: layout.Y, s: layout.s }
  const grid = 10

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${layout.W} ${layout.H}`}
      width={layout.W}
      height={layout.H}
      role="img"
      aria-label="Plan d’assemblage DSTV-80"
      style={{ width: '100%', height: '100%', background: PAPER }}
    >
      <rect width={layout.W} height={layout.H} fill={PAPER} />
      {view === 'profile' &&
        Array.from({ length: 14 }, (_, i) => {
          const z = -60 + i * grid
          return (
            <line
              key={`gz${z}`}
              x1={proj.X(z)}
              y1={layout.padT}
              x2={proj.X(z)}
              y2={layout.padT + layout.innerH}
              stroke="#12303c"
              strokeWidth={z === 0 ? 1 : 0.5}
            />
          )
        })}
      {view === 'profile' &&
        Array.from({ length: 11 }, (_, i) => {
          const y = -50 + i * grid
          return (
            <line
              key={`gy${y}`}
              x1={layout.padL}
              y1={proj.Y(y)}
              x2={layout.W - layout.padR}
              y2={proj.Y(y)}
              stroke="#12303c"
              strokeWidth={y === 0 ? 1 : 0.5}
            />
          )
        })}

      <text
        x={layout.W - layout.padR}
        y={28}
        textAnchor="end"
        fill={INK}
        fontSize={13}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={700}
      >
        {view === 'profile'
          ? tr('blueprintHeaderProfile')
          : tr('blueprintHeaderFace')}
      </text>

      {view === 'profile' ? (
        <>
          <ProfileModules proj={proj} slots={slots} />
          {slots.map((slot) => {
            const levelMap: Record<string, number> = {
              forward: 1,
              intermediate: 1,
              median: 2,
              aft: 2,
            }
            return (
              <SlotTick
                key={slot.id}
                proj={proj}
                slot={slot}
                labelY={layout.padT + 12}
                level={levelMap[slot.id] ?? 1}
                heavyCargoMounted={hasHeavy}
              />
            )
          })}
          <line
            x1={proj.X(telemetry.comZ)}
            y1={layout.padT + 18}
            x2={proj.X(telemetry.comZ)}
            y2={layout.padT + layout.innerH}
            stroke={COM}
            strokeDasharray="6 4"
            strokeWidth={1.4}
          />
          <g transform={`translate(${proj.X(telemetry.comZ)}, ${layout.padT + 10})`}>
            <rect
              x="-36"
              y="-9"
              width="72"
              height="18"
              rx="4"
              fill="#eab308"
              stroke="#fef08a"
              strokeWidth="0.8"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#020617"
              fontSize="10"
              fontWeight="800"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {`CoM ${telemetry.comZ.toFixed(1)} m`}
            </text>
          </g>
          <DimH
            x1={proj.X(Z_AFT)}
            x2={proj.X(Z_NOSE)}
            y={layout.padT + layout.innerH + 18}
            label={tr('overallLengthLabel')}
          />
        </>
      ) : (
        <>
          <FaceView proj={proj} slots={slots} />
          {hasRing && (
            <DimH
              x1={proj.X(-RING_RADIUS)}
              x2={proj.X(RING_RADIUS)}
              y={layout.padT + layout.innerH + 18}
              label="Ø 80 m  ·  R = 40 m"
            />
          )}
        </>
      )}

      <Nomenclature x={layout.padL} y={layout.H - 96} slots={slots} />
      <TitleBlock
        x={layout.W - 430}
        y={layout.H - 114}
        w={380}
        h={98}
        title={title}
        telemetry={telemetry}
        viewLabel={view === 'profile' ? tr('profileViewLabel') : tr('faceViewLabel')}
      />
    </svg>
  )
}

export function BlueprintOverlay({ onClose }: { onClose: () => void }) {
  const { t: tr, lang } = useLanguage()
  const { spineSlots, activePreset } = useShipConfiguration()
  const telemetry = useShipTelemetry()
  const [view, setView] = useState<ViewKind>('profile')
  const svgRef = useRef<SVGSVGElement>(null)
  const presetLabels: Record<string, string> = {
    liner: tr('presetLinerName'),
    hauler: tr('presetHaulerName'),
    tug: tr('presetTugName'),
  }
  const title = activePreset ? (presetLabels[activePreset] ?? configTitle(activePreset)) : tr('customConfigTitle')
  const stem = fileStem(activePreset)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function downloadSvg() {
    const svg = svgRef.current
    if (!svg) return
    const xml = new XMLSerializer().serializeToString(svg)
    downloadBlob(
      new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }),
      `${stem}.svg`,
    )
  }

  function downloadPng() {
    const svg = svgRef.current
    if (!svg) return
    const xml = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 2400
      canvas.height = 1280
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((out) => {
        if (out) downloadBlob(out, `${stem}.png`)
      }, 'image/png')
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col bg-[#05070d] p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView('profile')}
            className={`rounded-lg px-2.5 py-1.5 text-[0.78rem] font-semibold ${
              view === 'profile'
                ? 'bg-cyan-700 text-white'
                : 'bg-slate-800 text-slate-50 ring-1 ring-white/15'
            }`}
          >
            {lang === 'en' ? 'Profile View' : 'Vue de profil'}
          </button>
          <button
            type="button"
            onClick={() => setView('face')}
            className={`rounded-lg px-2.5 py-1.5 text-[0.78rem] font-semibold ${
              view === 'face'
                ? 'bg-cyan-700 text-white'
                : 'bg-slate-800 text-slate-50 ring-1 ring-white/15'
            }`}
          >
            {lang === 'en' ? 'Front View' : 'Vue de face'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadSvg}
            className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[0.78rem] font-semibold text-slate-50 ring-1 ring-white/15 hover:bg-slate-700"
          >
            {tr('exportSvg')}
          </button>
          <button
            type="button"
            onClick={downloadPng}
            className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[0.78rem] font-semibold text-slate-50 ring-1 ring-white/15 hover:bg-slate-700"
          >
            {tr('exportPng')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-950/90 px-2.5 py-1.5 text-[0.78rem] font-semibold text-white ring-1 ring-white/15 hover:bg-slate-800"
          >
            {tr('close')}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl ring-1 ring-cyan-400/20">
        <BlueprintSvg
          view={view}
          slots={spineSlots}
          telemetry={telemetry}
          title={title}
          svgRef={svgRef}
        />
      </div>
    </div>
  )
}
