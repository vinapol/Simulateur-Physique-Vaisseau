import { useEffect, useMemo, type MutableRefObject, type RefObject } from 'react'
import type { TrajectoryPoint } from '../physics/types'

export type ChartMapper = (x: number, y: number) => { sx: number; sy: number }

type ParabolaChartProps = {
  data: TrajectoryPoint[]
  landmark?: { x: number; y: number } | null
  objectRef: RefObject<SVGCircleElement | null>
  mapRef: MutableRefObject<ChartMapper | null>
  object: { x: number; y: number }
}

function formatNum(n: number) {
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 100) return n.toFixed(1)
  if (Math.abs(n) >= 10) return n.toFixed(2)
  return n.toFixed(2)
}

export function ParabolaChart({
  data,
  landmark = null,
  objectRef,
  mapRef,
  object,
}: ParabolaChartProps) {
  const layout = useMemo(() => {
    const size = { w: 720, h: 420 }
    const margin = { top: 24, right: 24, bottom: 40, left: 52 }
    const innerW = size.w - margin.left - margin.right
    const innerH = size.h - margin.top - margin.bottom

    const xs = data.map((p) => p.x)
    const ys = data.map((p) => p.y)
    const xMax = Math.max(...xs, 1e-3)
    const yMax = Math.max(...ys, landmark?.y ?? 0, 1e-3)
    const x1 = xMax * 1.06
    const y1 = yMax * 1.1

    const toSvg: ChartMapper = (x, y) => ({
      sx: margin.left + (x / x1) * innerW,
      sy: margin.top + (1 - y / y1) * innerH,
    })

    const path = data
      .map((p, i) => {
        const { sx, sy } = toSvg(p.x, p.y)
        return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)} ${sy.toFixed(2)}`
      })
      .join(' ')

    const end = toSvg(data[data.length - 1]?.x ?? 0, 0)
    const origin = toSvg(0, 0)
    const area = `${path} L${end.sx.toFixed(2)} ${origin.sy.toFixed(2)} L${origin.sx.toFixed(2)} ${origin.sy.toFixed(2)} Z`

    const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * x1)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * y1)
    const apex = landmark ? toSvg(landmark.x, landmark.y) : null
    const obj = toSvg(
      Number.isFinite(object.x) ? object.x : 0,
      Number.isFinite(object.y) ? Math.max(object.y, 0) : 0,
    )

    return { size, path, area, xTicks, yTicks, toSvg, origin, apex, obj, x1, y1 }
  }, [data, landmark, object.x, object.y])

  useEffect(() => {
    mapRef.current = layout.toSvg
    return () => {
      mapRef.current = null
    }
  }, [layout.toSvg, mapRef])

  useEffect(() => {
    const el = objectRef.current
    if (!el) return
    el.setAttribute('cx', String(layout.obj.sx))
    el.setAttribute('cy', String(layout.obj.sy))
  }, [layout.obj.sx, layout.obj.sy, objectRef])

  return (
    <div className="chart">
      <svg
        className="traj-svg"
        viewBox={`0 0 ${layout.size.w} ${layout.size.h}`}
        role="img"
        aria-label="Trajectoire parabolique"
      >
        <defs>
          <linearGradient id="parabFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {layout.yTicks.map((t) => {
          const p = layout.toSvg(0, t)
          const q = layout.toSvg(layout.x1, t)
          return (
            <line
              key={`yg-${t}`}
              x1={p.sx}
              y1={p.sy}
              x2={q.sx}
              y2={q.sy}
              stroke="var(--grid)"
              strokeDasharray="4 6"
            />
          )
        })}

        <line
          x1={layout.origin.sx}
          y1={layout.toSvg(0, layout.y1).sy}
          x2={layout.origin.sx}
          y2={layout.origin.sy}
          stroke="var(--axis)"
          strokeWidth="1"
        />
        <line
          x1={layout.origin.sx}
          y1={layout.origin.sy}
          x2={layout.toSvg(layout.x1, 0).sx}
          y2={layout.origin.sy}
          stroke="var(--axis)"
          strokeWidth="1"
        />

        {layout.xTicks.map((t) => {
          const p = layout.toSvg(t, 0)
          return (
            <text
              key={`xt-${t}`}
              x={p.sx}
              y={layout.size.h - 14}
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="12"
              fontFamily="var(--font-body)"
            >
              {formatNum(t)}
            </text>
          )
        })}
        {layout.yTicks.map((t) => {
          const p = layout.toSvg(0, t)
          return (
            <text
              key={`yt-${t}`}
              x={18}
              y={p.sy + 4}
              textAnchor="start"
              fill="var(--muted)"
              fontSize="12"
              fontFamily="var(--font-body)"
            >
              {formatNum(t)}
            </text>
          )
        })}

        <text
          x={layout.size.w - 16}
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
          y={20}
          textAnchor="start"
          fill="var(--muted)"
          fontSize="12"
          fontFamily="var(--font-body)"
        >
          y (m)
        </text>

        <path d={layout.area} fill="url(#parabFill)" stroke="none" />
        <path
          d={layout.path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {layout.apex && (
          <circle
            cx={layout.apex.sx}
            cy={layout.apex.sy}
            r="4.5"
            fill="var(--highlight)"
            stroke="#fff"
            strokeWidth="1.5"
          />
        )}

        <circle
          ref={objectRef}
          cx={layout.obj.sx}
          cy={layout.obj.sy}
          r="7"
          fill="var(--ink)"
          stroke="#fff"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  )
}
