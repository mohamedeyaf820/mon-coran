// Static facts of the welcome page: asset locations, the five themes of the mobile app
// and the three web themes the page rotates through. No copy here (see landingCopy.js).

export const SHOTS = "/images/landing/";
export const CLIPS = "/videos/landing/";

// The five themes of the mobile app, in the order of its picker. `fresh` marks the two
// newest ones; only three of them exist on the web (see WEB_TINTS).
export const TINTS = {
  fajr: { fresh: false },
  parchemin: { fresh: false },
  rose: { fresh: true },
  medine: { fresh: false },
  ocean: { fresh: true },
};

// Images the page keeps for offline once the browser is idle (the lazy ones included).
export const WARM_IMAGES = [
  ...Object.keys(TINTS).map((id) => `${SHOTS}mob-home-${id}.webp`),
  `${SHOTS}mob-radio.webp`,
  `${SHOTS}mob-player.webp`,
  `${SHOTS}mob-themes-picker-a.webp`,
  `${SHOTS}mob-themes-picker-b.webp`,
  ...["mob-reader-scroll", "mob-duas-scroll", "mob-listen-player", "mob-themes"].map((name) => `${CLIPS}${name}.jpg`),
];

export const WEB_TINTS = ["fajr", "parchemin", "medine"];
const BY_WEB_THEME = { light: "fajr", sepia: "parchemin", dark: "medine" };

/** The page starts in the colours the reader already chose in the app. */
export const tintForTheme = (theme) => BY_WEB_THEME[theme] || "fajr";

/** The three web tints, starting with `base`; the hero walks through them while it scrolls away. */
export function tintSequence(base) {
  const start = Math.max(WEB_TINTS.indexOf(base), 0);
  return WEB_TINTS.map((_, step) => WEB_TINTS[(start + step) % WEB_TINTS.length]);
}

// The three entries of the demo: a recording of the mobile app each.
export const ENTRIES = [
  { id: "read", clip: "mob-reader-scroll" },
  { id: "duas", clip: "mob-duas-scroll" },
  { id: "listen", clip: "mob-listen-player" },
];

// Only an https address on a store host can become a store button (no credentials, no
// port); an empty field keeps the honest "coming soon" state. Nothing here invents a URL.
const STORE_HOSTS = new Set(["play.google.com", "apps.apple.com"]);
export function storeUrl(value) {
  try {
    const url = new URL(value);
    const ok = url.protocol === "https:" && STORE_HOSTS.has(url.hostname) && !url.username && !url.password && !url.port;
    return ok && value.startsWith("https://") ? value : "";
  } catch {
    return "";
  }
}
