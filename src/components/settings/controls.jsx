// Form rows shared by the settings panels. Kept free of SettingsModal code so
// late-loaded sections (prayer settings) reuse them without pulling the whole
// modal bundle.

export function Section({ title, children }) {
  return (
    <section className="settings-section">
      <h3 className="settings-section__title">{title}</h3>
      <div className="settings-section__body">{children}</div>
    </section>
  );
}

export function SwitchRow({ checked, description, id, label, onChange }) {
  return (
    <label className="settings-control-row" htmlFor={id}>
      <span className="settings-control-row__copy">
        <span className="settings-control-row__label">{label}</span>
        {description ? (
          <span className="settings-control-row__description">{description}</span>
        ) : null}
      </span>
      <span className="settings-switch" aria-hidden="true" data-state={checked ? "checked" : "unchecked"}>
        <span />
      </span>
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="settings-visually-hidden"
      />
    </label>
  );
}

export function SliderRow({ id, label, max, min, onChange, step = 1, suffix = "", value }) {
  return (
    <div className="settings-slider-row">
      <div className="settings-slider-row__head">
        <label htmlFor={id}>{label}</label>
        <span>{value}{suffix}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function Segmented({ ariaLabel, options, value, onChange }) {
  return (
    <div className="settings-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          type="button"
          key={option.id}
          className="settings-segmented__item"
          data-active={value === option.id}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
