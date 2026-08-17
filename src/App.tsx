import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { CircularChart } from './components/CircularChart'
import { ParamSlider } from './components/ParamSlider'
import {
  ParabolaChart,
  type ChartMapper,
} from './components/ParabolaChart'
import { PlaybackControls } from './components/PlaybackControls'
import { RectilinearChart } from './components/RectilinearChart'
import {
  DEFAULT_OMEGA,
  G,
  RING_RADIUS,
} from './components/spacecraft/constants'

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

const MOTION_META: Record<
  MotionKind,
  { title: string; lead: string; hint: string }
> = {
  parabola: {
    title: 'Mouvement parabolique',
    lead: 'Ajuste indépendamment vx₀ et vy₀ : la trajectoire et l’objet se mettent à jour en direct.',
    hint: 'Point sombre = objet · point orange = sommet',
  },
  circle: {
    title: 'Mouvement circulaire',
    lead: 'Ajuste le rayon, ω₀ et α : l’objet tourne sur la trajectoire en temps réel.',
    hint: 'Point sombre = objet (rayon en pointillés)',
  },
  linear: {
    title: 'Mouvement rectiligne',
    lead: 'Ajuste x₀, v₀ et a : la position x(t) se recalcule et l’objet suit la courbe.',
    hint: 'Graphique x(t) · point sombre = objet',
  },
  ship: {
    title: 'Gravité artificielle',
    lead: 'Anneau centrifuge de 80 m : à 0,50 rad/s, ω²R ≈ 1 g. Oriente la caméra, fais tourner l’habitat, allume le moteur.',
    hint: 'Clic-glisser = orbite · molette = zoom',
  },
}

function format(n: number, digits = 2) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function paramsKey(value: unknown) {
  return JSON.stringify(value)
}

export default function App() {
  const [motion, setMotion] = useState<MotionKind>('parabola')
  const [parabola, setParabola] = useState<ProjectileParams>(PARABOLA_DEFAULTS)
  const [circle, setCircle] = useState<CircularParams>(CIRCLE_DEFAULTS)
  const [linear, setLinear] = useState<RectilinearParams>(LINEAR_DEFAULTS)
  const [speed, setSpeed] = useState(1)
  const [shipOmega, setShipOmega] = useState(DEFAULT_OMEGA)
  const [shipThrust, setShipThrust] = useState(0)
  const [showShield, setShowShield] = useState(true)

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
    (t: number) => {
      const map = mapRef.current
      const el = objectRef.current
      if (!map || !el) return

      let px = 0
      let py = 0

      if (motion === 'parabola') {
        const p = parabolaRef.current
        const tf = Math.min(Math.max(t, 0), 3600)
        px = parabolaXAt(tf, p)
        py = Math.max(parabolaYAt(tf, p), 0)
      } else if (motion === 'circle') {
        const pos = circularPositionAt(t, circleRef.current)
        px = pos.x
        py = pos.y
        const line = radiusLineRef.current
        if (line) {
          const mapped = map(px, py)
          line.setAttribute('x2', String(mapped.sx))
          line.setAttribute('y2', String(mapped.sy))
        }
      } else if (motion === 'linear') {
        px = t
        py = rectXAt(t, linearRef.current)
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
      const t = Math.min(playback.time, parabolaStats.flightTime)
      return {
        x: parabolaXAt(t, parabola),
        y: Math.max(parabolaYAt(t, parabola), 0),
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

  const meta = MOTION_META[motion]
  const positionLabel =
    motion === 'linear'
      ? format(objectPos.y, 1)
      : `(${format(objectPos.x, 1)} ; ${format(objectPos.y, 1)})`

  return (
    <div className="app">
      <div className="app__bg" aria-hidden />

      <header className="hero">
        <p className="hero__brand">Graphiques Physique</p>
        <h1 className="hero__title">{meta.title}</h1>
        <p className="hero__lead">{meta.lead}</p>

        <nav className="motion-nav" aria-label="Type de mouvement">
          {(
            [
              ['parabola', 'Parabolique'],
              ['circle', 'Circulaire'],
              ['linear', 'Rectiligne'],
              ['ship', 'Vaisseau'],
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
        <aside className="panel">
          <h2 className="panel__title">Paramètres</h2>

          {motion === 'parabola' && (
            <>
              <ParamSlider
                id="vx0"
                label="Composante horizontale"
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
                label="Composante verticale"
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
                label="Hauteur initiale"
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
                label="Gravité"
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
                Réinitialiser
              </button>
              <div className="formulas">
                <h3 className="formulas__title">Équations</h3>
                <p className="formulas__eq">
                  <em>x</em>(t) = vx₀ · t
                </p>
                <p className="formulas__eq">
                  <em>y</em>(t) = Y₀ + vy₀ · t − ½ · g · t²
                </p>
                <p className="formulas__note">
                  avec vx₀ = V₀·cos(θ) et vy₀ = V₀·sin(θ)
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
                label="Rayon"
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
                label="Vitesse angulaire initiale"
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
                label="Accélération angulaire"
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
                label="Angle initial"
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
                label="Durée simulée"
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
                Réinitialiser
              </button>
              <div className="formulas">
                <h3 className="formulas__title">Équations</h3>
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
                label="Position initiale"
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
                label="Vitesse initiale"
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
                label="Accélération"
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
                label="Durée simulée"
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
                Réinitialiser
              </button>
              <div className="formulas">
                <h3 className="formulas__title">Équations</h3>
                <p className="formulas__eq">
                  <em>x</em>(t) = x₀ + v₀ · t + ½ · a · t²
                </p>
                <p className="formulas__eq">
                  <em>v</em>(t) = v₀ + a · t
                </p>
              </div>
            </>
          )}

          {motion === 'ship' && (
            <>
              <p className="formulas__note">
                DSTV-80 — station-vaisseau NTP à gravité artificielle. Les
                commandes 3D sont sur la vue.
              </p>

              <details className="tech-spec">
                <summary className="tech-spec__summary">
                  Description technique
                </summary>
                <p className="tech-spec__lead">
                  Vaisseau habité réutilisable : treillis central non tournant,
                  centrifugeuse haubanée de 80 m, propulsion nucléaire thermique
                  à hydrogène liquide.
                </p>
                <dl className="tech-spec__list">
                  <div>
                    <dt>Longueur hors-tout</dt>
                    <dd>120 m</dd>
                  </div>
                  <div>
                    <dt>Anneau centrifuge</dt>
                    <dd>Ø 80 m · R = 40 m · 8 modules</dd>
                  </div>
                  <div>
                    <dt>Régime nominal</dt>
                    <dd>0,50 rad/s · 4,77 RPM · 1,02 g</dd>
                  </div>
                  <div>
                    <dt>Masse IMLEO</dt>
                    <dd>380–420 t (160 t à vide + 200–240 t LH₂)</dd>
                  </div>
                  <div>
                    <dt>Équipage</dt>
                    <dd>8–12 · ~650 m³ pressurisés</dd>
                  </div>
                  <div>
                    <dt>Propulsion</dt>
                    <dd>NTP · 110 kN · Isp 900–925 s</dd>
                  </div>
                  <div>
                    <dt>Δv / transit Mars</dt>
                    <dd>7,8 km/s · 100–120 jours</dd>
                  </div>
                  <div>
                    <dt>Palier</dt>
                    <dd>Magnétique actif (AMB) · haubans Zylon / CF</dd>
                  </div>
                  <div>
                    <dt>Ascenseur 1 g ↔ 0 g</dt>
                    <dd>Nacelle sur 2 rails Zylon, module 0 → moyeu AMB</dd>
                  </div>
                  <div>
                    <dt>Radioprotection</dt>
                    <dd>Shadow shield W + LiH · umbra visualisable</dd>
                  </div>
                </dl>
              </details>

              <button
                type="button"
                className="reset"
                onClick={() => {
                  setShipOmega(DEFAULT_OMEGA)
                  setShipThrust(0)
                  setShowShield(true)
                }}
              >
                Réinitialiser
              </button>
              <div className="formulas">
                <h3 className="formulas__title">Équations</h3>
                <p className="formulas__eq">
                  <em>a</em>
                  <sub>c</sub> = ω² · R
                </p>
                <p className="formulas__eq">
                  <em>g</em>
                  <sub>eff</sub> = a<sub>c</sub> / g₀
                </p>
                <p className="formulas__eq">
                  <em>g</em>
                  <sub>cabine</sub> = (r / R) · 1,02 g
                </p>
                <p className="formulas__eq">RPM = ω · 60 / 2π</p>
                <p className="formulas__note">
                  R = {RING_RADIUS} m · g₀ = {G} m/s²
                </p>
                <p className="formulas__derived">
                  a<sub>c</sub> = {format(shipOmega * shipOmega * RING_RADIUS)}{' '}
                  m/s²
                  <span aria-hidden> · </span>
                  {format((shipOmega * shipOmega * RING_RADIUS) / G)} g
                </p>
              </div>
            </>
          )}
        </aside>

        <section className={`stage${motion === 'ship' ? ' stage--ship' : ''}`}>
          {motion !== 'ship' && (
            <div className="stage__head">
              <h2 className="stage__title">
                {motion === 'linear' ? 'Graphique x(t)' : 'Trajectoire'}
              </h2>
              <p className="stage__hint">{meta.hint}</p>
            </div>
          )}

          {motion === 'ship' && (
            <Suspense
              fallback={
                <div className="flex h-[min(78vh,740px)] min-h-[28rem] items-center justify-center rounded-[14px] bg-[#05070d] text-slate-300">
                  Chargement du vaisseau…
                </div>
              }
            >
              <ShipViewer
                omega={shipOmega}
                thrust={shipThrust}
                showShield={showShield}
                onOmegaChange={setShipOmega}
                onThrustChange={setShipThrust}
                onShowShieldChange={setShowShield}
              />
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
                <dt>Portée</dt>
                <dd>
                  {format(parabolaStats.range)} <span>m</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>Hauteur max</dt>
                <dd>
                  {format(parabolaStats.maxHeight)} <span>m</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>Temps de vol</dt>
                <dd>
                  {format(parabolaStats.flightTime)} <span>s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>Position</dt>
                <dd>
                  {positionLabel} <span>m</span>
                </dd>
              </div>
            </dl>
          )}

          {motion === 'circle' && (
            <dl className="stats">
              <div className="stats__item">
                <dt>ω finale</dt>
                <dd>
                  {format(circleStats.omegaFinal)} <span>rad/s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>Tours</dt>
                <dd>
                  {format(circleStats.revolutions)} <span>tr</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>Vitesse linéaire</dt>
                <dd>
                  {format(circleStats.linearSpeedFinal)} <span>m/s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>Position</dt>
                <dd>
                  {positionLabel} <span>m</span>
                </dd>
              </div>
            </dl>
          )}

          {motion === 'linear' && (
            <dl className="stats">
              <div className="stats__item">
                <dt>x finale</dt>
                <dd>
                  {format(linearStats.xFinal)} <span>m</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>v finale</dt>
                <dd>
                  {format(linearStats.vFinal)} <span>m/s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>Déplacement</dt>
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
                <dt>ω</dt>
                <dd>
                  {format(shipOmega)} <span>rad/s</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>Rotation</dt>
                <dd>
                  {format((shipOmega * 60) / (2 * Math.PI))} <span>RPM</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>a<sub>c</sub></dt>
                <dd>
                  {format(shipOmega * shipOmega * RING_RADIUS)}{' '}
                  <span>m/s²</span>
                </dd>
              </div>
              <div className="stats__item">
                <dt>g<sub>eff</sub></dt>
                <dd>
                  {format((shipOmega * shipOmega * RING_RADIUS) / G)}{' '}
                  <span>g</span>
                </dd>
              </div>
            </dl>
          )}
        </section>
      </main>
    </div>
  )
}
