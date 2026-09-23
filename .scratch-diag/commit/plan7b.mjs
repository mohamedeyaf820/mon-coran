// Scratch commit plan — not for commit. Batch 7b: follow-ups proven by the sweep.
export default {
  files: [
    {
      path: "src/styles/domains/reading-platform.css",
      pairs: [
        [
          `    .reader-typography-panel .afc-range {
        width: 100%;
    }

    /* The nav is prev | current | next on one row: at 280-414px each label had
       32-91px for "Sourate précédente", so it ellipsised mid-word. The chevron
       and the centre indicator already carry the meaning, and the button keeps
       its aria-label, so the text retires and the target becomes a 44px square. */
    .quran-display--platform .reader-mode-nav__button {
        min-width: max(2.75rem, 44px);
        padding-inline: 0.55rem;
    }

    .quran-display--platform .reader-mode-nav__button > span {
        display: none;
    }
}`,
          `    .reader-typography-panel .afc-range {
        width: 100%;
    }
}

/* The nav is prev | current | next on one row: measured 280-440px, each label
   had 32-97px for "Sourate précédente", so it ellipsised mid-word (67px lost at
   280px, 3px at 440px). The chevron and the centre indicator already carry the
   meaning, and the button keeps its aria-label, so the text retires across the
   whole band and the target becomes a 44px square. */
@media (max-width: 480px) {
    .quran-display--platform .reader-mode-nav__button {
        min-width: max(2.75rem, 44px);
        padding-inline: 0.55rem;
    }

    .quran-display--platform .reader-mode-nav__button > span {
        display: none;
    }
}`,
        ],
      ],
    },
    {
      path: "src/styles/settings-enhanced.css",
      pairs: [
        [
          `.settings-segmented {
  grid-template-columns: repeat(auto-fit, minmax(4rem, 1fr)) !important;
  padding: 0.2rem !important;`,
          `.settings-segmented {
  /* Same track floor as the rule above: this later duplicate is the one that
     wins the cascade, so both must carry the longest language label. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 5.5rem), 1fr)) !important;
  padding: 0.2rem !important;`,
        ],
      ],
    },
  ],
};
