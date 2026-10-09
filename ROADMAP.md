# Roadmap Mushaf Plus

Date: 2026-07-17

## Etat actuel

- Phase 0: terminee et validee sur CI.
- Phase 1: terminee. Lecture, chargement, typographie et stabilite de navigation sont couverts par les tests E2E.
- Phase 2: terminee pour le perimetre de reparation. Le player, ses panneaux, son drag, ses libelles et ses fallbacks sont stabilises et testes.
- Phase 3: terminee. Le design system est documente, les surfaces sont harmonisees et l'architecture CSS est protegee par un budget CI.
- Phase 4: terminee. Accueil, navbar, footer, densite responsive, accessibilite et budgets de performance sont valides.
- Phase 5: terminee. Les 54 profils recitateurs sont normalises et valides; les sources audio, cartes, portraits, attributions et biographies progressives sont controles sur mobile et desktop.
- Phase 6: terminee. Le mode protege, la rotation chiffree, le verrouillage avant initialisation, les sanitizers et les headers de deploiement sont documentes et testes.
- Phase 7: terminee. La bibliotheque personnelle differee couvre offline,
  exports, memorisation, index thematique et passerelle cloud manuelle consentie.
- Phase 8: terminee. Les pages de recitation, le demarrage audio et les
  changements rapides de versets sont acceleres et proteges contre les
  chargements obsoletes.

## Phase 0 - Stabilisation immediate

Objectif: garder `main` vert, corriger les bugs reels et reduire les risques de regression.

- Corriger le clamp URL des ayahs par sourate.
- Ajouter des tests de securite pour le sanitizer SVG.
- Retirer les domaines CSP inutilises ou risques.
- Synchroniser `scripts/cspPolicy.mjs`, `netlify.toml` et `vercel.json`.
- Maintenir `npm audit --audit-level=moderate` a zero apres la migration Vite 8.
- Garder `npm run build:ci`, `npm run test:security` et `npm run perf:budget` verts.

## Phase 1 - Lecture et performance percue

Objectif: rendre les pages de lecture rapides, stables et lisibles.

- Stabiliser les tailles de police au refresh avec tokens typographiques par riwaya.
- Precharger la police active avant de lever les etats de chargement.
- Nettoyer l'overlay de chargement mushaf/liste pour qu'il ne reste jamais apres refresh.
- Renforcer la largeur responsive du bloc de texte arabe.
- Reinitialiser clairement les etats d'ayah active lors des changements sourate/page/juz.
- Ajouter des tests E2E cibles sur refresh lecture, changement riwaya et navigation URL.

## Phase 2 - Audio player modulaire

Objectif: conserver toutes les fonctions audio mais rendre le composant maintenable.

- Extraire `useAudioPlayerState`.
- Extraire `useAudioPlayerDrag` avec position persistante et limites viewport.
- Extraire `PlayerHeader`, `PlayerControls`, `PlayerProgress`, `PlayerPanels`.
- Fixer les dimensions compactes/etendues pour eviter les variations de taille.
- Traduire tous les labels audio en FR/EN/AR.
- Tester failover recitateur, erreurs reseau, fermeture panels et drag mobile/desktop.

## Phase 3 - Design system

Objectif: harmoniser toute l'interface.

- Definir tokens: couleurs, radius, ombres, surfaces, texte arabe, texte latin.
- Unifier boutons, cartes, modales, panneaux et etats actifs.
- Nettoyer les duplications CSS et reduire `!important`.
- Consolider les fichiers CSS par domaine.
- Ajouter un guide court de composants dans la documentation interne.

## Phase 4 - Accueil, navbar, footer

Objectif: rendre la premiere impression plus premium et plus claire.

- Recomposer le hero autour de la reprise de lecture et du verset du jour.
- Clarifier les cartes rapides: lecture, recitation, favoris, notes, signets, stats.
- Ameliorer la navbar responsive: priorites visibles, actions secondaires dans menu.
- Moderniser le footer avec navigation utile, sources, accessibilite et raccourcis.
- Verifier tous les libelles FR/EN/AR.

## Phase 5 - Recitations et biographies

Objectif: rendre les recitateurs mieux presentes sans casser l'audio.

- Normaliser la structure de donnees des recitateurs.
- Verifier les URLs audio avant affichage.
- Ajouter images avec fallback local et attribution si necessaire.
- Creer des cartes recitateur responsives.
- Ajouter pages ou panneaux biographies progressifs.

## Phase 6 - Securite avancee et donnees privees

Objectif: clarifier la protection reelle des donnees utilisateur.

- Ajouter un mode optionnel protege par phrase secrete utilisateur.
- Documenter les limites du chiffrement local.
- Ajouter tests contre HTML/SVG dangereux.
- Centraliser la generation CSP deployable.
- Verifier les headers sur Netlify/Vercel apres chaque changement.

Statut: terminee. Validation finale: 38 tests securite, 54 tests E2E,
`npm audit --audit-level=moderate`, `npm run audit:headers` et
`npm run build:ci` au vert.

## Phase 7 - Fonctionnalites futures

Objectif: ajouter de la valeur sans fragiliser le coeur.

- Gestion offline visible des telechargements.
- Export notes/favoris.
- Parcours de memorisation plus structures.
- Index thematique.
- Synchronisation cloud optionnelle avec consentement explicite.

Statut: terminee. La passerelle cloud reste volontairement manuelle et sans
compte impose: export/partage JSON avec consentement, puis restauration par
selection explicite du fichier. Validation finale: 43 tests unitaires/securite,
60 tests E2E, `npm audit --audit-level=moderate`, `npm run
audit:screen-budget` et `npm run build:ci` au vert.

## Phase 8 - Recitations et transitions rapides

Objectif: reduire le temps d'attente percu avant une recitation et rendre les
changements de versets immediats, meme lors de clics successifs rapides.

- Precharger le panneau recitateur des l'intention utilisateur et afficher un
  squelette utile pendant le chargement du module.
- Construire les playlists audio Hafs et Warsh localement, sans attendre le
  chargement du texte coranique.
- Reduire les radios par sourate a une entree canonique par sourate au lieu de
  preparer inutilement tous les versets.
- Annuler les chargements audio devenus obsoletes et indexer les versets de la
  playlist pour un acces direct.
- Eviter la double ecriture de l'ayah courante et isoler les abonnements des
  actions de verset afin de limiter les rerendus.
- Prioriser le prechargement de la sourate, page ou juz adjacent et reporter
  les donnees de riwaya secondaire.
- Charger moins de lignes lors de la premiere ouverture de la bibliotheque de
  recitations.

Statut: terminee. Validation finale: 46 tests unitaires/securite, 14 scenarios
E2E cibles recitation, audio, lecture et changements rapides, et `npm run
build:ci` au vert.
