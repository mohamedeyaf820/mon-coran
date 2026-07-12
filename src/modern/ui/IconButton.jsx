export function IconButton({ label, className = "", ...props }) {
  if (!label) throw new Error("IconButton requires a label");
  return (
    <button
      aria-label={label}
      className={`modern-icon-button ${className}`.trim()}
      title={label}
      type="button"
      {...props}
    />
  );
}
