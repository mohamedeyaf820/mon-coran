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

// Only an https address can become a store button; an empty field keeps the
// honest "coming soon" state.
export const storeUrl = (value) =>
  typeof value === "string" && /^https:\/\/[^\s/]+/.test(value) ? value : "";
