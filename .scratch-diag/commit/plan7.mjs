// Scratch commit plan — not for commit. Batch 7: measured clipping fixes.
export default {
  files: [
    {
      path: "src/styles/app-system.css",
      pairs: [
        [
          `.app-root[data-view="home"] .home-today-verse__translation {
  grid-column: 1;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-style: italic;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}`,
          `.app-root[data-view="home"] .home-today-verse__translation {
  grid-column: 1;
  /* A whole sentence in one \`nowrap\` line: measured 274px of box for 356px of
     text at 1024px, i.e. 82px of the verse silently gone. Let it wrap and
     clamp instead, so what is cut reads as a clamp and not a severed word. */
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-style: italic;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  white-space: normal;
}`,
        ],
        [
          `  /* The verse reference sits in an \`auto\` track, so on a phone it claims half
     the card and leaves the translation ~100px for a whole sentence: measured
     229px of clipped text at 280px. Stack the card and let the sentence wrap.
     The footer's verse card makes the same downgrade at 480px. */
  .app-root[data-view="home"] .home-today-verse {
    grid-template-columns: minmax(0, 1fr);
  }

  .app-root[data-view="home"] .home-today-verse__reference {
    grid-column: 1;
    align-self: start;
  }

  .app-root[data-view="home"] .home-today-verse__translation {
    white-space: normal;
  }
}`,
          `  /* The verse reference sits in an \`auto\` track, so on a phone it claims half
     the card and leaves the translation ~100px for a whole sentence: measured
     229px of clipped text at 280px. Stack the card; the sentence already wraps
     from the base rule. */
  .app-root[data-view="home"] .home-today-verse {
    grid-template-columns: minmax(0, 1fr);
  }

  .app-root[data-view="home"] .home-today-verse__reference {
    grid-column: 1;
    align-self: start;
  }
}`,
        ],
      ],
    },
    {
      path: "src/styles/domains/reading-platform.css",
      pairs: [
        [
          `    .quran-display--platform .reader-mode-nav__button span {
        max-width: 24vw;
    }
}`,
          `    /* The nav is prev | current | next on one row: at 280-414px each label had
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
        ],
      ],
    },
    {
      path: "src/styles/settings-enhanced.css",
      pairs: [
        [
          `.settings-segmented {
  grid-template-columns: repeat(auto-fit, minmax(4rem, 1fr)) !important;
  padding: 0.2rem;`,
          `.settings-segmented {
  /* 4rem tracks fitted three language names on a 280px screen and cut 9px off
     "Français"; the minimum now carries the longest label instead. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 5.5rem), 1fr)) !important;
  padding: 0.2rem;`,
        ],
      ],
    },
  ],
};
