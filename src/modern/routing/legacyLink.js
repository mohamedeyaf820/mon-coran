export function buildLegacyHref(pathname = "/", search = "") {
  const safePath = typeof pathname === "string" ? pathname : "/";
  const safeSearch = typeof search === "string" ? search : "";
  if (safePath === "/legacy" || safePath.startsWith("/legacy/")) {
    return `${safePath}${safeSearch}`;
  }
  const suffix = safePath === "/" ? "" : safePath;
  return `/legacy${suffix}${safeSearch}`;
}
