export function resolveAppSurface(pathname) {
  if (typeof pathname !== "string") return "modern";
  return pathname === "/legacy" || pathname.startsWith("/legacy/")
    ? "legacy"
    : "modern";
}
