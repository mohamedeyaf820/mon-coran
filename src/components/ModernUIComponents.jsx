import React from "react";
/**
 * MODERN UI ENHANCEMENTS
 * Composants réutilisables pour interface moderne
 */

// ─────────────────────────────────────────────
// LoadingSkeleton — Placeholder animé pour le chargement
// ─────────────────────────────────────────────

export function LoadingSkeleton({
  width = "100%",
  height = "1rem",
  className = "",
}) {
  return (
    <div
      className={`skeleton animate-pulse rounded ${className}`}
      style={{
        width,
        height,
        background: "linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary, #e5e7eb) 50%, var(--bg-secondary) 75%)",
        backgroundSize: "200% 100%",
        animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      }}
    />
  );
}

// ─────────────────────────────────────────────
// BusyIndicator — Indicateur d'activité moderne
// ─────────────────────────────────────────────

export function BusyIndicator({ message = "Chargement...", size = "md" }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} spinner`} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────
// ToastNotification — Notification moderne
// ─────────────────────────────────────────────

export function Toast({ type = "info", message, onClose, autoClose = 5000 }) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const bgColor = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-orange-50 border-orange-200",
    info: "bg-blue-50 border-blue-200",
  }[type];

  const textColor = {
    success: "text-emerald-800",
    error: "text-red-800",
    warning: "text-orange-800",
    info: "text-blue-800",
  }[type];

  const borderColor = {
    success: "border-l-4 border-l-emerald-500",
    error: "border-l-4 border-l-red-500",
    warning: "border-l-4 border-l-orange-500",
    info: "border-l-4 border-l-blue-500",
  }[type];

  const icon = {
    success: { cls: "fa-circle-check", color: "text-emerald-500" },
    error: { cls: "fa-circle-xmark", color: "text-red-500" },
    warning: { cls: "fa-triangle-exclamation", color: "text-amber-500" },
    info: { cls: "fa-circle-info", color: "text-blue-500" },
  }[type];

  return (
    <div
      className={`toast-notification ${bgColor} ${borderColor} ${textColor} px-4 py-3 rounded-md flex items-center justify-between gap-2 animate-fadeInScale`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <i
            className={`fas ${icon.cls} ${icon.color} text-base shrink-0`}
            aria-hidden="true"
          />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-lg hover:opacity-70 transition-opacity shrink-0"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// ModernButton — Bouton avec ripple effect
// ─────────────────────────────────────────────

export function ModernButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  ...props
}) {
  const handleMouseDown = (e) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.className = "ripple";

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    glass: "bg-white/10 hover:bg-white/20 text-white backdrop-blur",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      onMouseDown={handleMouseDown}
      onClick={onClick}
      disabled={disabled}
      className={`
        modern-button
        ${variants[variant]}
        ${sizes[size]}
        rounded-md
        transition-all
        duration-200
        relative
        overflow-hidden
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// AnimatedValue — Animateur de valeur numérique
// ─────────────────────────────────────────────

export function AnimatedValue({ value, duration = 500, format = (v) => v }) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const startValue = React.useRef(displayValue);
  const startTime = React.useRef(null);

  React.useEffect(() => {
    if (Math.abs(value - displayValue) < 0.1) return;

    startValue.current = displayValue;
    startTime.current = null;

    const animate = (now) => {
      if (!startTime.current) startTime.current = now;

      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      const newValue =
        startValue.current + (value - startValue.current) * progress;
      setDisplayValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{format(displayValue)}</span>;
}
