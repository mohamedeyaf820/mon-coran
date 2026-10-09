/** Sub-pages of /duas, as stored in AppContext `duasRoute` and mirrored in the URL. */

export const DUAS_ROUTES = {
  hub: "",
  hisn: "/hisn",
  quran: "/coran",
  rabbana: "/rabbana",
  khatm: "/khatm",
};

export function hisnChapterRoute(id) {
  return `/hisn/${id}`;
}

/** "" -> hub, "/hisn" -> chapter list, "/hisn/27" -> one chapter, "/coran", "/rabbana", "/khatm" -> the Quranic collections. */
export function parseDuasRoute(duasRoute = "") {
  const route = String(duasRoute || "");
  if (route === DUAS_ROUTES.quran) return { view: "quran" };
  if (route === DUAS_ROUTES.rabbana) return { view: "rabbana" };
  if (route === DUAS_ROUTES.khatm) return { view: "khatm" };
  if (route === DUAS_ROUTES.hisn) return { view: "hisn" };
  const chapter = route.match(/^\/hisn\/(\d{1,4})$/);
  if (chapter) return { view: "chapter", chapterId: Number(chapter[1]) };
  return { view: "hub" };
}

/** Public address of a sub-page; real links, so a new tab or a copied address works. */
export function duasHref(route = "") {
  return `/duas${route}`;
}
