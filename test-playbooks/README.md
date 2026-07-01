# Playbooks de test - mon-coran
> Surfaces : [WEB] [BE] Â· Statut : â¬œ Â· Build : develop @ â€” Â· Teste : â€”

Ces playbooks couvrent les parcours critiques de l'application sans chercher a multiplier les tests fragiles. Ils sont concus pour etre executes par un agent navigateur ou manuellement, puis renseignes dans les champs `Observe`, `Verdict` et `Issue`.

## Convention

**Verdicts**

| Symbole | Sens |
|---------|------|
| â¬œ | Non teste |
| âœ… | OK |
| ðŸŸ¡ | Partiel - fonctionne mais defaut UX/mineur |
| âŒ | KO - bug bloquant |
| â­ï¸ | Non applicable / hors perimetre |

**Surfaces**

| Tag | Surface | Verification principale |
|-----|---------|-------------------------|
| `[WEB]` | Application dans le navigateur | Playwright / Chrome, DOM, console, reseau, screenshot |
| `[BE]` | Scripts, build, donnees, securite | terminal, `npm ci`, `npm run build`, tests node |
| `[PWA]` | Service worker / offline / update | navigateur + DevTools reseau/cache |

## Ordre de campagne recommande

1. `00-gates-techniques.md` - sante du depot, install, build, budgets, tests securite.
2. `01-demarrage-navigation.md` - chargement, navigation, langues, themes, responsive.
3. `02-lecture-coran.md` - lecture, modes, Hafs/Warsh, traduction, tajwid.
4. `03-recherche.md` - recherche, resultats, clavier, navigation vers verset.
5. `04-audio-recitations.md` - recitateurs, lecture audio, MiniPlayer, fallback.
6. `05-etude-memorisation.md` - memorisation, word-by-word, quiz/outils.
7. `06-preferences-persistance.md` - localStorage, favoris, historique, reload.
8. `07-pwa-offline-securite.md` - PWA, offline, CSP, stockage sensible.
9. `08-accessibilite-responsive.md` - clavier, focus, RTL, mobile/tablette/desktop.

## Regle de preuve

- Toute surface visible doit produire au moins un screenshot dans `.test-shots/`.
- Tout scenario KO doit indiquer l'issue creee ou la raison de non-creation.
- Les champs `Action` et `Attendu` decrivent la spec : ne pas les modifier pendant l'execution.
