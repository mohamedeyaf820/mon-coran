export function Button({ className = "", variant = "primary", ...props }) {
  return (
    <button
      className={`modern-button modern-button--${variant} ${className}`.trim()}
      type="button"
      {...props}
    />
  );
}
