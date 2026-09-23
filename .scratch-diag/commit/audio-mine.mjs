// Scratch commit helper. Not for commit.
// audio-player-simple.css: restore MY 44px/motion lines inside the four hunks
// that the foreign theme-token migration and the error-state blocks share,
// keeping HEAD's colours and leaving the foreign rules out.
import { readFileSync, writeFileSync } from "node:fs";
const f = ".scratch-diag/commit/apply/src/styles/audio-player-simple.css";
let s = readFileSync(f, "utf8");

const pairs = [
  [
    `.app-root .audio-player-simple .simple-player__play:hover {
  background: color-mix(in srgb, var(--theme-primary) 88%, #fff 12%) !important;
  color: #fff !important;
}`,
    `@media (hover: hover) and (pointer: fine) {
  .app-root .audio-player-simple .simple-player__play:hover {
    background: color-mix(in srgb, var(--theme-primary) 88%, #fff 12%) !important;
    color: #fff !important;
  }
}

.app-root .audio-player-simple .simple-player__play:active {
  transform: scale(0.95);
}`,
  ],
  [
    `  width: 2.45rem !important;
  height: 2.45rem !important;
  min-width: 2.45rem !important;
  min-height: 2.45rem !important;`,
    `  /* max() garde 44 px même avec la racine à 15 px du projet. */
  width: max(2.75rem, 44px) !important;
  height: max(2.75rem, 44px) !important;
  min-width: max(2.75rem, 44px) !important;
  min-height: max(2.75rem, 44px) !important;`,
  ],
  [
    `.app-root .audio-player-simple .simple-player__play--compact:hover {
  transform: scale(1.06) !important;
  box-shadow: 0 6px 16px rgba(13, 92, 74, 0.42) !important;
}`,
    `@media (hover: hover) and (pointer: fine) {
  .app-root .audio-player-simple .simple-player__play--compact:hover {
    transform: scale(1.06) !important;
    box-shadow: 0 6px 16px rgba(13, 92, 74, 0.42) !important;
  }
}

.app-root .audio-player-simple .simple-player__play--compact:active {
  transform: scale(0.94) !important;
}`,
  ],
  [
    `  width: 2.1rem !important;
  height: 2.1rem !important;
  min-width: 2.1rem !important;
  min-height: 2.1rem !important;`,
    `  width: max(2.75rem, 44px) !important;
  height: max(2.75rem, 44px) !important;
  min-width: max(2.75rem, 44px) !important;
  min-height: max(2.75rem, 44px) !important;`,
  ],
  [
    `  transition: all 160ms ease !important;
}

.app-root .audio-player-simple .simple-player__expand-btn:hover {
  background: color-mix(in srgb, var(--primary) 15%, transparent) !important;
  color: var(--primary) !important;
  border-color: color-mix(in srgb, var(--primary) 30%, transparent) !important;
}`,
    `  /* Propriétés explicites : « all » animait aussi la taille et déclenchait
     layout/paint à chaque changement d'état. */
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease !important;
}

@media (hover: hover) and (pointer: fine) {
  .app-root .audio-player-simple .simple-player__expand-btn:hover {
    background: color-mix(in srgb, var(--primary) 15%, transparent) !important;
    color: var(--primary) !important;
    border-color: color-mix(in srgb, var(--primary) 30%, transparent) !important;
  }
}

.app-root .audio-player-simple .simple-player__expand-btn:active {
  transform: scale(0.94) !important;
}`,
  ],
];

for (const [i, [old, neu]] of pairs.entries()) {
  const c = s.split(old).length - 1;
  if (c !== 1) {
    console.error(`REJECT pair #${i + 1}: ${c} occurrences`);
    process.exit(1);
  }
  s = s.replace(old, () => neu);
}
writeFileSync(f, s, "utf8");
console.log("5 mixed blocks restored");
