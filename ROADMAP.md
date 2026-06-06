# Roadmap Mushaf Plus

Date: 2026-06-05

## Etat actuel

- Phase 0: terminee et validee sur CI.
- Phase 1: en cours. Les tailles de police, le skeleton sans blur, la largeur liste/mushaf et le prechargement de police ont ete renforces.
- Phase 2: en cours. Le drag desktop du lecteur audio est stabilise; les libelles audio communs sont centralises dans `audioPlayerLabels`; le formatage du temps audio est extrait et teste; la liste des recitateurs dans les options audio est nettoyee. Le decoupage complet du composant reste a faire.
- Phase 3: en cours. Les premiers nettoyages de textes et surfaces communes sont faits, mais le design system complet reste a consolider.
- Phase 4: en cours. Header, footer et barre audio de lecture ont ete nettoyes cote libelles, hierarchie et accessibilite.
- Phase 5 a 7: planifiees, non terminees.

## Phase 0 - Stabilisation immediate

Objectif: garder `main` vert, corriger les bugs reels et reduire les risques de regression.

- Corriger le clamp URL des ayahs par sourate.
- Ajouter des tests de securite pour le sanitizer SVG.
- Retirer les domaines CSP inutilises ou risqués.
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
- Ajouter des tests E2E ciblés sur refresh lecture, changement riwaya et navigation URL.

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

## Phase 7 - Fonctionnalites futures

Objectif: ajouter de la valeur sans fragiliser le coeur.

- Gestion offline visible des telechargements.
- Export notes/favoris.
- Parcours de memorisation plus structures.
- Index thematique.
- Synchronisation cloud optionnelle avec consentement explicite.
