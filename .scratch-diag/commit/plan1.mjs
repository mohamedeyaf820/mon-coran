// Scratch commit plan. Not for commit.
export default {
  files: [
    {
      path: "src/styles/mushaf-book.css",
      pairs: [
        [
          ".mfp-audio-track small { margin-top: 0.15rem; opacity: 0.62; font-size: 0.6rem; }",
          ".mfp-audio-track small { margin-top: 0.15rem; opacity: 0.62; font-size: max(0.66rem, 10px); }",
        ],
      ],
    },
    {
      path: "src/styles/mushaf-page-polish.css",
      pairs: [
        [
          "    font-size: clamp(0.65rem, 2.5vw, 0.75rem) !important;",
          "    font-size: clamp(max(0.66rem, 10px), 2.5vw, 0.75rem) !important;",
        ],
      ],
    },
    {
      path: "src/styles/audio-player-simple.css",
      pairs: [
        [
          "    font-size: .56rem !important;",
          "    font-size: max(.62rem, 10px) !important;",
        ],
      ],
    },
    {
      path: "src/styles/experience-polish.css",
      pairs: [
        [
          `html body .app-root[data-view="home"] .reciter-card__favorite {
  width: 2.55rem !important;
  min-width: 2.55rem !important;
  min-height: 2.55rem !important;
}

html body .app-root[data-view="home"] .reciter-card__listen {
  min-height: 2.55rem !important;`,
          `html body .app-root[data-view="home"] .reciter-card__favorite {
  /* Plancher 44 px partout : la racine est à 15 px, un rem « ~2.6rem » ne fait
     que 36-40 px et plusieurs fichiers se disputent ces boutons. */
  width: max(2.55rem, 44px) !important;
  min-width: max(2.55rem, 44px) !important;
  min-height: max(2.55rem, 44px) !important;
}

html body .app-root[data-view="home"] .reciter-card__listen {
  min-width: max(2.55rem, 44px) !important;
  min-height: max(2.55rem, 44px) !important;`,
        ],
        [
          "  font-size: clamp(0.65rem, 1.6vw, 0.72rem) !important;",
          "  font-size: clamp(max(0.66rem, 10px), 1.6vw, 0.72rem) !important;",
        ],
        [
          `  html body .app-root[data-view="home"] .reciter-card__actions :is(button, a) {
    width: 2.4rem !important;
    min-width: 2.4rem !important;
    min-height: 2.4rem !important;`,
          `  html body .app-root[data-view="home"] .reciter-card__actions :is(button, a) {
    width: max(2.4rem, 44px) !important;
    min-width: max(2.4rem, 44px) !important;
    min-height: max(2.4rem, 44px) !important;`,
        ],
      ],
    },
  ],
};
