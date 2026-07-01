# Playbooks de test - mon-coran
> Surfaces : [WEB] [BE] · Statut : ⬜ · Build : develop @ — · Testé : —

Ces playbooks couvrent les parcours critiques de l'application sans chercher à multiplier les tests fragiles. Ils sont conçus pour être exécutés par un agent navigateur ou manuellement, puis renseignés dans les champs `Observe`, `Verdict` et `Issue`.

## Convention

**Verdicts**

| Symbole | Sens |
|---------|------|
| ⬜ | Non testé |
| ✅ | OK |
| 🟡 | Partiel — fonctionne mais défaut UX/mineur |
| ❌ | KO — bug bloquant |
| ⭕ | Non applicable / hors périmètre |

**Surfaces**

| Tag | Surface | Vérification principale |
|-----|---------|-------------------------|
| `[WEB]` | Application dans le navigateur | Playwright / Chrome, DOM, console, réseau, screenshot |
| `[BE]` | Scripts, build, données, sécurité | terminal, `npm ci`, `npm run build`, tests Node |
| `[PWA]` | Service worker / offline / update | navigateur + DevTools réseau/cache |

## Ordre de campagne recommandé

1. [`00-gates-techniques.md`](00-gates-techniques.md) — santé du dépôt, install, build, budgets, tests sécurité.
2. [`01-demarrage-navigation.md`](01-demarrage-navigation.md) — chargement, navigation, langues, thèmes, responsive.
3. [`02-lecture-coran.md`](02-lecture-coran.md) — lecture, modes, Hafs/Warsh, traduction, tajwid.
4. [`03-recherche.md`](03-recherche.md) — recherche, résultats, clavier, navigation vers verset.
5. [`04-audio-recitations.md`](04-audio-recitations.md) — récitateurs, lecture audio, MiniPlayer, fallback.
6. [`05-etude-memorisation.md`](05-etude-memorisation.md) — mémorisation, word-by-word, quiz/outils.
7. [`06-preferences-persistance.md`](06-preferences-persistance.md) — localStorage, favoris, historique, reload.
8. [`07-pwa-offline-securite.md`](07-pwa-offline-securite.md) — PWA, offline, CSP, stockage sensible.
9. [`08-accessibilite-responsive.md`](08-accessibilite-responsive.md) — clavier, focus, RTL, mobile/tablette/desktop.

## Règle de preuve

- Toute surface visible doit produire au moins un screenshot dans `.test-shots/`.
- Tout scénario KO doit indiquer l'issue créée ou la raison de non-création.
- Les champs `Action` et `Attendu` décrivent la spec : ne pas les modifier pendant l'exécution.
