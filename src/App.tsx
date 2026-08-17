import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircularChart } from './components/CircularChart'
import { ParamSlider } from './components/ParamSlider'
import {
  ParabolaChart,
  type ChartMapper,
} from './components/ParabolaChart'
import { PlaybackControls } from './components/PlaybackControls'
import { RectilinearChart } from './components/RectilinearChart'
import { useShipTelemetry } from './hooks/useShipTelemetry'
import { useLanguage } from './i18n/LanguageContext'

const ShipViewer = lazy(async () => {
  const mod = await import('./components/spacecraft/ShipViewer')
  return { default: mod.ShipViewer }
})
import { useTrajectoryPlayback } from './hooks/useTrajectoryPlayback'
import {
  computeCircularStats,
  positionAt as circularPositionAt,
  type CircularParams,
} from './physics/circular'
import {
  computeStats,
  sampleTrajectory,
  xAt as parabolaXAt,
  yAt as parabolaYAt,
  type ProjectileParams,
} from './physics/projectile'
import {
  computeRectilinearStats,
  sampleRectilinear,
  vAt as rectVAt,
  xAt as rectXAt,
  type RectilinearParams,
} from './physics/rectilinear'
import './App.css'

type MotionKind = 'parabola' | 'circle' | 'linear' | 'ship'

const PARABOLA_DEFAULTS: ProjectileParams = {
  vx0: 25 * Math.cos(Math.PI / 4),
  vy0: 25 * Math.sin(Math.PI / 4),
  y0: 0,
  g: 9.81,
}

const CIRCLE_DEFAULTS: CircularParams = {
  radius: 5,
  omega0: 1.2,
  alpha: 0.4,
  theta0: 0,
  duration: 8,
}

const LINEAR_DEFAULTS: RectilinearParams = {
  x0: 0,
  v0: 8,
  a: -1.5,
  duration: 10,
}

function format(n: number, digits = 2) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

function paramsKey(value: unknown) {
  return JSON.stringify(value)
}

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const [motion, setMotion] = useState<MotionKind>('ship')
  const [parabola, setParabola] = useState<ProjectileParams>(PARABOLA_DEFAULTS)
  const [circle, setCircle] = useState<CircularParams>(CIRCLE_DEFAULTS)
  const [linear, setLinear] = useState<RectilinearParams>(LINEAR_DEFAULTS)
  const [speed, setSpeed] = useState(1)
  const shipTelemetry = useShipTelemetry()

  const meta = {
    title: t(
      motion === 'parabola'
        ? 'titleParabola'
        : motion === 'circle'
          ? 'titleCircle'
          : motion === 'linear'
            ? 'titleLinear'
            : 'titleShip',
    ),
    lead: t(
      motion === 'parabola'
        ? 'leadParabola'
        : motion === 'circle'
          ? 'leadCircle'
          : motion === 'linear'
            ? 'leadLinear'
            : 'leadShip',
    ),
    hint: t(
      motion === 'parabola'
        ? 'hintParabola'
        : motion === 'circle'
          ? 'hintCircle'
          : motion === 'linear'
            ? 'hintLinear'
            : 'hintShip',
    ),
  }

  useEffect(() => {
    document.title = `Simulateur Physique — ${meta.title}`
  }, [meta.title])

  const objectRef = useRef<SVGCircleElement | null>(null)
  const radiusLineRef = useRef<SVGLineElement | null>(null)
  const mapRef = useRef<ChartMapper | null>(null)
  const parabolaRef = useRef(parabola)
  const circleRef = useRef(circle)
  const linearRef = useRef(linear)
  parabolaRef.current = parabola
  circleRef.current = circle
  linearRef.current = linear

  const setParabolaKey =
    (key: keyof ProjectileParams) =>
    (value: number) =>
      setParabola((prev) => ({ ...prev, [key]: value }))

  const setCircleKey =
    (key: keyof CircularParams) =>
    (value: number) =>
      setCircle((prev) => ({ ...prev, [key]: value }))

  const setLinearKey =
    (key: keyof RectilinearParams) =>
    (value: number) =>
      setLinear((prev) => ({ ...prev, [key]: value }))

  const parabolaTrajectory = useMemo(
    () => sampleTrajectory(parabola, 180),
    [parabola],
  )
  const parabolaStats = useMemo(() => computeStats(parabola), [parabola])
  const circleStats = useMemo(() => computeCircularStats(circle), [circle])
  const linearTrajectory = useMemo(
    () => sampleRectilinear(linear, 200),
    [linear],
  )
  const linearStats = useMemo(() => computeRectilinearStats(linear), [linear])

  const duration =
    motion === 'parabola'
      ? parabolaStats.flightTime
      : motion === 'circle'
        ? Math.max(circle.duration, 1e-6)
        : Math.max(linear.duration, 1e-6)

  const resetKey =
    motion === 'parabola'
      ? paramsKey(parabola)
      : motion === 'circle'
        ? paramsKey(circle)
        : paramsKey(linear)

  const placeObject = useCallback(
    (tVal: number) => {
      const map = mapRef.current
      const el = objectRef.current
      if (!map || !el) return

      let px = 0
      let py = 0

      if (motion === 'parabola') {
        const p = parabolaRef.current
        const tf = Math.min(Math.max(tVal, 0), 3600)
        px = parabolaXAt(tf, p)
        py = Math.max(parabolaYAt(tf, p), 0)
      } else if (motion === 'circle') {
        const pos = circularPositionAt(tVal, circleRef.current)
        px = pos.x
        py = pos.y
        const line = radiusLineRef.current
        if (line) {
          const mapped = map(px, py)
          line.setAttribute('x2', String(mapped.sx))
          line.setAttribute('y2', String(mapped.sy))
        }
      } else if (motion === 'linear') {
        px = tVal
        py = rectXAt(tVal, linearRef.current)
      } else {
        return
      }

      if (!Number.isFinite(px) || !Number.isFinite(py)) return
      const { sx, sy } = map(px, py)
      el.setAttribute('cx', String(sx))
      el.setAttribute('cy', String(sy))
    },
    [motion],
  )

  const playback = useTrajectoryPlayback({
    duration,
    speed,
    loop: true,
    resetKey: `${motion}:${resetKey}`,
    autoPlay: motion !== 'ship',
    uiHz: 10,
    onFrame: placeObject,
  })

  const objectPos = useMemo(() => {
    if (motion === 'parabola') {
      const tVal = Math.min(playback.time, parabolaStats.flightTime)
      return {
        x: parabolaXAt(tVal, parabola),
        y: Math.max(parabolaYAt(tVal, parabola), 0),
      }
    }
    if (motion === 'circle') {
      return circularPositionAt(playback.time, circle)
    }
    if (motion === 'linear') {
      return {
        x: playback.time,
        y: rectXAt(playback.time, linear),
      }
    }
    return { x: 0, y: 0 }
  }, [
    motion,
    playback.time,
    parabola,
    parabolaStats.flightTime,
    circle,
    linear,
  ])

  const positionLabel =
    motion === 'linear'
      ? format(objectPos.y, 1)
      : `(${format(objectPos.x, 1)} ; ${format(objectPos.y, 1)})`

  return (
    <div className="app">
      <div className="app__bg" aria-hidden />

      <header className={`hero${motion === 'ship' ? ' hero--ship' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <p className="hero__brand inline-flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400 shrink-0" viewBox="0 0 100 100" fill="none" stroke="currentColor">
              <ellipse cx="50" cy="50" rx="42" ry="18" strokeWidth="7" transform="rotate(-30 50 50)" stroke="#38bdf8" />
              <circle cx="21" cy="33" r="7" fill="#38bdf8" stroke="none" />
              <circle cx="50" cy="50" r="9" fill="#2dd4bf" stroke="none" />
            </svg>
            <span>{t('brandName')}</span>
          </p>
          <div className="inline-flex rounded-full border border-cyan-500/40 bg-slate-900/90 p-0.5 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={`rounded-full px-3 py-1 text-xs font-extrabold transition ${
                lang === 'fr' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              🇫🇷 FR
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-full px-3 py-1 text-xs font-extrabold transition ${
                lang === 'en' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        <h1 className="hero__title">{meta.title}</h1>
        <p className="hero__lead">{meta.lead}</p>

        <nav className="motion-nav" aria-label="Type de mouvement">
          {(
            [
              ['parabola', t('navParabola')],
              ['circle', t('navCircle')],
              ['linear', t('navLinear')],
              ['ship', t('navShip')],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className={`motion-nav__btn${motion === kind ? ' is-active' : ''}`}
              onClick={() => setMotion(kind)}
              aria-pressed={motion === kind}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className={`layout${motion === 'ship' ? ' layout--ship' : ''}`}>
        {motion !== 'ship' && (
          <aside className="panel">
            <h2 className="panel__title">{t('parametersTitle')}</h2>

            {motion === 'parabola' && (
              <>
                <ParamSlider
                  id="vx0"
                  label={t('vx0Label')}
                  symbol="vx₀"
                  value={Number(parabola.vx0.toFixed(2))}
                  min={0}
                  max={200}
                  step={0.5}
                  unit="m/s"
                  inputMin={-500}
                  inputMax={2000}
                  onChange={setParabolaKey('vx0')}
                />
                <ParamSlider
                  id="vy0"
                  label={t('vy0Label')}
                  symbol="vy₀"
                  value={Number(parabola.vy0.toFixed(2))}
                  min={-50}
                  max={200}
                  step={0.5}
                  unit="m/s"
                  inputMin={-500}
                  inputMax={2000}
                  onChange={setParabolaKey('vy0')}
                />
                <ParamSlider
                  id="y0"
                  label={t('y0Label')}
                  symbol="Y₀"
                  value={parabola.y0}
                  min={0}
                  max={200}
                  step={0.5}
                  unit="m"
                  inputMin={0}
                  inputMax={5000}
                  onChange={setParabolaKey('y0')}
                />
                <ParamSlider
                  id="g"
                  label={t('gLabel')}
                  symbol="g"
                  value={parabola.g}
                  min={0.1}
                  max={30}
                  step={0.01}
                  unit="m/s²"
                  inputMin={0.01}
                  inputMax={100}
                  onChange={setParabolaKey('g')}
                />
                <button
                  type="button"
                  className="reset"
                  onClick={() => setParabola(PARABOLA_DEFAULTS)}
                >
                  {t('resetBtn')}
                </button>
                <div className="formulas">
                  <h3 className="formulas__title">{t('equationsTitle')}</h3>
                  <p className="formulas__eq">
                    <em>x</em>(t) = vx₀ · t
                  </p>
                  <p className="formulas__eq">
                    <em>y</em>(t) = Y₀ + vy₀ · t − ½ · g · t²
                  </p>
                  <p className="formulas__note">
                    {t('eqParabolaNote')}
                  </p>
                  <p className="formulas__derived">
                    V₀ = {format(parabolaStats.v0)} m/s
                    <span aria-hidden> · </span>
                    θ = {format(parabolaStats.thetaDeg, 1)}°
                  </p>
                </div>
              </>
            )}

            {motion === 'circle' && (
              <>
                <ParamSlider
                  id="radius"
                  label={t('radiusLabel')}
                  symbol="R"
                  value={circle.radius}
                  min={0.1}
                  max={100}
                  step={0.1}
                  unit="m"
                  inputMin={0.01}
                  inputMax={10000}
                  onChange={setCircleKey('radius')}
                />
                <ParamSlider
                  id="omega0"
                  label={t('omega0Label')}
                  symbol="ω₀"
                  value={circle.omega0}
                  min={-20}
                  max={20}
                  step={0.05}
                  unit="rad/s"
                  inputMin={-200}
                  inputMax={200}
                  onChange={setCircleKey('omega0')}
                />
                <ParamSlider
                  id="alpha"
                  label={t('alphaLabel')}
                  symbol="α"
                  value={circle.alpha}
                  min={-10}
                  max={10}
                  step={0.05}
                  unit="rad/s²"
                  inputMin={-100}
                  inputMax={100}
                  onChange={setCircleKey('alpha')}
                />
                <ParamSlider
                  id="theta0"
                  label={t('theta0Label')}
                  symbol="θ₀"
                  value={(circle.theta0 * 180) / Math.PI}
                  min={-360}
                  max={360}
                  step={1}
                  unit="°"
                  inputMin={-3600}
                  inputMax={3600}
                  onChange={(deg) =>
                    setCircle((prev) => ({
                      ...prev,
                      theta0: (deg * Math.PI) / 180,
                    }))
                  }
                />
                <ParamSlider
                  id="duration"
                  label={t('durationSimLabel')}
                  symbol="T"
                  value={circle.duration}
                  min={0.5}
                  max={120}
                  step={0.5}
                  unit="s"
                  inputMin={0.1}
                  inputMax={3600}
                  onChange={setCircleKey('duration')}
                />
                <button
                  type="button"
                  className="reset"
                  onClick={() => setCircle(CIRCLE_DEFAULTS)}
                >
                  {t('resetBtn')}
                </button>
                <div className="formulas">
                  <h3 className="formulas__title">{t('equationsTitle')}</h3>
                  <p className="formulas__eq">
                    <em>ω</em>(t) = ω₀ + α · t
                  </p>
                  <p className="formulas__eq">
                    <em>θ</em>(t) = θ₀ + ω₀ · t + ½ · α · t²
                  </p>
                  <p className="formulas__eq">
                    <em>x</em> = R · cos(θ) &nbsp;·&nbsp; <em>y</em> = R · sin(θ)
                  </p>
                </div>
              </>
            )}

            {motion === 'linear' && (
              <>
                <ParamSlider
                  id="x0"
                  label={t('x0Label')}
                  symbol="x₀"
                  value={linear.x0}
                  min={-100}
                  max={100}
                  step={0.5}
                  unit="m"
                  inputMin={-10000}
                  inputMax={10000}
                  onChange={setLinearKey('x0')}
                />
                <ParamSlider
                  id="v0-linear"
                  label={t('v0LinearLabel')}
                  symbol="v₀"
                  value={linear.v0}
                  min={-50}
                  max={50}
                  step={0.5}
                  unit="m/s"
                  inputMin={-500}
                  inputMax={500}
                  onChange={setLinearKey('v0')}
                />
                <ParamSlider
                  id="a-linear"
                  label={t('aLinearLabel')}
                  symbol="a"
                  value={linear.a}
                  min={-20}
                  max={20}
                  step={0.1}
                  unit="m/s²"
                  inputMin={-200}
                  inputMax={200}
                  onChange={setLinearKey('a')}
                />
                <ParamSlider
                  id="duration-linear"
                  label={t('durationSimLabel')}
                  symbol="T"
                  value={linear.duration}
                  min={0.5}
                  max={120}
                  step={0.5}
                  unit="s"
                  inputMin={0.1}
                  inputMax={3600}
                  onChange={setLinearKey('duration')}
                />
                <button
                  type="button"
                  className="reset"
                  onClick={() => setLinear(LINEAR_DEFAULTS)}
                >
                  {t('resetBtn')}
                </button>
                <div className="formulas">
                  <h3 className="formulas__title">{t('equationsTitle')}</h3>
                  <p className="formulas__eq">
                    <em>x</em>(t) = x₀ + v₀ · t + ½ · a · t²
                  </p>
                  <p className="formulas__eq">
                    <em>v</em>(t) = v₀ + a · t
                  </p>
                </div>
              </>
            )}
          </aside>
        )}

        <section className={`stage${motion === 'ship' ? ' stage--ship' : ''}`}>
          {motion !== 'ship' && (
            <div className="stage__head">
              <h2 className="stage__title">
                {motion === 'linear' ? t('plotXtTitle') : t('trajectoryTitle')}
              </h2>
              <p className="stage__hint">{meta.hint}</p>
            </div>
          )}

          {motion === 'ship' && (
            <Suspense
              fallback={
                <div className="flex h-[min(calc(100dvh-12rem),56rem)] min-h-[32rem] items-center justify-center rounded-[14px] bg-[#05070d] text-slate-300">
                  {t('loadingShip')}
                </div>
              }
            >
              <ShipViewer />
            </Suspense>
          )}

          {motion === 'parabola' && (
            <ParabolaChart
              data={parabolaTrajectory}
              landmark={{
                x: parabolaXAt(parabolaStats.timeToMaxHeight, parabola),
                y: parabolaStats.maxHeight,
              }}
              objectRef={objectRef}
              mapRef={mapRef}
              object={objectPos}
            />
          )}
          {motion === 'circle' && (
            <CircularChart
              radius={circle.radius}
              objectRef={objectRef}
              radiusLineRef={radiusLineRef}
              mapRef={mapRef}
              object={objectPos}
            />
          )}
          {motion === 'linear' && (
            <RectilinearChart
              data={linearTrajectory}
              objectRef={objectRef}
              mapRef={mapRef}
              object={objectPos}
            />
          )}

          {motion !== 'ship' && (
            <PlaybackControls
              playing={playback.playing}
              time={playback.time}
              duration={playback.duration}
              speed={speed}
              onToggle={playback.toggle}
              onReset={playback.reset}
              onSeek={playback.seek}
              onSpeedChange={setSpeed}
            />
          )}

          {motion === 'parabola' && (
            <dl className="stats">
              <div className="stats__item">
                <dt>{t('statRange')}</dt>
                <dd>
                  {format(parabolaStats.range)} <span>m</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('statMaxHeight')}</dt>
                <dd>
                  {format(parabolaStats.maxHeight)} <span>m</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('statFlightTime')}</dt>
                <dd>
                  {format(parabolaStats.flightTime)} <span>s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('statPosition')}</dt>
                <dd>{positionLabel}</dd>
              </div>
            </dl>
          )}

          {motion === 'circle' && (
            <dl className="stats">
              <div className="stats__item">
                <dt>{t('statOmegaFinal')}</dt>
                <dd>
                  {format(circleStats.omegaFinal)} <span>rad/s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('statRevolutions')}</dt>
                <dd>
                  {format(circleStats.revolutions)} <span>{t('unitRev')}</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('statLinearSpeed')}</dt>
                <dd>
                  {format(circleStats.linearSpeedFinal)} <span>m/s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('statPosition')}</dt>
                <dd>{positionLabel}</dd>
              </div>
            </dl>
          )}

          {motion === 'linear' && (
            <dl className="stats">
              <div className="stats__item">
                <dt>{t('statXFinal')}</dt>
                <dd>
                  {format(linearStats.xFinal)} <span>m</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('statVFinal')}</dt>
                <dd>
                  {format(linearStats.vFinal)} <span>m/s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('statDisplacement')}</dt>
                <dd>
                  {format(linearStats.displacement)} <span>m</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>v(t)</dt>
                <dd>
                  {format(rectVAt(playback.time, linear))} <span>m/s</span>
                </dd>
              </div>
            </dl>
          )}

          {motion === 'ship' && (
            <dl className="stats">
              <div className="stats__item">
                <dt>{t('dryMass')}</dt>
                <dd>
                  {format(shipTelemetry.totalMass, 0)} <span>t</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('deltaV')}</dt>
                <dd>
                  {format(shipTelemetry.deltaV / 1000)} <span>km/s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>{t('comZ')}</dt>
                <dd>
                  {format(shipTelemetry.comZ, 1)} <span>m</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>a</dt>
                <dd>
                  {format(shipTelemetry.acceleration * 1000, 2)}{' '}
                  <span>mm/s²</span>
                </dd>
              </div>
            </dl>
          )}
        </section>
      </main>
    </div>
  )
}
