# Plan Awwwards + Apple — MushafPlus

Statut : vivant. Créé le 2026-10-07. Phase 0 en cours.

## Cadre

- **Awwwards** juge un site en ligne : Design 40 %, Usabilité 30 %, Créativité 20 %, Contenu 10 %. Une PWA peut le viser telle quelle.
- **Apple Design Awards** ne concerne que des apps de l'App Store. Une PWA seule ne peut pas être candidate. Décision ouverte : option A (rester PWA) ou option B (coque native).
- **Invariants** (`AGENTS.md`) : le texte coranique reste la priorité visuelle ; aucune animation ne touche au texte, au Hafs/Warsh ni à la position de lecture ; FR/EN/AR, RTL natif, hors-ligne et cibles de 44 px préservés.

## Phase 0 — Fonder (semaine 1)

| Livrable | État |
|---|---|
| Trois concepts visuels comparables : [`docs/awards/concepts.html`](awards/concepts.html) (A Enluminure, B Lumière du jour, C Page vivante) | Fait, à choisir |
| Choix du concept (une phrase + un écran validé) | **Décision utilisateur** |
| Section motion et tokens dans `docs/DESIGN_SYSTEM.md` | À faire après le choix |
| Police de titre latine unique, auto-hébergée, sous-ensemble (~15 Ko) | À faire après le choix |
| Baseline mesurée | Fait, ci-dessous |

### Baseline (2026-10-07, build de `886227e`, copie isolée)

Profil : mobile 390×844, CPU ×4, réseau 1,6 Mb/s + 150 ms de latence, cache froid, service worker bloqué, médiane de 3 exécutions. L'API Quran.com est appelée en direct, donc les écarts de quelques centaines de ms entre deux séries sont du bruit.

| Route | FCP | LCP | CLS | TBT (tâches longues − 50 ms) |
|---|---|---|---|---|
| `/` | 2,8 s | 4,0 s | 0,001 | 1,9 s |
| `/surah/36` | 2,9 s | 4,4 s | 0,002 | 2,5 s |
| `/surah/2` | 2,7 s | 4,2 s | 0,002 | 1,2 s |

Lecture : la stabilité de mise en page est excellente (CLS ≈ 0). Le point faible est le thread principal (TBT 1,2 à 2,5 s) et le LCP autour de 4 s sous ce profil dégradé. Le temps d'apparition du premier verset n'est pas fiable ici (le sélecteur utilisé correspond trop tôt) ; la mesure déterministe reste `.claude/skills/app-full-review/scripts/reader-ab.mjs`.

**Cibles révisées** (l'objectif « LCP < 1,2 s » du premier plan est irréaliste sous ce profil) : LCP ≤ 2,5 s, TBT ≤ 600 ms, CLS ≤ 0,05, INP ≤ 200 ms, mesurés avec le même profil avant et après chaque phase.

Point d'attention : `dist/` du dépôt peut être périmé par rapport à `HEAD`. Construire avant toute mesure ou E2E (voir notes de travail).

## Phase 1 — Le moment signature (semaines 2-3)

1. Ouverture de sourate : cadre qui se dessine, titre, basmala. Sert d'état de chargement honnête et se termine quand le texte est prêt.
2. Accueil repensé autour de la reprise de lecture et du verset du jour.
3. View Transitions API (accueil → lecteur, sourate → sourate, mini-player → plein écran), avec repli sans animation.
4. Scroll-driven animations CSS pour l'en-tête de sourate et la progression.
5. Retour haptique sur les moments clés.

Vérification : desktop large + mobile compact, FR et AR (RTL), Hafs et Warsh, `prefers-reduced-motion`, E2E `reading` et `responsive`.

## Phase 2 — Usabilité (semaine 4)

- Parcours critique en 3 gestes : ouvrir, reprendre exactement où l'on s'était arrêté, lancer l'audio.
- Wake Lock pendant la lecture ; badge d'app pour la série du jour.
- États vides, erreurs et hors-ligne traités comme le chemin heureux.
- `forced-colors` et `prefers-contrast` complets.
- Test à 200 % de zoom et police arabe très grande, ajouté à `responsive-density`.
- Tests manuels VoiceOver et TalkBack, documentés.

## Phase 3 — Contenu (semaine 5)

- Relecture éditoriale Tafsir, tajwid, récitateurs (ton, longueur, sources).
- Page « Comment c'est fait » (Hafs/Warsh, sources, hors-ligne, vie privée).
- Page publique `/design` (tokens, motion, ornements, accessibilité).
- Étude de cas : texte, 3 captures, chiffres avant/après.

## Phase 4 — Dette protectrice (semaine 5, en parallèle)

- Consolider les 30+ couches CSS en fichiers par domaine, chaque étape prouvée visuellement sans effet (outillage de preuve existant).
- Lighthouse CI avec les cibles révisées ci-dessus.
- `npm run build:ci` vert à chaque étape.

## Phase 5 — Soumission et choix Apple (semaine 6)

- Awwwards : site en production, captures, vidéo de 30 s, étude de cas, soumission Site of the Day.
- Apple, option A : rester PWA (pas d'ADA, pas de widgets). Option B : coque Capacitor ou Swift (widget « verset du jour », Live Activity audio, App Store) pour 3 à 4 semaines de plus et une maintenance double.

## Porte de sortie de chaque phase

`npm.cmd run lint`, `audit:screen-budget`, `test:security`, `test:e2e:smoke`, `test:e2e:responsive`, `test:e2e:reading`, `build:ci`, plus mesure avant/après avec le profil de baseline.

## Risques

| Risque | Parade |
|---|---|
| Animations qui dégradent l'INP ou le TBT | Budget par effet, `perf-diagnostic-debug` (manuel, API réelle), désactivation sur appareils lents |
| Effet qui réduit le contraste du texte arabe | Interdit par `DESIGN_SYSTEM.md`, axe sur tous les thèmes |
| Concept trop chargé | Porte de validation en phase 0 ; retirer ce qu'un jury ne « lit » pas en 10 s |
| Refactor CSS qui casse un thème | Preuve sans effet visuel avant chaque fusion |

## Décisions ouvertes

1. Concept visuel : A, B, C ou une combinaison.
2. Apple : option A ou B.
3. Date cible de soumission.
