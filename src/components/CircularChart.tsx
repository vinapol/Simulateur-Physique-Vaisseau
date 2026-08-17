import { useEffect, useMemo, type MutableRefObject, type RefObject } from 'react'
import type { ChartMapper } from './ParabolaChart'

type CircularChartProps = {
  radius: number
  objectRef: RefObject<SVGCircleElement | null>
  radiusLineRef?: RefObject<SVGLineElement | null>
  mapRef: MutableRefObject<ChartMapper | null>
  object: { x: number; y: number }
}

function formatNum(n: number) {
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 100) return n.toFixed(1)
  if (Math.abs(n) >= 10) return n.toFixed(2)
  return n.toFixed(2)
}

export function CircularChart({
  radius,
  objectRef,
  radiusLineRef,
  mapRef,
  object,
}: CircularChartProps) {
  const layout = useMemo(() => {
    const pad = 1.2
    const lim = Math.max(radius * pad, 1e-3)
    const size = 520
    const margin = { top: 28, right: 28, bottom: 40, left: 48 }
    const innerW = size - margin.left - margin.right
    const innerH = size - margin.top - margin.bottom
    const scale = Math.min(innerW, innerH) / (2 * lim)

    const toSvg: ChartMapper = (x, y) => ({
      sx: margin.left + innerW / 2 + x * scale,
      sy: margin.top + innerH / 2 - y * scale,
    })

    const ticks = [-lim, -lim / 2, 0, lim / 2, lim]
    const origin = toSvg(0, 0)
    const obj = toSvg(
      Number.isFinite(object.x) ? object.x : radius,
      Number.isFinite(object.y) ? object.y : 0,
    )

    return { size, lim, ticks, toSvg, origin, obj, scale }
  }, [radius, object.x, object.y])

  useEffect(() => {
    mapRef.current = layout.toSvg
    return () => {
      mapRef.current = null
    }
  }, [layout.toSvg, mapRef])

  useEffect(() => {
    const el = objectRef.current
    if (el) {
      el.setAttribute('cx', String(layout.obj.sx))
      el.setAttribute('cy', String(layout.obj.sy))
    }
    const line = radiusLineRef?.current
    if (line) {
      line.setAttribute('x2', String(layout.obj.sx))
      line.setAttribute('y2', String(layout.obj.sy))
    }
  }, [layout.obj.sx, layout.obj.sy, objectRef, radiusLineRef])

  return (
    <div className="chart chart--square">
      <svg
        className="circle-svg"
        viewBox={`0 0 ${layout.size} ${layout.size}`}
        role="img"
        aria-label="Trajectoire circulaire"
      >
        <defs>
          <linearGradient id="orbitStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-deep)" />
          </linearGradient>
        </defs>

        <line
          x1={layout.origin.sx - layout.lim * layout.scale}
          y1={layout.origin.sy}
          x2={layout.origin.sx + layout.lim * layout.scale}
          y2={layout.origin.sy}
          stroke="var(--axis)"
          strokeWidth="1"
        />
        <line
          x1={layout.origin.sx}
          y1={layout.origin.sy - layout.lim * layout.scale}
          x2={layout.origin.sx}
          y2={layout.origin.sy + layout.lim * layout.scale}
          stroke="var(--axis)"
          strokeWidth="1"
        />

        {layout.ticks.map((t) => {
          const p = layout.toSvg(t, 0)
          const q = layout.toSvg(0, t)
          return (
            <g key={t}>
              <text
                x={p.sx}
                y={layout.size - 14}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize="12"
                fontFamily="var(--font-body)"
              >
                {formatNum(t)}
              </text>
              <text
                x={18}
                y={q.sy + 4}
                textAnchor="start"
                fill="var(--muted)"
                fontSize="12"
                fontFamily="var(--font-body)"
              >
                {formatNum(t)}
              </text>
            </g>
          )
        })}

        <text
          x={layout.size - 20}
          y={layout.origin.sy - 8}
          textAnchor="end"
          fill="var(--muted)"
          fontSize="12"
          fontFamily="var(--font-body)"
        >
          x (m)
        </text>
        <text
          x={layout.origin.sx + 8}
          y={24}
          textAnchor="start"
          fill="var(--muted)"
          fontSize="12"
          fontFamily="var(--font-body)"
        >
          y (m)
        </text>

        {/* Trajectoire géométrique = un seul cercle de rayon R */}
        <circle
          cx={layout.origin.sx}
          cy={layout.origin.sy}
          r={radius * layout.scale}
          fill="color-mix(in srgb, var(--accent) 8%, transparent)"
          stroke="url(#orbitStroke)"
          strokeWidth="2.75"
        />

        <circle
          cx={layout.origin.sx}
          cy={layout.origin.sy}
          r="3.5"
          fill="var(--muted)"
        />

        <line
          ref={radiusLineRef}
          x1={layout.origin.sx}
          y1={layout.origin.sy}
          x2={layout.obj.sx}
          y2={layout.obj.sy}
          stroke="color-mix(in srgb, var(--highlight) 55%, transparent)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />

        <circle
          ref={objectRef}
          cx={layout.obj.sx}
          cy={layout.obj.sy}
          r="8"
          fill="var(--ink)"
          stroke="#fff"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  )
}
