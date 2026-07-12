export function SkipLink({ href = "#modern-main", children }) {
  return (
    <a className="modern-skip-link" href={href}>
      {children}
    </a>
  );
}
