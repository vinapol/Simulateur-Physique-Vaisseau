import { useEffect, useMemo, type MutableRefObject, type RefObject } from 'react'
import type { ChartMapper } from './ParabolaChart'
import type { TrajectoryPoint } from '../physics/types'

type RectilinearChartProps = {
  /** Points avec x = t, y = position */
  data: TrajectoryPoint[]
  objectRef: RefObject<SVGCircleElement | null>
  mapRef: MutableRefObject<ChartMapper | null>
  /** object.x = t, object.y = position */
  object: { x: number; y: number }
}

function formatNum(n: number) {
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 100) return n.toFixed(1)
  if (Math.abs(n) >= 10) return n.toFixed(2)
  return n.toFixed(2)
}

export function RectilinearChart({
  data,
  objectRef,
  mapRef,
  object,
}: RectilinearChartProps) {
  const layout = useMemo(() => {
    const size = { w: 720, h: 420 }
    const margin = { top: 24, right: 24, bottom: 40, left: 56 }
    const innerW = size.w - margin.left - margin.right
    const innerH = size.h - margin.top - margin.bottom

    const ts = data.map((p) => p.x)
    const xs = data.map((p) => p.y)
    const tMax = Math.max(...ts, 1e-3)
    const xMin = Math.min(...xs, 0)
    const xMax = Math.max(...xs, 0)
    const xSpan = Math.max(xMax - xMin, 1e-3)
    const yPad = xSpan * 0.1
    const y0 = xMin - yPad
    const y1 = xMax + yPad
    const t1 = tMax * 1.04

    const toSvg: ChartMapper = (t, xPos) => ({
      sx: margin.left + (t / t1) * innerW,
      sy: margin.top + (1 - (xPos - y0) / (y1 - y0)) * innerH,
    })

    const path = data
      .map((p, i) => {
        const { sx, sy } = toSvg(p.x, p.y)
        return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)} ${sy.toFixed(2)}`
      })
      .join(' ')

    const zeroY = toSvg(0, 0).sy
    const originT = toSvg(0, y0)
    const tTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * t1)
    const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => y0 + f * (y1 - y0))
    const obj = toSvg(
      Number.isFinite(object.x) ? object.x : 0,
      Number.isFinite(object.y) ? object.y : 0,
    )

    return {
      size,
      path,
      toSvg,
      zeroY,
      originT,
      tTicks,
      xTicks,
      obj,
      t1,
      y0,
      y1,
      showZero: y0 < 0 && y1 > 0,
    }
  }, [data, object.x, object.y])

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
        aria-label="Position en fonction du temps"
      >
        <defs>
          <linearGradient id="rectFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {layout.xTicks.map((val) => {
          const a = layout.toSvg(0, val)
          const b = layout.toSvg(layout.t1, val)
          return (
            <line
              key={`xg-${val}`}
              x1={a.sx}
              y1={a.sy}
              x2={b.sx}
              y2={b.sy}
              stroke="var(--grid)"
              strokeDasharray="4 6"
            />
          )
        })}

        {layout.showZero && (
          <line
            x1={layout.toSvg(0, 0).sx}
            y1={layout.zeroY}
            x2={layout.toSvg(layout.t1, 0).sx}
            y2={layout.zeroY}
            stroke="var(--axis)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        )}

        <line
          x1={layout.originT.sx}
          y1={layout.toSvg(0, layout.y1).sy}
          x2={layout.originT.sx}
          y2={layout.toSvg(0, layout.y0).sy}
          stroke="var(--axis)"
          strokeWidth="1"
        />
        <line
          x1={layout.originT.sx}
          y1={layout.toSvg(0, layout.y0).sy}
          x2={layout.toSvg(layout.t1, layout.y0).sx}
          y2={layout.toSvg(0, layout.y0).sy}
          stroke="var(--axis)"
          strokeWidth="1"
        />

        {layout.tTicks.map((t) => {
          const p = layout.toSvg(t, layout.y0)
          return (
            <text
              key={`tt-${t}`}
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
        {layout.xTicks.map((val) => {
          const p = layout.toSvg(0, val)
          return (
            <text
              key={`xt-${val}`}
              x={14}
              y={p.sy + 4}
              textAnchor="start"
              fill="var(--muted)"
              fontSize="12"
              fontFamily="var(--font-body)"
            >
              {formatNum(val)}
            </text>
          )
        })}

        <text
          x={layout.size.w - 16}
          y={layout.toSvg(0, layout.y0).sy - 8}
          textAnchor="end"
          fill="var(--muted)"
          fontSize="12"
          fontFamily="var(--font-body)"
        >
          t (s)
        </text>
        <text
          x={layout.originT.sx + 8}
          y={20}
          textAnchor="start"
          fill="var(--muted)"
          fontSize="12"
          fontFamily="var(--font-body)"
        >
          x (m)
        </text>

        <path
          d={layout.path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

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
