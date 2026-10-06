import { getErrorReport } from "./errorAnalytics.js";

/**
 * A pre-filled GitHub issue that the reader reviews and submits themself: nothing
 * leaves the device unless they send it. It carries the app version, the route,
 * the interface language and the last local error entries, which errorAnalytics
 * already scrubs of URLs, credentials and e-mail addresses.
 *
 * @param {{ repositoryUrl: string, version: string, lang: string }} meta
 * @param {{ route?: string, entries?: Array }} [overrides] for tests
 */
export function buildIssueDraft({ repositoryUrl, version, lang }, overrides = {}) {
  const repository = String(repositoryUrl || "").replace(/\/$/, "");
  const url = new URL(`${repository}/issues/new`);
  const route = overrides.route ?? (typeof window === "undefined" ? "" : window.location.pathname);
  const entries = (overrides.entries ?? getErrorReport())
    .slice(0, 3)
    .map((entry) => `- \`${entry.ts}\` ${entry.type}: ${entry.msg} (${entry.context})`);

  url.searchParams.set("title", `[Erreur] ${route || "MushafPlus"}`);
  url.searchParams.set(
    "body",
    [
      "## Ce qui s'est passé",
      "",
      "(décrivez ce que vous faisiez)",
      "",
      "## Informations techniques",
      "",
      `- Version : ${version}`,
      `- Page : ${route}`,
      `- Langue : ${lang}`,
      ...(entries.length ? ["", "Dernières erreurs locales :", ...entries] : []),
    ].join("\n"),
  );
  return url.toString();
}
