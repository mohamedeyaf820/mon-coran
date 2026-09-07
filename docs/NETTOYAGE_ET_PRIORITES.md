# Nettoyage et priorités

Examen local du 7 septembre 2026, après clonage de `main` à la révision
`b93d8ed`. Les modifications restent locales, sans commit ni publication.

## Nettoyage effectué

- Suppression de 26 fichiers suivis (3 640 205 octets) : captures temporaires
  `tmp-*`, `audit-*.png`, `debug-*.png`, `iphone-mode-*.png`, journaux `tmp-*`,
  configuration et télémétrie locales `.vercel-cli-data`, deux scripts ponctuels
  `debug-tajweed2.mjs` et `debug-tajweed3.mjs`, et `cleanup-scrollbars.ps1`
  qui ciblait un ancien chemin absolu sur le disque D:.
- Aucune référence aux fichiers supprimés trouvée dans les sources textuelles
  examinées. Les captures liées au README, données coraniques, polices, tests,
  scripts d'audit réutilisables et documents de référence sont conservés.
- Ajout d'exclusions Git pour empêcher le retour des artefacts temporaires.
- Utilisation de `npm ci` dans les quatre jobs de tests GitHub Actions pour
  installer les versions du fichier de verrouillage.

Les fichiers supprimés restent récupérables dans l'historique Git. Cette
opération allège les fichiers de travail, sans réécrire l'historique du dépôt.

## Vérifications locales

- Installation : `npm ci --no-audit --no-fund` réussie.
- `npm run lint` : réussi.
- `npm run test:security` : 161 tests réussis, aucun échec.
- `npm run build:ci` : compilation, purge CSS et génération SEO réussies
  (120 URLs indexables), puis échec du budget de `src/services/audioService.js`
  (45,7 Kio pour une limite de 45 Kio).
- `node scripts/check-bundle-budget.mjs` : réussi.
- `node scripts/check-security-headers.mjs` : réussi.
- `node scripts/audit-css-architecture.mjs --check` : échec des budgets CSS
  source (1821,3 Kio / 1760) et conservé (1257,6 Kio / 1230).
- La compilation émet 22 avertissements sur `::highlight(...)`.
- La sonde réseau des métadonnées API échoue (`fetch failed`) ; les deux
  sondes CDN audio répondent HTTP 200. La cause réseau reste à déterminer.
- Aucun test navigateur ni audit des vulnérabilités des dépendances effectué.

Les dépassements concernent des sources laissées intactes par ce nettoyage.

## Prochaines améliorations proposées

1. Extraire une responsabilité cohérente de `audioService.js`, puis vérifier
   les parcours audio et les changements de sourate pour restaurer le budget CI.
2. Réduire progressivement les couches CSS, en commençant par `tailwind.css`,
   `domains/reading-platform.css` et `home-audio-ux-refonte.css`. Le CSS livré
   atteint 1039,8 Kio et les sources contiennent 6937 déclarations `!important`.
   Les sélecteurs déclarés supprimables par l'audit sont des candidats à
   examiner, pas une autorisation de suppression automatique : certaines
   classes sont construites dynamiquement. Valider les thèmes, RTL et modes
   de lecture dans le navigateur à chaque étape.
3. Examiner les avertissements du compilateur sur le surlignage tajwid et
   reproduire l'échec réseau des métadonnées avant toute modification.
4. Actualiser la documentation : le README annonce un rapport de couverture
   HTML alors que la commande utilise le rapport natif Node ; les budgets
   documentés dans `src/styles/README.md` diffèrent des scripts actuels.
   Regrouper ensuite les anciens audits dans une archive avec leurs liens
   mis à jour, après avoir distingué les références encore actives.
