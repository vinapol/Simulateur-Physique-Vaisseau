type ParamSliderProps = {
  id: string
  label: string
  symbol: string
  value: number
  /** Bornes du curseur */
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
  /** Bornes du champ numérique (plus larges que le curseur) */
  inputMin?: number
  inputMax?: number
}

export function ParamSlider({
  id,
  label,
  symbol,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  inputMin,
  inputMax,
}: ParamSliderProps) {
  const hardMin = inputMin ?? min
  const hardMax = inputMax ?? max
  const sliderValue = Math.min(max, Math.max(min, value))

  return (
    <div className="param">
      <div className="param__head">
        <label htmlFor={id} className="param__label">
          <span className="param__symbol">{symbol}</span>
          {label}
        </label>
        <div className="param__value">
          <input
            id={`${id}-num`}
            type="number"
            className="param__input"
            value={Number.isFinite(value) ? value : 0}
            min={hardMin}
            max={hardMax}
            step={step}
            onChange={(e) => {
              const next = Number(e.target.value)
              if (!Number.isNaN(next)) {
                onChange(Math.min(hardMax, Math.max(hardMin, next)))
              }
            }}
          />
          <span className="param__unit">{unit}</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        className="param__range"
        value={sliderValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {(value < min || value > max) && (
        <p className="param__hint">
          Valeur hors curseur — utilise le champ numérique
        </p>
      )}
    </div>
  )
}
